"""Эталон исходного damageCastle и границ защитного счётчика одиночного шерифа."""
import argparse
import json
from pathlib import Path
import re
import sys
import uuid

from build import ROOT, ORIGINAL_SHA256, FFDEC_VERSION, JAVA_MAJOR, command, digest, find_java
from build_combat_oracle import COMBAT_AS3, instrument as instrument_combat, verify_resources
from build_shoot_oracle import extract_method


CASTLE_AS3 = r'''
      private var oraclePhase:int = -1;
      private var oracleCombatActive:Boolean = false;
      private var oracleCombatState:uint = 42;
      private var oracleCombatDraws:int = 0;
      private var oracleCombatEvents:Array = [];
      private var oracleCastleDraws:Array = [];
      private var oracleCastleDefends:int = 0;
      private var oracleCastleSnapshots:int = 0;
      private var oracleCastleCases:Array = [
         {name:"unskilled_full",seed:42,hp:40,damage:3},
         {name:"unskilled_low",seed:3735928559,hp:2,damage:3},
         {name:"defender_blocks",seed:42,hp:40,damage:3,defender:1},
         {name:"defender_fails",seed:3735928559,hp:40,damage:3,defender:1},
         {name:"insurance",seed:42,hp:40,damage:3,insurance:2},
         {name:"insurance_before_block",seed:42,hp:40,damage:3,defender:1,insurance:2},
         {name:"last_hope_full",seed:42,hp:40,damage:3,lastHope:1},
         {name:"last_hope_low",seed:42,hp:6,damage:3,lastHope:1},
         {name:"last_hope_empty_ally",seed:801,hp:40,damage:3,lastHope:1},
         {name:"last_hope_gate_fails",seed:3735928559,hp:40,damage:3,lastHope:1},
         {name:"last_hope_already_active",seed:42,hp:40,damage:3,lastHope:1,rampage:100},
         {name:"combined",seed:812,hp:40,damage:3,defender:1,insurance:2,lastHope:1},
         {name:"protection_blocks_before_skills",seed:42,hp:40,damage:3,defender:1,insurance:2,lastHope:1,protection:250,frames:1},
         {name:"protection_expires",seed:42,hp:40,damage:3,protection:1,blue:1.3,frames:1},
         {name:"protection_fade_finishes",seed:42,hp:40,damage:3,protection:-99,blue:0.05,frames:1},
         {name:"absorb_truncation",seed:3735928559,hp:40,damage:7,absorbFix:0.04},
         {name:"absorb_minimum",seed:3735928559,hp:40,damage:1,absorbFix:0.01}
      ];

      public function oracleCombatRandom() : Number
      {
         if(!oracleCombatActive) return Math.random();
         var value:int=int(oracleCombatState);
         value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
         oracleCombatState=uint(value); ++oracleCombatDraws;
         var result:Number=Number(oracleCombatState)/4294967296.0;
         oracleCastleDraws.push({index:oracleCombatDraws,state:oracleCombatState,value:result});
         return result;
      }
      public function oracleCombatDamage(id:int, damage:int, critType:int, hpBefore:int, hitX:int, hitY:int) : void {}

      private function oracleCastleState() : Object
      {
         return {castleHp:game.castleHP,castleMaxHp:game.castleMHP,money:player.money[_pc],totalMoney:game.totalMoney,
            protection:{counter:protTime,blueMultiplierAdd:col[0][2]},rampage:player.rampage[_pc],
            defender:PARTY.DEFENDER,insurance:PARTY.INSURANCE,lastHope:CALC.LAST_HOPE(_pc),fury:CALC.FURY(_pc),
            sandbag:game.sandbag,absorbFix:mission.absorbFix,immune:immune};
      }

      private function oracleCastleCase(config:Object) : void
      {
         oracleCombatActive=false; oracleCombatReset(uint(config.seed));
         var index:int;
         for(index=0;index<950;index++) player.trait[_pc][index]=0;
         player.trait[_pc][TRAIT.SHERIFF]=1; player.trait[_pc][TRAIT.SHOTGUN]=2; player.trait[_pc][TRAIT.FURY]=1;
         player.trait[_pc][TRAIT.BASE_AIMING]=1; player.trait[_pc][TRAIT.BASE_TEAMWORK]=1;
         player.trait[_pc][TRAIT.DEFENDER]=config.defender == undefined ? 0 : config.defender;
         player.trait[_pc][TRAIT.INSURANCE]=config.insurance == undefined ? 0 : config.insurance;
         player.trait[_pc][TRAIT.LAST_HOPE]=config.lastHope == undefined ? 0 : config.lastHope;
         for(index=0;index<maxAlly;index++) player.exist[index]=index == _pc;
         getBestSkill("DEFENDER"); getBestSkill("INSURANCE");
         PARTY.GUARDIAN=0; PARTY.GUARDIAN_LIST=[];
         hero=_pc; fireAtWill=false; immune=false; bgChange=0; frenzyMode=0; castleCounter=0; shakeCount=0;
         protTime=config.protection == undefined ? 0 : config.protection;
         col[0][2]=config.blue == undefined ? 0 : config.blue;
         player.rampage[_pc]=config.rampage == undefined ? 0 : config.rampage;
         player.shooting[_pc]=false; player.accuracyFix[_pc]=0; player.idleCount[_pc]=0; player.frenzy[_pc]=0;
         player.money[_pc]=100; game.totalMoney=500;
         game.castleHP=config.hp; game.castleMHP=40; game.sandbag=0;
         mission.absorbFix=config.absorbFix == undefined ? 0 : config.absorbFix;
         sister.dead=true;
         var before:Object=oracleCastleState();
         oracleCombatState=uint(config.seed); oracleCombatDraws=0; oracleCastleDraws=[]; oracleCastleDefends=0;
         oracleCombatActive=true;
         if(config.frames != undefined) for(index=0;index<config.frames;index++) onEnterFrame(new Event(Event.ENTER_FRAME));
         var afterFrames:Object=oracleCastleState();
         damageCastle(undefined,config.damage);
         oracleCombatActive=false;
         oracleEmit({type:"snapshot",kind:"castle",scenario:config.name,config:config,before:before,afterFrames:afterFrames,
            after:oracleCastleState(),defendEvents:oracleCastleDefends,draws:oracleCastleDraws,drawCount:oracleCombatDraws,rngState:oracleCombatState});
         ++oracleCastleSnapshots;
      }

      private function oracleBattleReady() : void
      {
         if(oraclePhase != 2) return;
         oraclePhase=3; timer.stop();
         removeEventListener(Event.ENTER_FRAME,onEnterFrame); removeEventListener(Event.ENTER_FRAME,oracleAdvance);
         if(amb != null) amb.stop();
         try
         {
            oracleEmit({type:"ready",kind:"castle",rng:"xorshift32",scenarios:oracleCastleCases.length,
               clock:"manual-original-frame-before-damageCastle",attacker:"undefined-solo-no-guardian",sandbag:0,maxAlly:maxAlly,hero:_pc});
            var config:Object;
            for each(config in oracleCastleCases) oracleCastleCase(config);
            gamePaused=true;
            oracleEmit({type:"complete",kind:"castle",ok:true,snapshots:oracleCastleSnapshots});
         }
         catch(error:Error)
         {
            oracleCombatActive=false; gamePaused=true;
            oracleEmit({type:"error",kind:"castle",message:error.message,phase:oraclePhase});
         }
      }
'''


