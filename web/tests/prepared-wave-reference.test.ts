import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { comparePreparedWaveTrace } from './prepared-wave-reference-support.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-prepared-wave-trace.json', import.meta.url), 'utf8'));

test('prepared second-day waves match three original captures including both boss positions and exact RNG boundaries', () => {
  assert.equal(fixture.format, 'elona-original-prepared-wave-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  const result = comparePreparedWaveTrace(fixture.records);
  assert.equal(result.status, 'passed');
  assert.equal(result.matchedSnapshots, 3);
  assert.deepEqual([...new Set(fixture.records.filter((row: { type: string }) => row.type === 'snapshot').map((row: { bossWave: number }) => row.bossWave))].sort(), [2, 3]);
});
