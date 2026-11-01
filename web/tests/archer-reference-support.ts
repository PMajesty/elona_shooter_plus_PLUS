import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { Simulation, type EnemyState } from '../src/simulation.ts';
import { advanceEnemyArrow, type EnemyArrowState } from '../src/enemy-arrows.ts';
import { ordinaryEnemyHit, type CollisionGeometry } from '../src/collision.ts';
import { ARCHER_DISPLAY_WIDTHS } from '../src/enemy-display-bounds.ts';

interface ArcherConfiguration {
  name: string; seed: number; steps: number; x?: number; frame?: number;
  attacking?: boolean; attacked?: boolean; speed?: number; counter?: number; knockBack?: number; hp?: number;
}
interface ArcherObservation {
  x: number; y: number; hp: number; speed: number; speedOrg: number; attack: number;
  gold: number; exp: number; counter: number; knockBack: number; attacking: boolean;
  attacked: boolean; frame: number; shadowHit: boolean; deathTicks: number; width: number;
}
export interface ArcherReferenceRecord {
  version: number; type: string; kind: string; rng?: string; clock?: string; nativeScheduling?: boolean;
  scenario?: string; step?: number; config?: ArcherConfiguration; enemy?: ArcherObservation;
  arrows?: Omit<EnemyArrowState, 'uid'>[]; castleHp?: number; drawCount?: number; rngState?: number; error?: string;
  frame?: number; x?: number; y?: number; gridX?: number; gridY?: number; width?: number; height?: number; bits?: string;
  ok?: boolean; snapshots?: number; geometryGrids?: number;
}
interface Boundary { random(): number; spawnEnemy(kind: 'archer'): void; tickEnemy(enemy: EnemyState): void }
interface Difference { field: string; expected: unknown; actual: unknown }
const SCENARIOS = [
  ['opening_counter', 250], ['ranged_repeat', 160], ['knockback_interrupt', 50],
  ['left_edge_knockback', 12], ['death_stop', 40],
] as const;

function projectEnemy(enemy: EnemyState): ArcherObservation {
  return {
    x: enemy.x, y: enemy.y, hp: enemy.hp, speed: enemy.speed, speedOrg: enemy.speedOrg,
    attack: enemy.attack, gold: enemy.gold, exp: enemy.exp, counter: enemy.rangedCounter!,
    knockBack: enemy.knockBack, attacking: enemy.attacking, attacked: enemy.attacked,
    frame: enemy.frame, shadowHit: enemy.shadowHit, deathTicks: enemy.deathTicks,
    width: ARCHER_DISPLAY_WIDTHS[enemy.frame],
  };
}

