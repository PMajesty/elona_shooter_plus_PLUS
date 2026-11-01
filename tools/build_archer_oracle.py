"""Изолированный эталон лучника: исходный AI, кадры выпуска, стрелы и контуры."""
import json
import uuid
from pathlib import Path

from build import ROOT, ORIGINAL_SHA256, command, digest, find_java
from build_combat_oracle import COMBAT_AS3, append_class, instrument, verify_resources
from build_shoot_oracle import extract_method

ENEMY_EXTRA = r'''
      public function oracleArcherFreeze() : void { removeEventListener(Event.ENTER_FRAME,onEnterFrame); mc.stop(); }
      public function oracleArcherConfigure(config:Object) : void {
         if(config.x != null) x=config.x;
         if(config.frame != null) mc.gotoAndStop(config.frame);
         if(config.attacking != null) attacking=config.attacking;
         if(config.attacked != null) attacked=config.attacked;
         if(config.speed != null) speed=config.speed;
         if(config.counter != null) counter=config.counter;
         if(config.knockBack != null) knockBack=config.knockBack;
         if(config.hp != null) hp=config.hp;
         mc.stop();
      }
      public function oracleArcherStep() : String {
         var errorMessage:String="";
         try { onEnterFrame(null); } catch(error:Error) { errorMessage=error.message; }
         if(mc.currentFrame < 125) mc.nextFrame();
         mc.stop();
         return errorMessage;
      }
      public function oracleArcherState() : Object {
         return {x:x,y:y,hp:hp,speed:speed,speedOrg:speedOrg,attack:attack,gold:gold,exp:exp,
            counter:counter,knockBack:knockBack,attacking:attacking,attacked:attacked,frame:mc.currentFrame,
            shadowHit:mc.shadowHit,deathTicks:deathAnimeDuration,width:mc.width};
      }
'''

ARCHER_EXTRA = r'''
      public function oracleInitialize() : void { frame1(); stop(); }
'''

ARROW_EXTRA = r'''
      public function oracleFreeze() : void { removeEventListener(Event.ENTER_FRAME,onEnterFrame_bullet); stop(); }
      public function oracleState() : Object {
         return {x:x,dx:this.dx,dy:this.dy,sy:this.sy,y:mc.y,rotation:mc.rotation,shadowY:shadow.y,age:this.oracleAge,removed:parent==null};
      }
      public function oracleStep() : void { onEnterFrame_bullet(null); ++this.oracleAge; }
'''

DRIVER = r'''
      private var oraclePhase:int=-1;
      private var oracleCombatActive:Boolean=false;
      private var oracleCombatState:uint=42;
      private var oracleCombatDraws:int=0;
      private var oracleCombatEvents:Array=[];
      private var oracleArrows:Array=[];
      private var oracleArcherSnapshots:int=0;
      public function oracleCombatRandom() : Number {
         if(!oracleCombatActive) return Math.random();
         var value:int=int(oracleCombatState); value^=value<<13; value^=value>>>17; value^=value<<5;
         oracleCombatState=uint(value); ++oracleCombatDraws;
         return Number(oracleCombatState)/4294967296;
      }
      public function oracleCombatDamage(id:int,damage:int,crit:int,before:int,x:int,y:int) : void {}
      public function oracleArcherArrow(actor:*) : void {
         actor.oracleAge=0; actor.oracleFreeze(); oracleArrows.push(actor);
      }
      private function oracleBattleReady() : void {
         if(oraclePhase!=2) return;
         oraclePhase=3; timer.stop(); removeEventListener(Event.ENTER_FRAME,onEnterFrame);
         removeEventListener(Event.ENTER_FRAME,oracleAdvance); if(amb!=null) amb.stop();
         oracleEmit({type:"ready",kind:"archer",rng:"xorshift32",clock:"original-AI-then-explicit-child-frame-then-existing-arrows",nativeScheduling:false});
         oracleRunArcher();
      }
      private function oracleArcherSetup(seed:uint,config:Object) : * {
         var actor:*;
         for each(actor in oracleArrows) if(actor.parent!=null) actor.parent.removeChild(actor);
         oracleArrows=[];
         oracleCombatReset(seed); game.castleHP=40; game.castleMHP=40; mission.absorbFix=0;
         oracleCombatActive=true;
         var slot:int=spawnEnemy(2);
         var target:* =enemyArray[slot]; target.mc.oracleInitialize(); target.oracleArcherFreeze();
         target.oracleArcherConfigure(config);
         return target;
      }
      private function oracleArcherSnapshot(name:String,index:int,config:Object,target:*,error:String) : void {
         var arrows:Array=[]; var actor:*;
         for each(actor in oracleArrows) arrows.push(actor.oracleState());
         oracleEmit({type:"snapshot",kind:"archer",scenario:name,step:index,config:config,enemy:target.oracleArcherState(),
            arrows:arrows,castleHp:game.castleHP,drawCount:oracleCombatDraws,rngState:oracleCombatState,error:error});
         ++oracleArcherSnapshots;
      }
      private function oracleArcherCase(config:Object) : void {
         var target:* =oracleArcherSetup(config.seed,config);
         oracleArcherSnapshot(config.name,0,config,target,"");
         var index:int; var arrowIndex:int; var count:int; var error:String;
         for(index=1;index<=config.steps;index++) {
            count=oracleArrows.length;
            error=target.oracleArcherStep();
            for(arrowIndex=0;arrowIndex<count;arrowIndex++) if(oracleArrows[arrowIndex].parent!=null) oracleArrows[arrowIndex].oracleStep();
            oracleArcherSnapshot(config.name,index,config,target,error);
         }
         target.oracleArcherFreeze();
      }
      private function oracleArcherGrid(frame:int) : void {
         var target:* =oracleArcherSetup(42,{x:200}); gamePaused=true;
         target.y=220; target.mc.gotoAndStop(frame);
         var bits:String=""; var x:int; var y:int;
         for(y=188;y<252;y++) for(x=168;x<232;x++) bits+=target.mc.hitTestPoint(x,y,true)?"1":"0";
         oracleEmit({type:"geometry",kind:"archer",frame:frame,x:200,y:220,gridX:168,gridY:188,width:64,height:64,bits:bits});
      }
      public function oracleRunArcher() : Boolean {
         try {
            oracleArcherCase({name:"opening_counter",seed:42,steps:250});
            oracleArcherCase({name:"ranged_repeat",seed:1,x:289,frame:5,steps:160});
            oracleArcherCase({name:"knockback_interrupt",seed:42,x:330,frame:58,attacking:true,speed:0,knockBack:3,steps:50});
            oracleArcherCase({name:"left_edge_knockback",seed:42,x:-30,frame:5,knockBack:9,steps:12});
            oracleArcherCase({name:"death_stop",seed:42,x:200,frame:94,hp:0,steps:40});
            var frame:int; for each(frame in [1,5,28,59,94,125]) oracleArcherGrid(frame);
            oracleCombatActive=false; gamePaused=true;
            oracleEmit({type:"complete",kind:"archer",ok:true,snapshots:oracleArcherSnapshots,geometryGrids:6}); return true;
         } catch(error:Error) {
            oracleCombatActive=false; gamePaused=true; oracleEmit({type:"error",kind:"archer",message:error.message}); return false;
         }
      }
'''

