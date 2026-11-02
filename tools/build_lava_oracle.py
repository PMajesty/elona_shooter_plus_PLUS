"""Наблюдает исходный Lava: движение, предупреждение, взрыв, смерть и заполненные контуры."""
import json
import re
import uuid

from build import ROOT, ORIGINAL_SHA256, command, digest, find_java
from build_combat_oracle import COMBAT_AS3, append_class, instrument, verify_resources
from build_shoot_oracle import extract_method


ENEMY_EXTRA = r'''
      public function oracleLavaEffects() : Array {
         var effects:Array=[]; var index:int; var child:*;
         for(index=0;index<numChildren;index++) {
            child=getChildAt(index); if(child is effect) effects.push(child);
         }
         return effects;
      }
      public function oracleLavaFreeze() : void {
         removeEventListener(Event.ENTER_FRAME,onEnterFrame); mc.stop();
         var child:*; for each(child in oracleLavaEffects()) child.stop();
      }
      public function oracleLavaConfigure(config:Object) : void {
         if(config.x!=null) x=config.x;
         if(config.y!=null) y=config.y;
         if(config.attacking!=null) attacking=config.attacking;
         if(config.speed!=null) speed=config.speed;
         if(config.hp!=null) hp=config.hp;
         if(config.knockBack!=null) knockBack=config.knockBack;
         if(config.frame!=null) { mc.oraclePlaying=true; mc.gotoAndPlay(config.frame); }
         oracleLavaFreeze();
      }
      public function oracleLavaStep() : String {
         try {
            if(parent!=null) {
               var effects:Array=oracleLavaEffects(); var child:*;
               onEnterFrame(null);
               if(parent!=null && mc.oraclePlaying) mc.nextFrame();
               mc.stop();
               for each(child in effects) if(child.parent!=null) { child.nextFrame(); child.stop(); }
               oracleLavaFreeze();
            }
            return "";
         } catch(error:Error) { return error.message; }
      }
      public function oracleLavaState() : Object {
         var effects:Array=[]; var child:*;
         for each(child in oracleLavaEffects()) effects.push({frame:child.currentFrame,x:child.x,y:child.y,width:child.width,alpha:child.alpha});
         return {x:x,y:y,hp:hp,speed:speed,speedOrg:speedOrg,attack:attack,gold:gold,exp:exp,
            resKnock:resKnock,knockBack:knockBack,alerted:alerted,onMark:onMark,
            attacking:attacking,attacked:attacked,frame:mc.currentFrame,shadowHit:mc.shadowHit,
            deathTicks:deathAnimeDuration,width:mc.width,parentWidth:width,effects:effects,removed:parent==null};
      }
'''

LAVA_EXTRA = r'''
      public var oraclePlaying:Boolean=true;
      public function oracleInitialize() : void { frame1(); oraclePlaying=true; stop(); }
'''

