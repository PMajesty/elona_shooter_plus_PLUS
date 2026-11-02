import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { compareFifthTownTrace } from './fifth-town-reference-support.ts';
import { prepareEarlyTown } from '../src/town-preparation.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-fifth-town-trace.json', import.meta.url), 'utf8'));

test('fifth-town stock, Holy Grail and level-two/three recruit growth match 17 original observations', () => {
  assert.equal(fixture.format, 'elona-original-fifth-town-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  assert.equal(fixture.instrumentedSwfSha256, '8cea1f726e41cb74f33b11e7803aac566122d5d1e45c9019942251f2dba7989f');
  assert.equal(createHash('sha256').update(JSON.stringify(fixture.records)).digest('hex'), fixture.traceSha256);
  const result = compareFifthTownTrace(fixture.records);
  assert.equal(result.status, 'passed');
  assert.equal(result.matchedTownSnapshots, 6);
  assert.equal(result.matchedRecruitSnapshots, 11);
  const towns = fixture.records.filter((row: { type: string; boundary?: string }) => row.type === 'snapshot' && row.boundary !== 'recruit-growth');
  for (const town of towns) {
    assert.equal(town.shop[0].type, 1);
    assert.equal(town.flags.specialSale, 0);
    assert.ok(town.mission.loot.includes(1037));
    assert.equal(town.mission.loot.includes(1102), false);
    assert.equal(town.mission.absorbFix, town.history === 'medal' ? 0.02 : 0);
  }
  const recruits = fixture.records.filter((row: { boundary?: string }) => row.boundary === 'recruit-growth');
  assert.deepEqual(recruits.slice(0, 9).map((row: { recruit: { devType: number } }) => row.recruit.devType), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.deepEqual(recruits.map((row: { recruit: { lv: number } }) => row.recruit.lv), [...Array(10).fill(3), 2]);
  for (const { recruit, reverse, targetLevel } of recruits) {
    assert.equal(recruit.sp, targetLevel - 1); assert.equal(recruit.cost, 350 + targetLevel * 50);
    assert.equal(recruit.trait[recruit.devType], targetLevel);
    assert.equal(recruit.trait[900], reverse ? 10 : 9 + targetLevel);
    assert.equal(recruit.trait[901], reverse ? targetLevel : 1);
  }
});

test('the fifth-town reference detects an extra generation draw while keeping the recruit probes independent', () => {
  const result = compareFifthTownTrace(fixture.records, (random, day, input) => {
    random();
    return prepareEarlyTown(random, day, input);
  });
  assert.equal(result.status, 'failed');
  assert.ok(result.comparisons.some(row => row.differences.some(difference => difference.field === 'rngState')));
  assert.equal(result.matchedRecruitSnapshots, 11);
});
