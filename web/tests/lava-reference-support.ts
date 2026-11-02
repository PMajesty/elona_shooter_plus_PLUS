import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { Simulation, type EnemyState } from '../src/simulation.ts';
import { ENEMIES } from '../src/content.ts';
import { LAVA_DISPLAY_WIDTHS, lavaParentWidth, ENEMY_HIT_DISPLAY_X_BOUNDS } from '../src/enemy-display-bounds.ts';
import { ordinaryEnemyHit, shadowHitAtFrame, type CollisionGeometry } from '../src/collision.ts';

interface HitInput { step: number; raw: number; weapon?: boolean; offsetX?: number; critical?: number }
interface Configuration {
  name: string; seed: number; steps: number; x?: number; y?: number; frame?: number;
  attacking?: boolean; speed?: number; knockBack?: number; hp?: number;
  randomPrefix?: number[]; hits?: HitInput[]; hitSeed?: number; knockAt?: number; knockAmount?: number;
  syntheticWidthDiagnostic?: boolean;
}
interface EffectObservation { frame: number; x: number; y: number; width: number; alpha: number }
interface Observation {
  x: number; y: number; hp: number; speed: number; speedOrg: number; attack: number;
  gold: number; exp: number; alerted: boolean; onMark: boolean; resKnock: number; knockBack: number;
  attacking: boolean; attacked: boolean; frame: number; shadowHit: boolean;
  deathTicks: number; width: number; parentWidth: number; effects: EffectObservation[]; removed: boolean;
}
interface DamageEvent { damage: number; critical: number; before: number; x: number; y: number }
export interface LavaReferenceRecord {
  version: number; type: string; kind: string; rng?: string; clock?: string; nativeScheduling?: boolean;
  scenario?: string; step?: number; config?: Configuration; enemy?: Observation;
  alertCalls?: number; nextAlertIsTarget?: boolean; castleHp?: number; drawCount?: number; rngState?: number; error?: string; damageEvents?: DamageEvent[];
  requestedFrame?: number; frame?: number; afterAttack?: boolean; fractional?: boolean; x?: number; y?: number; gridX?: number; gridY?: number;
  width?: number; height?: number; bits?: string; shadowBits?: string; shadowHit?: boolean;
  ok?: boolean; snapshots?: number; geometryGrids?: number;
}
interface Boundary {
  random(): number; spawnEnemy(kind: 'lava'): void; tickEnemy(enemy: EnemyState): void;
  damageEnemy(enemy: EnemyState, raw: number, critical: number, weaponSlot: number | null, x: number, y: number): void;
}
interface Difference { field: string; expected: unknown; actual: unknown }
const SCENARIOS = [
  ['fresh_walk', 45], ['alert_crossing', 4], ['alert_fallback', 4], ['attack_timeline', 40],
  ['left_knockback', 16], ['weapon_left_clamp', 16], ['knockback_before_attack', 12],
  ['knockback_after_attack', 40], ['weapon_during_attack', 40], ['lethal_walking', 210], ['lethal_before_explosion', 221],
] as const;
const manifest = JSON.parse(readFileSync(new URL('../public/assets/manifest.json', import.meta.url), 'utf8'));

function project(enemy: EnemyState): Observation {
  const effects: EffectObservation[] = (enemy.hitEffects ?? []).map(effect => {
    const bounds = ENEMY_HIT_DISPLAY_X_BOUNDS[effect.frame];
    const clip = manifest.clips[effect.frame < 70 ? 'bloodHit' : 'criticalHit'];
    return { frame: effect.frame, x: effect.x, y: effect.y,
      width: Math.round((bounds[1] - bounds[0]) * 20) / 20, alpha: clip.frameAlpha[effect.frame - clip.sourceFrameStart] };
  });
  return {
    x: enemy.x, y: enemy.y, hp: enemy.hp, speed: enemy.speed, speedOrg: enemy.speedOrg, attack: enemy.attack,
    gold: enemy.gold, exp: enemy.exp, alerted: enemy.alerted!, onMark: Boolean(enemy.onMark), resKnock: ENEMIES.lava.knockResistance,
    knockBack: enemy.knockBack, attacking: enemy.attacking, attacked: enemy.attacked, frame: enemy.frame,
    shadowHit: enemy.shadowHit, deathTicks: enemy.deathTicks, width: LAVA_DISPLAY_WIDTHS[enemy.frame],
    // nullify отсоединяет mc: его собственный width остаётся, а родитель уже пуст.
    parentWidth: enemy.removed ? 0 : lavaParentWidth(enemy.frame, enemy.hitEffects), effects, removed: enemy.removed,
  };
}

