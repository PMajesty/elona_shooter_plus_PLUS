"""Исходные покупки Looter и генерация добычи с точными бюджетами и RNG."""
import json
import re
import uuid

from build import ROOT, ORIGINAL_SHA256, command, digest, find_java, verify
from build_oracle import instrument_startup, method_span
from build_wave_oracle import shared_driver_methods
from build_castle_upgrades_oracle import CASTLE_AS3
from build_shoot_oracle import extract_method

COMMON='\n'.join(extract_method(CASTLE_AS3,name) for name in ['oracleCastleX','oracleCastleY','oracleCastleCleanup','oracleCastleReset','oracleCastleClick'])
DRIVER=r'''
      private var oraclePhase:int=-1;
      private var oracleCastleActive:Boolean=false;
      private var oracleCastleState:uint=42;
      private var oracleCastleDraws:int=0;
      private var oracleCastleScenario:String="";
      private var oracleCastleStage:String="";
      private var oracleCastleMouseX:Number=0;
      private var oracleCastleMouseY:Number=0;
      private var oracleLooterSnapshots:int=0;
      private var oracleLooterTrace:Array=[];
      private var oracleLooterCalls:Array=[];
      private var oracleLooterFields:Array=["num","id","graphic","type","reloadTime","reloadTimeMax","ammo","ammoMax","value","mod","modMax","shell","manualReload","automatic","modText","lv","typeMinor","special","leech","impact","shootRate","rare","autoReload","livingWeapon","name","baseAccuracy","accuracyDec","attack","dmgAir","dmgArmor","reqTrait","reqLv","range"];
      private var oracleLooterCases:Array=[
         {name:"ordinary-floor-0",mode:"ordinary",day:1,level:0,seed:42,queue:[6,28,30,33]},
         {name:"ordinary-floor-1",mode:"ordinary",day:1,level:1,seed:42,queue:[6,28,30,33]},
         {name:"ordinary-budget-0",mode:"ordinary",day:7,level:0,seed:3,queue:[6,28,30,33]},
         {name:"ordinary-budget-1",mode:"ordinary",day:7,level:1,seed:3,queue:[6,28,30,33]},
         {name:"ordinary-budget-3",mode:"ordinary",day:7,level:3,seed:3,queue:[6,28,30,33]},
         {name:"guaranteed-0",mode:"ordinary",day:7,level:0,seed:3735928559,queue:[1117,1106,1037]},
         {name:"guaranteed-12",mode:"ordinary",day:7,level:12,seed:3735928559,queue:[1117,1106,1037]},
         {name:"boss-budget-0",mode:"boss",day:2,level:0,seed:3735928559,killed:2},
         {name:"boss-budget-1",mode:"boss",day:2,level:1,seed:3735928559,killed:2},
         {name:"boss-budget-3",mode:"boss",day:2,level:3,seed:3735928559,killed:2},
         {name:"boss-alternate-3",mode:"boss",day:2,level:3,seed:42,killed:2},
         {name:"boss-mod-0",mode:"boss",day:7,level:0,seed:1000000,killed:1},
         {name:"boss-mod-3",mode:"boss",day:7,level:3,seed:1000000,killed:1},
         {name:"shop-control-0",mode:"shop",day:7,level:0,seed:42},
         {name:"shop-control-12",mode:"shop",day:7,level:12,seed:42}
      ];
      private function oracleCastleRandom():Number {
         if(!oracleCastleActive)return Math.random();
         var value:int=int(oracleCastleState);value^=value<<13;value^=value>>>17;value^=value<<5;oracleCastleState=uint(value);
         var result:Number=Number(oracleCastleState)/4294967296.0;++oracleCastleDraws;
         oracleLooterTrace.push({index:oracleCastleDraws,state:oracleCastleState,value:result});return result;
      }
      private function oracleLooterItem(index:int):Object {
         var result:Object={};for each(var field:String in oracleLooterFields)result[field]=inventory[field][index];return result;
      }
      private function oracleLooterClear():void {
         for each(var field:String in oracleLooterFields)for(var index:int=0;index<_maxInv;index++)inventory[field][index]=undefined;
         for(index=0;index<_maxInv;index++){inventory.num[index]=0;inventory.value[index]=0;}
      }
      private function oracleLooterReseed(seed:uint):void {
         oracleCastleState=seed;oracleCastleDraws=0;oracleLooterTrace=[];oracleLooterCalls=[];
      }
      private function oracleLooterGeneration(config:Object):void {
         oracleCastleScenario=config.name;oracleCastleActive=true;oracleLooterClear();
         game.day=config.day;game.looter=config.level;game.optWeaponLevel=false;game.optionBossDropMod=false;game.specialSale=0;game.smith=0;
         PARTY.ENGINEER=0;medal[_medalAction4]=false;
         oracleLooterReseed(777);
         var ids:Array=[3,11,117,24,13,1,6,8];var previous:Array=[];var index:int;
         for(index=0;index<8;index++){generateStuff(index,ids[index]);if(index%2==1)inventory.num[index]=0;previous.push(oracleLooterItem(index));}
         oracleLooterReseed(uint(config.seed));
         mission.loot=config.queue!=undefined?config.queue.concat():[];mission.bossKilled=config.killed!=undefined?config.killed:0;
         if(config.mode=="ordinary")generateLoot();else if(config.mode=="boss")generateLootBoss();else generateShop();
         var offers:Array=[];var sell:Array=[];var buy:Array=[];
         for(index=0;index<8;index++){offers.push(oracleLooterItem(index));sell.push(stuffGetValue(index,0));buy.push(stuffGetValue(index,1));}
         oracleEmit({type:"snapshot",kind:"castle-looter",boundary:"generation",scenario:config.name,config:config,
            multiplier:looterFix(),previous:previous,offers:offers,queue:mission.loot.concat(),sellValues:sell,buyValues:buy,
            calls:oracleLooterCalls.concat(),draws:oracleLooterTrace.concat(),drawCount:oracleCastleDraws,rngState:oracleCastleState});++oracleLooterSnapshots;
      }
      private function oracleLooterPurchaseSnapshot(op:String):void {
         var owned:Array=[];for(var index:int=0;index<game.invSlot;index++)owned.push(oracleLooterItem(20+index));
         oracleEmit({type:"snapshot",kind:"castle-looter",boundary:"purchase",scenario:oracleCastleScenario,op:op,
            looterLevel:game.looter,multiplier:looterFix(),upkeep:calcUnkeep(),gold:player.money[0],ap:game.ap,totalMoney:game.totalMoney,
            hp:game.castleHP,maxHp:game.castleMHP,inventory:owned,tile:{cost:getUpgradeCost(5),possible:upgrade_mc[5].possible,name:upgrade_mc[5].upgradeName.text,hint:upgradeHint[5].concat()},
            drawCount:oracleCastleDraws,rngState:oracleCastleState});++oracleLooterSnapshots;
      }
      private function oracleLooterPurchase(name:String,level:int,gold:int,clicks:int=1):void {
         oracleCastleReset(name,gold,1,30,40);oracleLooterClear();game.looter=level;
         oracleLooterReseed(777);generateStuff(20,3);generateStuff(21,11);
         removeUpgrades();updateCastleMenu();oracleLooterReseed(42);oracleLooterPurchaseSnapshot("before");
         for(var index:int=0;index<clicks;index++){oracleCastleClick(5);oracleLooterPurchaseSnapshot("click");}
      }
      private function oracleBattleReady():void {
         if(oraclePhase!=2)return;oraclePhase=3;timer.stop();removeEventListener(Event.ENTER_FRAME,onEnterFrame);removeEventListener(Event.ENTER_FRAME,oracleAdvance);
         if(amb!=null)amb.stop();
         try {
            oracleEmit({type:"ready",kind:"castle-looter",clock:"synchronous-original-rewards-and-castle-clicks",rng:"xorshift32",generationCases:15,purchaseCases:5});
            for each(var config:Object in oracleLooterCases)oracleLooterGeneration(config);
            oracleCastleActive=false;gameContinued=true;addEventListener(Event.ENTER_FRAME,oracleLooterTownReady);gotoAndStop("town");
         }catch(error:Error){oracleLooterError(error);}
      }
      private function oracleLooterError(error:Error):void {
         oracleCastleActive=false;gamePaused=true;oracleEmit({type:"error",kind:"castle-looter",message:error.message,scenario:oracleCastleScenario,snapshots:oracleLooterSnapshots,stack:error.getStackTrace()});
      }
      private function oracleLooterTownReady(event:Event):void {
         if(currentFrame!=71 || equipButton==null || charaButton==null)return;
         removeEventListener(Event.ENTER_FRAME,oracleLooterTownReady);removeEventListener(Event.ENTER_FRAME,onEnterFrame_town);
         stage.removeEventListener(KeyboardEvent.KEY_DOWN,KeyDown_town);stage.removeEventListener(MouseEvent.MOUSE_DOWN,MouseLDownFunc_town);
         if(amb!=null)amb.stop();
         try {
            oracleLooterPurchase("looter-insufficient",0,299);oracleLooterPurchase("looter-first",0,300);
            oracleLooterPurchase("looter-sequence",0,725,2);oracleLooterPurchase("looter-float-hint",11,15425);oracleLooterPurchase("looter-above-twelve",12,18300);
            oracleCastleActive=false;gamePaused=true;oracleEmit({type:"complete",kind:"castle-looter",ok:true,snapshots:oracleLooterSnapshots,generationCases:15,purchaseCases:5});
         }catch(error:Error){oracleLooterError(error);}
      }
'''


