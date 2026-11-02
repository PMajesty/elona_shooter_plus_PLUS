"""Эталон роста, автоматического выбора навыков и зарплаты всех девяти классов."""
import json
import uuid

from build import ROOT, ORIGINAL_SHA256, command, digest, find_java, verify
from build_oracle import instrument_startup, method_span
from build_town_preparation_oracle import TOWN_PREPARATION_AS3, original_preparation_method
from build_wave_oracle import shared_driver_methods


PROGRESSION_AS3 = r'''
      private function oraclePartyMember(index:int) : Object
      {
         var traits:Object={};
         for(var id:int=0;id<_maxTrait;id++) if(player.trait[index][id] != 0 && player.trait[index][id] != undefined) traits[String(id)]=player.trait[index][id];
         return {level:player.lv[index],exp:player.exp[index],skillPoints:player.sp[index],traits:traits,
            devType:player.devType[index],potentialAim:player.potentialAim[index],potentialTeam:player.potentialTeam[index],
            nextTrait:player.nextTrait[index],focus:player.forcus[index],appearance:player.pic[index]};
      }

      private function oraclePartySkills() : Object
      {
         var effects:Object={}; var levels:Object={};
         for each(var name:String in ["SCAVENGER","THREAT","DEFENDER","LEADERSHIP","NEGOTIATOR","INSURANCE","ENGINEER","ROBBER","ACTIVE","BREEDER","TAUNT","COOK","ACCOUNTANT","QUICK_EYED","LOVE","SUPPLIER"]) {
            effects[String(TRAIT[name])]=PARTY[name]; levels[String(TRAIT[name])]=PARTYLV[name];
         }
         return {effects:effects,levels:levels,guardian:PARTY.GUARDIAN,guardianSlots:PARTY.GUARDIAN_LIST.concat()};
      }

      private function oraclePartyCase(seed:uint,dev:int,scenario:String) : void
      {
         oraclePreparationActive=true; oraclePreparationState=42; oraclePreparationDraws=0;
         for(var slot:int=0;slot<6;slot++) player.exist[slot]=false;
         for(var medalId:int=0;medalId<_maxMedal;medalId++) medal[medalId]=false;
         game.day=7; game.casual=false; game.comp=false; game.MORE=false; game.optWeaponLevel=false;
         generatePlayer(0,1,6); generatePlayer(1,4,dev);
         if(scenario == "focus") player.forcus[1]=TRAIT.ACCURACY;
         if(scenario == "party") {
            player.trait[0][TRAIT.ACTIVE]=4; player.trait[0][TRAIT.ACCOUNTANT]=3;
            player.trait[0][TRAIT.LEADERSHIP]=4; player.trait[0][TRAIT.SCAVENGER]=2;
            player.trait[1][TRAIT.LUCK]=3; player.trait[1][TRAIT.ACCOUNTANT]=1;
            medal[_medalRagnarok]=true;
         }
         initPartySkill();
         var before:Object=oraclePartyMember(1); var hero:Object=oraclePartyMember(0);
         var skills:Object=oraclePartySkills(); var available:Array=listTrait(1);
         oraclePreparationState=seed; oraclePreparationDraws=0;
         gainTrait(1,false);
         var afterTrait:Object=oraclePartyMember(1); var traitDraws:int=oraclePreparationDraws; var traitState:uint=oraclePreparationState;
         player.exp[1]=1123;
         levelUp(1,false);
         var afterLevel:Object=oraclePartyMember(1);
         oracleEmit({type:"snapshot",kind:"party-progression",seed:seed,dev:dev,scenario:scenario,hero:hero,before:before,
            party:skills,available:available,afterTrait:afterTrait,traitDraws:traitDraws,traitState:traitState,
            afterLevel:afterLevel,wage:wage(1),drawCount:oraclePreparationDraws,rngState:oraclePreparationState});
         ++oraclePreparationSnapshots;
      }
'''


