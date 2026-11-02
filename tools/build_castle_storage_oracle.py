"""Исходные Storage, расширенные слоты и границы пополнения боеприпасов."""
import json
import uuid

from build import ROOT, ORIGINAL_SHA256, command, digest, find_java, verify
from build_oracle import method_span
from build_castle_upgrades_oracle import CASTLE_AS3, instrument as instrument_castle
from build_modification_oracle import MODIFICATION_AS3
from build_shoot_oracle import extract_method


COMMON = '\n'.join(extract_method(CASTLE_AS3, name) for name in [
    'oracleCastleRandom', 'oracleCastleX', 'oracleCastleY', 'oracleCastleCleanup', 'oracleCastleReset', 'oracleCastleClick'])
UPGRADE_INPUT = extract_method(MODIFICATION_AS3, 'oracleModificationEnterUpgrade').replace('oracleModification', 'oracleStorage')
UPGRADE_INPUT = UPGRADE_INPUT.replace('oracleStorageMouseX', 'oracleCastleMouseX').replace('oracleStorageMouseY', 'oracleCastleMouseY')
DRIVER = r'''
      private var oraclePhase:int=-1;
      private var oracleCastleActive:Boolean=false;
      private var oracleCastleState:uint=42;
      private var oracleCastleDraws:int=0;
      private var oracleCastleScenario:String="";
      private var oracleCastleStage:String="";
      private var oracleCastleMouseX:Number=0;
      private var oracleCastleMouseY:Number=0;
      private var oracleStorageSelected:int=-1;
      private var oracleStorageSnapshots:int=0;
      private var oracleStorageFields:Array=["num","id","graphic","type","reloadTime","reloadTimeMax","ammo","ammoMax","value","mod","modMax","shell","manualReload","automatic","modText","lv","typeMinor","special","leech","impact","shootRate","rare","autoReload","livingWeapon","name","baseAccuracy","accuracyDec","attack","dmgAir","dmgArmor","reqTrait","reqLv","range"];
      private function oracleStorageObjects():Array {
         if(oracleCastleActive && oracleStorageSelected==-2)return [];
         if(oracleCastleActive && oracleStorageSelected>=0)return [invSlot_mc[oracleStorageSelected].shortNum];
         return window2_mc.getObjectsUnderPoint(new Point(mouseX,mouseY));
      }
      private function oracleStorageItem(index:int):Object {
         var result:Object={};for each(var field:String in oracleStorageFields)result[field]=inventory[field][index];return result;
      }
      private function oracleStorageSnapshot(boundary:String,op:String):void {
         var owned:Array=[];var stock:Array=[];var slots:Array=[];var index:int;
         for(index=0;index<game.invSlot;index++)owned.push(oracleStorageItem(20+index));
         for(index=0;index<8;index++)stock.push(oracleStorageItem(index));
         for(index=0;index<invSlotCount;index++)slots.push({id:invSlot_mc[index].id,op:invSlot_mc[index].op,x:invSlot_mc[index].x,y:invSlot_mc[index].y,shortNum:invSlot_mc[index].shortNum.text});
         var tile:Object=null;
         if(boundary=="purchase")tile={cost:getUpgradeCost(3),possible:upgrade_mc[3].possible,name:upgrade_mc[3].upgradeName.text,hint:upgradeHint[3].concat()};
         var dialog:String=null;
         if(gameDialog)dialog=dialogAction==_dialogUpgrade?"upgrade":dialogAction==_dialogMod?"mod":dialogAction==_dialogSell?"sell":"other";
         oracleEmit({type:"snapshot",kind:"castle-storage",boundary:boundary,scenario:oracleCastleScenario,op:op,
            day:game.day,capacity:game.invSlot,storageLevel:game.storage,inventory:owned,shop:stock,ally:oracleStorageItem(41),reference:oracleStorageItem(49),
            gold:player.money[0],ap:game.ap,totalMoney:game.totalMoney,upkeep:calcUnkeep(),hp:game.castleHP,maxHp:game.castleMHP,
            tile:tile,slots:slots,dialog:dialog,selectedSlot:ci-20,drawCount:oracleCastleDraws,rngState:oracleCastleState});++oracleStorageSnapshots;
      }
      private function oracleStorageClearItems():void {
         for each(var field:String in oracleStorageFields)for(var index:int=0;index<_maxInv;index++)inventory[field][index]=undefined;
         for(index=0;index<_maxInv;index++){inventory.num[index]=0;inventory.value[index]=0;}
      }
      private function oracleStorageSetup(name:String,capacity:int):void {
         oracleCastleReset(name,50000,1,30,40);oracleStorageClearItems();
         game.day=1;game.invSlot=capacity;game.storage=capacity-5;game.ap=0;game.totalMoney=1234;
         PARTY.ENGINEER=0;medal[_medalAction4]=false;ci=20;oracleStorageSelected=-1;
         oracleCastleState=777;oracleCastleDraws=0;
         generateStuff(20,3);generateStuff(21,11);generateStuff(41,4);
         removeUpgrades();updateCastleMenu();oracleCastleState=42;oracleCastleDraws=0;
      }
      private function oracleStoragePurchase(name:String,capacity:int,gold:int,clicks:int=1):void {
         oracleStorageSetup(name,capacity);player.money[0]=gold;removeUpgrades();updateCastleMenu();
         oracleStorageSnapshot("purchase","before");
         for(var index:int=0;index<clicks;index++){oracleCastleClick(3);oracleStorageSnapshot("purchase","click");}
      }
      private function oracleStorageMenu(mode:String):void {
         oracleCastleCleanup();page=0;cs=0;delay=10;
         window2_mc.x=0;window2_mc.y=-26;window2_mc.visible=true;
         if(mode=="loot"){menuId=0;ce=_eventLoot;window2_mc.gotoAndStop("menu_loot");procLootMenu();}
         else if(mode=="equipment"){menuId=6;window2_mc.gotoAndStop("menu_equip");procEquipMenu();}
         else {menuId=4;window2_mc.gotoAndStop("menu_shop");procShopMenu();}
         window2_mc.animeTime=0;
      }
      private function oracleStorageClick(id:int):void {
         oracleStorageSelected=-2;
         if(id>=0) {
            for(var index:int=0;index<invSlotCount;index++)if(invSlot_mc[index].id==id){oracleStorageSelected=index;break;}
            if(oracleStorageSelected<0)throw new Error("Missing original slot "+id);
         }
         invDrag();if(equipMode)endEquipMode();oracleStorageSelected=-1;
      }
      private function oracleStorageTransaction(name:String):void {
         oracleStorageSetup(name,16);oracleCastleState=777;oracleCastleDraws=0;
         generateStuff(0,4);generateStuff(28,6);generateStuff(34,9);setMod(34,4);generateStuff(35,3);inventory.modMax[35]=3;
         if(name=="shop-buy" || name=="loot-collect"){generateStuff(35,117);inventory.num[35]=0;}
         if(name=="sale")generateStuff(35,6);
         if(name=="token")generateStuff(35,35);
         if(name=="upgrade")game.ap=4;
         oracleStorageMenu(name=="loot-collect"?"loot":name=="owned-move"?"equipment":"shop");
         oracleCastleState=42;oracleCastleDraws=0;oracleStorageSnapshot("transaction","before");
         if(name=="shop-buy" || name=="loot-collect"){oracleStorageClick(0);oracleStorageClick(35);oracleStorageSnapshot("transaction","transfer");}
         else if(name=="owned-move"){oracleStorageClick(35);oracleStorageClick(28);oracleStorageSnapshot("transaction","transfer");}
         else if(name=="mod-confirm" || name=="mod-cancel") {
            oracleStorageClick(34);oracleStorageClick(35);if(!gameDialog || dialogAction!=_dialogMod)throw new Error("Original MOD dialog missing");
            oracleStorageSnapshot("transaction","preview");endDialog(name=="mod-confirm");oracleStorageSnapshot("transaction",name=="mod-confirm"?"confirm":"cancel");
         }
         else if(name=="upgrade") {
            oracleStorageEnterUpgrade();if(equipMode!=1)throw new Error("Original Upgrade mode missing");
            oracleStorageClick(35);if(!gameDialog || dialogAction!=_dialogUpgrade)throw new Error("Original Upgrade dialog missing");
            oracleStorageSnapshot("transaction","preview");endDialog(true);oracleStorageSnapshot("transaction","confirm");
         }
         else if(name=="sale") {
            oracleStorageClick(35);oracleStorageClick(-1);if(!gameDialog || dialogAction!=_dialogSell)throw new Error("Original sale dialog missing");
            oracleStorageSnapshot("transaction","preview");endDialog(true);oracleStorageSnapshot("transaction","confirm");
         }
         else if(name=="token"){oracleStorageClick(35);oracleStorageClick(0);oracleStorageSnapshot("transaction","transfer");}
      }
      private function oracleStorageAmmo():void {
         oracleCastleScenario="backpack-ammo-and-keys";oracleCastleStage="ammo-setup";oracleCastleActive=true;
         oracleStorageClearItems();game.invSlot=16;game.storage=11;game.day=1;game.ap=0;game.totalMoney=1234;player.money[0]=200;
         game.castleHP=30;game.castleMHP=40;gamePaused=false;gameOver=false;ci=20;
         for(var index:int=1;index<maxAlly;index++)player.exist[index]=false;
         oracleCastleState=777;oracleCastleDraws=0;generateStuff(20,3);generateStuff(25,3);generateStuff(34,11);generateStuff(35,4);generateStuff(41,4);
         inventory.ammo[25]=2;inventory.reloadTime[25]=3;inventory.ammo[34]=1;inventory.reloadTime[34]=7;inventory.ammo[35]=1;inventory.reloadTime[35]=7;
         oracleCastleState=42;oracleCastleDraws=0;oracleStorageSnapshot("ammo","before");
         KeyDown(new KeyboardEvent(KeyboardEvent.KEY_DOWN,true,false,0,54));oracleStorageSnapshot("ammo","key6");
         fillAmmo();oracleStorageSnapshot("ammo","fillAmmo");
         updateAlly();oracleStorageSnapshot("ammo","updateAlly");
      }
      private function oracleBattleReady():void {
         if(oraclePhase!=2)return;oraclePhase=3;timer.stop();removeEventListener(Event.ENTER_FRAME,onEnterFrame);removeEventListener(Event.ENTER_FRAME,oracleAdvance);
         if(amb!=null)amb.stop();
         try {
            oracleEmit({type:"ready",kind:"castle-storage",clock:"synchronous-original-castle-inventory-and-ammo",rng:"xorshift32",
               continuedTownEntry:true,ownedStart:20,ownedMax:35,stockSlots:8,battleSlots:5});
            oracleStorageAmmo();oracleCastleActive=false;gameContinued=true;
            addEventListener(Event.ENTER_FRAME,oracleStorageTownReady);gotoAndStop("town");
         }catch(error:Error){oracleStorageError(error);}
      }
      private function oracleStorageError(error:Error):void {
         oracleCastleActive=false;gamePaused=true;
         oracleEmit({type:"error",kind:"castle-storage",message:error.message,scenario:oracleCastleScenario,snapshots:oracleStorageSnapshots,diagnosticStage:oracleCastleStage,stack:error.getStackTrace()});
      }
      private function oracleStorageTownReady(event:Event):void {
         if(currentFrame!=71 || equipButton==null || charaButton==null)return;
         removeEventListener(Event.ENTER_FRAME,oracleStorageTownReady);removeEventListener(Event.ENTER_FRAME,onEnterFrame_town);
         stage.removeEventListener(KeyboardEvent.KEY_DOWN,KeyDown_town);stage.removeEventListener(MouseEvent.MOUSE_DOWN,MouseLDownFunc_town);
         if(amb!=null)amb.stop();
         try {
            oracleStoragePurchase("storage-insufficient",6,369);oracleStoragePurchase("storage-first",6,370);
            oracleStoragePurchase("storage-row-two",8,730);oracleStoragePurchase("storage-final",15,3880);
            oracleStoragePurchase("storage-cap",16,50000);oracleStoragePurchase("storage-sequence",6,890,2);
            for each(var name:String in ["shop-buy","loot-collect","owned-move","mod-confirm","mod-cancel","upgrade","sale","token"])oracleStorageTransaction(name);
            oracleCastleActive=false;gamePaused=true;
            oracleEmit({type:"complete",kind:"castle-storage",ok:true,snapshots:oracleStorageSnapshots,purchaseCases:6,transactionCases:8,ammoCases:1});
         }catch(error:Error){oracleStorageError(error);}
      }
'''