DRIVER = r'''
      private var oraclePhase:int=-1;
      private var oracleCombatActive:Boolean=false;
      private var oracleCombatState:uint=42;
      private var oracleCombatDraws:int=0;
      private var oracleCombatEvents:Array=[];
      private var oracleLavaSnapshots:int=0;
      private var oracleLavaAlerts:int=0;
      public function oracleCombatRandom() : Number {
         if(!oracleCombatActive) return Math.random();
         var value:int=int(oracleCombatState); value^=value<<13; value^=value>>>17; value^=value<<5;
         oracleCombatState=uint(value); ++oracleCombatDraws;
         return Number(oracleCombatState)/4294967296;
      }
      public function oracleCombatDamage(id:int,damage:int,crit:int,before:int,x:int,y:int) : void {
         oracleCombatEvents.push({damage:damage,critical:crit,before:before,x:x,y:y});
      }
      private function oracleBattleReady() : void {
         if(oraclePhase!=2) return;
         oraclePhase=3; timer.stop(); removeEventListener(Event.ENTER_FRAME,onEnterFrame);
         removeEventListener(Event.ENTER_FRAME,oracleAdvance); if(amb!=null) amb.stop();
         oracleEmit({type:"ready",kind:"lava",rng:"xorshift32",clock:"original-AI-then-child-then-existing-effects",nativeScheduling:false});
         oracleRunLava();
      }
      private function oracleLavaSetup(config:Object) : * {
         oracleCombatReset(config.seed); game.castleHP=40; game.castleMHP=40; mission.absorbFix=0;
         nextAlert=undefined; fireAtWill=false; oracleLavaAlerts=0;
         var index:int;
         for(index=0;index<maxAlly;index++) { player.onMark[index]=false; player.target[index]=undefined; }
         oracleCombatActive=true;
         var slot:int=spawnEnemy(4); var target:* =enemyArray[slot];
         target.mc.oracleInitialize(); target.oracleLavaConfigure(config);
         return target;
      }
      private function oracleLavaInputs(config:Object,index:int,target:*) : void {
         var hit:Object;
         if(config.hits!=null) for each(hit in config.hits) if(hit.step==index) {
            target.damage(hit.raw,hit.weapon ? weapon(_pc) : -1,int(target.x)+(hit.offsetX==null?0:hit.offsetX),int(target.y),_pc,hit.critical==null?0:hit.critical);
            target.oracleLavaFreeze();
         }
         if(config.knockAt!=null && config.knockAt==index) target.knockBack=config.knockAmount;
      }
      private function oracleLavaSnapshot(config:Object,index:int,target:*,error:String) : void {
         oracleEmit({type:"snapshot",kind:"lava",scenario:config.name,step:index,config:config,
            enemy:target.oracleLavaState(),castleHp:game.castleHP,drawCount:oracleCombatDraws,rngState:oracleCombatState,
            alertCalls:oracleLavaAlerts,nextAlertIsTarget:nextAlert===target,
            damageEvents:oracleCombatEvents.concat(),error:error});
         ++oracleLavaSnapshots;
      }
      private function oracleLavaCase(config:Object) : void {
         var target:* =oracleLavaSetup(config); oracleLavaInputs(config,0,target);
         oracleLavaSnapshot(config,0,target,"");
         var index:int;
         for(index=1;index<=config.steps;index++) {
            oracleLavaInputs(config,index,target);
            oracleLavaSnapshot(config,index,target,target.oracleLavaStep());
         }
         target.oracleLavaFreeze();
      }
      private function oracleLavaGrid(frame:int,afterAttack:Boolean,fractional:Boolean=false) : void {
         var target:* =oracleLavaSetup({seed:42,x:fractional?200.375:200,y:fractional?220.625:220});
         gamePaused=true;
         if(afterAttack) target.mc.gotoAndStop(23);
         target.mc.gotoAndStop(frame);
         var body:String=""; var shadow:String=""; var x:int; var y:int;
         for(y=180;y<260;y++) for(x=160;x<240;x++) {
            body+=target.mc.hitTestPoint(x,y,true)?"1":"0";
            shadow+=target.mc.shadow.hitTestPoint(x,y,true)?"1":"0";
         }
         oracleEmit({type:"geometry",kind:"lava",requestedFrame:frame,frame:target.mc.currentFrame,afterAttack:afterAttack,
            fractional:fractional,x:target.x,y:target.y,gridX:160,gridY:180,width:80,height:80,
            bits:body,shadowBits:shadow,shadowHit:target.mc.shadowHit});
      }
      public function oracleRunLava() : Boolean {
         try {
            oracleLavaCase({name:"fresh_walk",seed:42,steps:45});
            oracleLavaCase({name:"alert_crossing",seed:42,x:154,frame:4,steps:4});
            oracleLavaCase({name:"alert_fallback",seed:42,x:434,frame:4,steps:4});
            oracleLavaCase({name:"attack_timeline",seed:42,x:454,frame:4,steps:40});
            oracleLavaCase({name:"left_knockback",seed:42,x:-20,frame:4,knockBack:9,steps:16});
            oracleLavaCase({name:"weapon_left_clamp",seed:42,x:-30,frame:4,hits:[{step:0,raw:1,weapon:true,offsetX:10,critical:1}],steps:16});
            oracleLavaCase({name:"knockback_before_attack",seed:42,x:454,frame:4,knockBack:5,steps:12});
            oracleLavaCase({name:"knockback_after_attack",seed:42,x:454,frame:4,knockAt:2,knockAmount:9,steps:40});
            oracleLavaCase({name:"weapon_during_attack",seed:42,x:454,frame:4,hits:[{step:2,raw:1,weapon:true}],steps:40});
            oracleLavaCase({name:"lethal_walking",seed:42,x:200,frame:4,hits:[{step:0,raw:100}],steps:210});
            oracleLavaCase({name:"lethal_before_explosion",seed:42,x:454,frame:4,hits:[{step:11,raw:100}],steps:221});
            var frame:int;
            for each(frame in [1,4,15,23,34,35,50,98,128]) oracleLavaGrid(frame,frame>=23&&frame<98);
            oracleLavaGrid(98,true); oracleLavaGrid(128,true); oracleLavaGrid(4,false,true);
            oracleCombatActive=false; gamePaused=true;
            oracleEmit({type:"complete",kind:"lava",ok:true,snapshots:oracleLavaSnapshots,geometryGrids:12}); return true;
         } catch(error:Error) {
            oracleCombatActive=false; gamePaused=true; oracleEmit({type:"error",kind:"lava",message:error.message}); return false;
         }
      }
'''


