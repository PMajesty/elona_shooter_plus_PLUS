"""Эталон города9: порядок подготовки, первая bossDay-миссия и календарные гарантии."""
import json
import uuid

from build import ROOT, ORIGINAL_SHA256, command, digest, find_java, verify
from build_oracle import instrument_startup, method_span
from build_eighth_town_oracle import eighth_town_driver
from build_town_preparation_oracle import original_preparation_method
from build_wave_oracle import shared_driver_methods


MISSION_AS3 = r'''
      private function oracleMissionCase(day:int,roll:Number,probe:String) : void {
         var index:int; var field:String; var prepared:Object={};
         oraclePreparationActive=false; oraclePreparationForced=null;
         game.day=day; game.casual=false; game.MORE=false;
         for(index=0;index<_maxMedal;index++) medal[index]=false;
         for(index=1;index<maxAlly;index++) player.exist[index]=false;
         mission={}; oraclePreparationState=42; oraclePreparationDraws=0;
         oraclePreparationForced=[roll]; oraclePreparationActive=true;
         generateMission(day);
         oraclePreparationForced=null; oraclePreparationActive=false;
         for each(field in oraclePreparationMissionFields) prepared[field]=mission[field];
         oracleEmit({type:"snapshot",kind:"ninth-town",boundary:"mission",seed:42,day:day,
            roll:roll,probe:probe,mission:prepared,drawCount:oraclePreparationDraws,rngState:oraclePreparationState});
         ++oraclePreparationSnapshots;
      }
'''


def ninth_town_driver():
    driver = eighth_town_driver().replace('eighth-town', 'ninth-town')
    driver = driver.replace('day:8,missionLevel:8', 'day:9,missionLevel:9').replace('game.day=8;', 'game.day=9;')
    driver = driver.replace('5.0/12.0', '10.0/27.0').replace('5.0/6.0', '20.0/27.0')
    driver = driver.replace('5/12', '10/27').replace('5/6', '20/27')
    driver = driver.replace('oracleVariationCase(7,0.99,"day7-cap")', 'oracleVariationCase(8,0.99,"day8-cap")')
    driver = driver.replace('oracleVariationCase(8,5.0/9.0', 'oracleVariationCase(9,10.0/19.0')
    driver = driver.replace('below-5/9', 'below-10/19').replace('above-5/9', 'above-10/19')
    # Последний cap остаётся отдельным контролем дня9, не заменяя предыдущий день8.
    old = 'oracleVariationCase(8,0.99,"day8-cap");\n            oracleRunEconomy();'
    assert driver.count(old) == 1
    driver = driver.replace(old, '''oracleVariationCase(9,0.99,"day9-cap");
            oracleMissionCase(8,0.5,"day8-normal");
            oracleMissionCase(9,0.5,"day9-boss");
            oracleMissionCase(8,0.99,"day8-optional");
            oracleMissionCase(9,0.99,"day9-optional");
            oracleRunEconomy();''')
    driver = driver.replace('oracleEconomyResult(42,8,', 'oracleEconomyResult(42,9,')
    return driver + MISSION_AS3


def main():
    out = ROOT / '.build/oracle'; out.mkdir(parents=True, exist_ok=True)
    report = {'status': 'failed', 'kind': 'ninth-town', 'rng': 'xorshift32',
              'save_io_replaced_by_observation': True, 'preparation_block_extracted_from_frame71': True,
              'retained_militia_slots': [45, 47, 48], 'calendar_day': 9,
              'controlled_recruit_prefix_advances_underlying_rng': True,
              'town_cases': 6, 'recruit_growth_cases': 4, 'weapon_variation_cases': 4,
              'mission_cases': 4, 'result_cases': 4,
              'boundary': 'Day9 ordered town preparation, prior mission8/first bossDay9, recruit thresholds, variation and result; no Day10 combat'}
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
        instrumented = instrumented[:closing] + '\n' + shared_driver_methods() + ninth_town_driver() + preparation + instrumented[closing:]
        generated = out / 'NinthTownMainTimeline.as'; generated.write_text(instrumented, encoding='utf-8')
        candidate = out / ('ninth-town-compiled-' + uuid.uuid4().hex + '.swf')
        result = command([find_java(None), '-Xmx1g', '-jar', str(ROOT / '.tools/ffdec/ffdec.jar'), '-replace', str(original_path), str(candidate), 'shootem_fla.MainTimeline', str(generated)], timeout=240)
        (out / 'ninth-town-build.log').write_text(result.stdout, encoding='utf-8')
        if result.returncode or not candidate.is_file():
            raise RuntimeError('Ninth-town oracle compilation failed; inspect ninth-town-build.log')
        output = bytearray(candidate.read_bytes()); output[3] = 10
        report.update(verify(original, output))
        reference = out / 'ninth-town-reference.swf'; reference.write_bytes(output)
        if original_path.read_bytes() != original or source_path.read_bytes() != source_bytes:
            raise RuntimeError('A preserved input changed during oracle generation')
        report.update(status='passed', original_sha256=digest(original), source_sha256=digest(source_bytes), output_sha256=digest(output),
                      output=str(reference.relative_to(ROOT)).replace('\\', '/'), output_bytes=len(output), original_method_logic_preserved=True, runtime_validated=False)
    except Exception as error:
        report['error'] = str(error)
    (out / 'ninth-town-build-report.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, indent=2))
    return 0 if report['status'] == 'passed' else 1


if __name__ == '__main__':
    raise SystemExit(main())
