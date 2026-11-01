"""Эталон миссии 2: шестигрупповые волны дня 3 и граничные значения исходного RNG."""
import json
import uuid

from build import ROOT, ORIGINAL_SHA256, command, digest, find_java, verify
from build_oracle import method_span
from build_wave_oracle import WAVE_AS3, instrument
from build_prepared_wave_oracle import MISSION_SNAPSHOT


def third_day_driver():
    driver = WAVE_AS3.replace('kind:"waves"', 'kind:"third-day-waves"')
    driver = driver.replace('clock:"synchronous-original-generation"', 'clock:"synchronous-original-third-day-waves"')
    driver = driver.replace('oracleRunWaves', 'oracleRunThirdDayWaves')
    driver = driver.replace('private var oraclePhase:int = -1;', 'private var oraclePhase:int = -1;\n      private var oracleWaveConstant:Number=-1;\n      private var oracleWaveSelections:Array=[];')
    driver = driver.replace('if(!oracleWaveActive) return Math.random();', 'if(!oracleWaveActive) return Math.random();\n         if(oracleWaveConstant >= 0) { ++oracleWaveDraws; return oracleWaveConstant; }')
    driver = driver.replace('private function oracleWaveCase(seed:uint)', 'private function oracleWaveCase(seed:uint,mode:String="xorshift32",constant:Number=-1)')
    driver = driver.replace('game.day = 1;', 'game.day = 2;')
    driver = driver.replace('oracleWaveDraws = 0;', 'oracleWaveDraws = 0; oracleWaveConstant=constant; oracleWaveSelections=[];')
    boundary = '         generateMission(0);\n         preGenerateWave();'
    if driver.count(boundary) != 1:
        raise ValueError('Original wave diagnostic boundary changed')
    driver = driver.replace(boundary, '''         generateMission(2);
         var missionBefore:Object=oraclePreparedMission();
         var preparationDrawCount:int=oracleWaveDraws;
         var preparationRngState:uint=oracleWaveState;
         game.day=3;
         preGenerateWave();''')
    driver = driver.replace('spawnRate:mission.spawnRate});', 'spawnRate:mission.spawnRate,preparationDay:2,mode:mode,constantValue:constant < 0 ? null : constant,missionBefore:missionBefore,missionAfter:oraclePreparedMission(),preparationDrawCount:preparationDrawCount,preparationRngState:preparationRngState,selections:oracleWaveSelections.concat()});')
    driver = driver.replace('            gamePaused = true;\n            oracleEmit({type:"complete"', '            oracleWaveCase(42,"constant-zero",0);\n            oracleWaveCase(42,"constant-high",0.99);\n            gamePaused = true;\n            oracleEmit({type:"complete"')
    driver = driver.replace('snapshots:3,seeds:', 'snapshots:5,seeds:')
    driver = driver.replace('clock:"synchronous-original-third-day-waves"});', 'clock:"synchronous-original-third-day-waves",constantCases:[0,0.99]});')
    return driver + MISSION_SNAPSHOT


def main():
    out = ROOT / '.build/oracle'; out.mkdir(parents=True, exist_ok=True)
    report = {'status': 'failed', 'kind': 'third-day-waves', 'seeds': [42, 1, 3735928559],
              'rng': 'xorshift32 plus separately labeled constant0/0.99 boundary inputs',
              'rng_boundary': 'generateMission(2) on calendar day2, then preGenerateWave() on calendar day3',
              'source_generation_methods_unmodified': True, 'rest_dialog_excluded': True}
    try:
        original_path, source_path = ROOT / 'original/elonashooter1.3.swf', ROOT / 'src/shootem_fla/MainTimeline.as'
        original, source = original_path.read_bytes(), source_path.read_bytes()
        if digest(original) != ORIGINAL_SHA256:
            raise ValueError('Preserved original SWF fingerprint differs')
        injected, calls = instrument(source.decode('utf-8-sig'))
        if injected.count(WAVE_AS3) != 1:
            raise ValueError('Shared wave diagnostic injection changed')
        injected = injected.replace(WAVE_AS3, third_day_driver())
        begin, end = method_span(injected, 'selectEnemy')
        body = injected[begin:end]
        before = '\n         var oracleStartDraw:int=oracleWaveDraws;\n         var oracleStartCount:int=pop[param4].length;'
        after = '\n         if(oracleWaveActive) oracleWaveSelections.push({wave:param4,requestedLevel:param1,budget:param2,flags:param3.concat(),ids:pop[param4].slice(oracleStartCount),drawBefore:oracleStartDraw,drawAfter:oracleWaveDraws});'
        injected = injected[:begin] + before + body + after + injected[end:]
        if (before + body + after).replace(before, '').replace(after, '') != body:
            raise ValueError('Original selector logic changed')
        generated = out / 'ThirdDayWavesMainTimeline.as'; generated.write_text(injected, encoding='utf-8')
        candidate = out / ('third-day-waves-compiled-' + uuid.uuid4().hex + '.swf')
        result = command([find_java(None), '-Xmx1g', '-jar', str(ROOT / '.tools/ffdec/ffdec.jar'), '-replace',
                          str(original_path), str(candidate), 'shootem_fla.MainTimeline', str(generated)], timeout=240)
        (out / 'third-day-waves-build.log').write_text(result.stdout, encoding='utf-8')
        if result.returncode or not candidate.is_file():
            raise RuntimeError('Third-day wave compilation failed; inspect third-day-waves-build.log')
        output = bytearray(candidate.read_bytes()); output[3] = 10
        report.update(verify(original, output))
        reference = out / 'third-day-waves-reference.swf'; reference.write_bytes(output)
        if original_path.read_bytes() != original or source_path.read_bytes() != source:
            raise RuntimeError('Preserved inputs changed during oracle generation')
        report.update(status='passed', original_sha256=digest(original), source_sha256=digest(source),
                      output_sha256=digest(output), output=str(reference.relative_to(ROOT)).replace('\\', '/'),
                      output_bytes=len(output), intercepted_main_timeline_random_calls=calls, runtime_validated=False)
    except Exception as error:
        report['error'] = str(error)
    (out / 'third-day-waves-build-report.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, indent=2))
    return 0 if report['status'] == 'passed' else 1


if __name__ == '__main__':
    raise SystemExit(main())