def instrument(source):
    result = instrument_castle(source)
    assert result.count(CASTLE_AS3) == 1
    result = result.replace(CASTLE_AS3, COMMON + UPGRADE_INPUT + DRIVER)
    begin, end = method_span(result, 'invDrag'); body = result[begin:end]
    original = 'window2_mc.getObjectsUnderPoint(new Point(mouseX,mouseY))'
    assert body.count(original) == 1
    result = result[:begin] + body.replace(original, 'oracleStorageObjects()') + result[end:]
    for name in ['getUpgradeCost','upgradeDone','calcUnkeep','fillAmmo','updateAlly','KeyDown','swapStuff','endDialog','upgradeWeapon']:
        assert extract_method(result,name).replace('oracleCastleRandom()','Math.random()') == extract_method(source,name), name
    return result


def main():
    out=ROOT/'.build/oracle';out.mkdir(parents=True,exist_ok=True)
    original_path=ROOT/'original/elonashooter1.3.swf';source_path=ROOT/'src/shootem_fla/MainTimeline.as'
    original,source=original_path.read_bytes(),source_path.read_bytes()
    report={'status':'failed','kind':'castle-storage','boundary':'Original Storage tile purchases, expanded owned-slot transactions, fillAmmo/updateAlly and ignored sixth battle key',
            'input_seams':['town mouse position','inventory objects-under-point'],'continued_town_entry':True,'fresh_town_generation_excluded':True}
    try:
        if digest(original)!=ORIGINAL_SHA256:raise ValueError('Preserved SWF fingerprint differs')
        generated=out/'CastleStorageMainTimeline.as';generated.write_text(instrument(source.decode('utf-8-sig')),encoding='utf-8')
        candidate=out/('castle-storage-compiled-'+uuid.uuid4().hex+'.swf')
        result=command([find_java(None),'-Xmx1g','-jar',str(ROOT/'.tools/ffdec/ffdec.jar'),'-replace',str(original_path),str(candidate),'shootem_fla.MainTimeline',str(generated)],timeout=240)
        (out/'castle-storage-build.log').write_text(result.stdout,encoding='utf-8')
        if result.returncode or not candidate.is_file():raise RuntimeError('Storage compilation failed; inspect castle-storage-build.log')
        output=bytearray(candidate.read_bytes());output[3]=10;report.update(verify(original,output))
        reference=out/'castle-storage-reference.swf';reference.write_bytes(output)
        if original_path.read_bytes()!=original or source_path.read_bytes()!=source:raise RuntimeError('Preserved input changed')
        report.update(status='passed',original_sha256=digest(original),source_sha256=digest(source),output_sha256=digest(output),output_bytes=len(output),
                      output=str(reference.relative_to(ROOT)).replace('\\','/'),original_method_logic_preserved=True,runtime_validated=False)
    except Exception as error:report['error']=str(error)
    (out/'castle-storage-build-report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(report,indent=2));return 0 if report['status']=='passed' else 1


if __name__=='__main__':raise SystemExit(main())
