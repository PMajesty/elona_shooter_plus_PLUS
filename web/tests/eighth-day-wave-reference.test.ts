import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { compareEighthDayWaveTrace, type EighthDayWaveRecord } from './eighth-day-wave-reference-support.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-eighth-day-wave-trace.json', import.meta.url), 'utf8'));
const records = fixture.records as EighthDayWaveRecord[];

test('eighth-day waves capture natural Lava selection and preserve original branch/fallback ordering', () => {
  assert.equal(fixture.format, 'elona-original-eighth-day-wave-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  assert.equal(fixture.instrumentedSwfSha256, 'b73dca3630c9570fd0e13088fd2d3f65f6150d2898edc23bed2bf040c5f1a9d6');
  assert.equal(createHash('sha256').update(JSON.stringify(records)).digest('hex'), fixture.traceSha256);
  const snapshots = records.filter(row => row.type === 'snapshot');
  assert.deepEqual(snapshots.map(row => row.drawCount), [250, 229, 247, 235, 263, 219, 229, 257, 240, 254]);
  assert.deepEqual(snapshots.map(row => row.waves!.reduce((sum, wave) => sum + wave.initialCount, 0)), [76, 95, 94, 87, 106, 57, 67, 80, 99, 99]);
  const lavaCounts = snapshots.map(row => row.waves!.reduce((sum, wave) => sum + wave.enemies.filter(id => id === 4).length, 0));
  assert.deepEqual(lavaCounts, [2, 1, 1, 2, 0, 5, 5, 0, 1, 1]);
  // Четыре обычных seeded-запуска исходника реально выбирают Lava, а не только разрешают её уровень.
  assert.ok(snapshots.filter(row => row.mode === 'xorshift32').every(row => row.waves!.some(wave => wave.enemies.includes(4))));
  for (const row of snapshots) for (const selection of row.selections!) if (selection.ids.includes(4)) {
    assert.equal(selection.requestedLevel, 9); assert.deepEqual(selection.flags, []);
  }
  const batch = snapshots.find(row => row.mode === 'scripted-batch1')!;
  assert.deepEqual(batch.selections!.filter(group => group.wave === 0).map(group => group.ids[0]), [7, 4, 19]);
  const ranged = snapshots.find(row => row.mode === 'scripted-ranged')!;
  const first = ranged.selections!.filter(group => group.wave === 0);
  assert.deepEqual(first.map(group => group.ids[0]), [7, 2, 4, 10, 3]);
  assert.deepEqual(first[4].flags, ['RANGED']); assert.equal(first[4].drawAfter - first[4].drawBefore, 6);
  assert.equal(first.reduce((sum, group) => sum + group.budget, 0), 90);
  assert.deepEqual([
    snapshots.find(row => row.mode === 'constant-zero')!.selections![0].drawBefore,
    batch.selections![0].drawBefore, first[0].drawBefore,
    snapshots.find(row => row.mode === 'ranged-at-threshold')!.selections![0].drawBefore,
  ], [5, 6, 7, 8]);
  assert.ok(snapshots.every(row => row.powerOrg === 1640 && row.reward === 740 && row.spawnRate === 13.6));
  assert.ok(snapshots.every(row => (row.loot as number[]).length === (row.mode === 'constant-high' ? 1 : 0)));
  assert.deepEqual(snapshots.find(row => row.mode === 'constant-high')!.loot, [1038]);
  const result = compareEighthDayWaveTrace(records);
  assert.equal(result.status, 'passed'); assert.equal(result.matchedSnapshots, 10);
});

test('eighth-day reference rejects reordered random draws and replacement of the non-ranged fallback', () => {
  // Меняем порядок шестого/седьмого значений только на входе настоящего генератора;
  // сохранённый исходный fixture и число чтений пары остаются неизменными.
  const reordered = compareEighthDayWaveTrace(records, random => {
    let index = 0, held = 0;
    return () => {
      const position = index++;
      if (position === 5) { held = random(); return random(); }
      if (position === 6) return held;
      return random();
    };
  });
  assert.equal(reordered.status, 'failed');
  assert.ok(reordered.comparisons.some(row => row.portDrawCount === row.originalDrawCount && row.differences.some(value => value.field === 'waves')));

  const corrupted = structuredClone(records);
  const ranged = corrupted.find(row => row.mode === 'scripted-ranged')!;
  ranged.waves![0].enemies = ranged.waves![0].enemies.map(id => id === 3 ? 2 : id);
  ranged.waves![0].delays[0] += 0.05;
  const changed = compareEighthDayWaveTrace(corrupted);
  assert.equal(changed.status, 'failed');
  assert.ok(changed.comparisons.find(row => row.mode === 'scripted-ranged')!.differences.some(row => row.field === 'waves'));
});
