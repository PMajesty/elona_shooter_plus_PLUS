import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { compareNinthTownTrace } from './ninth-town-reference-support.ts';
import { generateLowLevelMission } from '../src/missions.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-ninth-town-trace.json', import.meta.url), 'utf8'));

test('ninth-town preparation, first boss day, recruit/item thresholds and economy match22 original observations', () => {
  assert.equal(fixture.format, 'elona-original-ninth-town-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  assert.equal(fixture.instrumentedSwfSha256, 'a1c3c17dc902cdafbac783bd22fa3597555cdd8e8730d69270d25522103ca780');
  assert.equal(fixture.traceSha256, '397d9ee9aae7d2a9b79d8920b9eaaaccf1cbd94e71c3c905601110c84dff4399');
  assert.equal(createHash('sha256').update(JSON.stringify(fixture.records)).digest('hex'), fixture.traceSha256);
  const result = compareNinthTownTrace(fixture.records);
  assert.equal(result.status, 'passed'); assert.equal(result.matchedSnapshots, 22);
  const records = fixture.records as Record<string, any>[];
  for (const row of records.filter(row => row.type === 'snapshot' && !row.boundary)) {
    assert.equal(row.mission.wave, 6); assert.equal(row.mission.bossDay, true); assert.equal(row.mission.bossWave, 5);
    assert.deepEqual(row.mission.loot, [1035, 1110]); assert.equal(row.flags.specialSale, 0);
    assert.equal(row.mission.absorbFix, row.history === 'medal' ? 0.03 : 0);
  }
  const missions = records.filter(row => row.boundary === 'mission');
  assert.deepEqual(missions.map(row => row.drawCount), [2, 1, 2, 1]);
  assert.deepEqual(missions.map(row => row.mission.loot), [[], [1035, 1110], [1038], [1038, 1035, 1110]]);
  assert.deepEqual(records.filter(row => row.boundary === 'recruit-growth').map(row => row.recruit.lv), [2, 3, 3, 4]);
  assert.deepEqual(records.filter(row => row.boundary === 'weapon-variation').map(row => row.after.lv), [3, 2, 3, 3]);
  for (const row of records.filter(row => row.boundary === 'result')) {
    assert.equal(row.drawCount, 3); assert.equal(row.tax, 115); assert.equal(row.upkeep, 40);
    assert.equal(row.result.income, row.title === 1 ? 100 : 0);
    assert.equal(row.result.netReward, (row.noDamage ? 988 : 760) + row.result.income - 155);
  }
});

test('ninth-town comparison rejects an obsolete normal boss-wave draw even when mission fields remain correct', () => {
  const result = compareNinthTownTrace(fixture.records, undefined, undefined, (level, day, random, options) => {
    const mission = generateLowLevelMission(level, day, random, options);
    if (level === 9) random();
    return mission;
  });
  assert.equal(result.status, 'failed'); assert.equal(result.matchedSnapshots, 20);
  const failures = result.comparisons.filter(row => !row.matched);
  assert.deepEqual(failures.map(row => row.scenario), ['day9-boss', 'day9-optional']);
  for (const row of failures) assert.deepEqual(row.differences.map(difference => difference.field), ['drawCount', 'rngState']);
});

test('ninth-town comparison rejects reversed calendar guarantees without relying on changed RNG', () => {
  const result = compareNinthTownTrace(fixture.records, undefined, undefined, (level, day, random, options) => {
    const mission = generateLowLevelMission(level, day, random, options);
    if (day === 9) mission.loot.splice(mission.loot.length - 2, 2, 1110, 1035);
    return mission;
  });
  assert.equal(result.status, 'failed'); assert.equal(result.matchedSnapshots, 20);
  for (const row of result.comparisons.filter(row => !row.matched)) {
    assert.equal(row.boundary, 'mission'); assert.equal(row.originalDrawCount, row.portDrawCount);
    assert.deepEqual(row.differences.map(difference => difference.field), ['mission']);
  }
});
