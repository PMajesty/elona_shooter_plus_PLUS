"""Эталон города 7: рост кандидатов до уровня 4, налог и сохранённый титул."""
import json
import uuid

from build import ROOT, ORIGINAL_SHA256, command, digest, find_java, verify
from build_oracle import instrument_startup, method_span
from build_fifth_town_oracle import fifth_town_driver
from build_sixth_town_oracle import ECONOMY_AS3
from build_town_preparation_oracle import original_preparation_method
from build_wave_oracle import shared_driver_methods


def seventh_town_driver():
    driver = fifth_town_driver().replace('fifth-town', 'seventh-town')
    driver = driver.replace('day:5,missionLevel:5', 'day:7,missionLevel:7').replace('game.day=5;', 'game.day=7;')
    driver = driver.replace('synchronous-original-frame71-preparation', 'synchronous-original-town-preparation-and-economy')
    driver = driver.replace('medal[_medalNoDamage2]=true;', 'medal[_medalNoDamage2]=true; medal[_medalNoDamage3]=true;')
    driver = driver.replace('history == "medal" ? 0.02 : 0', 'history == "medal" ? 0.03 : 0')
    driver = driver.replace('targetLevel:int=3)', 'targetLevel:int=4,levelRoll:Number=0.99,probe:String="class")')
    driver = driver.replace('targetLevel == 2 ? 0 : 0.99', 'levelRoll')
    driver = driver.replace('targetLevel:targetLevel,', 'targetLevel:targetLevel,levelRoll:levelRoll,probe:probe,')
    old_calls = '            oracleRecruitGrowthCase(6,false,2);'
    assert driver.count(old_calls) == 1
    driver = driver.replace(old_calls, '''            oracleRecruitGrowthCase(6,false,2,10.0/21.0-0.00000001,"below-10/21");
            oracleRecruitGrowthCase(6,false,3,10.0/21.0+0.00000001,"above-10/21");
            oracleRecruitGrowthCase(6,false,3,20.0/21.0-0.00000001,"below-20/21");
            oracleRecruitGrowthCase(6,false,4,20.0/21.0+0.00000001,"above-20/21");
            oracleRunEconomy();''')
    economy = ECONOMY_AS3.replace('sixth-town', 'seventh-town')
    begin, end = method_span(economy, 'oracleRunEconomy')
    economy = economy[:begin] + r'''
         var seed:Number;
         for each(seed in [42,1,3735928559]) {
            oracleEconomyResult(uint(seed),7,false,0);
            oracleEconomyResult(uint(seed),7,true,0);
            oracleEconomyResult(uint(seed),7,false,1);
            oracleEconomyResult(uint(seed),7,true,1);
         }
         gameStage=_stageTown; menuId=2; page=0; upgradeCount=0;
         window2_mc.gotoAndStop("menu_castle");
         window2_mc.visible=true; window2_mc.x=0; window2_mc.y=-26; stage.addChild(window2_mc);
         oracleEconomyReset(42,7); game.ap=4; oraclePreparationActive=true;
         var eligible:Boolean=newTitle(0);
         oracleEconomyAction("claim_sequence","eligibility",0,eligible);
         if(eligible) showEventDialog(_dialogActClaim);
         oracleEconomyAction("claim_sequence","claim",1,eligible);
         var dialog:MovieClip=stage.getChildByName("eventWindow") as MovieClip;
         if(dialog == null) throw new Error("Original Claim Title did not create its event window");
         procEventDialog(dialog);
         oracleEconomyAction("claim_sequence","acknowledge",2,newTitle(0));
         game.ap=4; eligible=newTitle(0);
         if(eligible) showEventDialog(_dialogActClaim);
         oracleEconomyAction("claim_sequence","repeat",3,eligible);
         oracleEconomyReset(42,7); game.ap=3; oraclePreparationActive=true;
         eligible=newTitle(0); if(eligible) showEventDialog(_dialogActClaim);
         oracleEconomyAction("low_ap","claim",0,eligible);
         oracleEconomyReset(42,7); game.ap=4; game.title=1; game.titleMoney=100; oraclePreparationActive=true;
         eligible=newTitle(0); if(eligible) showEventDialog(_dialogActClaim);
         oracleEconomyAction("inherited_title","claim",0,eligible);
         oraclePreparationActive=false;
''' + economy[end:]
    return driver + economy


def main():
    out = ROOT / '.build/oracle'; out.mkdir(parents=True, exist_ok=True)
    report = {'status': 'failed', 'kind': 'seventh-town', 'rng': 'xorshift32',
              'save_io_replaced_by_observation': True, 'preparation_block_extracted_from_frame71': True,
              'retained_militia_slots': [45, 47, 48], 'calendar_day': 7,
              'controlled_recruit_prefix_advances_underlying_rng': True,
              'town_cases': 6, 'recruit_growth_cases': 14, 'result_cases': 12, 'title_cases': 6,
              'boundary': 'Day7 town preparation, recruit growth, result and Claim Title; no Day8 combat'}
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
        instrumented = instrumented[:closing] + '\n' + shared_driver_methods() + seventh_town_driver() + preparation + instrumented[closing:]
        generated = out / 'SeventhTownMainTimeline.as'; generated.write_text(instrumented, encoding='utf-8')
        candidate = out / ('seventh-town-compiled-' + uuid.uuid4().hex + '.swf')
        result = command([find_java(None), '-Xmx1g', '-jar', str(ROOT / '.tools/ffdec/ffdec.jar'), '-replace', str(original_path), str(candidate), 'shootem_fla.MainTimeline', str(generated)], timeout=240)
        (out / 'seventh-town-build.log').write_text(result.stdout, encoding='utf-8')
        if result.returncode or not candidate.is_file():
            raise RuntimeError('Sixth-town oracle compilation failed; inspect seventh-town-build.log')
        output = bytearray(candidate.read_bytes()); output[3] = 10
        report.update(verify(original, output))
        reference = out / 'seventh-town-reference.swf'; reference.write_bytes(output)
        if original_path.read_bytes() != original or source_path.read_bytes() != source_bytes:
            raise RuntimeError('A preserved input changed during oracle generation')
        report.update(status='passed', original_sha256=digest(original), source_sha256=digest(source_bytes), output_sha256=digest(output),
                      output=str(reference.relative_to(ROOT)).replace('\\', '/'), output_bytes=len(output), original_method_logic_preserved=True, runtime_validated=False)
    except Exception as error:
        report['error'] = str(error)
    (out / 'seventh-town-build-report.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, indent=2))
    return 0 if report['status'] == 'passed' else 1


if __name__ == '__main__':
    raise SystemExit(main())
