import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { compareShootTrace } from './shoot-reference-support.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-shoot-trace.json', import.meta.url), 'utf8'));

test('actual shooting matches 22 independent original snapshots, including corpse RNG, modified guns, boss hits and living-weapon level-up', () => {
  assert.equal(fixture.format, 'elona-original-shoot-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  assert.equal(createHash('sha256').update(JSON.stringify(fixture.records)).digest('hex'), fixture.traceSha256);
  const result = compareShootTrace(fixture.records);
  assert.equal(result.status, 'passed');
  assert.equal(result.matchedSnapshots, 22);
});
