"""Исходные транзакции Recruit/Dismiss/Equip: наблюдение без изменения их условий."""
import json
import re
import uuid

from build import ROOT, ORIGINAL_SHA256, command, digest, find_java, verify
from build_oracle import instrument_startup, method_span
from build_wave_oracle import shared_driver_methods


PARTY_AS3 = r'''
      private var oraclePhase:int=-1;
      private var oraclePartyActive:Boolean=false;
      private var oraclePartyState:uint=42;
      private var oraclePartyDraws:int=0;
      private var oraclePartySnapshots:int=0;
      private var oraclePartyScenario:String="";
      private var oraclePartyStage:String="";
      private var oraclePartyMessages:Array=[];
      private var oraclePartyMouseX:Number=0;
      private var oraclePartyMouseY:Number=0;
      private var oraclePartySelectedSlot:int=-1;
      private var oraclePartyItemFields:Array=["num","id","graphic","type","reloadTime","reloadTimeMax","ammo","ammoMax","value","mod","modMax","shell","manualReload","automatic","modText","lv","typeMinor","special","leech","impact","shootRate","rare","autoReload","livingWeapon","name","baseAccuracy","accuracyDec","attack","dmgAir","dmgArmor","reqTrait","reqLv","range"];
      private var oraclePartyPlayerFields:Array=["sex","name","devType","potentialAim","potentialTeam","lv","sp","trained","optBoss","optWall","kill","earn","money","nextTrait","ai","forcus","cost","exp","wexp","pic"];

      private function oraclePartyRandom():Number {
         if(!oraclePartyActive) return Math.random();
         var value:int=int(oraclePartyState);
         value^=value<<13; value^=value>>>17; value^=value<<5;
         oraclePartyState=uint(value); ++oraclePartyDraws;
         return Number(oraclePartyState)/4294967296.0;
      }
      private function oraclePartyX():Number { return oraclePartyActive ? oraclePartyMouseX : mouseX; }
      private function oraclePartyY():Number { return oraclePartyActive ? oraclePartyMouseY : mouseY; }
      private function oraclePartyObjects():Array {
         if(oraclePartyActive && oraclePartySelectedSlot>=0) return [invSlot_mc[oraclePartySelectedSlot].shortNum];
         return window2_mc.getObjectsUnderPoint(new Point(mouseX,mouseY));
      }
      private function oraclePartyItem(index:int):Object {
         var result:Object={}; var field:String;
         for each(field in oraclePartyItemFields) result[field]=inventory[field][index];
         return result;
      }
      private function oraclePartyRecord(index:int):Object {
         if(player.lv[index] == undefined) return null;
         var result:Object={}; var field:String; var traits:Object={}; var id:int;
         for each(field in oraclePartyPlayerFields) result[field]=player[field][index];
         for(id=0;id<_maxTrait;id++) if(player.trait[index][id]) traits[id]=player.trait[index][id];
         result.trait=traits;
         return result;
      }
      private function oraclePartySnapshot(op:String):void {
         var slots:Array=[]; var owned:Array=[]; var index:int;
         for(index=1;index<=5;index++) slots.push({slot:index,exists:player.exist[index],member:oraclePartyRecord(index),weapon:oraclePartyItem(40+index)});
         for(index=20;index<26;index++) owned.push(oraclePartyItem(index));
         oracleEmit({type:"snapshot",kind:"party-hiring",scenario:oraclePartyScenario,op:op,
            slots:slots,inventory:owned,auxiliary:{"47":oraclePartyItem(47),"48":oraclePartyItem(48)},
            capacity:game.house,gold:player.money[_pc],totalMoney:game.totalMoney,ap:game.ap,
            selected:cs,dialog:gameDialog ? dialogAction : null,drag:drag,
            question:gameDialog ? dialog_mc.question.text : null,messages:oraclePartyMessages.concat(),
            drawCount:oraclePartyDraws,rngState:oraclePartyState});
         oraclePartyMessages=[]; ++oraclePartySnapshots;
      }
      private function oraclePartyCleanup():void {
         oraclePartyStage="cleanup-actors";
         var index:int; var child:MovieClip;
         for(index=0;index<maxAlly+1;index++) {
            child=player_mc[index] as MovieClip;
            if(child != null && child.parent == window2_mc) window2_mc.removeChild(child);
         }
         oraclePartyStage="cleanup-stats";
         for(index=0;index<statsCount;index++) if(stats_mc[index].parent == window2_mc) window2_mc.removeChild(stats_mc[index]);
         statsCount=0;
         for(index=0;index<invSlotCount;index++) if(invSlot_mc[index].parent == window2_mc) window2_mc.removeChild(invSlot_mc[index]);
         for(index=0;index<invIconCount;index++) if(invIcon_mc[index].parent == window2_mc) window2_mc.removeChild(invIcon_mc[index]);
         invSlotCount=0; invIconCount=0;
         if(dialog_mc.parent == stage) stage.removeChild(dialog_mc);
         gameDialog=false; drag=false; equipMode=0;
      }
      private function oraclePartyMenu():void {
         oraclePartyCleanup(); menuId=3; cs=5; delay=10;
         oraclePartyStage="character-frame";
         window2_mc.gotoAndStop("menu_chara"); window2_mc.visible=true; window2_mc.x=0; window2_mc.y=-26;
         if(window2_mc.parent != stage) stage.addChild(window2_mc);
         oraclePartyStage="procCharaMenu"; procCharaMenu(); window2_mc.animeTime=0;
      }
      private function oraclePartyReset(name:String,dev:int):void {
         oraclePartyScenario=name;
         oraclePartyActive=false; oraclePartyCleanup();
         oraclePartyStage="reset-player-columns";
         var index:int; var field:String;
         for(index=1;index<=5;index++) {
            for(field in player) player[field][index]=undefined;
            player.exist[index]=false; player.trait[index]=[];
         }
         oraclePartyStage="reset-inventory-columns";
         for(index=20;index<49;index++) if(index != 20 && index != 21) {
            for each(field in oraclePartyItemFields) inventory[field][index]=undefined;
            inventory.num[index]=0; inventory.value[index]=0;
         }
         game.day=7; game.house=1; game.ap=0; game.totalMoney=1234; game.invSlot=6;
         game.comp=false; game.carryOver=false; game.optWeaponLevel=false; gameStage=_stageTown;
         player.money[0]=1000; cardCount=0; gamePaused=false; orderIsOpen=false; nextAlert=undefined;
         for(index=0;index<_maxMedal;index++) medal[index]=false;
         oraclePartyState=42; oraclePartyDraws=0; oraclePartyMessages=[]; oraclePartyActive=true;
         oraclePartyStage="generate-candidate"; generatePlayer(5,4,dev);
         oraclePartyActive=false; oraclePartyMenu();
         oraclePartyScenario=name; oraclePartyState=42; oraclePartyDraws=0; oraclePartyActive=true;
      }
      private function oraclePartyClickCharacterAction():void {
         oraclePartyStage="action-bounds";
         var bounds:Object=window2_mc.dismissButton.getBounds(stage); var found:Boolean=false; var px:int; var py:int;
         for(py=int(bounds.y)+1;py<bounds.bottom-1 && !found;py+=2) for(px=int(bounds.x)+1;px<bounds.right-1;px+=2) {
            if(window2_mc.dismissButton.hitTestPoint(px,py,true) && !vol.hitTestPoint(px,py,true)) {
               oraclePartyMouseX=px; oraclePartyMouseY=py; found=true; break;
            }
         }
         if(!found) throw new Error("Character action has no original hittable point");
         delay=10; oraclePartyStage="town-input"; MouseLDownFunc_town(new MouseEvent(MouseEvent.MOUSE_DOWN));
      }
      private function oraclePartyHireCase(dev:int):void {
         oraclePartyReset("class-"+dev,dev); player.money[0]=player.cost[5];
         oraclePartySnapshot("before"); oraclePartyClickCharacterAction(); oraclePartySnapshot("open");
         if(!gameDialog || dialogAction != _dialogRecruit) throw new Error("Recruit dialog not opened");
         endDialog(false); oraclePartySnapshot("cancel");
         oraclePartyClickCharacterAction(); endDialog(true); oraclePartySnapshot("hire");
         cs=1; updateCharaMenu(); oraclePartyClickCharacterAction(); oraclePartySnapshot("dismiss-open");
         endDialog(true); oraclePartySnapshot("dismiss");
      }
      private function oraclePartyGuard(name:String,mode:int):void {
         oraclePartyReset(name,6);
         if(mode==0) player.money[0]=player.cost[5]-1;
         if(mode==1) {
            oraclePartyCleanup(); generatePlayer(1,2,9); oraclePartyMenu();
         }
         if(mode==2) {
            oraclePartyCleanup(); game.house=3; generatePlayer(1,2,1); generatePlayer(2,2,2); generatePlayer(3,2,3); oraclePartyMenu();
         }
         oraclePartyState=42; oraclePartyDraws=0;
         oraclePartySnapshot("before"); oraclePartyClickCharacterAction(); oraclePartySnapshot("guard");
      }
      private function oraclePartyRehire():void {
         oraclePartyReset("dismiss-rehire",6); oraclePartyClickCharacterAction(); endDialog(true);
         cs=1; updateCharaMenu(); oraclePartyClickCharacterAction(); endDialog(true);
         oraclePartyCleanup(); generatePlayer(5,2,9); oraclePartyMenu(); player.money[0]=1000;
         oraclePartyState=42; oraclePartyDraws=0;
         oraclePartySnapshot("before"); oraclePartyClickCharacterAction(); endDialog(true); oraclePartySnapshot("hire");
      }
      private function oraclePartyEquipSlot(id:int):int {
         for(var index:int=0;index<invSlotCount;index++) if(invSlot_mc[index].id == id) return index;
         throw new Error("Equipment slot missing "+id);
      }
      private function oraclePartyEquipClick(id:int):void {
         oraclePartySelectedSlot=oraclePartyEquipSlot(id); invDrag(); oraclePartySelectedSlot=-1;
      }
      private function oraclePartyEquip(name:String,mode:int):void {
         oraclePartyReset(name,6); oraclePartyClickCharacterAction(); endDialog(true);
         oraclePartyCleanup(); menuId=6; cs=0;
         generateStuff(22,1); generateStuff(23,8); setMod(23,4); generateStuff(24,11);
         window2_mc.gotoAndStop("menu_equip"); procEquipMenu(); window2_mc.animeTime=0;
         oraclePartyState=42; oraclePartyDraws=0; oraclePartyMessages=[];
         oraclePartySnapshot("before");
         var source:int=mode<2 ? 23 : 41;
         var destination:int=mode==2 ? 22 : mode==3 ? 24 : mode==4 ? 25 : 41;
         oraclePartyEquipClick(source); oraclePartySnapshot("pickup");
         var enabled:Boolean=invSlot_mc[oraclePartyEquipSlot(destination)].alpha == 1;
         oraclePartyEquipClick(destination); oraclePartySnapshot(enabled ? "drop" : "blocked");
         if(gameDialog) { endDialog(mode==1); oraclePartySnapshot(mode==1 ? "mount" : "cancel"); }
      }
      private function oracleBattleReady():void {
         if(oraclePhase!=2) return; oraclePhase=3; timer.stop();
         removeEventListener(Event.ENTER_FRAME,onEnterFrame); removeEventListener(Event.ENTER_FRAME,oracleAdvance);
         if(amb != null) amb.stop();
         // Полный обработчик Recruit продолжает проверять кнопки корневого кадра города.
         gameContinued=true;
         addEventListener(Event.ENTER_FRAME,oraclePartyTownReady);
         gotoAndStop("town");
      }
      private function oraclePartyTownReady(event:Event):void {
         if(currentFrame != 71 || equipButton == null || charaButton == null) return;
         removeEventListener(Event.ENTER_FRAME,oraclePartyTownReady);
         removeEventListener(Event.ENTER_FRAME,onEnterFrame_town);
         stage.removeEventListener(KeyboardEvent.KEY_DOWN,KeyDown_town);
         stage.removeEventListener(MouseEvent.MOUSE_DOWN,MouseLDownFunc_town);
         if(amb != null) amb.stop();
         try {
            if(player.devType[0]!=6 || inventory.id[weapon(0)]!=3) throw new Error("Original Sheriff initialization failed");
            oracleEmit({type:"ready",kind:"party-hiring",rng:"xorshift32",clock:"synchronous-original-town-input-and-dialogs",frame71:true,continuedTownEntry:true});
            var dev:int; for(dev=1;dev<=9;dev++) oraclePartyHireCase(dev);
            oraclePartyGuard("insufficient-gold",0); oraclePartyGuard("house-full",1); oraclePartyGuard("party-full",2);
            oraclePartyRehire();
            oraclePartyEquip("ally-mod-cancel",0); oraclePartyEquip("ally-mod-confirm",1);
            oraclePartyEquip("reverse-gun-blocked",2); oraclePartyEquip("reverse-consumable-blocked",3); oraclePartyEquip("unequip-empty",4);
            oraclePartyActive=false; gamePaused=true;
            oracleEmit({type:"complete",kind:"party-hiring",ok:true,snapshots:oraclePartySnapshots,classes:9,equipmentCases:5});
         } catch(error:Error) {
            oraclePartyActive=false; gamePaused=true;
            oracleEmit({type:"error",kind:"party-hiring",message:error.message,scenario:oraclePartyScenario,snapshots:oraclePartySnapshots,diagnosticStage:oraclePartyStage,stack:error.getStackTrace()});
         }
      }
'''


