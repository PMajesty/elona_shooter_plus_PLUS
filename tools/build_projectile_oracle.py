"""Оригинальные запуск, кадры и попадания снарядов: отдельная инструментированная копия SWF."""
import argparse
import json
from pathlib import Path
import re
import sys
import uuid

from build import ROOT, ORIGINAL_SHA256, FFDEC_VERSION, JAVA_MAJOR, command, digest, find_java
from build_combat_oracle import COMBAT_AS3, append_class, instrument as instrument_combat, verify_resources
from build_shoot_oracle import extract_method
from build_oracle import method_span

PROJECTILE_CLASSES = ['bullet_grenade', 'bullet_grenade2', 'bullet_rocket', 'bullet_arrow2', 'bullet_arrow3', 'bullet_puls', 'bullet_fire']

ACTOR_AS3 = r'''
      private var oracleInitialized:Boolean = false;
      private function oracleFrame1() : *
      {
         if(oracleInitialized) return;
         oracleInitialized=true;
         if(this.oracleRoot != null) this.oracleRoot.oracleProjectileEvent(this,"init");
         frame1();
      }
      public function oracleInitialize() : Boolean
      {
         var wasNative:Boolean=oracleInitialized;
         oracleFrame1();
         oracleFreeze();
         return wasNative;
      }
      public function oracleFreeze() : void
      {
         removeEventListener(Event.ENTER_FRAME,onEnterFrame_bullet); stop();
      }
      private function oracleNumber(value:*) : * { return isFinite(Number(value)) ? Number(value) : null; }
      public function oracleState() : Object
      {
         var sh:* =this.hasOwnProperty("shadow") ? this.shadow : null;
         var b:Number=(this.y1-this.y2-this.a*this.x1*this.x1+this.a*this.x2*this.x2)/(this.x1-this.x2);
         var c:Number=this.y1-this.a*this.x1*this.x1-b*this.x1;
         var calculated:Number=this.a*x*x+b*x+c;
         return {index:this.oracleIndex,className:getQualifiedClassName(this),attached:parent!=null,
            x:x,rootY:y,y:mc.y,mcX:mc.x,startX:this.x2,startY:this.y2,targetX:this.x1,targetY:this.y1,
            speed:oracleNumber(this.speed),damage:this.dmg,weaponSlot:this.w == -1 ? null : this.w-20,
            curve:oracleNumber(this.a),count:this.hasOwnProperty("count") ? oracleNumber(this.count) : null,
            rotation:mc.rotation,rotationStep:this.hasOwnProperty("r") ? oracleNumber(this.r) : null,
            acceleration:this.hasOwnProperty("spd") ? oracleNumber(this.spd) : null,
            direction:this.hasOwnProperty("dir") ? oracleNumber(this.dir) : null,
            penetrations:this.hasOwnProperty("penetrate") ? oracleNumber(this.penetrate) : null,
            scale:mc.scaleX,scaleY:mc.scaleY,alpha:alpha,frame:mc.currentFrame,
            pulseFrame:mc.hasOwnProperty("puls") ? mc.puls.currentFrame : null,
            shadowY:sh == null ? null : sh.y,shadowAlpha:sh == null ? null : sh.alpha,shadowVisible:sh == null ? null : sh.visible,
            calculatedYFinite:isFinite(calculated),calculatedYNaN:isNaN(calculated)};
      }
'''

