"""Собирает эталон исходного порядка подготовки первого города, без Rest и боя дня 2."""
import json
import uuid

from build import ROOT, ORIGINAL_SHA256, command, digest, find_java, verify
from build_oracle import instrument_startup, method_span
from build_wave_oracle import shared_driver_methods


TOWN_PREPARATION_AS3 = r'''
      private var oraclePhase:int = -1;
      private var oraclePreparationActive:Boolean = false;
      private var oraclePreparationReady:Boolean = false;
      private var oraclePreparationState:uint = 1;
      private var oraclePreparationDraws:int = 0;
      private var oraclePreparationSaveBoundary:Object;
      private var oraclePreparationSnapshots:int = 0;
      private var oraclePreparationItemFields:Array=["num","id","graphic","type","reloadTime","reloadTimeMax","ammo","ammoMax","value","mod","modMax","shell","manualReload","automatic","modText","lv","typeMinor","special","leech","impact","shootRate","rare","autoReload","livingWeapon","name","baseAccuracy","accuracyDec","attack","dmgAir","dmgArmor","reqTrait","reqLv","range"];
      private var oraclePreparationMissionFields:Array=["level","fixedLv","strength","power","powerOrg","reward","hire","ragnarok","wave","spawnRate","group","waveType","loot","newWave","time","bossDay","bossWave","note","hpFix","dmgFix","expFix","absorbFix","bossKilled","noDamage","criticalCount","resultOther"];
      private var oraclePreparationRecruitFields:Array=["exist","sex","name","devType","potentialAim","potentialTeam","lv","sp","trained","optBoss","optWall","kill","earn","money","nextTrait","ai","forcus","cost","exp","wexp","pic"];

      private function oraclePreparationRandom() : Number
      {
         if(!oraclePreparationActive) return Math.random();
         var value:int=int(oraclePreparationState);
         value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
         oraclePreparationState=uint(value); ++oraclePreparationDraws;
         return Number(oraclePreparationState)/4294967296.0;
      }

      private function oraclePreparationItem(index:int) : Object
      {
         var result:Object={};
         var field:String;
         for each(field in oraclePreparationItemFields) result[field]=inventory[field][index];
         return result;
      }

      private function oraclePreparationClearSlot(index:int) : void
      {
         var field:String;
         for each(field in oraclePreparationItemFields) inventory[field][index]=undefined;
         inventory.num[index]=0; inventory.value[index]=0;
      }

      private function oracleBattleReady() : void
      {
         if(oraclePhase != 2) return;
         oraclePhase=3; timer.stop();
         removeEventListener(Event.ENTER_FRAME,onEnterFrame);
         removeEventListener(Event.ENTER_FRAME,oracleAdvance);
         if(amb != null) amb.stop();
         try
         {
            if(player.devType[_pc] != _devSheriff || inventory.id[weapon(_pc)] != 3) throw new Error("Original Sheriff initialization failed");
            oraclePreparationReady=true;
            if(ExternalInterface.available) ExternalInterface.addCallback("oracleRunTownPreparation",oracleRunTownPreparation);
            oracleEmit({type:"ready",kind:"town-preparation",rng:"xorshift32",clock:"synchronous-original-frame71-preparation",day:1,missionLevel:1,upgrades:false,medals:false,saveIo:false});
            oracleRunTownPreparation();
         }
         catch(error:Error) { oraclePreparationActive=false; oracleEmit({type:"error",kind:"town-preparation",message:error.message}); }
      }

      private function oraclePreparationCase(seed:uint,history:String,existingSearch:*) : void
      {
         var index:int;
         var field:String;
         var inputs:Array=[];
         var shop:Array=[];
         var preparedMission:Object={};
         var recruit:Object={};
         var traits:Object={};
         var items:Object={};
         var ids:Array=[3,11,117,24,13,1,6,8];
         oraclePreparationActive=false;
         game.day=1; game.comp=false; game.casual=false; game.MORE=false;
         game.smith=0; game.chicken=0; game.looter=0; game.carryOver=false;
         game.optWeaponLevel=false;
         for(index=0;index<_maxMedal;index++) medal[index]=false;
         for(index=1;index<maxAlly;index++) player.exist[index]=false;
         initPartySkill();
         for(index=0;index<20;index++) oraclePreparationClearSlot(index);
         for(index=45;index<49;index++) oraclePreparationClearSlot(index);
         oraclePreparationClearSlot(22); oraclePreparationClearSlot(23);
         oraclePreparationState=42; oraclePreparationDraws=0; oraclePreparationActive=true;
         if(history != "fresh")
         {
            for(index=0;index<8;index++)
            {
               generateStuff(index,ids[index]);
               if(index%2 == 1) inventory.num[index]=0;
            }
            if(history == "collected")
            {
               swapStuff(0,22);
               swapStuff(1,23);
            }
         }
         for(index=0;index<8;index++) inputs.push(oraclePreparationItem(index));
         if(existingSearch == null) delete game.searched;
         else game.searched=existingSearch;
         game.card=[];
         mission={};
         oraclePreparationState=seed; oraclePreparationDraws=0;
         oracleOriginalTownPreparation();
         oraclePreparationActive=false;
         for(index=0;index<8;index++) shop.push(oraclePreparationItem(index));
         for each(field in oraclePreparationMissionFields) preparedMission[field]=mission[field];
         for each(field in oraclePreparationRecruitFields) recruit[field]=player[field][_nc];
         for(index=0;index<_maxTrait;index++) if(player.trait[_nc][index] != 0 && player.trait[_nc][index] != undefined) traits[String(index)]=player.trait[_nc][index];
         for each(index in [45,47,48]) if(inventory.num[index]) items[String(index)]=oraclePreparationItem(index);
         recruit.trait=traits; recruit.items=items;
         oracleEmit({type:"snapshot",kind:"town-preparation",seed:seed,history:history,inputSearched:existingSearch,priorOffers:inputs,shop:shop,cards:game.card.concat(),mission:preparedMission,recruit:recruit,flags:{specialSale:game.specialSale,egg:game.egg,partyHeld:game.partyHeld,prayed:game.prayed,robbed:game.robbed,taunted:game.taunted},searched:game.searched,saveBoundary:oraclePreparationSaveBoundary,drawCount:oraclePreparationDraws,rngState:oraclePreparationState});
         ++oraclePreparationSnapshots;
      }

      public function oracleRunTownPreparation() : Boolean
      {
         if(!oraclePreparationReady) return false;
         try
         {
            oraclePreparationSnapshots=0;
            var seed:Number;
            for each(seed in [42,1,3735928559,2,3,4,8,10,12]) oraclePreparationCase(uint(seed),"fresh",null);
            for each(seed in [42,1,3735928559]) oraclePreparationCase(uint(seed),"reused",null);
            for each(seed in [42,1,3735928559]) oraclePreparationCase(uint(seed),"collected",null);
            oraclePreparationCase(42,"fresh",321);
            gamePaused=true;
            oracleEmit({type:"complete",kind:"town-preparation",ok:true,snapshots:oraclePreparationSnapshots});
            return true;
         }
         catch(error:Error) { oraclePreparationActive=false; gamePaused=true; oracleEmit({type:"error",kind:"town-preparation",message:error.message}); return false; }
      }
'''


