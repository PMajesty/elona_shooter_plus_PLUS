import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compareTownTrace } from './town-reference-support.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-town-trace.json', import.meta.url), 'utf8'));

test('first-day result settlement and Free Repair match 11 independent original snapshots including RNG accounting', () => {
  assert.equal(fixture.format, 'elona-original-town-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  const result = compareTownTrace(fixture.records);
  assert.equal(result.status, 'passed');
  assert.equal(result.matchedSnapshots, 11);
});
