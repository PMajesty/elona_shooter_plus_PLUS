import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { compareThirdDayWaveTrace, type ThirdDayWaveRecord } from './third-day-wave-reference-support.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-third-day-wave-trace.json', import.meta.url), 'utf8'));
const records = fixture.records as ThirdDayWaveRecord[];

test('third-day waves match three seeded original captures and both rare selection boundaries', () => {
  assert.equal(fixture.format, 'elona-original-third-day-wave-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  assert.equal(createHash('sha256').update(JSON.stringify(records)).digest('hex'), fixture.traceSha256);
  const snapshots = records.filter(row => row.type === 'snapshot');
  assert.deepEqual(snapshots.map(row => row.drawCount), [246, 243, 244, 229, 233]);
  assert.deepEqual(snapshots.map(row => row.waves!.reduce((sum, wave) => sum + wave.initialCount, 0)), [52, 51, 52, 47, 41]);
  const zero = snapshots.find(row => row.mode === 'constant-zero')!;
  const high = snapshots.find(row => row.mode === 'constant-high')!;
  // Исходный RNG вправе вернуть ноль: Archer нельзя исключать из третьего дня по обычным seed.
  assert.deepEqual(zero.selections!.slice(0, 6).map(group => group.ids[0]), [19, 17, 3, 2, 3, 3]);
  assert.ok(zero.waves!.some(wave => wave.enemies.includes(2)));
  // Fallback не повторяет ограничения уровня/флагов и может вернуть Chicken для requestedLevel=0.
  assert.ok(high.selections!.some(group => group.requestedLevel === 0 && group.ids.every(id => id === 19)));
  assert.deepEqual(zero.loot, [1103]); assert.deepEqual(high.loot, [1038, 1103]);
  const result = compareThirdDayWaveTrace(records);
  assert.equal(result.status, 'passed'); assert.equal(result.matchedSnapshots, 5);
});

test('third-day comparison rejects changed spawn delays, omitted rare enemies and random consumption', () => {
  const corrupted = structuredClone(records);
  const seeded = corrupted.find(row => row.type === 'snapshot' && row.mode === 'xorshift32')!;
  seeded.waves![0].delays[0] += 0.05;
  seeded.drawCount = Number(seeded.drawCount) + 1;
  const zero = corrupted.find(row => row.mode === 'constant-zero')!;
  for (const wave of zero.waves!) wave.enemies = wave.enemies.map(id => id === 2 ? 6 : id);
  const result = compareThirdDayWaveTrace(corrupted);
  assert.equal(result.status, 'failed');
  assert.ok(result.comparisons[0].differences.some(row => row.field === 'waves'));
  assert.ok(result.comparisons[0].differences.some(row => row.field === 'drawCount'));
  assert.ok(result.comparisons.find(row => row.mode === 'constant-zero')!.differences.some(row => row.field === 'waves'));
});
