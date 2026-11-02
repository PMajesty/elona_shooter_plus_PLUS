"""Эталон города 6, налога и титула; бой дня 7 не запускается."""
import json
import uuid

from build import ROOT, ORIGINAL_SHA256, command, digest, find_java, verify
from build_oracle import instrument_startup, method_span
from build_fifth_town_oracle import fifth_town_driver
from build_town_preparation_oracle import original_preparation_method
from build_wave_oracle import shared_driver_methods


ECONOMY_AS3 = r'''
      private var oracleEconomyMessages:Array=[];

      private function oracleEconomyReset(seed:uint,day:int) : void {
         var index:int;
         oraclePreparationActive=false;
         for(index=1;index<maxAlly;index++) player.exist[index]=false;
         for(index=0;index<_maxMedal;index++) medal[index]=false;
         player.money[_pc]=200;
         game.day=day; game.castleMHP=40; game.castleHP=17;
         game.house=1; game.storage=1; game.repair=0; game.sandbag=0; game.looter=0; game.museum=0;
         game.casual=false; game.comp=false; game.carryOver=false;
         game.title=0; game.titleMoney=0; game.fame=0; game.totalMoney=0;
         game.ap=0; game.apFix=0;
         game.prayerCount=0; game.tauntCount=0; game.partyCount=0; game.recycleCount=0; game.robCount=0;
         PARTY.ACTIVE=0; PARTY.ACCOUNTANT=0;
         mission.reward=600+(day-1)*20; mission.hire=false; mission.noDamage=false;
         mission.resultBefore=200; mission.resultTaken=0;
         news=""; eventDialog=0; oracleEconomyMessages=[];
         oraclePreparationState=seed; oraclePreparationDraws=0; oraclePreparationForced=null;
      }

      private function oracleEconomyResult(seed:uint,day:int,perfect:Boolean,title:int) : void {
         oracleEconomyReset(seed,day);
         game.title=title; game.titleMoney=title == 1 ? 100 : 0;
         mission.noDamage=perfect;
         oraclePreparationActive=true;
         renewResult();
         oraclePreparationActive=false;
         oracleEmit({type:"snapshot",kind:"sixth-town",boundary:"result",seed:seed,day:day,noDamage:perfect,
            title:game.title,titleMoney:game.titleMoney,goldBefore:200,initialReward:600+(day-1)*20,
            tax:calcTax(),upkeep:calcUnkeep(),gold:player.money[_pc],ap:game.ap,totalMoney:game.totalMoney,
            result:{reward:mission.reward,wage:mission.wage,combinedUpkeep:-mission.unkeep,income:mission.resultCastle,netReward:player.money[_pc]-200},
            drawCount:oraclePreparationDraws,rngState:oraclePreparationState});
         ++oraclePreparationSnapshots;
      }

      private function oracleEconomyAction(scenario:String,op:String,step:int,eligible:Boolean) : void {
         var dialog:MovieClip=stage.getChildByName("eventWindow") as MovieClip;
         var detail:Object=null;
         if(dialog != null) detail={title:dialog.title.text,text:dialog.text.text,cardFrame:dialog.card.currentFrame};
         oracleEmit({type:"snapshot",kind:"sixth-town",boundary:"claim-title",scenario:scenario,op:op,step:step,
            seed:42,day:game.day,eligible:eligible,title:game.title,titleMoney:game.titleMoney,titleName:titleList[game.title],
            gold:player.money[_pc],totalMoney:game.totalMoney,ap:game.ap,eventDialog:eventDialog,dialog:detail,
            messages:oracleEconomyMessages.concat(),drawCount:oraclePreparationDraws,rngState:oraclePreparationState});
         oracleEconomyMessages=[]; ++oraclePreparationSnapshots;
      }

      private function oracleRunEconomy() : void {
         var seed:Number;
         for each(seed in [42,1,3735928559]) {
            oracleEconomyResult(uint(seed),6,false,0);
            oracleEconomyResult(uint(seed),6,true,0);
         }
         // Эти две записи проверяют только renewResult после полученного титула, не бой дня 7.
         oracleEconomyResult(42,7,false,1);
         oracleEconomyResult(42,7,true,1);
         gameStage=_stageTown; menuId=2; page=0; upgradeCount=0;
         window2_mc.gotoAndStop("menu_castle");
         window2_mc.visible=true; window2_mc.x=0; window2_mc.y=-26; stage.addChild(window2_mc);
         oracleEconomyReset(42,6); game.ap=4; oraclePreparationActive=true;
         var eligible:Boolean=newTitle(0);
         oracleEconomyAction("claim_sequence","eligibility",0,eligible);
         if(eligible) showEventDialog(_dialogActClaim);
         oracleEconomyAction("claim_sequence","claim",1,eligible);
         var dialog:MovieClip=stage.getChildByName("eventWindow") as MovieClip;
         if(dialog == null) throw new Error("Original Claim Title did not create its event window");
         procEventDialog(dialog);
         oracleEconomyAction("claim_sequence","acknowledge",2,newTitle(0));
         // Повторный вызов закрыт исходным условием кнопки actList[9].method.
         game.ap=4; eligible=newTitle(0);
         if(eligible) showEventDialog(_dialogActClaim);
         oracleEconomyAction("claim_sequence","repeat",3,eligible);
         oracleEconomyReset(42,6); game.ap=3; oraclePreparationActive=true;
         eligible=newTitle(0); if(eligible) showEventDialog(_dialogActClaim);
         oracleEconomyAction("low_ap","claim",0,eligible);
         oracleEconomyReset(42,5); game.ap=4; oraclePreparationActive=true;
         eligible=newTitle(0); if(eligible) showEventDialog(_dialogActClaim);
         oracleEconomyAction("before_day6","claim",0,eligible);
         oraclePreparationActive=false;
      }
'''


