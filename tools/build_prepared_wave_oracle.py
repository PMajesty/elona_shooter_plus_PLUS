"""Собирает независимый эталон волн дня 2 из миссии, подготовленной вечером дня 1."""
import json
import uuid

from build import ROOT, ORIGINAL_SHA256, command, digest, find_java, verify
from build_wave_oracle import WAVE_AS3, instrument


MISSION_SNAPSHOT = r'''
      private function oraclePreparedMission() : Object
      {
         var fields:Array=["level","fixedLv","strength","power","powerOrg","reward","hire","ragnarok","wave","spawnRate","group","waveType","loot","newWave","time","bossDay","bossWave","note","hpFix","dmgFix","expFix","absorbFix","bossKilled","noDamage","criticalCount","resultOther"];
         var result:Object={};
         var field:String;
         for each(field in fields) result[field]=mission[field] is Array ? mission[field].concat() : mission[field];
         return result;
      }
'''


def prepared_driver():
    driver = WAVE_AS3.replace('kind:"waves"', 'kind:"prepared-waves"')
    driver = driver.replace('clock:"synchronous-original-generation"', 'clock:"synchronous-original-prepared-waves"')
    driver = driver.replace('oracleRunWaves', 'oracleRunPreparedWaves')
    boundary = '         generateMission(0);\n         preGenerateWave();'
    if driver.count(boundary) != 1:
        raise ValueError("Original wave diagnostic boundary changed")
    driver = driver.replace(boundary, '''         generateMission(1);
         var missionBefore:Object=oraclePreparedMission();
         var preparationDrawCount:int=oracleWaveDraws;
         var preparationRngState:uint=oracleWaveState;
         game.day=2;
         preGenerateWave();''')
    marker = 'spawnRate:mission.spawnRate});'
    if driver.count(marker) != 1:
        raise ValueError("Original wave diagnostic snapshot changed")
    driver = driver.replace(marker, 'spawnRate:mission.spawnRate,preparationDay:1,missionBefore:missionBefore,missionAfter:oraclePreparedMission(),preparationDrawCount:preparationDrawCount,preparationRngState:preparationRngState});')
    return driver + MISSION_SNAPSHOT


def main():
    out = ROOT / '.build/oracle'
    out.mkdir(parents=True, exist_ok=True)
    report = {'status': 'failed', 'kind': 'prepared-waves', 'seeds': [42, 1, 3735928559],
              'rng': 'xorshift32', 'rng_boundary': 'generateMission(1) on calendar day1, then preGenerateWave() on calendar day2',
              'source_generation_methods_unmodified': True, 'rest_dialog_excluded': True}
    try:
        original_path = ROOT / 'original/elonashooter1.3.swf'
        source_path = ROOT / 'src/shootem_fla/MainTimeline.as'
        original, source = original_path.read_bytes(), source_path.read_bytes()
        if digest(original) != ORIGINAL_SHA256:
            raise ValueError('Preserved original fingerprint differs')
        injected, calls = instrument(source.decode('utf-8-sig'))
        if injected.count(WAVE_AS3) != 1:
            raise ValueError('Shared wave diagnostic injection changed')
        injected = injected.replace(WAVE_AS3, prepared_driver())
        generated = out / 'PreparedWavesMainTimeline.as'
        generated.write_text(injected, encoding='utf-8')
        java = find_java(None)
        candidate = out / ('prepared-waves-compiled-' + uuid.uuid4().hex + '.swf')
        result = command([java, '-Xmx1g', '-jar', str(ROOT / '.tools/ffdec/ffdec.jar'), '-replace',
                          str(original_path), str(candidate), 'shootem_fla.MainTimeline', str(generated)], timeout=240)
        (out / 'prepared-waves-build.log').write_text(result.stdout, encoding='utf-8')
        if result.returncode or not candidate.is_file():
            raise RuntimeError('FFDec compilation failed; inspect prepared-waves-build.log')
        output = bytearray(candidate.read_bytes())
        output[3] = 10
        report.update(verify(original, output))
        reference = out / 'prepared-waves-reference.swf'
        reference.write_bytes(output)
        if original_path.read_bytes() != original or source_path.read_bytes() != source:
            raise RuntimeError('A preserved input changed during oracle generation')
        report.update(status='passed', original_sha256=digest(original), source_sha256=digest(source),
                      instrumented_source_sha256=digest(generated.read_bytes()), output_sha256=digest(output),
                      output=str(reference.relative_to(ROOT)).replace('\\', '/'), output_bytes=len(output),
                      intercepted_main_timeline_random_calls=calls, runtime_validated=False)
    except Exception as error:
        report['error'] = str(error)
    (out / 'prepared-waves-build-report.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, indent=2))
    return 0 if report['status'] == 'passed' else 1


if __name__ == '__main__':
    raise SystemExit(main())
