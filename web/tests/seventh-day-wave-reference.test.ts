import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { compareSeventhDayWaveTrace, type SeventhDayWaveRecord } from './seventh-day-wave-reference-support.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-seventh-day-wave-trace.json', import.meta.url), 'utf8'));
const records = fixture.records as SeventhDayWaveRecord[];

test('seventh-day waves match natural RANGED selection, strict threshold and source fallback behavior', () => {
  assert.equal(fixture.format, 'elona-original-seventh-day-wave-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  assert.equal(createHash('sha256').update(JSON.stringify(records)).digest('hex'), fixture.traceSha256);
  const snapshots = records.filter(row => row.type === 'snapshot');
  assert.deepEqual(snapshots.map(row => row.drawCount), [232, 228, 251, 257, 252, 200, 230, 251, 239, 243]);
  assert.deepEqual(snapshots.map(row => row.waves!.reduce((sum, wave) => sum + wave.initialCount, 0)), [81, 77, 74, 91, 95, 53, 68, 74, 98, 88]);
  // Независимый исходник подтверждает RANGED во всех четырёх обычных seeded-запусках.
  const seeded = snapshots.filter(row => row.mode === 'xorshift32');
  assert.ok(seeded.every(row => row.branches!.some(branch => branch.debugGroup.includes('(RANGED)'))));
  assert.ok(seeded.find(row => row.seed === 6)!.branches![0].debugGroup.includes('(RANGED)'));
  const ranged = snapshots.find(row => row.mode === 'scripted-ranged')!;
  const first = ranged.selections!.filter(group => group.wave === 0);
  assert.deepEqual(first.map(group => group.ids[0]), [10, 2, 7, 6, 3]);
  assert.equal(first.reduce((sum, group) => sum + group.budget, 0), 90);
  assert.deepEqual(first[4].flags, ['RANGED']);
  assert.equal(first[4].drawAfter - first[4].drawBefore, 6);
  assert.equal(first[4].ids[0], 3);
  assert.deepEqual([
    snapshots.find(row => row.mode === 'constant-zero')!.selections![0].drawBefore,
    snapshots.find(row => row.mode === 'scripted-batch1')!.selections![0].drawBefore,
    first[0].drawBefore,
    snapshots.find(row => row.mode === 'ranged-at-threshold')!.selections![0].drawBefore,
  ], [5, 6, 7, 8]);
  assert.ok(snapshots.every(row => (row.loot as number[]).at(-1) === 1106));
  const result = compareSeventhDayWaveTrace(records);
  assert.equal(result.status, 'passed'); assert.equal(result.matchedSnapshots, 10);
});

test('seventh-day reference rejects reordered random draws and replacement of the non-ranged fallback', () => {
  // Меняем порядок шестого/седьмого значений только на входе настоящего генератора;
  // сохранённый исходный fixture и число чтений пары остаются неизменными.
  const reordered = compareSeventhDayWaveTrace(records, random => {
    let index = 0, held = 0;
    return () => {
      const position = index++;
      if (position === 5) { held = random(); return random(); }
      if (position === 6) return held;
      return random();
    };
  });
  assert.equal(reordered.status, 'failed');
  const sameCount = reordered.comparisons.find(row => row.seed === 42 && row.mode === 'xorshift32')!;
  assert.equal(sameCount.portDrawCount, sameCount.originalDrawCount);
  assert.ok(sameCount.differences.some(row => row.field === 'waves'));
  assert.ok(reordered.comparisons.find(row => row.seed === 6)!.differences.some(row => row.field === 'waves'));

  const corrupted = structuredClone(records);
  const ranged = corrupted.find(row => row.mode === 'scripted-ranged')!;
  ranged.waves![0].enemies = ranged.waves![0].enemies.map(id => id === 3 ? 2 : id);
  ranged.waves![0].delays[0] += 0.05;
  const changed = compareSeventhDayWaveTrace(corrupted);
  assert.equal(changed.status, 'failed');
  assert.ok(changed.comparisons.find(row => row.mode === 'scripted-ranged')!.differences.some(row => row.field === 'waves'));
});
