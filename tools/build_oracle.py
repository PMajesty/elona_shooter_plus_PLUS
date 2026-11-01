"""Собирает отдельный SWF с наблюдением за исходными методами перезарядки."""
import argparse
import json
from pathlib import Path
import re
import sys
import uuid

from build import ROOT, ORIGINAL_SHA256, FFDEC_VERSION, JAVA_MAJOR, command, digest, find_java, verify


AS3 = r'''
      private var oraclePhase:int = -1;
      private var oracleScenario:String = "";
      private var oracleSounds:Array = [];
      private var oracleAnimations:Array = [];
      private var oracleCounts:Array = [];
      private var oracleSnapshots:int = 0;
      private var oracleCaseSnapshots:int = 0;
      private var oracleReady:Boolean = false;

      private function oracleString(value:String) : String
      {
         return "\"" + value.split("\\").join("\\\\").split("\"").join("\\\"").split("\r").join("\\r").split("\n").join("\\n").split("\t").join("\\t") + "\"";
      }

      private function oracleJson(value:*) : String
      {
         var parts:Array = [];
         var keys:Array = [];
         var key:String;
         var item:*;
         if(value == null) return "null";
         if(value is String) return oracleString(String(value));
         if(value is Boolean) return value ? "true" : "false";
         if(value is Number || value is int || value is uint) return isFinite(Number(value)) ? String(value) : "null";
         if(value is Array)
         {
            for each(item in value) parts.push(oracleJson(item));
            return "[" + parts.join(",") + "]";
         }
         for(key in value) keys.push(key);
         keys.sort();
         for each(key in keys) parts.push(oracleString(key) + ":" + oracleJson(value[key]));
         return "{" + parts.join(",") + "}";
      }

      private function oracleEmit(value:Object) : void
      {
         value.version = 1;
         trace("ELONA_ORACLE:" + oracleJson(value));
      }

      private function oracleBootstrap() : void
      {
         if(oraclePhase != -1) return;
         oraclePhase = 0;
         addEventListener(Event.ENTER_FRAME,oracleAdvance);
      }

      private function oracleAdvance(event:Event) : void
      {
         try
         {
            if(oraclePhase == 0 && gameStage == _stageTitle)
            {
               oraclePhase = 1;
               // Та же ветка New Game, без зависимости от координат мыши.
               root.transform.colorTransform = new ColorTransform(0,0,0,1,0,0,0,0);
               saveBox.visible = false;
               saveBox.enabled = false;
               stage.focus = stage;
               exitTitle();
               eventList.push(_eventBegin);
               eventList.push(_eventGene);
               generateMission(0);
               gotoAndPlay("event");
            }
            else if(oraclePhase == 1 && ce == _eventGene && delay > 45 && window2_mc != null && radioCount == 4)
            {
               oraclePhase = 2;
               unlocked = false;
               geneClass = 2;
               cs = 0;
               window2_mc.optCasual.selected = false;
               window2_mc.optHC.selected = false;
               updateGene();
               // Proceed в исходнике запускает затухание, затем exitMenuResult/gameStart.
               fadeCount = 9;
            }
         }
         catch(error:Error)
         {
            removeEventListener(Event.ENTER_FRAME,oracleAdvance);
            oracleEmit({type:"error",message:error.message,phase:oraclePhase});
         }
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
            var wi:int = weapon(_pc);
            if(player.devType[_pc] != _devSheriff || inventory.id[wi] != 3) throw new Error("Original New Game did not initialize Sheriff and shotgun");
            oracleReady = true;
            if(ExternalInterface.available) ExternalInterface.addCallback("oracleRun",oracleRun);
            oracleEmit({type:"ready",weaponId:inventory.id[wi],ammoMax:inventory.ammoMax[wi],reloadTimeMax:inventory.reloadTimeMax[wi],manualReload:inventory.manualReload[wi],autoReload:inventory.autoReload[wi],reloadSkill:CALC.RELOADING(_pc),clock:"manual-original-methods"});
            oracleRun();
         }
         catch(error:Error)
         {
            oracleEmit({type:"error",message:error.message,phase:oraclePhase});
         }
      }

      private function oracleReset(name:String, ammo:int, rampage:int = 0) : void
      {
         var wi:int = weapon(_pc);
         oracleScenario = name;
         oracleCaseSnapshots = 0;
         gamePaused = false;
         mission.newWave = false;
         mission.time = 100000;
         inventory.ammo[wi] = ammo;
         inventory.reloadTime[wi] = 0;
         player.rampage[_pc] = rampage;
         player.shootTimer[_pc] = 0;
         player.shooting[_pc] = false;
         player_mc[_pc].gotoAndStop(player_mc[_pc].anime2);
         oracleSounds = [];
         oracleAnimations = [];
         oracleSample("initial",0);
      }

      private function oracleSample(op:String, step:int) : void
      {
         var wi:int = weapon(_pc);
         oracleEmit({type:"snapshot",scenario:oracleScenario,op:op,step:step,ammo:inventory.ammo[wi],reloadTicks:inventory.reloadTime[wi],rampage:player.rampage[_pc],paused:gamePaused,frame:player_mc[_pc].currentFrame,sounds:oracleSounds,animations:oracleAnimations});
         oracleSounds = [];
         oracleAnimations = [];
         ++oracleSnapshots;
         ++oracleCaseSnapshots;
      }

      private function oracleEndCase() : void
      {
         oracleCounts.push({name:oracleScenario,snapshots:oracleCaseSnapshots});
      }

      private function oracleFill(name:String, ammo:int, rampage:int = 0) : void
      {
         var wi:int = weapon(_pc);
         oracleReset(name,ammo,rampage);
         reload(_pc,wi);
         oracleSample("reload",0);
         var step:int = 0;
         while(inventory.reloadTime[wi] > 0 && step < 100)
         {
            ++step;
            reloading(_pc,wi);
            oracleSample("timer",step);
         }
         if(step >= 100) throw new Error("Original reload did not finish within 100 manual timer calls");
         oracleEndCase();
      }

      private function oracleCancel(name:String, ticks:int) : void
      {
         var wi:int = weapon(_pc);
         oracleReset(name,0);
         reload(_pc,wi);
         oracleSample("reload",0);
         var step:int = 0;
         while(step < ticks)
         {
            ++step;
            reloading(_pc,wi);
            oracleSample("timer",step);
         }
         cancelReload(_pc,wi);
         oracleSample("cancel",step);
         oracleEndCase();
      }

      public function oracleRun() : Boolean
      {
         if(!oracleReady) return false;
         oracleCounts = [];
         oracleSnapshots = 0;
         try
         {
            oracleFill("empty_reload",0);
            oracleCancel("cancel_before_shell",2);
            oracleCancel("cancel_after_shell",7);
            oracleReset("pause_gate",0);
            reload(_pc,weapon(_pc));
            oracleSample("reload",0);
            gamePaused = true;
            oracleSample("pause",0);
            var step:int = 0;
            while(step < 3)
            {
               ++step;
               onTick(new TimerEvent(TimerEvent.TIMER));
               oracleSample("paused_timer",step);
            }
            gamePaused = false;
            oracleSample("resume",step);
            onTick(new TimerEvent(TimerEvent.TIMER));
            oracleSample("resumed_timer",step + 1);
            oracleEndCase();
            oracleFill("rampage_reload",3,300);
            gamePaused = true;
            oracleEmit({type:"complete",scenarios:oracleCounts,snapshots:oracleSnapshots,ok:true});
            return true;
         }
         catch(error:Error)
         {
            gamePaused = true;
            oracleEmit({type:"error",message:error.message,scenario:oracleScenario});
            return false;
         }
      }
'''


