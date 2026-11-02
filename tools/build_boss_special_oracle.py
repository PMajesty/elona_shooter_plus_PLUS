"""Независимый эталон особой атаки босса: исходные AI, урон и полёт гранаты."""
import json
import re
import uuid

from build import ROOT, ORIGINAL_SHA256, command, digest, find_java
from build_combat_oracle import COMBAT_AS3, append_class, instrument, verify_resources
from build_boss_ai_oracle import ENEMY_EXTRA, ALLY_EXTRA
from build_projectile_oracle import instrument_actor
from build_shoot_oracle import extract_method


SCENARIOS = [
    dict(name='shield_priority', seed=42, level=6, action=2, count=1, frame=200, randomPrefix=[0.149, 0.5], steps=1),
    dict(name='special_upper_boundary', seed=42, level=6, action=2, count=1, frame=200, randomPrefix=[0.15, 0.2, 0.5, 0.5], steps=1),
    dict(name='below_special_level', seed=42, level=5, action=2, count=1, frame=200, randomPrefix=[0.15, 0.199, 0.5, 0.5], steps=1),
    dict(name='special_windup_release', seed=42, level=6, action=2, count=1, frame=200, randomPrefix=[0.15, 0.199, 0.1, 0.5], steps=125),
    dict(name='windup_surviving_hits', seed=42, level=6, action=5, idle=3, frame=184, hits=[dict(step=1, raw=10), dict(step=2, raw=7)], steps=40),
    dict(name='windup_weapon_hit', seed=42, level=6, action=5, idle=3, frame=184, hits=[dict(step=1, raw=10, weapon=True)], steps=40),
    dict(name='lethal_before_release', seed=42, level=6, action=5, idle=1, frame=184, hits=[dict(step=1, raw=301)], steps=40),
    dict(name='death_after_release', seed=42, level=6, action=5, idle=0, frame=184, hits=[dict(step=2, raw=301)], steps=40),
    dict(name='two_releases', seed=42, level=6, action=5, idle=0, frame=184, repeatAt=2, steps=40),
]

ENEMY_SPECIAL = r'''
      public function oracleSpecialConfigure(config:Object) : void {
         oracleBossConfigure(config);
         if(boss.action==5) boss.spAttack=[60,184,1];
      }
      public function oracleRepeatSpecial() : void {
         boss.action=5; boss.idle=0; speed=0; mc.scaleX=-1; boss.spAttack=[60,184,1];
         mc.oraclePlaying=true; mc.gotoAndPlay(184);
      }
      public function oracleSpecialState() : Object {
         var result:Object=oracleBossState();
         result.deathTicks=deathAnimeDuration; result.removed=parent==null;
         return result;
      }
'''

