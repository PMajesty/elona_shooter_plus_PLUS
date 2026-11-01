import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compareProgressionTrace } from './progression-reference-support.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-progression-trace.json', import.meta.url), 'utf8'));

test('Sheriff choices and all 15 skill previews match 9 independent original snapshots including RNG accounting', () => {
  assert.equal(fixture.format, 'elona-original-progression-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  const result = compareProgressionTrace(fixture.records);
  assert.equal(result.status, 'passed');
  assert.equal(result.matchedSnapshots, 9);
});
