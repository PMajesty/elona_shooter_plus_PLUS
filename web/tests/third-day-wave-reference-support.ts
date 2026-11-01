import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { ENEMIES } from '../src/content.ts';
import { generateLowLevelMission, generateLowLevelWaves } from '../src/missions.ts';

interface Selection { wave: number; requestedLevel: number; budget: number; flags: string[]; ids: number[]; drawBefore: number; drawAfter: number }
export interface ThirdDayWaveRecord {
  [key: string]: unknown; type: string; version: number;
  seed?: number; mode?: string; constantValue?: number | null;
  selections?: Selection[];
  waves?: { index: number; enemies: number[]; delays: number[]; initialCount: number }[];
}
interface Difference { field: string; expected: unknown; actual: unknown }

function captureGeneration(record: ThirdDayWaveRecord) {
  let state = record.seed! >>> 0 || 1, drawCount = 0;
  const random = () => {
    drawCount++;
    if (record.constantValue !== null) return record.constantValue!;
    let value = state | 0;
    value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
    state = value >>> 0;
    return state / 4294967296;
  };
  const missionBefore = generateLowLevelMission(2, 2, random);
  const preparationDrawCount = drawCount, preparationRngState = state;
  const generated = generateLowLevelWaves(missionBefore, 3, random);
  return {
    missionLevel: missionBefore.level, day: 3, preparationDay: 2,
    bossWave: missionBefore.bossWave, drawCount, rngState: state,
    powerOrg: missionBefore.powerOrg, reward: missionBefore.reward, spawnRate: missionBefore.spawnRate,
    loot: missionBefore.loot, missionBefore,
    missionAfter: { ...missionBefore, power: generated.power, group: generated.group },
    preparationDrawCount, preparationRngState,
    waves: generated.waves.map((wave, index) => ({ index, enemies: wave.enemies.map(kind => ENEMIES[kind].id), delays: wave.delays, initialCount: wave.initialCount })),
  };
}

export function compareThirdDayWaveTrace(records: ThirdDayWaveRecord[]) {
  const ready = records[0], complete = records.at(-1);
  assert.equal(ready.type, 'ready'); assert.equal(ready.kind, 'third-day-waves'); assert.equal(ready.version, 1);
  assert.equal(ready.rng, 'xorshift32'); assert.equal(ready.clock, 'synchronous-original-third-day-waves');
  assert.deepEqual(ready.seeds, [42, 1, 3735928559]); assert.deepEqual(ready.constantCases, [0, 0.99]);
  assert.equal(complete?.type, 'complete'); assert.equal(complete?.kind, 'third-day-waves'); assert.equal(complete?.ok, true); assert.equal(complete?.snapshots, 5);
  const snapshots = records.filter(row => row.type === 'snapshot');
  assert.equal(records.length, 7);
  assert.deepEqual(snapshots.map(row => [row.seed, row.mode, row.constantValue]), [[42, 'xorshift32', null], [1, 'xorshift32', null], [3735928559, 'xorshift32', null], [42, 'constant-zero', 0], [42, 'constant-high', 0.99]]);
  const comparisons = snapshots.map(record => {
    assert.equal(record.version, 1); assert.equal(record.kind, 'third-day-waves');
    assert.equal(record.missionLevel, 2); assert.equal(record.day, 3); assert.equal(record.preparationDay, 2);
    assert.equal(record.preparationDrawCount, 2);
    assert.equal(record.selections!.length, 30);
    for (let wave = 0; wave < 5; wave++) {
      const selections = record.selections!.filter(row => row.wave === wave);
      assert.deepEqual(selections.map(row => row.budget), [15, 15, 20, 20, 15, 15]);
      assert.deepEqual(selections.map(row => row.flags), [['BATCH'], [], ['BATCH'], [], [], ['BATCH']]);
      assert.equal(selections[3].requestedLevel, 4);
    }
    const actual = captureGeneration(record);
    const differences: Difference[] = [];
    for (const field of Object.keys(actual) as (keyof typeof actual)[]) if (!isDeepStrictEqual(actual[field], record[field])) differences.push({ field, expected: record[field], actual: actual[field] });
    return { seed: record.seed!, mode: record.mode!, matched: differences.length === 0, originalDrawCount: Number(record.drawCount), portDrawCount: actual.drawCount, differences };
  });
  return { status: comparisons.every(row => row.matched) ? 'passed' as const : 'failed' as const, matchedSnapshots: comparisons.filter(row => row.matched).length, comparisons };
}
