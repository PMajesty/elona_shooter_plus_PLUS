"""Собирает отдельный эталон настоящего shoot(), сохраняя старую проверку procHit."""
import argparse
import json
from pathlib import Path
import re
import sys
import uuid

from build import ROOT, ORIGINAL_SHA256, FFDEC_VERSION, JAVA_MAJOR, command, digest, find_java
from build_combat_oracle import COMBAT_AS3, append_class, instrument as instrument_combat, verify_resources
from build_oracle import method_span


def extract_method(source, name):
    start = re.search(r"\n      (?:public|private) function " + name + r"\(", source).start()
    _, end = method_span(source, name)
    return source[start:end + len("\n      }")]


SHOOT_AS3 = r'''
      private var oraclePhase:int = -1;
      private var oracleCombatActive:Boolean = false;
      private var oracleCombatState:uint = 1;
      private var oracleCombatDraws:int = 0;
      private var oracleCombatEvents:Array = [];
      private var oracleShootPellets:Array = [];
      private var oracleShootDraws:Array = [];
      private var oracleShootAimX:int = 200;
      private var oracleShootAimY:int = 215;
      private var oracleShootSnapshots:int = 0;
      private var oracleShootCases:Array = [
         {name:"miss",enemyId:3,frame:5,aimX:100,aimY:100,hp:1000},
         {name:"body",enemyId:3,frame:5,aimX:200,aimY:215,hp:1000},
         {name:"critical",enemyId:3,frame:5,aimX:210,aimY:224,hp:1000,precision:true},
         {name:"dead_body",enemyId:3,frame:107,aimX:200,aimY:224,hp:0,precision:true},
         {name:"holliday",enemyId:3,frame:5,aimX:200,aimY:215,hp:1000,holliday:1},
         {name:"sense",enemyId:3,frame:5,aimX:200,aimY:224,hp:1000,precision:true,sense:10},
         {name:"learned_modified",enemyId:3,frame:5,aimX:200,aimY:215,hp:1000,holliday:1,learned:true,mods:true},
         {name:"lethal",enemyId:17,frame:14,aimX:200,aimY:215,precision:true},
         {name:"level_up_living",enemyId:17,frame:14,aimX:200,aimY:215,precision:true,experience:990,living:true},
         {name:"boss_nonlethal",enemyId:999,frame:30,aimX:200,aimY:215,precision:true,attack:1},
         {name:"boss_accumulated",enemyId:999,frame:30,aimX:200,aimY:215,precision:true,attack:1,bossDamage:280}
      ];

      public function oracleCombatRandom() : Number
      {
         if(!oracleCombatActive) return Math.random();
         var value:int = int(oracleCombatState);
         value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
         oracleCombatState = uint(value);
         ++oracleCombatDraws;
         var result:Number = Number(oracleCombatState) / 4294967296.0;
         oracleShootDraws.push({index:oracleCombatDraws,state:oracleCombatState,value:result});
         return result;
      }

      private function oracleAimX() : Number { return oracleCombatActive ? oracleShootAimX : mouseX; }
      private function oracleAimY() : Number { return oracleCombatActive ? oracleShootAimY : mouseY; }

      public function oracleCombatDamage(id:int, damage:int, critType:int, hpBefore:int, hitX:int, hitY:int) : void
      {
         if(oracleCombatActive) oracleCombatEvents.push({enemyId:id,damage:damage,critType:critType,hpBefore:hpBefore,x:hitX,y:hitY,drawCount:oracleCombatDraws});
      }

      private function oracleObservePellet(index:int, hitX:int, hitY:int, damage:int) : void
      {
         if(!oracleCombatActive) return;
         var targets:Array = [];
         var slot:int;
         var target:*;
         for(slot=0;slot<maxEnemy;slot++)
         {
            target=enemyArray[slot];
            if(target.isFree()) continue;
            targets.push({slot:slot,id:target.id,alive:!target.isDead(),frame:target.mc.currentFrame,
               shapeHit:target.mc.hitTestPoint(hitX,hitY,true),
               shadowExcluded:target.mc.shadowHit == false && target.mc.shadow != null && target.mc.shadow.hitTestPoint(hitX,hitY,true)});
         }
         oracleShootPellets.push({index:index,x:hitX,y:hitY,damage:damage,drawCount:oracleCombatDraws,targets:targets});
      }

      private function oracleWeaponState(wi:int) : Object
      {
         var result:Object = {};
         var field:String;
         for each(field in ["num","id","graphic","type","reloadTime","reloadTimeMax","ammo","ammoMax","value","mod","modMax","shell","manualReload","automatic","modText","lv","typeMinor","special","leech","impact","shootRate","rare","autoReload","livingWeapon","name","baseAccuracy","accuracyDec","attack","dmgAir","dmgArmor","reqTrait","reqLv","range"])
            result[field]=inventory[field][wi];
         return result;
      }

      private function oraclePlayerState() : Object
      {
         var traits:Object={};
         var index:int;
         for(index=0;index<950;index++) if(player.trait[_pc][index]) traits[String(index)]=player.trait[_pc][index];
         return {level:player.lv[_pc],exp:player.exp[_pc],skillPoints:player.sp[_pc],traits:traits,
            potentialAim:player.potentialAim[_pc],potentialTeam:player.potentialTeam[_pc],
            shootTimer:player.shootTimer[_pc],accuracyFix:player.accuracyFix[_pc],idleCount:player.idleCount[_pc],
            burst:player.burst[_pc],frenzy:player.frenzy[_pc],rampage:player.rampage[_pc],
            kills:player.kill[_pc],weaponExp:player.wexp[_pc][player.wexpRef[_pc]],earnedGold:player.earn[_pc],
            criticalKills:mission.criticalCount,loot:mission.loot.concat(),castleHp:game.castleHP};
      }

      private function oracleShootCase(seed:uint, config:Object) : void
      {
         oracleCombatReset(seed);
         var index:int;
         for(index=0;index<950;index++) player.trait[_pc][index]=0;
         player.trait[_pc][TRAIT.SHERIFF]=1; player.trait[_pc][TRAIT.SHOTGUN]=2; player.trait[_pc][TRAIT.FURY]=1;
         player.trait[_pc][TRAIT.BASE_AIMING]=1; player.trait[_pc][TRAIT.BASE_TEAMWORK]=1;
         player.trait[_pc][TRAIT.DR_HOLLIDAY]=config.holliday == undefined ? 0 : config.holliday;
         player.trait[_pc][TRAIT.SENSE]=config.sense == undefined ? 0 : config.sense;
         if(config.learned) for each(index in [TRAIT.COOL,TRAIT.ACCURACY,TRAIT.RELOADING,TRAIT.CRIPPLE_SHOT,TRAIT.ANTI_ARMOR]) player.trait[_pc][index]=1;
         player.lv[_pc]=1; player.sp[_pc]=0; player.exp[_pc]=config.experience == undefined ? 0 : config.experience;
         player.potentialAim[_pc]=0.5; player.potentialTeam[_pc]=0.5;
         player.accuracyFix[_pc]=0; player.idleCount[_pc]=0; player.burst[_pc]=0; player.frenzy[_pc]=0;
         player.shooting[_pc]=true; hero=_pc; fireAtWill=false;
         sister.dead=false; sister.x=600; sister.y=350;
         game.castleHP=30; game.castleMHP=40;
         PARTY.SCAVENGER=0; PARTY.THREAT=0; PARTY.ENGINEER=0;
         game.engineer=0; game.trainer=0; medal[_medalAction4]=false;
         var wi:int=weapon(_pc);
         oracleCombatActive=true;
         generateStuff(wi,24); generateStuff(wi,3);
         if(config.mods)
         {
            inventory.modMax[wi]=4;
            enchant(wi,12,1); enchant(wi,10,1); enchant(wi,9,1);
         }
         if(config.living) { inventory.modMax[wi]=2; enchant(wi,11,1); inventory.livingWeapon[wi]=1; }
         var slot:int=spawnEnemy(config.enemyId);
         oracleCombatActive=false;
         var target:* = enemyArray[slot];
         target.x=200; target.y=220; target.mc.gotoAndStop(config.frame);
         if(config.hp != undefined) target.hp=config.hp;
         if(config.bossDamage != undefined) target.oracleSetBossDamage(config.bossDamage);
         if(config.precision) inventory.baseAccuracy[wi]=65000;
         if(config.attack != undefined) inventory.attack[wi]=config.attack;
         refreshPlayer(_pc,wi);
         var before:Object={player:oraclePlayerState(),weapon:oracleWeaponState(wi),enemy:target.oracleState()};
         var stats:Object={shells:player.shell[_pc],accuracyDiv:player.accuracyDiv[_pc],rangeFix:player.rangeFix[_pc],aimTime:player.aimTime[_pc],workRate:player.workRate[_pc]};
         oracleShootAimX=config.aimX; oracleShootAimY=config.aimY;
         oracleCombatState=seed; oracleCombatDraws=0; oracleCombatEvents=[]; oracleShootPellets=[]; oracleShootDraws=[];
         oracleCombatActive=true;
         shoot(_pc);
         oracleCombatActive=false;
         oracleEmit({type:"snapshot",kind:"shoot",scenario:config.name,seed:seed,config:config,
            aim:{x:oracleShootAimX,y:oracleShootAimY},before:before,stats:stats,
            after:{player:oraclePlayerState(),weapon:oracleWeaponState(wi),enemy:target.oracleState()},
            pellets:oracleShootPellets,damageEvents:oracleCombatEvents,draws:oracleShootDraws,
            drawCount:oracleCombatDraws,rngState:oracleCombatState});
         ++oracleShootSnapshots;
      }

      private function oracleBattleReady() : void
      {
         if(oraclePhase != 2) return;
         oraclePhase=3; timer.stop();
         removeEventListener(Event.ENTER_FRAME,onEnterFrame); removeEventListener(Event.ENTER_FRAME,oracleAdvance);
         if(amb != null) amb.stop();
         try
         {
            var config:Object;
            var seed:Number;
            var names:Array=[];
            for each(config in oracleShootCases) names.push(config.name);
            oracleEmit({type:"ready",kind:"shoot",rng:"xorshift32",clock:"synchronous-original-shoot",geometry:"original-vector-hitTestPoint",
               seeds:[42,3735928559],scenarios:names,inputSeam:"manual-aim-reads-only",displayAdvance:"none-after-explicit-frame"});
            for each(seed in [42,3735928559]) for each(config in oracleShootCases) oracleShootCase(uint(seed),config);
            gamePaused=true;
            oracleEmit({type:"complete",kind:"shoot",ok:true,snapshots:oracleShootSnapshots});
         }
         catch(error:Error)
         {
            oracleCombatActive=false; gamePaused=true;
            oracleEmit({type:"error",kind:"shoot",message:error.message,phase:oraclePhase});
         }
      }
'''


