"""Собирает эталон исходного spawnEnemy/procHit с наблюдением за enemy.damage."""
import argparse
import json
from pathlib import Path
import re
import sys
import uuid

from build import ROOT, ORIGINAL_SHA256, FFDEC_VERSION, JAVA_MAJOR, command, digest, find_java, unpack
from build_oracle import append_method
from build_wave_oracle import shared_driver_methods


COMBAT_AS3 = r'''
      private var oraclePhase:int = -1;
      private var oracleCombatActive:Boolean = false;
      private var oracleCombatReady:Boolean = false;
      private var oracleCombatState:uint = 1;
      private var oracleCombatDraws:int = 0;
      private var oracleCombatEvents:Array = [];
      private var oracleCombatSnapshots:int = 0;

      public function oracleCombatRandom() : Number
      {
         if(!oracleCombatActive) return Math.random();
         var value:int = int(oracleCombatState);
         value ^= value << 13;
         value ^= value >>> 17;
         value ^= value << 5;
         oracleCombatState = uint(value);
         ++oracleCombatDraws;
         return Number(oracleCombatState) / 4294967296.0;
      }

      public function oracleCombatDamage(id:int, damage:int, critType:int, hpBefore:int, hitX:int, hitY:int) : void
      {
         if(oracleCombatActive) oracleCombatEvents.push({enemyId:id,damage:damage,critType:critType,hpBefore:hpBefore,x:hitX,y:hitY});
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
            oracleCombatReady = true;
            if(ExternalInterface.available) ExternalInterface.addCallback("oracleRunCombat",oracleRunCombat);
            oracleEmit({type:"ready",kind:"combat",spawnSeeds:[42,3735928559],enemyIds:[3,17,19,6,999],rng:"xorshift32",clock:"synchronous-original-methods",geometry:"original-vector-hitTestPoint",displayAdvance:"none-after-init-or-explicit-frame"});
            oracleRunCombat();
         }
         catch(error:Error)
         {
            oracleCombatActive = false;
            oracleEmit({type:"error",kind:"combat",message:error.message,phase:oraclePhase});
         }
      }

      private function oracleCombatReset(seed:uint) : void
      {
         var index:int = 0;
         while(index < maxEnemy)
         {
            if(enemyArray[index].parent != null) enemyArray[index].oracleDetach();
            ++index;
         }
         // Новый исходный объект исключает остаточные эффекты предыдущей пробы.
         enemyArray[0] = new enemy();
         gamePaused = false;
         game.day = 1;
         game.boss = 0;
         game.laptop = false;
         game.casual = false;
         game.tight = false;
         game.totalKill = 0;
         mission.level = 0;
         mission.strength = 0;
         mission.hpFix = 1;
         mission.dmgFix = 1;
         mission.expFix = 1;
         mission.bossDay = false;
         mission.newWave = false;
         mission.time = 100000;
         mission.wave = 4;
         mission.group[4] = 10;
         mission.loot = [];
         mission.criticalCount = 0;
         player.exp[_pc] = 0;
         player.kill[_pc] = 0;
         player.earn[_pc] = 0;
         player.rampage[_pc] = 0;
         player.wexp[_pc][player.wexpRef[_pc]] = 0;
         player.shootTimer[_pc] = 0;
         player.shooting[_pc] = false;
         targetBoss = undefined;
         oracleCombatState = seed == 0 ? 1 : seed;
         oracleCombatDraws = 0;
         oracleCombatEvents = [];
      }

      private function oracleSpawnCase(seed:uint, id:int) : void
      {
         oracleCombatReset(seed);
         oracleCombatActive = true;
         var slot:int = spawnEnemy(id);
         oracleCombatActive = false;
         var target:* = enemyArray[slot];
         target.mc.stop();
         oracleEmit({type:"snapshot",kind:"combat",scenario:"spawn",seed:seed,enemyId:id,drawCount:oracleCombatDraws,rngState:oracleCombatState,enemy:target.oracleState(),displayAdvance:"none-after-init"});
         ++oracleCombatSnapshots;
      }

      private function oracleHitCase(name:String, id:int, frame:int, localX:int, localY:int) : void
      {
         var seed:uint = 42;
         oracleCombatReset(seed);
         // Инициализация тоже детерминирована, но счётчик для удара начинается отдельно.
         oracleCombatActive = true;
         var slot:int = spawnEnemy(id);
         oracleCombatActive = false;
         var target:* = enemyArray[slot];
         target.x = 200;
         target.y = 220;
         target.mc.gotoAndStop(frame);
         var before:Object = target.oracleState();
         var hitX:int = int(target.x) + localX;
         var hitY:int = int(target.y) + localY;
         var shapeHit:Boolean = target.mc.hitTestPoint(hitX,hitY,true);
         var shadowExcluded:Boolean = target.mc.shadowHit == false && target.mc.shadow != null && target.mc.shadow.hitTestPoint(hitX,hitY,true);
         var wi:int = weapon(_pc);
         var rawDamage:int = int(inventory.attack[wi] * mission.dmgFix * (100 + CALC.AIMED_SHOT(_pc) + CALC.NOBLE(_pc)) / 100);
         oracleCombatState = seed;
         oracleCombatDraws = 0;
         oracleCombatEvents = [];
         oracleCombatActive = true;
         var hit:Boolean = procHit(_pc,wi,hitX,hitY,rawDamage);
         oracleCombatActive = false;
         oracleEmit({type:"snapshot",kind:"combat",scenario:name,seed:seed,enemyId:id,point:{x:hitX,y:hitY},rawDamage:rawDamage,before:before,after:target.oracleState(),geometry:{shapeHit:shapeHit,shadowExcluded:shadowExcluded},hit:hit,damageEvents:oracleCombatEvents,playerDelta:{exp:player.exp[_pc],kills:player.kill[_pc],weaponExp:player.wexp[_pc][player.wexpRef[_pc]],rampage:player.rampage[_pc],earnedGold:player.earn[_pc],criticalKills:mission.criticalCount,loot:mission.loot.concat()},drawCount:oracleCombatDraws,rngState:oracleCombatState,displayAdvance:"none-after-explicit-frame"});
         ++oracleCombatSnapshots;
      }

      public function oracleRunCombat() : Boolean
      {
         if(!oracleCombatReady) return false;
         oracleCombatSnapshots = 0;
         try
         {
            var seed:Number;
            var id:int;
            for each(seed in [42,3735928559])
            {
               for each(id in [3,17,19,6,999]) oracleSpawnCase(uint(seed),id);
            }
            oracleHitCase("sheep_miss",3,5,-100,-100);
            oracleHitCase("sheep_body",3,5,0,-5);
            oracleHitCase("sheep_crit_inside",3,5,10,4);
            oracleHitCase("sheep_crit_left_boundary",3,5,4,4);
            oracleHitCase("sheep_crit_left_inside",3,5,5,4);
            oracleHitCase("sheep_crit_right_boundary",3,5,19,4);
            oracleHitCase("sheep_crit_top_boundary",3,5,10,-1);
            oracleHitCase("sheep_crit_top_inside",3,5,10,0);
            oracleHitCase("sheep_crit_bottom_boundary",3,5,10,9);
            oracleHitCase("crow_body",6,3,0,0);
            oracleHitCase("rat_lethal",17,14,0,-5);
            gamePaused = true;
            oracleEmit({type:"complete",kind:"combat",ok:true,snapshots:oracleCombatSnapshots,spawnCases:10,hitCases:11});
            return true;
         }
         catch(error:Error)
         {
            oracleCombatActive = false;
            gamePaused = true;
            oracleEmit({type:"error",kind:"combat",message:error.message});
            return false;
         }
      }
'''