export function compareLavaTrace(records: LavaReferenceRecord[], options: {
  step?: (simulation: Simulation, enemy: EnemyState) => void; geometry?: CollisionGeometry;
} = {}) {
  const ready = records[0], complete = records.at(-1);
  assert.equal(ready?.version, 1); assert.equal(ready.type, 'ready'); assert.equal(ready.kind, 'lava');
  assert.equal(ready.rng, 'xorshift32'); assert.equal(ready.clock, 'original-AI-then-child-then-existing-effects'); assert.equal(ready.nativeScheduling, false);
  assert.equal(complete?.type, 'complete'); assert.equal(complete.kind, 'lava'); assert.equal(complete.ok, true);
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
    boundary.spawnEnemy('lava');
    const enemy = simulation.state.enemies[0];
    for (const key of ['x', 'y', 'frame', 'speed', 'knockBack', 'hp'] as const) if (config[key] !== undefined) enemy[key] = config[key]!;
    if (config.attacking !== undefined) enemy.attacking = config.attacking;
    enemy.shadowHit = shadowHitAtFrame('lava', enemy.frame, enemy.shadowHit);
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
      check('alertCalls', Number(enemy.alerted), sample.alertCalls);
      check('nextAlertIsTarget', simulation.state.partyAI.nextAlertUid === enemy.uid, sample.nextAlertIsTarget);
      check('drawCount', draws, sample.drawCount); check('rngState', simulation.state.rng, sample.rngState);
      check('damageEvents', damageEvents, sample.damageEvents);
      comparisons.push({ scenario, step: sample.step!, matched: !differences.length, differences });
    }
  }
  const geometry = options.geometry ?? JSON.parse(readFileSync(new URL('../public/assets/collision-geometry.json', import.meta.url), 'utf8')) as CollisionGeometry;
  const grids = records.filter(record => record.type === 'geometry');
  assert.deepEqual(grids.map(record => [record.requestedFrame, record.afterAttack, record.fractional]),
    [1, 4, 15, 23, 34, 35, 50, 98, 128].map(frame => [frame, frame >= 23 && frame < 98, false])
      .concat([[98, true, false], [128, true, false], [4, false, true]]));
  const geometryComparisons = grids.map(grid => {
    assert.equal(grid.width, 80); assert.equal(grid.height, 80); assert.equal(grid.bits!.length, 6400); assert.equal(grid.shadowBits!.length, 6400);
    const shadowHit = shadowHitAtFrame('lava', grid.frame!, grid.afterAttack ? shadowHitAtFrame('lava', 23, true) : true); assert.equal(shadowHit, grid.shadowHit);
    const mismatches: { x: number; y: number; expected: boolean; actual: boolean }[] = [];
    const enemy = { kind: 'lava' as const, x: grid.x!, y: grid.y!, frame: grid.frame!, shadowHit };
    for (let index = 0; index < grid.bits!.length; index++) {
      const x = grid.gridX! + index % grid.width!, y = grid.gridY! + Math.floor(index / grid.width!);
      const expected = grid.bits![index] === '1' && (shadowHit || grid.shadowBits![index] !== '1');
      const actual = ordinaryEnemyHit(enemy, x, y, geometry);
      if (actual !== expected) mismatches.push({ x, y, expected, actual });
    }
    return { afterAttack: grid.afterAttack!, frame: grid.frame!, shadowHit, points: grid.bits!.length, matched: !mismatches.length, mismatches };
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