DRIVER = r'''
      private var oraclePhase:int=-1;
      private var oracleCombatActive:Boolean=false;
      private var oracleCombatState:uint=42;
      private var oracleCombatDraws:int=0;
      private var oracleCombatEvents:Array=[];
      private var oraclePrefix:Array=[];
      private var oraclePrefixIndex:int=0;
      private var oracleActors:Array=[];
      private var oracleExplosions:Array=[];
      private var oracleCastleEvents:Array=[];
      private var oracleStep:int=0;
      private var oracleCurrentActor:int=-1;
      private var oracleSnapshots:int=0;
      public function oracleCombatRandom() : Number {
         if(!oracleCombatActive) return Math.random();
         var value:int=int(oracleCombatState); value^=value<<13; value^=value>>>17; value^=value<<5;
         oracleCombatState=uint(value); ++oracleCombatDraws;
         return oraclePrefixIndex<oraclePrefix.length ? oraclePrefix[oraclePrefixIndex++] : Number(oracleCombatState)/4294967296;
      }
      public function oracleCombatDamage(id:int,damage:int,crit:int,before:int,x:int,y:int) : void {
         if(oracleCombatActive) oracleCombatEvents.push({step:oracleStep,damage:damage,critical:crit,before:before,x:x,y:y});
      }
      public function oracleProjectileEvent(actor:*,event:String) : void { oracleCurrentActor=actor.oracleIndex; }
      private function oracleProjectileExplosion(shooter:*,wi:*,x:*,y:*,damage:int,type:int) : * {
         var event:Object={step:oracleStep,actor:oracleCurrentActor,x:x,y:y,damage:damage,kind:type==0?"grenade":"rocket",
            drawBefore:oracleCombatDraws,castleBefore:game.castleHP};
         oracleExplosions.push(event); explode(shooter,wi,x,y,damage,type);
         event.drawAfter=oracleCombatDraws; event.castleAfter=game.castleHP;
      }
      public function damageCastle(attacker:*,amount:int) : * {
         if(!oracleCombatActive) return oracleOriginalDamageCastle(attacker,amount);
         var event:Object={step:oracleStep,raw:amount,before:game.castleHP,drawBefore:oracleCombatDraws};
         oracleCastleEvents.push(event); oracleOriginalDamageCastle(attacker,amount);
         event.after=game.castleHP; event.drawAfter=oracleCombatDraws;
      }
      private function oracleBattleReady() : void {
         if(oraclePhase!=2) return;
         oraclePhase=3; timer.stop(); removeEventListener(Event.ENTER_FRAME,onEnterFrame);
         removeEventListener(Event.ENTER_FRAME,oracleAdvance); if(amb!=null) amb.stop();
         oracleEmit({type:"ready",kind:"boss-special",rng:"xorshift32-with-explicit-prefix",clock:"boss-AI-child-previous-projectiles",
            nativeScheduling:false,scenarioCount:__SCENARIO_COUNT__,expectedSnapshots:__SNAPSHOT_COUNT__});
         oracleRunBossSpecial();
      }
      private function oracleSpecialSetup(config:Object) : * {
         for each(var old:* in oracleActors) { old.oracleFreeze(); if(old.parent!=null) old.parent.removeChild(old); }
         oracleActors=[]; oraclePrefix=[]; oraclePrefixIndex=0; oracleCombatActive=false;
         oracleCombatReset(config.seed); root.x=0; root.y=0;
         game.day=config.level+1; mission.level=config.level;
         game.castleHP=40; game.castleMHP=40; mission.absorbFix=0; protTime=0; immune=false;
         player_mc[0].x=510; player_mc[0].y=245;
         oracleCombatActive=true;
         var slot:int=spawnEnemy(999); var target:* =enemyArray[slot];
         config.x=250; config.y=220; config.speed=0;
         target.oracleSpecialConfigure(config);
         oracleCombatState=config.seed; oracleCombatDraws=0;
         oraclePrefix=config.randomPrefix!=null ? config.randomPrefix.concat() : [];
         oracleCombatEvents=[]; oracleExplosions=[]; oracleCastleEvents=[]; oracleStep=0;
         return target;
      }
      private function oracleSpecialSnapshot(config:Object,target:*,error:String) : void {
         var actors:Array=[];
         for each(var actor:* in oracleActors) actors.push(actor.oracleState());
         oracleEmit({type:"snapshot",kind:"boss-special",scenario:config.name,step:oracleStep,config:config,
            enemy:target.oracleSpecialState(),projectiles:actors,castleHp:game.castleHP,
            damageEvents:oracleCombatEvents.concat(),castleEvents:oracleCastleEvents.concat(),explosions:oracleExplosions.concat(),
            drawCount:oracleCombatDraws,rngState:oracleCombatState,error:error});
         ++oracleSnapshots;
      }
      private function oracleSpecialCase(config:Object) : void {
         var target:* =oracleSpecialSetup(config); oracleSpecialSnapshot(config,target,"");
         for(oracleStep=1;oracleStep<=config.steps;oracleStep++) {
            var error:String=""; var existing:int=oracleActors.length;
            try {
               if(config.repeatAt==oracleStep) target.oracleRepeatSpecial();
               if(config.hits!=null) for each(var hit:Object in config.hits) if(hit.step==oracleStep)
                  target.damage(hit.raw,hit.weapon==true?weapon(_pc):-1,int(target.x),int(target.y),_pc,0);
               error=target.oracleBossStep();
               for(var n:int=0;n<oracleActors.length;n++) {
                  var actor:* =oracleActors[n]; actor.oracleInitialize();
                  if(n<existing && actor.parent!=null) actor.onEnterFrame_bullet(null);
               }
            } catch(e:Error) { error=e.message; }
            oracleSpecialSnapshot(config,target,error);
         }
         target.mc.stop();
      }
      public function oracleRunBossSpecial() : Boolean {
         try {
            var cases:Array=__SCENARIOS__;
            for each(var config:Object in cases) oracleSpecialCase(config);
            oracleCombatActive=false; gamePaused=true;
            oracleEmit({type:"complete",kind:"boss-special",ok:true,snapshots:oracleSnapshots}); return true;
         } catch(error:Error) {
            oracleCombatActive=false; gamePaused=true; oracleEmit({type:"error",kind:"boss-special",message:error.message}); return false;
         }
      }
'''


