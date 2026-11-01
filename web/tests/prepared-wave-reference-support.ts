import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { ENEMIES } from '../src/content.ts';
import { generateLowLevelMission, generateLowLevelWaves } from '../src/missions.ts';

interface ReferenceRecord { [key: string]: unknown; type: string; version: number }
interface Difference { field: string; expected: unknown; actual: unknown }

function capturePreparation(seed: number) {
  let state = seed >>> 0 || 1, drawCount = 0;
  const random = () => {
    let value = state | 0;
    value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
    state = value >>> 0; drawCount++;
    return state / 4294967296;
  };
  const missionBefore = generateLowLevelMission(1, 1, random);
  const preparationDrawCount = drawCount, preparationRngState = state;
  const generated = generateLowLevelWaves(missionBefore, 2, random);
  return {
    missionLevel: missionBefore.level, day: 2, preparationDay: 1,
    bossWave: missionBefore.bossWave, drawCount, rngState: state,
    powerOrg: missionBefore.powerOrg, reward: missionBefore.reward, spawnRate: missionBefore.spawnRate,
    loot: missionBefore.loot, missionBefore,
    missionAfter: { ...missionBefore, power: generated.power, group: generated.group },
    preparationDrawCount, preparationRngState,
    waves: generated.waves.map((wave, index) => ({ index, enemies: wave.enemies.map(kind => ENEMIES[kind].id), delays: wave.delays, initialCount: wave.initialCount })),
  };
}

export function comparePreparedWaveTrace(records: ReferenceRecord[]) {
  const ready = records[0], complete = records.at(-1);
  assert.equal(ready?.version, 1); assert.equal(ready.type, 'ready'); assert.equal(ready.kind, 'prepared-waves');
  assert.equal(ready.rng, 'xorshift32'); assert.equal(ready.clock, 'synchronous-original-prepared-waves');
  assert.deepEqual(ready.seeds, [42, 1, 3735928559]);
  assert.equal(complete?.type, 'complete'); assert.equal(complete.kind, 'prepared-waves'); assert.equal(complete.ok, true);
  assert.deepEqual(complete.seeds, ready.seeds); assert.equal(complete.snapshots, 3);
  const snapshots = records.filter(record => record.type === 'snapshot');
  assert.equal(snapshots.length, 3); assert.equal(records.length, 5);
  assert.deepEqual(snapshots.map(record => record.seed), ready.seeds);
  const comparisons = snapshots.map(record => {
    assert.equal(record.version, 1); assert.equal(record.kind, 'prepared-waves');
    assert.equal(record.missionLevel, 1); assert.equal(record.day, 2); assert.equal(record.preparationDay, 1);
    assert.ok(Number.isInteger(record.drawCount) && Number(record.drawCount) > 2);
    assert.equal(record.preparationDrawCount, 2);
    const actual = capturePreparation(Number(record.seed));
    const differences: Difference[] = [];
    // Все ожидаемые поля получены из исходного SWF, включая дробные задержки.
    for (const field of Object.keys(actual) as (keyof typeof actual)[]) {
      if (!isDeepStrictEqual(actual[field], record[field])) differences.push({ field, expected: record[field], actual: actual[field] });
    }
    return { seed: Number(record.seed), matched: differences.length === 0, originalDrawCount: Number(record.drawCount), portDrawCount: actual.drawCount, differences };
  });
  return { status: comparisons.every(row => row.matched) ? 'passed' as const : 'failed' as const, matchedSnapshots: comparisons.filter(row => row.matched).length, comparisons };
}
