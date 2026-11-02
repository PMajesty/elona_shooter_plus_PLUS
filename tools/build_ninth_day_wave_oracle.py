"""Исходные волны Day9: четвёртый fallback-бросок, границы Barbarian и обычные волны."""
import json
import uuid

from build import ROOT, ORIGINAL_SHA256, command, digest, find_java, verify
from build_oracle import method_span
from build_wave_oracle import WAVE_AS3, instrument
from build_eighth_day_wave_oracle import eighth_day_driver


def ninth_day_driver():
    driver=eighth_day_driver()
    replacements={
        'eighth-day-waves':'ninth-day-waves',
        'oracleRunEighthDayWaves':'oracleRunNinthDayWaves',
        'game.day = 7;':'game.day = 8;',
        'generateMission(7);':'generateMission(8);',
        'game.day=8;':'game.day=9;',
        'preparationDay:7,':'preparationDay:8,',
    }
    for before,after in replacements.items():
        if before not in driver:raise ValueError('Shared diagnostic boundary changed: '+before)
        driver=driver.replace(before,after)
    driver=driver.replace('snapshots:10,','snapshots:12,')
    driver=driver.replace('private var oracleWaveDraws:int = 0;', 'private var oracleWaveDraws:int = 0;\n      private var oracleWaveDrawValues:Array=[];')
    driver=driver.replace('if(oracleWaveDraws < oracleWavePrefix.length) return Number(oracleWavePrefix[oracleWaveDraws++]);', 'if(oracleWaveDraws < oracleWavePrefix.length) { var prefixValue:Number=Number(oracleWavePrefix[oracleWaveDraws++]); oracleWaveDrawValues.push(prefixValue); return prefixValue; }')
    driver=driver.replace('++oracleWaveDraws; return oracleWaveConstant;', '++oracleWaveDraws; oracleWaveDrawValues.push(oracleWaveConstant); return oracleWaveConstant;')
    driver=driver.replace('return Number(oracleWaveState) / 4294967296.0;', 'var result:Number=Number(oracleWaveState) / 4294967296.0; oracleWaveDrawValues.push(result); return result;')
    driver=driver.replace('oracleWaveDraws = 0; oracleWaveConstant=', 'oracleWaveDraws = 0; oracleWaveDrawValues=[]; oracleWaveConstant=')
    driver=driver.replace('selections:oracleWaveSelections.concat()', 'drawValues:oracleWaveDrawValues.concat(),selections:oracleWaveSelections.concat()')
    marker='            gamePaused = true;\n            oracleEmit({type:"complete"'
    prefix=[0.5,0.5,0.5,0.5,0]+[0]*26
    cases=''
    for label,value in [('fallback-barbarian-at',0.5),('fallback-barbarian-above',0.500001)]:
        cases+='            oracleWaveCase(42,"'+label+'",0,'+json.dumps(prefix+[value],separators=(',',':'))+');\n'
    assert driver.count(marker)==1
    return driver.replace(marker,cases+marker)


def main():
    out = ROOT / '.build/oracle'; out.mkdir(parents=True, exist_ok=True)
    report = {'status': 'failed', 'kind': 'ninth-day-waves', 'seeds': [42, 1, 3735928559, 6],
              'rng': 'xorshift32 plus separately labeled constants and BATCH1/RANGED prefix boundary inputs',
              'rng_boundary': 'generateMission(8) on calendar day8, then preGenerateWave() on calendar day9',
              'source_generation_methods_unmodified': True, 'rest_dialog_excluded': True}
    try:
        original_path, source_path = ROOT / 'original/elonashooter1.3.swf', ROOT / 'src/shootem_fla/MainTimeline.as'
        original, source = original_path.read_bytes(), source_path.read_bytes()
        if digest(original) != ORIGINAL_SHA256:
            raise ValueError('Preserved original SWF fingerprint differs')
        injected, calls = instrument(source.decode('utf-8-sig'))
        if injected.count(WAVE_AS3) != 1:
            raise ValueError('Shared wave diagnostic injection changed')
        injected = injected.replace(WAVE_AS3, ninth_day_driver())
        begin, end = method_span(injected, 'selectEnemy')
        body = injected[begin:end]
        before = '\n         var oracleStartDraw:int=oracleWaveDraws;\n         var oracleStartCount:int=pop[param4].length;\n         var oracleFallback:Boolean=false;'
        original_body=body
        assert body.count('debugGroup += "#";')==1
        body=body.replace('debugGroup += "#";', 'oracleFallback=true; debugGroup += "#";')
        assert body.replace('oracleFallback=true; ','')==original_body
        after = '\n         if(oracleWaveActive) oracleWaveSelections.push({wave:param4,requestedLevel:param1,budget:param2,flags:param3.concat(),ids:pop[param4].slice(oracleStartCount),drawBefore:oracleStartDraw,drawAfter:oracleWaveDraws,fallback:oracleFallback});'
        injected = injected[:begin] + before + body + after + injected[end:]
        begin, end = method_span(injected, 'generateWave')
        body = injected[begin:end]
        after = '\n         if(oracleWaveActive) oracleWaveBranches.push({wave:param1,debugGroup:debugGroup,drawAfter:oracleWaveDraws});'
        injected = injected[:begin] + body + after + injected[end:]
        generated = out / 'NinthDayWavesMainTimeline.as'; generated.write_text(injected, encoding='utf-8')
        candidate = out / ('ninth-day-waves-compiled-' + uuid.uuid4().hex + '.swf')
        result = command([find_java(None), '-Xmx1g', '-jar', str(ROOT / '.tools/ffdec/ffdec.jar'), '-replace',
                          str(original_path), str(candidate), 'shootem_fla.MainTimeline', str(generated)], timeout=240)
        (out / 'ninth-day-waves-build.log').write_text(result.stdout, encoding='utf-8')
        if result.returncode or not candidate.is_file():
            raise RuntimeError('Ninth-day wave compilation failed; inspect ninth-day-waves-build.log')
        output = bytearray(candidate.read_bytes()); output[3] = 10
        report.update(verify(original, output))
        reference = out / 'ninth-day-waves-reference.swf'; reference.write_bytes(output)
        if original_path.read_bytes() != original or source_path.read_bytes() != source:
            raise RuntimeError('Preserved inputs changed during oracle generation')
        report.update(status='passed', original_sha256=digest(original), source_sha256=digest(source),
                      output_sha256=digest(output), output=str(reference.relative_to(ROOT)).replace('\\', '/'),
                      output_bytes=len(output), intercepted_main_timeline_random_calls=calls, runtime_validated=False)
    except Exception as error:
        report['error'] = str(error)
    (out / 'ninth-day-waves-build-report.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, indent=2))
    return 0 if report['status'] == 'passed' else 1


if __name__ == '__main__':
    raise SystemExit(main())
