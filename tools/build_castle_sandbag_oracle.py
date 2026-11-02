"""Исходные Sandbag: настоящие покупки и damageCastle с общим RNG союзников."""
import json
import re
import uuid

from build import ROOT, ORIGINAL_SHA256, command, digest, find_java
from build_oracle import method_span
from build_combat_oracle import COMBAT_AS3, instrument as instrument_combat, verify_resources
from build_castle_upgrades_oracle import CASTLE_AS3
from build_party_combat_oracle import DRIVER as PARTY_DRIVER
from build_party_progression_oracle import PROGRESSION_AS3
from build_shoot_oracle import extract_method


DAMAGE_CASES = [
    dict(name='unupgraded', level=0, damage=7),
    dict(name='first-level', level=1, damage=7),
    dict(name='first-level-medal', level=1, damage=100, absorb=0.01, hp=140, maxHp=140),
    dict(name='maximum-medal', level=10, damage=100, absorb=0.02, hp=140, maxHp=140),
    dict(name='minimum-one', level=10, damage=1, absorb=0.02),
    dict(name='typed-input', level=1, damage=7.9, absorb=0.02),
    dict(name='maximum-no-medal', level=10, damage=3),
    dict(name='insurance-before-defender', level=10, damage=20, defender=1, insurance=2, prefix=[0]),
    dict(name='guardian-before-defender', level=10, damage=20, guardian=True, defender=1, insurance=2, prefix=[0.99, 0]),
    dict(name='guardian-then-last-hope', level=10, damage=3, guardian=True, defender=1, insurance=2, lastHope=1, prefix=[0.01, 0.99, 0.99, 0]),
    dict(name='last-hope-low', level=10, damage=3, hp=6, lastHope=1, prefix=[0.99, 0.99, 0]),
    dict(name='protection-before-all', level=10, damage=20, guardian=True, defender=1, insurance=2, lastHope=1, protection=1),
]

COMMON_AS3 = '\n'.join(extract_method(CASTLE_AS3, name) for name in [
    'oracleCastleX', 'oracleCastleY', 'oracleCastleCleanup', 'oracleCastleReset', 'oracleCastleClick'])
for old, new in [('oracleCastleActive', 'oracleCombatActive'), ('oracleCastleState', 'oracleCombatState'), ('oracleCastleDraws', 'oracleCombatDraws')]:
    COMMON_AS3 = COMMON_AS3.replace(old, new)
COMMON_AS3 += extract_method(COMBAT_AS3, 'oracleCombatReset')
COMMON_AS3 += extract_method(PROGRESSION_AS3, 'oraclePartyMember') + extract_method(PROGRESSION_AS3, 'oraclePartySkills')
COMMON_AS3 += extract_method(PARTY_DRIVER, 'oracleMember')