def main():
    out = ROOT / '.build/oracle'; out.mkdir(parents=True, exist_ok=True)
    report = {'status': 'failed', 'kind': 'lava', 'runtime_validated': False,
              'boundary': 'Original AI, then child frame, then existing parent effects; real alert with no eligible companion, damage and hitTestPoint retained'}
    try:
        source_path = ROOT / 'original/elonashooter1.3.swf'; original = source_path.read_bytes()
        assert digest(original) == ORIGINAL_SHA256
        sources = {name: (ROOT / '.build/export/scripts' / f'{name}.as').read_text(encoding='utf-8-sig') for name in ['enemy', 'enemy_lava']}
        main_bytes = (ROOT / 'src/shootem_fla/MainTimeline.as').read_bytes()
        main_source, enemy, _, _ = instrument(main_bytes.decode('utf-8-sig').replace('\r\n', '\n'), sources['enemy'])
        main_source = main_source.replace(COMBAT_AS3, DRIVER + extract_method(COMBAT_AS3, 'oracleCombatReset'))
        alert_marker = '      public function alert(param1:*) : *\n      {'
        assert main_source.count(alert_marker) == 1
        main_source = main_source.replace(alert_marker, alert_marker + '\n         if(oracleCombatActive) ++oracleLavaAlerts;')
        enemy = re.sub(r'(?m)^(\s*)mc\.gotoAndPlay\(', r'\1if(id==_lava) mc.oraclePlaying=true;\n\1mc.gotoAndPlay(', enemy)
        enemy = append_class(enemy, ENEMY_EXTRA)
        lava = sources['enemy_lava'].replace('         stop();', '         oraclePlaying=false; stop();').replace('         gotoAndPlay(', '         oraclePlaying=true; gotoAndPlay(')
        lava = append_class(lava, LAVA_EXTRA)
        replacements = []
        for name, body in [('shootem_fla.MainTimeline', main_source), ('enemy', enemy), ('enemy_lava', lava)]:
            path = out / (name.replace('.', '_') + '-lava.as'); path.write_text(body, encoding='utf-8'); replacements += [name, str(path)]
        candidate = out / ('lava-compiled-' + uuid.uuid4().hex + '.swf')
        result = command([find_java(None), '-Xmx1g', '-jar', str(ROOT / '.tools/ffdec/ffdec.jar'), '-replace', str(source_path), str(candidate), *replacements], timeout=240)
        (out / 'lava-build.log').write_text(result.stdout, encoding='utf-8')
        if result.returncode or not candidate.exists(): raise RuntimeError('FFDec Lava compilation failed')
        output = bytearray(candidate.read_bytes()); output[3] = 10; report.update(verify_resources(original, output))
        (out / 'lava-reference.swf').write_bytes(output)
        assert source_path.read_bytes() == original and (ROOT / 'src/shootem_fla/MainTimeline.as').read_bytes() == main_bytes
        report.update(status='passed', original_sha256=digest(original), output_sha256=digest(output), original_class_sources={name: digest(value.encode()) for name, value in sources.items()})
    except Exception as error:
        report['error'] = str(error)
    (out / 'lava-build-report.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, indent=2)); return 0 if report['status'] == 'passed' else 1


if __name__ == '__main__':
    raise SystemExit(main())
