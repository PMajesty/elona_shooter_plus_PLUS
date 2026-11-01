"""Собирает независимый эталон generatePlayer и levelUp исходного Шерифа."""
import json
import uuid

from build import ROOT, ORIGINAL_SHA256, command, digest, find_java, verify
from build_oracle import instrument_startup
from build_wave_oracle import shared_driver_methods


HERO_AS3 = r'''
      private var oraclePhase:int = -1;
      private var oracleHeroActive:Boolean = false;
      private var oracleHeroReady:Boolean = false;
      private var oracleHeroState:uint = 1;
      private var oracleHeroDraws:int = 0;
      private var oracleHeroSnapshots:int = 0;
      private var oracleHeroItemFields:Array=["num","id","graphic","type","reloadTime","reloadTimeMax","ammo","ammoMax","value","mod","modMax","shell","manualReload","automatic","modText","lv","typeMinor","special","leech","impact","shootRate","rare","autoReload","livingWeapon","name","baseAccuracy","accuracyDec","attack","dmgAir","dmgArmor","reqTrait","reqLv","range"];

      private function oracleHeroRandom() : Number
      {
         if(!oracleHeroActive) return Math.random();
         var value:int=int(oracleHeroState);
         value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
         oracleHeroState=uint(value); ++oracleHeroDraws;
         return Number(oracleHeroState)/4294967296.0;
      }

      private function oracleHeroInventory() : Array
      {
         var items:Array=[];
         var item:Object;
         var field:String;
         var index:int;
         for(index=20;index<26;index++)
         {
            item={};
            for each(field in oracleHeroItemFields) item[field]=inventory[field][index];
            items.push(item);
         }
         return items;
      }

      private function oracleHeroProgress() : Object
      {
         var traits:Object={};
         var index:int;
         for(index=0;index<_maxTrait;index++) if(player.trait[_pc][index] != 0 && player.trait[_pc][index] != undefined) traits[String(index)]=player.trait[_pc][index];
         return {level:player.lv[_pc],exp:player.exp[_pc],skillPoints:player.sp[_pc],traits:traits};
      }

      private function oracleHeroIdentity() : Object
      {
         return {sex:player.sex[_pc],name:player.name[_pc],potentialAim:player.potentialAim[_pc],potentialTeam:player.potentialTeam[_pc],nextTrait:player.nextTrait[_pc]};
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
            oracleHeroReady=true;
            if(ExternalInterface.available) ExternalInterface.addCallback("oracleRunHero",oracleRunHero);
            oracleEmit({type:"ready",kind:"hero",rng:"xorshift32",clock:"synchronous-original-hero-methods",classId:6,appearance:6,seeds:[42,1,3735928559],snapshots:12});
            oracleRunHero();
         }
         catch(error:Error) { oracleHeroActive=false; oracleEmit({type:"error",kind:"hero",message:error.message}); }
      }

      private function oracleHeroCase(seed:uint,history:String,growth:Boolean) : void
      {
         var index:int;
         var field:String;
         var prior:Array;
         var input:Object;
         var beforeDraws:int;
         var beforeState:uint;
         oracleHeroActive=false;
         game.day=1; game.looter=0; game.optWeaponLevel=false; game.submit=false;
         for(index=0;index<_maxMedal;index++) medal[index]=false;
         for(index=1;index<maxAlly;index++) player.exist[index]=false;
         for(index=20;index<26;index++)
         {
            for each(field in oracleHeroItemFields) inventory[field][index]=undefined;
            inventory.num[index]=0; inventory.value[index]=0;
         }
         oracleHeroState=42; oracleHeroDraws=0; oracleHeroActive=true;
         if(history == "reused")
         {
            generateStuff(20,3); generateStuff(21,3); generateStuff(22,117);
            inventory.num[22]=0;
         }
         prior=oracleHeroInventory();
         player.pic[_pc]=6;
         oracleHeroState=seed; oracleHeroDraws=0;
         generatePlayer(_pc,1,_devSheriff);
         oracleEmit({type:"snapshot",kind:"hero",scenario:"generation",seed:seed,history:history,priorInventory:prior,hero:oracleHeroIdentity(),progress:oracleHeroProgress(),inventory:oracleHeroInventory(),appearance:player.pic[_pc],drawCount:oracleHeroDraws,rngState:oracleHeroState});
         ++oracleHeroSnapshots;
         if(growth)
         {
            for(index=0;index<2;index++)
            {
               player.exp[_pc]=index == 0 ? 1250 : 2500;
               input=oracleHeroProgress(); beforeDraws=oracleHeroDraws; beforeState=oracleHeroState;
               levelUp(_pc,false);
               oracleEmit({type:"snapshot",kind:"hero",scenario:"growth",seed:seed,history:history,step:index+1,input:input,inputHero:oracleHeroIdentity(),inputDrawCount:beforeDraws,inputRngState:beforeState,hero:oracleHeroIdentity(),progress:oracleHeroProgress(),inventory:oracleHeroInventory(),appearance:player.pic[_pc],drawCount:oracleHeroDraws,rngState:oracleHeroState});
               ++oracleHeroSnapshots;
            }
         }
         oracleHeroActive=false;
      }

      public function oracleRunHero() : Boolean
      {
         if(!oracleHeroReady) return false;
         try
         {
            oracleHeroSnapshots=0;
            var seed:Number;
            for each(seed in [42,1,3735928559]) oracleHeroCase(uint(seed),"fresh",true);
            for each(seed in [42,1,3735928559]) oracleHeroCase(uint(seed),"reused",false);
            gamePaused=true;
            oracleEmit({type:"complete",kind:"hero",ok:true,snapshots:oracleHeroSnapshots});
            return true;
         }
         catch(error:Error) { oracleHeroActive=false; gamePaused=true; oracleEmit({type:"error",kind:"hero",message:error.message}); return false; }
      }
'''



