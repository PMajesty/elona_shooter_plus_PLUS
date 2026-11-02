"""Исходные Fix Wall/Repairman: реальные плитки города и граница onTick."""
import json
import uuid

from build import ROOT, ORIGINAL_SHA256, command, digest, find_java, verify
from build_oracle import method_span
from build_castle_upgrades_oracle import CASTLE_AS3, instrument as instrument_castle
from build_shoot_oracle import extract_method


COMMON_AS3 = '\n'.join(extract_method(CASTLE_AS3, name) for name in [
    'oracleCastleRandom', 'oracleCastleX', 'oracleCastleY', 'oracleCastleCleanup',
    'oracleCastleReset', 'oracleCastleClick'])

REPAIR_AS3 = r'''
      private var oraclePhase:int=-1;
      private var oracleCastleActive:Boolean=false;
      private var oracleCastleState:uint=42;
      private var oracleCastleDraws:int=0;
      private var oracleCastleSnapshots:int=0;
      private var oracleCastleScenario:String="";
      private var oracleCastleStage:String="";
      private var oracleCastleMouseX:Number=0;
      private var oracleCastleMouseY:Number=0;
      private var oracleRepairStopAtExit:Boolean=false;
      private var oracleRepairExitReached:Boolean=false;

      private function oracleRepairTile(index:int):Object {
         return {cost:getUpgradeCost(index),possible:upgrade_mc[index].possible,
            name:upgrade_mc[index].upgradeName.text,priceText:upgrade_mc[index].upgradeCost.text,
            mouseEnabled:upgrade_mc[index].upgradeButton.mouseEnabled,hint:upgradeHint[index].concat()};
      }
      private function oracleRepairTownSnapshot(op:String,target:int=-1):void {
         oracleEmit({type:"snapshot",kind:"castle-repair",boundary:"town",scenario:oracleCastleScenario,op:op,
            target:target<0 ? null : target==0 ? "fix-wall" : "repairman",
            wallFixCount:game.wallFix,repairmanLevel:game.repair,hp:game.castleHP,maxHp:game.castleMHP,
            gold:player.money[_pc],ap:game.ap,totalMoney:game.totalMoney,upkeep:calcUnkeep(),
            noDamage:mission.noDamage,upkeepText:window2_mc.unkeep.text,
            fixWall:oracleRepairTile(0),repairman:oracleRepairTile(6),
            dialog:gameDialog,eventDialog:stage.getChildByName("eventWindow")!=null,
            drawCount:oracleCastleDraws,rngState:oracleCastleState});
         ++oracleCastleSnapshots;
      }
      private function oracleRepairTownCase(name:String,gold:int,target:int,hp:int=30,maxHp:int=40,level:int=0,fixes:int=0,clicks:int=1):void {
         oracleCastleReset(name,gold,1,hp,maxHp); game.wallFix=fixes; game.repair=level; mission.noDamage=false;
         removeUpgrades(); updateCastleMenu(); oracleRepairTownSnapshot("before");
         for(var index:int=0;index<clicks;index++) { oracleCastleClick(target); oracleRepairTownSnapshot("click",target); }
      }
      private function oracleRepairTimerSnapshot(op:String):void {
         oracleEmit({type:"snapshot",kind:"castle-repair",boundary:"timer",scenario:oracleCastleScenario,op:op,
            repairmanLevel:game.repair,hp:game.castleHP,maxHp:game.castleMHP,
            wave:mission.wave,newWave:mission.newWave,time:mission.time,noDamage:mission.noDamage,
            paused:gamePaused,gameOver:gameOver,immune:immune,exitReached:oracleRepairExitReached,
            drawCount:oracleCastleDraws,rngState:oracleCastleState});
         ++oracleCastleSnapshots;
      }
      private function oracleRepairTimerCase(name:String,hp:int,level:int,wave:int,newWave:Boolean=true,noDamage:Boolean=true):void {
         oracleCastleScenario=name; oracleCastleStage="timer-setup"; oracleCastleActive=false;
         var index:int;
         for(index=0;index<maxAlly;index++) player.exist[index]=false;
         game.castleHP=hp; game.castleMHP=40; game.repair=level; game.day=2;
         game.optionFirework=true; gamePaused=false; gameOver=false; immune=false;
         mission.wave=wave; mission.newWave=newWave; mission.time=10; mission.noDamage=noDamage; mission.bossWave=-1;
         hero=-1; frenzyMode=0; bgChange=0; sisterList=[]; gameStage=_stageBattle;
         oracleRepairStopAtExit=true; oracleRepairExitReached=false;
         oracleCastleState=42; oracleCastleDraws=0; oracleCastleActive=true;
         oracleRepairTimerSnapshot("before"); oracleCastleStage="original-onTick";
         try { onTick(new TimerEvent(TimerEvent.TIMER)); }
         catch(error:Error) { if(error.message!="ELONA_REPAIR_EXIT_BOUNDARY") throw error; }
         oracleRepairTimerSnapshot("timer"); oracleRepairStopAtExit=false;
      }
      private function oracleBattleReady():void {
         if(oraclePhase!=2) return; oraclePhase=3; timer.stop();
         removeEventListener(Event.ENTER_FRAME,onEnterFrame); removeEventListener(Event.ENTER_FRAME,oracleAdvance);
         if(amb!=null) amb.stop();
         try {
            if(player.devType[0]!=6 || inventory.id[weapon(0)]!=3) throw new Error("Original Sheriff initialization failed");
            oracleEmit({type:"ready",kind:"castle-repair",rng:"xorshift32",clock:"synchronous-original-town-input-and-wave-timer",
               timerMethod:"onTick",terminalBoundary:"exitBattle2-entry",fireworksDisabled:true,actorsDisabled:true,continuedTownEntry:true});
            oracleRepairTimerCase("opening-restore",38,1,5);
            oracleRepairTimerCase("ordinary-partial",35,1,2);
            oracleRepairTimerCase("ordinary-clamp",39,2,2);
            oracleRepairTimerCase("no-repairman",39,0,2);
            oracleRepairTimerCase("already-failed",39,2,2,true,false);
            oracleRepairTimerCase("between-transitions",35,3,2,false);
            oracleRepairTimerCase("terminal-damaged",39,3,0);
            oracleRepairTimerCase("terminal-full",40,3,0);
            oracleRepairTimerCase("lethal-gate",0,3,5);
            oracleCastleActive=false; player.exist[0]=true; gamePaused=false; gameOver=false; immune=false;
            gameContinued=true; addEventListener(Event.ENTER_FRAME,oracleRepairTownReady); gotoAndStop("town");
         } catch(error:Error) { oracleRepairError(error); }
      }
      private function oracleRepairError(error:Error):void {
         oracleCastleActive=false; gamePaused=true;
         oracleEmit({type:"error",kind:"castle-repair",message:error.message,scenario:oracleCastleScenario,
            snapshots:oracleCastleSnapshots,diagnosticStage:oracleCastleStage,stack:error.getStackTrace()});
      }
      private function oracleRepairTownReady(event:Event):void {
         if(currentFrame!=71 || equipButton==null || charaButton==null) return;
         removeEventListener(Event.ENTER_FRAME,oracleRepairTownReady); removeEventListener(Event.ENTER_FRAME,onEnterFrame_town);
         stage.removeEventListener(KeyboardEvent.KEY_DOWN,KeyDown_town);
         stage.removeEventListener(MouseEvent.MOUSE_DOWN,MouseLDownFunc_town);
         if(amb!=null) amb.stop();
         try {
            oracleRepairTownCase("fix-insufficient",79,0);
            oracleRepairTownCase("fix-exact",80,0);
            oracleRepairTownCase("fix-repeat-full",160,0,30,40,0,0,2);
            oracleRepairTownCase("fix-upgraded-counter",80,0,35,45,0,3);
            oracleRepairTownCase("repairman-insufficient",699,6);
            oracleRepairTownCase("repairman-first",700,6);
            oracleRepairTownCase("repairman-second",950,6,30,40,1);
            oracleRepairTownCase("repairman-sequence",3350,6,30,40,0,0,3);
            oracleCastleActive=false; gamePaused=true;
            oracleEmit({type:"complete",kind:"castle-repair",ok:true,snapshots:oracleCastleSnapshots,timerCases:9,townCases:8});
         } catch(error:Error) { oracleRepairError(error); }
      }
'''


