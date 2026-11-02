"""Исходные покупки House/Wall через настоящий обработчик меню Castle."""
import json
import re
import uuid

from build import ROOT, ORIGINAL_SHA256, command, digest, find_java, verify
from build_oracle import instrument_startup, method_span
from build_wave_oracle import shared_driver_methods


CASTLE_AS3 = r'''
      private var oraclePhase:int=-1;
      private var oracleCastleActive:Boolean=false;
      private var oracleCastleState:uint=42;
      private var oracleCastleDraws:int=0;
      private var oracleCastleSnapshots:int=0;
      private var oracleCastleScenario:String="";
      private var oracleCastleStage:String="";
      private var oracleCastleMouseX:Number=0;
      private var oracleCastleMouseY:Number=0;

      private function oracleCastleRandom():Number {
         if(!oracleCastleActive) return Math.random();
         var value:int=int(oracleCastleState);
         value^=value<<13; value^=value>>>17; value^=value<<5;
         oracleCastleState=uint(value); ++oracleCastleDraws;
         return Number(oracleCastleState)/4294967296.0;
      }
      private function oracleCastleX():Number { return oracleCastleActive ? oracleCastleMouseX : mouseX; }
      private function oracleCastleY():Number { return oracleCastleActive ? oracleCastleMouseY : mouseY; }
      private function oracleCastleTile(index:int):Object {
         return {cost:getUpgradeCost(index),possible:upgrade_mc[index].possible,
            name:upgrade_mc[index].upgradeName.text,priceText:upgrade_mc[index].upgradeCost.text,
            mouseEnabled:upgrade_mc[index].upgradeButton.mouseEnabled};
      }
      private function oracleCastleSnapshot(op:String,target:int=-1):void {
         oracleEmit({type:"snapshot",kind:"castle-upgrades",scenario:oracleCastleScenario,op:op,
            target:target<0 ? null : target==4 ? "house" : "wall",
            capacity:game.house,wallLevel:game.wallUpgrade,hp:game.castleHP,maxHp:game.castleMHP,
            gold:player.money[_pc],ap:game.ap,totalMoney:game.totalMoney,upkeep:calcUnkeep(),
            upkeepText:window2_mc.unkeep.text,house:oracleCastleTile(4),wall:oracleCastleTile(1),
            dialog:gameDialog,eventDialog:stage.getChildByName("eventWindow")!=null,
            drawCount:oracleCastleDraws,rngState:oracleCastleState});
         ++oracleCastleSnapshots;
      }
      private function oracleCastleCleanup():void {
         var index:int; var child:MovieClip;
         for(index=0;index<maxAlly+1;index++) {
            child=player_mc[index] as MovieClip;
            if(child != null && child.parent==window2_mc) window2_mc.removeChild(child);
         }
         for(index=0;index<statsCount;index++) if(stats_mc[index].parent==window2_mc) window2_mc.removeChild(stats_mc[index]);
         for(index=0;index<invSlotCount;index++) if(invSlot_mc[index].parent==window2_mc) window2_mc.removeChild(invSlot_mc[index]);
         for(index=0;index<invIconCount;index++) if(invIcon_mc[index].parent==window2_mc) window2_mc.removeChild(invIcon_mc[index]);
         for(index=0;index<upgradeCount;index++) if(upgrade_mc[index].parent==window2_mc) window2_mc.removeChild(upgrade_mc[index]);
         statsCount=0; invSlotCount=0; invIconCount=0; upgradeCount=0;
         if(dialog_mc.parent==stage) stage.removeChild(dialog_mc);
         if(stage.getChildByName("eventWindow")!=null) stage.removeChild(stage.getChildByName("eventWindow"));
         gameDialog=false; drag=false; equipMode=0;
      }
      private function oracleCastleReset(name:String,gold:int,house:int=1,hp:int=40,maxHp:int=40,wallLevel:int=1):void {
         oracleCastleActive=false; oracleCastleStage="reset"; oracleCastleCleanup();
         var index:int; var key:String;
         for each(key in upgradeRef) game[key]=0;
         game.day=7; game.house=house; game.wallUpgrade=wallLevel; game.storage=1;
         game.castleHP=hp; game.castleMHP=maxHp; game.ap=0; game.totalMoney=1234; game.invSlot=6;
         game.comp=false; game.carryOver=false; gameStage=_stageTown;
         player.money[_pc]=gold; cardCount=0; gamePaused=false; orderIsOpen=false;
         for(index=1;index<=5;index++) player.exist[index]=false;
         for(index=0;index<_maxMedal;index++) medal[index]=false;
         menuId=2; page=0; cs=0; delay=10;
         oracleCastleStage="castle-frame";
         window2_mc.gotoAndStop("menu_castle"); window2_mc.visible=true; window2_mc.x=0; window2_mc.y=-26;
         if(window2_mc.parent!=stage) stage.addChild(window2_mc);
         oracleCastleStage="castle-menu"; procCastleMenu(); window2_mc.animeTime=0;
         oracleCastleScenario=name; oracleCastleState=42; oracleCastleDraws=0; oracleCastleActive=true;
      }
      private function oracleCastleClick(index:int):void {
         oracleCastleStage="tile-shape";
         var bounds:Object=upgrade_mc[index].getBounds(stage); var found:Boolean=false; var px:int; var py:int; var prior:int; var blocked:Boolean;
         for(py=int(bounds.y)+1;py<bounds.bottom-1 && !found;py+=2) for(px=int(bounds.x)+1;px<bounds.right-1;px+=2) {
            if(!upgrade_mc[index].hitTestPoint(px,py,true) || vol.hitTestPoint(px,py,true) || window2_mc.act1.hitTestPoint(px,py,true)) continue;
            blocked=false;
            for(prior=0;prior<index;prior++) if(upgrade_mc[prior].hitTestPoint(px,py,true)) blocked=true;
            if(blocked) continue;
            oracleCastleMouseX=px; oracleCastleMouseY=py; found=true; break;
         }
         if(!found) throw new Error("Castle tile has no original hittable point: "+index);
         delay=10; oracleCastleStage="town-input"; MouseLDownFunc_town(new MouseEvent(MouseEvent.MOUSE_DOWN));
      }
      private function oracleCastleCase(name:String,gold:int,target:int,house:int=1,hp:int=40,maxHp:int=40,clicks:int=1):void {
         oracleCastleReset(name,gold,house,hp,maxHp); oracleCastleSnapshot("before");
         for(var index:int=0;index<clicks;index++) { oracleCastleClick(target); oracleCastleSnapshot("click",target); }
      }
      private function oracleBattleReady():void {
         if(oraclePhase!=2) return; oraclePhase=3; timer.stop();
         removeEventListener(Event.ENTER_FRAME,onEnterFrame); removeEventListener(Event.ENTER_FRAME,oracleAdvance);
         if(amb!=null) amb.stop();
         gameContinued=true; addEventListener(Event.ENTER_FRAME,oracleCastleTownReady); gotoAndStop("town");
      }
      private function oracleCastleTownReady(event:Event):void {
         if(currentFrame!=71 || equipButton==null || charaButton==null) return;
         removeEventListener(Event.ENTER_FRAME,oracleCastleTownReady); removeEventListener(Event.ENTER_FRAME,onEnterFrame_town);
         stage.removeEventListener(KeyboardEvent.KEY_DOWN,KeyDown_town);
         stage.removeEventListener(MouseEvent.MOUSE_DOWN,MouseLDownFunc_town);
         if(amb!=null) amb.stop();
         try {
            if(player.devType[0]!=6 || inventory.id[weapon(0)]!=3) throw new Error("Original Sheriff initialization failed");
            oracleEmit({type:"ready",kind:"castle-upgrades",rng:"xorshift32",clock:"synchronous-original-town-tile-clicks",frame71:true,continuedTownEntry:true});
            oracleCastleCase("house-insufficient",1999,4);
            oracleCastleCase("house-exact",2000,4);
            oracleCastleCase("house-second",5000,4,2);
            oracleCastleCase("house-cap",10000,4,3);
            oracleCastleCase("house-sequence",7000,4,1,40,40,2);
            oracleCastleCase("wall-insufficient",239,1);
            oracleCastleCase("wall-exact",240,1);
            oracleCastleCase("wall-damaged",240,1,1,30);
            oracleCastleCase("wall-sequence",1250,1,1,40,40,3);
            oracleCastleCase("wall-search-offset",272,1,1,31,41);
            oracleCastleActive=false; gamePaused=true;
            oracleEmit({type:"complete",kind:"castle-upgrades",ok:true,snapshots:oracleCastleSnapshots,scenarios:10});
         } catch(error:Error) {
            oracleCastleActive=false; gamePaused=true;
            oracleEmit({type:"error",kind:"castle-upgrades",message:error.message,scenario:oracleCastleScenario,
               snapshots:oracleCastleSnapshots,diagnosticStage:oracleCastleStage,stack:error.getStackTrace()});
         }
      }
'''


