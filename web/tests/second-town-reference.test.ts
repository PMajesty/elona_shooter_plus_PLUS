import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compareSecondTownTrace } from './second-town-reference-support.ts';

test('second-town preparation matches six original snapshots with retained equipment, search state and medal absorption', () => {
  const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-second-town-trace.json', import.meta.url), 'utf8'));
  assert.equal(fixture.format, 'elona-original-second-town-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  const result = compareSecondTownTrace(fixture.records);
  assert.equal(result.status, 'passed');
  assert.equal(result.matchedSnapshots, 6);
});