PROJECTILE_AS3 = r'''
      private var oraclePhase:int=-1;
      private var oracleCombatActive:Boolean=false;
      private var oracleCombatState:uint=42;
      private var oracleCombatDraws:int=0;
      private var oracleCombatEvents:Array=[];
      private var oracleActors:Array=[];
      private var oracleProjectileDraws:Array=[];
      private var oracleCallbacks:Array=[];
      private var oracleNativeEvents:Array=[];
      private var oracleNativeProbe:Boolean=false;
      private var oracleProbeFrame:int=0;
      private var oracleStep:int=0;
      private var oracleCurrentActor:int=-1;
      private var oracleSnapshots:int=0;
      private var oracleAimXValue:int=200;
      private var oracleAimYValue:int=220;
      private var oracleCases:Array=[
         {name:"hand_grenade",id:11,aimX:200,aimY:220,enemyId:3,enemyX:200,enemyY:220},
         {name:"launcher_grenade",id:21,aimX:200,aimY:220,enemyId:3,enemyX:200,enemyY:220},
         {name:"rocket",id:22,aimX:200,aimY:220,enemyId:3,enemyX:200,enemyY:220},
         {name:"crossbow",id:23,aimX:200,aimY:220,enemyId:3,enemyX:200,enemyY:220},
         {name:"bow",id:24,aimX:200,aimY:214,enemyId:3,enemyX:200,enemyY:209},
         {name:"wind_bow",id:25,aimX:200,aimY:214,enemyId:3,enemyX:212,enemyY:207},
         {name:"repeating_crossbow",id:26,aimX:200,aimY:220,enemyId:3,enemyX:200,enemyY:220},
         {name:"crossbow_fade",id:26,aimX:200,aimY:136},
         {name:"gravity",id:27,aimX:200,aimY:220,enemyId:3,enemyX:400,enemyY:235},
         {name:"flame",id:40,aimX:200,aimY:220,enemyId:3,enemyX:400,enemyY:300},
         {name:"bow_sky",id:24,aimX:200,aimY:80,enemyId:6,enemyX:200,enemyY:80},
         {name:"crossbow_overlap_corpse",id:23,aimX:200,aimY:220,enemyId:3,enemyX:200,enemyY:220,overlap:true,corpse:true},
         {name:"switch_in_flight",id:23,aimX:200,aimY:220,enemyId:6,enemyX:200,enemyY:220,hp:1,switchAt:1},
         {name:"arrow_penetration",id:24,aimX:200,aimY:214,enemyId:3,enemyX:220,enemyY:191,bowMaster:2},
         {name:"vertical_grenade",id:21,direct:"grenade",aimX:510,aimY:180,maxSteps:1},
         {name:"vertical_rocket",id:22,direct:"rocket",aimX:510,aimY:180,maxSteps:1}
      ];

      public function oracleCombatRandom() : Number
      {
         if(!oracleCombatActive) return Math.random();
         var v:int=int(oracleCombatState); v^=v<<13; v^=v>>>17; v^=v<<5;
         oracleCombatState=uint(v); ++oracleCombatDraws;
         var result:Number=Number(oracleCombatState)/4294967296.0;
         oracleProjectileDraws.push({index:oracleCombatDraws,state:oracleCombatState,value:result});
         return result;
      }
      private function oracleInputX() : Number { return oracleCombatActive ? oracleAimXValue : mouseX; }
      private function oracleInputY() : Number { return oracleCombatActive ? oracleAimYValue : mouseY; }
      public function oracleCombatDamage(id:int, damage:int, critType:int, hpBefore:int, hitX:int, hitY:int) : void
      {
         if(oracleCombatActive) oracleCombatEvents.push({actor:oracleCurrentActor,step:oracleStep,enemyId:id,damage:damage,critType:critType,hpBefore:hpBefore,x:hitX,y:hitY,drawCount:oracleCombatDraws});
      }
      public function oracleProjectileEvent(actor:*, event:String) : void
      {
         oracleCurrentActor=actor.oracleIndex;
         if(oracleNativeProbe) oracleNativeEvents.push({event:event,frame:oracleProbeFrame,actor:actor.oracleState()});
      }
      private function oracleTargets(hitX:Number, hitY:Number) : Array
      {
         var result:Array=[];
         for(var n:int=0;n<maxEnemy;n++)
         {
            var e:* =enemyArray[n]; if(e.isFree()) continue;
            result.push({slot:n,id:e.id,alive:!e.isDead(),frame:e.mc.currentFrame,x:e.x,y:e.y,
               shapeHit:e.mc.hitTestPoint(hitX,hitY,true),
               shadowExcluded:e.mc.shadowHit == false && e.mc.shadow != null && e.mc.shadow.hitTestPoint(hitX,hitY,true)});
         }
         return result;
      }
      private function oracleProjectileHit(shooter:*, wi:*, hitX:*, hitY:*, damage:*) : *
      {
         var event:Object={actor:oracleCurrentActor,step:oracleStep,kind:"hit",x:hitX,y:hitY,damage:damage,weaponSlot:wi-20,
            drawBefore:oracleCombatDraws,targets:oracleTargets(hitX,hitY)};
         oracleCallbacks.push(event);
         var result:* =procHit(shooter,wi,hitX,hitY,damage);
         event.result=result; event.drawAfter=oracleCombatDraws;
         return result;
      }
      private function oracleProjectileExplosion(shooter:*,wi:*,x:*,y:*,damage:int,type:int) : *
      {
         var event:Object={actor:oracleCurrentActor,step:oracleStep,kind:type == 0 ? "grenade" : "rocket",x:x,y:y,damage:damage,weaponSlot:wi == -1 ? null : wi-20,drawBefore:oracleCombatDraws};
         oracleCallbacks.push(event); explode(shooter,wi,x,y,damage,type); event.drawAfter=oracleCombatDraws;
      }
      private function oracleProjectilePulse(shooter:*,wi:*,x:*,y:*,damage:int,type:int) : *
      {
         var event:Object={actor:oracleCurrentActor,step:oracleStep,kind:type == 0 ? "gravity" : "flame",x:x,y:y,damage:damage,weaponSlot:wi-20,drawBefore:oracleCombatDraws};
         oracleCallbacks.push(event); explode_puls(shooter,wi,x,y,damage,type); event.drawAfter=oracleCombatDraws;
      }
      private function oracleActorStates() : Array
      {
         var result:Array=[]; for each(var a:* in oracleActors) result.push(a.oracleState()); return result;
      }
      private function oraclePlayerState() : Object
      {
         var traits:Object={}; for(var n:int=0;n<950;n++) if(player.trait[_pc][n]) traits[String(n)]=player.trait[_pc][n];
         return {selectedSlot:ci-_invPlayer,shootTimer:player.shootTimer[_pc],accuracyFix:player.accuracyFix[_pc],
            shooting:player.shooting[_pc],bowDrawing:chainMode[_pc] == 1,rampage:player.rampage[_pc],
            level:player.lv[_pc],exp:player.exp[_pc],skillPoints:player.sp[_pc],traits:traits,
            potentialAim:player.potentialAim[_pc],potentialTeam:player.potentialTeam[_pc],
            weaponExp:player.wexp[_pc].concat(),kills:player.kill[_pc],criticalKills:mission.criticalCount,loot:mission.loot.concat(),castleHp:game.castleHP};
      }
      private function oracleWorldState() : Object
      {
         var weapons:Array=[]; var enemies:Array=[]; var item:Object; var field:String; var n:int;
         for each(n in [20,22])
         {
            item={}; for each(field in ["num","id","graphic","type","reloadTime","reloadTimeMax","ammo","ammoMax","value","mod","modMax","shell","manualReload","automatic","modText","lv","typeMinor","special","leech","impact","shootRate","rare","autoReload","livingWeapon","name","baseAccuracy","accuracyDec","attack","dmgAir","dmgArmor","reqTrait","reqLv","range"]) item[field]=inventory[field][n];
            weapons.push({slot:n-20,item:item});
         }
         for(n=0;n<maxEnemy;n++) if(!enemyArray[n].isFree()) enemies.push({slot:n,state:enemyArray[n].oracleState()});
         return {player:oraclePlayerState(),weapons:weapons,enemies:enemies};
      }
      private function oracleCleanup() : void
      {
         for each(var a:* in oracleActors) { a.oracleFreeze(); if(a.parent!=null) a.parent.removeChild(a); }
         oracleActors=[];
      }
      private function oracleSetup(config:Object) : void
      {
         oracleCleanup(); oracleCombatActive=false; oracleCombatReset(42);
         var n:int;
         for(n=1;n<maxEnemy;n++) enemyArray[n]=new enemy();
         for(n=0;n<950;n++) player.trait[_pc][n]=0;
         player.trait[_pc][TRAIT.SHERIFF]=1; player.trait[_pc][TRAIT.SHOTGUN]=2; player.trait[_pc][TRAIT.FURY]=1;
         player.trait[_pc][TRAIT.SMALL_GUN]=12; player.trait[_pc][TRAIT.BIG_GUN]=12; player.trait[_pc][TRAIT.RIFLE]=12;
         player.trait[_pc][TRAIT.BASE_AIMING]=1; player.trait[_pc][TRAIT.BASE_TEAMWORK]=1;
         player.trait[_pc][TRAIT.BOW_MASTER]=config.bowMaster == undefined ? 0 : config.bowMaster;
         for(n=0;n<maxAlly;n++) player.exist[n]=n == _pc;
         for(n=0;n<5;n++) player.wexp[_pc][n]=0;
         hero=_pc; fireAtWill=false; sister.dead=false; sister.x=600; sister.y=350; game.castleHP=40; game.castleMHP=40;
         game.engineer=0; game.trainer=0; medal[_medalAction4]=false; PARTY.ENGINEER=0; PARTY.SCAVENGER=0; PARTY.THREAT=0;
         player.lv[_pc]=1; player.exp[_pc]=0; player.sp[_pc]=0; player.potentialAim[_pc]=0.5; player.potentialTeam[_pc]=0.5;
         player.accuracyFix[_pc]=0; player.idleCount[_pc]=0; player.frenzy[_pc]=0; player.shooting[_pc]=true;
         player_mc[_pc].x=510; player_mc[_pc].y=245;
         ci=20; oracleCombatActive=true;
         generateStuff(20,24); generateStuff(20,config.id); generateStuff(22,24); generateStuff(22,3);
         inventory.baseAccuracy[20]=65000;
         if(config.enemyId != undefined)
         {
            var total:int=config.overlap ? 3 : 1;
            for(n=0;n<total;n++)
            {
               var slot:int=spawnEnemy(config.enemyId); var e:* =enemyArray[slot];
               e.x=config.enemyX; e.y=config.enemyY; e.hp=config.hp == undefined ? 1000 : config.hp;
               e.mc.gotoAndStop(config.enemyId == 6 ? 3 : 5);
               e.removeEventListener(Event.ENTER_FRAME,e.onEnterFrame);
               if(config.corpse && n == 2) { e.hp=0; e.mc.gotoAndStop(107); }
            }
         }
         refreshPlayer(_pc,20); player_mc[_pc].gotoAndStop(player_mc[_pc].anime2);
         oracleAimXValue=config.aimX; oracleAimYValue=config.aimY;
         oracleCombatActive=false; oracleCombatState=42; oracleCombatDraws=0; oracleProjectileDraws=[];
         oracleCombatEvents=[]; oracleCallbacks=[]; oracleStep=0; oracleCurrentActor=-1;
      }
      private function oracleCase(config:Object) : void
      {
         oracleSetup(config); var before:Object=oracleWorldState(); var drawn:Object=null;
         oracleCombatActive=true;
         if(config.id == 11) useItem(_pc,20);
         else if(config.direct == "grenade") throwGrenade(_pc,20,510,245,510,180,12,50,1);
         else if(config.direct == "rocket") throwRocket(_pc,20,510,245,510,180,10,110,1);
         else
         {
            shoot(_pc);
            if(config.id == 24 || config.id == 25) { drawn=oracleWorldState(); mouseUpFunc(new MouseEvent(MouseEvent.MOUSE_UP)); }
         }
         var nativeInit:Array=[]; var a:*;
         for each(a in oracleActors) nativeInit.push(a.oracleInitialize());
         var launched:Object={world:oracleWorldState(),actors:oracleActorStates(),nativeInit:nativeInit,drawCount:oracleCombatDraws};
         var steps:Array=[]; var alive:Boolean=true; var maxSteps:int=config.maxSteps == undefined ? 360 : config.maxSteps;
         while(alive && oracleStep<maxSteps)
         {
            ++oracleStep;
            for each(a in oracleActors) if(a.parent!=null) { oracleCurrentActor=a.oracleIndex; a.onEnterFrame_bullet(new Event(Event.ENTER_FRAME)); }
            if(config.switchAt == oracleStep) KeyDown(new KeyboardEvent(KeyboardEvent.KEY_DOWN,true,false,0,51));
            steps.push({step:oracleStep,actors:oracleActorStates(),drawCount:oracleCombatDraws});
            alive=false; for each(a in oracleActors) if(a.parent!=null) alive=true;
         }
         oracleCombatActive=false;
         oracleEmit({type:"snapshot",kind:"projectiles",scenario:config.name,config:config,seed:42,before:before,drawn:drawn,launched:launched,
            steps:steps,callbacks:oracleCallbacks,damageEvents:oracleCombatEvents,after:oracleWorldState(),draws:oracleProjectileDraws,drawCount:oracleCombatDraws,rngState:oracleCombatState,
            exhausted:!alive,verticalDiagnostic:config.direct != undefined});
         ++oracleSnapshots; oracleCleanup();
      }
      private function oracleProbe(event:Event) : void
      {
         ++oracleProbeFrame;
         try
         {
            if(oracleProbeFrame == 1)
            {
               oracleSetup({id:21,aimX:200,aimY:220}); oracleNativeProbe=true; oracleNativeEvents=[];
               throwGrenade(_pc,20,510,245,200,220,12,50,1);
            }
            if(oracleProbeFrame < 4) return;
            removeEventListener(Event.ENTER_FRAME,oracleProbe); oracleNativeProbe=false;
            oracleEmit({type:"snapshot",kind:"projectiles",scenario:"native_birth",birthFrame:1,events:oracleNativeEvents,actors:oracleActorStates()});
            ++oracleSnapshots; oracleCleanup();
            for each(var config:Object in oracleCases) oracleCase(config);
            gamePaused=true; oracleEmit({type:"complete",kind:"projectiles",ok:true,snapshots:oracleSnapshots});
         }
         catch(error:Error)
         {
            removeEventListener(Event.ENTER_FRAME,oracleProbe); oracleCombatActive=false; gamePaused=true;
            oracleEmit({type:"error",kind:"projectiles",message:error.message,step:oracleStep,phase:oraclePhase});
         }
      }
      private function oracleBattleReady() : void
      {
         if(oraclePhase != 2) return;
         oraclePhase=3; timer.stop(); removeEventListener(Event.ENTER_FRAME,onEnterFrame); removeEventListener(Event.ENTER_FRAME,oracleAdvance);
         if(amb!=null) amb.stop();
         oracleEmit({type:"ready",kind:"projectiles",rng:"xorshift32",seed:42,clock:"native-birth-probe-then-manual-original-projectile-callbacks",cases:oracleCases.length});
         addEventListener(Event.ENTER_FRAME,oracleProbe);
      }
'''


