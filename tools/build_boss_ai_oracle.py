"""Эталон исходного AI босса: щит, направление, кадры и защищённое попадание."""
import json
import re
import uuid

from build import ROOT, ORIGINAL_SHA256, command, digest, find_java
from build_combat_oracle import COMBAT_AS3, append_class, instrument, verify_resources
from build_shoot_oracle import extract_method


ENEMY_EXTRA = r'''
      public function oracleBossConfigure(config:Object) : void {
         removeEventListener(Event.ENTER_FRAME,onEnterFrame);
         if(config.x != null) x=config.x;
         if(config.y != null) y=config.y;
         if(config.action != null) boss.action=config.action;
         if(config.count != null) boss.count=config.count;
         if(config.idle != null) boss.idle=config.idle;
         if(config.fireNum != null) boss.fireNum=config.fireNum;
         if(config.weapon != null) { boss.weapon=config.weapon; boss.weaponRef=_root.getWeaponInfo(boss.weapon); }
         if(config.speed != null) speed=config.speed;
         if(config.facing != null) mc.scaleX=config.facing;
         mc.oracleInitialize();
         if(config.poseFrames != null) {
            var poseFrame:int;
            for each(poseFrame in config.poseFrames) { mc.oraclePlaying=true; mc.gotoAndPlay(poseFrame); }
         }
         if(config.frame != null) { mc.oraclePlaying=true; mc.gotoAndPlay(config.frame); }
      }
      public function oracleBossStep() : String {
         try { onEnterFrame(null); mc.oracleStep(); return ""; }
         catch(error:Error) { return error.message; }
      }
      public function oracleBossState() : Object {
         return {x:x,y:y,hp:hp,maxHp:boss.hpMax,speed:speed,speedOrg:speedOrg,attack:attack,gold:gold,exp:exp,
            action:boss.action,count:boss.count,idle:Number(boss.idle)||0,fireNum:Number(boss.fireNum)||0,
            weapon:boss.weapon,damage:boss.damage,facing:mc.scaleX,frame:mc.currentFrame,
            bodyFrame:mc.chara1.currentFrame,playing:mc.oraclePlaying,knockBack:knockBack};
      }
'''

ALLY_EXTRA = r'''
      public var oraclePlaying:Boolean=true;
      public function oracleInitialize() : void { frame1(); }
      public function oracleStep() : void { if(oraclePlaying) nextFrame(); }
'''

DRIVER = r'''
      private var oraclePhase:int=-1;
      private var oracleCombatActive:Boolean=false;
      private var oracleCombatState:uint=42;
      private var oracleCombatDraws:int=0;
      private var oracleCombatEvents:Array=[];
      private var oracleBossSnapshots:int=0;
      public function oracleCombatRandom() : Number {
         if(!oracleCombatActive) return Math.random();
         var value:int=int(oracleCombatState); value^=value<<13; value^=value>>>17; value^=value<<5;
         oracleCombatState=uint(value); ++oracleCombatDraws;
         return Number(oracleCombatState)/4294967296;
      }
      public function oracleCombatDamage(id:int,damage:int,crit:int,before:int,x:int,y:int) : void {
         if(oracleCombatActive) oracleCombatEvents.push({damage:damage,critical:crit,before:before,x:x,y:y});
      }
      private function oracleBattleReady() : void {
         if(oraclePhase!=2) return;
         oraclePhase=3; timer.stop(); removeEventListener(Event.ENTER_FRAME,onEnterFrame);
         removeEventListener(Event.ENTER_FRAME,oracleAdvance); if(amb!=null) amb.stop();
         oracleEmit({type:"ready",kind:"boss-ai",rng:"xorshift32",clock:"original-AI-then-explicit-child-frame",nativeScheduling:false});
         oracleRunBoss();
      }
      private function oracleBossSetup(config:Object) : * {
         oracleCombatReset(config.seed); root.x=0; root.y=0;
         game.day=config.level+1; mission.level=config.level;
         game.castleHP=40; game.castleMHP=40; mission.absorbFix=0;
         oracleCombatActive=true;
         var slot:int=spawnEnemy(999); var target:* = enemyArray[slot];
         target.oracleBossConfigure(config);
         if(config.stepSeed!=null) { oracleCombatState=config.stepSeed; oracleCombatDraws=0; }
         return target;
      }
      private function oracleBossSnapshot(config:Object,index:int,target:*,error:String) : void {
         oracleEmit({type:"snapshot",kind:"boss-ai",scenario:config.name,step:index,config:config,enemy:target.oracleBossState(),
            castleHp:game.castleHP,drawCount:oracleCombatDraws,rngState:oracleCombatState,error:error});
         ++oracleBossSnapshots;
      }
      private function oracleBossCase(config:Object) : void {
         var target:* = oracleBossSetup(config); oracleBossSnapshot(config,0,target,"");
         var index:int;
         for(index=1;index<=config.steps;index++) oracleBossSnapshot(config,index,target,target.oracleBossStep());
         target.mc.stop();
      }
      private function oracleBossHit(config:Object) : void {
         var target:* = oracleBossSetup(config); var before:Object=target.oracleBossState();
         var hit:Boolean=false; var shapeHit:Boolean=target.mc.hitTestPoint(200,210,true);
         if(config.mode=="pellet") hit=procHit(_pc,weapon(_pc),200,210,45);
         else { explode(_pc,-1,200,220,45,0); hit=target.hp<before.hp; }
         oracleEmit({type:"hit",kind:"boss-ai",scenario:config.name,config:config,before:before,after:target.oracleBossState(),
            hit:hit,shapeHit:shapeHit,damageEvents:oracleCombatEvents.concat(),castleHp:game.castleHP,
            drawCount:oracleCombatDraws,rngState:oracleCombatState});
         target.mc.stop();
      }
      public function oracleRunBoss() : Boolean {
         try {
            oracleBossCase({name:"forward_walk",seed:42,level:3,x:200,action:3,count:100,frame:24,steps:26});
            oracleBossCase({name:"backward_walk",seed:42,level:3,x:200,action:4,count:100,frame:24,steps:26});
            oracleBossCase({name:"shield_entry_exit",seed:42,stepSeed:1,level:3,x:250,action:2,count:1,frame:200,facing:1,speed:-1.25,steps:125});
            oracleBossCase({name:"shield_hold",seed:42,level:3,x:300,action:6,count:500,frame:221,facing:1,speed:1.25,steps:22});
            oracleBossCase({name:"below_shield_level",seed:42,stepSeed:1,level:2,x:250,action:2,count:1,frame:200,facing:1,steps:20});
            oracleBossCase({name:"weapon_one",seed:42,level:3,x:250,action:1,idle:0,fireNum:1,weapon:1,frame:24,steps:22});
            oracleBossCase({name:"weapon_two",seed:42,level:3,x:250,action:1,idle:0,fireNum:5,weapon:2,frame:24,steps:32});
            oracleBossCase({name:"idle_animation",seed:42,level:3,x:250,action:1,idle:20,fireNum:1,weapon:1,frame:10,steps:20});
            oracleBossHit({name:"pellet_guard",seed:42,stepSeed:42,level:3,x:200,y:220,action:6,count:100,poseFrames:[221,227],frame:236,mode:"pellet"});
            oracleBossHit({name:"pellet_open",seed:42,stepSeed:42,level:3,x:200,y:220,action:1,count:100,frame:24,mode:"pellet"});
            oracleBossHit({name:"explosion_guard",seed:42,stepSeed:42,level:3,x:200,y:220,action:6,count:100,poseFrames:[221,227],frame:236,mode:"explosion"});
            oracleBossHit({name:"explosion_open",seed:42,stepSeed:42,level:3,x:200,y:220,action:1,count:100,frame:24,mode:"explosion"});
            oracleCombatActive=false; gamePaused=true;
            oracleEmit({type:"complete",kind:"boss-ai",ok:true,snapshots:oracleBossSnapshots,hitCases:4}); return true;
         } catch(error:Error) {
            oracleCombatActive=false; gamePaused=true; oracleEmit({type:"error",kind:"boss-ai",message:error.message}); return false;
         }
      }
'''


