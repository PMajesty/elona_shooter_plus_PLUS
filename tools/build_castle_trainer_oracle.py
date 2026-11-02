"""Исходные покупки Trainer, опыт убийств и неизменная награда завершения боя."""
import json
import re
import uuid

from build import ROOT, ORIGINAL_SHA256, command, digest, find_java
from build_oracle import method_span
from build_combat_oracle import verify_resources
from build_party_combat_oracle import instrument as party_instrument, DRIVER as PARTY_DRIVER, CASES as PARTY_CASES
from build_castle_upgrades_oracle import CASTLE_AS3
from build_shoot_oracle import extract_method

CASES=[]
for label, levels, options in [
    ('hero-normal', [0,1], dict(actor=0,dev=6)),
    ('hero-growth', [0,1], dict(actor=0,dev=6,experience=970,critical=True)),
    ('companion-growth', [0,1], dict(actor=1,dev=6,experience=956)),
    ('companion-critical', [0,1], dict(actor=1,dev=6,critical=True)),
    ('noble-gap', [0,10], dict(actor=1,dev=8,level=4,day=7)),
    ('noble-gap-growth', [0,10], dict(actor=1,dev=8,level=4,day=7,experience=960)),
    ('mission-fraction', [0,3], dict(actor=0,dev=6,expFix=1.17)),
    ('settlement-reserves', [0,10], dict(actor=1,dev=8,level=4,day=7,experience=900,weaponExp=True,boundary='settlement')),
]:
    for level in levels:
        CASES.append(dict(name=f'{label}-{level}',boundary='hit',damage=1000,lethal=True,trainer=level,**{k:v for k,v in options.items() if k!='boundary'}))
        if 'boundary' in options: CASES[-1]['boundary']=options['boundary']

COMMON='\n'.join(extract_method(CASTLE_AS3,name) for name in ['oracleCastleX','oracleCastleY','oracleCastleCleanup','oracleCastleReset','oracleCastleClick'])
for old,new in [('oracleCastleActive','oracleCombatActive'),('oracleCastleState','oracleCombatState'),('oracleCastleDraws','oracleCombatDraws')]:COMMON=COMMON.replace(old,new)

EXTRA=r'''
      private var oracleCastleScenario:String="";
      private var oracleCastleStage:String="";
      private var oracleCastleMouseX:Number=0;
      private var oracleCastleMouseY:Number=0;
      private var oracleXPEvents:Array=[];
      public function oracleTrainerXP(actor:int,experience:int,critical:int):void {
         oracleXPEvents.push({actorSlot:actor,adjustedEnemyExp:experience,criticalType:critical,
            multiplier:trainerFix(),awarded:int(experience*trainerFix()),experienceBefore:player.exp[actor],
            weaponExp:player.wexp[actor].concat(),drawCount:oracleCombatDraws,pcType:typeof(this["pc"]),pcValue:String(this["pc"]),declaredHero:_pc});
      }
      private function oracleTrainerPurchaseSnapshot(op:String):void {
         var owned:Array=[];for(var index:int=0;index<game.invSlot;index++)owned.push(oracleItem(20+index));
         oracleEmit({type:"snapshot",kind:"castle-trainer",boundary:"purchase",scenario:oracleCastleScenario,op:op,
            trainerLevel:game.trainer,multiplier:trainerFix(),upkeep:calcUnkeep(),gold:player.money[0],ap:game.ap,totalMoney:game.totalMoney,
            hp:game.castleHP,maxHp:game.castleMHP,inventory:owned,tile:{cost:getUpgradeCost(7),possible:upgrade_mc[7].possible,name:upgrade_mc[7].upgradeName.text,hint:upgradeHint[7].concat()},
            drawCount:oracleCombatDraws,rngState:oracleCombatState});++oracleSnapshots;
      }
      private function oracleTrainerPurchase(name:String,level:int,gold:int,clicks:int=1):void {
         oracleCastleReset(name,gold,1,30,40);game.trainer=level;
         removeUpgrades();updateCastleMenu();oracleCombatState=42;oracleCombatDraws=0;oracleTrainerPurchaseSnapshot("before");
         for(var index:int=0;index<clicks;index++){oracleCastleClick(7);oracleTrainerPurchaseSnapshot("click");}
      }
      private function oracleTrainerError(error:Error):void {
         oracleCombatActive=false;gamePaused=true;oracleEmit({type:"error",kind:"castle-trainer",message:error.message,scenario:oracleCastleScenario,snapshots:oracleSnapshots,stack:error.getStackTrace()});
      }
      private function oracleTrainerTownReady(event:Event):void {
         if(currentFrame!=71 || equipButton==null || charaButton==null)return;
         removeEventListener(Event.ENTER_FRAME,oracleTrainerTownReady);removeEventListener(Event.ENTER_FRAME,onEnterFrame_town);
         stage.removeEventListener(KeyboardEvent.KEY_DOWN,KeyDown_town);stage.removeEventListener(MouseEvent.MOUSE_DOWN,MouseLDownFunc_town);
         if(amb!=null)amb.stop();
         try {
            oracleTrainerPurchase("trainer-insufficient",0,249);oracleTrainerPurchase("trainer-first",0,250);
            oracleTrainerPurchase("trainer-sequence",0,680,2);oracleTrainerPurchase("trainer-float-hint",1,430);oracleTrainerPurchase("trainer-high-level",10,18250);
            oracleCombatActive=false;gamePaused=true;oracleEmit({type:"complete",kind:"castle-trainer",ok:true,snapshots:oracleSnapshots,combatCases:16,purchaseCases:5});
         }catch(error:Error){oracleTrainerError(error);}
      }
'''


