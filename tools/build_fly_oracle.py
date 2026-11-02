"""Эталон мухи: движение, контуры, повторное использование и явное исправление истории."""
import json
import re
import uuid

from build import ROOT, ORIGINAL_SHA256, command, digest, find_java
from build_combat_oracle import COMBAT_AS3, append_class, instrument, verify_resources
from build_shoot_oracle import extract_method

ENEMY_EXTRA = r'''
      public function oracleFlyFreeze() : void { removeEventListener(Event.ENTER_FRAME,onEnterFrame); mc.stop(); }
      public function oracleFlyResetHistory() : void { dirCounter=0; resKnock=1; }
      public function oracleFlyConfigure(config:Object) : void {
         if(config.x != null) x=config.x;
         if(config.y != null) y=config.y;
         if(config.frame != null) { mc.oraclePlaying=true; mc.gotoAndPlay(config.frame); }
         if(config.counter != null) dirCounter=config.counter;
         if(config.knockBack != null) knockBack=config.knockBack;
         if(config.hp != null) hp=config.hp;
         mc.stop();
      }
      public function oracleFlyStep() : String {
         try {
            if(parent!=null) {
               onEnterFrame(null);
               if(parent!=null && mc.oraclePlaying) mc.nextFrame();
               mc.stop();
            }
            return "";
         } catch(error:Error) { return error.message; }
      }
      public function oracleFlyState() : Object {
         return {x:x,y:y,hp:hp,speed:speed,speedOrg:speedOrg,attack:attack,gold:gold,exp:exp,
            counter:dirCounter,resKnock:resKnock,knockBack:knockBack,attacking:attacking,attacked:attacked,
            frame:mc.currentFrame,shadowHit:mc.shadowHit,deathTicks:deathAnimeDuration,width:mc.width,
            removed:parent==null};
      }
'''

FLY_EXTRA = r'''
      public var oraclePlaying:Boolean=true;
      public function oracleInitialize() : void { frame1(); oraclePlaying=true; stop(); }
'''

DRIVER = r'''
      private var oraclePhase:int=-1;
      private var oracleCombatActive:Boolean=false;
      private var oracleCombatState:uint=42;
      private var oracleCombatDraws:int=0;
      private var oracleCombatEvents:Array=[];
      private var oracleFlySnapshots:int=0;
      private var oracleFlyPrime:Boolean=false;
      private var oracleFlyPrior:Object=null;
      public function oracleCombatRandom() : Number {
         if(!oracleCombatActive) return Math.random();
         var value:int=int(oracleCombatState); value^=value<<13; value^=value>>>17; value^=value<<5;
         oracleCombatState=uint(value); ++oracleCombatDraws;
         return oracleFlyPrime ? 0.5 : Number(oracleCombatState)/4294967296;
      }
      public function oracleCombatDamage(id:int,damage:int,crit:int,before:int,x:int,y:int) : void {}
      private function oracleBattleReady() : void {
         if(oraclePhase!=2) return;
         oraclePhase=3; timer.stop(); removeEventListener(Event.ENTER_FRAME,onEnterFrame);
         removeEventListener(Event.ENTER_FRAME,oracleAdvance); if(amb!=null) amb.stop();
         oracleEmit({type:"ready",kind:"fly",rng:"xorshift32",clock:"original-AI-then-explicit-child-frame",nativeScheduling:false});
         oracleRunFly();
      }
      private function oracleFlySetup(config:Object) : * {
         oracleCombatReset(config.seed); game.castleHP=40; game.castleMHP=40; mission.absorbFix=0;
         oracleCombatActive=true; oracleFlyPrior=null;
         var slot:int; var target:*; var index:int;
         if(config.previous!=null) {
            slot=spawnEnemy(config.previous); target=enemyArray[slot];
            if(config.previous==10) {
               target.mc.oracleInitialize(); target.oracleFlyFreeze(); oracleFlyPrime=true;
               for(index=0;index<45;index++) target.oracleFlyStep();
               oracleFlyPrime=false;
            } else target.oracleFlyFreeze();
            oracleFlyPrior=target.oracleFlyState(); target.nullify();
            if(config.corrected==true) target.oracleFlyResetHistory();
         }
         oracleCombatState=config.seed; oracleCombatDraws=0; oracleCombatEvents=[];
         slot=spawnEnemy(10); target=enemyArray[slot]; target.mc.oracleInitialize(); target.oracleFlyFreeze();
         target.oracleFlyConfigure(config); return target;
      }
      private function oracleFlySnapshot(config:Object,index:int,target:*,error:String) : void {
         oracleEmit({type:"snapshot",kind:"fly",scenario:config.name,step:index,config:config,prior:oracleFlyPrior,
            enemy:target.oracleFlyState(),castleHp:game.castleHP,drawCount:oracleCombatDraws,rngState:oracleCombatState,error:error});
         ++oracleFlySnapshots;
      }
      private function oracleFlyCase(config:Object) : void {
         var target:* =oracleFlySetup(config); oracleFlySnapshot(config,0,target,"");
         var index:int; var error:String;
         for(index=1;index<=config.steps;index++) { error=target.oracleFlyStep(); oracleFlySnapshot(config,index,target,error); }
         target.oracleFlyFreeze();
      }
      private function oracleFlyGrid(frame:int) : void {
         var target:* =oracleFlySetup({seed:42,x:200,y:220}); gamePaused=true;
         if(frame>=12) target.mc.gotoAndStop(12);
         if(frame>=15) target.mc.gotoAndStop(15);
         if(frame>=23) target.mc.gotoAndStop(23);
         target.mc.gotoAndStop(frame);
         var body:String=""; var shadow:String=""; var x:int; var y:int;
         for(y=196;y<356;y++) for(x=168;x<232;x++) {
            body+=target.mc.hitTestPoint(x,y,true)?"1":"0";
            shadow+=target.mc.shadow.hitTestPoint(x,y,true)?"1":"0";
         }
         oracleEmit({type:"geometry",kind:"fly",frame:frame,x:200,y:220,gridX:168,gridY:196,width:64,height:160,bits:body,shadowBits:shadow,shadowHit:target.mc.shadowHit});
      }
      public function oracleRunFly() : Boolean {
         try {
            oracleFlyCase({name:"fresh_cycles",seed:42,steps:150});
            oracleFlyCase({name:"counter_boundary",seed:1,x:300,counter:39,frame:3,steps:50});
            oracleFlyCase({name:"castle_exit",seed:42,x:640,frame:3,steps:3});
            oracleFlyCase({name:"left_knockback",seed:42,x:-15,frame:3,knockBack:9,steps:12});
            oracleFlyCase({name:"death_fall",seed:42,x:200,frame:12,hp:0,steps:210});
            oracleFlyCase({name:"reuse_fly_raw",seed:42,previous:10,steps:60});
            oracleFlyCase({name:"reuse_fly_corrected",seed:42,previous:10,corrected:true,steps:60});
            oracleFlyCase({name:"reuse_sheep_raw",seed:42,previous:3,x:-15,frame:3,knockBack:9,steps:3});
            oracleFlyCase({name:"reuse_sheep_corrected",seed:42,previous:3,corrected:true,x:-15,frame:3,knockBack:9,steps:3});
            oracleFlyCase({name:"reuse_rat_raw",seed:42,previous:17,x:200,frame:3,knockBack:5,steps:3});
            oracleFlyCase({name:"reuse_rat_corrected",seed:42,previous:17,corrected:true,x:200,frame:3,knockBack:5,steps:3});
            oracleFlyCase({name:"reuse_boss_raw",seed:42,previous:999,x:200,frame:3,knockBack:5,steps:3});
            oracleFlyCase({name:"reuse_boss_corrected",seed:42,previous:999,corrected:true,x:200,frame:3,knockBack:5,steps:3});
            var frame:int; for each(frame in [1,3,8,12,15,22,23,41]) oracleFlyGrid(frame);
            oracleCombatActive=false; gamePaused=true;
            oracleEmit({type:"complete",kind:"fly",ok:true,snapshots:oracleFlySnapshots,geometryGrids:8}); return true;
         } catch(error:Error) {
            oracleCombatActive=false; gamePaused=true; oracleEmit({type:"error",kind:"fly",message:error.message}); return false;
         }
      }
'''


