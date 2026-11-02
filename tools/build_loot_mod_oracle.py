"""Исходное подтверждение MOD во всех областях обычной и боссовой добычи."""
import json
import re
import uuid

from build import ROOT, ORIGINAL_SHA256, command, digest, find_java, verify
from build_oracle import instrument_startup, method_span
from build_wave_oracle import shared_driver_methods
from build_castle_storage_oracle import COMMON


DRIVER = r'''
      private var oraclePhase:int=-1;
      private var oracleCastleActive:Boolean=false;
      private var oracleCastleState:uint=42;
      private var oracleCastleDraws:int=0;
      private var oracleCastleScenario:String="";
      private var oracleCastleStage:String="";
      private var oracleCastleMouseX:Number=0;
      private var oracleCastleMouseY:Number=0;
      private var oracleLootModSlot:int=-1;
      private var oracleLootModSnapshots:int=0;
      private var oracleLootModConfig:Object;
      private var oracleLootModMessages:Array=[];
      private var oracleLootModFields:Array=["num","id","graphic","type","reloadTime","reloadTimeMax","ammo","ammoMax","value","mod","modMax","shell","manualReload","automatic","modText","lv","typeMinor","special","leech","impact","shootRate","rare","autoReload","livingWeapon","name","baseAccuracy","accuracyDec","attack","dmgAir","dmgArmor","reqTrait","reqLv","range"];
      private var oracleLootModCases:Array=[
         {name:"offer-owned-yes",from:0,to:20},
         {name:"offer-owned-no",from:0,to:20,cancel:true},
         {name:"owned-offer-yes",from:21,to:0},
         {name:"owned-offer-outside",from:21,to:0,cancel:true,outside:true},
         {name:"owned-owned-yes",from:21,to:20},
         {name:"owned-owned-no",from:21,to:20,cancel:true},
         {name:"offer-offer-yes",from:0,to:1},
         {name:"offer-offer-no",from:0,to:1,cancel:true},
         {name:"boss-offer-last-owned-yes",from:7,to:35,boss:true,capacity:16},
         {name:"boss-last-owned-offer-no",from:35,to:7,boss:true,capacity:16,cancel:true},
         {name:"full-capacity",from:0,to:20,mods:[[4,1]],modCapacity:1},
         {name:"ammo-bow",from:0,to:20,gun:24,mod:7},
         {name:"boss-reloading-bow",from:21,to:0,gun:24,mod:2,boss:true},
         {name:"auto-reload-magazine",from:0,to:20,gun:19,mod:10},
         {name:"already-living",from:21,to:20,mod:11,mods:[[11,1]],living:17},
         {name:"boss-living-new",from:0,to:20,mod:11,boss:true},
         {name:"repeated-damage-engineer",from:0,to:20,gun:4,mods:[[4,1]],engineer:25},
         {name:"reverse-gun-mod",from:20,to:0,reverse:true}
      ];
      private function oracleLootModObjects():Array {
         if(oracleCastleActive && oracleLootModSlot>=0)return [invSlot_mc[oracleLootModSlot].shortNum];
         return window2_mc.getObjectsUnderPoint(new Point(mouseX,mouseY));
      }
      private function oracleLootModItem(index:int):Object {
         var result:Object={};for each(var field:String in oracleLootModFields)result[field]=inventory[field][index];return result;
      }
      private function oracleLootModSnapshot(op:String):void {
         var owned:Array=[];var offers:Array=[];var slots:Array=[];var index:int;
         for(index=0;index<game.invSlot;index++)owned.push(oracleLootModItem(20+index));
         for(index=0;index<8;index++)offers.push(oracleLootModItem(index));
         for(index=0;index<invSlotCount;index++)slots.push({id:invSlot_mc[index].id,op:invSlot_mc[index].op,alpha:invSlot_mc[index].alpha});
         var detail:Object=null;
         if(gameDialog)detail={action:dialogAction,question:dialog_mc.question.text,comparisonVisible:dialog_mc.pop1.visible || dialog_mc.pop2.visible || dialog_mc.poparrow.visible};
         oracleEmit({type:"snapshot",kind:"loot-mod",scenario:oracleLootModConfig.name,config:oracleLootModConfig,op:op,
            mode:ce==_eventLootBoss?"boss-loot":"loot",inventory:owned,offers:offers,context:{day:game.day,engineer:PARTY.ENGINEER,recycleMedal:medal[_medalAction4]},
            gold:player.money[0],ap:game.ap,totalMoney:game.totalMoney,dialog:detail,drag:drag,fadeCount:fadeCount,
            messages:oracleLootModMessages.concat(),slots:slots,drawCount:oracleCastleDraws,rngState:oracleCastleState});
         oracleLootModMessages=[];++oracleLootModSnapshots;
      }
      private function oracleLootModSetup(config:Object):void {
         oracleCastleReset(config.name,0,1,30,40);
         oracleLootModConfig=config;game.day=1;game.ap=0;game.totalMoney=1234;game.invSlot=config.capacity==16?16:6;game.storage=game.invSlot-5;
         PARTY.ENGINEER=config.hasOwnProperty("engineer")?config.engineer:0;medal[_medalAction4]=false;
         for each(var field:String in oracleLootModFields)for(var index:int=0;index<_maxInv;index++)inventory[field][index]=undefined;
         for(index=0;index<_maxInv;index++){inventory.num[index]=0;inventory.value[index]=0;}
         oracleCastleState=777;oracleCastleDraws=0;
         var gun:int=config.reverse==true?config.from:config.to;
         var mod:int=config.reverse==true?config.to:config.from;
         generateStuff(gun,config.hasOwnProperty("gun")?config.gun:3);
         inventory.modMax[gun]=config.hasOwnProperty("modCapacity")?config.modCapacity:5;
         if(config.mods!=undefined)for each(var entry:Array in config.mods)enchant(gun,entry[0],entry[1]);
         if(config.hasOwnProperty("living"))inventory.livingWeapon[gun]=config.living;
         inventory.ammo[gun]=0;inventory.reloadTime[gun]=0;
         generateStuff(mod,9);setMod(mod,config.hasOwnProperty("mod")?config.mod:4);
         oracleCastleCleanup();gameStage=_stageResult;menuId=0;gamePaused=false;toTownMenu=false;fadeCount=0;ce=config.boss==true?_eventLootBoss:_eventLoot;
         window2_mc.gotoAndStop(config.boss==true?"menu_lootBoss":"menu_loot");window2_mc.x=0;window2_mc.y=-26;window2_mc.visible=true;
         procLootMenu();window2_mc.animeTime=0;
         for(index=0;index<popMax;index++)popList[index]=0;
         oracleCastleState=42;oracleCastleDraws=0;oracleLootModMessages=[];oracleLootModSlot=-1;
      }
      private function oracleLootModClick(id:int):void {
         oracleLootModSlot=-1;
         for(var index:int=0;index<invSlotCount;index++)if(invSlot_mc[index].id==id){oracleLootModSlot=index;break;}
         if(oracleLootModSlot<0)throw new Error("Original loot slot missing: "+id);
         invDrag();oracleLootModSlot=-1;
      }
      private function oracleLootModResolve(config:Object):void {
         if(config.outside==true){oracleCastleMouseX=-10;oracleCastleMouseY=-10;}
         else {
            var target:DisplayObject=config.cancel==true?dialog_mc.no:dialog_mc.yes;
            var bounds:Object=target.getBounds(stage);var found:Boolean=false;
            for(var py:int=int(bounds.y)+1;py<bounds.bottom-1 && !found;py+=2)for(var px:int=int(bounds.x)+1;px<bounds.right-1;px+=2) {
               if(target.hitTestPoint(px,py,true) && !vol.hitTestPoint(px,py,true)){oracleCastleMouseX=px;oracleCastleMouseY=py;found=true;break;}
            }
            if(!found)throw new Error("Original dialog button has no hittable point");
         }
         MouseLDownFunc_result(new MouseEvent(MouseEvent.MOUSE_DOWN));
         if(gameDialog)throw new Error("Original loot dialog did not resolve");
      }
      private function oracleBattleReady():void {
         if(oraclePhase!=2)return;oraclePhase=3;timer.stop();removeEventListener(Event.ENTER_FRAME,onEnterFrame);removeEventListener(Event.ENTER_FRAME,oracleAdvance);
         if(amb!=null)amb.stop();gameContinued=true;addEventListener(Event.ENTER_FRAME,oracleLootModTownReady);gotoAndStop("town");
      }
      private function oracleLootModTownReady(event:Event):void {
         if(currentFrame!=71 || equipButton==null || charaButton==null)return;
         removeEventListener(Event.ENTER_FRAME,oracleLootModTownReady);removeEventListener(Event.ENTER_FRAME,onEnterFrame_town);
         stage.removeEventListener(KeyboardEvent.KEY_DOWN,KeyDown_town);stage.removeEventListener(MouseEvent.MOUSE_DOWN,MouseLDownFunc_town);
         if(amb!=null)amb.stop();
         try {
            oracleEmit({type:"ready",kind:"loot-mod",clock:"synchronous-original-loot-input-and-dialog",rng:"xorshift32",continuedTownEntry:true,cases:18});
            for each(var config:Object in oracleLootModCases) {
               oracleLootModSetup(config);oracleLootModSnapshot("before");
               oracleLootModClick(config.from);if(!drag)throw new Error("Source item was not picked up");
               oracleLootModClick(config.to);oracleLootModSnapshot(config.reverse==true?"swap":"preview");
               if(config.reverse==true){if(gameDialog)throw new Error("Reverse drag unexpectedly opened MOD dialog");continue;}
               if(!gameDialog || dialogAction!=_dialogMod)throw new Error("Source MOD dialog missing");
               oracleLootModResolve(config);oracleLootModSnapshot(config.cancel==true?"cancel":"confirm");
            }
            oracleCastleActive=false;gamePaused=true;
            oracleEmit({type:"complete",kind:"loot-mod",ok:true,cases:18,snapshots:oracleLootModSnapshots});
         }catch(error:Error){oracleCastleActive=false;gamePaused=true;oracleEmit({type:"error",kind:"loot-mod",message:error.message,scenario:oracleCastleScenario,snapshots:oracleLootModSnapshots,stack:error.getStackTrace()});}
      }
'''


