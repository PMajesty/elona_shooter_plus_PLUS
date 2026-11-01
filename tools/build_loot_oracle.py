"""Собирает независимый эталон исходных generateStuff/randomStuff/generateLoot/generateLootBoss."""
import json
from pathlib import Path
import uuid

from build import ROOT, ORIGINAL_SHA256, command, digest, find_java, verify
from build_oracle import instrument_startup
from build_wave_oracle import shared_driver_methods


LOOT_AS3 = r'''
      private var oraclePhase:int = -1;
      private var oracleLootActive:Boolean = false;
      private var oracleLootReady:Boolean = false;
      private var oracleLootState:uint = 1;
      private var oracleLootDraws:int = 0;
      private var oracleLootSnapshots:int = 0;
      private var oracleItemFields:Array = ["num","id","graphic","type","reloadTime","reloadTimeMax","ammo","ammoMax","value","mod","modMax","shell","manualReload","automatic","modText","lv","typeMinor","special","leech","impact","shootRate","rare","autoReload","livingWeapon","name","baseAccuracy","accuracyDec","attack","dmgAir","dmgArmor","reqTrait","reqLv","range"];

      private function oracleLootRandom() : Number
      {
         if(!oracleLootActive) return Math.random();
         var value:int = int(oracleLootState);
         value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
         oracleLootState = uint(value); ++oracleLootDraws;
         return Number(oracleLootState) / 4294967296.0;
      }

      private function oracleItemSnapshot(index:int) : Object
      {
         var result:Object = {};
         var field:String;
         for each(field in oracleItemFields) result[field] = inventory[field][index];
         return result;
      }

      private function oracleLootReset(seed:uint) : void
      {
         var field:String;
         var index:int;
         for each(field in oracleItemFields)
         {
            for(index=0;index<_maxInv;index++) inventory[field][index] = undefined;
         }
         for(index=0;index<_maxInv;index++) { inventory.num[index]=0; inventory.value[index]=0; }
         game.day=1; game.looter=0; game.optWeaponLevel=false;
         game.optionBossDropMod=false; mission.bossKilled=0;
         PARTY.ENGINEER=0; medal[_medalAction4]=false;
         oracleLootState=seed == 0 ? 1 : seed; oracleLootDraws=0;
      }

      private function oracleLootEmit(result:Object) : void
      {
         oracleLootActive=false;
         result.type="snapshot"; result.kind="loot";
         result.drawCount=oracleLootDraws; result.rngState=oracleLootState;
         oracleEmit(result); ++oracleLootSnapshots;
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
            oracleLootReady=true;
            if(ExternalInterface.available) ExternalInterface.addCallback("oracleRunLoot",oracleRunLoot);
            oracleEmit({type:"ready",kind:"loot",rng:"xorshift32",clock:"synchronous-original-item-methods",day:1,weaponLevelMode:false,engineer:0,looter:0,recycleMedal:false});
            oracleRunLoot();
         }
         catch(error:Error) { oracleLootActive=false; oracleEmit({type:"error",kind:"loot",message:error.message}); }
      }

      public function oracleRunLoot() : Boolean
      {
         if(!oracleLootReady) return false;
         oracleLootSnapshots=0;
         try
         {
            var seed:Number;
            var id:int;
            var mode:int;
            var index:int;
            var queue:Array;
            var offers:Array;
            var previousOffers:Array;
            var bossCase:Object;
            var previousIds:Array=[3,11,117,24,13,1,6,8];
            var ids:Array=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,101,102,103,104,105,106,107,108,109,110,112,113,114,115,116,117,120,121];
            for each(seed in [42,3735928559])
            {
               for each(id in ids)
               {
                  oracleLootReset(uint(seed)); oracleLootActive=true;
                  generateStuff(0,id);
                  oracleLootEmit({scenario:"base",seed:seed,id:id,item:oracleItemSnapshot(0)});
               }
            }
            for each(seed in [42,1,3735928559])
            {
               for(mode=0;mode<5;mode++)
               {
                  oracleLootReset(uint(seed)); oracleLootActive=true;
                  randomStuff(0,500,mode);
                  oracleLootEmit({scenario:"random",seed:seed,targetValue:500,mode:mode,item:oracleItemSnapshot(0)});
               }
               for each(queue in [[1117],[1117,6,28,30]])
               {
                  oracleLootReset(uint(seed)); mission.loot=queue.concat(); oracleLootActive=true;
                  generateLoot(); offers=[];
                  for(index=0;index<8;index++) offers.push(inventory.num[index] ? oracleItemSnapshot(index) : null);
                  oracleLootEmit({scenario:"ordinary",seed:seed,inputQueue:queue,queue:mission.loot.concat(),offers:offers});
               }
            }
            for each(seed in [42,3735928559])
            {
               oracleLootReset(uint(seed)); oracleLootActive=true;
               // Исходная последовательность предметов generatePlayer, без остальных случайных параметров героя.
               generateStuff(21,11);
               inventory.lv[21]=1; inventory.name[21]="Soldier's Grenade"; inventory.attack[21]=45;
               inventory.ammoMax[21]=5; inventory.ammo[21]=5; inventory.value[21]=100;
               generateStuff(20,24); generateStuff(20,3);
               offers=[oracleItemSnapshot(20),oracleItemSnapshot(21),null,null,null,null];
               oracleLootEmit({scenario:"starting",seed:seed,slots:offers});
            }
            for each(seed in [42,1,3735928559])
            {
               for each(bossCase in [
                  {killed:1,modifiersOnly:false,reuse:false},
                  {killed:2,modifiersOnly:false,reuse:false},
                  {killed:16,modifiersOnly:false,reuse:false},
                  {killed:2,modifiersOnly:true,reuse:false},
                  {killed:2,modifiersOnly:false,reuse:true},
                  {killed:2,modifiersOnly:true,reuse:true}
               ])
               {
                  oracleLootReset(42); oracleLootActive=true;
                  previousOffers=[];
                  if(bossCase.reuse)
                  {
                     for(index=0;index<8;index++)
                     {
                        generateStuff(index,previousIds[index]);
                        if(index % 2 == 1) inventory.num[index]=0;
                        previousOffers.push(oracleItemSnapshot(index));
                     }
                  }
                  // Подготовка старых полей не входит в поток исследуемой генерации наград.
                  oracleLootState=uint(seed); oracleLootDraws=0;
                  mission.bossKilled=bossCase.killed; game.optionBossDropMod=bossCase.modifiersOnly;
                  generateLootBoss(); offers=[];
                  for(index=0;index<8;index++) offers.push(inventory.num[index] ? oracleItemSnapshot(index) : null);
                  oracleLootEmit({scenario:"boss",seed:seed,bossKilled:bossCase.killed,modifiersOnly:bossCase.modifiersOnly,previousOffers:previousOffers,offers:offers});
               }
            }
            gamePaused=true;
            oracleEmit({type:"complete",kind:"loot",ok:true,snapshots:oracleLootSnapshots,baseCases:116,randomCases:15,ordinaryCases:6,startingCases:2,bossCases:18});
            return true;
         }
         catch(error:Error) { oracleLootActive=false; gamePaused=true; oracleEmit({type:"error",kind:"loot",message:error.message}); return false; }
      }
'''


