import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { compareEighthTownTrace } from './eighth-town-reference-support.ts';
import { prepareEarlyTown } from '../src/town-preparation.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-eighth-town-trace.json', import.meta.url), 'utf8'));

test('eighth-town preparation, recruit thresholds, Mk3 variation and economy match18 original observations', () => {
  assert.equal(fixture.format, 'elona-original-eighth-town-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  assert.equal(fixture.instrumentedSwfSha256, '67fd0cb58536987e7c0a2d897df4410e431296c6140cfe2f0dae50552c1f760b');
  assert.equal(fixture.traceSha256, '663dd46cf1f2718ed474d8985ece10fa2b2dca27b4187255810b88b9e4d3591c');
  assert.equal(createHash('sha256').update(JSON.stringify(fixture.records)).digest('hex'), fixture.traceSha256);
  const result = compareEighthTownTrace(fixture.records);
  assert.equal(result.status, 'passed'); assert.equal(result.matchedSnapshots, 18);
  const records = fixture.records as Record<string, any>[];
  for (const town of records.filter(row => row.type === 'snapshot' && !row.boundary)) {
    assert.ok(town.mission.loot.every((id: number) => id === 1038)); assert.equal(town.flags.specialSale, 0);
    assert.equal(town.mission.absorbFix, town.history === 'medal' ? 0.03 : 0);
    assert.equal(town.mission.powerOrg, 1760); assert.equal(town.mission.reward, 760);
  }
  const recruits = records.filter(row => row.boundary === 'recruit-growth');
  assert.deepEqual(recruits.map(row => row.recruit.lv), [2, 3, 3, 4]);
  for (const row of recruits) {
    assert.equal(row.recruit.sp, row.targetLevel - 1); assert.equal(row.recruit.cost, 350 + 50 * row.targetLevel);
    assert.equal(row.recruit.trait[6], row.targetLevel);
    assert.equal(row.recruit.trait[900], 9 + row.targetLevel); assert.equal(row.recruit.trait[901], 1);
  }
  const variations = records.filter(row => row.boundary === 'weapon-variation');
  assert.deepEqual(variations.map(row => row.after.lv), [2, 2, 3, 3]);
  for (const row of variations) assert.equal(row.drawCount, 1);
  for (const row of records.filter(row => row.boundary === 'result')) {
    assert.equal(row.drawCount, 3); assert.equal(row.tax, 80); assert.equal(row.upkeep, 40);
    assert.equal(row.result.income, row.title === 1 ? 100 : 0);
    assert.equal(row.result.netReward, (row.noDamage ? 962 : 740) + row.result.income - 120);
  }
});

test('eighth-town comparison detects an extra preparation draw without changing12 independent probes', () => {
  const result = compareEighthTownTrace(fixture.records, (random, day, input) => {
    random(); return prepareEarlyTown(random, day, input);
  });
  assert.equal(result.status, 'failed');
  assert.ok(result.comparisons.some(row => row.boundary === 'preparation' && row.differences.some(difference => difference.field === 'rngState')));
  assert.equal(result.comparisons.filter(row => row.boundary !== 'preparation' && row.matched).length, 12);
});

test('eighth-town comparison rejects retaining the day7 weapon cap even when RNG consumption stays exact', () => {
  const result = compareEighthTownTrace(fixture.records, prepareEarlyTown, (factory, item) => {
    factory.context.day = 7; factory.varyWeapon(item);
  });
  assert.equal(result.status, 'failed'); assert.equal(result.matchedSnapshots, 16);
  const failures = result.comparisons.filter(row => !row.matched);
  assert.deepEqual(failures.map(row => row.scenario), ['above-5/9', 'day8-cap']);
  for (const row of failures) assert.deepEqual(row.differences.map(difference => difference.field), ['after']);
});
