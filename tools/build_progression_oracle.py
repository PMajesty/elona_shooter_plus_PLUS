"""Собирает независимый эталон выбора навыков и REF исходного Шерифа второго уровня."""
import json
import uuid

from build import ROOT, ORIGINAL_SHA256, command, digest, find_java, verify
from build_oracle import instrument_startup
from build_wave_oracle import shared_driver_methods


PROGRESSION_AS3 = r'''
      private var oraclePhase:int = -1;
      private var oracleProgressionActive:Boolean = false;
      private var oracleProgressionReady:Boolean = false;
      private var oracleProgressionState:uint = 1;
      private var oracleProgressionDraws:int = 0;

      private function oracleProgressionRandom() : Number
      {
         if(!oracleProgressionActive) return Math.random();
         var value:int = int(oracleProgressionState);
         value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
         oracleProgressionState = uint(value); ++oracleProgressionDraws;
         return Number(oracleProgressionState) / 4294967296.0;
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
            oracleProgressionReady=true;
            if(ExternalInterface.available) ExternalInterface.addCallback("oracleRunProgression",oracleRunProgression);
            oracleEmit({type:"ready",kind:"progression",rng:"xorshift32",clock:"synchronous-original-trait-methods",classId:_devSheriff,level:2,focus:-1,seeds:[42,1,3735928559],capableLevels:[0,1,2]});
            oracleRunProgression();
         }
         catch(error:Error) { oracleProgressionActive=false; oracleEmit({type:"error",kind:"progression",message:error.message}); }
      }

      private function oracleProgressionCase(seed:uint,capable:int) : void
      {
         var index:int;
         var id:int;
         var name:String;
         var order:Array=[];
         var input:Object={};
         var details:Array=[];
         // Фиксированная допустимая точка уровня 2; предыдущее развитие и его RNG не проверяются.
         for(index=0;index<_maxTrait;index++) player.trait[_pc][index]=0;
         player.lv[_pc]=2; player.sp[_pc]=1; player.forcus[_pc]=-1;
         player.trait[_pc][TRAIT.SHERIFF]=2;
         player.trait[_pc][TRAIT.SHOTGUN]=2;
         player.trait[_pc][TRAIT.FURY]=1;
         player.trait[_pc][TRAIT.BASE_AIMING]=1;
         player.trait[_pc][TRAIT.BASE_TEAMWORK]=1;
         player.trait[_pc][TRAIT.CAPABLE]=capable;
         for each(name in devGroup[_devSheriff]) order.push(TRAIT[name]);
         for(index=0;index<_maxTrait;index++)
         {
            if(player.trait[_pc][index] != 0) input[String(index)]=player.trait[_pc][index];
         }
         input[String(TRAIT.CAPABLE)]=capable;
         traitLvFix=0;
         oracleProgressionState=seed == 0 ? 1 : seed; oracleProgressionDraws=0;
         oracleProgressionActive=true;
         var eligible:Array=listTrait(_pc);
         var choices:Array=listTrait2(_pc);
         for each(id in order)
         {
            traitLvFix=0;
            var currentCalc:Number=CALC[ID[id]](_pc);
            var current:Array=REF[ID[id]](_pc);
            traitLvFix=1;
            var nextCalc:Number=CALC[ID[id]](_pc);
            var next:Array=REF[ID[id]](_pc);
            details.push({id:id,level:player.trait[_pc][id],maxLevel:traitRef[id].maxLv,requiredLevel:traitRef[id].reqLv,current:current,next:next,currentCalc:currentCalc,nextCalc:nextCalc});
         }
         oracleProgressionActive=false;
         oracleEmit({type:"snapshot",kind:"progression",seed:seed,capable:capable,level:player.lv[_pc],focus:player.forcus[_pc],inputTraits:input,choiceOrder:order,eligible:eligible,choices:choices,details:details,drawCount:oracleProgressionDraws,rngState:oracleProgressionState});
      }

      public function oracleRunProgression() : Boolean
      {
         if(!oracleProgressionReady) return false;
         try
         {
            var seed:Number;
            var capable:int;
            for each(seed in [42,1,3735928559])
            {
               for(capable=0;capable<3;capable++) oracleProgressionCase(uint(seed),capable);
            }
            gamePaused=true;
            oracleEmit({type:"complete",kind:"progression",ok:true,snapshots:9});
            return true;
         }
         catch(error:Error) { oracleProgressionActive=false; gamePaused=true; oracleEmit({type:"error",kind:"progression",message:error.message}); return false; }
      }
'''


def main():
    output_dir = ROOT / '.build/oracle'
    output_dir.mkdir(parents=True, exist_ok=True)
    report = {'status': 'failed', 'kind': 'progression', 'rng': 'xorshift32',
              'clock': 'synchronous-original-trait-methods'}
    try:
        original_path = ROOT / 'original/elonashooter1.3.swf'
        source_path = ROOT / 'src/shootem_fla/MainTimeline.as'
        original, source_bytes = original_path.read_bytes(), source_path.read_bytes()
        if digest(original) != ORIGINAL_SHA256:
            raise ValueError('Preserved SWF fingerprint differs')
        source = source_bytes.decode('utf-8-sig')
        instrumented = source.replace('Math.random()', 'oracleProgressionRandom()')
        if instrumented.replace('oracleProgressionRandom()', 'Math.random()') != source:
            raise ValueError('RNG wrapper changed original logic')
        instrumented = instrumented.replace('   import flash.events.*;', '   import flash.events.*;\n   import flash.external.ExternalInterface;')
        instrumented = instrument_startup(instrumented)
        closing = instrumented.rfind('\n   }')
        instrumented = instrumented[:closing] + '\n' + shared_driver_methods() + PROGRESSION_AS3 + instrumented[closing:]
        generated = output_dir / 'ProgressionMainTimeline.as'
        generated.write_text(instrumented, encoding='utf-8')
        candidate = output_dir / ('progression-compiled-' + uuid.uuid4().hex + '.swf')
        result = command([find_java(None), '-Xmx1g', '-jar', str(ROOT / '.tools/ffdec/ffdec.jar'), '-replace', str(original_path), str(candidate), 'shootem_fla.MainTimeline', str(generated)], timeout=240)
        (output_dir / 'progression-build.log').write_text(result.stdout, encoding='utf-8')
        if result.returncode or not candidate.is_file():
            raise RuntimeError('Progression oracle compilation failed; inspect progression-build.log')
        output = bytearray(candidate.read_bytes()); output[3] = 10
        report.update(verify(original, output))
        reference = output_dir / 'progression-reference.swf'
        reference.write_bytes(output)
        if original_path.read_bytes() != original or source_path.read_bytes() != source_bytes:
            raise RuntimeError('Preserved input changed during oracle generation')
        report.update(status='passed', original_sha256=digest(original), source_sha256=digest(source_bytes),
                      output_sha256=digest(output), output=str(reference.relative_to(ROOT)).replace('\\','/'),
                      output_bytes=len(output), original_method_logic_preserved=True, runtime_validated=False)
    except Exception as error:
        report['error'] = str(error)
    (output_dir / 'progression-build-report.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, indent=2))
    return 0 if report['status'] == 'passed' else 1


if __name__ == '__main__':
    raise SystemExit(main())
