"""Независимый эталон попаданий, наград и защитной реакции союзников."""
import json
import uuid

from build import ROOT, ORIGINAL_SHA256, command, digest, find_java
from build_combat_oracle import COMBAT_AS3, instrument as combat_instrument, verify_resources
from build_shoot_oracle import extract_method, SHOOT_AS3
from build_party_progression_oracle import PROGRESSION_AS3

CASES = [
    *[dict(name=f'contact_class_{dev}', dev=dev, boundary='hit', damage=10) for dev in range(1, 10)],
    *[dict(name=f'kill_growth_class_{dev}', dev=dev, boundary='hit', damage=1000, lethal=True, critical=True, day=4, experience=990) for dev in range(1, 10)],
    *[dict(name=f'settlement_class_{dev}', dev=dev, boundary='settlement', level=4, experience=900, weaponExp=True, day=7) for dev in range(1, 10)],
    dict(name='ranger_team_threshold', dev=5, boundary='hit', damage=1000, lethal=True, frenzy=999),
    dict(name='living_weapon_kill', dev=6, boundary='hit', damage=1000, lethal=True, living=True),
    dict(name='guardian_credits_hero', dev=9, boundary='castle', lethal=True, prefix=[0.01]),
    dict(name='guardian_credits_companion', dev=9, boundary='castle', lethal=True, prefix=[0.99]),
    dict(name='noble_level_gap', dev=8, boundary='hit', level=4, damage=1000, lethal=True, critical=True, day=7, experience=990),
    dict(name='companion_weapon_threshold_equal', dev=6, boundary='settlement', shotgunExp=22),
    dict(name='companion_weapon_threshold_above', dev=6, boundary='settlement', shotgunExp=23),
    dict(name='actual_shoot_sniper_idle', dev=2, boundary='shoot', idle=10),
    dict(name='actual_shoot_duelist_frenzy', dev=7, boundary='shoot', frenzy=30),
    dict(name='actual_shoot_noble', dev=8, boundary='shoot', weaponId=4),
]