def main():
    out=ROOT/'.build/oracle'; out.mkdir(parents=True,exist_ok=True)
    report={'status':'failed','kind':'boss-ai','runtime_validated':False,
            'boundary':'Original boss AI then explicit child frame; source play/stop calls are observed, native scheduling is not asserted'}
    try:
        path=ROOT/'original/elonashooter1.3.swf'; original=path.read_bytes()
        assert digest(original)==ORIGINAL_SHA256
        sources={name:(ROOT/'.build/export/scripts'/f'{name}.as').read_text(encoding='utf-8-sig') for name in ['enemy','ally1']}
        main_bytes=(ROOT/'src/shootem_fla/MainTimeline.as').read_bytes()
        main_source,enemy,_,_=instrument(main_bytes.decode('utf-8-sig'),sources['enemy'])
        main_source=main_source.replace(COMBAT_AS3,DRIVER+extract_method(COMBAT_AS3,'oracleCombatReset'))
        # Наблюдатели фиксируют исходные play/stop, не копируя в драйвер список конечных кадров.
        enemy_original=enemy
        enemy=enemy.replace('mc.gotoAndPlay(', 'mc.oraclePlaying = true; mc.gotoAndPlay(')
        assert enemy.replace('mc.oraclePlaying = true; ', '')==enemy_original
        ally=sources['ally1']
        ally=re.sub(r'(?<!\.)\bstop\(\);', 'oraclePlaying = false; stop();', ally)
        ally=re.sub(r'(?<!\.)\bgotoAndPlay\(', 'oraclePlaying = true; gotoAndPlay(', ally)
        assert ally.replace('oraclePlaying = false; ', '').replace('oraclePlaying = true; ', '')==sources['ally1']
        enemy=append_class(enemy,ENEMY_EXTRA); ally=append_class(ally,ALLY_EXTRA)
        replacements=[]
        for name,body in [('shootem_fla.MainTimeline',main_source),('enemy',enemy),('ally1',ally)]:
            target=out/(name.replace('.','_')+'-boss-ai.as'); target.write_text(body,encoding='utf-8')
            replacements += [name,str(target)]
        candidate=out/('boss-ai-compiled-'+uuid.uuid4().hex+'.swf')
        result=command([find_java(None),'-Xmx1g','-jar',str(ROOT/'.tools/ffdec/ffdec.jar'),'-replace',str(path),str(candidate),*replacements],timeout=240)
        (out/'boss-ai-build.log').write_text(result.stdout,encoding='utf-8')
        if result.returncode or not candidate.exists(): raise RuntimeError('FFDec boss AI compilation failed')
        output=bytearray(candidate.read_bytes()); output[3]=10
        report.update(verify_resources(original,output)); (out/'boss-ai-reference.swf').write_bytes(output)
        assert path.read_bytes()==original
        assert (ROOT/'src/shootem_fla/MainTimeline.as').read_bytes()==main_bytes
        report.update(status='passed',original_sha256=digest(original),output_sha256=digest(output),
                      original_class_sources={name:digest(source.encode()) for name,source in sources.items()})
    except Exception as error:
        report['error']=str(error)
    (out/'boss-ai-build-report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(report,indent=2)); return 0 if report['status']=='passed' else 1


if __name__=='__main__':
    raise SystemExit(main())
