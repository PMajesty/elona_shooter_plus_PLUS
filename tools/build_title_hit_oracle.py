"""Проверяет исходные TextField-состояния трёх кнопок заголовка через hitTestPoint."""
import json
import re
import uuid

from build import ROOT, ORIGINAL_SHA256, command, digest, find_java
from build_combat_oracle import verify_resources
from build_oracle import AS3, instrument_startup, method_span


DRIVER = r'''
      private var oraclePhase:int = -1;
      private var oracleTitleTicks:int = 0;
      private function oracleBootstrap() : void {
         if(oraclePhase != -1) return;
         oraclePhase = 0;
         addEventListener(Event.ENTER_FRAME,oracleAdvance);
      }
      private function oracleBattleReady() : void {}
      private function oracleAdvance(event:Event) : void {
         if(++oracleTitleTicks < 5) return;
         removeEventListener(Event.ENTER_FRAME,oracleAdvance);
         removeEventListener(Event.ENTER_FRAME,onEnterFrame_title);
         oraclePhase = 3;
         try {
            if(amb != null) amb.stop();
            oracleEmit({type:"ready",kind:"title-hit",clock:"synchronous-original-hitTestPoint",snapshots:12});
            var buttons:Array=[newGameButton,continueButton,helpButton];
            var names:Array=["newGame","continue","help"];
            var sourceIds:Array=[2521,2542,2579];
            var stateNames:Array=["up","over","down","hit"];
            var index:int; var stateIndex:int; var state:DisplayObject; var button:SimpleButton;
            var rect:Rectangle; var point:Array; var points:Array; var results:Array; var probe:SimpleButton;
            var right:Number;
            for(index=0;index<buttons.length;index++) {
               button=buttons[index];
               // Сохраняются сами исходные display-состояния, без растеризации или копии контуров.
               var states:Array=[button.upState,button.overState,button.downState,button.hitTestState];
               button.visible=false;
               right=index==2 ? 134 : 191;
               points=[[100,0],[80,-10],[50,0],[51,0],[52.95,0],[53,0],
                  [80,-18],[80,-17.9],[80,-17],[80,17.9],[80,18],[80,18.8],[80,18.85],
                  [right-2,0],[right-0.05,0],[right,0],[right+0.05,0]];
               for(stateIndex=0;stateIndex<states.length;stateIndex++) {
                  state=states[stateIndex];
                  // Up-состояние диагностической кнопки получает выбранный исходный объект.
                  // Так hitTestPoint исполняется для каждого состояния без синтетического MouseEvent.
                  probe=new SimpleButton(state,state,state,state);
                  probe.enabled=false; probe.mouseEnabled=false;
                  probe.x=200; probe.y=200; stage.addChild(probe);
                  rect=probe.getBounds(stage); results=[];
                  for each(point in points) results.push({localX:point[0],localY:point[1],
                     worldX:200+point[0],worldY:200+point[1],hit:probe.hitTestPoint(200+point[0],200+point[1],true)});
                  oracleEmit({type:"snapshot",kind:"title-hit",button:names[index],symbol:sourceIds[index],state:stateNames[stateIndex],
                     bounds:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},points:results});
                  stage.removeChild(probe);
               }
            }
            oracleEmit({type:"complete",kind:"title-hit",ok:true,snapshots:12,sampledPoints:204});
         } catch(error:Error) { oracleEmit({type:"error",kind:"title-hit",message:error.message}); }
      }
'''


def instrument(source):
    methods = []
    for name in ("oracleString", "oracleJson", "oracleEmit", "oracleObserveStartup"):
        start = re.search(r"\n      private function " + name + r"\(", AS3).start()
        _, end = method_span(AS3, name)
        methods.append(AS3[start:end + len("\n      }")])
    transformed = instrument_startup(source)
    closing = transformed.rfind("\n   }")
    return transformed[:closing] + "\n" + "\n".join(methods) + DRIVER + transformed[closing:]


def main():
    out = ROOT / ".build/oracle"
    out.mkdir(parents=True, exist_ok=True)
    original_path = ROOT / "original/elonashooter1.3.swf"
    source_path = ROOT / "src/shootem_fla/MainTimeline.as"
    original, source = original_path.read_bytes(), source_path.read_bytes()
    report = {"status": "failed", "kind": "title-hit", "snapshots": 12, "sampled_points": 204,
              "clock": "synchronous-original-hitTestPoint", "native_mouse_events": False,
              "geometry": "original-SimpleButton-TextField-states", "runtime_validated": False}
    try:
        if digest(original) != ORIGINAL_SHA256:
            raise ValueError("Preserved original fingerprint differs")
        generated = out / "TitleHitMainTimeline.as"
        generated.write_text(instrument(source.decode("utf-8-sig")), encoding="utf-8")
        candidate = out / ("title-hit-compiled-" + uuid.uuid4().hex + ".swf")
        result = command([find_java(None), "-Xmx1g", "-jar", str(ROOT / ".tools/ffdec/ffdec.jar"),
                          "-replace", str(original_path), str(candidate), "shootem_fla.MainTimeline", str(generated)], timeout=240)
        (out / "title-hit-build.log").write_text(result.stdout, encoding="utf-8")
        if result.returncode or not candidate.is_file():
            raise RuntimeError("FFDec compilation failed; inspect title-hit-build.log")
        output = bytearray(candidate.read_bytes())
        output[3] = 10
        report.update(verify_resources(original, output))
        reference = out / "title-hit-reference.swf"
        reference.write_bytes(output)
        if original_path.read_bytes() != original or source_path.read_bytes() != source:
            raise RuntimeError("A preserved input changed during the build")
        report.update(status="passed", original_sha256=digest(original), source_sha256=digest(source),
                      instrumented_source_sha256=digest(generated.read_bytes()), output_sha256=digest(output),
                      output=".build/oracle/title-hit-reference.swf", output_bytes=len(output),
                      original_hit_methods_and_non_code_resources_preserved=True)
    except Exception as error:
        report["error"] = str(error)
    (out / "title-hit-build-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0 if report["status"] == "passed" else 1


if __name__ == "__main__":
    raise SystemExit(main())