ENEMY_AS3 = r'''
      public function oracleDetach() : void
      {
         removeEventListener(Event.ENTER_FRAME,onEnterFrame);
         mc.stop();
         if(parent != null) parent.removeChild(this);
      }

      public function oracleState() : Object
      {
         var bounds:Rectangle = mc.getBounds(this);
         return {id:id,level:lv,x:x,y:y,hp:hp,attack:attack,speed:speed,speedOrg:speedOrg,gold:gold,exp:exp,crit:crit.concat(),knockBack:knockBack,attacking:attacking,attacked:attacked,dropping:dropping,type:type,drop:drop,deathTicks:deathAnimeDuration,frame:mc.currentFrame,scaleX:mc.scaleX,scaleY:mc.scaleY,width:mc.width,height:mc.height,bounds:{x:bounds.x,y:bounds.y,width:bounds.width,height:bounds.height},shadowHit:mc.shadowHit,alive:!isDead(),free:isFree(),boss:{weapon:boss.weapon,action:boss.action,count:boss.count,idle:boss.idle,fireNum:boss.fireNum,hpMax:boss.hpMax}};
      }
'''


def append_class(source, extra):
    closing = source.rfind("\n   }")
    if closing < 0:
        raise ValueError("Missing class closing brace")
    return source[:closing] + "\n" + extra + source[closing:]


