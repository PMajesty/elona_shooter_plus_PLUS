"""Эталон исходного Rest: окно, подтверждение, событие Begin и подготовка боя дня 2."""
import json
import uuid

from build import ROOT, ORIGINAL_SHA256, command, digest, find_java, verify
from build_oracle import instrument_startup
from build_wave_oracle import shared_driver_methods


REST_AS3 = r'''
      private var oraclePhase:int=-1;
      private var oracleRestActive:Boolean=false;
      private var oracleRestState:uint=1;
      private var oracleRestDraws:int=0;
      private var oracleRestCaseIndex:int=0;
      private var oracleRestSnapshots:int=0;
      private var oracleRestSeeds:Array=[42,1,3735928559];
      private var oracleRestItemFields:Array=["num","id","graphic","type","reloadTime","reloadTimeMax","ammo","ammoMax","value","mod","modMax","shell","manualReload","automatic","modText","lv","typeMinor","special","leech","impact","shootRate","rare","autoReload","livingWeapon","name","baseAccuracy","accuracyDec","attack","dmgAir","dmgArmor","reqTrait","reqLv","range"];
      private var oracleRestMissionFields:Array=["level","fixedLv","strength","power","powerOrg","reward","hire","ragnarok","wave","spawnRate","group","waveType","loot","newWave","time","bossDay","bossWave","note","hpFix","dmgFix","expFix","absorbFix","bossKilled","noDamage","criticalCount","resultOther"];

      private function oracleRestRandom() : Number
      {
         if(!oracleRestActive) return Math.random();
         var value:int=int(oracleRestState);
         value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
         oracleRestState=uint(value); ++oracleRestDraws;
         return Number(oracleRestState)/4294967296.0;
      }

      private function oracleRestFreeze() : void
      {
         timer.stop();
         removeEventListener(Event.ENTER_FRAME,onEnterFrame);
         removeEventListener(Event.ENTER_FRAME,oracleAdvance);
         if(amb != null) amb.stop();
      }

      private function oracleBattleReady() : void
      {
         if(oraclePhase != 2 && oraclePhase != 5) return;
         try
         {
            oracleRestFreeze();
            if(oraclePhase == 2)
            {
               if(player.devType[_pc] != _devSheriff || inventory.id[weapon(_pc)] != 3) throw new Error("Original Sheriff initialization failed");
               oracleEmit({type:"ready",kind:"rest",rng:"xorshift32",clock:"original-rest-with-explicit-begin-frame",seeds:oracleRestSeeds.concat(),cases:3});
               addEventListener(Event.ENTER_FRAME,oracleRestAdvance);
            }
            else
            {
               oracleRestSnapshot("battle-ready");
               oracleRestActive=false;
               ++oracleRestCaseIndex;
            }
            oraclePhase=3;
            if(oracleRestCaseIndex >= oracleRestSeeds.length)
            {
               removeEventListener(Event.ENTER_FRAME,oracleRestAdvance);
               gamePaused=true;
               oracleEmit({type:"complete",kind:"rest",ok:true,snapshots:oracleRestSnapshots,cases:3});
            }
         }
         catch(error:Error) { oracleRestFail(error); }
      }

      private function oracleRestFail(error:Error) : void
      {
         oracleRestActive=false;
         removeEventListener(Event.ENTER_FRAME,oracleRestAdvance);
         gamePaused=true;
         oracleEmit({type:"error",kind:"rest",message:error.message,phase:oraclePhase,frame:currentFrame});
      }

      private function oracleRestSnapshot(op:String) : void
      {
         var index:int;
         var field:String;
         var items:Array=[];
         var item:Object;
         for(index=20;index<26;index++)
         {
            item={};
            for each(field in oracleRestItemFields) item[field]=inventory[field][index];
            items.push(item);
         }
         var prepared:Object={};
         for each(field in oracleRestMissionFields) prepared[field]=mission[field] is Array ? mission[field].concat() : mission[field];
         var waves:Array=[];
         if(op == "battle-ready")
         {
            for(index=0;index<mission.wave;index++) waves.push({index:index,enemies:pop[index].concat(),delays:popTime[index].concat(),initialCount:mission.group[index]});
         }
         var dialog:MovieClip=stage.getChildByName("eventWindow") as MovieClip;
         var detail:Object=dialog == null ? null : {title:dialog.title.text,text:dialog.text.text,cardFrame:dialog.card.currentFrame};
         oracleEmit({type:"snapshot",kind:"rest",seed:oracleRestSeeds[oracleRestCaseIndex],op:op,day:game.day,hp:game.castleHP,maxHp:game.castleMHP,gold:player.money[_pc],ap:game.ap,selectedSlot:ci,eventDialog:eventDialog,dialog:detail,mission:prepared,inventory:items,player:{level:player.lv[_pc],exp:player.exp[_pc],shootTimer:player.shootTimer[_pc],accuracyFix:player.accuracyFix[_pc],rampage:player.rampage[_pc],shooting:player.shooting[_pc],burst:player.burst[_pc],frenzy:player.frenzy[_pc],idleCount:player.idleCount[_pc]},resultBefore:mission.resultBefore,resultTaken:mission.resultTaken,waves:waves,drawCount:oracleRestDraws,rngState:oracleRestState});
         ++oracleRestSnapshots;
      }

      private function oracleRestSetup() : void
      {
         var index:int;
         var field:String;
         oracleRestActive=false;
         // Убираем прошлую сцену исходными функциями; это подготовка фикстуры, не Rest.
         exitBattle2(); removeAlly(); removeEnemy();
         for(index=1;index<maxAlly;index++) player.exist[index]=false;
         for(index=0;index<_maxMedal;index++) medal[index]=false;
         medal[_medalDay1]=true;
         if(oracleRestCaseIndex == 2) medal[_medalNoDamage1]=true;
         game.day=1; game.HC=false; game.casual=false; game.MORE=false; game.carryOver=false;
         game.optionAltStart=0; game.skipHard=false; game.sister=0; game.invSlot=6;
         game.ap=oracleRestCaseIndex == 1 ? 4 : oracleRestCaseIndex;
         game.castleMHP=40; game.castleHP=oracleRestCaseIndex == 1 ? 40 : 17;
         game.prayerCount=0; game.tauntCount=0; game.partyCount=0; game.recycleCount=0; game.robCount=0;
         player.money[_pc]=940; player.lv[_pc]=2; player.exp[_pc]=125; player.sp[_pc]=0;
         for(index=0;index<_maxTrait;index++) player.trait[_pc][index]=0;
         player.trait[_pc][_devSheriff]=2; player.trait[_pc][TRAIT.SHOTGUN]=2; player.trait[_pc][TRAIT.FURY]=1;
         player.trait[_pc][TRAIT.BASE_AIMING]=4; player.trait[_pc][TRAIT.BASE_TEAMWORK]=5;
         initPartySkill();
         oracleRestState=42; oracleRestDraws=0; oracleRestActive=true;
         for(index=20;index<26;index++)
         {
            for each(field in oracleRestItemFields) inventory[field][index]=undefined;
            inventory.num[index]=0; inventory.value[index]=0;
         }
         generateStuff(20,3); generateStuff(21,11); generateStuff(22,1); generateStuff(23,12); generateStuff(24,117);
         inventory.ammo[20]=1; inventory.reloadTime[20]=2;
         inventory.ammo[21]=2; inventory.reloadTime[21]=8;
         inventory.ammo[22]=3; inventory.reloadTime[22]=5;
         inventory.ammo[23]=1; inventory.reloadTime[23]=4;
         generateMission(1);
         player.shootTimer[_pc]=333; player.accuracyFix[_pc]=0.2; player.rampage[_pc]=15;
         player.shooting[_pc]=true; player.burst[_pc]=2; player.frenzy[_pc]=31; player.idleCount[_pc]=17;
         mission.resultBefore=200; mission.resultTaken=9;
         window2_mc=new window() as MovieClip;
         window2_mc.gotoAndStop("menu_castle"); stage.addChild(window2_mc);
         menuId=0; selectID=0; radioCount=0; invSlotCount=0; invIconCount=0;
         gameStage=_stageTown; gamePaused=false; eventDialog=0; eventList=[]; ci=22;
         oracleRestState=uint(oracleRestSeeds[oracleRestCaseIndex]); oracleRestDraws=0;
         oracleRestSnapshot("before");
         showEventDialog(_dialogActSleep);
         oracleRestSnapshot("dialog");
         var dialog:MovieClip=stage.getChildByName("eventWindow") as MovieClip;
         if(dialog == null) throw new Error("Original Rest dialog missing");
         oraclePhase=4;
         procEventDialog(dialog);
      }

      private function oracleRestAdvance(event:Event) : void
      {
         try
         {
            if(oraclePhase == 3) oracleRestSetup();
            else if(oraclePhase == 4 && currentFrame == 65 && ce == _eventBegin)
            {
               removeEventListener(Event.ENTER_FRAME,onEnterFrame_result);
               oracleRestSnapshot("after-ack");
               // Пропускается только ожидание оформления Begin: исполняется исходная ветка delay90.
               delay=89; oraclePhase=5;
               onEnterFrame_result(new Event(Event.ENTER_FRAME));
            }
         }
         catch(error:Error) { oracleRestFail(error); }
      }
'''