DRIVER = r'''
      private var oraclePhase:int=-1;
      private var oracleCombatActive:Boolean=false;
      private var oracleCombatState:uint=42;
      private var oracleCombatDraws:int=0;
      private var oracleCombatEvents:Array=[];
      private var oracleDraws:Array=[];
      private var oracleOrder:Array=[];
      private var oraclePrefix:Array=[];
      private var oraclePrefixIndex:int=0;
      private var oracleSnapshots:int=0;
      private var oracleCastleScenario:String="";
      private var oracleCastleStage:String="";
      private var oracleCastleMouseX:Number=0;
      private var oracleCastleMouseY:Number=0;
      public function oracleCombatRandom():Number {
         if(!oracleCombatActive)return Math.random();
         var value:int=int(oracleCombatState);value^=value<<13;value^=value>>>17;value^=value<<5;
         oracleCombatState=uint(value);++oracleCombatDraws;
         var result:Number=oraclePrefixIndex<oraclePrefix.length ? Number(oraclePrefix[oraclePrefixIndex++]) : Number(oracleCombatState)/4294967296;
         oracleDraws.push({index:oracleCombatDraws,state:oracleCombatState,value:result});
         return result;
      }
      public function oracleCombatDamage(id:int,damage:int,crit:int,before:int,x:int,y:int,actor:int):void {
         if(!oracleCombatActive)return;
         oracleCombatEvents.push({enemyId:id,damage:damage,critType:crit,hpBefore:before,x:x,y:y,actorSlot:actor,drawCount:oracleCombatDraws});
         oracleOrder.push({event:"guardian-hit",actorSlot:actor,drawCount:oracleCombatDraws});
      }
      private function oracleSandbagState(target:*):Object {
         return {actors:[oracleMember(0),oracleMember(1)],party:oraclePartySkills(),enemy:target.oracleState(),
            castleHp:game.castleHP,castleMaxHp:game.castleMHP,gold:player.money[0],totalMoney:game.totalMoney,
            sandbagLevel:game.sandbag,multiplier:castleAbsorb(),absorbFix:mission.absorbFix,protection:protTime};
      }
      private function oracleSandbagDamage(config:Object):void {
         oracleCastleScenario=config.name;oracleCastleStage="damage-setup";
         oracleCombatActive=false;oracleCombatReset(42);
         var index:int;var clip:*;
         for(index=0;index<maxAlly;index++) {
            clip=player_mc[index];if(clip!=null && clip.parent!=null)clip.parent.removeChild(clip);
            clip=cursor_mc[index];if(clip!=null && clip.parent!=null)clip.parent.removeChild(clip);
            player.exist[index]=false;
         }
         for(index=0;index<_maxMedal;index++)medal[index]=false;
         oracleCombatActive=true;oracleCombatState=42;oracleCombatDraws=0;oraclePrefix=[];oraclePrefixIndex=0;
         generatePlayer(0,1,6);generatePlayer(1,1,9);player.exist[1]=config.guardian==true;
         player.trait[0][TRAIT.DEFENDER]=config.defender==undefined?0:config.defender;
         player.trait[0][TRAIT.INSURANCE]=config.insurance==undefined?0:config.insurance;
         player.trait[0][TRAIT.LAST_HOPE]=config.lastHope==undefined?0:config.lastHope;
         hero=0;ci=20;fireAtWill=false;immune=false;shakeCount=0;castleCounter=0;bgChange=0;frenzyMode=0;
         protTime=config.protection==undefined?0:config.protection;
         game.castleHP=config.hp==undefined?40:config.hp;game.castleMHP=config.maxHp==undefined?40:config.maxHp;
         game.sandbag=config.level;game.totalMoney=500;player.money[0]=100;
         game.optionShowDamage=false;game.optionShowAllyDamage=false;game.optionFlashShot=false;sister.dead=true;
         mission.absorbFix=config.absorb==undefined?0:config.absorb;
         initPartySkill();updateAlly();clearTarget();
         var target:* = enemyArray[spawnEnemy(3)];target.x=200;target.y=220;target.mc.gotoAndStop(5);target.hp=1000;
         var before:Object=oracleSandbagState(target);
         oracleCombatState=3735928559;oracleCombatDraws=0;oracleCombatEvents=[];oracleDraws=[];oracleOrder=[];
         oraclePrefix=config.prefix==undefined?[]:config.prefix;oraclePrefixIndex=0;
         oracleCastleStage="damageCastle";damageCastle(config.guardian==true?target:undefined,config.damage);
         oracleCombatActive=false;
         oracleEmit({type:"snapshot",kind:"castle-sandbag",boundary:"damage",scenario:config.name,config:config,
            before:before,after:oracleSandbagState(target),damageEvents:oracleCombatEvents,order:oracleOrder,
            draws:oracleDraws,drawCount:oracleCombatDraws,rngState:oracleCombatState});++oracleSnapshots;
      }
      private function oracleSandbagTile():Object {
         return {cost:getUpgradeCost(2),possible:upgrade_mc[2].possible,name:upgrade_mc[2].upgradeName.text,
            priceText:upgrade_mc[2].upgradeCost.text,mouseEnabled:upgrade_mc[2].upgradeButton.mouseEnabled,hint:upgradeHint[2].concat()};
      }
      private function oracleSandbagTownSnapshot(op:String):void {
         oracleEmit({type:"snapshot",kind:"castle-sandbag",boundary:"town",scenario:oracleCastleScenario,op:op,
            sandbagLevel:game.sandbag,hp:game.castleHP,maxHp:game.castleMHP,gold:player.money[0],ap:game.ap,totalMoney:game.totalMoney,
            upkeep:calcUnkeep(),upkeepText:window2_mc.unkeep.text,tile:oracleSandbagTile(),multiplier:castleAbsorb(),
            dialog:gameDialog,eventDialog:stage.getChildByName("eventWindow")!=null,
            drawCount:oracleCombatDraws,rngState:oracleCombatState});++oracleSnapshots;
      }
      private function oracleSandbagTownCase(name:String,gold:int,level:int=0,clicks:int=1):void {
         oracleCastleReset(name,gold,1,30,40);game.sandbag=level;
         removeUpgrades();updateCastleMenu();oracleSandbagTownSnapshot("before");
         for(var index:int=0;index<clicks;index++){oracleCastleClick(2);oracleSandbagTownSnapshot("click");}
      }
      private function oracleBattleReady():void {
         if(oraclePhase!=2)return;oraclePhase=3;timer.stop();removeEventListener(Event.ENTER_FRAME,onEnterFrame);removeEventListener(Event.ENTER_FRAME,oracleAdvance);
         if(amb!=null)amb.stop();
         try {
            oracleEmit({type:"ready",kind:"castle-sandbag",clock:"synchronous-original-damage-and-town-input",rng:"xorshift32-with-declared-prefix",seed:3735928559,
               continuedTownEntry:true,guardianTarget:"original-nonlethal-sheep",damageCases:12});
            for each(var config:Object in __CASES__)oracleSandbagDamage(config);
            oracleCombatActive=false;gamePaused=false;gameContinued=true;
            addEventListener(Event.ENTER_FRAME,oracleSandbagTownReady);gotoAndStop("town");
         }catch(error:Error){oracleSandbagError(error);}
      }
      private function oracleSandbagError(error:Error):void {
         oracleCombatActive=false;gamePaused=true;
         oracleEmit({type:"error",kind:"castle-sandbag",message:error.message,scenario:oracleCastleScenario,snapshots:oracleSnapshots,diagnosticStage:oracleCastleStage,stack:error.getStackTrace()});
      }
      private function oracleSandbagTownReady(event:Event):void {
         if(currentFrame!=71 || equipButton==null || charaButton==null)return;
         removeEventListener(Event.ENTER_FRAME,oracleSandbagTownReady);removeEventListener(Event.ENTER_FRAME,onEnterFrame_town);
         stage.removeEventListener(KeyboardEvent.KEY_DOWN,KeyDown_town);stage.removeEventListener(MouseEvent.MOUSE_DOWN,MouseLDownFunc_town);
         if(amb!=null)amb.stop();
         try {
            oracleSandbagTownCase("sandbag-insufficient",999);
            oracleSandbagTownCase("sandbag-first",1000);
            oracleSandbagTownCase("sandbag-second",1240,1);
            oracleSandbagTownCase("sandbag-sequence",2240,0,2);
            oracleSandbagTownCase("sandbag-final",20440,9);
            oracleSandbagTownCase("sandbag-cap",100000,10);
            oracleCombatActive=false;gamePaused=true;
            oracleEmit({type:"complete",kind:"castle-sandbag",ok:true,snapshots:oracleSnapshots,damageCases:12,townCases:6});
         }catch(error:Error){oracleSandbagError(error);}
      }
'''


