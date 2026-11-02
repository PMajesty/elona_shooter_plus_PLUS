import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { compareSeventhTownTrace } from './seventh-town-reference-support.ts';
import { prepareEarlyTown } from '../src/town-preparation.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-seventh-town-trace.json', import.meta.url), 'utf8'));

test('seventh-town preparation, level-four growth and economy match 38 original observations', () => {
  assert.equal(fixture.format, 'elona-original-seventh-town-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  assert.equal(fixture.instrumentedSwfSha256, 'c1b408a6bb287eb9fc611339246c08dceab432e39ee722271133300247257b2c');
  assert.equal(fixture.traceSha256, '39dabd5c3cb8516c274afabccdd05f1ab0400e0324d4aa066070b93b212a8806');
  assert.equal(createHash('sha256').update(JSON.stringify(fixture.records)).digest('hex'), fixture.traceSha256);
  const result = compareSeventhTownTrace(fixture.records);
  assert.equal(result.status, 'passed'); assert.equal(result.matchedSnapshots, 38);
  const records = fixture.records as Record<string, any>[];
  for (const town of records.filter(row => row.type === 'snapshot' && !row.boundary)) {
    assert.deepEqual(town.mission.loot, []); assert.equal(town.flags.specialSale, 0);
    assert.equal(town.mission.absorbFix, town.history === 'medal' ? 0.03 : 0);
  }
  const recruits = records.filter(row => row.boundary === 'recruit-growth');
  assert.deepEqual(recruits.slice(0, 9).map(row => row.recruit.devType), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.deepEqual(recruits.map(row => row.recruit.lv), [...Array(10).fill(4), 2, 3, 3, 4]);
  for (const row of recruits.slice(0, 10)) {
    assert.equal(row.recruit.sp, 3); assert.equal(row.recruit.cost, 550);
    assert.equal(row.recruit.trait[row.classId], 4);
    assert.equal(row.recruit.trait[900], row.reverse ? 10 : 13);
    assert.equal(row.recruit.trait[901], row.reverse ? 4 : 1);
  }
  for (const row of records.filter(row => row.boundary === 'result')) {
    assert.equal(row.drawCount, 3); assert.equal(row.tax, 45); assert.equal(row.upkeep, 40);
    assert.equal(row.result.income, row.title === 1 ? 100 : 0);
    assert.equal(row.result.netReward, (row.noDamage ? 936 : 720) + row.result.income - 85);
  }
  for (const row of records.filter(row => row.boundary === 'claim-title')) {
    assert.equal(row.drawCount, 0); assert.equal(row.gold, 200); assert.equal(row.totalMoney, 0);
    if (row.scenario === 'inherited_title') {
      assert.equal(row.eligible, false); assert.equal(row.ap, 4); assert.equal(row.title, 1); assert.equal(row.titleMoney, 100);
    }
  }
});

test('seventh-town comparison detects an extra preparation draw while leaving 32 independent probes unchanged', () => {
  const result = compareSeventhTownTrace(fixture.records, (random, day, input) => {
    random(); return prepareEarlyTown(random, day, input);
  });
  assert.equal(result.status, 'failed');
  assert.ok(result.comparisons.some(row => row.boundary === 'preparation' && row.differences.some(difference => difference.field === 'rngState')));
  assert.equal(result.comparisons.filter(row => row.boundary !== 'preparation' && row.matched).length, 32);
});
