"""Проверяет исходного варвара: AI, ярость, дочерние эффекты, урон и контуры."""
import json
import re
import uuid

from build import ROOT, ORIGINAL_SHA256, command, digest, find_java
from build_combat_oracle import COMBAT_AS3, append_class, instrument, verify_resources
from build_shoot_oracle import extract_method


ENEMY_EXTRA = r'''
      public function oracleBarbarianEffects() : Array {
         var effects:Array=[]; var index:int; var child:*;
         for(index=0;index<numChildren;index++) {
            child=getChildAt(index); if(child is effect) effects.push(child);
         }
         for(index=0;index<mc.numChildren;index++) {
            child=mc.getChildAt(index); if(child is ef_rampage_enemy) effects.push(child);
         }
         return effects;
      }
      public function oracleBarbarianFreeze() : void {
         removeEventListener(Event.ENTER_FRAME,onEnterFrame); mc.stop();
         var child:*; for each(child in oracleBarbarianEffects()) child.stop();
      }
      public function oracleBarbarianConfigure(config:Object) : void {
         if(config.x!=null) x=config.x;
         if(config.y!=null) y=config.y;
         if(config.attacking!=null) attacking=config.attacking;
         if(config.speed!=null) speed=config.speed;
         if(config.hp!=null) hp=config.hp;
         if(config.knockBack!=null) knockBack=config.knockBack;
         if(config.frame!=null) { mc.oraclePlaying=true; mc.gotoAndPlay(config.frame); }
         oracleBarbarianFreeze();
      }
      public function oracleBarbarianStep() : String {
         try {
            if(parent!=null) {
               var effects:Array=oracleBarbarianEffects(); var child:*;
               onEnterFrame(null);
               if(parent!=null && mc.oraclePlaying) mc.nextFrame();
               mc.stop();
               for each(child in effects) if(child.parent!=null) { child.nextFrame(); child.stop(); }
               oracleBarbarianFreeze();
            }
            return "";
         } catch(error:Error) { return error.message; }
      }
      public function oracleBarbarianRageFrame(frame:int) : void {
         var child:*;
         for each(child in oracleBarbarianEffects()) if(child is ef_rampage_enemy) child.gotoAndStop(frame);
      }
      public function oracleBarbarianState() : Object {
         var effects:Array=[]; var child:*; var rageFrame:int=0;
         for each(child in oracleBarbarianEffects()) {
            var kind:String=child is ef_rampage_enemy ? "rage" : "hit";
            if(kind=="rage") rageFrame=child.currentFrame;
            effects.push({kind:kind,frame:child.currentFrame,x:child.x,y:child.y,width:child.width,alpha:child.alpha});
         }
         return {x:x,y:y,hp:hp,speed:speed,speedOrg:speedOrg,attack:attack,gold:gold,exp:exp,
            rampage:rampage,rageEffectFrame:rageFrame,resKnock:resKnock,knockBack:knockBack,
            attacking:attacking,attacked:attacked,frame:mc.currentFrame,shadowHit:mc.shadowHit,
            deathTicks:deathAnimeDuration,width:mc.width,parentWidth:width,effects:effects,removed:parent==null};
      }
'''

BARBARIAN_EXTRA = r'''
      public var oraclePlaying:Boolean=true;
      public function oracleInitialize() : void { frame1(); oraclePlaying=true; stop(); }
'''

