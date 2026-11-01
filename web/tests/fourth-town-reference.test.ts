import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { compareFourthTownTrace } from './fourth-town-reference-support.ts';
import { prepareEarlyTown } from '../src/town-preparation.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-fourth-town-trace.json', import.meta.url), 'utf8'));

test('fourth-town sale and all nine classes of level-two recruit growth match 16 original observations', () => {
  assert.equal(fixture.format, 'elona-original-fourth-town-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  assert.equal(fixture.instrumentedSwfSha256, 'e6ebdbce8fef70797598da6799ef18ebd2a5607ce93ef1d81ad8b2138d1fd9d9');
  assert.equal(createHash('sha256').update(JSON.stringify(fixture.records)).digest('hex'), fixture.traceSha256);
  const result = compareFourthTownTrace(fixture.records);
  assert.equal(result.status, 'passed');
  assert.equal(result.matchedTownSnapshots, 6);
  assert.equal(result.matchedRecruitSnapshots, 10);
  const towns = fixture.records.filter((row: { type: string; boundary?: string }) => row.type === 'snapshot' && row.boundary !== 'recruit-growth');
  for (const town of towns) {
    assert.equal(town.shop[0].id, 8); assert.equal(town.shop[0].mod, 10);
    assert.equal(town.shop[1].type, 5);
    assert.equal(town.flags.specialSale, 0);
    assert.ok(town.mission.loot.includes(1102));
    assert.equal(town.mission.absorbFix, town.history === 'medal' ? 0.02 : 0);
  }
  const recruits = fixture.records.filter((row: { boundary?: string }) => row.boundary === 'recruit-growth');
  assert.deepEqual(recruits.slice(0, 9).map((row: { recruit: { devType: number } }) => row.recruit.devType), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  for (const { recruit, reverse } of recruits) {
    assert.equal(recruit.lv, 2); assert.equal(recruit.sp, 1); assert.equal(recruit.cost, 450);
    assert.equal(recruit.trait[recruit.devType], 2);
    assert.equal(recruit.trait[900], reverse ? 10 : 11);
    assert.equal(recruit.trait[901], reverse ? 2 : 1);
  }
});

test('the fourth-town reference detects an extra preparation draw without altering expected data', () => {
  const result = compareFourthTownTrace(fixture.records, (random, day, input) => {
    random();
    return prepareEarlyTown(random, day, input);
  });
  assert.equal(result.status, 'failed');
  assert.ok(result.comparisons.some(row => row.differences.some(difference => difference.field === 'rngState')));
  assert.equal(result.matchedRecruitSnapshots, 10);
});