def instrument(main_source, enemy_source):
    main_calls, enemy_calls = main_source.count("Math.random()"), enemy_source.count("Math.random()")
    main = main_source.replace("Math.random()", "oracleCombatRandom()")
    enemy = enemy_source.replace("Math.random()", "_root.oracleCombatRandom()")
    if main.replace("oracleCombatRandom()", "Math.random()") != main_source or enemy.replace("_root.oracleCombatRandom()", "Math.random()") != enemy_source:
        raise ValueError("Random wrapper changed original logic")
    marker = "         hp -= rawDamage;"
    if enemy.count(marker) != 1:
        raise ValueError("Original damage observation point changed")
    observer = "         _root.oracleCombatDamage(id,rawDamage,critType,hp,hitX,hitY);\n"
    enemy = enemy.replace(marker, observer + marker)
    if enemy.replace(observer, "").replace("_root.oracleCombatRandom()", "Math.random()") != enemy_source:
        raise ValueError("Damage observer changed original logic")
    main = main.replace("   import flash.events.*;", "   import flash.events.*;\n   import flash.external.ExternalInterface;")
    main = append_method(main, "elonaInitializeTitle", "oracleBootstrap();")
    main = append_method(main, "frame27", "oracleBattleReady();")
    return append_class(main, shared_driver_methods() + COMBAT_AS3), append_class(enemy, ENEMY_AS3), main_calls, enemy_calls


def verify_resources(original, output):
    old_header, old_tags = unpack(original)
    new_header, new_tags = unpack(output)
    if original[:3] != output[:3] or output[3] != 10 or old_header != new_header or len(old_tags) != len(new_tags):
        raise ValueError("SWF header or tag count changed")
    changed = []
    for index, ((old_kind, old), (new_kind, new)) in enumerate(zip(old_tags, new_tags)):
        if old_kind != new_kind:
            raise ValueError("SWF tag order/type changed")
        if old != new:
            if old_kind != 82:
                raise ValueError(f"Non-code resource changed at {index}")
            changed.append(index)
    if len(changed) not in (1, 2):
        raise ValueError(f"Expected one or two changed DoABC payloads, found {len(changed)}")
    return {"tag_count": len(old_tags), "modified_doabc_tag_indices": changed,
            "all_non_doabc_tag_payloads_identical": True, "tag_types_and_order_identical": True,
            "frame_header_identical": True, "original_swf_version": original[3], "output_swf_version": output[3]}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ffdec", type=Path, default=ROOT / ".tools/ffdec/ffdec.jar")
    parser.add_argument("--java")
    args = parser.parse_args()
    out = ROOT / ".build/oracle"
    out.mkdir(parents=True, exist_ok=True)
    report = {"status": "failed", "kind": "combat", "ffdec_version": FFDEC_VERSION, "java_major": JAVA_MAJOR,
              "rng": "xorshift32", "instrumented_classes": ["shootem_fla.MainTimeline", "enemy"],
              "clock": "synchronous-original-methods", "geometry": "original-vector-hitTestPoint"}
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
        exported = out / "combat-export"
        result = command([java, "-Xmx1g", "-jar", ffdec, "-selectclass", "enemy", "-export", "script", str(exported), str(original_path)])
        (out / "combat-export.log").write_text(result.stdout, encoding="utf-8")
        enemy_path = exported / "scripts/enemy.as"
        if result.returncode or not enemy_path.is_file():
            raise RuntimeError("Unable to export original enemy class")
        enemy_bytes = enemy_path.read_bytes()
        injected_main, injected_enemy, main_calls, enemy_calls = instrument(main_bytes.decode("utf-8-sig"), enemy_bytes.decode("utf-8-sig"))
        generated_main, generated_enemy = out / "CombatMainTimeline.as", out / "CombatEnemy.as"
        generated_main.write_text(injected_main, encoding="utf-8")
        generated_enemy.write_text(injected_enemy, encoding="utf-8")
        candidate = out / ("combat-compiled-" + uuid.uuid4().hex + ".swf")
        result = command([java, "-Xmx1g", "-jar", ffdec, "-replace", str(original_path), str(candidate),
                          "shootem_fla.MainTimeline", str(generated_main), "enemy", str(generated_enemy)], timeout=240)
        (out / "combat-build.log").write_text(result.stdout, encoding="utf-8")
        if result.returncode or not candidate.is_file():
            raise RuntimeError("FFDec compilation failed; inspect .build/oracle/combat-build.log")
        output = bytearray(candidate.read_bytes())
        output[3] = 10
        report.update(verify_resources(original, output))
        reference = out / "combat-reference.swf"
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
    (out / "combat-build-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0 if report["status"] == "passed" else 1


if __name__ == "__main__":
    sys.exit(main())