DRIVER = r'''
      private var oraclePhase:int=-1;
      private var oracleCombatActive:Boolean=false;
      private var oracleCombatState:uint=42;
      private var oracleCombatDraws:int=0;
      private var oracleCombatEvents:Array=[];
      private var oracleBarbarianSnapshots:int=0;
      private var oracleBarbarianPrefix:Array=[];
      private var oracleBarbarianPrefixIndex:int=0;
      public function oracleCombatRandom() : Number {
         if(!oracleCombatActive) return Math.random();
         var value:int=int(oracleCombatState); value^=value<<13; value^=value>>>17; value^=value<<5;
         oracleCombatState=uint(value); ++oracleCombatDraws;
         return oracleBarbarianPrefixIndex<oracleBarbarianPrefix.length ? oracleBarbarianPrefix[oracleBarbarianPrefixIndex++] : Number(oracleCombatState)/4294967296;
      }
      public function oracleCombatDamage(id:int,damage:int,crit:int,before:int,x:int,y:int) : void {
         oracleCombatEvents.push({damage:damage,critical:crit,before:before,x:x,y:y});
      }
      private function oracleBattleReady() : void {
         if(oraclePhase!=2) return;
         oraclePhase=3; timer.stop(); removeEventListener(Event.ENTER_FRAME,onEnterFrame);
         removeEventListener(Event.ENTER_FRAME,oracleAdvance); if(amb!=null) amb.stop();
         oracleEmit({type:"ready",kind:"barbarian",rng:"xorshift32",clock:"original-AI-then-child-then-existing-effects",nativeScheduling:false});
         oracleRunBarbarian();
      }
      private function oracleBarbarianSetup(config:Object) : * {
         oracleBarbarianPrefix=[]; oracleBarbarianPrefixIndex=0;
         oracleCombatReset(config.seed); game.castleHP=40; game.castleMHP=40; mission.absorbFix=0;
         oracleCombatActive=true;
         var slot:int=spawnEnemy(7); var target:* =enemyArray[slot];
         target.mc.oracleInitialize(); target.oracleBarbarianConfigure(config);
         if(config.hitSeed!=null) { oracleCombatState=config.hitSeed; oracleCombatDraws=0; }
         if(config.randomPrefix!=null) oracleBarbarianPrefix=config.randomPrefix.concat();
         return target;
      }
      private function oracleBarbarianInputs(config:Object,index:int,target:*) : void {
         var hit:Object;
         if(config.hits!=null) for each(hit in config.hits) if(hit.step==index) {
            target.damage(hit.raw,hit.weapon ? weapon(_pc) : -1,int(target.x)+(hit.offsetX==null?0:hit.offsetX),int(target.y),_pc,hit.critical==null?0:hit.critical);
            target.oracleBarbarianFreeze();
         }
         if(config.knockAt!=null && config.knockAt==index) target.knockBack=config.knockAmount;
      }
      private function oracleBarbarianSnapshot(config:Object,index:int,target:*,error:String) : void {
         oracleEmit({type:"snapshot",kind:"barbarian",scenario:config.name,step:index,config:config,
            enemy:target.oracleBarbarianState(),castleHp:game.castleHP,drawCount:oracleCombatDraws,rngState:oracleCombatState,
            damageEvents:oracleCombatEvents.concat(),error:error});
         ++oracleBarbarianSnapshots;
      }
      private function oracleBarbarianCase(config:Object) : void {
         var target:* =oracleBarbarianSetup(config); oracleBarbarianInputs(config,0,target);
         oracleBarbarianSnapshot(config,0,target,"");
         var index:int;
         for(index=1;index<=config.steps;index++) {
            oracleBarbarianInputs(config,index,target);
            oracleBarbarianSnapshot(config,index,target,target.oracleBarbarianStep());
         }
         target.oracleBarbarianFreeze();
      }
      private function oracleBarbarianGrid(frame:int,rageFrame:int) : void {
         var target:* =oracleBarbarianSetup({seed:42,x:200,y:220,frame:frame});
         if(rageFrame>0) {
            oracleBarbarianPrefix=[0.9]; oracleBarbarianPrefixIndex=0;
            target.damage(1,-1,200,220,_pc,0); target.oracleBarbarianFreeze();
            target.oracleBarbarianRageFrame(rageFrame);
         }
         gamePaused=true;
         var body:String=""; var shadow:String=""; var x:int; var y:int;
         for(y=172;y<252;y++) for(x=160;x<240;x++) {
            body+=target.mc.hitTestPoint(x,y,true)?"1":"0";
            shadow+=target.mc.shadow.hitTestPoint(x,y,true)?"1":"0";
         }
         oracleEmit({type:"geometry",kind:"barbarian",requestedFrame:frame,frame:target.mc.currentFrame,rageEffectFrame:rageFrame,
            x:200,y:220,gridX:160,gridY:172,width:80,height:80,bits:body,shadowBits:shadow,shadowHit:target.mc.shadowHit});
      }
      public function oracleRunBarbarian() : Boolean {
         try {
            oracleBarbarianCase({name:"fresh_walk",seed:42,steps:50});
            oracleBarbarianCase({name:"normal_attack",seed:42,x:454,frame:3,steps:120});
            oracleBarbarianCase({name:"left_knockback",seed:42,x:-15,frame:3,knockBack:9,steps:14});
            oracleBarbarianCase({name:"rage_walk",seed:42,x:200,frame:3,randomPrefix:[0.9],hits:[{step:0,raw:1}],steps:80});
            oracleBarbarianCase({name:"rage_attack",seed:42,x:456,frame:44,attacking:true,speed:0,randomPrefix:[0.9],hits:[{step:0,raw:1}],steps:60});
            oracleBarbarianCase({name:"rage_left_knockback",seed:42,x:-15,frame:3,randomPrefix:[0.9],hits:[{step:0,raw:1}],knockAt:0,knockAmount:9,steps:16});
            oracleBarbarianCase({name:"rage_attack_knockback",seed:42,x:455,frame:44,attacking:true,speed:0,randomPrefix:[0.9],hits:[{step:0,raw:1}],knockAt:0,knockAmount:3,steps:28});
            oracleBarbarianCase({name:"rage_threshold_and_repeat",seed:42,x:200,frame:3,randomPrefix:[0.75,0.750001],hits:[{step:0,raw:1},{step:1,raw:1},{step:2,raw:1}],steps:16});
            oracleBarbarianCase({name:"weapon_hit_rage",seed:42,x:200,frame:3,randomPrefix:[0.9],hits:[{step:0,raw:1,weapon:true}],steps:16});
            oracleBarbarianCase({name:"rage_contact_left_clamp",seed:42,x:-25,frame:3,randomPrefix:[0.9],hits:[{step:0,raw:1,weapon:true,offsetX:10}],steps:16});
            oracleBarbarianCase({name:"critical_contact_left_clamp",seed:42,x:-25,frame:3,randomPrefix:[0.9],hits:[{step:0,raw:1,weapon:true,offsetX:10,critical:1}],steps:16});
            oracleBarbarianCase({name:"offset_hit_parent_bounds",syntheticWidthDiagnostic:true,seed:42,x:-60,frame:3,randomPrefix:[0.9],hits:[{step:0,raw:1,offsetX:60}],knockAt:0,knockAmount:9,steps:16});
            oracleBarbarianCase({name:"lethal_bypasses_rage",seed:42,x:200,frame:3,hits:[{step:0,raw:100}],steps:210});
            var frame:int; for each(frame in [1,3,22,26,38,45,53,84,119]) oracleBarbarianGrid(frame,0);
            for each(frame in [1,5,12]) oracleBarbarianGrid(3,frame);
            oracleCombatActive=false; gamePaused=true;
            oracleEmit({type:"complete",kind:"barbarian",ok:true,snapshots:oracleBarbarianSnapshots,geometryGrids:12}); return true;
         } catch(error:Error) {
            oracleCombatActive=false; gamePaused=true; oracleEmit({type:"error",kind:"barbarian",message:error.message}); return false;
         }
      }
'''