export function compareArcherTrace(records: ArcherReferenceRecord[], options: {
  advanceArrow?: typeof advanceEnemyArrow; geometry?: CollisionGeometry;
} = {}) {
  const ready = records[0], complete = records.at(-1);
  assert.equal(ready?.version, 1); assert.equal(ready.type, 'ready'); assert.equal(ready.kind, 'archer');
  assert.equal(ready.rng, 'xorshift32');
  assert.equal(ready.clock, 'original-AI-then-explicit-child-frame-then-existing-arrows');
  assert.equal(ready.nativeScheduling, false);
  assert.equal(complete?.type, 'complete'); assert.equal(complete.kind, 'archer'); assert.equal(complete.ok, true);
  assert.equal(complete.snapshots, 517); assert.equal(complete.geometryGrids, 6); assert.equal(records.length, 525);
  const snapshots = records.filter(record => record.type === 'snapshot');
  assert.equal(snapshots.length, 517);
  assert.deepEqual(snapshots.map(record => [record.scenario, record.step]), SCENARIOS.flatMap(([name, steps]) => Array.from({ length: steps + 1 }, (_, step) => [name, step])));
  const comparisons: { scenario: string; step: number; matched: boolean; originalError: string; originalWidth: number; differences: Difference[] }[] = [];
  for (const [scenario] of SCENARIOS) {
    const samples = snapshots.filter(record => record.scenario === scenario);
    const config = samples[0].config!;
    assert.equal(config.name, scenario);
    const simulation = new Simulation(1);
    const boundary = simulation as unknown as Boundary;
    simulation.state.rng = config.seed;
    simulation.state.enemies = []; simulation.state.enemyArrows = [];
    simulation.state.castleHp = 40; simulation.state.castleMaxHp = 40;
    simulation.state.activeMission.absorbFix = 0;
    let draws = 0;
    const originalRandom = boundary.random.bind(simulation);
    boundary.random = () => { draws++; return originalRandom(); };
    boundary.spawnEnemy('archer');
    const enemy = simulation.state.enemies[0];
    for (const key of ['x', 'frame', 'attacking', 'attacked', 'speed', 'knockBack', 'hp'] as const) {
      if (config[key] !== undefined) Object.assign(enemy, { [key]: config[key] });
    }
    if (config.counter !== undefined) enemy.rangedCounter = config.counter;
    for (const sample of samples) {
      assert.deepEqual(sample.config, config);
      assert.equal(sample.kind, 'archer'); assert.equal(sample.version, 1);
      if (sample.step! > 0) {
        // Сценарий эталона сначала вызывает AI/кадр, затем только стрелы, существовавшие до шага.
        const existingArrows = simulation.state.enemyArrows.slice();
        boundary.tickEnemy(enemy);
        for (const arrow of existingArrows) if (!arrow.removed) (options.advanceArrow ?? advanceEnemyArrow)(arrow);
      }
      const differences: Difference[] = [];
      const check = (field: string, actual: unknown, expected: unknown) => {
        if (!isDeepStrictEqual(actual, expected)) differences.push({ field, expected, actual });
      };
      for (const [key, value] of Object.entries(projectEnemy(enemy))) check(`enemy.${key}`, value, sample.enemy![key as keyof ArcherObservation]);
      check('arrows', simulation.state.enemyArrows.map(({ uid: _uid, ...arrow }) => arrow), sample.arrows);
      check('castleHp', simulation.state.castleHp, sample.castleHp);
      check('drawCount', draws, sample.drawCount); check('rngState', simulation.state.rng, sample.rngState);
      comparisons.push({ scenario, step: sample.step!, matched: differences.length === 0, originalError: sample.error!, originalWidth: sample.enemy!.width, differences });
    }
  }
  const geometry = options.geometry ?? JSON.parse(readFileSync(new URL('../public/assets/collision-geometry.json', import.meta.url), 'utf8')) as CollisionGeometry;
  const grids = records.filter(record => record.type === 'geometry');
  assert.deepEqual(grids.map(grid => grid.frame), [1, 5, 28, 59, 94, 125]);
  const geometryComparisons = grids.map(grid => {
    assert.equal(grid.kind, 'archer'); assert.equal(grid.version, 1);
    assert.equal(grid.bits!.length, grid.width! * grid.height!);
    const mismatches: { x: number; y: number; expected: boolean; actual: boolean }[] = [];
    for (let index = 0; index < grid.bits!.length; index++) {
      const x = grid.gridX! + index % grid.width!, y = grid.gridY! + Math.floor(index / grid.width!);
      const actual = ordinaryEnemyHit({ kind: 'archer', x: grid.x!, y: grid.y!, frame: grid.frame!, shadowHit: true }, x, y, geometry);
      const expected = grid.bits![index] === '1';
      if (actual !== expected) mismatches.push({ x, y, expected, actual });
    }
    return { frame: grid.frame!, points: grid.bits!.length, matched: mismatches.length === 0, mismatches };
  });
  const sourceErrors = comparisons.filter(row => row.originalError).map(row => ({ scenario: row.scenario, step: row.step, error: row.originalError }));
  return {
    status: comparisons.every(row => row.matched) && geometryComparisons.every(row => row.matched) ? 'passed' as const : 'failed' as const,
    matchedSnapshots: comparisons.filter(row => row.matched).length, comparedSnapshots: comparisons.length,
    matchedGeometryGrids: geometryComparisons.filter(row => row.matched).length,
    comparedGeometryPoints: geometryComparisons.reduce((sum, row) => sum + row.points, 0),
    sourceErrors, comparisons, geometryComparisons,
  };
}
