"""Отдельный эталон клавиш инвентаря, удержания огня и перезарядки исходного SWF."""
import argparse
import json
from pathlib import Path
import re
import sys
import uuid

from build import ROOT, ORIGINAL_SHA256, FFDEC_VERSION, JAVA_MAJOR, command, digest, find_java
from build_combat_oracle import COMBAT_AS3, instrument as instrument_combat, verify_resources
from build_shoot_oracle import extract_method


EQUIPMENT_AS3 = r'''
      private var oraclePhase:int = -1;
      private var oracleCombatActive:Boolean = false;
      private var oracleCombatState:uint = 42;
      private var oracleCombatDraws:int = 0;
      private var oracleCombatEvents:Array = [];
      private var oracleEquipmentSnapshots:int = 0;
      private var oracleEquipmentRemainder:int = 0;
      private var oracleEquipmentHeld:Boolean = false;
      private var oracleEquipmentCases:Array = [
         {name:"switch_preserves_cooldown",ammo:2,reload:4,cooldown:800,recoil:0.4,ops:[{slot:2,frames:0},{slot:0,frames:0}]},
         {name:"same_slot_cancels",ammo:2,reload:4,ops:[{slot:0,frames:0}]},
         {name:"empty_and_sixth_ignored",ammo:2,reload:4,empty:2,ops:[{slot:2,frames:0},{slot:5,frames:0}]},
         {name:"unmet_skill_selected",ops:[{slot:3,frames:0},{firePressed:true,fireHeld:true,frames:1}]},
         {name:"non_gun_selected",ops:[{slot:4,frames:0},{firePressed:true,fireHeld:true,frames:1}]},
         {name:"space_cooldown_guard",ammo:2,cooldown:20,ops:[{reload:true,frames:1},{reload:true,frames:1}]},
         {name:"full_space_ignored",ops:[{reload:true,frames:0}]},
         {name:"manual_cancel",ammo:2,reload:4,ops:[{firePressed:true,fireHeld:true,frames:1},{fireHeld:true,frames:3},{fireHeld:false,frames:1},{firePressed:true,fireHeld:true,frames:1}]},
         {name:"magazine_queues",id:19,ammo:2,reload:2,ops:[{firePressed:true,fireHeld:true,frames:1},{fireHeld:true,frames:2},{fireHeld:true,frames:1}]},
         {name:"automatic_hold_release",id:20,ops:[{firePressed:true,fireHeld:true,frames:1},{fireHeld:true,frames:14},{fireHeld:false,frames:9}]},
         {name:"semi_hold_does_not_repeat",ops:[{firePressed:true,fireHeld:true,frames:1},{fireHeld:true,frames:30},{fireHeld:false,frames:1},{firePressed:true,fireHeld:true,frames:1}]},
         {name:"switch_while_held",id:20,ops:[{firePressed:true,fireHeld:true,frames:1},{slot:2,fireHeld:true,frames:0},{fireHeld:true,frames:30}]},
         {name:"auto_reload_while_firing",autoReload:true,ammo:2,reload:3,ops:[{reload:true,frames:0},{firePressed:true,fireHeld:true,frames:1},{fireHeld:true,frames:5}]},
         {name:"auto_reload_idle_threshold",autoReload:true,ammo:2,cooldown:0,ops:[{frames:2},{frames:1},{frames:6}]},
         {name:"empty_trigger_reload",ammo:0,ops:[{firePressed:true,fireHeld:true,frames:1},{fireHeld:true,frames:12},{fireHeld:false,frames:1}]},
         {name:"consumable_preserves_selection",ammo:2,reload:4,ops:[{slot:1,frames:0},{slot:1,frames:0}]}
      ];

      public function oracleCombatRandom() : Number
      {
         if(!oracleCombatActive) return Math.random();
         var value:int=int(oracleCombatState);
         value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
         oracleCombatState=uint(value); ++oracleCombatDraws;
         return Number(oracleCombatState)/4294967296.0;
      }
      public function oracleCombatDamage(id:int, damage:int, critType:int, hpBefore:int, hitX:int, hitY:int) : void {}
      private function oracleInputX() : Number { return oracleCombatActive ? 500 : mouseX; }
      private function oracleInputY() : Number { return oracleCombatActive ? 180 : mouseY; }

      private function oracleEquipmentState() : Object
      {
         var items:Array=[];
         var cooldowns:Array=[];
         var slot:int;
         var wi:int;
         var item:Object;
         var field:String;
         var timerMc:*;
         for(slot=0;slot<6;slot++)
         {
            wi=_invPlayer+slot; item={};
            for each(field in ["num","id","graphic","type","reloadTime","reloadTimeMax","ammo","ammoMax","value","mod","modMax","shell","manualReload","automatic","modText","lv","typeMinor","special","leech","impact","shootRate","rare","autoReload","livingWeapon","name","baseAccuracy","accuracyDec","attack","dmgAir","dmgArmor","reqTrait","reqLv","range"])
               item[field]=inventory[field][wi];
            items.push(item);
            if(slot<5)
            {
               timerMc=stage.getChildByName("timer"+wi);
               cooldowns.push(timerMc == null ? 0 : timerMc.timer+1);
            }
         }
         return {selectedSlot:ci-_invPlayer,inventory:items,itemCooldowns:cooldowns,
            shootTimer:player.shootTimer[_pc],shooting:player.shooting[_pc],accuracyFix:player.accuracyFix[_pc],
            rampage:player.rampage[_pc],castleHp:game.castleHP,timerRemainder:oracleEquipmentRemainder,
            held:oracleEquipmentHeld,frame:player_mc[_pc].currentFrame,
            burst:player.burst[_pc],chain:player.chain[_pc],chainMode:chainMode[_pc],chainPos:chainPos[_pc],
            grenadeCount:player.grenadeCount[_pc],anime1:player_mc[_pc].anime1,anime2:player_mc[_pc].anime2,anime3:player_mc[_pc].anime3};
      }

      private function oracleEquipmentSample(config:Object, step:int, input:Object) : void
      {
         oracleEmit({type:"snapshot",kind:"equipment",scenario:config.name,config:config,step:step,input:input,
            state:oracleEquipmentState(),drawCount:oracleCombatDraws,rngState:oracleCombatState});
         ++oracleEquipmentSnapshots;
      }

      private function oracleEquipmentCase(config:Object) : void
      {
         oracleCombatActive=false;
         oracleCombatReset(42);
         var index:int;
         var wi:int;
         var timerMc:*;
         for(index=0;index<5;index++)
         {
            timerMc=stage.getChildByName("timer"+(_invPlayer+index));
            if(timerMc != null) { timerMc.removeEventListener(Event.ENTER_FRAME,timerMc.onEnterFrame_itemTimer); stage.removeChild(timerMc); }
         }
         for(index=0;index<950;index++) player.trait[_pc][index]=0;
         player.trait[_pc][TRAIT.SHERIFF]=1; player.trait[_pc][TRAIT.SHOTGUN]=8; player.trait[_pc][TRAIT.FURY]=1;
         player.trait[_pc][TRAIT.BASE_AIMING]=1; player.trait[_pc][TRAIT.BASE_TEAMWORK]=1;
         for(index=1;index<maxAlly;index++) player.exist[index]=false;
         hero=_pc; fireAtWill=false; bgChange=0; frenzyMode=0; castleCounter=0; shakeCount=0; protTime=0;
         game.castleHP=30; game.castleMHP=40; game.repair=0; game.engineer=0; game.trainer=0;
         game.optionFlashShot=false; PARTY.SUPPLIER=0; PARTY.LEADERSHIP=0; PARTY.ENGINEER=0;
         medal[_medalAction4]=false; sister.dead=true;
         player.accuracyFix[_pc]=config.recoil == undefined ? 0 : config.recoil;
         player.idleCount[_pc]=0; player.burst[_pc]=0; player.frenzy[_pc]=0;
         oracleCombatActive=true;
         for(index=0;index<6;index++)
         {
            wi=_invPlayer+index;
            generateStuff(wi,24);
            generateStuff(wi,[config.id == undefined ? 3 : config.id,11,3,1,6,3][index]);
         }
         if(config.empty != undefined) inventory.num[_invPlayer+config.empty]=0;
         ci=_invPlayer;
         if(config.autoReload) enchant(ci,10,1);
         if(config.ammo != undefined) inventory.ammo[ci]=config.ammo;
         inventory.reloadTime[ci]=config.reload == undefined ? 0 : config.reload;
         player.shootTimer[_pc]=config.cooldown == undefined ? 0 : config.cooldown;
         refreshPlayer(_pc,ci); player_mc[_pc].gotoAndStop(player_mc[_pc].anime2);
         oracleEquipmentHeld=false; oracleEquipmentRemainder=0; oracleCombatState=42; oracleCombatDraws=0;
         oracleEquipmentSample(config,0,null);
         var step:int=0;
         var op:Object;
         var frame:int;
         var held:Boolean;
         for each(op in config.ops)
         {
            if(op.slot != undefined) KeyDown(new KeyboardEvent(KeyboardEvent.KEY_DOWN,true,false,0,49+op.slot));
            if(op.reload) KeyDown(new KeyboardEvent(KeyboardEvent.KEY_DOWN,true,false,0,Keyboard.SPACE));
            held=op.fireHeld == true;
            if(op.firePressed || held && !oracleEquipmentHeld) mouseDownFunc(new MouseEvent(MouseEvent.MOUSE_DOWN));
            if(!held && oracleEquipmentHeld) mouseUpFunc(new MouseEvent(MouseEvent.MOUSE_UP));
            oracleEquipmentHeld=held;
            for(frame=0;frame<op.frames;frame++)
            {
               onEnterFrame(new Event(Event.ENTER_FRAME));
               oracleEquipmentRemainder+=20;
               while(oracleEquipmentRemainder>=30)
               {
                  oracleEquipmentRemainder-=30;
                  onTick(new TimerEvent(TimerEvent.TIMER));
               }
            }
            ++step; oracleEquipmentSample(config,step,op);
         }
         oracleCombatActive=false;
      }

      private function oracleBattleReady() : void
      {
         if(oraclePhase != 2) return;
         oraclePhase=3; timer.stop();
         removeEventListener(Event.ENTER_FRAME,onEnterFrame); removeEventListener(Event.ENTER_FRAME,oracleAdvance);
         if(amb != null) amb.stop();
         try
         {
            oracleEmit({type:"ready",kind:"equipment",seed:42,scenarios:oracleEquipmentCases.length,
               clock:"manual-original-handlers-frame-then-20-over-30-timer",inputSeam:"mouse-coordinate-reads-only",world:"empty-no-hits"});
            var config:Object;
            for each(config in oracleEquipmentCases) oracleEquipmentCase(config);
            gamePaused=true;
            oracleEmit({type:"complete",kind:"equipment",ok:true,snapshots:oracleEquipmentSnapshots,scenarios:oracleEquipmentCases.length});
         }
         catch(error:Error)
         {
            oracleCombatActive=false; gamePaused=true;
            oracleEmit({type:"error",kind:"equipment",message:error.message,phase:oraclePhase});
         }
      }
'''