def instrument(source):
    result = source.replace('Math.random()', 'oracleCastleRandom()')
    begin, end = method_span(result, 'MouseLDownFunc_town')
    original_body = result[begin:end]
    changed = original_body.replace('stage.mouseX', 'oracleCastleX()').replace('stage.mouseY', 'oracleCastleY()')
    changed = re.sub(r'\bmouseX\b', 'oracleCastleX()', changed)
    changed = re.sub(r'\bmouseY\b', 'oracleCastleY()', changed)
    result = result[:begin] + changed + result[end:]
    reverted = result[:begin] + original_body + result[begin + len(changed):]
    if reverted.replace('oracleCastleRandom()', 'Math.random()') != source:
        raise ValueError('Original logic changed beyond reversible mouse/random seams')
    result = result.replace('   import flash.events.*;', '   import flash.events.*;\n   import flash.external.ExternalInterface;')
    result = instrument_startup(result)
    closing = result.rfind('\n   }')
    return result[:closing] + '\n' + shared_driver_methods() + CASTLE_AS3 + result[closing:]


def main():
    out = ROOT / '.build/oracle'; out.mkdir(parents=True, exist_ok=True)
    report = {'status': 'failed', 'kind': 'castle-upgrades', 'rng': 'xorshift32',
              'clock': 'synchronous-original-town-tile-clicks', 'continued_town_entry': True,
              'fresh_town_generation_excluded': True, 'input_seams': ['town mouse position'],
              'boundary': 'Original Castle House and Wall tile clicks, payment, cap, HP and upkeep; ten controlled town states'}
    try:
        original_path, source_path = ROOT / 'original/elonashooter1.3.swf', ROOT / 'src/shootem_fla/MainTimeline.as'
        original, source_bytes = original_path.read_bytes(), source_path.read_bytes()
        if digest(original) != ORIGINAL_SHA256: raise ValueError('Preserved SWF fingerprint differs')
        generated = out / 'CastleUpgradesMainTimeline.as'
        generated.write_text(instrument(source_bytes.decode('utf-8-sig')), encoding='utf-8')
        candidate = out / ('castle-upgrades-compiled-' + uuid.uuid4().hex + '.swf')
        result = command([find_java(None), '-Xmx1g', '-jar', str(ROOT / '.tools/ffdec/ffdec.jar'), '-replace',
                          str(original_path), str(candidate), 'shootem_fla.MainTimeline', str(generated)], timeout=240)
        (out / 'castle-upgrades-build.log').write_text(result.stdout, encoding='utf-8')
        if result.returncode or not candidate.is_file(): raise RuntimeError('Castle upgrades compilation failed; inspect castle-upgrades-build.log')
        output = bytearray(candidate.read_bytes()); output[3] = 10
        report.update(verify(original, output))
        reference = out / 'castle-upgrades-reference.swf'; reference.write_bytes(output)
        if original_path.read_bytes() != original or source_path.read_bytes() != source_bytes: raise RuntimeError('Preserved input changed')
        report.update(status='passed', original_sha256=digest(original), source_sha256=digest(source_bytes),
                      output_sha256=digest(output), output=str(reference.relative_to(ROOT)).replace('\\', '/'),
                      output_bytes=len(output), original_method_logic_preserved=True, runtime_validated=False)
    except Exception as error:
        report['error'] = str(error)
    (out / 'castle-upgrades-build-report.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, indent=2))
    return 0 if report['status'] == 'passed' else 1


if __name__ == '__main__':
    raise SystemExit(main())