DRIVER = r'''
      private var oraclePhase:int=-1;
      private var oracleCombatActive:Boolean=false;
      private var oracleCombatState:uint=42;
      private var oracleCombatDraws:int=0;
      private var oracleCombatEvents:Array=[];
      private var oracleDraws:Array=[];
      private var oraclePrefix:Array=[];
      private var oraclePrefixIndex:int=0;
      private var oracleSnapshots:int=0;
      private var oracleShootPellets:Array=[];
      public function oracleCombatRandom() : Number {
         if(!oracleCombatActive) return Math.random();
         var value:int=int(oracleCombatState);value^=value<<13;value^=value>>>17;value^=value<<5;
         oracleCombatState=uint(value);++oracleCombatDraws;
         var result:Number=oraclePrefixIndex<oraclePrefix.length ? Number(oraclePrefix[oraclePrefixIndex++]) : Number(oracleCombatState)/4294967296;
         oracleDraws.push({index:oracleCombatDraws,state:oracleCombatState,value:result});
         return result;
      }
      public function oracleCombatDamage(id:int,damage:int,crit:int,before:int,x:int,y:int,actor:int) : void {
         if(oracleCombatActive) oracleCombatEvents.push({enemyId:id,damage:damage,critType:crit,hpBefore:before,x:x,y:y,actorSlot:actor,drawCount:oracleCombatDraws});
      }
      private function oracleMember(index:int) : Object {
         var member:Object=oraclePartyMember(index);
         member.slot=index;member.exists=player.exist[index];member.weaponExp=player.wexp[index].concat();
         member.shootTimer=player.shootTimer[index];member.accuracyFix=player.accuracyFix[index];
         member.idleCount=player.idleCount[index];member.burst=player.burst[index];member.frenzy=player.frenzy[index];
         member.rampageTicks=player.rampage[index];member.kills=player.kill[index];member.earnedGold=player.earn[index];
         member.money=player.money[index];member.chain=player.chain[index];member.wexpRef=player.wexpRef[index];
         return member;
      }
      private function oracleItem(slot:int) : Object {
         var item:Object={};var field:String;
         for each(field in ["num","id","graphic","type","reloadTime","reloadTimeMax","ammo","ammoMax","value","mod","modMax","shell","manualReload","automatic","modText","lv","typeMinor","special","leech","impact","shootRate","rare","autoReload","livingWeapon","name","baseAccuracy","accuracyDec","attack","dmgAir","dmgArmor","reqTrait","reqLv","range"])
            item[field]=inventory[field][slot];
         return item;
      }
      private function oracleState(target:*) : Object {
         return {actors:[oracleMember(0),oracleMember(1)],items:[oracleItem(20),oracleItem(41)],enemy:target.oracleState(),
            party:oraclePartySkills(),castleHp:game.castleHP,castleMaxHp:game.castleMHP,totalKill:game.totalKill,totalMoney:game.totalMoney,
            loot:mission.loot.concat(),criticalKills:mission.criticalCount,bossKilled:mission.bossKilled,eventList:eventList.concat()};
      }
      private function oracleCase(config:Object) : void {
         oracleCombatActive=false;oracleCombatReset(42);
         var index:int;var clip:*;
         for(index=0;index<maxAlly;index++) {
            clip=player_mc[index];if(clip!=null && clip.parent!=null)clip.parent.removeChild(clip);
            clip=cursor_mc[index];if(clip!=null && clip.parent!=null)clip.parent.removeChild(clip);
            player.exist[index]=false;
         }
         for(index=0;index<_maxMedal;index++)medal[index]=false;
         game.day=config.day==undefined?1:config.day;game.trainer=0;game.engineer=0;game.sandbag=0;
         game.casual=false;game.comp=false;game.MORE=false;game.optWeaponLevel=false;
         game.optionShowDamage=false;game.optionShowAllyDamage=false;game.optionFlashShot=false;
         oracleCombatActive=true;oracleCombatState=42;oracleCombatDraws=0;oraclePrefix=[];oraclePrefixIndex=0;
         generatePlayer(0,1,6);generatePlayer(1,config.level==undefined?1:config.level,config.dev);
         if(config.weaponId!=undefined)generateStuff(41,config.weaponId);
         hero=0;ci=20;fireAtWill=false;immune=false;protTime=0;shakeCount=0;castleCounter=0;bgChange=0;frenzyMode=0;
         game.castleHP=30;game.castleMHP=40;game.totalMoney=0;game.totalKill=0;
         sister.dead=true;mission.absorbFix=0;mission.bossKilled=0;eventList=[];news="";
         player.money[0]=200;player.exp[1]=config.experience==undefined?0:config.experience;
         if(config.weaponExp)player.wexp[1]=[100,100,100,100,0];
         if(config.shotgunExp!=undefined)player.wexp[1]=[0,0,0,config.shotgunExp,0];
         if(config.living){inventory.modMax[41]=2;enchant(41,11,1);inventory.livingWeapon[41]=1;}
         initPartySkill();updateAlly();clearTarget();
         if(config.frenzy!=undefined)player.frenzy[1]=config.frenzy;
         if(config.idle!=undefined)player.idleCount[1]=config.idle;
         if(config.boundary=="shoot"){inventory.baseAccuracy[41]=65000;refreshPlayer(1,41);}
         var enemySlot:int=spawnEnemy(3);var target:* = enemyArray[enemySlot];
         target.x=200;target.y=220;target.mc.gotoAndStop(5);target.hp=config.lethal?2:1000;
         player.target[1]=target;
         var hitX:int=config.critical?210:200;var hitY:int=224;
         var before:Object=oracleState(target);
         var geometry:Object={x:hitX,y:hitY,body:target.mc.hitTestPoint(hitX,hitY,true),
            shadow:target.mc.shadowHit==false && target.mc.shadow.hitTestPoint(hitX,hitY,true)};
         if(config.boundary=="hit" && (!geometry.body || geometry.shadow))throw new Error("Party hit scenario missed original contour: "+config.name);
         oracleCombatState=42;oracleCombatDraws=0;oracleCombatEvents=[];oracleDraws=[];
         oracleShootPellets=[];
         oraclePrefix=config.prefix==undefined?[]:config.prefix;oraclePrefixIndex=0;
         var hit:Boolean=false;
         if(config.boundary=="hit")hit=procHit(1,41,hitX,hitY,config.damage);
         else if(config.boundary=="castle")damageCastle(target,3);
         else if(config.boundary=="shoot"){shoot(1);hit=oracleCombatEvents.length>0;if(!hit)throw new Error("Original companion shoot missed: "+config.name);}
         else eventAfterBattle();
         oracleCombatActive=false;
         var record:Object={type:"snapshot",kind:"party-combat",scenario:config.name,config:config,before:before,after:oracleState(target),
            hit:hit,geometry:geometry,damageEvents:oracleCombatEvents,draws:oracleDraws,drawCount:oracleCombatDraws,rngState:oracleCombatState};
         if(config.boundary=="shoot")record.pellets=oracleShootPellets;
         oracleEmit(record);
         ++oracleSnapshots;
      }
      private function oracleBattleReady() : void {
         if(oraclePhase!=2)return;oraclePhase=3;timer.stop();removeEventListener(Event.ENTER_FRAME,onEnterFrame);removeEventListener(Event.ENTER_FRAME,oracleAdvance);
         if(amb!=null)amb.stop();
         try {
            oracleEmit({type:"ready",kind:"party-combat",clock:"synchronous-original-methods",geometry:"original-vector-procHit",seed:42});
            for each(var config:Object in __CASES__)oracleCase(config);
            oracleCombatActive=false;gamePaused=true;
            oracleEmit({type:"complete",kind:"party-combat",ok:true,snapshots:oracleSnapshots});
         }catch(error:Error){oracleCombatActive=false;gamePaused=true;oracleEmit({type:"error",kind:"party-combat",message:error.message});}
      }
'''


