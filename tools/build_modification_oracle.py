"""Проверяет исходные окна Upgrade/MOD; исправление последнего мода записывается отдельно."""
import json
import re
import uuid

from build import ROOT, ORIGINAL_SHA256, command, digest, find_java, verify
from build_oracle import instrument_startup, method_span
from build_wave_oracle import shared_driver_methods


MODIFICATION_AS3 = r'''
      private var oraclePhase:int = -1;
      private var oracleModificationActive:Boolean = false;
      private var oracleModificationState:uint = 1;
      private var oracleModificationDraws:Array = [];
      private var oracleModificationMessages:Array = [];
      private var oracleModificationSnapshots:int = 0;
      private var oracleModificationSlot:int = -1;
      private var oracleModificationMouseX:Number = 0;
      private var oracleModificationMouseY:Number = 0;
      private var oracleModificationConfig:Object;
      private var oracleModificationStep:int = 0;
      private var oracleModificationFields:Array = ["num","id","graphic","type","reloadTime","reloadTimeMax","ammo","ammoMax","value","mod","modMax","shell","manualReload","automatic","modText","lv","typeMinor","special","leech","impact","shootRate","rare","autoReload","livingWeapon","name","baseAccuracy","accuracyDec","attack","dmgAir","dmgArmor","reqTrait","reqLv","range"];
      private var oracleUpgradeCases:Array = [
         {name:"upgrade_plain_cancel_reopen",seed:42,id:3,mods:[],cancelReopen:true},
         {name:"upgrade_plain_three_draws",seed:6665,id:4,mods:[]},
         {name:"upgrade_one_mod",seed:1,id:3,mods:[[4,2]]},
         {name:"upgrade_repeated_mods",seed:3735928559,id:3,mods:[[4,2],[4,1],[1,3]],engineer:25,recycleMedal:true},
         {name:"upgrade_living_first",seed:42,id:21,mods:[[11,1],[4,2]],living:17},
         {name:"upgrade_living_last",seed:6665,id:4,mods:[[4,1],[11,1]],living:17},
         {name:"upgrade_no_money",seed:42,id:3,mods:[],money:1},
         {name:"upgrade_low_ap",seed:42,id:3,mods:[],ap:3}
      ];
      private var oracleMountCases:Array = [
         {name:"mount_damage",id:3,mod:4,modLevel:2},
         {name:"mount_damage_reload_metadata",id:3,mod:4,modLevel:2,controlledReload:true},
         {name:"mount_repeat_damage",id:3,mod:4,modLevel:2,mods:[[4,2]],engineer:25,recycleMedal:true},
         {name:"mount_full",id:3,mod:4,modLevel:1,mods:[[1,1]],capacity:1},
         {name:"mount_ammo_gravity",id:27,mod:7,modLevel:2},
         {name:"mount_ammo_bow",id:24,mod:7,modLevel:1},
         {name:"mount_reloading_bow",id:24,mod:2,modLevel:2},
         {name:"mount_auto_reload_magazine",id:19,mod:10,modLevel:3},
         {name:"mount_living_duplicate",id:3,mod:11,modLevel:1,mods:[[11,1]],living:17},
         {name:"mount_living_new",id:3,mod:11,modLevel:1},
         {name:"mount_repeat_auto_reload",id:3,mod:10,modLevel:1,mods:[[10,3]]},
         {name:"mount_cancel_swaps",id:3,mod:4,modLevel:2,cancel:true},
         {name:"stock_mod_occupied_blocked",id:3,mod:4,modLevel:2,stock:true}
      ];

      private function oracleModificationRandom() : Number
      {
         if(!oracleModificationActive) return Math.random();
         var value:int=int(oracleModificationState);
         value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
         oracleModificationState=uint(value);
         var result:Number=Number(oracleModificationState)/4294967296.0;
         oracleModificationDraws.push({index:oracleModificationDraws.length+1,state:oracleModificationState,value:result});
         return result;
      }

      private function oracleModificationX() : Number { return oracleModificationActive ? oracleModificationMouseX : mouseX; }
      private function oracleModificationY() : Number { return oracleModificationActive ? oracleModificationMouseY : mouseY; }
      private function oracleModificationObjects() : Array
      {
         if(oracleModificationActive && oracleModificationSlot >= 0) return [invSlot_mc[oracleModificationSlot].shortNum];
         return window2_mc.getObjectsUnderPoint(new Point(mouseX,mouseY));
      }

      private function oracleModificationItem(index:int) : Object
      {
         var result:Object={};
         var field:String;
         for each(field in oracleModificationFields) result[field]=inventory[field][index];
         return result;
      }

      private function oracleModificationSnapshot(op:String) : void
      {
         var owned:Array=[];
         var stock:Array=[];
         var slots:Array=[];
         var index:int;
         for(index=0;index<6;index++) owned.push(oracleModificationItem(_invPlayer+index));
         for(index=0;index<8;index++) stock.push(oracleModificationItem(_invShop+index));
         for(index=0;index<invSlotCount;index++) slots.push({id:invSlot_mc[index].id,op:invSlot_mc[index].op,alpha:invSlot_mc[index].alpha,item:invSlot_mc[index].item});
         var detail:Object=null;
         if(gameDialog) detail={action:dialogAction,question:dialog_mc.question.text,previewVisible:dialog_mc.pop1.visible && dialog_mc.pop2.visible};
         oracleEmit({type:"snapshot",kind:"modifications",version:1,scenario:oracleModificationConfig.name,config:oracleModificationConfig,step:oracleModificationStep++,op:op,
            seed:oracleModificationConfig.seed,context:{engineer:PARTY.ENGINEER,recycleMedal:medal[_medalAction4]},
            inventory:owned,shop:stock,reference:oracleModificationItem(_invRefer),gold:player.money[_pc],totalMoney:game.totalMoney,ap:game.ap,
            equipMode:equipMode,drag:drag,dialog:detail,slots:slots,messages:oracleModificationMessages.concat(),
            cost:upgradeWeapon(_invPlayer,1),draws:oracleModificationDraws.concat(),drawCount:oracleModificationDraws.length,rngState:oracleModificationState});
         oracleModificationMessages=[]; ++oracleModificationSnapshots;
      }

      private function oracleModificationClearSlots() : void
      {
         var index:int;
         for(index=0;index<invIconCount;index++) if(invIcon_mc[index] != null && invIcon_mc[index].parent != null) invIcon_mc[index].parent.removeChild(invIcon_mc[index]);
         for(index=0;index<invSlotCount;index++) if(invSlot_mc[index] != null && invSlot_mc[index].parent != null) invSlot_mc[index].parent.removeChild(invSlot_mc[index]);
         invIconCount=0; invSlotCount=0;
      }

      private function oracleModificationReset(config:Object) : void
      {
         oracleModificationActive=false;
         if(dialog_mc.parent != null) dialog_mc.parent.removeChild(dialog_mc);
         oracleModificationClearSlots();
         var field:String;
         var index:int;
         var modEntry:Array;
         for each(field in oracleModificationFields) for(index=0;index<_maxInv;index++) inventory[field][index]=undefined;
         for(index=0;index<_maxInv;index++) { inventory.num[index]=0; inventory.value[index]=0; }
         game.day=1; game.invSlot=6; game.ap=config.hasOwnProperty("ap") ? config.ap : 4;
         game.totalMoney=123; game.optWeaponLevel=false; game.looter=0;
         player.money[_pc]=config.hasOwnProperty("money") ? config.money : 50000;
         PARTY.ENGINEER=config.hasOwnProperty("engineer") ? config.engineer : 0;
         medal[_medalAction4]=config.recycleMedal == true;
         gameStage=_stageTown; menuId=4; equipMode=0; drag=false; gameDialog=false; gamePaused=false; orderIsOpen=false; cardCount=0;
         window2_mc.gotoAndStop("menu_shop"); window2_mc.x=0; window2_mc.y=0; window2_mc.visible=true; window2_mc.animeTime=0;
         if(window2_mc.parent == null) stage.addChild(window2_mc);
         for(index=0;index<popMax;index++) popList[index]=0;
         // Подготовка заданных предметов также использует оригинальные функции, но не входит в измеряемый поток.
         oracleModificationActive=true; oracleModificationState=777;
         generateStuff(_invPlayer,config.id);
         inventory.modMax[_invPlayer]=config.hasOwnProperty("capacity") ? config.capacity : 5;
         if(config.mods != undefined) for each(modEntry in config.mods) enchant(_invPlayer,modEntry[0],modEntry[1]);
         if(config.hasOwnProperty("living")) inventory.livingWeapon[_invPlayer]=config.living;
         inventory.ammo[_invPlayer]=inventory.ammoMax[_invPlayer]; inventory.reloadTime[_invPlayer]=0;
         if(config.controlledReload == true) { inventory.ammo[_invPlayer]=1; inventory.reloadTime[_invPlayer]=3; }
         generateStuff(_invPlayer+1,config.hasOwnProperty("modLevel") ? 7+config.modLevel : 8);
         setMod(_invPlayer+1,config.hasOwnProperty("mod") ? config.mod : 4);
         generateStuff(_invPlayer+2,117); generateStuff(_invPlayer+4,11); generateStuff(_invPlayer+5,4);
         generateStuff(_invShop,8); setMod(_invShop,config.hasOwnProperty("mod") ? config.mod : 4);
         generateStuff(_invRefer,1);
         oracleModificationActive=false;
         procShopMenu(); window2_mc.animeTime=0;
         oracleModificationConfig=config; oracleModificationStep=0;
         oracleModificationState=config.seed; oracleModificationDraws=[]; oracleModificationMessages=[];
         oracleModificationActive=true;
      }

      private function oracleModificationFindSlot(id:int) : int
      {
         for(var index:int=0;index<invSlotCount;index++) if(invSlot_mc[index].id == id) return index;
         throw new Error("Original inventory slot missing: "+id);
      }

      private function oracleModificationClickSlot(id:int) : void
      {
         oracleModificationSlot=oracleModificationFindSlot(id);
         invDrag();
         // Исходный вызывающий MouseLDownFunc_town завершает режим сразу после invDrag.
         if(equipMode) endEquipMode();
         oracleModificationSlot=-1;
      }

      private function oracleModificationEnterUpgrade() : void
      {
         var bounds:Object=window2_mc.act2.getBounds(stage);
         var found:Boolean=false;
         var px:int;
         var py:int;
         for(py=int(bounds.y)+2;py<bounds.bottom-2 && !found;py+=2)
         {
            for(px=int(bounds.x)+2;px<bounds.right-2;px+=2)
            {
               if(window2_mc.act2.hitTestPoint(px,py,true) && !vol.hitTestPoint(px,py,true))
               { oracleModificationMouseX=px; oracleModificationMouseY=py; found=true; break; }
            }
         }
         if(!found) throw new Error("Original shop Upgrade action has no hittable point");
         MouseLDownFunc_town(new MouseEvent(MouseEvent.MOUSE_DOWN));
      }

      private function oracleModificationRetainFinal() : void
      {
         // Отдельное вмешательство: исходный enchant восстанавливает ровно тот мод, который пропустил upgradeWeapon.
         var segments:Array=inventory.modText[_invPlayer].split(") ");
         if(segments.length < 2) return;
         var parts:Array=segments[segments.length-2].split("(Lv.");
         if(parts.length < 2) throw new Error("Final source modifier cannot be parsed");
         var id:int;
         var matched:int=0;
         for(id=0;id<encRef.length;id++) if(parts[0].indexOf(encRef[id].name) != -1)
         {
            enchant(_invRefer,id,int(parts[1]));
            if(id == _encLivingWeapon) inventory.livingWeapon[_invRefer]=inventory.livingWeapon[_invPlayer];
            ++matched;
         }
         if(matched != 1) throw new Error("Final modifier intervention is ambiguous");
      }

      private function oracleModificationUpgrade(config:Object) : void
      {
         oracleModificationReset(config); oracleModificationSnapshot("before");
         oracleModificationEnterUpgrade(); oracleModificationSnapshot("enterUpgrade");
         if(equipMode == 0) return;
         oracleModificationClickSlot(_invPlayer); oracleModificationSnapshot("previewOriginal");
         if(!gameDialog) throw new Error("Original upgrade selection did not open a dialog");
         if(config.retainFinal == true) { oracleModificationRetainFinal(); oracleModificationSnapshot("retainFinalIntervention"); }
         if(config.cancelReopen == true)
         {
            endDialog(false); oracleModificationSnapshot("cancel");
            oracleModificationEnterUpgrade(); oracleModificationSnapshot("enterUpgrade");
            oracleModificationClickSlot(_invPlayer); oracleModificationSnapshot("previewOriginal");
         }
         endDialog(true); oracleModificationSnapshot("confirm");
      }

      private function oracleModificationMount(config:Object) : void
      {
         config.seed=42;
         oracleModificationReset(config); oracleModificationSnapshot("before");
         oracleModificationClickSlot(config.stock == true ? _invShop : _invPlayer+1); oracleModificationSnapshot("pickup");
         if(!drag) throw new Error("Original MOD was not picked up");
         oracleModificationClickSlot(_invPlayer); oracleModificationSnapshot("drop");
         if(config.stock == true)
         {
            if(gameDialog) throw new Error("Stock MOD unexpectedly bypassed occupied-slot gating");
            return;
         }
         if(!gameDialog) throw new Error("Original owned MOD did not open its dialog");
         endDialog(config.cancel != true); oracleModificationSnapshot(config.cancel == true ? "cancel" : "confirm");
      }

      private function oracleBattleReady() : void
      {
         if(oraclePhase != 2) return;
         oraclePhase=3; timer.stop();
         removeEventListener(Event.ENTER_FRAME,onEnterFrame); removeEventListener(Event.ENTER_FRAME,oracleAdvance);
         if(amb != null) amb.stop();
         try
         {
            if(player.devType[_pc] != _devSheriff || inventory.id[weapon(_pc)] != 3) throw new Error("Original Sheriff initialization failed");
            oracleEmit({type:"ready",kind:"modifications",version:1,rng:"xorshift32",clock:"synchronous-original-shop-input-and-dialogs",frame71:false,intervention:"separate-original-enchant-retains-omitted-final-mod"});
            var config:Object;
            var copy:Object;
            for each(config in oracleUpgradeCases)
            {
               config.policy="original"; oracleModificationUpgrade(config);
               if(config.mods.length > 0)
               {
                  copy=cloneObj(config); copy.name=config.name+"_retained"; copy.policy="retain-final-mod"; copy.retainFinal=true;
                  oracleModificationUpgrade(copy);
               }
            }
            for each(config in oracleMountCases) { config.policy="original"; oracleModificationMount(config); }
            oracleModificationActive=false; gamePaused=true;
            oracleEmit({type:"complete",kind:"modifications",version:1,ok:true,snapshots:oracleModificationSnapshots,upgradeCases:12,mountCases:13});
         }
         catch(error:Error)
         {
            oracleModificationActive=false; gamePaused=true;
            oracleEmit({type:"error",kind:"modifications",message:error.message,scenario:oracleModificationConfig == null ? null : oracleModificationConfig.name,step:oracleModificationStep});
         }
      }
'''


