"""Эталон города 8: исходная подготовка, границы найма и первое оружие Mk-3."""
import json
import uuid

from build import ROOT, ORIGINAL_SHA256, command, digest, find_java, verify
from build_oracle import instrument_startup, method_span
from build_seventh_town_oracle import seventh_town_driver
from build_town_preparation_oracle import original_preparation_method
from build_wave_oracle import shared_driver_methods


VARIATION_AS3 = r'''
      private function oracleVariationCase(day:int,roll:Number,probe:String) : void {
         oraclePreparationActive=true; oraclePreparationForced=null;
         game.day=day; game.optWeaponLevel=false;
         oraclePreparationState=42; oraclePreparationDraws=0;
         oraclePreparationClearSlot(0); generateStuff(0,3);
         var before:Object=oraclePreparationItem(0);
         oraclePreparationState=42; oraclePreparationDraws=0; oraclePreparationForced=[roll];
         weaponVariation(0,-1);
         oraclePreparationForced=null; oraclePreparationActive=false;
         oracleEmit({type:"snapshot",kind:"eighth-town",boundary:"weapon-variation",seed:42,day:day,
            roll:roll,probe:probe,before:before,after:oraclePreparationItem(0),drawCount:oraclePreparationDraws,rngState:oraclePreparationState});
         ++oraclePreparationSnapshots;
      }
'''


def eighth_town_driver():
    driver = seventh_town_driver().replace('seventh-town', 'eighth-town')
    driver = driver.replace('day:7,missionLevel:7', 'day:8,missionLevel:8').replace('game.day=7;', 'game.day=8;')
    driver = driver.replace('10.0/21.0', '5.0/12.0').replace('20.0/21.0', '5.0/6.0')
    driver = driver.replace('10/21', '5/12').replace('20/21', '5/6')
    class_calls = '''            var classId:int;
            for(classId=1;classId<=9;classId++) oracleRecruitGrowthCase(classId,false);
            oracleRecruitGrowthCase(6,true);
'''
    assert driver.count(class_calls) == 1
    driver = driver.replace(class_calls, '')
    driver = driver.replace('            oracleRunEconomy();', '''            oracleVariationCase(7,0.99,"day7-cap");
            oracleVariationCase(8,5.0/9.0-0.00000001,"below-5/9");
            oracleVariationCase(8,5.0/9.0+0.00000001,"above-5/9");
            oracleVariationCase(8,0.99,"day8-cap");
            oracleRunEconomy();''')
    begin, end = method_span(driver, 'oracleRunEconomy')
    driver = driver[:begin] + r'''
         oracleEconomyResult(42,8,false,0);
         oracleEconomyResult(42,8,true,0);
         oracleEconomyResult(42,8,false,1);
         oracleEconomyResult(42,8,true,1);
         oraclePreparationActive=false;
''' + driver[end:]
    return driver + VARIATION_AS3


def main():
    out = ROOT / '.build/oracle'; out.mkdir(parents=True, exist_ok=True)
    report = {'status': 'failed', 'kind': 'eighth-town', 'rng': 'xorshift32',
              'save_io_replaced_by_observation': True, 'preparation_block_extracted_from_frame71': True,
              'retained_militia_slots': [45, 47, 48], 'calendar_day': 8,
              'controlled_recruit_prefix_advances_underlying_rng': True,
              'town_cases': 6, 'recruit_growth_cases': 4, 'weapon_variation_cases': 4, 'result_cases': 4,
              'boundary': 'Day8 town preparation, recruit thresholds, Mk3 variation and result; no Day9 combat'}
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
        instrumented = instrumented[:closing] + '\n' + shared_driver_methods() + eighth_town_driver() + preparation + instrumented[closing:]
        generated = out / 'EighthTownMainTimeline.as'; generated.write_text(instrumented, encoding='utf-8')
        candidate = out / ('eighth-town-compiled-' + uuid.uuid4().hex + '.swf')
        result = command([find_java(None), '-Xmx1g', '-jar', str(ROOT / '.tools/ffdec/ffdec.jar'), '-replace', str(original_path), str(candidate), 'shootem_fla.MainTimeline', str(generated)], timeout=240)
        (out / 'eighth-town-build.log').write_text(result.stdout, encoding='utf-8')
        if result.returncode or not candidate.is_file():
            raise RuntimeError('Eighth-town oracle compilation failed; inspect eighth-town-build.log')
        output = bytearray(candidate.read_bytes()); output[3] = 10
        report.update(verify(original, output))
        reference = out / 'eighth-town-reference.swf'; reference.write_bytes(output)
        if original_path.read_bytes() != original or source_path.read_bytes() != source_bytes:
            raise RuntimeError('A preserved input changed during oracle generation')
        report.update(status='passed', original_sha256=digest(original), source_sha256=digest(source_bytes), output_sha256=digest(output),
                      output=str(reference.relative_to(ROOT)).replace('\\', '/'), output_bytes=len(output), original_method_logic_preserved=True, runtime_validated=False)
    except Exception as error:
        report['error'] = str(error)
    (out / 'eighth-town-build-report.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, indent=2))
    return 0 if report['status'] == 'passed' else 1


if __name__ == '__main__':
    raise SystemExit(main())