def instrument(main_source, enemy_source):
    main, enemy, main_calls, enemy_calls = instrument_combat(main_source, enemy_source)
    main = main.replace(COMBAT_AS3, extract_method(COMBAT_AS3, "oracleCombatReset") + SHOOT_AS3)
    # Только вход мыши и наблюдение пули: обратимость тела shoot проверяется отдельно.
    replacements = {
        "            aimY = mouseY;": "            aimY = oracleAimY();",
        "            aimX = mouseX;": "            aimX = oracleAimX();",
        "            if(sister.hitTestPoint(hitX,hitY,true) && sister.dead == false)":
            "            oracleObservePellet(projectileIndex,hitX,hitY,baseDamage);\n            if(sister.hitTestPoint(hitX,hitY,true) && sister.dead == false)",
    }
    for old, new in replacements.items():
        if main.count(old) != 1:
            raise ValueError("Original shoot input/observation point changed: " + old)
        main = main.replace(old, new)
    method = extract_method(main, "shoot")
    for old, new in replacements.items():
        method = method.replace(new, old)
    if method.replace("oracleCombatRandom()", "Math.random()") != extract_method(main_source, "shoot"):
        raise ValueError("Original shoot body changed beyond reversible input/RNG/observation seams")
    enemy = enemy.replace("hpMax:boss.hpMax}", "hpMax:boss.hpMax,damage:boss.damage}")
    enemy = append_class(enemy, "\n      public function oracleSetBossDamage(value:Number) : void { boss.damage=value; }\n")
    return main, enemy, main_calls, enemy_calls


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ffdec", type=Path, default=ROOT / ".tools/ffdec/ffdec.jar")
    parser.add_argument("--java")
    args = parser.parse_args()
    out = ROOT / ".build/oracle"
    out.mkdir(parents=True, exist_ok=True)
    report = {"status": "failed", "kind": "shoot", "ffdec_version": FFDEC_VERSION, "java_major": JAVA_MAJOR,
              "rng": "xorshift32", "instrumented_classes": ["shootem_fla.MainTimeline", "enemy"],
              "clock": "synchronous-original-shoot", "geometry": "original-vector-hitTestPoint", "input_seam": "manual-aim-reads-only"}
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
        exported = out / "shoot-export"
        result = command([java, "-Xmx1g", "-jar", ffdec, "-selectclass", "enemy", "-export", "script", str(exported), str(original_path)])
        (out / "shoot-export.log").write_text(result.stdout, encoding="utf-8")
        enemy_path = exported / "scripts/enemy.as"
        if result.returncode or not enemy_path.is_file():
            raise RuntimeError("Unable to export original enemy class")
        enemy_bytes = enemy_path.read_bytes()
        injected_main, injected_enemy, main_calls, enemy_calls = instrument(main_bytes.decode("utf-8-sig"), enemy_bytes.decode("utf-8-sig"))
        generated_main, generated_enemy = out / "ShootMainTimeline.as", out / "ShootEnemy.as"
        generated_main.write_text(injected_main, encoding="utf-8")
        generated_enemy.write_text(injected_enemy, encoding="utf-8")
        candidate = out / ("shoot-compiled-" + uuid.uuid4().hex + ".swf")
        result = command([java, "-Xmx1g", "-jar", ffdec, "-replace", str(original_path), str(candidate),
                          "shootem_fla.MainTimeline", str(generated_main), "enemy", str(generated_enemy)], timeout=240)
        (out / "shoot-build.log").write_text(result.stdout, encoding="utf-8")
        if result.returncode or not candidate.is_file():
            raise RuntimeError("FFDec compilation failed; inspect .build/oracle/shoot-build.log")
        output = bytearray(candidate.read_bytes()); output[3] = 10
        report.update(verify_resources(original, output))
        reference = out / "shoot-reference.swf"; reference.write_bytes(output)
        if original_path.read_bytes() != original or main_path.read_bytes() != main_bytes:
            raise RuntimeError("A preserved input changed during oracle generation")
        report.update(status="passed", original_sha256=digest(original), source_sha256=digest(main_bytes),
                      enemy_source_sha256=digest(enemy_bytes), output_sha256=digest(output), output_bytes=len(output),
                      output=str(reference.relative_to(ROOT)).replace("\\", "/"),
                      intercepted_random_calls={"MainTimeline": main_calls, "enemy": enemy_calls},
                      original_shoot_body_reversibly_preserved=True, runtime_validated=False)
    except Exception as error:
        report["error"] = str(error)
    (out / "shoot-build-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0 if report["status"] == "passed" else 1


if __name__ == "__main__":
    sys.exit(main())