def instrument(source):
    result = source.replace('Math.random()', 'oraclePartyRandom()')
    begin, _ = method_span(result, 'popInfo')
    observer = '\n         if(oraclePartyActive) oraclePartyMessages.push(param1);'
    result = result[:begin] + observer + result[begin:]
    original_objects = 'window2_mc.getObjectsUnderPoint(new Point(mouseX,mouseY))'
    begin, end = method_span(result, 'invDrag')
    body = result[begin:end]
    if body.count(original_objects) != 1:
        raise ValueError('Inventory input seam ambiguous')
    result = result[:begin] + body.replace(original_objects, 'oraclePartyObjects()') + result[end:]
    begin, end = method_span(result, 'MouseLDownFunc_town')
    original_body = result[begin:end]
    changed = original_body.replace('stage.mouseX', 'oraclePartyX()').replace('stage.mouseY', 'oraclePartyY()')
    changed = re.sub(r'\bmouseX\b', 'oraclePartyX()', changed)
    changed = re.sub(r'\bmouseY\b', 'oraclePartyY()', changed)
    result = result[:begin] + changed + result[end:]
    reverted = result[:begin] + original_body + result[begin + len(changed):]
    reverted = reverted.replace('oraclePartyObjects()', original_objects).replace(observer, '').replace('oraclePartyRandom()', 'Math.random()')
    if reverted != source:
        raise ValueError('Original logic changed beyond reversible input/observation seams')
    begin, end = method_span(result, 'MouseLDownFunc_town')
    body = result[begin:end]
    stages = [
        ('          if(vol.hitTestPoint', 'volume-hit-test'),
        ('          if(menuId == 3 && delay > 3)', 'character-menu-input'),
        ('             if(window2_mc.act1.hitTestPoint', 'action-hit-test'),
        ('                   if(player_mc[i].bg.hitTestPoint', 'portrait-hit-test'),
        ('          if(menuId == 3 && cs != maxAlly)', 'owned-trait-input'),
        ('          if(menuId == 3 && cs != _pc && window2_mc.dismissButton.mouseEnabled == true)', 'recruit-action-guard'),
        ('                   showDialog(_dialogRecruit);', 'recruit-show-dialog'),
    ]
    inserted = []
    for needle, stage in stages:
        needle = needle.strip()
        if needle not in body:
            raise ValueError('Diagnostic source anchor missing: ' + needle)
        statement = '         if(oraclePartyActive) oraclePartyStage="' + stage + '";\n'
        body = body.replace(needle, statement + needle)
        inserted.append(statement)
    restored_body = body
    for statement in inserted:
        restored_body = restored_body.replace(statement, '')
    if restored_body != result[begin:end]:
        raise ValueError('Diagnostic stages changed original input logic')
    result = result[:begin] + body + result[end:]
    result = result.replace('   import flash.events.*;', '   import flash.events.*;\n   import flash.external.ExternalInterface;')
    result = instrument_startup(result)
    closing = result.rfind('\n   }')
    return result[:closing] + '\n' + shared_driver_methods() + PARTY_AS3 + result[closing:]


