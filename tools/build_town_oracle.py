"""Собирает эталон расчёта итогов и Free Repair; полная подготовка frame71 исключена."""
import json
import uuid

from build import ROOT, ORIGINAL_SHA256, command, digest, find_java, verify
from build_oracle import instrument_startup, method_span
from build_wave_oracle import shared_driver_methods


TOWN_AS3 = r'''
      private var oraclePhase:int = -1;
      private var oracleTownActive:Boolean = false;
      private var oracleTownReady:Boolean = false;
      private var oracleTownState:uint = 1;
      private var oracleTownDraws:int = 0;
      private var oracleTownMessages:Array = [];

      private function oracleTownRandom() : Number
      {
         if(!oracleTownActive) return Math.random();
         var value:int = int(oracleTownState);
         value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
         oracleTownState = uint(value); ++oracleTownDraws;
         return Number(oracleTownState) / 4294967296.0;
      }

      private function oracleBattleReady() : void
      {
         if(oraclePhase != 2) return;
         oraclePhase=3; timer.stop();
         removeEventListener(Event.ENTER_FRAME,onEnterFrame);
         removeEventListener(Event.ENTER_FRAME,oracleAdvance);
         if(amb != null) amb.stop();
         try
         {
            if(player.devType[_pc] != _devSheriff || inventory.id[weapon(_pc)] != 3) throw new Error("Original Sheriff initialization failed");
            oracleTownReady=true;
            if(ExternalInterface.available) ExternalInterface.addCallback("oracleRunTown",oracleRunTown);
            oracleEmit({type:"ready",kind:"town",rng:"xorshift32",clock:"synchronous-original-result-and-free-repair",day:1,classId:_devSheriff,frame71:false,seeds:[42,1,3735928559]});
            oracleRunTown();
         }
         catch(error:Error) { oracleTownActive=false; oracleEmit({type:"error",kind:"town",message:error.message}); }
      }

      private function oracleTownReset(seed:uint) : void
      {
         var index:int;
         oracleTownActive=false;
         for(index=1;index<maxAlly;index++) player.exist[index]=false;
         for(index=0;index<_maxMedal;index++) medal[index]=false;
         player.money[_pc]=200;
         game.day=1; game.castleMHP=40; game.castleHP=17;
         game.house=1; game.storage=1; game.repair=0; game.sandbag=0; game.looter=0; game.museum=0;
         game.casual=false; game.comp=false; game.carryOver=false;
         game.titleMoney=0; game.fame=0; game.totalMoney=0;
         game.ap=0; game.apFix=0;
         game.prayerCount=0; game.tauntCount=0; game.partyCount=0; game.recycleCount=0; game.robCount=0;
         PARTY.ACTIVE=0; PARTY.ACCOUNTANT=0;
         mission.reward=600; mission.hire=false; mission.noDamage=false;
         mission.resultBefore=200; mission.resultTaken=0;
         news=""; eventDialog=0;
         oracleTownState=seed == 0 ? 1 : seed; oracleTownDraws=0; oracleTownMessages=[];
      }

      private function oracleTownResult(seed:uint,perfect:Boolean) : void
      {
         oracleTownReset(seed);
         mission.noDamage=perfect;
         oracleTownActive=true;
         renewResult();
         oracleTownActive=false;
         oracleEmit({type:"snapshot",kind:"town",scenario:"result",seed:seed,noDamage:perfect,day:game.day,goldBefore:200,initialReward:600,gold:player.money[_pc],ap:game.ap,apFix:game.apFix,result:{reward:mission.reward,wage:mission.wage,upkeep:-mission.unkeep,income:mission.resultCastle,netReward:player.money[_pc]-200},totalMoney:game.totalMoney,drawCount:oracleTownDraws,rngState:oracleTownState});
      }

      private function oracleTownActionSnapshot(scenario:String,op:String,step:int) : void
      {
         var dialog:MovieClip=stage.getChildByName("eventWindow") as MovieClip;
         var detail:Object=null;
         if(dialog != null) detail={title:dialog.title.text,text:dialog.text.text,cardFrame:dialog.card.currentFrame};
         oracleEmit({type:"snapshot",kind:"town",scenario:scenario,op:op,step:step,seed:42,day:game.day,hp:game.castleHP,maxHp:game.castleMHP,gold:player.money[_pc],ap:game.ap,eventDialog:eventDialog,dialog:detail,messages:oracleTownMessages.concat(),drawCount:oracleTownDraws,rngState:oracleTownState});
         oracleTownMessages=[];
      }

      public function oracleRunTown() : Boolean
      {
         if(!oracleTownReady) return false;
         try
         {
            var seed:Number;
            for each(seed in [42,1,3735928559])
            {
               oracleTownResult(uint(seed),false);
               oracleTownResult(uint(seed),true);
            }
            // Подготавливается только исходная страница Castle, без генераторов frame71.
            gameStage=_stageTown; menuId=2; page=0; upgradeCount=0;
            window2_mc.gotoAndStop("menu_castle");
            window2_mc.visible=true; window2_mc.x=0; window2_mc.y=-26;
            stage.addChild(window2_mc);
            oracleTownReset(42); game.ap=2; oracleTownActive=true;
            showEventDialog(_dialogFreeRepair);
            oracleTownActionSnapshot("repair_sequence","freeRepair",0);
            var dialog:MovieClip=stage.getChildByName("eventWindow") as MovieClip;
            if(dialog == null) throw new Error("Original Free Repair did not create its event window");
            procEventDialog(dialog);
            oracleTownActionSnapshot("repair_sequence","acknowledge",1);
            showEventDialog(_dialogFreeRepair);
            oracleTownActionSnapshot("repair_sequence","freeRepair",2);
            oracleTownReset(42); game.ap=1; oracleTownActive=true;
            showEventDialog(_dialogFreeRepair);
            oracleTownActionSnapshot("low_ap","freeRepair",0);
            oracleTownReset(42); game.ap=0; game.castleHP=game.castleMHP; oracleTownActive=true;
            showEventDialog(_dialogFreeRepair);
            oracleTownActionSnapshot("full_low_ap","freeRepair",0);
            oracleTownActive=false; gamePaused=true;
            oracleEmit({type:"complete",kind:"town",ok:true,snapshots:11,resultCases:6,actionCases:5,frame71:false});
            return true;
         }
         catch(error:Error) { oracleTownActive=false; gamePaused=true; oracleEmit({type:"error",kind:"town",message:error.message}); return false; }
      }
'''


