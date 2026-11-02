import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { Simulation, type EnemyState } from '../src/simulation.ts';
import type { ExplosionKind, ProjectileState } from '../src/projectiles.ts';

interface Configuration {
  name: string; seed: number; level: number; steps: number; x: number; y: number; speed: number;
  action: number; count?: number; idle?: number; frame: number; randomPrefix?: number[];
  hits?: { step: number; raw: number; weapon?: boolean }[]; repeatAt?: number;
}
interface EnemyObservation {
  x: number; y: number; hp: number; maxHp: number; speed: number; speedOrg: number;
  attack: number; gold: number; exp: number; action: number; count: number; idle: number;
  fireNum: number; weapon: number; damage: number; facing: number; frame: number;
  bodyFrame: number; playing: boolean; knockBack: number; deathTicks: number; removed: boolean;
}
type ActorObservation = Record<string, string | number | boolean | null>;
interface DamageEvent { step: number; damage: number; critical: number; before: number; x: number; y: number }
interface CastleEvent { step: number; raw: number; before: number; after: number; drawBefore: number; drawAfter: number }
interface ExplosionEvent {
  step: number; actor: number; x: number; y: number; damage: number; kind: ExplosionKind;
  drawBefore: number; drawAfter: number; castleBefore: number; castleAfter: number;
}
export interface BossSpecialRecord {
  type: string; version: number; kind: string; rng?: string; clock?: string; nativeScheduling?: boolean;
  scenarioCount?: number; expectedSnapshots?: number; snapshots?: number; ok?: boolean;
  scenario?: string; step?: number; config?: Configuration; enemy?: EnemyObservation;
  projectiles?: ActorObservation[]; castleHp?: number; damageEvents?: DamageEvent[];
  castleEvents?: CastleEvent[]; explosions?: ExplosionEvent[]; drawCount?: number; rngState?: number; error?: string;
}
interface Boundary {
  random(): number; spawnEnemy(kind: 'boss'): void; tickEnemy(enemy: EnemyState): void;
  tickProjectiles(uidLimit?: number): void; damageCastle(amount: number): void;
  damageEnemy(enemy: EnemyState, raw: number, critical: number, weaponSlot: number | null, x: number, y: number): void;
  explodeProjectile(x: number, y: number, damage: number, slot: number | null, kind: ExplosionKind): void;
}
interface Difference { field: string; expected: unknown; actual: unknown }
const SCENARIOS = [
  ['shield_priority', 1], ['special_upper_boundary', 1], ['below_special_level', 1],
  ['special_windup_release', 125], ['windup_surviving_hits', 40], ['windup_weapon_hit', 40],
  ['lethal_before_release', 40], ['death_after_release', 40], ['two_releases', 40],
] as const;
const metadata = JSON.parse(readFileSync(new URL('../public/assets/ally-animation.json', import.meta.url), 'utf8'));

function projectEnemy(enemy: EnemyState): Omit<EnemyObservation, 'playing'> {
  const body = metadata.frames[String(enemy.frame)].bodies.find((entry: { name: string }) => entry.name === 'chara1');
  return {
    x: enemy.x, y: enemy.y, hp: enemy.hp, maxHp: enemy.maxHp, speed: enemy.speed, speedOrg: enemy.speedOrg,
    attack: enemy.attack, gold: enemy.gold, exp: enemy.exp, action: enemy.bossAction, count: enemy.bossCount,
    idle: enemy.bossIdle, fireNum: enemy.bossFireNum, weapon: enemy.bossWeapon, damage: enemy.bossDamage,
    facing: enemy.bossFacing ?? -1, frame: enemy.frame, bodyFrame: enemy.appearance * 10 + body.pose,
    knockBack: enemy.knockBack, deathTicks: enemy.deathTicks, removed: enemy.removed,
  };
}

function projectActor(actor: ProjectileState): ActorObservation {
  return {
    attached: !actor.removed, x: actor.x, rootY: 0, y: actor.y,
    startX: actor.startX, startY: actor.startY, targetX: actor.targetX, targetY: actor.targetY,
    speed: actor.speed, damage: actor.damage, weaponSlot: actor.weaponSlot, curve: actor.curve, count: actor.count,
    acceleration: null, direction: null, penetrations: null, rotation: actor.rotation, rotationStep: null,
    scale: actor.scale, scaleY: actor.scale, alpha: actor.alpha,
    shadowY: actor.shadowY, shadowAlpha: actor.shadowAlpha, shadowVisible: actor.shadowVisible,
  };
}

