import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { compareFifthDayWaveTrace, type FifthDayWaveRecord } from './fifth-day-wave-reference-support.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-fifth-day-wave-trace.json', import.meta.url), 'utf8'));
const records = fixture.records as FifthDayWaveRecord[];

test('fifth-day waves match original Fly selection, AIR/BATCH1/ordinary paths and the extra fallback draw', () => {
  assert.equal(fixture.format, 'elona-original-fifth-day-wave-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  assert.equal(createHash('sha256').update(JSON.stringify(records)).digest('hex'), fixture.traceSha256);
  const snapshots = records.filter(row => row.type === 'snapshot');
  assert.deepEqual(snapshots.map(row => row.drawCount), [225, 217, 245, 260, 237, 237, 259, 257, 230]);
  assert.deepEqual(snapshots.map(row => row.waves!.reduce((sum, wave) => sum + wave.initialCount, 0)), [62, 71, 59, 71, 80, 80, 82, 65, 89]);
  // Обычный seed подтверждает Fly без принудительного граничного RNG.
  const flySeed = snapshots.find(row => row.seed === 2)!;
  assert.equal(flySeed.waves!.flatMap(wave => wave.enemies).filter(id => id === 10).length, 14);
  assert.ok(snapshots.find(row => row.seed === 1)!.branches![0].debugGroup.includes('(BATCH1)'));
  const air = snapshots.find(row => row.mode === 'constant-zero')!;
  const ordinary = snapshots.find(row => row.mode === 'constant-at-threshold')!;
  const batch = snapshots.find(row => row.mode === 'scripted-batch1')!;
  assert.deepEqual(air.selections!.slice(0, 5).map(group => group.ids[0]), [6, 3, 3, 10, 3]);
  assert.deepEqual(batch.selections!.slice(0, 3).map(group => group.ids[0]), [19, 10, 17]);
  assert.equal(air.selections![0].drawBefore, 5);
  assert.equal(batch.selections![0].drawBefore, 6);
  assert.equal(ordinary.selections![0].drawBefore, 8);
  // При fixedLv=4 fallback уже делает три броска и может вернуть не-AIR Sheep.
  assert.equal(air.selections![1].drawAfter - air.selections![1].drawBefore, 6);
  assert.deepEqual(air.selections![1].flags, ['AIR']);
  assert.equal(air.selections![1].ids[0], 3);
  const high = snapshots.find(row => row.mode === 'constant-high')!;
  assert.equal(high.selections![4].ids[0], 17);
  assert.equal(high.selections![4].drawAfter - high.selections![4].drawBefore, 6);
  assert.ok(snapshots.every(row => (row.loot as number[]).at(-1) === 1102));
  const result = compareFifthDayWaveTrace(records);
  assert.equal(result.status, 'passed'); assert.equal(result.matchedSnapshots, 9);
});

test('fifth-day reference detects omitted Fly, changed AIR delays and an omitted fallback random draw', () => {
  const corrupted = structuredClone(records);
  const seeded = corrupted.find(row => row.type === 'snapshot' && row.seed === 2)!;
  for (const wave of seeded.waves!) wave.enemies = wave.enemies.map(id => id === 10 ? 6 : id);
  const air = corrupted.find(row => row.mode === 'constant-zero')!;
  air.waves![0].delays[0] += 0.05;
  const high = corrupted.find(row => row.mode === 'constant-high')!;
  high.drawCount = Number(high.drawCount) - 1;
  const result = compareFifthDayWaveTrace(corrupted);
  assert.equal(result.status, 'failed');
  assert.ok(result.comparisons.find(row => row.seed === 2)!.differences.some(row => row.field === 'waves'));
  assert.ok(result.comparisons.find(row => row.mode === 'constant-zero')!.differences.some(row => row.field === 'waves'));
  assert.ok(result.comparisons.find(row => row.mode === 'constant-high')!.differences.some(row => row.field === 'drawCount'));
});
