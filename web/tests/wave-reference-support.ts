import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { ENEMIES, FIRST_DAY } from '../src/content.ts';
import { Simulation } from '../src/simulation.ts';

interface ReferenceWave { index: number; enemies: number[]; delays: number[]; initialCount: number }
export interface WaveReferenceRecord {
  version: number; type: string; kind?: string; seeds?: number[]; rng?: string; clock?: string;
  ok?: boolean; snapshots?: number; seed?: number; missionLevel?: number; day?: number;
  bossWave?: number; drawCount?: number; rngState?: number; waves?: ReferenceWave[];
  loot?: number[]; powerOrg?: number; reward?: number; spawnRate?: number;
}

interface Difference { field: string; expected: unknown; actual: unknown }

function capturePortGeneration(seed: number) {
  const prototype = Simulation.prototype as unknown as { random(): number };
  const originalRandom = prototype.random;
  let drawCount = 0;
  // Счётчик перехватывает реальные вызовы порта, не воспроизводя его алгоритм в тесте.
  prototype.random = function (this: Simulation): number {
    drawCount++;
    return originalRandom.call(this);
  };
  try {
    const simulation = new Simulation(seed);
    const state = simulation.state;
    return {
      missionLevel: FIRST_DAY.missionLevel, day: state.day, bossWave: state.bossWave,
      drawCount, rngState: state.rng, powerOrg: FIRST_DAY.power,
      reward: FIRST_DAY.reward, spawnRate: FIRST_DAY.spawnRate, loot: state.loot,
      waves: state.waves.map((wave, index) => ({
        index, enemies: wave.enemies.map(kind => ENEMIES[kind].id),
        delays: wave.delays, initialCount: wave.initialCount,
      })),
    };
  } finally {
    prototype.random = originalRandom;
  }
}

export function compareWaveTrace(records: WaveReferenceRecord[]) {
  const ready = records[0];
  assert.equal(ready?.type, 'ready', 'The original did not identify its wave fixture.');
  assert.equal(ready.version, 1); assert.equal(ready.kind, 'waves');
  assert.equal(ready.rng, 'xorshift32');
  assert.equal(ready.clock, 'synchronous-original-generation');
  assert.deepEqual(ready.seeds, [42, 1, 3735928559]);
  const completed = records.at(-1);
  assert.equal(completed?.type, 'complete'); assert.equal(completed.kind, 'waves');
  assert.equal(completed.ok, true); assert.deepEqual(completed.seeds, ready.seeds);
  const snapshots = records.filter(record => record.type === 'snapshot');
  assert.equal(snapshots.length, 3); assert.equal(completed.snapshots, snapshots.length);
  assert.equal(records.length, snapshots.length + 2, 'Unexpected original trace record.');
  assert.deepEqual(snapshots.map(record => record.seed), ready.seeds);

  const comparisons = snapshots.map(record => {
    assert.equal(record.version, 1); assert.equal(record.kind, 'waves');
    assert.equal(record.missionLevel, 0); assert.equal(record.day, 1);
    assert.ok(Number.isInteger(record.drawCount) && record.drawCount! > 0);
    assert.ok(Number.isInteger(record.rngState) && record.rngState! >= 0 && record.rngState! <= 0xffffffff);
    assert.equal(record.waves?.length, 5);
    record.waves.forEach((wave, index) => {
      assert.equal(wave.index, index);
      assert.equal(wave.enemies.length, wave.delays.length);
      assert.equal(wave.initialCount, wave.enemies.length);
      assert.ok(wave.enemies.every(id => Number.isInteger(id) && id > 0));
      assert.ok(wave.delays.every(delay => Number.isInteger(delay) && delay > 0));
    });
    assert.ok(Array.isArray(record.loot) && record.loot.every(Number.isInteger));
    const actual = capturePortGeneration(record.seed!);
    const differences: Difference[] = [];
    // Ожидаемые массивы и состояние генератора читаются только из захваченного исходного SWF.
    for (const field of ['missionLevel', 'day', 'bossWave', 'drawCount', 'rngState', 'powerOrg', 'reward', 'spawnRate', 'loot', 'waves'] as const) {
      if (!isDeepStrictEqual(actual[field], record[field])) differences.push({ field, expected: record[field], actual: actual[field] });
    }
    return {
      seed: record.seed!, matched: differences.length === 0,
      originalDrawCount: record.drawCount!, portDrawCount: actual.drawCount,
      originalRngState: record.rngState!, portRngState: actual.rngState,
      enemyCount: record.waves.reduce((total, wave) => total + wave.initialCount, 0), differences,
    };
  });
  return {
    status: comparisons.every(comparison => comparison.matched) ? 'passed' as const : 'failed' as const,
    matchedSnapshots: comparisons.filter(comparison => comparison.matched).length,
    comparisons,
  };
}