def original_preparation_method(source):
    begin, end = method_span(source, 'frame71')
    frame = source[begin:end]
    start = frame.index('            if(game.day % 10 == 4)')
    finish = frame.index('            saveGame();', start) + len('            saveGame();')
    original = frame[start:finish]
    boundary = '            oraclePreparationSaveBoundary={drawCount:oraclePreparationDraws,rngState:oraclePreparationState};'
    body = original.replace('            saveGame();', boundary)
    if body.replace(boundary, '            saveGame();') != original:
        raise ValueError('Town preparation observer changed original statements')
    searched_start = frame.index('         if(game.searched == undefined)')
    searched_end = frame.index('         kongregateStats();', searched_start)
    body += '\n' + frame[searched_start:searched_end]
    return '\n      private function oracleOriginalTownPreparation() : void\n      {\n' + body + '\n      }\n'


def main():
    output_dir = ROOT / '.build/oracle'
    output_dir.mkdir(parents=True, exist_ok=True)
    report = {'status': 'failed', 'kind': 'town-preparation', 'rng': 'xorshift32',
              'clock': 'synchronous-original-frame71-preparation', 'save_io_replaced_by_observation': True}
    try:
        original_path = ROOT / 'original/elonashooter1.3.swf'
        source_path = ROOT / 'src/shootem_fla/MainTimeline.as'
        original, source_bytes = original_path.read_bytes(), source_path.read_bytes()
        if digest(original) != ORIGINAL_SHA256:
            raise ValueError('Preserved SWF fingerprint differs')
        source = source_bytes.decode('utf-8-sig')
        instrumented = source.replace('Math.random()', 'oraclePreparationRandom()')
        if instrumented.replace('oraclePreparationRandom()', 'Math.random()') != source:
            raise ValueError('RNG wrapper changed original logic')
        preparation = original_preparation_method(instrumented)
        instrumented = instrumented.replace('   import flash.events.*;', '   import flash.events.*;\n   import flash.external.ExternalInterface;')
        instrumented = instrument_startup(instrumented)
        closing = instrumented.rfind('\n   }')
        instrumented = instrumented[:closing] + '\n' + shared_driver_methods() + TOWN_PREPARATION_AS3 + preparation + instrumented[closing:]
        generated = output_dir / 'TownPreparationMainTimeline.as'
        generated.write_text(instrumented, encoding='utf-8')
        candidate = output_dir / ('town-preparation-compiled-' + uuid.uuid4().hex + '.swf')
        result = command([find_java(None), '-Xmx1g', '-jar', str(ROOT / '.tools/ffdec/ffdec.jar'), '-replace', str(original_path), str(candidate), 'shootem_fla.MainTimeline', str(generated)], timeout=240)
        (output_dir / 'town-preparation-build.log').write_text(result.stdout, encoding='utf-8')
        if result.returncode or not candidate.is_file():
            raise RuntimeError('Town preparation oracle compilation failed; inspect town-preparation-build.log')
        output = bytearray(candidate.read_bytes()); output[3] = 10
        report.update(verify(original, output))
        reference = output_dir / 'town-preparation-reference.swf'
        reference.write_bytes(output)
        if original_path.read_bytes() != original or source_path.read_bytes() != source_bytes:
            raise RuntimeError('Preserved input changed during oracle generation')
        report.update(status='passed', original_sha256=digest(original), source_sha256=digest(source_bytes),
                      output_sha256=digest(output), output=str(reference.relative_to(ROOT)).replace('\\','/'),
                      output_bytes=len(output), original_method_logic_preserved=True,
                      preparation_block_extracted_from_frame71=True, runtime_validated=False)
    except Exception as error:
        report['error'] = str(error)
    (output_dir / 'town-preparation-build-report.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, indent=2))
    return 0 if report['status'] == 'passed' else 1


if __name__ == '__main__':
    raise SystemExit(main())
