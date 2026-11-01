import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compareRestTrace } from './rest-reference-support.ts';

test('Rest matches three original town-to-battle transitions, including zero AP and spent consumables', () => {
  const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-rest-trace.json', import.meta.url), 'utf8'));
  assert.equal(fixture.format, 'elona-original-rest-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  const result = compareRestTrace(fixture.records);
  assert.equal(result.status, 'passed');
  assert.equal(result.sourceSnapshots, 12);
  assert.equal(result.matchedTransitions, 3);
});