def instrument(source):
    result=source.replace('Math.random()','oracleCastleRandom()')
    observer='\n         if(oracleCastleActive) oracleLooterCalls.push({slot:itemIndex,targetValue:targetValue,mode:generationMode,drawCount:oracleCastleDraws,rngState:oracleCastleState});'
    begin,_=method_span(result,'randomStuff');result=result[:begin]+observer+result[begin:]
    begin,end=method_span(result,'MouseLDownFunc_town');body=result[begin:end]
    changed=body.replace('stage.mouseX','oracleCastleX()').replace('stage.mouseY','oracleCastleY()')
    changed=re.sub(r'\bmouseX\b','oracleCastleX()',changed);changed=re.sub(r'\bmouseY\b','oracleCastleY()',changed)
    result=result[:begin]+changed+result[end:]
    reverted=result[:begin]+body+result[begin+len(changed):]
    assert reverted.replace(observer,'').replace('oracleCastleRandom()','Math.random()')==source,'Original method logic changed'
    result=result.replace('   import flash.events.*;','   import flash.events.*;\n   import flash.external.ExternalInterface;')
    result=instrument_startup(result);closing=result.rfind('\n   }')
    return result[:closing]+'\n'+shared_driver_methods()+COMMON+DRIVER+result[closing:]