def method_span(source, name):
    match = re.search(r"\bfunction " + re.escape(name) + r"\(", source)
    if not match:
        raise ValueError(f"Missing source method {name}")
    begin = source.index("{", match.end()) + 1
    end = source.index("\n      }", begin)
    return begin, end


def append_method(source, name, statement):
    _, end = method_span(source, name)
    return source[:end] + "\n         " + statement + source[end:]


def instrument(source):
    source = source.replace("   import flash.events.*;", "   import flash.events.*;\n   import flash.external.ExternalInterface;")
    # Меняются только наблюдатели вызовов, исходная арифметика методов сохраняется.
    for name in ("reload", "reloading", "cancelReload"):
        begin, end = method_span(source, name)
        body = source[begin:end]
        body = re.sub(r"(?m)^(\s*)(sound_\w+)\.play\(",
                      lambda m: m[1] + 'oracleSounds.push("' + m[2] + '");\n' + m[1] + m[2] + '.play(', body)
        body = re.sub(r"(?m)^(\s*)player_mc\[param1\]\.(gotoAndPlay|gotoAndStop)\(([^;]+)\);",
                      lambda m: m[1] + 'oracleAnimations.push({method:"' + m[2] + '",target:' + m[3] + '});\n' + m[0], body)
        recovered = re.sub(r"(?m)^[ \t]*oracle(?:Sounds|Animations)\.push\([^\n]+\);\n", "", body)
        if re.sub(r"\s+", "", recovered) != re.sub(r"\s+", "", source[begin:end]):
            raise ValueError(f"Observer injection changed original {name} logic")
        source = source[:begin] + body + source[end:]
    source = append_method(source, "elonaInitializeTitle", "oracleBootstrap();")
    source = append_method(source, "frame27", "oracleBattleReady();")
    closing = source.rfind("\n   }")
    if closing < 0:
        raise ValueError("Cannot find MainTimeline class closing brace")
    return source[:closing] + "\n" + AS3 + source[closing:]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ffdec", type=Path, default=ROOT / ".tools/ffdec/ffdec.jar")
    parser.add_argument("--java")
    args = parser.parse_args()
    out = ROOT / ".build/oracle"
    out.mkdir(parents=True, exist_ok=True)
    report = {"status": "failed", "ffdec_version": FFDEC_VERSION, "java_major": JAVA_MAJOR,
              "clock": "manual-original-methods", "scenarios": ["empty_reload", "cancel_before_shell", "cancel_after_shell", "pause_gate", "rampage_reload"]}
    try:
        original_path = ROOT / "original/elonashooter1.3.swf"
        source_path = ROOT / "src/shootem_fla/MainTimeline.as"
        original, source_bytes = original_path.read_bytes(), source_path.read_bytes()
        if digest(original) != ORIGINAL_SHA256:
            raise ValueError("Preserved original fingerprint differs")
        source = source_bytes.decode("utf-8-sig")
        generated = out / "MainTimeline.as"
        generated.write_text(instrument(source), encoding="utf-8")
        java = find_java(args.java)
        java_info = command([java, "-version"], 30)
        if java_info.returncode or not re.search(r'version\s+"' + JAVA_MAJOR + r'(?:\.|\")', java_info.stdout):
            raise RuntimeError("Oracle build requires Java " + JAVA_MAJOR)
        ffdec_info = command([java, "-jar", str(args.ffdec.resolve()), "-help"], 30)
        version = re.search(r"JPEXS Free Flash Decompiler v\.([^\s]+)", ffdec_info.stdout)
        if ffdec_info.returncode or not version or version[1] != FFDEC_VERSION:
            raise RuntimeError("Oracle build requires FFDec " + FFDEC_VERSION)
        candidate = out / ("compiled-" + uuid.uuid4().hex + ".swf")
        result = command([java, "-Xmx1g", "-jar", str(args.ffdec.resolve()), "-replace",
                          str(original_path), str(candidate), "shootem_fla.MainTimeline", str(generated)], timeout=240)
        (out / "build.log").write_text(result.stdout, encoding="utf-8")
        if result.returncode or not candidate.is_file():
            raise RuntimeError("FFDec compilation failed; inspect .build/oracle/build.log")
        output = bytearray(candidate.read_bytes())
        output[3] = 10
        report.update(verify(original, output))
        reference = out / "reference.swf"
        reference.write_bytes(output)
        if original_path.read_bytes() != original or source_path.read_bytes() != source_bytes:
            raise RuntimeError("A preserved input changed during oracle generation")
        report.update(status="passed", original_sha256=digest(original), source_sha256=digest(source_bytes),
                      instrumented_source_sha256=digest(generated.read_bytes()), output_sha256=digest(output),
                      output=str(reference.relative_to(ROOT)).replace("\\", "/"), output_bytes=len(output),
                      original_reload_logic_preserved=True,
                      runtime_validated=False)
    except Exception as error:
        report["error"] = str(error)
    (out / "build-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0 if report["status"] == "passed" else 1


if __name__ == "__main__":
    sys.exit(main())