def main():
    output_dir = ROOT / '.build/oracle'
    output_dir.mkdir(parents=True, exist_ok=True)
    report = {'status': 'failed', 'kind': 'town', 'rng': 'xorshift32',
              'clock': 'synchronous-original-result-and-free-repair', 'frame71_excluded': True}
    try:
        original_path = ROOT / 'original/elonashooter1.3.swf'
        source_path = ROOT / 'src/shootem_fla/MainTimeline.as'
        original, source_bytes = original_path.read_bytes(), source_path.read_bytes()
        if digest(original) != ORIGINAL_SHA256:
            raise ValueError('Preserved SWF fingerprint differs')
        source = source_bytes.decode('utf-8-sig')
        instrumented = source.replace('Math.random()', 'oracleTownRandom()')
        if instrumented.replace('oracleTownRandom()', 'Math.random()') != source:
            raise ValueError('RNG wrapper changed original logic')
        begin, _ = method_span(instrumented, 'popInfo')
        observer = '\n         if(oracleTownActive) oracleTownMessages.push(param1);'
        instrumented = instrumented[:begin] + observer + instrumented[begin:]
        if instrumented.replace(observer, '').replace('oracleTownRandom()', 'Math.random()') != source:
            raise ValueError('Message observer changed original logic')
        instrumented = instrumented.replace('   import flash.events.*;', '   import flash.events.*;\n   import flash.external.ExternalInterface;')
        instrumented = instrument_startup(instrumented)
        closing = instrumented.rfind('\n   }')
        instrumented = instrumented[:closing] + '\n' + shared_driver_methods() + TOWN_AS3 + instrumented[closing:]
        generated = output_dir / 'TownMainTimeline.as'
        generated.write_text(instrumented, encoding='utf-8')
        candidate = output_dir / ('town-compiled-' + uuid.uuid4().hex + '.swf')
        result = command([find_java(None), '-Xmx1g', '-jar', str(ROOT / '.tools/ffdec/ffdec.jar'), '-replace', str(original_path), str(candidate), 'shootem_fla.MainTimeline', str(generated)], timeout=240)
        (output_dir / 'town-build.log').write_text(result.stdout, encoding='utf-8')
        if result.returncode or not candidate.is_file():
            raise RuntimeError('Town oracle compilation failed; inspect town-build.log')
        output = bytearray(candidate.read_bytes()); output[3] = 10
        report.update(verify(original, output))
        reference = output_dir / 'town-reference.swf'
        reference.write_bytes(output)
        if original_path.read_bytes() != original or source_path.read_bytes() != source_bytes:
            raise RuntimeError('Preserved input changed during oracle generation')
        report.update(status='passed', original_sha256=digest(original), source_sha256=digest(source_bytes),
                      output_sha256=digest(output), output=str(reference.relative_to(ROOT)).replace('\\','/'),
                      output_bytes=len(output), original_method_logic_preserved=True, runtime_validated=False)
    except Exception as error:
        report['error'] = str(error)
    (output_dir / 'town-build-report.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, indent=2))
    return 0 if report['status'] == 'passed' else 1


if __name__ == '__main__':
    raise SystemExit(main())
