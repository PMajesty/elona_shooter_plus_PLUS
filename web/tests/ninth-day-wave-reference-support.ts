import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { ENEMIES } from '../src/content.ts';
import { generateLowLevelMission, generateLowLevelWaves } from '../src/missions.ts';

interface Selection { wave: number; requestedLevel: number; budget: number; flags: string[]; ids: number[]; drawBefore: number; drawAfter: number; fallback: boolean }
export interface NinthDayWaveRecord {
  [key: string]: unknown; type: string; version: number;
  seed?: number; mode?: string; constantValue?: number | null; randomPrefix?: number[];
  drawValues?: number[]; selections?: Selection[];
  branches?: { wave: number; debugGroup: string; drawAfter: number; fallback: boolean }[];
  waves?: { index: number; enemies: number[]; delays: number[]; initialCount: number }[];
}
interface Difference { field: string; expected: unknown; actual: unknown }

function captureGeneration(record: NinthDayWaveRecord, wrapRandom: (random: () => number) => () => number) {
  let state = record.seed! >>> 0 || 1, drawCount = 0;
  const drawValues: number[] = [];
  const random = () => {
    const index = drawCount++;
    let result: number;
    if (index < record.randomPrefix!.length) result = record.randomPrefix![index];
    else if (record.constantValue !== null) result = record.constantValue!;
    else {
      let value = state | 0;
      value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
      state = value >>> 0; result = state / 4294967296;
    }
    drawValues.push(result); return result;
  };
  const inputRandom = wrapRandom(random);
  const missionBefore = generateLowLevelMission(8, 8, inputRandom);
  const preparationDrawCount = drawCount, preparationRngState = state;
  const generated = generateLowLevelWaves(missionBefore, 9, inputRandom);
  return {
    missionLevel: missionBefore.level, day: 9, preparationDay: 8,
    bossWave: missionBefore.bossWave, drawCount, drawValues, rngState: state,
    powerOrg: missionBefore.powerOrg, reward: missionBefore.reward, spawnRate: missionBefore.spawnRate,
    loot: missionBefore.loot, missionBefore,
    missionAfter: { ...missionBefore, power: generated.power, group: generated.group },
    preparationDrawCount, preparationRngState,
    waves: generated.waves.map((wave, index) => ({ index, enemies: wave.enemies.map(kind => ENEMIES[kind].id), delays: wave.delays, initialCount: wave.initialCount })),
  };
}

export function compareNinthDayWaveTrace(records: NinthDayWaveRecord[], wrapRandom: (random: () => number) => () => number = random => random) {
  const ready = records[0], complete = records.at(-1);
  assert.equal(ready.type, 'ready'); assert.equal(ready.kind, 'ninth-day-waves'); assert.equal(ready.version, 1);
  assert.equal(ready.rng, 'xorshift32'); assert.equal(ready.clock, 'synchronous-original-ninth-day-waves');
  assert.deepEqual(ready.seeds, [42, 1, 3735928559, 6]); assert.deepEqual(ready.constantCases, [0, 0.199999, 0.2, 0.99]);
  assert.deepEqual(ready.prefixCases, [[0.5, 0.5, 0.5, 0], [0.5, 0.5, 0.5, 0.5, 0]]);
  assert.equal(complete?.type, 'complete'); assert.equal(complete?.kind, 'ninth-day-waves'); assert.equal(complete?.ok, true); assert.equal(complete?.snapshots, 12);
  const snapshots = records.filter(row => row.type === 'snapshot');
  assert.equal(records.length, 14);
  assert.deepEqual(snapshots.map(row => [row.seed, row.mode, row.constantValue]), [[42, 'xorshift32', null], [1, 'xorshift32', null], [3735928559, 'xorshift32', null], [6, 'xorshift32', null], [42, 'constant-zero', 0], [42, 'ranged-below-threshold', 0.199999], [42, 'ranged-at-threshold', 0.2], [42, 'constant-high', 0.99], [42, 'scripted-batch1', 0], [42, 'scripted-ranged', 0], [42, 'fallback-barbarian-at', 0], [42, 'fallback-barbarian-above', 0]]);
  const comparisons = snapshots.map(record => {
    assert.equal(record.version, 1); assert.equal(record.kind, 'ninth-day-waves');
    assert.equal(record.missionLevel, 8); assert.equal(record.day, 9); assert.equal(record.preparationDay, 8);
    assert.equal(record.preparationDrawCount, 2);
    assert.deepEqual(record.randomPrefix, record.mode === 'scripted-batch1' ? [0.5, 0.5, 0.5, 0] : record.mode === 'scripted-ranged' ? [0.5, 0.5, 0.5, 0.5, 0] : record.mode!.startsWith('fallback-barbarian-') ? [0.5, 0.5, 0.5, 0.5, 0, ...Array(26).fill(0), record.mode === 'fallback-barbarian-at' ? 0.5 : 0.500001] : []);
    assert.equal(record.branches!.length, 5);
    for (let wave = 0; wave < 5; wave++) {
      const branch = record.branches![wave];
      assert.equal(branch.wave, wave);
      const air = branch.debugGroup.includes('(Air   )');
      const batch = branch.debugGroup.includes('(BATCH1)');
      const ranged = branch.debugGroup.includes('(RANGED)');
      assert.ok(air || batch || ranged || branch.debugGroup.includes('(RANDOM)'));
      const selections = record.selections!.filter(row => row.wave === wave);
      assert.deepEqual(selections.map(row => row.budget), air ? [20, 20, 20, 20, 20] : batch ? [40, 20, 60] : ranged ? [10, 30, 20, 15, 15] : [15, 15, 20, 20, 15, 15]);
      assert.deepEqual(selections.map(row => row.flags), air ? [['AIR'], ['AIR'], ['AIR'], ['AIR'], ['AIR']] : batch ? [['BATCH'], [], ['BATCH']] : ranged ? [[], ['RANGED'], [], [], ['RANGED']] : [['BATCH'], [], ['BATCH'], [], [], ['BATCH']]);
      assert.equal(selections[batch ? 1 : ranged ? 2 : 3].requestedLevel, 10);
      if (record.mode === 'scripted-batch1') assert.equal(wave === 0 ? batch : air, true);
      else if (record.mode === 'scripted-ranged' || record.mode!.startsWith('fallback-barbarian-')) assert.equal(wave === 0 ? ranged : air, true);
      else if (record.constantValue !== null) { assert.equal(air, record.constantValue! < 0.1); assert.equal(ranged, record.constantValue! >= 0.1 && record.constantValue! < 0.2); assert.equal(batch, false); }
    }
    const actual = captureGeneration(record, wrapRandom);
    const differences: Difference[] = [];
    for (const field of Object.keys(actual) as (keyof typeof actual)[]) if (!isDeepStrictEqual(actual[field], record[field])) differences.push({ field, expected: record[field], actual: actual[field] });
    return { seed: record.seed!, mode: record.mode!, matched: differences.length === 0, originalDrawCount: Number(record.drawCount), portDrawCount: actual.drawCount, differences };
  });
  return { status: comparisons.every(row => row.matched) ? 'passed' as const : 'failed' as const, matchedSnapshots: comparisons.filter(row => row.matched).length, comparisons };
}