def instrument(main_source, enemy_source):
    main, enemy, main_calls, enemy_calls = instrument_combat(main_source, enemy_source)
    main = main.replace(COMBAT_AS3, extract_method(COMBAT_AS3, "oracleCombatReset") + EQUIPMENT_AS3)
    # Тела обработчиков остаются исходными; заменено только чтение координат реальной мыши.
    for name in ["mouseDownFunc", "shoot", "onTick"]:
        old = extract_method(main, name)
        changed = old.replace("stage.mouseX", "oracleInputX()").replace("stage.mouseY", "oracleInputY()")
        changed = re.sub(r"\bmouseX\b", "oracleInputX()", changed)
        changed = re.sub(r"\bmouseY\b", "oracleInputY()", changed)
        main = main.replace(old, changed)
    for name in ["KeyDown", "mouseUpFunc", "reload", "cancelReload", "reloading", "refreshPlayer", "onEnterFrame", "useItem"]:
        if extract_method(main, name).replace("oracleCombatRandom()", "Math.random()") != extract_method(main_source, name):
            raise ValueError("Original method body changed: " + name)
    return main, enemy, main_calls, enemy_calls


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ffdec", type=Path, default=ROOT / ".tools/ffdec/ffdec.jar")
    parser.add_argument("--java")
    args = parser.parse_args()
    out = ROOT / ".build/oracle"
    out.mkdir(parents=True, exist_ok=True)
    report = {"status": "failed", "kind": "equipment", "ffdec_version": FFDEC_VERSION, "java_major": JAVA_MAJOR,
              "rng": "xorshift32", "instrumented_classes": ["shootem_fla.MainTimeline", "enemy"],
              "clock": "manual-original-input-frame-timer", "geometry": "empty-world-no-hit-tests", "input_seam": "mouse-coordinate-reads-only"}
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
        exported = out / "equipment-export"
        result = command([java, "-Xmx1g", "-jar", ffdec, "-selectclass", "enemy", "-export", "script", str(exported), str(original_path)])
        (out / "equipment-export.log").write_text(result.stdout, encoding="utf-8")
        enemy_path = exported / "scripts/enemy.as"
        if result.returncode or not enemy_path.is_file():
            raise RuntimeError("Unable to export original enemy class")
        enemy_bytes = enemy_path.read_bytes()
        injected_main, injected_enemy, main_calls, enemy_calls = instrument(main_bytes.decode("utf-8-sig"), enemy_bytes.decode("utf-8-sig"))
        generated_main, generated_enemy = out / "EquipmentMainTimeline.as", out / "EquipmentEnemy.as"
        generated_main.write_text(injected_main, encoding="utf-8")
        generated_enemy.write_text(injected_enemy, encoding="utf-8")
        candidate = out / ("equipment-compiled-" + uuid.uuid4().hex + ".swf")
        result = command([java, "-Xmx1g", "-jar", ffdec, "-replace", str(original_path), str(candidate),
                          "shootem_fla.MainTimeline", str(generated_main), "enemy", str(generated_enemy)], timeout=240)
        (out / "equipment-build.log").write_text(result.stdout, encoding="utf-8")
        if result.returncode or not candidate.is_file():
            raise RuntimeError("FFDec compilation failed; inspect .build/oracle/equipment-build.log")
        output = bytearray(candidate.read_bytes()); output[3] = 10
        report.update(verify_resources(original, output))
        reference = out / "equipment-reference.swf"; reference.write_bytes(output)
        if original_path.read_bytes() != original or main_path.read_bytes() != main_bytes:
            raise RuntimeError("A preserved input changed during oracle generation")
        report.update(status="passed", original_sha256=digest(original), source_sha256=digest(main_bytes),
                      enemy_source_sha256=digest(enemy_bytes), output_sha256=digest(output), output_bytes=len(output),
                      output=str(reference.relative_to(ROOT)).replace("\\", "/"),
                      intercepted_random_calls={"MainTimeline": main_calls, "enemy": enemy_calls},
                      original_equipment_methods_preserved=True, runtime_validated=False)
    except Exception as error:
        report["error"] = str(error)
    (out / "equipment-build-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0 if report["status"] == "passed" else 1


if __name__ == "__main__":
    sys.exit(main())