def instrument(main_source, enemy_source):
    main, enemy, main_calls, enemy_calls = instrument_combat(main_source, enemy_source)
    main = main.replace(COMBAT_AS3, extract_method(COMBAT_AS3, "oracleCombatReset") + CASTLE_AS3)
    old = extract_method(main, "damageCastle")
    sound = "sound_defend.play(0,0,soundPos(640));"
    observer = "++oracleCastleDefends; "
    if old.count(sound) != 2:
        raise ValueError("Original castle defense sound sites changed")
    main = main.replace(old, old.replace(sound, observer + sound))
    if extract_method(main, "damageCastle").replace(observer, "").replace("oracleCombatRandom()", "Math.random()") != extract_method(main_source, "damageCastle"):
        raise ValueError("Original damageCastle body changed beyond observation and RNG")
    for name in ["castleAbsorb", "onEnterFrame", "rampageOn", "shake"]:
        if extract_method(main, name).replace("oracleCombatRandom()", "Math.random()") != extract_method(main_source, name):
            raise ValueError("Original dependency changed: " + name)
    return main, enemy, main_calls, enemy_calls


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ffdec", type=Path, default=ROOT / ".tools/ffdec/ffdec.jar")
    parser.add_argument("--java")
    args = parser.parse_args()
    out = ROOT / ".build/oracle"
    out.mkdir(parents=True, exist_ok=True)
    report = {"status": "failed", "kind": "castle", "ffdec_version": FFDEC_VERSION, "java_major": JAVA_MAJOR,
              "rng": "xorshift32", "instrumented_classes": ["shootem_fla.MainTimeline", "enemy"],
              "clock": "manual-original-frame-before-damageCastle", "geometry": "no-geometry", "input_seam": "none"}
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
        exported = out / "castle-export"
        result = command([java, "-Xmx1g", "-jar", ffdec, "-selectclass", "enemy", "-export", "script", str(exported), str(original_path)])
        (out / "castle-export.log").write_text(result.stdout, encoding="utf-8")
        enemy_path = exported / "scripts/enemy.as"
        if result.returncode or not enemy_path.is_file():
            raise RuntimeError("Unable to export original enemy class")
        enemy_bytes = enemy_path.read_bytes()
        injected_main, injected_enemy, main_calls, enemy_calls = instrument(main_bytes.decode("utf-8-sig"), enemy_bytes.decode("utf-8-sig"))
        generated_main, generated_enemy = out / "CastleMainTimeline.as", out / "CastleEnemy.as"
        generated_main.write_text(injected_main, encoding="utf-8")
        generated_enemy.write_text(injected_enemy, encoding="utf-8")
        candidate = out / ("castle-compiled-" + uuid.uuid4().hex + ".swf")
        result = command([java, "-Xmx1g", "-jar", ffdec, "-replace", str(original_path), str(candidate),
                          "shootem_fla.MainTimeline", str(generated_main), "enemy", str(generated_enemy)], timeout=240)
        (out / "castle-build.log").write_text(result.stdout, encoding="utf-8")
        if result.returncode or not candidate.is_file():
            raise RuntimeError("FFDec compilation failed; inspect .build/oracle/castle-build.log")
        output = bytearray(candidate.read_bytes()); output[3] = 10
        report.update(verify_resources(original, output))
        reference = out / "castle-reference.swf"; reference.write_bytes(output)
        if original_path.read_bytes() != original or main_path.read_bytes() != main_bytes:
            raise RuntimeError("A preserved input changed during oracle generation")
        report.update(status="passed", original_sha256=digest(original), source_sha256=digest(main_bytes),
                      enemy_source_sha256=digest(enemy_bytes), output_sha256=digest(output), output_bytes=len(output),
                      output=str(reference.relative_to(ROOT)).replace("\\", "/"),
                      intercepted_random_calls={"MainTimeline": main_calls, "enemy": enemy_calls},
                      original_castle_methods_preserved=True, runtime_validated=False)
    except Exception as error:
        report["error"] = str(error)
    (out / "castle-build-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0 if report["status"] == "passed" else 1


if __name__ == "__main__":
    sys.exit(main())
