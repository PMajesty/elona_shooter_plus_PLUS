"""Собирает независимый SWF-эталон исходной генерации волн с управляемым RNG."""
import argparse
import json
from pathlib import Path
import re
import sys
import uuid

from build import ROOT, ORIGINAL_SHA256, FFDEC_VERSION, JAVA_MAJOR, command, digest, find_java, verify
from build_oracle import AS3 as RELOAD_DRIVER, append_method, method_span


WAVE_AS3 = r'''
      private var oraclePhase:int = -1;
      private var oracleWaveActive:Boolean = false;
      private var oracleWaveReady:Boolean = false;
      private var oracleWaveState:uint = 1;
      private var oracleWaveDraws:int = 0;

      private function oracleWaveRandom() : Number
      {
         if(!oracleWaveActive) return Math.random();
         var value:int = int(oracleWaveState);
         value ^= value << 13;
         value ^= value >>> 17;
         value ^= value << 5;
         oracleWaveState = uint(value);
         ++oracleWaveDraws;
         return Number(oracleWaveState) / 4294967296.0;
      }

      private function oracleBattleReady() : void
      {
         if(oraclePhase != 2) return;
         oraclePhase = 3;
         timer.stop();
         removeEventListener(Event.ENTER_FRAME,onEnterFrame);
         removeEventListener(Event.ENTER_FRAME,oracleAdvance);
         if(amb != null) amb.stop();
         try
         {
            if(player.devType[_pc] != _devSheriff || inventory.id[weapon(_pc)] != 3) throw new Error("Original New Game did not initialize Sheriff and shotgun");
            oracleWaveReady = true;
            if(ExternalInterface.available) ExternalInterface.addCallback("oracleRunWaves",oracleRunWaves);
            oracleEmit({type:"ready",kind:"waves",seeds:[42,1,3735928559],rng:"xorshift32",clock:"synchronous-original-generation"});
            oracleRunWaves();
         }
         catch(error:Error)
         {
            oracleWaveActive = false;
            oracleEmit({type:"error",kind:"waves",message:error.message,phase:oraclePhase});
         }
      }

      private function oracleWaveCase(seed:uint) : void
      {
         // Условия обычного первого дня; таблица врагов создана исходным frame27.
         game.day = 1;
         game.casual = false;
         game.MORE = false;
         game.optionAltStart = 0;
         game.skipHard = false;
         debugBatch = 0;
         debugId = 0;
         pop = [];
         popTime = [];
         oracleWaveState = seed == 0 ? 1 : seed;
         oracleWaveDraws = 0;
         oracleWaveActive = true;
         generateMission(0);
         preGenerateWave();
         oracleWaveActive = false;
         var waves:Array = [];
         var index:int = 0;
         while(index < mission.wave)
         {
            waves.push({index:index,enemies:pop[index].concat(),delays:popTime[index].concat(),initialCount:mission.group[index]});
            ++index;
         }
         oracleEmit({type:"snapshot",kind:"waves",seed:seed,missionLevel:mission.level,day:game.day,bossWave:mission.bossWave,drawCount:oracleWaveDraws,rngState:oracleWaveState,waves:waves,loot:mission.loot.concat(),powerOrg:mission.powerOrg,reward:mission.reward,spawnRate:mission.spawnRate});
      }

      public function oracleRunWaves() : Boolean
      {
         if(!oracleWaveReady) return false;
         try
         {
            oracleWaveCase(42);
            oracleWaveCase(1);
            oracleWaveCase(3735928559);
            gamePaused = true;
            oracleEmit({type:"complete",kind:"waves",ok:true,snapshots:3,seeds:[42,1,3735928559]});
            return true;
         }
         catch(error:Error)
         {
            oracleWaveActive = false;
            gamePaused = true;
            oracleEmit({type:"error",kind:"waves",message:error.message});
            return false;
         }
      }
'''


def shared_driver_methods():
    methods = []
    for name in ("oracleString", "oracleJson", "oracleEmit", "oracleBootstrap", "oracleAdvance"):
        start = re.search(r"\n      private function " + name + r"\(", RELOAD_DRIVER).start()
        _, end = method_span(RELOAD_DRIVER, name)
        methods.append(RELOAD_DRIVER[start:end + len("\n      }")])
    return "\n".join(methods)