def main():
    out = ROOT / '.build/oracle'; out.mkdir(parents=True, exist_ok=True)
    report = {'status': 'failed', 'kind': 'party-hiring', 'rng': 'xorshift32',
              'clock': 'synchronous-original-town-input-and-dialogs', 'frame71_excluded': False,
              'continued_town_entry': True, 'fresh_town_generation_excluded': True,
              'input_seams': ['town mouse position', 'inventory objects-under-point'],
              'boundary': 'Original permanent Recruit/Dismiss and owned companion equipment, all nine generated classes; no combat or growth claim'}
    try:
        original_path, source_path = ROOT / 'original/elonashooter1.3.swf', ROOT / 'src/shootem_fla/MainTimeline.as'
        original, source_bytes = original_path.read_bytes(), source_path.read_bytes()
        if digest(original) != ORIGINAL_SHA256: raise ValueError('Preserved SWF fingerprint differs')
        generated = out / 'PartyHiringMainTimeline.as'; generated.write_text(instrument(source_bytes.decode('utf-8-sig')), encoding='utf-8')
        candidate = out / ('party-hiring-compiled-' + uuid.uuid4().hex + '.swf')
        result = command([find_java(None), '-Xmx1g', '-jar', str(ROOT / '.tools/ffdec/ffdec.jar'), '-replace',
                          str(original_path), str(candidate), 'shootem_fla.MainTimeline', str(generated)], timeout=240)
        (out / 'party-hiring-build.log').write_text(result.stdout, encoding='utf-8')
        if result.returncode or not candidate.is_file(): raise RuntimeError('Party hiring oracle compilation failed; inspect party-hiring-build.log')
        output = bytearray(candidate.read_bytes()); output[3] = 10
        report.update(verify(original, output))
        reference = out / 'party-hiring-reference.swf'; reference.write_bytes(output)
        if original_path.read_bytes() != original or source_path.read_bytes() != source_bytes: raise RuntimeError('Preserved input changed')
        report.update(status='passed', original_sha256=digest(original), source_sha256=digest(source_bytes),
                      output_sha256=digest(output), output=str(reference.relative_to(ROOT)).replace('\\', '/'),
                      output_bytes=len(output), original_method_logic_preserved=True, runtime_validated=False)
    except Exception as error:
        report['error'] = str(error)
    (out / 'party-hiring-build-report.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, indent=2))
    return 0 if report['status'] == 'passed' else 1


if __name__ == '__main__':
    raise SystemExit(main())