def instrument(main_source, enemy_source):
    main, enemy, _, _ = combat_instrument(main_source, enemy_source)
    helpers = extract_method(PROGRESSION_AS3, 'oraclePartyMember') + extract_method(PROGRESSION_AS3, 'oraclePartySkills') + extract_method(SHOOT_AS3, 'oracleObservePellet')
    main = main.replace(COMBAT_AS3, extract_method(COMBAT_AS3, 'oracleCombatReset') + helpers + DRIVER.replace('__CASES__', json.dumps(CASES, separators=(',', ':'))))
    old = '_root.oracleCombatDamage(id,rawDamage,critType,hp,hitX,hitY);'
    assert enemy.count(old) == 1
    enemy = enemy.replace(old, '_root.oracleCombatDamage(id,rawDamage,critType,hp,hitX,hitY,shooterIndex);')
    marker = '            if(sister.hitTestPoint(hitX,hitY,true) && sister.dead == false)'
    observer = '            oracleObservePellet(projectileIndex,hitX,hitY,baseDamage);\n'
    assert main.count(marker) == 1
    main = main.replace(marker, observer + marker)
    assert extract_method(main, 'shoot').replace(observer, '').replace('oracleCombatRandom()', 'Math.random()') == extract_method(main_source, 'shoot')
    for name in ['procHit','damageCastle','eventAfterBattle','rampageRanger','rampage','rampageOn','levelUp','gainTrait','wexpUp']:
        assert extract_method(main, name).replace('oracleCombatRandom()', 'Math.random()') == extract_method(main_source, name), name
    return main, enemy


def main():
    out=ROOT/'.build/oracle';out.mkdir(parents=True,exist_ok=True)
    original_path=ROOT/'original/elonashooter1.3.swf';source_path=ROOT/'src/shootem_fla/MainTimeline.as'
    original=original_path.read_bytes();source=source_path.read_bytes();report={'status':'failed','kind':'party-combat'}
    try:
        assert digest(original)==ORIGINAL_SHA256
        main_text,enemy_text=instrument(source.decode('utf-8-sig'),(ROOT/'.build/export/scripts/enemy.as').read_text(encoding='utf-8-sig'))
        main_file=out/'PartyCombatMainTimeline.as';enemy_file=out/'PartyCombatEnemy.as'
        main_file.write_text(main_text,encoding='utf-8');enemy_file.write_text(enemy_text,encoding='utf-8')
        candidate=out/('party-combat-compiled-'+uuid.uuid4().hex+'.swf')
        result=command([find_java(None),'-Xmx1g','-jar',str(ROOT/'.tools/ffdec/ffdec.jar'),'-replace',str(original_path),str(candidate),'shootem_fla.MainTimeline',str(main_file),'enemy',str(enemy_file)],timeout=240)
        (out/'party-combat-build.log').write_text(result.stdout,encoding='utf-8')
        if result.returncode or not candidate.is_file():raise RuntimeError('FFDec failed; inspect party-combat-build.log')
        output=bytearray(candidate.read_bytes());output[3]=10
        report.update(verify_resources(original,output));(out/'party-combat-reference.swf').write_bytes(output)
        assert original_path.read_bytes()==original and source_path.read_bytes()==source
        report.update(status='passed',original_sha256=digest(original),source_sha256=digest(source),output_sha256=digest(output),output_bytes=len(output),
                      output='.build/oracle/party-combat-reference.swf',original_party_combat_methods_preserved=True,cases=len(CASES),scenarios=CASES,runtime_validated=False)
    except Exception as error:report['error']=str(error)
    (out/'party-combat-build-report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:v for k,v in report.items() if k!='scenarios'},indent=2))
    return 0 if report['status']=='passed' else 1


if __name__=='__main__':raise SystemExit(main())
