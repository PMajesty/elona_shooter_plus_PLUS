"""Эталон второго города: исходный frame71, сохранённые слоты кандидата и медаль 60."""
import json
import uuid

from build import ROOT, ORIGINAL_SHA256, command, digest, find_java, verify
from build_oracle import instrument_startup
from build_town_preparation_oracle import TOWN_PREPARATION_AS3, original_preparation_method
from build_wave_oracle import shared_driver_methods


def second_town_driver():
    driver = TOWN_PREPARATION_AS3.replace('kind:"town-preparation"', 'kind:"second-town"')
    driver = driver.replace('day:1,missionLevel:1,upgrades:false,medals:false', 'day:2,missionLevel:2,upgrades:false,medals:true')
    driver = driver.replace('game.day=1;', 'game.day=2;')
    reset_medals = '         for(index=0;index<_maxMedal;index++) medal[index]=false;'
    driver = driver.replace(reset_medals, reset_medals + '\n         if(history == "medal") medal[_medalNoDamage1]=true;')
    setup = '         for(index=0;index<8;index++) inputs.push(oraclePreparationItem(index));'
    driver = driver.replace(setup, '''         generatePlayer(_nc,1,_devMilitia);
         var priorRecruitSlots:Object={};
         for each(index in [45,47,48]) priorRecruitSlots[String(index)]=oraclePreparationItem(index);
''' + setup)
    driver = driver.replace('priorOffers:inputs,shop:shop', 'priorOffers:inputs,priorRecruitSlots:priorRecruitSlots,absorbFix:history == "medal" ? 0.01 : 0,shop:shop')
    start = driver.index('            for each(seed in [42,1,3735928559,2,3,4,8,10,12])')
    end = driver.index('            gamePaused=true;', start)
    driver = driver[:start] + '''            for each(seed in [42,1,3735928559]) oraclePreparationCase(uint(seed),"reused",321);
            for each(seed in [42,1,3735928559]) oraclePreparationCase(uint(seed),"medal",321);
''' + driver[end:]
    return driver


def main():
    out = ROOT / '.build/oracle'; out.mkdir(parents=True, exist_ok=True)
    report = {'status': 'failed', 'kind': 'second-town', 'rng': 'xorshift32',
              'save_io_replaced_by_observation': True, 'preparation_block_extracted_from_frame71': True,
              'retained_militia_slots': [45, 47, 48], 'calendar_day': 2}
    try:
        original_path, source_path = ROOT / 'original/elonashooter1.3.swf', ROOT / 'src/shootem_fla/MainTimeline.as'
        original, source_bytes = original_path.read_bytes(), source_path.read_bytes()
        if digest(original) != ORIGINAL_SHA256:
            raise ValueError('Preserved SWF fingerprint differs')
        source = source_bytes.decode('utf-8-sig')
        instrumented = source.replace('Math.random()', 'oraclePreparationRandom()')
        if instrumented.replace('oraclePreparationRandom()', 'Math.random()') != source:
            raise ValueError('Random wrapper changed original logic')
        preparation = original_preparation_method(instrumented)
        instrumented = instrumented.replace('   import flash.events.*;', '   import flash.events.*;\n   import flash.external.ExternalInterface;')
        instrumented = instrument_startup(instrumented)
        closing = instrumented.rfind('\n   }')
        instrumented = instrumented[:closing] + '\n' + shared_driver_methods() + second_town_driver() + preparation + instrumented[closing:]
        generated = out / 'SecondTownMainTimeline.as'; generated.write_text(instrumented, encoding='utf-8')
        candidate = out / ('second-town-compiled-' + uuid.uuid4().hex + '.swf')
        result = command([find_java(None), '-Xmx1g', '-jar', str(ROOT / '.tools/ffdec/ffdec.jar'), '-replace', str(original_path), str(candidate), 'shootem_fla.MainTimeline', str(generated)], timeout=240)
        (out / 'second-town-build.log').write_text(result.stdout, encoding='utf-8')
        if result.returncode or not candidate.is_file():
            raise RuntimeError('Second-town oracle compilation failed; inspect second-town-build.log')
        output = bytearray(candidate.read_bytes()); output[3] = 10
        report.update(verify(original, output))
        reference = out / 'second-town-reference.swf'; reference.write_bytes(output)
        if original_path.read_bytes() != original or source_path.read_bytes() != source_bytes:
            raise RuntimeError('A preserved input changed during oracle generation')
        report.update(status='passed', original_sha256=digest(original), source_sha256=digest(source_bytes), output_sha256=digest(output),
                      output=str(reference.relative_to(ROOT)).replace('\\', '/'), output_bytes=len(output), original_method_logic_preserved=True, runtime_validated=False)
    except Exception as error:
        report['error'] = str(error)
    (out / 'second-town-build-report.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, indent=2))
    return 0 if report['status'] == 'passed' else 1


if __name__ == '__main__':
    raise SystemExit(main())