def main():
    out=ROOT/'.build/oracle'; out.mkdir(parents=True,exist_ok=True)
    report={'status':'failed','kind':'fly','runtime_validated':False,
            'boundary':'Original AI then explicit child frames; raw reused state and named field-reset intervention are retained separately'}
    try:
        original_path=ROOT/'original/elonashooter1.3.swf'; original=original_path.read_bytes()
        assert digest(original)==ORIGINAL_SHA256
        sources={name:(ROOT/'.build/export/scripts'/f'{name}.as').read_text(encoding='utf-8-sig') for name in ['enemy','enemy_fly']}
        main_bytes=(ROOT/'src/shootem_fla/MainTimeline.as').read_bytes()
        main_source,enemy,_,_=instrument(main_bytes.decode('utf-8-sig'),sources['enemy'])
        main_source=main_source.replace(COMBAT_AS3,DRIVER+extract_method(COMBAT_AS3,'oracleCombatReset'))
        enemy=re.sub(r'(?m)^(\s*)mc\.gotoAndPlay\(',r'\1if(id==_fly) mc.oraclePlaying=true;\n\1mc.gotoAndPlay(',enemy)
        enemy=append_class(enemy,ENEMY_EXTRA)
        fly=sources['enemy_fly'].replace('         stop();','         oraclePlaying=false; stop();').replace('         gotoAndPlay(', '         oraclePlaying=true; gotoAndPlay(')
        fly=append_class(fly,FLY_EXTRA)
        replacements=[]
        for name,body in [('shootem_fla.MainTimeline',main_source),('enemy',enemy),('enemy_fly',fly)]:
            path=out/(name.replace('.','_')+'-fly.as'); path.write_text(body,encoding='utf-8'); replacements += [name,str(path)]
        candidate=out/('fly-compiled-'+uuid.uuid4().hex+'.swf')
        result=command([find_java(None),'-Xmx1g','-jar',str(ROOT/'.tools/ffdec/ffdec.jar'),'-replace',str(original_path),str(candidate),*replacements],timeout=240)
        (out/'fly-build.log').write_text(result.stdout,encoding='utf-8')
        if result.returncode or not candidate.exists(): raise RuntimeError('FFDec Fly compilation failed')
        output=bytearray(candidate.read_bytes()); output[3]=10; report.update(verify_resources(original,output))
        (out/'fly-reference.swf').write_bytes(output)
        assert original_path.read_bytes()==original and (ROOT/'src/shootem_fla/MainTimeline.as').read_bytes()==main_bytes
        report.update(status='passed',original_sha256=digest(original),output_sha256=digest(output),original_class_sources={k:digest(v.encode()) for k,v in sources.items()})
    except Exception as error: report['error']=str(error)
    (out/'fly-build-report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8'); print(json.dumps(report,indent=2))
    return 0 if report['status']=='passed' else 1


if __name__=='__main__': raise SystemExit(main())