def main():
    output_dir = ROOT / '.build/oracle'
    output_dir.mkdir(parents=True, exist_ok=True)
    report = {'status': 'failed', 'kind': 'hero', 'rng': 'xorshift32',
              'clock': 'synchronous-original-hero-methods'}
    try:
        original_path = ROOT / 'original/elonashooter1.3.swf'
        source_path = ROOT / 'src/shootem_fla/MainTimeline.as'
        original, source_bytes = original_path.read_bytes(), source_path.read_bytes()
        if digest(original) != ORIGINAL_SHA256:
            raise ValueError('Preserved SWF fingerprint differs')
        source = source_bytes.decode('utf-8-sig')
        instrumented = source.replace('Math.random()', 'oracleHeroRandom()')
        if instrumented.replace('oracleHeroRandom()', 'Math.random()') != source:
            raise ValueError('RNG wrapper changed original logic')
        instrumented = instrumented.replace('   import flash.events.*;', '   import flash.events.*;\n   import flash.external.ExternalInterface;')
        instrumented = instrument_startup(instrumented)
        closing = instrumented.rfind('\n   }')
        instrumented = instrumented[:closing] + '\n' + shared_driver_methods() + HERO_AS3 + instrumented[closing:]
        generated = output_dir / 'HeroMainTimeline.as'
        generated.write_text(instrumented, encoding='utf-8')
        candidate = output_dir / ('hero-compiled-' + uuid.uuid4().hex + '.swf')
        result = command([find_java(None), '-Xmx1g', '-jar', str(ROOT / '.tools/ffdec/ffdec.jar'), '-replace', str(original_path), str(candidate), 'shootem_fla.MainTimeline', str(generated)], timeout=240)
        (output_dir / 'hero-build.log').write_text(result.stdout, encoding='utf-8')
        if result.returncode or not candidate.is_file():
            raise RuntimeError('Hero oracle compilation failed; inspect hero-build.log')
        output = bytearray(candidate.read_bytes()); output[3] = 10
        report.update(verify(original, output))
        reference = output_dir / 'hero-reference.swf'
        reference.write_bytes(output)
        if original_path.read_bytes() != original or source_path.read_bytes() != source_bytes:
            raise RuntimeError('Preserved input changed during oracle generation')
        report.update(status='passed', original_sha256=digest(original), source_sha256=digest(source_bytes),
                      output_sha256=digest(output), output=str(reference.relative_to(ROOT)).replace('\\','/'),
                      output_bytes=len(output), original_method_logic_preserved=True, runtime_validated=False)
    except Exception as error:
        report['error'] = str(error)
    (output_dir / 'hero-build-report.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, indent=2))
    return 0 if report['status'] == 'passed' else 1


if __name__ == '__main__':
    raise SystemExit(main())
