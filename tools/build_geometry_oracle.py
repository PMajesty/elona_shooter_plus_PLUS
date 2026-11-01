"""Собирает оригинальные векторные hitTestPoint-сетки для обычных врагов."""
import argparse
import json
from pathlib import Path
import re
import sys
import uuid

from build import ROOT, ORIGINAL_SHA256, FFDEC_VERSION, JAVA_MAJOR, command, digest, find_java
from build_oracle import method_span
from build_combat_oracle import COMBAT_AS3, instrument as instrument_combat, verify_resources


GEOMETRY_AS3 = r'''
      private var oraclePhase:int = -1;
      private var oracleCombatActive:Boolean = false;
      private var oracleCombatState:uint = 1;
      private var oracleCombatDraws:int = 0;
      private var oracleCombatEvents:Array = [];
      private var oracleGeometryReady:Boolean = false;
      private var oracleGeometryRunning:Boolean = false;
      private var oracleGeometryCases:Array = [];
      private var oracleGeometryIndex:int = 0;

      private function oracleBattleReady() : void
      {
         if(oraclePhase != 2) return;
         oraclePhase = 3;
         timer.stop();
         removeEventListener(Event.ENTER_FRAME,onEnterFrame);
         removeEventListener(Event.ENTER_FRAME,oracleAdvance);
         if(amb != null) amb.stop();
         oracleGeometryReady = true;
         if(ExternalInterface.available) ExternalInterface.addCallback("oracleRunGeometry",oracleRunGeometry);
         oracleEmit({type:"ready",kind:"geometry",enemyIds:[3,17,19,6],snapshots:19,gridWidth:64,gridHeight:64,clock:"one-synchronous-grid-per-diagnostic-frame",geometry:"original-vector-hitTestPoint",sampling:"integer-world-points",seed:42});
         oracleRunGeometry();
      }

      public function oracleRunGeometry() : Boolean
      {
         if(!oracleGeometryReady || oracleGeometryRunning) return false;
         oracleGeometryCases = [];
         oracleGeometryIndex = 0;
         var group:Array;
         var frame:int;
         for each(group in [[3,5,32,44,107],[17,14,41,93],[19,5,37,105,208],[6,3,30,46]])
         {
            for each(frame in group.slice(1)) oracleGeometryCases.push({id:group[0],frame:frame,x:200,y:220});
         }
         for each(group in [[3,5],[17,14],[19,5],[6,3]]) oracleGeometryCases.push({id:group[0],frame:group[1],x:200.375,y:220.625});
         oracleGeometryCases.push({id:3,frame:5,x:200,y:220,afterAttack:true});
         oracleGeometryRunning = true;
         addEventListener(Event.ENTER_FRAME,oracleGeometryNext);
         return true;
      }

      private function oracleGeometryNext(event:Event) : void
      {
         try
         {
            var probe:Object = oracleGeometryCases[oracleGeometryIndex];
            oracleCombatReset(42);
            oracleCombatActive = true;
            var slot:int = spawnEnemy(probe.id);
            oracleCombatActive = false;
            var target:* = enemyArray[slot];
            gamePaused = true;
            target.x = probe.x;
            target.y = probe.y;
            var spawnFrame:int = target.mc.currentFrame;
            var poseFrames:Array = [];
            // У sheep флаг тени задаётся входом в атаку, а не каждым последующим кадром.
            if(probe.id == 3 && (probe.frame == 44 || probe.afterAttack == true))
            {
               target.mc.gotoAndStop(32);
               poseFrames.push(32);
            }
            target.mc.gotoAndStop(probe.frame);
            poseFrames.push(probe.frame);
            var bodyBits:String = "";
            var shadowBits:String = "";
            var combinedBits:String = "";
            var bodyCount:int = 0;
            var shadowCount:int = 0;
            var combinedCount:int = 0;
            var gridX:int = int(Math.floor(target.x)) - 32;
            var gridY:int = int(Math.floor(target.y)) - 32;
            var row:int = 0;
            var col:int;
            var body:Boolean;
            var shadow:Boolean;
            var combined:Boolean;
            while(row < 64)
            {
               col = 0;
               while(col < 64)
               {
                  body = target.mc.hitTestPoint(gridX + col,gridY + row,true);
                  shadow = target.mc.shadow != null && target.mc.shadow.hitTestPoint(gridX + col,gridY + row,true);
                  combined = body && !(target.mc.shadowHit == false && shadow);
                  bodyBits += body ? "1" : "0";
                  shadowBits += shadow ? "1" : "0";
                  combinedBits += combined ? "1" : "0";
                  if(body) ++bodyCount;
                  if(shadow) ++shadowCount;
                  if(combined) ++combinedCount;
                  ++col;
               }
               ++row;
            }
            var state:Object = target.oracleState();
            oracleEmit({type:"snapshot",kind:"geometry",caseIndex:oracleGeometryIndex,enemyId:probe.id,requestedFrame:probe.frame,frame:target.mc.currentFrame,spawnFrame:spawnFrame,poseFrames:poseFrames,requestedPosition:{x:probe.x,y:probe.y},position:{x:target.x,y:target.y},rootPosition:{x:root.x,y:root.y},shadowHit:target.mc.shadowHit,bounds:state.bounds,grid:{x:gridX,y:gridY,width:64,height:64,step:1},bodyBits:bodyBits,shadowBits:shadowBits,combinedBits:combinedBits,bodyCount:bodyCount,shadowCount:shadowCount,combinedCount:combinedCount,displayAdvance:"none-after-explicit-goto"});
            ++oracleGeometryIndex;
            if(oracleGeometryIndex == oracleGeometryCases.length)
            {
               removeEventListener(Event.ENTER_FRAME,oracleGeometryNext);
               oracleGeometryRunning = false;
               gamePaused = true;
               oracleEmit({type:"complete",kind:"geometry",ok:true,snapshots:oracleGeometryIndex,sampledPoints:oracleGeometryIndex * 4096});
            }
         }
         catch(error:Error)
         {
            oracleCombatActive = false;
            oracleGeometryRunning = false;
            gamePaused = true;
            removeEventListener(Event.ENTER_FRAME,oracleGeometryNext);
            oracleEmit({type:"error",kind:"geometry",message:error.message,caseIndex:oracleGeometryIndex});
         }
      }
'''