def sixth_town_driver():
    driver = fifth_town_driver().replace('fifth-town', 'sixth-town')
    driver = driver.replace('day:5,missionLevel:5', 'day:6,missionLevel:6').replace('game.day=5;', 'game.day=6;')
    driver = driver.replace('synchronous-original-frame71-preparation', 'synchronous-original-town-preparation-and-economy')
    driver = driver.replace('targetLevel == 2 ? 0 : 0.99', 'targetLevel == 2 ? 5.0/9.0-0.00000001 : 5.0/9.0+0.00000001')
    original_calls = '''            var classId:int;
            for(classId=1;classId<=9;classId++) oracleRecruitGrowthCase(classId,false);
            oracleRecruitGrowthCase(6,true);
            oracleRecruitGrowthCase(6,false,2);'''
    assert original_calls in driver
    driver = driver.replace(original_calls, '''            oracleRecruitGrowthCase(6,false,2);
            oracleRecruitGrowthCase(6,false,3);
            oracleRunEconomy();''')
    return driver + ECONOMY_AS3


def main():
    out = ROOT / '.build/oracle'; out.mkdir(parents=True, exist_ok=True)
    report = {'status': 'failed', 'kind': 'sixth-town', 'rng': 'xorshift32',
              'save_io_replaced_by_observation': True, 'preparation_block_extracted_from_frame71': True,
              'retained_militia_slots': [45, 47, 48], 'calendar_day': 6,
              'controlled_recruit_prefix_advances_underlying_rng': True,
              'town_cases': 6, 'recruit_growth_cases': 2, 'result_cases': 8, 'title_cases': 6,
              'day7_boundary': 'renewResult only; no Day7 combat or town generation'}
    try:
        original_path, source_path = ROOT / 'original/elonashooter1.3.swf', ROOT / 'src/shootem_fla/MainTimeline.as'
        original, source_bytes = original_path.read_bytes(), source_path.read_bytes()
        if digest(original) != ORIGINAL_SHA256:
            raise ValueError('Preserved SWF fingerprint differs')
        source = source_bytes.decode('utf-8-sig')
        instrumented = source.replace('Math.random()', 'oraclePreparationRandom()')
        begin, _ = method_span(instrumented, 'popInfo')
        observer = '\n         if(oraclePreparationActive) oracleEconomyMessages.push(param1);'
        instrumented = instrumented[:begin] + observer + instrumented[begin:]
        if instrumented.replace(observer, '').replace('oraclePreparationRandom()', 'Math.random()') != source:
            raise ValueError('Observers changed original logic')
        preparation = original_preparation_method(instrumented)
        instrumented = instrumented.replace('   import flash.events.*;', '   import flash.events.*;\n   import flash.external.ExternalInterface;')
        instrumented = instrument_startup(instrumented)
        closing = instrumented.rfind('\n   }')
        instrumented = instrumented[:closing] + '\n' + shared_driver_methods() + sixth_town_driver() + preparation + instrumented[closing:]
        generated = out / 'SixthTownMainTimeline.as'; generated.write_text(instrumented, encoding='utf-8')
        candidate = out / ('sixth-town-compiled-' + uuid.uuid4().hex + '.swf')
        result = command([find_java(None), '-Xmx1g', '-jar', str(ROOT / '.tools/ffdec/ffdec.jar'), '-replace', str(original_path), str(candidate), 'shootem_fla.MainTimeline', str(generated)], timeout=240)
        (out / 'sixth-town-build.log').write_text(result.stdout, encoding='utf-8')
        if result.returncode or not candidate.is_file():
            raise RuntimeError('Sixth-town oracle compilation failed; inspect sixth-town-build.log')
        output = bytearray(candidate.read_bytes()); output[3] = 10
        report.update(verify(original, output))
        reference = out / 'sixth-town-reference.swf'; reference.write_bytes(output)
        if original_path.read_bytes() != original or source_path.read_bytes() != source_bytes:
            raise RuntimeError('A preserved input changed during oracle generation')
        report.update(status='passed', original_sha256=digest(original), source_sha256=digest(source_bytes), output_sha256=digest(output),
                      output=str(reference.relative_to(ROOT)).replace('\\', '/'), output_bytes=len(output), original_method_logic_preserved=True, runtime_validated=False)
    except Exception as error:
        report['error'] = str(error)
    (out / 'sixth-town-build-report.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, indent=2))
    return 0 if report['status'] == 'passed' else 1


if __name__ == '__main__':
    raise SystemExit(main())