export function compareBossSpecialTrace(records: BossSpecialRecord[], options: {
  afterStep?: (simulation: Simulation, enemy: EnemyState) => void;
} = {}) {
  const ready = records[0], complete = records.at(-1);
  assert.equal(ready.version, 1); assert.equal(ready.type, 'ready'); assert.equal(ready.kind, 'boss-special');
  assert.equal(ready.rng, 'xorshift32-with-explicit-prefix');
  assert.equal(ready.clock, 'boss-AI-child-previous-projectiles'); assert.equal(ready.nativeScheduling, false);
  const total = SCENARIOS.reduce((sum, [, steps]) => sum + steps + 1, 0);
  assert.equal(ready.scenarioCount, SCENARIOS.length); assert.equal(ready.expectedSnapshots, total);
  assert.equal(complete?.type, 'complete'); assert.equal(complete.kind, 'boss-special'); assert.equal(complete.ok, true);
  assert.equal(complete.snapshots, total); assert.equal(records.length, total + 2);
  const snapshots = records.filter(record => record.type === 'snapshot');
  assert.deepEqual(snapshots.map(record => [record.scenario, record.step]),
    SCENARIOS.flatMap(([name, steps]) => Array.from({ length: steps + 1 }, (_, step) => [name, step])));
  const comparisons: { scenario: string; step: number; matched: boolean; differences: Difference[] }[] = [];
  let maximumRotationError = 0;
  for (const [scenario] of SCENARIOS) {
    const samples = snapshots.filter(record => record.scenario === scenario), config = samples[0].config!;
    const simulation = new Simulation(1), state = simulation.state, boundary = simulation as unknown as Boundary;
    state.rng = config.seed; state.enemies = []; state.projectiles = [];
    state.day = (config.level + 1) as typeof state.day; state.activeMission.level = config.level as typeof state.activeMission.level;
    state.castleHp = 40; state.castleMaxHp = 40; state.activeMission.absorbFix = 0;
    state.waveIndex = 4; state.waves[4].initialCount = 10;
    let draws = 0, prefixIndex = 0, prefix: number[] = [], step = 0;
    const random = boundary.random.bind(simulation);
    boundary.random = () => { draws++; const value = random(); return prefixIndex < prefix.length ? prefix[prefixIndex++] : value; };
    boundary.spawnEnemy('boss');
    const enemy = state.enemies[0];
    Object.assign(enemy, { x: config.x, y: config.y, speed: config.speed, frame: config.frame, bossAction: config.action });
    if (config.count !== undefined) enemy.bossCount = config.count;
    if (config.idle !== undefined) enemy.bossIdle = config.idle;
    state.rng = config.seed; draws = 0; prefix = config.randomPrefix ?? [];
    const actors: ProjectileState[] = [], castleEvents: CastleEvent[] = [], explosions: ExplosionEvent[] = [], damageEvents: DamageEvent[] = [];
    const castle = boundary.damageCastle.bind(simulation);
    boundary.damageCastle = raw => {
      const event = { step, raw: Math.trunc(raw), before: state.castleHp, after: 0, drawBefore: draws, drawAfter: 0 };
      castleEvents.push(event); castle(raw); event.after = state.castleHp; event.drawAfter = draws;
    };
    const explode = boundary.explodeProjectile.bind(simulation);
    boundary.explodeProjectile = (x, y, damage, slot, kind) => {
      const actor = actors.findIndex(value => !value.removed && value.count <= 0);
      const event = { step, actor, x, y, damage, kind, drawBefore: draws, drawAfter: 0, castleBefore: state.castleHp, castleAfter: 0 };
      explosions.push(event); explode(x, y, damage, slot, kind); event.drawAfter = draws; event.castleAfter = state.castleHp;
    };
    for (const sample of samples) {
      assert.deepEqual(sample.config, config); step = sample.step!;
      if (step > 0) {
        const uidLimit = state.nextUid;
        if (config.repeatAt === step) Object.assign(enemy, { bossAction: 5, bossIdle: 0, speed: 0, bossFacing: -1, frame: 184 });
        for (const hit of config.hits ?? []) if (hit.step === step) {
          const before = enemy.hp, x = Math.trunc(enemy.x), y = Math.trunc(enemy.y), eventCount = simulation.events.length;
          boundary.damageEnemy(enemy, hit.raw, 0, hit.weapon ? 0 : null, x, y);
          const event = simulation.events.slice(eventCount).find(value => value.type === 'hit');
          if (event) damageEvents.push({ step, damage: event.amount!, critical: event.criticalType!, before, x, y });
        }
        boundary.tickEnemy(enemy);
        for (const actor of state.projectiles) if (!actors.includes(actor)) actors.push(actor);
        boundary.tickProjectiles(uidLimit);
        options.afterStep?.(simulation, enemy);
      }
      const differences: Difference[] = [];
      const check = (field: string, actual: unknown, expected: unknown) => {
        if (!isDeepStrictEqual(actual, expected)) differences.push({ field, expected, actual });
      };
      for (const [key, value] of Object.entries(projectEnemy(enemy))) check(`enemy.${key}`, value, sample.enemy![key as keyof EnemyObservation]);
      check('projectiles.length', actors.length, sample.projectiles!.length);
      actors.forEach((actor, index) => {
        const expected = sample.projectiles![index];
        if (!expected) return;
        assert.equal(expected.className, 'bullet_grenade2');
        for (const [key, value] of Object.entries(projectActor(actor))) {
          if (key === 'rotation') {
            const error = Math.abs(((Number(value) - Number(expected[key]) + 540) % 360 + 360) % 360 - 180);
            maximumRotationError = Math.max(maximumRotationError, error);
          }
          check(`projectiles[${index}].${key}`, value, expected[key]);
        }
      });
      check('castleHp', state.castleHp, sample.castleHp); check('castleEvents', castleEvents, sample.castleEvents);
      check('explosions', explosions, sample.explosions); check('damageEvents', damageEvents, sample.damageEvents);
      check('drawCount', draws, sample.drawCount); check('rngState', state.rng, sample.rngState);
      comparisons.push({ scenario, step, matched: differences.length === 0, differences });
    }
  }
  const sourceErrors = snapshots.filter(record => record.error).map(({ scenario, step, error }) => ({ scenario, step, error }));
  return { status: comparisons.every(row => row.matched) && !sourceErrors.length ? 'passed' as const : 'failed' as const,
    matchedSnapshots: comparisons.filter(row => row.matched).length, comparedSnapshots: comparisons.length,
    maximumRotationError, sourceErrors, comparisons };
}