def instrument(main_source, enemy_source):
    main, enemy, main_calls, enemy_calls = instrument_combat(main_source, enemy_source)
    main = main.replace(COMBAT_AS3, COMMON_AS3 + DRIVER.replace('__CASES__', json.dumps(DAMAGE_CASES, separators=(',', ':'))))
    begin, end = method_span(main, 'MouseLDownFunc_town')
    before = main[begin:end]
    after = before.replace('stage.mouseX', 'oracleCastleX()').replace('stage.mouseY', 'oracleCastleY()')
    after = re.sub(r'\bmouseX\b', 'oracleCastleX()', after); after = re.sub(r'\bmouseY\b', 'oracleCastleY()', after)
    main = main[:begin] + after + main[end:]
    old = '_root.oracleCombatDamage(id,rawDamage,critType,hp,hitX,hitY);'
    assert enemy.count(old) == 1
    enemy = enemy.replace(old, '_root.oracleCombatDamage(id,rawDamage,critType,hp,hitX,hitY,shooterIndex);')
    observers = [
        ('            player.money[_pc] += PARTY.INSURANCE;', '            if(oracleCombatActive)oracleOrder.push({event:"insurance",drawCount:oracleCombatDraws});\n'),
        ('            sound_defend.play(0,0,soundPos(640));', '            if(oracleCombatActive)oracleOrder.push({event:"defend",drawCount:oracleCombatDraws});\n'),
        ('         game.castleHP -= param2;', '         if(oracleCombatActive)oracleOrder.push({event:"castle-hit",amount:param2,drawCount:oracleCombatDraws});\n'),
    ]
    original = extract_method(main, 'damageCastle'); changed = original
    for marker, observation in observers:
        assert marker in changed, marker
        changed = changed.replace(marker, observation + marker)
    main = main.replace(original, changed)
    restored = extract_method(main, 'damageCastle')
    for _, observation in observers: restored = restored.replace(observation, '')
    assert restored.replace('oracleCombatRandom()', 'Math.random()') == extract_method(main_source, 'damageCastle')
    for name in ['castleAbsorb', 'getUpgradeCost', 'upgradeDone', 'calcUnkeep', 'rampageOn']:
        assert extract_method(main, name).replace('oracleCombatRandom()', 'Math.random()') == extract_method(main_source, name), name
    return main, enemy, main_calls, enemy_calls


