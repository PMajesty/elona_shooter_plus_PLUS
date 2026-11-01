import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { compareCastleTrace, type CastleRecord } from './castle-reference-support.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-castle-trace.json', import.meta.url), 'utf8'));

test('castle skills, protection expiry and absorption match 17 independently captured original states and random streams', () => {
  assert.equal(fixture.format, 'elona-original-castle-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  assert.equal(createHash('sha256').update(JSON.stringify(fixture.records)).digest('hex'), fixture.traceSha256);
  const records = fixture.records as CastleRecord[];
  const sample = (name: string) => records.find(row => row.scenario === name)!;
  // Покрытие ветвей подтверждено наблюдённым оригинальным состоянием, включая ошибочный порог Last Hope.
  assert.equal(sample('unskilled_full').drawCount, 3);
  assert.equal(sample('unskilled_low').drawCount, 2);
  assert.equal(sample('insurance_before_block').after!.castleHp, 40);
  assert.equal(sample('insurance_before_block').after!.money, 103);
  assert.equal(sample('insurance_before_block').after!.totalMoney, 503);
  assert.equal(sample('last_hope_full').drawCount, 5);
  assert.equal(sample('last_hope_full').after!.rampage, 339);
  assert.equal(sample('last_hope_low').after!.rampage, 0);
  assert.equal(sample('last_hope_empty_ally').after!.rampage, 0);
  assert.equal(sample('protection_blocks_before_skills').drawCount, 0);
  assert.equal(sample('protection_blocks_before_skills').after!.money, 100);
  assert.equal(sample('protection_expires').after!.protection.counter, -1);
  assert.equal(sample('protection_expires').after!.castleHp, 37);
  assert.deepEqual(sample('protection_fade_finishes').after!.protection, { counter: 0, blueMultiplierAdd: 0 });
  assert.equal(sample('absorb_truncation').after!.castleHp, 34);
  assert.equal(sample('absorb_minimum').after!.castleHp, 39);
  const result = compareCastleTrace(records);
  assert.equal(result.status, 'passed'); assert.equal(result.matchedSnapshots, 17);
});