def instrument(main_source, enemy_source):
    main, enemy, main_calls, enemy_calls = instrument_combat(main_source, enemy_source)
    main = main.replace(COMBAT_AS3, extract_method(COMBAT_AS3, "oracleCombatReset") + PROJECTILE_AS3)
    shoot = extract_method(main, "shoot")
    main = main.replace(shoot, shoot.replace("aimX = mouseX;", "aimX = oracleInputX();").replace("aimY = mouseY;", "aimY = oracleInputY();"))
    use = extract_method(main, "useItem")
    main = main.replace(use, use.replace("mouseX", "oracleInputX()").replace("mouseY", "oracleInputY()"))
    for method in ["throwGrenade", "throwRocket"]:
        old = extract_method(main, method)
        changed = old.replace("_loc10_.explode = explode;", "_loc10_.explode = oracleProjectileExplosion;")
        changed = changed.replace("_loc10_.explode = procHit;", "_loc10_.explode = oracleProjectileHit;")
        changed = changed.replace("_loc10_.explode = explode_puls;", "_loc10_.explode = oracleProjectilePulse;")
        registry = "_loc10_.oracleRoot=this; _loc10_.oracleIndex=oracleActors.length; oracleActors.push(_loc10_);\n         "
        changed = changed.replace("stage.addChild(_loc10_);", registry + "stage.addChild(_loc10_);")
        main = main.replace(old, changed)
        restored = changed.replace(registry, "").replace("oracleProjectileExplosion", "explode").replace("oracleProjectileHit", "procHit").replace("oracleProjectilePulse", "explode_puls")
        if restored != old:
            raise ValueError("Projectile factory changed beyond registry/callback observers")
    for method in ["procHit", "explode", "explode_puls", "mouseUpFunc"]:
        if extract_method(main, method).replace("oracleCombatRandom()", "Math.random()") != extract_method(main_source, method):
            raise ValueError("Original hit method changed: " + method)
    return main, enemy, main_calls, enemy_calls