def main():
    out = ROOT / '.build/oracle'; out.mkdir(parents=True, exist_ok=True)
    original_path = ROOT / 'original/elonashooter1.3.swf'; source_path = ROOT / 'src/shootem_fla/MainTimeline.as'
    original, source = original_path.read_bytes(), source_path.read_bytes()
    report = {'status': 'failed', 'kind': 'castle-sandbag', 'boundary': 'Original Castle tile2 purchases and damageCastle with nonlethal Guardian retaliation, Insurance/Defender/LastHope and source integer absorption',
              'input_seams': ['town mouse position'], 'continued_town_entry': True, 'fresh_town_generation_excluded': True}
    try:
        if digest(original) != ORIGINAL_SHA256: raise ValueError('Preserved SWF fingerprint differs')
        java, ffdec = find_java(None), str(ROOT / '.tools/ffdec/ffdec.jar')
        exported = out / 'castle-sandbag-export'
        exported_result = command([java, '-Xmx1g', '-jar', ffdec, '-selectclass', 'enemy', '-export', 'script', str(exported), str(original_path)])
        enemy_path = exported / 'scripts/enemy.as'
        if exported_result.returncode or not enemy_path.is_file(): raise RuntimeError('Original enemy export failed')
        enemy_source = enemy_path.read_bytes()
        main_text, enemy_text, main_calls, enemy_calls = instrument(source.decode('utf-8-sig'), enemy_source.decode('utf-8-sig'))
        generated_main, generated_enemy = out / 'CastleSandbagMainTimeline.as', out / 'CastleSandbagEnemy.as'
        generated_main.write_text(main_text, encoding='utf-8'); generated_enemy.write_text(enemy_text, encoding='utf-8')
        candidate = out / ('castle-sandbag-compiled-' + uuid.uuid4().hex + '.swf')
        result = command([java, '-Xmx1g', '-jar', ffdec, '-replace', str(original_path), str(candidate),
                          'shootem_fla.MainTimeline', str(generated_main), 'enemy', str(generated_enemy)], timeout=240)
        (out / 'castle-sandbag-build.log').write_text(result.stdout, encoding='utf-8')
        if result.returncode or not candidate.is_file(): raise RuntimeError('Sandbag compilation failed; inspect castle-sandbag-build.log')
        output = bytearray(candidate.read_bytes()); output[3] = 10; report.update(verify_resources(original, output))
        reference = out / 'castle-sandbag-reference.swf'; reference.write_bytes(output)
        if original_path.read_bytes() != original or source_path.read_bytes() != source: raise RuntimeError('Preserved source changed')
        report.update(status='passed', original_sha256=digest(original), source_sha256=digest(source), enemy_source_sha256=digest(enemy_source),
                      output_sha256=digest(output), output_bytes=len(output), output=str(reference.relative_to(ROOT)).replace('\\', '/'),
                      intercepted_random_calls={'MainTimeline': main_calls, 'enemy': enemy_calls}, original_method_logic_preserved=True, runtime_validated=False)
    except Exception as error: report['error'] = str(error)
    (out / 'castle-sandbag-build-report.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, indent=2)); return 0 if report['status'] == 'passed' else 1


if __name__ == '__main__':
    raise SystemExit(main())
