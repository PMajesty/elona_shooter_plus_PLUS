"""Исходные AI союзников: контролируемые цели, кадровые ветви и настоящие выстрелы."""
import json
import uuid

from build import ROOT, ORIGINAL_SHA256, command, digest, find_java
from build_combat_oracle import COMBAT_AS3, instrument as combat_instrument, verify_resources
from build_shoot_oracle import extract_method


CASES = [
    *[dict(name=f'order_{order}', boundary='selector', order=order) for order in range(7)],
    dict(name='work_roll_fails', boundary='frame', prefix=[0.99], ops=[dict(frames=1)]),
    dict(name='acquire_skips_common', boundary='frame', prefix=[0], rampage=9, frenzy=10, cooldown=100, ops=[dict(frames=1), dict(frames=1)]),
    dict(name='aim_then_shoot', boundary='frame', heldTarget=102, aimCount=2, ops=[dict(frames=1),dict(frames=1),dict(frames=1)]),
    dict(name='dead_skips_common', boundary='frame', heldTarget=102, deadTarget=True, rampage=9, cooldown=100, ops=[dict(frames=1)]),
    dict(name='boss_stale_range', boundary='frame', boss=101, sharedRange=2, optBoss=True, rampage=9, cooldown=100, ops=[dict(frames=1),dict(frames=1)]),
    dict(name='idle_manual_topup', boundary='frame', emptyCache=True, ammo=1, prefix=[0], ops=[dict(frames=1),dict(timers=1)]),
    dict(name='auto_reload_same_timer', boundary='frame', emptyCache=True, ammo=2, autoReload=True, cooldown=-120, ops=[dict(timers=1)]),
    dict(name='marked_dead_next_alert', boundary='frame', heldTarget=102, deadTarget=True, onMark=True, nextAlert=103, ops=[dict(frames=1)]),
    dict(name='militia_throw', boundary='frame', dev=4, grenadeCount=0, prefix=[0.5], ops=[dict(timers=1)]),
    dict(name='militia_no_target', boundary='frame', dev=4, grenadeCount=0, emptyCache=True, ops=[dict(timers=1)]),
    *[dict(name=f'actual_shoot_class_{dev}', boundary='shoot', dev=dev, heldTarget=102, aimCount=0, ops=[dict(shoot=True),dict(shoot=True)]) for dev in range(1,10)],
]