def instrument(source):
    calls = source.count("Math.random()")
    if calls == 0:
        raise ValueError("No original Math.random calls found")
    # Обёртка добавляется после замены, поэтому её fallback не перехватывает сам себя.
    transformed = source.replace("Math.random()", "oracleWaveRandom()")
    if transformed.replace("oracleWaveRandom()", "Math.random()") != source:
        raise ValueError("Random-call rewrite changed other original source")
    transformed = transformed.replace("   import flash.events.*;", "   import flash.events.*;\n   import flash.external.ExternalInterface;")
    transformed = append_method(transformed, "elonaInitializeTitle", "oracleBootstrap();")
    transformed = append_method(transformed, "frame27", "oracleBattleReady();")
    closing = transformed.rfind("\n   }")
    if closing < 0:
        raise ValueError("Cannot find MainTimeline class closing brace")
    transformed = transformed[:closing] + "\n" + shared_driver_methods() + WAVE_AS3 + transformed[closing:]
    return transformed, calls


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ffdec", type=Path, default=ROOT / ".tools/ffdec/ffdec.jar")
    parser.add_argument("--java")
    args = parser.parse_args()
    out = ROOT / ".build/oracle"
    out.mkdir(parents=True, exist_ok=True)
    report = {"status": "failed", "kind": "waves", "ffdec_version": FFDEC_VERSION,
              "java_major": JAVA_MAJOR, "seeds": [42, 1, 3735928559], "rng": "xorshift32",
              "rng_boundary": "generateMission(0), then preGenerateWave(), after original Sheriff battle initialization"}
    try:
        original_path = ROOT / "original/elonashooter1.3.swf"
        source_path = ROOT / "src/shootem_fla/MainTimeline.as"
        original, source_bytes = original_path.read_bytes(), source_path.read_bytes()
        if digest(original) != ORIGINAL_SHA256:
            raise ValueError("Preserved original fingerprint differs")
        injected, calls = instrument(source_bytes.decode("utf-8-sig"))
        generated = out / "WavesMainTimeline.as"
        generated.write_text(injected, encoding="utf-8")
        java = find_java(args.java)
        java_info = command([java, "-version"], 30)
        if java_info.returncode or not re.search(r'version\s+"' + JAVA_MAJOR + r'(?:\.|\")', java_info.stdout):
            raise RuntimeError("Oracle build requires Java " + JAVA_MAJOR)
        ffdec_info = command([java, "-jar", str(args.ffdec.resolve()), "-help"], 30)
        version = re.search(r"JPEXS Free Flash Decompiler v\.([^\s]+)", ffdec_info.stdout)
        if ffdec_info.returncode or not version or version[1] != FFDEC_VERSION:
            raise RuntimeError("Oracle build requires FFDec " + FFDEC_VERSION)
        candidate = out / ("waves-compiled-" + uuid.uuid4().hex + ".swf")
        result = command([java, "-Xmx1g", "-jar", str(args.ffdec.resolve()), "-replace",
                          str(original_path), str(candidate), "shootem_fla.MainTimeline", str(generated)], timeout=240)
        (out / "waves-build.log").write_text(result.stdout, encoding="utf-8")
        if result.returncode or not candidate.is_file():
            raise RuntimeError("FFDec compilation failed; inspect .build/oracle/waves-build.log")
        output = bytearray(candidate.read_bytes())
        output[3] = 10
        report.update(verify(original, output))
        reference = out / "waves-reference.swf"
        reference.write_bytes(output)
        if original_path.read_bytes() != original or source_path.read_bytes() != source_bytes:
            raise RuntimeError("A preserved input changed during oracle generation")
        report.update(status="passed", original_sha256=digest(original), source_sha256=digest(source_bytes),
                      instrumented_source_sha256=digest(generated.read_bytes()), output_sha256=digest(output),
                      output=str(reference.relative_to(ROOT)).replace("\\", "/"), output_bytes=len(output),
                      intercepted_main_timeline_random_calls=calls, original_generation_logic_preserved=True,
                      runtime_validated=False)
    except Exception as error:
        report["error"] = str(error)
    (out / "waves-build-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0 if report["status"] == "passed" else 1


if __name__ == "__main__":
    sys.exit(main())