def main():
    out=ROOT/'.build/oracle';out.mkdir(parents=True,exist_ok=True)
    original_path=ROOT/'original/elonashooter1.3.swf';source_path=ROOT/'src/shootem_fla/MainTimeline.as'
    original,source=original_path.read_bytes(),source_path.read_bytes()
    report={'status':'failed','kind':'castle-looter','boundary':'Original Looter Castle purchases and live ordinary/boss reward budgets, shop controls, exact item records and random draw traces',
            'input_seams':['town mouse position'],'continued_town_entry':True,'fresh_town_generation_excluded':True}
    try:
        if digest(original)!=ORIGINAL_SHA256:raise ValueError('Preserved SWF fingerprint differs')
        generated=out/'CastleLooterMainTimeline.as';generated.write_text(instrument(source.decode('utf-8-sig')),encoding='utf-8')
        candidate=out/('castle-looter-compiled-'+uuid.uuid4().hex+'.swf')
        result=command([find_java(None),'-Xmx1g','-jar',str(ROOT/'.tools/ffdec/ffdec.jar'),'-replace',str(original_path),str(candidate),'shootem_fla.MainTimeline',str(generated)],timeout=240)
        (out/'castle-looter-build.log').write_text(result.stdout,encoding='utf-8')
        if result.returncode or not candidate.is_file():raise RuntimeError('Looter compilation failed; inspect castle-looter-build.log')
        output=bytearray(candidate.read_bytes());output[3]=10;report.update(verify(original,output))
        reference=out/'castle-looter-reference.swf';reference.write_bytes(output)
        if original_path.read_bytes()!=original or source_path.read_bytes()!=source:raise RuntimeError('Preserved input changed')
        report.update(status='passed',original_sha256=digest(original),source_sha256=digest(source),output_sha256=digest(output),output_bytes=len(output),
                      output=str(reference.relative_to(ROOT)).replace('\\','/'),original_method_logic_preserved=True,runtime_validated=False)
    except Exception as error:report['error']=str(error)
    (out/'castle-looter-build-report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(report,indent=2));return 0 if report['status']=='passed' else 1


if __name__=='__main__':raise SystemExit(main())