def main():
    out = ROOT / '.build/oracle'
    out.mkdir(parents=True, exist_ok=True)
    report = {'status': 'failed', 'kind': 'rest', 'rng': 'xorshift32',
              'clock': 'original-rest-with-explicit-begin-frame', 'original_transition_methods_unmodified': True,
              'begin_animation_wait_skipped': True, 'town_preparation_excluded': True}
    try:
        original_path, source_path = ROOT / 'original/elonashooter1.3.swf', ROOT / 'src/shootem_fla/MainTimeline.as'
        original, source_bytes = original_path.read_bytes(), source_path.read_bytes()
        if digest(original) != ORIGINAL_SHA256:
            raise ValueError('Preserved SWF fingerprint differs')
        source = source_bytes.decode('utf-8-sig')
        instrumented = source.replace('Math.random()', 'oracleRestRandom()')
        if instrumented.replace('oracleRestRandom()', 'Math.random()') != source:
            raise ValueError('Random wrapper changed original logic')
        instrumented = instrumented.replace('   import flash.events.*;', '   import flash.events.*;\n   import flash.external.ExternalInterface;')
        instrumented = instrument_startup(instrumented)
        closing = instrumented.rfind('\n   }')
        instrumented = instrumented[:closing] + '\n' + shared_driver_methods() + REST_AS3 + instrumented[closing:]
        generated = out / 'RestMainTimeline.as'
        generated.write_text(instrumented, encoding='utf-8')
        candidate = out / ('rest-compiled-' + uuid.uuid4().hex + '.swf')
        result = command([find_java(None), '-Xmx1g', '-jar', str(ROOT / '.tools/ffdec/ffdec.jar'), '-replace', str(original_path), str(candidate), 'shootem_fla.MainTimeline', str(generated)], timeout=240)
        (out / 'rest-build.log').write_text(result.stdout, encoding='utf-8')
        if result.returncode or not candidate.is_file():
            raise RuntimeError('Rest oracle compilation failed; inspect rest-build.log')
        output = bytearray(candidate.read_bytes()); output[3] = 10
        report.update(verify(original, output))
        reference = out / 'rest-reference.swf'; reference.write_bytes(output)
        if original_path.read_bytes() != original or source_path.read_bytes() != source_bytes:
            raise RuntimeError('A preserved input changed during oracle generation')
        report.update(status='passed', original_sha256=digest(original), source_sha256=digest(source_bytes), output_sha256=digest(output),
                      output=str(reference.relative_to(ROOT)).replace('\\', '/'), output_bytes=len(output), runtime_validated=False)
    except Exception as error:
        report['error'] = str(error)
    (out / 'rest-build-report.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, indent=2))
    return 0 if report['status'] == 'passed' else 1


if __name__ == '__main__':
    raise SystemExit(main())
