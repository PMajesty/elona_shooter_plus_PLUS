import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { Simulation, type EnemyState } from '../src/simulation.ts';
import { ENEMIES } from '../src/content.ts';
import { barbarianDisplayWidth, barbarianParentWidth, ENEMY_HIT_DISPLAY_X_BOUNDS, ENEMY_RAGE_DISPLAY_X_BOUNDS } from '../src/enemy-display-bounds.ts';
import { ordinaryEnemyHit, shadowHitAtFrame, type CollisionGeometry } from '../src/collision.ts';

interface HitInput { step: number; raw: number; weapon?: boolean; offsetX?: number; critical?: number }
interface Configuration {
  name: string; seed: number; steps: number; x?: number; y?: number; frame?: number;
  attacking?: boolean; speed?: number; knockBack?: number; hp?: number;
  randomPrefix?: number[]; hits?: HitInput[]; hitSeed?: number; knockAt?: number; knockAmount?: number;
  syntheticWidthDiagnostic?: boolean;
}
interface EffectObservation { kind: 'hit' | 'rage'; frame: number; x: number; y: number; width: number; alpha: number }
interface Observation {
  x: number; y: number; hp: number; speed: number; speedOrg: number; attack: number;
  gold: number; exp: number; rampage: number; rageEffectFrame: number; resKnock: number; knockBack: number;
  attacking: boolean; attacked: boolean; frame: number; shadowHit: boolean;
  deathTicks: number; width: number; parentWidth: number; effects: EffectObservation[]; removed: boolean;
}
interface DamageEvent { damage: number; critical: number; before: number; x: number; y: number }
export interface BarbarianReferenceRecord {
  version: number; type: string; kind: string; rng?: string; clock?: string; nativeScheduling?: boolean;
  scenario?: string; step?: number; config?: Configuration; enemy?: Observation;
  castleHp?: number; drawCount?: number; rngState?: number; error?: string; damageEvents?: DamageEvent[];
  requestedFrame?: number; frame?: number; rageEffectFrame?: number; x?: number; y?: number; gridX?: number; gridY?: number;
  width?: number; height?: number; bits?: string; shadowBits?: string; shadowHit?: boolean;
  ok?: boolean; snapshots?: number; geometryGrids?: number;
}
interface Boundary {
  random(): number; spawnEnemy(kind: 'barbarian'): void; tickEnemy(enemy: EnemyState): void;
  damageEnemy(enemy: EnemyState, raw: number, critical: number, weaponSlot: number | null, x: number, y: number): void;
}
interface Difference { field: string; expected: unknown; actual: unknown }
const SCENARIOS = [
  ['fresh_walk', 50], ['normal_attack', 120], ['left_knockback', 14], ['rage_walk', 80], ['rage_attack', 60],
  ['rage_left_knockback', 16], ['rage_attack_knockback', 28], ['rage_threshold_and_repeat', 16],
  ['weapon_hit_rage', 16], ['rage_contact_left_clamp', 16], ['critical_contact_left_clamp', 16], ['offset_hit_parent_bounds', 16], ['lethal_bypasses_rage', 210],
] as const;
const manifest = JSON.parse(readFileSync(new URL('../public/assets/manifest.json', import.meta.url), 'utf8'));

