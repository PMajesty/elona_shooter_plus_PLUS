import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { compareSixthTownTrace } from './sixth-town-reference-support.ts';
import { prepareEarlyTown } from '../src/town-preparation.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-sixth-town-trace.json', import.meta.url), 'utf8'));

test('sixth-town preparation, tax and title boundaries match 22 independently captured original observations', () => {
  assert.equal(fixture.format, 'elona-original-sixth-town-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  assert.equal(fixture.instrumentedSwfSha256, 'c16b2cc781301bd5e8c8454521e0d981e5a1daa192a08c1cf670462dfec79201');
  assert.equal(fixture.traceSha256, 'f15e87bc77e3192311f02a90be509fcb39947801d56331e4b283d4b4c8fd2e25');
  assert.equal(createHash('sha256').update(JSON.stringify(fixture.records)).digest('hex'), fixture.traceSha256);
  const result = compareSixthTownTrace(fixture.records);
  assert.equal(result.status, 'passed'); assert.equal(result.matchedSnapshots, 22);
  const records = fixture.records as Record<string, any>[];
  const towns = records.filter(row => row.type === 'snapshot' && !row.boundary);
  assert.equal(towns.length, 6);
  for (const town of towns) {
    assert.deepEqual(town.mission.loot, [1106]);
    assert.equal(town.flags.specialSale, 0);
    assert.ok([2, 3].includes(town.recruit.lv));
  }
  const results = records.filter(row => row.boundary === 'result');
  for (const row of results) {
    assert.equal(row.drawCount, 3); assert.equal(row.upkeep, 40);
    assert.equal(row.tax, row.day === 6 ? 10 : 45);
    assert.equal(row.result.income, row.day === 6 ? 0 : 100);
  }
  const actions = records.filter(row => row.boundary === 'claim-title');
  for (const row of actions) { assert.equal(row.drawCount, 0); assert.equal(row.gold, 200); assert.equal(row.totalMoney, 0); }
  const claim = actions.find(row => row.scenario === 'claim_sequence' && row.op === 'claim')!;
  assert.equal(claim.ap, 0); assert.equal(claim.title, 1); assert.equal(claim.titleMoney, 100);
  assert.equal(claim.titleName, 'Honorary Citizen'); assert.equal(claim.dialog.title, 'New Title!');
  assert.equal(claim.dialog.cardFrame, 3);
  assert.match(claim.dialog.text, /100 gold pieces every day as a salary/);
  assert.equal(actions.find(row => row.op === 'repeat')!.eligible, false);
  assert.equal(actions.find(row => row.scenario === 'low_ap')!.title, 0);
  assert.equal(actions.find(row => row.scenario === 'before_day6')!.eligible, false);
});

test('sixth-town comparison detects an extra preparation draw without changing independent economy cases', () => {
  const result = compareSixthTownTrace(fixture.records, (random, day, input) => {
    random();
    return prepareEarlyTown(random, day, input);
  });
  assert.equal(result.status, 'failed');
  assert.ok(result.comparisons.some(row => row.boundary === 'preparation' && row.differences.some(difference => difference.field === 'rngState')));
  assert.equal(result.comparisons.filter(row => row.boundary !== 'preparation' && row.matched).length, 16);
});
