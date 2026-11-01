import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { Simulation, type EnemyState } from '../src/simulation.ts';

interface Configuration {
  name: string; seed: number; level: number; steps?: number; stepSeed?: number;
  x?: number; y?: number; action?: number; count?: number; idle?: number;
  fireNum?: number; weapon?: number; speed?: number; facing?: 1 | -1; frame?: number;
  mode?: 'pellet' | 'explosion'; poseFrames?: number[];
}
interface Observation {
  x: number; y: number; hp: number; maxHp: number; speed: number; speedOrg: number;
  attack: number; gold: number; exp: number; action: number; count: number;
  idle: number; fireNum: number; weapon: number; damage: number; facing: number;
  frame: number; bodyFrame: number; playing: boolean; knockBack: number;
}
interface DamageEvent { damage: number; critical: number; before: number; x: number; y: number }
export interface BossAiReferenceRecord {
  version: number; type: string; kind: string; rng?: string; clock?: string; nativeScheduling?: boolean;
  scenario?: string; step?: number; config?: Configuration; enemy?: Observation;
  before?: Observation; after?: Observation; hit?: boolean; shapeHit?: boolean; damageEvents?: DamageEvent[];
  castleHp?: number; drawCount?: number; rngState?: number; error?: string;
  ok?: boolean; snapshots?: number; hitCases?: number;
}
interface Boundary {
  random(): number; spawnEnemy(kind: 'boss'): void; tickEnemy(enemy: EnemyState): void;
  processPellet(x: number, y: number, damage: number): boolean;
  explodeProjectile(x: number, y: number, damage: number, slot: null, kind: 'grenade'): void;
}
const SCENARIOS = [
  ['forward_walk', 26], ['backward_walk', 26], ['shield_entry_exit', 125], ['shield_hold', 22],
  ['below_shield_level', 20], ['weapon_one', 22], ['weapon_two', 32], ['idle_animation', 20],
] as const;
const metadata = JSON.parse(readFileSync(new URL('../public/assets/ally-animation.json', import.meta.url), 'utf8'));

function project(enemy: EnemyState): Omit<Observation, 'playing'> {
  // Этот же исходный выбор поз используется OriginalAlly в браузере.
  const body = metadata.frames[String(enemy.frame)].bodies.find((entry: { name: string }) => entry.name === 'chara1');
  return {
    x: enemy.x, y: enemy.y, hp: enemy.hp, maxHp: enemy.maxHp, speed: enemy.speed, speedOrg: enemy.speedOrg,
    attack: enemy.attack, gold: enemy.gold, exp: enemy.exp, action: enemy.bossAction, count: enemy.bossCount,
    idle: enemy.bossIdle, fireNum: enemy.bossFireNum, weapon: enemy.bossWeapon, damage: enemy.bossDamage,
    facing: enemy.bossFacing ?? -1, frame: enemy.frame, bodyFrame: enemy.appearance * 10 + body.pose, knockBack: enemy.knockBack,
  };
}

