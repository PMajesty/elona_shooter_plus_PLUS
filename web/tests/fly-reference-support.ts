import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { Simulation, type EnemyState } from '../src/simulation.ts';
import { ENEMIES } from '../src/content.ts';
import { FLY_DISPLAY_WIDTHS } from '../src/enemy-display-bounds.ts';
import { ordinaryEnemyHit, shadowHitAtFrame, type CollisionGeometry } from '../src/collision.ts';

interface Configuration {
  name: string; seed: number; steps: number; x?: number; y?: number; frame?: number;
  counter?: number; knockBack?: number; hp?: number; previous?: number; corrected?: boolean;
}
interface Observation {
  x: number; y: number; hp: number; speed: number; speedOrg: number; attack: number;
  gold: number; exp: number; counter: number; resKnock: number; knockBack: number;
  attacking: boolean; attacked: boolean; frame: number; shadowHit: boolean;
  deathTicks: number; width: number; removed: boolean;
}
export interface FlyReferenceRecord {
  version: number; type: string; kind: string; rng?: string; clock?: string; nativeScheduling?: boolean;
  scenario?: string; step?: number; config?: Configuration; prior?: Observation | null; enemy?: Observation;
  castleHp?: number; drawCount?: number; rngState?: number; error?: string;
  frame?: number; x?: number; y?: number; gridX?: number; gridY?: number;
  width?: number; height?: number; bits?: string; shadowBits?: string; shadowHit?: boolean;
  ok?: boolean; snapshots?: number; geometryGrids?: number;
}
interface Boundary { random(): number; spawnEnemy(kind: 'fly'): void; tickEnemy(enemy: EnemyState): void }
interface Difference { field: string; expected: unknown; actual: unknown }
const SCENARIOS = [
  ['fresh_cycles', 150], ['counter_boundary', 50], ['castle_exit', 3], ['left_knockback', 12], ['death_fall', 210],
  ['reuse_fly_raw', 60], ['reuse_fly_corrected', 60], ['reuse_sheep_raw', 3], ['reuse_sheep_corrected', 3],
  ['reuse_rat_raw', 3], ['reuse_rat_corrected', 3], ['reuse_boss_raw', 3], ['reuse_boss_corrected', 3],
] as const;

function project(enemy: EnemyState): Observation {
  return {
    x: enemy.x, y: enemy.y, hp: enemy.hp, speed: enemy.speed, speedOrg: enemy.speedOrg, attack: enemy.attack,
    gold: enemy.gold, exp: enemy.exp, counter: enemy.flyCounter!, resKnock: ENEMIES.fly.knockResistance,
    knockBack: enemy.knockBack, attacking: enemy.attacking, attacked: enemy.attacked, frame: enemy.frame,
    shadowHit: enemy.shadowHit, deathTicks: enemy.deathTicks, width: FLY_DISPLAY_WIDTHS[enemy.frame], removed: enemy.removed,
  };
}

