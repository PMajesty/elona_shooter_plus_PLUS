import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { comparePartyHiringTrace } from './party-hiring-reference-support.ts';
import { hireCandidate } from '../src/party.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-party-hiring-trace.json', import.meta.url), 'utf8'));

test('61 permanent hiring and equipment comparisons match 79 observations from the original town', () => {
  assert.equal(fixture.format, 'elona-original-party-hiring-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  assert.equal(fixture.instrumentedSwfSha256, 'ab17b8ddf7a62a787ee86c8a11f1f4e4e391aa6ecf61be2721621e66338d6122');
  assert.equal(fixture.traceSha256, '32b7b529b18a50b78055dd9ce85c41b26088a0aa05f843753bf390b4dbee0891');
  assert.equal(createHash('sha256').update(JSON.stringify(fixture.records)).digest('hex'), fixture.traceSha256);
  const result = comparePartyHiringTrace(fixture.records);
  assert.equal(result.status, 'passed'); assert.equal(result.observedSnapshots, 79); assert.equal(result.matchedSnapshots, 61);
  const rows = fixture.records as Record<string, any>[];
  assert.deepEqual(rows.filter(row => row.op === 'before' && row.scenario.startsWith('class-'))
    .map(row => row.slots[4].member.devType), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  for (const row of rows.filter(row => row.op === 'hire' && row.scenario.startsWith('class-'))) {
    assert.equal(row.gold, 0); assert.equal(row.ap, 0); assert.equal(row.totalMoney, 1234);
    assert.equal(row.drawCount, 0); assert.equal(row.rngState, 42);
    assert.equal(row.slots[0].member.sp, 3); assert.equal(row.slots[0].member.money, 200);
    assert.equal(row.slots[4].exists, false);
  }
  const militia = rows.filter(row => row.scenario === 'class-4');
  const before = militia.find(row => row.op === 'before')!, hired = militia.find(row => row.op === 'hire')!;
  assert.deepEqual(hired.auxiliary, before.auxiliary);
  assert.deepEqual(hired.slots[0].weapon, before.slots[4].weapon);
  const modBefore = rows.find(row => row.scenario === 'ally-mod-cancel' && row.op === 'before')!;
  const modAfter = rows.find(row => row.scenario === 'ally-mod-cancel' && row.op === 'cancel')!;
  assert.deepEqual(modAfter.slots, modBefore.slots); assert.deepEqual(modAfter.inventory, modBefore.inventory);
});

test('hiring reference detects loss of the inactive weapon exchanged back into candidate slot45', () => {
  const result = comparePartyHiringTrace(fixture.records, (party, gold) => {
    const output = hireCandidate(party, gold);
    if (output.outcome === 'hired') party.slots[4].weapon = null;
    return output;
  });
  assert.equal(result.status, 'failed');
  const failures = result.comparisons.filter(row => !row.matched);
  assert.equal(failures.length, 1); assert.equal(failures[0].scenario, 'dismiss-rehire');
  assert.deepEqual(failures[0].differences.map(value => value.field), ['slots']);
});
