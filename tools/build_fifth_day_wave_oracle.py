"""Эталон миссии 4: AIR/BATCH1, исходный выбор Fly и дополнительный fallback-бросок."""
import json
import uuid

from build import ROOT, ORIGINAL_SHA256, command, digest, find_java, verify
from build_oracle import method_span
from build_wave_oracle import WAVE_AS3, instrument
from build_fourth_day_wave_oracle import fourth_day_driver


def fifth_day_driver():
    driver = fourth_day_driver().replace('fourth-day-waves', 'fifth-day-waves')
    driver = driver.replace('oracleRunFourthDayWaves', 'oracleRunFifthDayWaves')
    driver = driver.replace('oracleWaveCase(3735928559);', 'oracleWaveCase(3735928559);\n            oracleWaveCase(2);')
    driver = driver.replace('seeds:[42,1,3735928559]', 'seeds:[42,1,3735928559,2]')
    driver = driver.replace('game.day = 3;', 'game.day = 4;')
    driver = driver.replace('generateMission(3);', 'generateMission(4);')
    driver = driver.replace('game.day=4;', 'game.day=5;')
    driver = driver.replace('preparationDay:3,', 'preparationDay:4,')
    driver = driver.replace('private var oracleWaveConstant:Number=-1;', 'private var oracleWaveConstant:Number=-1;\n      private var oracleWavePrefix:Array=[];')
    driver = driver.replace('if(oracleWaveConstant >= 0)', 'if(oracleWaveDraws < oracleWavePrefix.length) return Number(oracleWavePrefix[oracleWaveDraws++]);\n         if(oracleWaveConstant >= 0)')
    driver = driver.replace('constant:Number=-1)', 'constant:Number=-1,prefix:Array=null)')
    driver = driver.replace('oracleWaveConstant=constant;', 'oracleWaveConstant=constant; oracleWavePrefix=prefix==null ? [] : prefix.concat();')
    driver = driver.replace('constantValue:constant < 0 ? null : constant,', 'constantValue:constant < 0 ? null : constant,randomPrefix:oracleWavePrefix.concat(),')
    driver = driver.replace('            gamePaused = true;\n            oracleEmit({type:"complete"', '            oracleWaveCase(42,"scripted-batch1",0,[0.5,0.5,0.5,0]);\n            gamePaused = true;\n            oracleEmit({type:"complete"')
    driver = driver.replace('snapshots:7,', 'snapshots:9,')
    driver = driver.replace('constantCases:[0,0.099999,0.1,0.99]', 'constantCases:[0,0.099999,0.1,0.99],prefixCases:[[0.5,0.5,0.5,0]]')
    return driver


def main():
    out = ROOT / '.build/oracle'; out.mkdir(parents=True, exist_ok=True)
    report = {'status': 'failed', 'kind': 'fifth-day-waves', 'seeds': [42, 1, 3735928559, 2],
              'rng': 'xorshift32 plus separately labeled constants and a BATCH1 prefix boundary input',
              'rng_boundary': 'generateMission(4) on calendar day4, then preGenerateWave() on calendar day5',
              'source_generation_methods_unmodified': True, 'rest_dialog_excluded': True}
    try:
        original_path, source_path = ROOT / 'original/elonashooter1.3.swf', ROOT / 'src/shootem_fla/MainTimeline.as'
        original, source = original_path.read_bytes(), source_path.read_bytes()
        if digest(original) != ORIGINAL_SHA256:
            raise ValueError('Preserved original SWF fingerprint differs')
        injected, calls = instrument(source.decode('utf-8-sig'))
        if injected.count(WAVE_AS3) != 1:
            raise ValueError('Shared wave diagnostic injection changed')
        injected = injected.replace(WAVE_AS3, fifth_day_driver())
        begin, end = method_span(injected, 'selectEnemy')
        body = injected[begin:end]
        before = '\n         var oracleStartDraw:int=oracleWaveDraws;\n         var oracleStartCount:int=pop[param4].length;'
        after = '\n         if(oracleWaveActive) oracleWaveSelections.push({wave:param4,requestedLevel:param1,budget:param2,flags:param3.concat(),ids:pop[param4].slice(oracleStartCount),drawBefore:oracleStartDraw,drawAfter:oracleWaveDraws});'
        injected = injected[:begin] + before + body + after + injected[end:]
        begin, end = method_span(injected, 'generateWave')
        body = injected[begin:end]
        after = '\n         if(oracleWaveActive) oracleWaveBranches.push({wave:param1,debugGroup:debugGroup,drawAfter:oracleWaveDraws});'
        injected = injected[:begin] + body + after + injected[end:]
        generated = out / 'FifthDayWavesMainTimeline.as'; generated.write_text(injected, encoding='utf-8')
        candidate = out / ('fifth-day-waves-compiled-' + uuid.uuid4().hex + '.swf')
        result = command([find_java(None), '-Xmx1g', '-jar', str(ROOT / '.tools/ffdec/ffdec.jar'), '-replace',
                          str(original_path), str(candidate), 'shootem_fla.MainTimeline', str(generated)], timeout=240)
        (out / 'fifth-day-waves-build.log').write_text(result.stdout, encoding='utf-8')
        if result.returncode or not candidate.is_file():
            raise RuntimeError('Fifth-day wave compilation failed; inspect fifth-day-waves-build.log')
        output = bytearray(candidate.read_bytes()); output[3] = 10
        report.update(verify(original, output))
        reference = out / 'fifth-day-waves-reference.swf'; reference.write_bytes(output)
        if original_path.read_bytes() != original or source_path.read_bytes() != source:
            raise RuntimeError('Preserved inputs changed during oracle generation')
        report.update(status='passed', original_sha256=digest(original), source_sha256=digest(source),
                      output_sha256=digest(output), output=str(reference.relative_to(ROOT)).replace('\\', '/'),
                      output_bytes=len(output), intercepted_main_timeline_random_calls=calls, runtime_validated=False)
    except Exception as error:
        report['error'] = str(error)
    (out / 'fifth-day-waves-build-report.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, indent=2))
    return 0 if report['status'] == 'passed' else 1


if __name__ == '__main__':
    raise SystemExit(main())
