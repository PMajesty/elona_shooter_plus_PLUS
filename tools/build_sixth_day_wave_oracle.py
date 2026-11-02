"""Эталон миссии 5: Barbarian в обычных группах, AIR/BATCH1 и исходный порядок RNG."""
import json
import uuid

from build import ROOT, ORIGINAL_SHA256, command, digest, find_java, verify
from build_oracle import method_span
from build_wave_oracle import WAVE_AS3, instrument
from build_fifth_day_wave_oracle import fifth_day_driver


def sixth_day_driver():
    driver = fifth_day_driver()
    replacements = {
        'fifth-day-waves': 'sixth-day-waves',
        'oracleRunFifthDayWaves': 'oracleRunSixthDayWaves',
        'game.day = 4;': 'game.day = 5;',
        'generateMission(4);': 'generateMission(5);',
        'game.day=5;': 'game.day=6;',
        'preparationDay:4,': 'preparationDay:5,',
    }
    for before, after in replacements.items():
        if before not in driver:
            raise ValueError('Shared diagnostic boundary changed: ' + before)
        driver = driver.replace(before, after)
    return driver


def main():
    out = ROOT / '.build/oracle'; out.mkdir(parents=True, exist_ok=True)
    report = {'status': 'failed', 'kind': 'sixth-day-waves', 'seeds': [42, 1, 3735928559, 2],
              'rng': 'xorshift32 plus separately labeled constants and a BATCH1 prefix boundary input',
              'rng_boundary': 'generateMission(5) on calendar day5, then preGenerateWave() on calendar day6',
              'source_generation_methods_unmodified': True, 'rest_dialog_excluded': True}
    try:
        original_path, source_path = ROOT / 'original/elonashooter1.3.swf', ROOT / 'src/shootem_fla/MainTimeline.as'
        original, source = original_path.read_bytes(), source_path.read_bytes()
        if digest(original) != ORIGINAL_SHA256:
            raise ValueError('Preserved original SWF fingerprint differs')
        injected, calls = instrument(source.decode('utf-8-sig'))
        if injected.count(WAVE_AS3) != 1:
            raise ValueError('Shared wave diagnostic injection changed')
        injected = injected.replace(WAVE_AS3, sixth_day_driver())
        begin, end = method_span(injected, 'selectEnemy')
        body = injected[begin:end]
        before = '\n         var oracleStartDraw:int=oracleWaveDraws;\n         var oracleStartCount:int=pop[param4].length;'
        after = '\n         if(oracleWaveActive) oracleWaveSelections.push({wave:param4,requestedLevel:param1,budget:param2,flags:param3.concat(),ids:pop[param4].slice(oracleStartCount),drawBefore:oracleStartDraw,drawAfter:oracleWaveDraws});'
        injected = injected[:begin] + before + body + after + injected[end:]
        begin, end = method_span(injected, 'generateWave')
        body = injected[begin:end]
        after = '\n         if(oracleWaveActive) oracleWaveBranches.push({wave:param1,debugGroup:debugGroup,drawAfter:oracleWaveDraws});'
        injected = injected[:begin] + body + after + injected[end:]
        generated = out / 'SixthDayWavesMainTimeline.as'; generated.write_text(injected, encoding='utf-8')
        candidate = out / ('sixth-day-waves-compiled-' + uuid.uuid4().hex + '.swf')
        result = command([find_java(None), '-Xmx1g', '-jar', str(ROOT / '.tools/ffdec/ffdec.jar'), '-replace',
                          str(original_path), str(candidate), 'shootem_fla.MainTimeline', str(generated)], timeout=240)
        (out / 'sixth-day-waves-build.log').write_text(result.stdout, encoding='utf-8')
        if result.returncode or not candidate.is_file():
            raise RuntimeError('Sixth-day wave compilation failed; inspect sixth-day-waves-build.log')
        output = bytearray(candidate.read_bytes()); output[3] = 10
        report.update(verify(original, output))
        reference = out / 'sixth-day-waves-reference.swf'; reference.write_bytes(output)
        if original_path.read_bytes() != original or source_path.read_bytes() != source:
            raise RuntimeError('Preserved inputs changed during oracle generation')
        report.update(status='passed', original_sha256=digest(original), source_sha256=digest(source),
                      output_sha256=digest(output), output=str(reference.relative_to(ROOT)).replace('\\', '/'),
                      output_bytes=len(output), intercepted_main_timeline_random_calls=calls, runtime_validated=False)
    except Exception as error:
        report['error'] = str(error)
    (out / 'sixth-day-waves-build-report.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, indent=2))
    return 0 if report['status'] == 'passed' else 1


if __name__ == '__main__':
    raise SystemExit(main())
