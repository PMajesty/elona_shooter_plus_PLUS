import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { compareSixthDayWaveTrace, type SixthDayWaveRecord } from './sixth-day-wave-reference-support.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-sixth-day-wave-trace.json', import.meta.url), 'utf8'));
const records = fixture.records as SixthDayWaveRecord[];

test('sixth-day waves match original Barbarian selection, AIR/BATCH1 boundaries and RNG consumption', () => {
  assert.equal(fixture.format, 'elona-original-sixth-day-wave-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  assert.equal(createHash('sha256').update(JSON.stringify(records)).digest('hex'), fixture.traceSha256);
  const snapshots = records.filter(row => row.type === 'snapshot');
  assert.deepEqual(snapshots.map(row => row.drawCount), [246, 228, 237, 257, 248, 248, 250, 244, 233]);
  assert.deepEqual(snapshots.map(row => row.waves!.reduce((sum, wave) => sum + wave.initialCount, 0)), [81, 71, 78, 74, 91, 91, 88, 67, 92]);
  // Все четыре обычных seed дают Barbarian без принудительного граничного RNG.
  const seeded = snapshots.filter(row => row.mode === 'xorshift32');
  assert.deepEqual(seeded.map(row => row.waves!.flatMap(wave => wave.enemies).filter(id => id === 7).length), [2, 4, 4, 4]);
  for (const row of snapshots) {
    for (const group of row.selections!.filter(group => group.ids.includes(7))) {
      assert.equal(group.requestedLevel, 7);
      assert.deepEqual(group.flags, []);
    }
    assert.equal(row.branches!.some(branch => branch.debugGroup.includes('(RANGED)')), false);
    assert.equal((row.loot as number[]).at(-1), 1037);
  }
  const air = snapshots.find(row => row.mode === 'constant-zero')!;
  const ordinary = snapshots.find(row => row.mode === 'constant-at-threshold')!;
  const batch = snapshots.find(row => row.mode === 'scripted-batch1')!;
  assert.deepEqual(air.selections!.slice(0, 5).map(group => group.ids[0]), [6, 3, 3, 10, 3]);
  assert.deepEqual(batch.selections!.slice(0, 3).map(group => group.ids[0]), [19, 7, 17]);
  assert.equal(air.selections![0].drawBefore, 5);
  assert.equal(batch.selections![0].drawBefore, 6);
  assert.equal(ordinary.selections![0].drawBefore, 8);
  // Три fallback-броска после двух target и одного Fly: результат может быть Sheep.
  assert.equal(air.selections![1].drawAfter - air.selections![1].drawBefore, 6);
  assert.deepEqual(air.selections![1].flags, ['AIR']);
  assert.equal(air.selections![1].ids[0], 3);
  const result = compareSixthDayWaveTrace(records);
  assert.equal(result.status, 'passed'); assert.equal(result.matchedSnapshots, 9);
});

test('sixth-day reference detects omitted Barbarian, changed AIR delays and an extra branch draw', () => {
  const corrupted = structuredClone(records);
  const seeded = corrupted.find(row => row.type === 'snapshot' && row.seed === 42 && row.mode === 'xorshift32')!;
  for (const wave of seeded.waves!) wave.enemies = wave.enemies.map(id => id === 7 ? 3 : id);
  const air = corrupted.find(row => row.mode === 'constant-zero')!;
  air.waves![0].delays[0] += 0.05;
  const batch = corrupted.find(row => row.mode === 'scripted-batch1')!;
  batch.drawCount = Number(batch.drawCount) + 1;
  const result = compareSixthDayWaveTrace(corrupted);
  assert.equal(result.status, 'failed');
  assert.ok(result.comparisons.find(row => row.seed === 42 && row.mode === 'xorshift32')!.differences.some(row => row.field === 'waves'));
  assert.ok(result.comparisons.find(row => row.mode === 'constant-zero')!.differences.some(row => row.field === 'waves'));
  assert.ok(result.comparisons.find(row => row.mode === 'scripted-batch1')!.differences.some(row => row.field === 'drawCount'));
});