def instrument(source):
    result = source.replace('Math.random()', 'oracleModificationRandom()')
    begin, _ = method_span(result, 'popInfo')
    observer = '\n         if(oracleModificationActive) oracleModificationMessages.push(param1);'
    result = result[:begin] + observer + result[begin:]
    original_objects = 'window2_mc.getObjectsUnderPoint(new Point(mouseX,mouseY))'
    drag_begin, drag_end = method_span(result, 'invDrag')
    drag_body = result[drag_begin:drag_end]
    if drag_body.count(original_objects) != 1:
        raise ValueError('Inventory point-query seam is ambiguous')
    result = result[:drag_begin] + drag_body.replace(original_objects, 'oracleModificationObjects()') + result[drag_end:]
    begin, end = method_span(result, 'MouseLDownFunc_town')
    old = result[begin:end]
    changed = old.replace('stage.mouseX', 'oracleModificationX()').replace('stage.mouseY', 'oracleModificationY()')
    changed = re.sub(r'\bmouseX\b', 'oracleModificationX()', changed)
    changed = re.sub(r'\bmouseY\b', 'oracleModificationY()', changed)
    result = result[:begin] + changed + result[end:]
    reverted = result[:begin] + old + result[begin + len(changed):]
    reverted = reverted.replace('oracleModificationObjects()', original_objects).replace(observer, '').replace('oracleModificationRandom()', 'Math.random()')
    if reverted != source:
        raise ValueError('Original method logic changed beyond reversible observation/input seams')
    result = result.replace('   import flash.events.*;', '   import flash.events.*;\n   import flash.external.ExternalInterface;')
    result = instrument_startup(result)
    closing = result.rfind('\n   }')
    return result[:closing] + '\n' + shared_driver_methods() + MODIFICATION_AS3 + result[closing:]