def main():
    output_dir = ROOT / '.build/oracle'
    output_dir.mkdir(parents=True, exist_ok=True)
    report = {'status': 'failed', 'kind': 'loot', 'rng': 'xorshift32', 'clock': 'synchronous-original-item-methods'}
    try:
        original_path = ROOT / 'original/elonashooter1.3.swf'
        source_path = ROOT / 'src/shootem_fla/MainTimeline.as'
        original, source_bytes = original_path.read_bytes(), source_path.read_bytes()
        if digest(original) != ORIGINAL_SHA256:
            raise ValueError('Preserved SWF fingerprint differs')
        source = source_bytes.decode('utf-8-sig')
        instrumented = source.replace('Math.random()', 'oracleLootRandom()')
        if instrumented.replace('oracleLootRandom()', 'Math.random()') != source:
            raise ValueError('RNG wrapper changed original logic')
        instrumented = instrumented.replace('   import flash.events.*;', '   import flash.events.*;\n   import flash.external.ExternalInterface;')
        instrumented = instrument_startup(instrumented)
        closing = instrumented.rfind('\n   }')
        instrumented = instrumented[:closing] + '\n' + shared_driver_methods() + LOOT_AS3 + instrumented[closing:]
        generated = output_dir / 'LootMainTimeline.as'
        generated.write_text(instrumented, encoding='utf-8')
        candidate = output_dir / ('loot-compiled-' + uuid.uuid4().hex + '.swf')
        result = command([find_java(None), '-Xmx1g', '-jar', str(ROOT / '.tools/ffdec/ffdec.jar'), '-replace', str(original_path), str(candidate), 'shootem_fla.MainTimeline', str(generated)], timeout=240)
        (output_dir / 'loot-build.log').write_text(result.stdout, encoding='utf-8')
        if result.returncode or not candidate.is_file():
            raise RuntimeError('Loot oracle compilation failed; inspect loot-build.log')
        output = bytearray(candidate.read_bytes()); output[3] = 10
        report.update(verify(original, output))
        reference = output_dir / 'loot-reference.swf'
        reference.write_bytes(output)
        if original_path.read_bytes() != original or source_path.read_bytes() != source_bytes:
            raise RuntimeError('Preserved input changed during oracle generation')
        report.update(status='passed', original_sha256=digest(original), source_sha256=digest(source_bytes),
                      output_sha256=digest(output), output=str(reference.relative_to(ROOT)).replace('\\','/'),
                      output_bytes=len(output), original_method_logic_preserved=True, runtime_validated=False)
    except Exception as error:
        report['error'] = str(error)
    (output_dir / 'loot-build-report.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, indent=2))
    return 0 if report['status'] == 'passed' else 1


if __name__ == '__main__':
    raise SystemExit(main())