def driver():
    result = TOWN_PREPARATION_AS3.replace('town-preparation', 'party-progression')
    begin, end = method_span(result, 'oracleRunTownPreparation')
    result = result[:begin] + r'''
         if(!oraclePreparationReady) return false;
         try {
            oraclePreparationSnapshots=0;
            for(var dev:int=1;dev<=9;dev++) {
               for each(var seed:Number in [42,1,3735928559]) oraclePartyCase(uint(seed),dev,"normal");
               oraclePartyCase(42,dev,"focus");
               oraclePartyCase(42,dev,"party");
            }
            oraclePreparationActive=false; gamePaused=true;
            oracleEmit({type:"complete",kind:"party-progression",ok:true,snapshots:oraclePreparationSnapshots});
            return true;
         } catch(error:Error) {
            oraclePreparationActive=false; gamePaused=true;
            oracleEmit({type:"error",kind:"party-progression",message:error.message}); return false;
         }
''' + result[end:]
    result = result.replace('synchronous-original-frame71-preparation', 'synchronous-original-companion-progression')
    return result + PROGRESSION_AS3


def main():
    out = ROOT / '.build/oracle'; out.mkdir(parents=True, exist_ok=True)
    report = {'status': 'failed', 'kind': 'party-progression', 'rng': 'xorshift32',
              'original_method_logic_preserved': True, 'cases': 45,
              'boundary': 'Nine classes, automatic skill choice/focus, cached party effects, level growth and wages; no live AI'}
    try:
        original_path, source_path = ROOT / 'original/elonashooter1.3.swf', ROOT / 'src/shootem_fla/MainTimeline.as'
        original, source_bytes = original_path.read_bytes(), source_path.read_bytes()
        if digest(original) != ORIGINAL_SHA256: raise ValueError('Preserved SWF fingerprint differs')
        source = source_bytes.decode('utf-8-sig')
        instrumented = source.replace('Math.random()', 'oraclePreparationRandom()')
        if instrumented.replace('oraclePreparationRandom()', 'Math.random()') != source: raise ValueError('RNG wrapper changed source logic')
        preparation = original_preparation_method(instrumented)
        instrumented = instrumented.replace('   import flash.events.*;', '   import flash.events.*;\n   import flash.external.ExternalInterface;')
        instrumented = instrument_startup(instrumented)
        closing = instrumented.rfind('\n   }')
        instrumented = instrumented[:closing] + '\n' + shared_driver_methods() + driver() + preparation + instrumented[closing:]
        generated = out / 'PartyProgressionMainTimeline.as'; generated.write_text(instrumented, encoding='utf-8')
        candidate = out / ('party-progression-compiled-' + uuid.uuid4().hex + '.swf')
        result = command([find_java(None), '-Xmx1g', '-jar', str(ROOT / '.tools/ffdec/ffdec.jar'), '-replace', str(original_path), str(candidate), 'shootem_fla.MainTimeline', str(generated)], timeout=240)
        (out / 'party-progression-build.log').write_text(result.stdout, encoding='utf-8')
        if result.returncode or not candidate.is_file(): raise RuntimeError('Party progression oracle compilation failed')
        output = bytearray(candidate.read_bytes()); output[3] = 10
        report.update(verify(original, output))
        reference = out / 'party-progression-reference.swf'; reference.write_bytes(output)
        if original_path.read_bytes() != original or source_path.read_bytes() != source_bytes: raise RuntimeError('Preserved input changed')
        report.update(status='passed', original_sha256=digest(original), source_sha256=digest(source_bytes), output_sha256=digest(output), output=str(reference.relative_to(ROOT)).replace('\\','/'), output_bytes=len(output), runtime_validated=False)
    except Exception as error:
        report['error'] = str(error)
    (out / 'party-progression-build-report.json').write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')
    print(json.dumps(report, indent=2))
    return 0 if report['status'] == 'passed' else 1


if __name__ == '__main__':
    raise SystemExit(main())