function project(enemy: EnemyState): Observation {
  const effects: EffectObservation[] = (enemy.hitEffects ?? []).map(effect => {
    const bounds = ENEMY_HIT_DISPLAY_X_BOUNDS[effect.frame];
    const clip = manifest.clips[effect.frame < 70 ? 'bloodHit' : 'criticalHit'];
    return { kind: 'hit', frame: effect.frame, x: effect.x, y: effect.y,
      width: Math.round((bounds[1] - bounds[0]) * 20) / 20, alpha: clip.frameAlpha[effect.frame - clip.sourceFrameStart] };
  });
  if (enemy.rageEffectFrame) {
    const bounds = ENEMY_RAGE_DISPLAY_X_BOUNDS[enemy.rageEffectFrame];
    effects.push({ kind: 'rage', frame: enemy.rageEffectFrame, x: 0, y: 20, width: Math.round((bounds[1] - bounds[0]) * 20) / 20, alpha: 1 });
  }
  return {
    x: enemy.x, y: enemy.y, hp: enemy.hp, speed: enemy.speed, speedOrg: enemy.speedOrg, attack: enemy.attack,
    gold: enemy.gold, exp: enemy.exp, rampage: enemy.rampage!, rageEffectFrame: enemy.rageEffectFrame!, resKnock: ENEMIES.barbarian.knockResistance,
    knockBack: enemy.knockBack, attacking: enemy.attacking, attacked: enemy.attacked, frame: enemy.frame,
    shadowHit: enemy.shadowHit, deathTicks: enemy.deathTicks, width: barbarianDisplayWidth(enemy.frame, enemy.rageEffectFrame),
    // nullify отсоединяет mc: его собственный width остаётся, а родитель уже пуст.
    parentWidth: enemy.removed ? 0 : barbarianParentWidth(enemy.frame, enemy.rageEffectFrame, enemy.hitEffects), effects, removed: enemy.removed,
  };
}