def geometry_driver():
    methods = []
    for name in ("oracleCombatRandom", "oracleCombatDamage", "oracleCombatReset"):
        start = re.search(r"\n      (?:private|public) function " + name + r"\(", COMBAT_AS3).start()
        _, end = method_span(COMBAT_AS3, name)
        methods.append(COMBAT_AS3[start:end + len("\n      }")])
    return GEOMETRY_AS3 + "\n".join(methods)


def instrument(main_source, enemy_source):
    main, enemy, main_calls, enemy_calls = instrument_combat(main_source, enemy_source)
    if main.count(COMBAT_AS3) != 1:
        raise ValueError("Cannot isolate shared combat fixture driver")
    main = main.replace(COMBAT_AS3, geometry_driver())
    if "oracleRunCombat" in main:
        raise ValueError("Combat driver remains in geometry fixture")
    return main, enemy, main_calls, enemy_calls


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ffdec", type=Path, default=ROOT / ".tools/ffdec/ffdec.jar")
    parser.add_argument("--java")
    args = parser.parse_args()
    out = ROOT / ".build/oracle"
    out.mkdir(parents=True, exist_ok=True)
    report = {"status": "failed", "kind": "geometry", "ffdec_version": FFDEC_VERSION,
              "java_major": JAVA_MAJOR, "instrumented_classes": ["shootem_fla.MainTimeline", "enemy"],
              "clock": "one-synchronous-grid-per-diagnostic-frame", "geometry": "original-vector-hitTestPoint",
              "snapshots": 19, "grid_width": 64, "grid_height": 64, "sampled_points": 77824}
    try:
        original_path = ROOT / "original/elonashooter1.3.swf"
        main_path = ROOT / "src/shootem_fla/MainTimeline.as"
        original, main_bytes = original_path.read_bytes(), main_path.read_bytes()
        if digest(original) != ORIGINAL_SHA256:
            raise ValueError("Preserved original fingerprint differs")
        java = find_java(args.java)
        java_info = command([java, "-version"], 30)
        if java_info.returncode or not re.search(r'version\s+"' + JAVA_MAJOR + r'(?:\.|\")', java_info.stdout):
            raise RuntimeError("Oracle build requires Java " + JAVA_MAJOR)
        ffdec = str(args.ffdec.resolve())
        ffdec_info = command([java, "-jar", ffdec, "-help"], 30)
        version = re.search(r"JPEXS Free Flash Decompiler v\.([^\s]+)", ffdec_info.stdout)
        if ffdec_info.returncode or not version or version[1] != FFDEC_VERSION:
            raise RuntimeError("Oracle build requires FFDec " + FFDEC_VERSION)
        exported = out / "geometry-export"
        result = command([java, "-Xmx1g", "-jar", ffdec, "-selectclass", "enemy", "-export", "script", str(exported), str(original_path)])
        (out / "geometry-export.log").write_text(result.stdout, encoding="utf-8")
        enemy_path = exported / "scripts/enemy.as"
        if result.returncode or not enemy_path.is_file():
            raise RuntimeError("Unable to export original enemy class")
        enemy_bytes = enemy_path.read_bytes()
        main_source, enemy_source, main_calls, enemy_calls = instrument(main_bytes.decode("utf-8-sig"), enemy_bytes.decode("utf-8-sig"))
        generated_main, generated_enemy = out / "GeometryMainTimeline.as", out / "GeometryEnemy.as"
        generated_main.write_text(main_source, encoding="utf-8")
        generated_enemy.write_text(enemy_source, encoding="utf-8")
        candidate = out / ("geometry-compiled-" + uuid.uuid4().hex + ".swf")
        result = command([java, "-Xmx1g", "-jar", ffdec, "-replace", str(original_path), str(candidate),
                          "shootem_fla.MainTimeline", str(generated_main), "enemy", str(generated_enemy)], timeout=240)
        (out / "geometry-build.log").write_text(result.stdout, encoding="utf-8")
        if result.returncode or not candidate.is_file():
            raise RuntimeError("FFDec compilation failed; inspect .build/oracle/geometry-build.log")
        output = bytearray(candidate.read_bytes())
        output[3] = 10
        report.update(verify_resources(original, output))
        reference = out / "geometry-reference.swf"
        reference.write_bytes(output)
        if original_path.read_bytes() != original or main_path.read_bytes() != main_bytes:
            raise RuntimeError("A preserved input changed during oracle generation")
        report.update(status="passed", original_sha256=digest(original), source_sha256=digest(main_bytes),
                      enemy_source_sha256=digest(enemy_bytes), output_sha256=digest(output),
                      output=str(reference.relative_to(ROOT)).replace("\\", "/"), output_bytes=len(output),
                      intercepted_random_calls={"MainTimeline": main_calls, "enemy": enemy_calls},
                      original_method_logic_preserved=True, runtime_validated=False)
    except Exception as error:
        report["error"] = str(error)
    (out / "geometry-build-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0 if report["status"] == "passed" else 1


if __name__ == "__main__":
    sys.exit(main())