export function compareBossAiTrace(records: BossAiReferenceRecord[], options: { step?: (simulation: Simulation, enemy: EnemyState) => void } = {}) {
  const ready = records[0], complete = records.at(-1);
  assert.equal(ready.version, 1); assert.equal(ready.type, 'ready'); assert.equal(ready.kind, 'boss-ai');
  assert.equal(ready.rng, 'xorshift32'); assert.equal(ready.clock, 'original-AI-then-explicit-child-frame'); assert.equal(ready.nativeScheduling, false);
  assert.equal(complete?.type, 'complete'); assert.equal(complete.kind, 'boss-ai'); assert.equal(complete.ok, true);
  assert.equal(complete.snapshots, 301); assert.equal(complete.hitCases, 4); assert.equal(records.length, 307);
  const snapshots = records.filter(record => record.type === 'snapshot'), hits = records.filter(record => record.type === 'hit');
  assert.deepEqual(snapshots.map(record => [record.scenario, record.step]), SCENARIOS.flatMap(([name, count]) => Array.from({ length: count + 1 }, (_, index) => [name, index])));
  assert.deepEqual(hits.map(record => record.scenario), ['pellet_guard', 'pellet_open', 'explosion_guard', 'explosion_open']);
  const comparisons: { scenario: string; step: number; matched: boolean; differences: { field: string; expected: unknown; actual: unknown }[]; originalError: string }[] = [];
  const setup = (config: Configuration, shapeHit = true) => {
    const simulation = new Simulation(1, { hitTest: () => shapeHit });
    const boundary = simulation as unknown as Boundary;
    simulation.state.rng = config.seed; simulation.state.enemies = [];
    simulation.state.day = (config.level + 1) as 1 | 2 | 3 | 4;
    simulation.state.activeMission.level = config.level as 0 | 1 | 2 | 3;
    simulation.state.castleHp = 40; simulation.state.castleMaxHp = 40; simulation.state.activeMission.absorbFix = 0;
    let draws = 0;
    const random = boundary.random.bind(simulation);
    boundary.random = () => { draws++; return random(); };
    boundary.spawnEnemy('boss');
    const enemy = simulation.state.enemies[0];
    for (const key of ['x', 'y', 'speed', 'frame'] as const) if (config[key] !== undefined) enemy[key] = config[key]!;
    for (const [field, key] of [['action', 'bossAction'], ['count', 'bossCount'], ['idle', 'bossIdle'], ['fireNum', 'bossFireNum'], ['weapon', 'bossWeapon']] as const) {
      if (config[field] !== undefined) enemy[key] = config[field]!;
    }
    if (config.facing !== undefined) enemy.bossFacing = config.facing;
    if (config.stepSeed !== undefined) { simulation.state.rng = config.stepSeed; draws = 0; }
    return { simulation, boundary, enemy, draws: () => draws };
  };
  const compare = (sample: BossAiReferenceRecord, actual: Record<string, unknown>, expected: Record<string, unknown>) => {
    const differences = Object.entries(expected).filter(([key, value]) => !isDeepStrictEqual(actual[key], value))
      .map(([field, value]) => ({ field, expected: value, actual: actual[field] }));
    comparisons.push({ scenario: sample.scenario!, step: sample.step ?? 0, matched: differences.length === 0,
      differences, originalError: sample.error ?? '' });
  };
  const withoutPlaying = ({ playing: _playing, ...enemy }: Observation) => enemy;
  for (const [scenario] of SCENARIOS) {
    const samples = snapshots.filter(record => record.scenario === scenario), config = samples[0].config!;
    const { simulation, boundary, enemy, draws } = setup(config);
    for (const sample of samples) {
      assert.deepEqual(sample.config, config);
      if (sample.step! > 0) (options.step ?? ((_simulation, actor) => boundary.tickEnemy(actor)))(simulation, enemy);
      compare(sample, { enemy: project(enemy), castleHp: simulation.state.castleHp, drawCount: draws(), rngState: simulation.state.rng },
        { enemy: withoutPlaying(sample.enemy!), castleHp: sample.castleHp, drawCount: sample.drawCount, rngState: sample.rngState });
    }
  }
  for (const sample of hits) {
    const config = sample.config!, { simulation, boundary, enemy, draws } = setup(config, sample.shapeHit);
    const before = project(enemy); simulation.events = [];
    const hit = config.mode === 'pellet' ? boundary.processPellet(200, 210, 45)
      : (boundary.explodeProjectile(200, 220, 45, null, 'grenade'), enemy.hp < before.hp);
    let hpBefore = before.hp;
    const damageEvents = simulation.events.filter(event => event.type === 'hit').map(event => {
      const value = { damage: event.amount!, critical: event.criticalType!, before: hpBefore, x: event.x!, y: event.y! };
      hpBefore -= event.amount!; return value;
    });
    compare(sample, { before, after: project(enemy), hit, damageEvents, castleHp: simulation.state.castleHp, drawCount: draws(), rngState: simulation.state.rng },
      { before: withoutPlaying(sample.before!), after: withoutPlaying(sample.after!), hit: sample.hit, damageEvents: sample.damageEvents,
        castleHp: sample.castleHp, drawCount: sample.drawCount, rngState: sample.rngState });
  }
  const sourceErrors = comparisons.filter(row => row.originalError).map(({ scenario, step, originalError }) => ({ scenario, step, error: originalError }));
  return { status: comparisons.every(row => row.matched) && !sourceErrors.length ? 'passed' as const : 'failed' as const,
    matchedObservations: comparisons.filter(row => row.matched).length, comparedObservations: comparisons.length,
    stateSnapshots: snapshots.length, guardedHitCases: hits.length, sourceErrors, comparisons };
}