def main():
    out = ROOT / '.build/oracle'
    out.mkdir(parents=True, exist_ok=True)
    report = {'status': 'failed', 'kind': 'modifications', 'rng': 'xorshift32',
              'clock': 'synchronous-original-shop-input-and-dialogs', 'frame71_excluded': True,
              'intervention': 'Separate original enchant call restores omitted final modifier; raw preview is retained'}
    try:
        original_path, source_path = ROOT / 'original/elonashooter1.3.swf', ROOT / 'src/shootem_fla/MainTimeline.as'
        original, source_bytes = original_path.read_bytes(), source_path.read_bytes()
        if digest(original) != ORIGINAL_SHA256:
            raise ValueError('Preserved SWF fingerprint differs')
        injected = instrument(source_bytes.decode('utf-8-sig'))
        generated = out / 'ModificationMainTimeline.as'
        generated.write_text(injected, encoding='utf-8')
        candidate = out / ('modifications-compiled-' + uuid.uuid4().hex + '.swf')
        result = command([find_java(None), '-Xmx1g', '-jar', str(ROOT / '.tools/ffdec/ffdec.jar'), '-replace',
                          str(original_path), str(candidate), 'shootem_fla.MainTimeline', str(generated)], timeout=240)
        (out / 'modifications-build.log').write_text(result.stdout, encoding='utf-8')
        if result.returncode or not candidate.is_file():
            raise RuntimeError('Modification oracle compilation failed; inspect modifications-build.log')
        output = bytearray(candidate.read_bytes()); output[3] = 10
        report.update(verify(original, output))
        reference = out / 'modifications-reference.swf'; reference.write_bytes(output)
        if original_path.read_bytes() != original or source_path.read_bytes() != source_bytes:
            raise RuntimeError('Preserved input changed during oracle generation')
        report.update(status='passed', original_sha256=digest(original), source_sha256=digest(source_bytes),
                      output_sha256=digest(output), output=str(reference.relative_to(ROOT)).replace('\\', '/'),
                      output_bytes=len(output), original_method_logic_preserved=True, runtime_validated=False)
    except Exception as error:
        report['error'] = str(error)
    (out / 'modifications-build-report.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, indent=2))
    return 0 if report['status'] == 'passed' else 1


if __name__ == '__main__':
    raise SystemExit(main())