def driver():
    value=PARTY_DRIVER.replace('kind:"party-combat"','kind:"castle-trainer"')
    value=value.replace('game.trainer=0;', 'game.trainer=config.trainer;')
    value=value.replace('sister.dead=true;', 'sister.dead=false;sister.x=600;sister.y=350;')
    value=value.replace('generatePlayer(0,1,6);generatePlayer(1,config.level==undefined?1:config.level,config.dev);',
        'generatePlayer(0,1,6);generatePlayer(1,config.level==undefined?1:config.level,config.dev);\n'
        '         generatePlayer(2,1,1);generatePlayer(5,1,8);player.exist[2]=false;player.exist[5]=true;\n'
        '         player.exp[2]=900;player.exp[5]=900;player.wexp[2]=[100,100,100,100,0];player.wexp[5]=[100,100,100,100,0];')
    value=value.replace('player.money[0]=200;player.exp[1]=config.experience==undefined?0:config.experience;',
        'player.money[0]=200;player.exp[config.actor]=config.experience==undefined?0:config.experience;\n'
        '         if(config.boundary=="settlement")player.exp[0]=900;\n'
        '         mission.expFix=config.expFix==undefined?1:config.expFix;')
    value=value.replace('party:oraclePartySkills(),castleHp:', 'reserves:[oracleMember(2),oracleMember(5)],party:oraclePartySkills(),castleHp:')
    value=value.replace('oracleShootPellets=[];', 'oracleShootPellets=[];oracleXPEvents=[];')
    value=value.replace('hit=procHit(1,41,hitX,hitY,config.damage);', 'hit=procHit(config.actor,config.actor==0?20:41,hitX,hitY,config.damage);')
    value=value.replace('hit:hit,geometry:geometry,damageEvents:', 'hit:hit,xpEvents:oracleXPEvents,geometry:geometry,damageEvents:')
    value=value.replace('oracleEmit({type:"ready",kind:"castle-trainer",clock:"synchronous-original-methods",geometry:"original-vector-procHit",seed:42});',
        'oracleEmit({type:"ready",kind:"castle-trainer",clock:"synchronous-original-methods-and-castle-clicks",geometry:"original-vector-procHit",seed:42,combatCases:16,purchaseCases:5});')
    value=value.replace('oracleCombatActive=false;gamePaused=true;\n            oracleEmit({type:"complete",kind:"castle-trainer",ok:true,snapshots:oracleSnapshots});',
        'oracleCombatActive=false;gameContinued=true;addEventListener(Event.ENTER_FRAME,oracleTrainerTownReady);gotoAndStop("town");')
    return value.replace('__CASES__',json.dumps(CASES,separators=(',',':')))+COMMON+EXTRA


