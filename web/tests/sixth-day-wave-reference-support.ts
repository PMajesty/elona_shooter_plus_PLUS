import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { ENEMIES } from '../src/content.ts';
import { generateLowLevelMission, generateLowLevelWaves } from '../src/missions.ts';

interface Selection { wave: number; requestedLevel: number; budget: number; flags: string[]; ids: number[]; drawBefore: number; drawAfter: number }
export interface SixthDayWaveRecord {
  [key: string]: unknown; type: string; version: number;
  seed?: number; mode?: string; constantValue?: number | null; randomPrefix?: number[];
  selections?: Selection[];
  branches?: { wave: number; debugGroup: string; drawAfter: number }[];
  waves?: { index: number; enemies: number[]; delays: number[]; initialCount: number }[];
}
interface Difference { field: string; expected: unknown; actual: unknown }

function captureGeneration(record: SixthDayWaveRecord) {
  let state = record.seed! >>> 0 || 1, drawCount = 0;
  const random = () => {
    const index = drawCount++;
    if (index < record.randomPrefix!.length) return record.randomPrefix![index];
    if (record.constantValue !== null) return record.constantValue!;
    let value = state | 0;
    value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
    state = value >>> 0;
    return state / 4294967296;
  };
  const missionBefore = generateLowLevelMission(5, 5, random);
  const preparationDrawCount = drawCount, preparationRngState = state;
  const generated = generateLowLevelWaves(missionBefore, 6, random);
  return {
    missionLevel: missionBefore.level, day: 6, preparationDay: 5,
    bossWave: missionBefore.bossWave, drawCount, rngState: state,
    powerOrg: missionBefore.powerOrg, reward: missionBefore.reward, spawnRate: missionBefore.spawnRate,
    loot: missionBefore.loot, missionBefore,
    missionAfter: { ...missionBefore, power: generated.power, group: generated.group },
    preparationDrawCount, preparationRngState,
    waves: generated.waves.map((wave, index) => ({ index, enemies: wave.enemies.map(kind => ENEMIES[kind].id), delays: wave.delays, initialCount: wave.initialCount })),
  };
}

export function compareSixthDayWaveTrace(records: SixthDayWaveRecord[]) {
  const ready = records[0], complete = records.at(-1);
  assert.equal(ready.type, 'ready'); assert.equal(ready.kind, 'sixth-day-waves'); assert.equal(ready.version, 1);
  assert.equal(ready.rng, 'xorshift32'); assert.equal(ready.clock, 'synchronous-original-sixth-day-waves');
  assert.deepEqual(ready.seeds, [42, 1, 3735928559, 2]); assert.deepEqual(ready.constantCases, [0, 0.099999, 0.1, 0.99]);
  assert.deepEqual(ready.prefixCases, [[0.5, 0.5, 0.5, 0]]);
  assert.equal(complete?.type, 'complete'); assert.equal(complete?.kind, 'sixth-day-waves'); assert.equal(complete?.ok, true); assert.equal(complete?.snapshots, 9);
  const snapshots = records.filter(row => row.type === 'snapshot');
  assert.equal(records.length, 11);
  assert.deepEqual(snapshots.map(row => [row.seed, row.mode, row.constantValue]), [[42, 'xorshift32', null], [1, 'xorshift32', null], [3735928559, 'xorshift32', null], [2, 'xorshift32', null], [42, 'constant-zero', 0], [42, 'constant-below-threshold', 0.099999], [42, 'constant-at-threshold', 0.1], [42, 'constant-high', 0.99], [42, 'scripted-batch1', 0]]);
  const comparisons = snapshots.map(record => {
    assert.equal(record.version, 1); assert.equal(record.kind, 'sixth-day-waves');
    assert.equal(record.missionLevel, 5); assert.equal(record.day, 6); assert.equal(record.preparationDay, 5);
    assert.equal(record.preparationDrawCount, 2);
    assert.deepEqual(record.randomPrefix, record.mode === 'scripted-batch1' ? [0.5, 0.5, 0.5, 0] : []);
    assert.equal(record.branches!.length, 5);
    for (let wave = 0; wave < 5; wave++) {
      const branch = record.branches![wave];
      assert.equal(branch.wave, wave);
      const air = branch.debugGroup.includes('(Air   )');
      const batch = branch.debugGroup.includes('(BATCH1)');
      assert.ok(air || batch || branch.debugGroup.includes('(RANDOM)'));
      const selections = record.selections!.filter(row => row.wave === wave);
      assert.deepEqual(selections.map(row => row.budget), air ? [20, 20, 20, 20, 20] : batch ? [40, 20, 60] : [15, 15, 20, 20, 15, 15]);
      assert.deepEqual(selections.map(row => row.flags), air ? [['AIR'], ['AIR'], ['AIR'], ['AIR'], ['AIR']] : batch ? [['BATCH'], [], ['BATCH']] : [['BATCH'], [], ['BATCH'], [], [], ['BATCH']]);
      assert.equal(selections[batch ? 1 : 3].requestedLevel, 7);
      if (record.mode === 'scripted-batch1') assert.equal(wave === 0 ? batch : air, true);
      else if (record.constantValue !== null) { assert.equal(air, record.constantValue! < 0.1); assert.equal(batch, false); }
    }
    const actual = captureGeneration(record);
    const differences: Difference[] = [];
    for (const field of Object.keys(actual) as (keyof typeof actual)[]) if (!isDeepStrictEqual(actual[field], record[field])) differences.push({ field, expected: record[field], actual: actual[field] });
    return { seed: record.seed!, mode: record.mode!, matched: differences.length === 0, originalDrawCount: Number(record.drawCount), portDrawCount: actual.drawCount, differences };
  });
  return { status: comparisons.every(row => row.matched) ? 'passed' as const : 'failed' as const, matchedSnapshots: comparisons.filter(row => row.matched).length, comparisons };
}