export function compareBarbarianTrace(records: BarbarianReferenceRecord[], options: {
  step?: (simulation: Simulation, enemy: EnemyState) => void; geometry?: CollisionGeometry;
} = {}) {
  const ready = records[0], complete = records.at(-1);
  assert.equal(ready?.version, 1); assert.equal(ready.type, 'ready'); assert.equal(ready.kind, 'barbarian');
  assert.equal(ready.rng, 'xorshift32'); assert.equal(ready.clock, 'original-AI-then-child-then-existing-effects'); assert.equal(ready.nativeScheduling, false);
  assert.equal(complete?.type, 'complete'); assert.equal(complete.kind, 'barbarian'); assert.equal(complete.ok, true);
  const snapshotCount = SCENARIOS.reduce((sum, [, steps]) => sum + steps + 1, 0);
  assert.equal(complete.snapshots, snapshotCount); assert.equal(complete.geometryGrids, 12); assert.equal(records.length, snapshotCount + 14);
  const snapshots = records.filter(record => record.type === 'snapshot');
  assert.deepEqual(snapshots.map(record => [record.scenario, record.step]), SCENARIOS.flatMap(([name, count]) => Array.from({ length: count + 1 }, (_, step) => [name, step])));
  const comparisons: { scenario: string; step: number; matched: boolean; differences: Difference[] }[] = [];
  for (const [scenario] of SCENARIOS) {
    const samples = snapshots.filter(record => record.scenario === scenario), config = samples[0].config!;
    assert.equal(config.name, scenario);
    for (const sample of samples) assert.deepEqual(sample.config, config);
    const simulation = new Simulation(1), boundary = simulation as unknown as Boundary;
    simulation.state.rng = config.seed; simulation.state.enemies = [];
    simulation.state.castleHp = 40; simulation.state.castleMaxHp = 40; simulation.state.activeMission.absorbFix = 0;
    simulation.state.waveIndex = 4; simulation.state.waves[4].initialCount = 10;
    let draws = 0, prefixIndex = 0, prefix: number[] = [];
    const random = boundary.random.bind(simulation);
    boundary.random = () => { draws++; const value = random(); return prefixIndex < prefix.length ? prefix[prefixIndex++] : value; };
    boundary.spawnEnemy('barbarian');
    const enemy = simulation.state.enemies[0];
    for (const key of ['x', 'y', 'frame', 'speed', 'knockBack', 'hp'] as const) if (config[key] !== undefined) enemy[key] = config[key]!;
    if (config.attacking !== undefined) enemy.attacking = config.attacking;
    if (config.hitSeed !== undefined) { simulation.state.rng = config.hitSeed; draws = 0; }
    prefix = config.randomPrefix ?? [];
    const damageEvents: DamageEvent[] = [];
    for (const sample of samples) {
      for (const hit of config.hits ?? []) if (hit.step === sample.step) {
        const before = enemy.hp, x = Math.trunc(enemy.x) + (hit.offsetX ?? 0), y = Math.trunc(enemy.y);
        const previousEventCount = simulation.events.length;
        boundary.damageEnemy(enemy, hit.raw, hit.critical ?? 0, hit.weapon ? 0 : null, x, y);
        const event = simulation.events.slice(previousEventCount).find(value => value.type === 'hit');
        if (event) damageEvents.push({ damage: event.amount!, critical: event.criticalType!, before, x, y });
      }
      if (config.knockAt === sample.step) enemy.knockBack = config.knockAmount!;
      if (sample.step! > 0 && !enemy.removed) (options.step ?? ((_simulation, actor) => boundary.tickEnemy(actor)))(simulation, enemy);
      const differences: Difference[] = [];
      const check = (field: string, actual: unknown, expected: unknown) => {
        if (!isDeepStrictEqual(actual, expected)) differences.push({ field, expected, actual });
      };
      for (const [key, value] of Object.entries(project(enemy))) check(`enemy.${key}`, value, sample.enemy![key as keyof Observation]);
      check('castleHp', simulation.state.castleHp, sample.castleHp);
      check('drawCount', draws, sample.drawCount); check('rngState', simulation.state.rng, sample.rngState);
      check('damageEvents', damageEvents, sample.damageEvents);
      comparisons.push({ scenario, step: sample.step!, matched: !differences.length, differences });
    }
  }
  const geometry = options.geometry ?? JSON.parse(readFileSync(new URL('../public/assets/collision-geometry.json', import.meta.url), 'utf8')) as CollisionGeometry;
  const grids = records.filter(record => record.type === 'geometry');
  assert.deepEqual(grids.map(record => [record.requestedFrame, record.rageEffectFrame]), [1, 3, 22, 26, 38, 45, 53, 84, 119].map(frame => [frame, 0]).concat([[3, 1], [3, 5], [3, 12]]));
  const geometryComparisons = grids.map(grid => {
    assert.equal(grid.width, 80); assert.equal(grid.height, 80); assert.equal(grid.bits!.length, 6400); assert.equal(grid.shadowBits!.length, 6400);
    const shadowHit = shadowHitAtFrame('barbarian', grid.frame!); assert.equal(shadowHit, grid.shadowHit);
    const mismatches: { x: number; y: number; expected: boolean; actual: boolean }[] = [];
    const enemy = { kind: 'barbarian' as const, x: grid.x!, y: grid.y!, frame: grid.frame!, shadowHit, rageEffectFrame: grid.rageEffectFrame! };
    for (let index = 0; index < grid.bits!.length; index++) {
      const x = grid.gridX! + index % grid.width!, y = grid.gridY! + Math.floor(index / grid.width!);
      const expected = grid.bits![index] === '1' && (shadowHit || grid.shadowBits![index] !== '1');
      const actual = ordinaryEnemyHit(enemy, x, y, geometry);
      if (actual !== expected) mismatches.push({ x, y, expected, actual });
    }
    return { frame: grid.frame!, rageEffectFrame: grid.rageEffectFrame!, shadowHit, points: grid.bits!.length, matched: !mismatches.length, mismatches };
  });
  const sourceErrors = snapshots.filter(record => record.error).map(({ scenario, step, error }) => ({ scenario, step, error }));
  // Внешние частицы не входят в mc.hitTestPoint; их влияние на ширину родителя сохраняем отдельно.
  const transientBounds = snapshots.filter(record => !record.enemy!.removed && record.enemy!.parentWidth !== record.enemy!.width).map(record => ({
    scenario: record.scenario!, step: record.step!, width: record.enemy!.width, parentWidth: record.enemy!.parentWidth, effects: record.enemy!.effects,
  }));
  return { status: comparisons.every(row => row.matched) && geometryComparisons.every(row => row.matched) && !sourceErrors.length ? 'passed' as const : 'failed' as const,
    matchedSnapshots: comparisons.filter(row => row.matched).length, comparedSnapshots: comparisons.length,
    matchedGeometryGrids: geometryComparisons.filter(row => row.matched).length,
    comparedGeometryPoints: geometryComparisons.reduce((sum, row) => sum + row.points, 0),
    sourceErrors, comparisons, geometryComparisons, transientBounds };
}
