import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { compareFourthDayWaveTrace, type FourthDayWaveRecord } from './fourth-day-wave-reference-support.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-fourth-day-wave-trace.json', import.meta.url), 'utf8'));
const records = fixture.records as FourthDayWaveRecord[];

test('fourth-day waves match seeded original BATCH1 and ordinary waves plus the strict 10 percent boundary', () => {
  assert.equal(fixture.format, 'elona-original-fourth-day-wave-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  assert.equal(createHash('sha256').update(JSON.stringify(records)).digest('hex'), fixture.traceSha256);
  const snapshots = records.filter(row => row.type === 'snapshot');
  assert.deepEqual(snapshots.map(row => row.drawCount), [238, 229, 239, 159, 152, 235, 237]);
  assert.deepEqual(snapshots.map(row => row.waves!.reduce((sum, wave) => sum + wave.initialCount, 0)), [54, 64, 53, 82, 75, 53, 45]);
  // Ветка встречается и в обычном xorshift-потоке; граничные входы не заменяют этот факт.
  const seeded = snapshots.find(row => row.seed === 1)!;
  assert.ok(seeded.branches![0].debugGroup.includes('(BATCH1)'));
  assert.ok(seeded.branches!.slice(1).every(branch => branch.debugGroup.includes('(RANDOM)')));
  for (const record of snapshots.slice(0, 3)) assert.deepEqual([...new Set(record.waves!.flatMap(wave => wave.enemies))].sort((a, b) => a - b), [2, 3, 6, 17, 19, 999]);
  const below = snapshots.find(row => row.mode === 'constant-below-threshold')!;
  const equal = snapshots.find(row => row.mode === 'constant-at-threshold')!;
  assert.ok(below.branches!.every(branch => branch.debugGroup.includes('(BATCH1)')));
  assert.ok(equal.branches!.every(branch => branch.debugGroup.includes('(RANDOM)')));
  // Два randLv-броска следуют за 2 или 4 проверками веток; начало выбора фиксирует сокращённый путь.
  assert.equal(below.selections![0].drawBefore, 6);
  assert.equal(equal.selections![0].drawBefore, 8);
  assert.deepEqual(snapshots[3].selections!.slice(0, 3).map(group => group.ids[0]), [19, 2, 17]);
  assert.ok(snapshots.every(row => (row.loot as number[]).at(-1) === 1035));
  const result = compareFourthDayWaveTrace(records);
  assert.equal(result.status, 'passed'); assert.equal(result.matchedSnapshots, 7);
});

test('fourth-day comparison detects short-circuit RNG drift and changed rare enemies or delays', () => {
  const corrupted = structuredClone(records);
  const batch = corrupted.find(row => row.type === 'snapshot' && row.seed === 1)!;
  batch.drawCount = Number(batch.drawCount) + 2;
  batch.rngState = Number(batch.rngState) + 1;
  const zero = corrupted.find(row => row.mode === 'constant-zero')!;
  zero.waves![0].delays[0] += 0.05;
  for (const wave of zero.waves!) wave.enemies = wave.enemies.map(id => id === 2 ? 6 : id);
  const result = compareFourthDayWaveTrace(corrupted);
  assert.equal(result.status, 'failed');
  const seeded = result.comparisons.find(row => row.seed === 1)!;
  assert.ok(seeded.differences.some(row => row.field === 'drawCount'));
  assert.ok(seeded.differences.some(row => row.field === 'rngState'));
  assert.ok(result.comparisons.find(row => row.mode === 'constant-zero')!.differences.some(row => row.field === 'waves'));
});