def instrument(source):
    result=source.replace('Math.random()', 'oracleCastleRandom()')
    observer='\n         if(oracleCastleActive) oracleLootModMessages.push(param1);'
    begin,_=method_span(result,'popInfo');result=result[:begin]+observer+result[begin:]
    objects='window2_mc.getObjectsUnderPoint(new Point(mouseX,mouseY))'
    begin,end=method_span(result,'invDrag');body=result[begin:end];assert body.count(objects)==1
    result=result[:begin]+body.replace(objects,'oracleLootModObjects()')+result[end:]
    originals=[]
    for name in ['MouseLDownFunc_town','MouseLDownFunc_result']:
        begin,end=method_span(result,name);body=result[begin:end]
        changed=body.replace('stage.mouseX','oracleCastleX()').replace('stage.mouseY','oracleCastleY()')
        changed=re.sub(r'\bmouseX\b','oracleCastleX()',changed);changed=re.sub(r'\bmouseY\b','oracleCastleY()',changed)
        originals.append((name,body));result=result[:begin]+changed+result[end:]
    reverted=result
    for name,body in originals:
        begin,end=method_span(reverted,name);reverted=reverted[:begin]+body+reverted[end:]
    reverted=reverted.replace('oracleLootModObjects()',objects).replace(observer,'').replace('oracleCastleRandom()','Math.random()')
    assert reverted==source,'Original logic changed beyond reversible observation/input seams'
    result=result.replace('   import flash.events.*;','   import flash.events.*;\n   import flash.external.ExternalInterface;')
    result=instrument_startup(result);closing=result.rfind('\n   }')
    return result[:closing]+'\n'+shared_driver_methods()+COMMON+DRIVER+result[closing:]