def main():
    out = ROOT / '.build/oracle'; out.mkdir(parents=True, exist_ok=True)
    report = {'status': 'failed', 'kind': 'barbarian', 'runtime_validated': False,
              'boundary': 'Original AI then body frame then existing transient effects; direct damage inputs and geometry are observed separately'}
    try:
        source_path = ROOT / 'original/elonashooter1.3.swf'; original = source_path.read_bytes()
        assert digest(original) == ORIGINAL_SHA256
        sources = {name: (ROOT / '.build/export/scripts' / f'{name}.as').read_text(encoding='utf-8-sig') for name in ['enemy', 'enemy_barb']}
        main_bytes = (ROOT / 'src/shootem_fla/MainTimeline.as').read_bytes()
        main_source, enemy, _, _ = instrument(main_bytes.decode('utf-8-sig'), sources['enemy'])
        main_source = main_source.replace(COMBAT_AS3, DRIVER + extract_method(COMBAT_AS3, 'oracleCombatReset'))
        enemy = re.sub(r'(?m)^(\s*)mc\.gotoAndPlay\(', r'\1if(id==_barb) mc.oraclePlaying=true;\n\1mc.gotoAndPlay(', enemy)
        enemy = append_class(enemy, ENEMY_EXTRA)
        barb = sources['enemy_barb'].replace('         stop();', '         oraclePlaying=false; stop();').replace('         gotoAndPlay(', '         oraclePlaying=true; gotoAndPlay(')
        barb = append_class(barb, BARBARIAN_EXTRA)
        replacements = []
        for name, body in [('shootem_fla.MainTimeline', main_source), ('enemy', enemy), ('enemy_barb', barb)]:
            path = out / (name.replace('.', '_') + '-barbarian.as'); path.write_text(body, encoding='utf-8'); replacements += [name, str(path)]
        candidate = out / ('barbarian-compiled-' + uuid.uuid4().hex + '.swf')
        result = command([find_java(None), '-Xmx1g', '-jar', str(ROOT / '.tools/ffdec/ffdec.jar'), '-replace', str(source_path), str(candidate), *replacements], timeout=240)
        (out / 'barbarian-build.log').write_text(result.stdout, encoding='utf-8')
        if result.returncode or not candidate.exists(): raise RuntimeError('FFDec Barbarian compilation failed')
        output = bytearray(candidate.read_bytes()); output[3] = 10; report.update(verify_resources(original, output))
        (out / 'barbarian-reference.swf').write_bytes(output)
        assert source_path.read_bytes() == original and (ROOT / 'src/shootem_fla/MainTimeline.as').read_bytes() == main_bytes
        report.update(status='passed', original_sha256=digest(original), output_sha256=digest(output), original_class_sources={name: digest(value.encode()) for name, value in sources.items()})
    except Exception as error:
        report['error'] = str(error)
    (out / 'barbarian-build-report.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, indent=2)); return 0 if report['status'] == 'passed' else 1


if __name__ == '__main__':
    raise SystemExit(main())
