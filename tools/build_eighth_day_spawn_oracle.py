"""Исходный onTick Day8: короткое замыкание RNG и цикл по уменьшающейся очереди."""
import json
import uuid

from build import ROOT, ORIGINAL_SHA256, command, digest, find_java
from build_oracle import method_span
from build_combat_oracle import COMBAT_AS3, instrument as combat_instrument, verify_resources
from build_shoot_oracle import extract_method

INIT=[0.25,0.5,0.75]
CONTINUE=INIT+[0.9,0.8]
CASES=[
    dict(name='sheep-first-below',ids=[3,3,3],prefix=INIT+[6/7-0.0000001]),
    dict(name='sheep-first-at-second-break',ids=[3,3,3],prefix=INIT+[6/7,0.800001]),
    dict(name='sheep-second-at-continue',ids=[17,3,3,3],prefix=CONTINUE+INIT+[0.5]),
    dict(name='shrinking-even',ids=[3,3,3,3],prefix=CONTINUE*2),
    dict(name='shrinking-odd',ids=[3,3,3],prefix=CONTINUE*2),
    dict(name='final-sheep-deferred-empty',ids=[3],prefix=CONTINUE,ticks=15),
    dict(name='rat-first-break',ids=[3,17],prefix=INIT+[0.999999]),
    dict(name='lava-first-break',ids=[3,4],prefix=INIT+[0.999999]),
    dict(name='boss-first-break',ids=[3,999],prefix=[0.25,0.25,0.5,0.5,0.75,0.999999]),
    dict(name='empty-queue',ids=[],prefix=[]),
]

DRIVER=r'''
      private var oraclePhase:int=-1;
      private var oracleCombatActive:Boolean=false;
      private var oracleCombatState:uint=42;
      private var oracleCombatDraws:int=0;
      private var oracleCombatEvents:Array=[];
      private var oracleSpawnPrefix:Array=[];
      private var oracleSpawnDraws:Array=[];
      private var oracleSpawnEvents:Array=[];
      private var oracleSpawnSnapshots:int=0;
      private var oracleSpawnTick:int=0;
      public function oracleCombatRandom():Number {
         if(!oracleCombatActive)return Math.random();
         var value:int=int(oracleCombatState);value^=value<<13;value^=value>>>17;value^=value<<5;oracleCombatState=uint(value);
         var result:Number=oracleCombatDraws<oracleSpawnPrefix.length?Number(oracleSpawnPrefix[oracleCombatDraws]):Number(oracleCombatState)/4294967296.0;
         ++oracleCombatDraws;oracleSpawnDraws.push({index:oracleCombatDraws,state:oracleCombatState,value:result});return result;
      }
      public function oracleCombatDamage(id:int,damage:int,crit:int,before:int,x:int,y:int):void {}
      private function oracleSpawnObserved(id:int,slot:int):void {
         if(!oracleCombatActive)return;
         oracleSpawnEvents.push({tick:oracleSpawnTick,id:id,slot:slot,drawCount:oracleCombatDraws,rngState:oracleCombatState,
            remaining:pop[mission.wave].concat(),enemy:enemyArray[slot].oracleState()});
      }
      private function oracleSpawnState():Object {
         var active:Array=[];
         for(var index:int=0;index<maxEnemy;index++)if(enemyArray[index].parent==this)active.push(enemyArray[index].oracleState());
         return {tick:oracleSpawnTick,wave:mission.wave,newWave:mission.newWave,time:mission.time,
            queue:pop[4].concat(),delays:popTime[4].concat(),enemies:active,bossCounter:game.boss,
            hp:game.castleHP,noDamage:mission.noDamage,drawCount:oracleCombatDraws,rngState:oracleCombatState};
      }
      private function oracleSpawnCase(config:Object):void {
         oracleCombatActive=false;oracleCombatReset(42);
         for(var index:int=0;index<maxEnemy;index++)enemyArray[index]=new enemy();
         for(index=0;index<maxAlly;index++)player.exist[index]=false;
         game.day=8;game.boss=7;game.castleHP=40;game.castleMHP=40;game.repair=0;
         gamePaused=false;gameOver=false;immune=false;hero=-1;frenzyMode=0;bgChange=0;sisterList=[];gameStage=_stageBattle;
         PARTY.THREAT=0;mission.level=7;mission.fixedLv=7;mission.time=0;mission.wave=4;mission.noDamage=true;mission.bossWave=-1;
         pop=[];popTime=[];pop[4]=config.ids.concat();popTime[4]=[];
         for(index=0;index<config.ids.length;index++)popTime[4].push(13.6+index);
         oracleCombatState=42;oracleCombatDraws=0;oracleSpawnPrefix=config.prefix.concat();oracleSpawnDraws=[];oracleSpawnEvents=[];oracleSpawnTick=0;
         var before:Object=oracleSpawnState();var steps:Array=[];
         oracleCombatActive=true;
         for(index=0;index<(config.ticks==undefined?1:config.ticks);index++) {
            ++oracleSpawnTick;onTick(new TimerEvent(TimerEvent.TIMER));steps.push(oracleSpawnState());
         }
         oracleCombatActive=false;
         oracleEmit({type:"snapshot",kind:"eighth-day-spawn",scenario:config.name,config:config,before:before,steps:steps,
            spawnEvents:oracleSpawnEvents,draws:oracleSpawnDraws,drawCount:oracleCombatDraws,rngState:oracleCombatState});++oracleSpawnSnapshots;
      }
      private function oracleBattleReady():void {
         if(oraclePhase!=2)return;oraclePhase=3;timer.stop();removeEventListener(Event.ENTER_FRAME,onEnterFrame);removeEventListener(Event.ENTER_FRAME,oracleAdvance);
         if(amb!=null)amb.stop();
         try {
            oracleEmit({type:"ready",kind:"eighth-day-spawn",clock:"synchronous-original-onTick",actorsDisabled:true,enemyFrameAdvance:false,seed:42,missionLevel:7,day:8});
            for each(var config:Object in __CASES__)oracleSpawnCase(config);
            gamePaused=true;oracleEmit({type:"complete",kind:"eighth-day-spawn",ok:true,snapshots:oracleSpawnSnapshots});
         }catch(error:Error){oracleCombatActive=false;gamePaused=true;oracleEmit({type:"error",kind:"eighth-day-spawn",message:error.message,snapshots:oracleSpawnSnapshots,stack:error.getStackTrace()});}
      }
'''