def main():
    out=ROOT/'.build/oracle'
    out.mkdir(parents=True, exist_ok=True)
    report={'status':'failed','kind':'archer','runtime_validated':False,
            'boundary':'Original spawn/AI and explicit nextFrame calls, followed by prior arrows; native scheduling is not asserted'}
    try:
        original_path=ROOT/'original/elonashooter1.3.swf'
        original=original_path.read_bytes()
        assert digest(original)==ORIGINAL_SHA256
        sources={name:(ROOT/'.build/export/scripts'/f'{name}.as').read_text(encoding='utf-8-sig') for name in ['enemy','enemy_archer','arrow']}
        main_bytes=(ROOT/'src/shootem_fla/MainTimeline.as').read_bytes()
        main_source,enemy,_,_=instrument(main_bytes.decode('utf-8-sig'),sources['enemy'])
        reset=extract_method(COMBAT_AS3,'oracleCombatReset')
        main_source=main_source.replace(COMBAT_AS3,DRIVER+reset)
        enemy=append_class(enemy,ENEMY_EXTRA)
        archer=sources['enemy_archer']
        marker='         stage.addChild(mc);'
        assert archer.count(marker)==1
        archer=archer.replace(marker,marker+'\n         _root.oracleArcherArrow(mc);')
        archer=append_class(archer,ARCHER_EXTRA)
        arrow=append_class(sources['arrow'],ARROW_EXTRA)
        replacements=[]
        for name,body in [('shootem_fla.MainTimeline',main_source),('enemy',enemy),('enemy_archer',archer),('arrow',arrow)]:
            path=out/(name.replace('.','_')+'-archer.as'); path.write_text(body,encoding='utf-8')
            replacements += [name,str(path)]
        candidate=out/('archer-compiled-'+uuid.uuid4().hex+'.swf')
        result=command([find_java(None),'-Xmx1g','-jar',str(ROOT/'.tools/ffdec/ffdec.jar'),'-replace',str(original_path),str(candidate),*replacements],timeout=240)
        (out/'archer-build.log').write_text(result.stdout,encoding='utf-8')
        if result.returncode or not candidate.exists(): raise RuntimeError('FFDec archer compilation failed')
        output=bytearray(candidate.read_bytes()); output[3]=10
        report.update(verify_resources(original,output))
        (out/'archer-reference.swf').write_bytes(output)
        assert original_path.read_bytes()==original
        assert (ROOT/'src/shootem_fla/MainTimeline.as').read_bytes()==main_bytes
        report.update(status='passed',original_sha256=digest(original),output_sha256=digest(output),original_class_sources={k:digest(v.encode()) for k,v in sources.items()})
    except Exception as error:
        report['error']=str(error)
    (out/'archer-build-report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(report,indent=2))
    return 0 if report['status']=='passed' else 1

if __name__=='__main__':
    raise SystemExit(main())