def instrument_actor(source):
    if source.count("addFrameScript(0,frame1);") != 1:
        raise ValueError("Unexpected projectile first-frame registration")
    result = source.replace("addFrameScript(0,frame1);", "addFrameScript(0,oracleFrame1);")
    begin, _ = method_span(result, "onEnterFrame_bullet")
    observer = '\n         if(this.oracleRoot != null) this.oracleRoot.oracleProjectileEvent(this,"advance");'
    result = result[:begin] + observer + result[begin:]
    if result.replace(observer, "").replace("addFrameScript(0,oracleFrame1);", "addFrameScript(0,frame1);") != source:
        raise ValueError("Projectile behavior body changed")
    return append_class(result, ACTOR_AS3)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ffdec", type=Path, default=ROOT / ".tools/ffdec/ffdec.jar")
    parser.add_argument("--java")
    args = parser.parse_args()
    out = ROOT / ".build/oracle"
    out.mkdir(parents=True, exist_ok=True)
    report = {"status": "failed", "kind": "projectiles", "ffdec_version": FFDEC_VERSION, "java_major": JAVA_MAJOR,
              "rng": "xorshift32", "instrumented_classes": ["shootem_fla.MainTimeline", "enemy", *PROJECTILE_CLASSES],
              "clock": "native-birth-probe-then-manual-original-projectile-callbacks", "geometry": "original-vector-procHit", "input_seam": "manual-aim-and-initialize-once"}
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
        exported = out / "projectiles-export"
        result = command([java, "-Xmx1g", "-jar", ffdec, "-selectclass", ",".join(["enemy", *PROJECTILE_CLASSES]), "-export", "script", str(exported), str(original_path)])
        (out / "projectiles-export.log").write_text(result.stdout, encoding="utf-8")
        enemy_path = exported / "scripts/enemy.as"
        if result.returncode or not enemy_path.is_file():
            raise RuntimeError("Unable to export original enemy class")
        enemy_bytes = enemy_path.read_bytes()
        injected_main, injected_enemy, main_calls, enemy_calls = instrument(main_bytes.decode("utf-8-sig"), enemy_bytes.decode("utf-8-sig"))
        generated_main, generated_enemy = out / "ProjectileMainTimeline.as", out / "ProjectileEnemy.as"
        generated_main.write_text(injected_main, encoding="utf-8")
        generated_enemy.write_text(injected_enemy, encoding="utf-8")
        actor_paths = []
        actor_hashes = {}
        for name in PROJECTILE_CLASSES:
            actor_bytes = (exported / "scripts" / (name + ".as")).read_bytes()
            actor_path = out / ("Oracle_" + name + ".as")
            actor_path.write_text(instrument_actor(actor_bytes.decode("utf-8-sig")), encoding="utf-8")
            actor_paths.extend([name, str(actor_path)])
            # FFDec читает отдельный путь для каждого из двух одноимённых исходных scriptpack.
            if name == "bullet_puls":
                actor_paths.append(str(actor_path))
            actor_hashes[name] = digest(actor_bytes)
        candidate = out / ("projectiles-compiled-" + uuid.uuid4().hex + ".swf")
        result = command([java, "-Xmx1g", "-jar", ffdec, "-replace", str(original_path), str(candidate),
                          "shootem_fla.MainTimeline", str(generated_main), "enemy", str(generated_enemy), *actor_paths], timeout=240)
        (out / "projectiles-build.log").write_text(result.stdout, encoding="utf-8")
        if result.returncode or not candidate.is_file():
            raise RuntimeError("FFDec compilation failed; inspect .build/oracle/projectiles-build.log")
        output = bytearray(candidate.read_bytes()); output[3] = 10
        report.update(verify_resources(original, output))
        reference = out / "projectiles-reference.swf"; reference.write_bytes(output)
        if original_path.read_bytes() != original or main_path.read_bytes() != main_bytes:
            raise RuntimeError("A preserved input changed during oracle generation")
        report.update(status="passed", original_sha256=digest(original), source_sha256=digest(main_bytes),
                      enemy_source_sha256=digest(enemy_bytes), output_sha256=digest(output), output_bytes=len(output),
                      output=str(reference.relative_to(ROOT)).replace("\\", "/"),
                      intercepted_random_calls={"MainTimeline": main_calls, "enemy": enemy_calls},
                      original_projectile_methods_preserved=True, projectile_source_sha256=actor_hashes, runtime_validated=False)
    except Exception as error:
        report["error"] = str(error)
    (out / "projectiles-build-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0 if report["status"] == "passed" else 1


if __name__ == "__main__":
    sys.exit(main())