def main():
    out=ROOT/'.build/oracle';out.mkdir(parents=True,exist_ok=True)
    original_path=ROOT/'original/elonashooter1.3.swf';source_path=ROOT/'src/shootem_fla/MainTimeline.as'
    original,source=original_path.read_bytes(),source_path.read_bytes()
    report={'status':'failed','kind':'loot-mod','boundary':'Original ordinary/boss loot MOD drag, result dialog shape clicks, all four area directions, mount guards and reverse swap',
            'input_seams':['inventory objects-under-point','result/town mouse position'],'continued_town_entry':True,'fresh_town_and_loot_generation_excluded':True}
    try:
        if digest(original)!=ORIGINAL_SHA256:raise ValueError('Preserved SWF fingerprint differs')
        generated=out/'LootModMainTimeline.as';generated.write_text(instrument(source.decode('utf-8-sig')),encoding='utf-8')
        candidate=out/('loot-mod-compiled-'+uuid.uuid4().hex+'.swf')
        result=command([find_java(None),'-Xmx1g','-jar',str(ROOT/'.tools/ffdec/ffdec.jar'),'-replace',str(original_path),str(candidate),'shootem_fla.MainTimeline',str(generated)],timeout=240)
        (out/'loot-mod-build.log').write_text(result.stdout,encoding='utf-8')
        if result.returncode or not candidate.is_file():raise RuntimeError('Loot MOD compilation failed; inspect loot-mod-build.log')
        output=bytearray(candidate.read_bytes());output[3]=10;report.update(verify(original,output))
        reference=out/'loot-mod-reference.swf';reference.write_bytes(output)
        if original_path.read_bytes()!=original or source_path.read_bytes()!=source:raise RuntimeError('Preserved input changed')
        report.update(status='passed',original_sha256=digest(original),source_sha256=digest(source),output_sha256=digest(output),output_bytes=len(output),
                      output=str(reference.relative_to(ROOT)).replace('\\','/'),original_method_logic_preserved=True,runtime_validated=False)
    except Exception as error:report['error']=str(error)
    (out/'loot-mod-build-report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(report,indent=2));return 0 if report['status']=='passed' else 1


if __name__=='__main__':raise SystemExit(main())