export function compareFlyTrace(records: FlyReferenceRecord[], options: {
  step?: (simulation: Simulation, enemy: EnemyState) => void; geometry?: CollisionGeometry;
} = {}) {
  const ready = records[0], complete = records.at(-1);
  assert.equal(ready?.version, 1); assert.equal(ready.type, 'ready'); assert.equal(ready.kind, 'fly');
  assert.equal(ready.rng, 'xorshift32'); assert.equal(ready.clock, 'original-AI-then-explicit-child-frame'); assert.equal(ready.nativeScheduling, false);
  assert.equal(complete?.type, 'complete'); assert.equal(complete.kind, 'fly'); assert.equal(complete.ok, true);
  assert.equal(complete.snapshots, 576); assert.equal(complete.geometryGrids, 8); assert.equal(records.length, 586);
  const snapshots = records.filter(record => record.type === 'snapshot');
  assert.deepEqual(snapshots.map(record => [record.scenario, record.step]), SCENARIOS.flatMap(([name, count]) => Array.from({ length: count + 1 }, (_, step) => [name, step])));
  const comparisons: { scenario: string; step: number; matched: boolean; differences: Difference[] }[] = [];
  const raw = snapshots.filter(record => record.config!.previous !== undefined && !record.config!.corrected);
  assert.equal(raw.length, 73);
  for (const [scenario] of SCENARIOS) {
    const samples = snapshots.filter(record => record.scenario === scenario), config = samples[0].config!;
    assert.equal(config.name, scenario);
    for (const sample of samples) assert.deepEqual(sample.config, config);
    // Не выдаём исходный дефект повторно используемого объекта за поведение исправленного спавна.
    if (config.previous !== undefined && !config.corrected) continue;
    const simulation = new Simulation(1), boundary = simulation as unknown as Boundary;
    simulation.state.rng = config.seed; simulation.state.enemies = [];
    simulation.state.castleHp = 40; simulation.state.castleMaxHp = 40; simulation.state.activeMission.absorbFix = 0;
    let draws = 0;
    const random = boundary.random.bind(simulation);
    boundary.random = () => { draws++; return random(); };
    boundary.spawnEnemy('fly');
    const enemy = simulation.state.enemies[0];
    for (const key of ['x', 'y', 'frame', 'knockBack', 'hp'] as const) if (config[key] !== undefined) enemy[key] = config[key]!;
    if (config.counter !== undefined) enemy.flyCounter = config.counter;
    for (const sample of samples) {
      if (sample.step! > 0 && !enemy.removed) (options.step ?? ((_simulation, actor) => boundary.tickEnemy(actor)))(simulation, enemy);
      const differences: Difference[] = [];
      const check = (field: string, actual: unknown, expected: unknown) => {
        if (!isDeepStrictEqual(actual, expected)) differences.push({ field, expected, actual });
      };
      for (const [key, value] of Object.entries(project(enemy))) check(`enemy.${key}`, value, sample.enemy![key as keyof Observation]);
      check('castleHp', simulation.state.castleHp, sample.castleHp);
      check('drawCount', draws, sample.drawCount); check('rngState', simulation.state.rng, sample.rngState);
      comparisons.push({ scenario, step: sample.step!, matched: !differences.length, differences });
    }
  }
  const rawReuseEvidence = (['fly', 'sheep', 'rat', 'boss'] as const).map(kind => {
    const rawSamples = snapshots.filter(row => row.scenario === `reuse_${kind}_raw`);
    const corrected = snapshots.filter(row => row.scenario === `reuse_${kind}_corrected`);
    assert.equal(rawSamples.length, corrected.length);
    const firstRaw = rawSamples[0], firstCorrected = corrected[0];
    assert.deepEqual(firstRaw.prior, firstCorrected.prior);
    assert.equal(firstRaw.rngState, firstCorrected.rngState); assert.equal(firstRaw.drawCount, firstCorrected.drawCount);
    const changedInitialFields = Object.keys(firstRaw.enemy!).filter(key => !isDeepStrictEqual(firstRaw.enemy![key as keyof Observation], firstCorrected.enemy![key as keyof Observation]));
    assert.deepEqual(changedInitialFields, kind === 'fly' ? ['counter'] : ['resKnock']);
    assert.equal(firstCorrected.enemy!.counter, 0); assert.equal(firstCorrected.enemy!.resKnock, 1);
    return { previousKind: kind, previousId: firstRaw.config!.previous, rawSnapshots: rawSamples.length,
      correctedSnapshots: corrected.length, prior: firstRaw.prior, changedInitialFields,
      rawInitial: firstRaw.enemy, correctedInitial: firstCorrected.enemy,
      sourceChangedSteps: rawSamples.filter((sample, index) => !isDeepStrictEqual(sample.enemy, corrected[index].enemy)).length,
      comparedWithPort: false, reason: 'Raw pooled counter/resistance retained as defect evidence; explicit original field-reset cases are compared separately.' };
  });
  const geometry = options.geometry ?? JSON.parse(readFileSync(new URL('../public/assets/collision-geometry.json', import.meta.url), 'utf8')) as CollisionGeometry;
  const grids = records.filter(record => record.type === 'geometry');
  assert.deepEqual(grids.map(record => record.frame), [1, 3, 8, 12, 15, 22, 23, 41]);
  const geometryComparisons = grids.map(grid => {
    assert.equal(grid.width, 64); assert.equal(grid.height, 160);
    assert.equal(grid.bits!.length, 10240); assert.equal(grid.shadowBits!.length, 10240);
    let shadowHit = shadowHitAtFrame('fly', 1);
    // Те же входные переходы, что выполняет оригинальный диагностический драйвер.
    for (const frame of [12, 15, 23]) if (grid.frame! >= frame) shadowHit = shadowHitAtFrame('fly', frame, shadowHit);
    shadowHit = shadowHitAtFrame('fly', grid.frame!, shadowHit);
    assert.equal(shadowHit, grid.shadowHit);
    const mismatches: { x: number; y: number; predicate: string; expected: boolean; actual: boolean }[] = [];
    const enemy = { kind: 'fly' as const, x: grid.x!, y: grid.y!, frame: grid.frame!, shadowHit };
    for (let index = 0; index < grid.bits!.length; index++) {
      const x = grid.gridX! + index % grid.width!, y = grid.gridY! + Math.floor(index / grid.width!);
      const body = grid.bits![index] === '1';
      const expected = body && (shadowHit || grid.shadowBits![index] !== '1');
      const actual = ordinaryEnemyHit(enemy, x, y, geometry);
      if (actual !== expected) mismatches.push({ x, y, predicate: 'combined', expected, actual });
      const actualBody = ordinaryEnemyHit({ ...enemy, shadowHit: true }, x, y, geometry);
      if (actualBody !== body) mismatches.push({ x, y, predicate: 'body', expected: body, actual: actualBody });
    }
    return { frame: grid.frame!, shadowHit, points: grid.bits!.length, matched: !mismatches.length, mismatches };
  });
  const sourceErrors = snapshots.filter(record => record.error).map(({ scenario, step, error }) => ({ scenario, step, error }));
  return { status: comparisons.every(row => row.matched) && geometryComparisons.every(row => row.matched) && !sourceErrors.length ? 'passed' as const : 'failed' as const,
    matchedSnapshots: comparisons.filter(row => row.matched).length, comparedSnapshots: comparisons.length,
    rawReuseSnapshots: raw.length, originalSnapshots: snapshots.length,
    matchedGeometryGrids: geometryComparisons.filter(row => row.matched).length,
    comparedGeometryPoints: geometryComparisons.reduce((sum, row) => sum + row.points, 0),
    sourceErrors, comparisons, rawReuseEvidence, geometryComparisons };
}
