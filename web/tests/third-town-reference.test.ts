import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { compareThirdTownTrace } from './third-town-reference-support.ts';

test('third-town preparation matches six captured original cases including Shop Token and retained metadata', () => {
  const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-third-town-trace.json', import.meta.url), 'utf8'));
  assert.equal(fixture.format, 'elona-original-third-town-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  assert.equal(fixture.instrumentedSwfSha256, 'e9ea5b163839b742a4de75e44f57dc2612ee65f88a97f84f511cb2b00f727052');
  assert.equal(createHash('sha256').update(JSON.stringify(fixture.records)).digest('hex'), fixture.traceSha256);
  const result = compareThirdTownTrace(fixture.records);
  assert.equal(result.status, 'passed');
  assert.equal(result.matchedSnapshots, 6);
});