def instrument(source):
    result = instrument_castle(source)
    if result.count(CASTLE_AS3) != 1:
        raise ValueError('Shared Castle diagnostic body ambiguous')
    result = result.replace(CASTLE_AS3, COMMON_AS3 + REPAIR_AS3)
    begin, _ = method_span(result, 'exitBattle2')
    observer = '\n         if(oracleCastleActive && oracleRepairStopAtExit) { oracleRepairExitReached=true; throw new Error("ELONA_REPAIR_EXIT_BOUNDARY"); }'
    observed = result[:begin] + observer + result[begin:]
    if observed.replace(observer, '') != result:
        raise ValueError('Exit observer changed original source')
    return observed


def main():
    out = ROOT / '.build/oracle'; out.mkdir(parents=True, exist_ok=True)
    report = {'status': 'failed', 'kind': 'castle-repair', 'rng': 'xorshift32',
              'clock': 'synchronous-original-town-input-and-wave-timer', 'continued_town_entry': True,
              'fresh_town_generation_excluded': True, 'input_seams': ['town mouse position'],
              'terminal_observation_boundary': 'exitBattle2 entry; diagnostic sentinel stops before cleanup, rewards and event transition',
              'boundary': 'Original Fix Wall/Repairman tile clicks and nine controlled onTick wave/healing boundaries; decorative fireworks disabled, actors inactive'}
    try:
        original_path, source_path = ROOT / 'original/elonashooter1.3.swf', ROOT / 'src/shootem_fla/MainTimeline.as'
        original, source_bytes = original_path.read_bytes(), source_path.read_bytes()
        if digest(original) != ORIGINAL_SHA256: raise ValueError('Preserved SWF fingerprint differs')
        generated = out / 'CastleRepairMainTimeline.as'
        generated.write_text(instrument(source_bytes.decode('utf-8-sig')), encoding='utf-8')
        candidate = out / ('castle-repair-compiled-' + uuid.uuid4().hex + '.swf')
        result = command([find_java(None), '-Xmx1g', '-jar', str(ROOT / '.tools/ffdec/ffdec.jar'), '-replace',
                          str(original_path), str(candidate), 'shootem_fla.MainTimeline', str(generated)], timeout=240)
        (out / 'castle-repair-build.log').write_text(result.stdout, encoding='utf-8')
        if result.returncode or not candidate.is_file(): raise RuntimeError('Castle repair compilation failed; inspect castle-repair-build.log')
        output = bytearray(candidate.read_bytes()); output[3] = 10
        report.update(verify(original, output))
        reference = out / 'castle-repair-reference.swf'; reference.write_bytes(output)
        if original_path.read_bytes() != original or source_path.read_bytes() != source_bytes: raise RuntimeError('Preserved input changed')
        report.update(status='passed', original_sha256=digest(original), source_sha256=digest(source_bytes),
                      output_sha256=digest(output), output=str(reference.relative_to(ROOT)).replace('\\', '/'),
                      output_bytes=len(output), original_method_logic_preserved=True, runtime_validated=False)
    except Exception as error:
        report['error'] = str(error)
    (out / 'castle-repair-build-report.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, indent=2))
    return 0 if report['status'] == 'passed' else 1


if __name__ == '__main__':
    raise SystemExit(main())