def main():
    out=ROOT/'.build/oracle';out.mkdir(parents=True,exist_ok=True)
    original_path=ROOT/'original/elonashooter1.3.swf';source_path=ROOT/'src/shootem_fla/MainTimeline.as'
    original,source=original_path.read_bytes(),source_path.read_bytes()
    report={'status':'failed','kind':'eighth-day-spawn','boundary':'Actual onTick spawn loop and enemy.init at mission7/calendar8; controlled break inputs with full original initialization RNG',
            'actors_disabled':True,'enemy_frame_advance':False,'native_timer_schedule_excluded':True}
    try:
        assert digest(original)==ORIGINAL_SHA256
        text=source.decode('utf-8-sig')
        main_text,enemy_text,_,_=combat_instrument(text,(ROOT/'.build/export/scripts/enemy.as').read_text(encoding='utf-8-sig'))
        main_text=main_text.replace(COMBAT_AS3,extract_method(COMBAT_AS3,'oracleCombatReset')+DRIVER.replace('__CASES__',json.dumps(CASES,separators=(',',':'))))
        begin,end=method_span(main_text,'spawnEnemy');body=main_text[begin:end]
        observer='         oracleSpawnObserved(param1,_loc2_);\n'
        assert body.count('         return _loc2_;')==1
        main_text=main_text[:begin]+body.replace('         return _loc2_;',observer+'         return _loc2_;')+main_text[end:]
        assert extract_method(main_text,'onTick').replace('oracleCombatRandom()','Math.random()')==extract_method(text,'onTick')
        assert extract_method(main_text,'spawnEnemy').replace(observer,'').replace('oracleCombatRandom()','Math.random()')==extract_method(text,'spawnEnemy')
        main_file=out/'EighthDaySpawnMainTimeline.as';enemy_file=out/'EighthDaySpawnEnemy.as'
        main_file.write_text(main_text,encoding='utf-8');enemy_file.write_text(enemy_text,encoding='utf-8')
        candidate=out/('eighth-day-spawn-compiled-'+uuid.uuid4().hex+'.swf')
        result=command([find_java(None),'-Xmx1g','-jar',str(ROOT/'.tools/ffdec/ffdec.jar'),'-replace',str(original_path),str(candidate),'shootem_fla.MainTimeline',str(main_file),'enemy',str(enemy_file)],timeout=240)
        (out/'eighth-day-spawn-build.log').write_text(result.stdout,encoding='utf-8')
        if result.returncode or not candidate.is_file():raise RuntimeError('Day8 spawn compilation failed; inspect eighth-day-spawn-build.log')
        output=bytearray(candidate.read_bytes());output[3]=10;report.update(verify_resources(original,output))
        reference=out/'eighth-day-spawn-reference.swf';reference.write_bytes(output)
        assert original_path.read_bytes()==original and source_path.read_bytes()==source
        report.update(status='passed',original_sha256=digest(original),source_sha256=digest(source),output_sha256=digest(output),output_bytes=len(output),
            output=str(reference.relative_to(ROOT)).replace('\\','/'),original_method_logic_preserved=True,cases=CASES,runtime_validated=False)
    except Exception as error:report['error']=str(error)
    (out/'eighth-day-spawn-build-report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({key:value for key,value in report.items() if key!='cases'},indent=2));return 0 if report['status']=='passed' else 1


if __name__=='__main__':raise SystemExit(main())