def main():
    out = ROOT / '.build/oracle'
    out.mkdir(parents=True, exist_ok=True)
    report = {'status': 'failed', 'kind': 'boss-special', 'runtime_validated': False,
              'boundary': 'Original boss AI, explicit ally frame, then pre-existing projectiles; no native-scheduler claim',
              'scenarios': SCENARIOS, 'expected_snapshots': sum(case['steps'] + 1 for case in SCENARIOS)}
    try:
        original_path = ROOT / 'original/elonashooter1.3.swf'
        original = original_path.read_bytes()
        assert digest(original) == ORIGINAL_SHA256
        main_path = ROOT / 'src/shootem_fla/MainTimeline.as'
        main_bytes = main_path.read_bytes()
        names = ['enemy', 'ally1', 'bullet_grenade2']
        sources = {name: (ROOT / '.build/export/scripts' / f'{name}.as').read_text(encoding='utf-8-sig') for name in names}
        main_source, enemy, _, _ = instrument(main_bytes.decode('utf-8-sig'), sources['enemy'])
        driver = DRIVER.replace('__SCENARIOS__', json.dumps(SCENARIOS)).replace('__SCENARIO_COUNT__', str(len(SCENARIOS)))
        driver = driver.replace('__SNAPSHOT_COUNT__', str(report['expected_snapshots']))
        main_source = main_source.replace(COMBAT_AS3, driver + extract_method(COMBAT_AS3, 'oracleCombatReset'))
        original_damage = extract_method(main_source, 'damageCastle')
        # Обёртка записывает вход/выход, само тело damageCastle остаётся исходным.
        main_source = main_source.replace(original_damage, original_damage.replace('function damageCastle(', 'function oracleOriginalDamageCastle(', 1), 1)
        launch = extract_method(main_source, 'throwGrenade')
        registry = '_loc10_.oracleRoot=this; _loc10_.oracleIndex=oracleActors.length; oracleActors.push(_loc10_);\n         '
        changed = launch.replace('_loc10_.explode = explode;', '_loc10_.explode = oracleProjectileExplosion;')
        changed = changed.replace('stage.addChild(_loc10_);', registry + 'stage.addChild(_loc10_);')
        assert changed.replace(registry, '').replace('oracleProjectileExplosion', 'explode') == launch
        main_source = main_source.replace(launch, changed)
        enemy_original = enemy
        enemy = enemy.replace('mc.gotoAndPlay(', 'mc.oraclePlaying = true; mc.gotoAndPlay(')
        assert enemy.replace('mc.oraclePlaying = true; ', '') == enemy_original
        ally = re.sub(r'(?<!\.)\bstop\(\);', 'oraclePlaying = false; stop();', sources['ally1'])
        ally = re.sub(r'(?<!\.)\bgotoAndPlay\(', 'oraclePlaying = true; gotoAndPlay(', ally)
        assert ally.replace('oraclePlaying = false; ', '').replace('oraclePlaying = true; ', '') == sources['ally1']
        enemy = append_class(enemy, ENEMY_EXTRA + ENEMY_SPECIAL)
        ally = append_class(ally, ALLY_EXTRA)
        replacements = []
        for name, body in [('shootem_fla.MainTimeline', main_source), ('enemy', enemy), ('ally1', ally),
                           ('bullet_grenade2', instrument_actor(sources['bullet_grenade2']))]:
            target = out / (name.replace('.', '_') + '-boss-special.as')
            target.write_text(body, encoding='utf-8')
            replacements += [name, str(target)]
        candidate = out / ('boss-special-compiled-' + uuid.uuid4().hex + '.swf')
        result = command([find_java(None), '-Xmx1g', '-jar', str(ROOT / '.tools/ffdec/ffdec.jar'), '-replace',
                          str(original_path), str(candidate), *replacements], timeout=240)
        (out / 'boss-special-build.log').write_text(result.stdout, encoding='utf-8')
        if result.returncode or not candidate.exists():
            raise RuntimeError('FFDec boss special compilation failed')
        output = bytearray(candidate.read_bytes())
        output[3] = 10
        report.update(verify_resources(original, output))
        (out / 'boss-special-reference.swf').write_bytes(output)
        assert original_path.read_bytes() == original
        assert main_path.read_bytes() == main_bytes
        report.update(status='passed', original_sha256=digest(original), output_sha256=digest(output),
                      original_class_sources={name: digest(source.encode()) for name, source in sources.items()})
    except Exception as error:
        report['error'] = str(error)
    (out / 'boss-special-build-report.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, indent=2))
    return 0 if report['status'] == 'passed' else 1


if __name__ == '__main__':
    raise SystemExit(main())