def instrument(source,enemy_source):
    main,enemy=party_instrument(source,enemy_source)
    previous=PARTY_DRIVER.replace('__CASES__',json.dumps(PARTY_CASES,separators=(',',':')))
    assert main.count(previous)==1
    main=main.replace(previous,driver())
    begin,end=method_span(main,'MouseLDownFunc_town');body=main[begin:end]
    changed=body.replace('stage.mouseX','oracleCastleX()').replace('stage.mouseY','oracleCastleY()')
    changed=re.sub(r'\bmouseX\b','oracleCastleX()',changed);changed=re.sub(r'\bmouseY\b','oracleCastleY()',changed)
    main=main[:begin]+changed+main[end:]
    observer='            _root.oracleTrainerXP(shooterIndex,exp,critType);\n'
    marker='            if(shooterIndex == _root.pc)'
    assert enemy.count(marker)==1
    prior_enemy=enemy;enemy=enemy.replace(marker,observer+marker)
    assert enemy.replace(observer,'')==prior_enemy
    for name in ['eventAfterBattle','levelUp','gainTrait','wexpUp','trainerFix','getUpgradeCost','calcUnkeep','upgradeDone']:
        assert extract_method(main,name).replace('oracleCombatRandom()','Math.random()')==extract_method(source,name),name
    return main,enemy


def main():
    out=ROOT/'.build/oracle';out.mkdir(parents=True,exist_ok=True)
    original_path=ROOT/'original/elonashooter1.3.swf';source_path=ROOT/'src/shootem_fla/MainTimeline.as'
    original,source=original_path.read_bytes(),source_path.read_bytes()
    report={'status':'failed','kind':'castle-trainer','boundary':'Original tile7 purchases, procHit/enemy.damage kill XP, growth and eventAfterBattle actor rewards; deterministic draws and cached party skills',
            'input_seams':['town mouse position','controlled original procHit coordinates'],'continued_town_entry':True,'fresh_town_generation_excluded':True}
    try:
        assert digest(original)==ORIGINAL_SHA256
        main_text,enemy_text=instrument(source.decode('utf-8-sig'),(ROOT/'.build/export/scripts/enemy.as').read_text(encoding='utf-8-sig'))
        main_file=out/'CastleTrainerMainTimeline.as';enemy_file=out/'CastleTrainerEnemy.as'
        main_file.write_text(main_text,encoding='utf-8');enemy_file.write_text(enemy_text,encoding='utf-8')
        candidate=out/('castle-trainer-compiled-'+uuid.uuid4().hex+'.swf')
        result=command([find_java(None),'-Xmx1g','-jar',str(ROOT/'.tools/ffdec/ffdec.jar'),'-replace',str(original_path),str(candidate),'shootem_fla.MainTimeline',str(main_file),'enemy',str(enemy_file)],timeout=240)
        (out/'castle-trainer-build.log').write_text(result.stdout,encoding='utf-8')
        if result.returncode or not candidate.is_file():raise RuntimeError('Trainer compilation failed; inspect castle-trainer-build.log')
        output=bytearray(candidate.read_bytes());output[3]=10;report.update(verify_resources(original,output))
        reference=out/'castle-trainer-reference.swf';reference.write_bytes(output)
        assert original_path.read_bytes()==original and source_path.read_bytes()==source
        report.update(status='passed',original_sha256=digest(original),source_sha256=digest(source),output_sha256=digest(output),output_bytes=len(output),
                      output=str(reference.relative_to(ROOT)).replace('\\','/'),original_method_logic_preserved=True,combat_cases=CASES,runtime_validated=False)
    except Exception as error:report['error']=str(error)
    (out/'castle-trainer-build-report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({key:value for key,value in report.items() if key!='combat_cases'},indent=2));return 0 if report['status']=='passed' else 1


if __name__=='__main__':raise SystemExit(main())