DRIVER = r'''
      private var oraclePhase:int=-1;
      private var oracleCombatActive:Boolean=false;
      private var oracleCombatState:uint=42;
      private var oracleCombatDraws:int=0;
      private var oracleCombatEvents:Array=[];
      private var oraclePrefix:Array=[];
      private var oraclePrefixIndex:int=0;
      private var oraclePartyTargets:Array=[];
      private var oracleActualShoot:Boolean=false;
      private var oracleSnapshots:int=0;
      public function oracleCombatRandom() : Number {
         if(!oracleCombatActive) return Math.random();
         var value:int=int(oracleCombatState); value^=value<<13;value^=value>>>17;value^=value<<5;
         oracleCombatState=uint(value);++oracleCombatDraws;
         return oraclePrefixIndex<oraclePrefix.length ? Number(oraclePrefix[oraclePrefixIndex++]) : Number(oracleCombatState)/4294967296;
      }
      public function oracleCombatDamage(id:int,damage:int,crit:int,before:int,x:int,y:int) : void {}
      public function shoot(index:int) : * {
         if(oracleCombatActive) oracleCombatEvents.push({type:"shoot",slot:index});
         if(!oracleCombatActive || oracleActualShoot) return oracleOriginalShoot(index);
      }
      public function reload(index:int,wi:int) : * {
         if(oracleCombatActive) oracleCombatEvents.push({type:"reload",slot:index});
         return oracleOriginalReload(index,wi);
      }
      public function reloading(index:int,wi:int) : * {
         if(oracleCombatActive) oracleCombatEvents.push({type:"reloading",slot:index});
         return oracleOriginalReloading(index,wi);
      }
      public function endRampage(index:int) : * {
         if(oracleCombatActive) oracleCombatEvents.push({type:"endRampage",slot:index});
         return oracleOriginalEndRampage(index);
      }
      public function throwGrenade(a:*,b:*,c:*,d:*,e:*,f:*,g:*,h:int,j:int) : * {
         var event:Object={type:"projectile",slot:a,weapon:b,x:c,y:d,targetX:e,targetY:f,speed:g,damage:h,kind:j};
         if(oracleCombatActive) oracleCombatEvents.push(event);
         if(!oracleCombatActive || oracleActualShoot) {
            oracleOriginalThrowGrenade(a,b,c,d,e,f,g,h,j);
            if(oracleCombatActive) {
               var clip:* = stage.getChildAt(stage.numChildren-1);
               event.launched={startX:clip.x2,startY:clip.y2,targetX:clip.x1,targetY:clip.y1,speed:clip.speed,damage:clip.dmg,actorSlot:clip.chara,weapon:clip.w};
            }
         }
      }
      private function oracleTarget(uid:int,type:int,x:Number,y:Number,speed:Number) : Object {
         var t:Object={oracleUid:uid,type:type,x:x,y:y,speed:speed,hp:100,removed:false,tag:0,onMark:false,dropping:false};
         t.mc={rat:{y:0}};
         t.isDead=function():Boolean {return t.hp<=0;};
         return t;
      }
      private function oracleFind(uid:int) : * {
         for each(var t:Object in oraclePartyTargets) if(t.oracleUid==uid) return t;
         return undefined;
      }
      private function oracleUid(t:*) : * {return t==undefined ? null : t.oracleUid;}
      private function oracleActorState() : Object {
         var item:Object={};var traits:Object={};var field:String;var k:int;var wi:int=41;
         for each(field in ["num","id","graphic","type","reloadTime","reloadTimeMax","ammo","ammoMax","value","mod","modMax","shell","manualReload","automatic","modText","lv","typeMinor","special","leech","impact","shootRate","rare","autoReload","livingWeapon","name","baseAccuracy","accuracyDec","attack","dmgAir","dmgArmor","reqTrait","reqLv","range"])
            if(inventory[field][wi]!=undefined) item[field]=inventory[field][wi];
         for(k=0;k<950;k++) if(player.trait[1][k]) traits[k]=player.trait[1][k];
         return {slot:1,exists:player.exist[1],weapon:item,member:{traits:traits,ai:player.ai[1],optBoss:player.optBoss[1],optWall:player.optWall[1],
            shootTimer:player.shootTimer[1],accuracyFix:player.accuracyFix[1],rampageTicks:player.rampage[1],aiState:{targetUid:oracleUid(player.target[1]),onMark:player.onMark[1],shooting:player.shooting[1],
            aimCount:player.aimCount[1],aimTime:player.aimTime[1],workRate:player.workRate[1],rangeFix:player.rangeFix[1],
            cursorX:cursor_mc[1].x,cursorY:cursor_mc[1].y,idleCount:player.idleCount[1],frenzy:player.frenzy[1],burst:player.burst[1],
            grenadeCount:player.grenadeCount[1],chainMode:chainMode[1],chainPos:chainPos[1]}}};
      }
      private function oracleWorldState() : Object {
         var cache:Array=[];var row:Array;var a:int;var b:int;var enemies:Array=[];var t:Object;
         for(a=0;a<3;a++) {row=[];for(b=0;b<3;b++) row.push({uid:oracleUid(aiTarget[a][b][0]),x:aiTarget[a][b][1]});cache.push(row);}
         for each(t in oraclePartyTargets) enemies.push({uid:t.oracleUid,type:t.type,x:t.x,y:t.y,speed:t.speed,hp:t.hp,removed:t.removed,tag:t.tag,onMark:t.onMark,dropping:t.dropping,dropY:t.mc.rat.y});
         return {shared:{targets:cache,targetBossUid:oracleUid(targetBoss),nextAlertUid:oracleUid(nextAlert),sharedWeaponRange:inventory.range[w]==undefined?null:inventory.range[w]},targets:enemies};
      }
      private function oracleSample(config:Object,step:int,op:Object) : void {
         oracleEmit({type:"snapshot",kind:"party-ai",scenario:config.name,boundary:config.boundary,config:config,step:step,op:op,
            actor:oracleActorState(),world:oracleWorldState(),events:oracleCombatEvents.concat(),drawCount:oracleCombatDraws,rngState:oracleCombatState,
            display:{frame:player_mc[1].currentFrame,x:player_mc[1].x,y:player_mc[1].y,accuracyDiv:player.accuracyDiv[1],shells:player.shell[1]}});
         ++oracleSnapshots;
      }
      private function oracleSetup(config:Object) : void {
         oracleCombatActive=false;oracleCombatReset(42);
         var k:int;var clip:*;
         for(k=0;k<maxAlly;k++) {
            clip=player_mc[k];if(clip!=null && clip.parent!=null) clip.parent.removeChild(clip);
            clip=cursor_mc[k];if(clip!=null && clip.parent!=null) clip.parent.removeChild(clip);
            player.exist[k]=false;
         }
         oracleCombatActive=true;oracleCombatState=42;oracleCombatDraws=0;oraclePrefix=[];oraclePrefixIndex=0;
         generatePlayer(1,1,config.dev==undefined?6:config.dev);
         player.optBoss[1]=config.optBoss==true;player.optWall[1]=true;player.ai[1]=config.order==undefined?0:config.order;
         hero=0;fireAtWill=false;game.castleHP=40;game.castleMHP=40;game.repair=0;game.optionFlashShot=false;
         sister.dead=true;castleCounter=0;shakeCount=0;protTime=0;bgChange=0;frenzyMode=0;
         initPartySkill();updateAlly();clearTarget();
         if(config.ammo!=undefined) inventory.ammo[41]=config.ammo;
         if(config.autoReload) inventory.autoReload[41]=1;
         player.shootTimer[1]=config.cooldown==undefined?0:config.cooldown;
         player.rampage[1]=config.rampage==undefined?0:config.rampage;
         player.frenzy[1]=config.frenzy==undefined?0:config.frenzy;
         if(config.grenadeCount!=undefined) player.grenadeCount[1]=config.grenadeCount;
         oraclePartyTargets=[oracleTarget(101,2,350,230,1),oracleTarget(102,0,250,250,1.25),oracleTarget(103,1,360,210,2)];
         if(!config.emptyCache) {aiTarget[2][2]=[oracleFind(101),350];aiTarget[0][1]=[oracleFind(102),250];aiTarget[1][2]=[oracleFind(103),360];}
         player.target[1]=config.heldTarget==undefined?undefined:oracleFind(config.heldTarget);
         if(config.aimCount!=undefined) player.aimCount[1]=config.aimCount;
         if(config.deadTarget) player.target[1].hp=0;
         player.onMark[1]=config.onMark==true;
         nextAlert=config.nextAlert==undefined?undefined:oracleFind(config.nextAlert);
         targetBoss=config.boss==undefined?undefined:oracleFind(config.boss);
         inventory.range[20]=config.sharedRange==undefined?0:config.sharedRange;w=20;
         oracleActualShoot=config.boundary=="shoot";
         oracleCombatState=42;oracleCombatDraws=0;oracleCombatEvents=[];oraclePrefix=config.prefix==undefined?[]:config.prefix;oraclePrefixIndex=0;
      }
      private function oracleCase(config:Object) : void {
         oracleSetup(config);oracleSample(config,0,null);
         var selected:*;var op:Object;var step:int=0;var k:int;
         if(config.boundary=="selector") {
            if(config.order==4) selected=aiAir(1,inventory.range[41]);
            else if(config.order==5) selected=aiArmor(1,inventory.range[41]);
            else if(config.order==6) selected=aiFireAtWill(1,inventory.range[41]);
            else selected=aiNormal(1,inventory.range[41]);
            oracleCombatEvents.push({type:"selected",uid:oracleUid(selected)});oracleSample(config,1,{select:true});return;
         }
         for each(op in config.ops) {
            oracleCombatEvents=[];
            if(op.shoot) {player.shootTimer[1]=0;shoot(1);}
            for(k=0;k<int(op.frames);k++) onEnterFrame(new Event(Event.ENTER_FRAME));
            for(k=0;k<int(op.timers);k++) onTick(new TimerEvent(TimerEvent.TIMER));
            oracleSample(config,++step,op);
         }
         oracleCombatActive=false;
      }
      private function oracleBattleReady() : void {
         if(oraclePhase!=2)return;oraclePhase=3;timer.stop();removeEventListener(Event.ENTER_FRAME,onEnterFrame);removeEventListener(Event.ENTER_FRAME,oracleAdvance);
         if(amb!=null)amb.stop();
         try {
            oracleEmit({type:"ready",kind:"party-ai",clock:"manual-original-root-handlers",controllerShoot:"record-only",shootBoundary:"actual-original-shoot-empty-collision-world"});
            var config:Object;var k:int;
            for(k=1;k<=9;k++) {config={name:"initial_class_"+k,boundary:"initial",dev:k};oracleSetup(config);oracleSample(config,0,null);}
            for each(config in __CASES__) oracleCase(config);
            oracleCombatActive=false;gamePaused=true;
            oracleEmit({type:"complete",kind:"party-ai",ok:true,snapshots:oracleSnapshots});
         } catch(error:Error) {oracleCombatActive=false;gamePaused=true;oracleEmit({type:"error",kind:"party-ai",message:error.message});}
      }
'''


def instrument(main_source, enemy_source):
    main, enemy, _, _ = combat_instrument(main_source, enemy_source)
    main = main.replace(COMBAT_AS3, extract_method(COMBAT_AS3, 'oracleCombatReset') + DRIVER.replace('__CASES__', json.dumps(CASES, separators=(',', ':'))))
    for original, wrapped in [('shoot','Shoot'),('reload','Reload'),('reloading','Reloading'),('endRampage','EndRampage'),('throwGrenade','ThrowGrenade')]:
        old = extract_method(main_source, original)
        actual = extract_method(main, original)
        assert actual.replace('oracleCombatRandom()', 'Math.random()') == old
        main = main.replace(actual, actual.replace('function '+original+'(', 'function oracleOriginal'+wrapped+'(', 1), 1)
    for name in ['onEnterFrame','onTick','updateAlly','refreshPlayer','startingAim','aiNormal','aiAir','aiArmor','aiFireAtWill','alert','searchNextAlert','clearTarget']:
        assert extract_method(main, name).replace('oracleCombatRandom()', 'Math.random()') == extract_method(main_source, name), name
    return main, enemy


def main():
    out=ROOT/'.build/oracle';out.mkdir(parents=True,exist_ok=True)
    original_path=ROOT/'original/elonashooter1.3.swf';source_path=ROOT/'src/shootem_fla/MainTimeline.as'
    original=original_path.read_bytes();source=source_path.read_bytes();report={'status':'failed','kind':'party-ai'}
    try:
        assert digest(original)==ORIGINAL_SHA256
        enemy_source=(ROOT/'.build/export/scripts/enemy.as').read_bytes()
        main_text,enemy_text=instrument(source.decode('utf-8-sig'),enemy_source.decode('utf-8-sig'))
        main_file=out/'PartyAiMainTimeline.as';enemy_file=out/'PartyAiEnemy.as'
        main_file.write_text(main_text,encoding='utf-8');enemy_file.write_text(enemy_text,encoding='utf-8')
        candidate=out/('party-ai-compiled-'+uuid.uuid4().hex+'.swf')
        result=command([find_java(None),'-Xmx1g','-jar',str(ROOT/'.tools/ffdec/ffdec.jar'),'-replace',str(original_path),str(candidate),'shootem_fla.MainTimeline',str(main_file),'enemy',str(enemy_file)],timeout=240)
        (out/'party-ai-build.log').write_text(result.stdout,encoding='utf-8')
        if result.returncode or not candidate.is_file():raise RuntimeError('FFDec failed; inspect party-ai-build.log')
        output=bytearray(candidate.read_bytes());output[3]=10
        report.update(verify_resources(original,output));(out/'party-ai-reference.swf').write_bytes(output)
        assert original_path.read_bytes()==original and source_path.read_bytes()==source
        report.update(status='passed',original_sha256=digest(original),source_sha256=digest(source),output_sha256=digest(output),output_bytes=len(output),
                      output='.build/oracle/party-ai-reference.swf',original_ai_methods_preserved=True,scenarios=CASES,
                      scope='Nine actual recruit initializations, source selectors/root-frame/timer control with observed shoot callbacks, separate actual shoot in empty collision world',runtime_validated=False)
    except Exception as error:report['error']=str(error)
    (out/'party-ai-build-report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:v for k,v in report.items() if k!='scenarios'},indent=2))
    return 0 if report['status']=='passed' else 1


if __name__=='__main__':raise SystemExit(main())
