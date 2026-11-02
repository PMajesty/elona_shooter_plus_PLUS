import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { compareNinthDayWaveTrace, type NinthDayWaveRecord } from './ninth-day-wave-reference-support.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-ninth-day-wave-trace.json', import.meta.url), 'utf8'));
const records = fixture.records as NinthDayWaveRecord[];

test('ninth-day waves preserve the new Barbarian fallback draw and original branch ordering', () => {
  assert.equal(fixture.format, 'elona-original-ninth-day-wave-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  assert.equal(fixture.instrumentedSwfSha256, 'ef077436fc6f82a611f7ae8286cf33bfb6631cffb288e46b2c1fe6b0b9284e91');
  assert.equal(createHash('sha256').update(JSON.stringify(records)).digest('hex'), fixture.traceSha256);
  const snapshots = records.filter(row => row.type === 'snapshot');
  assert.deepEqual(snapshots.map(row => row.drawCount), [253, 225, 242, 254, 286, 220, 260, 258, 257, 271, 271, 270]);
  assert.deepEqual(snapshots.map(row => row.waves!.reduce((sum, wave) => sum + wave.initialCount, 0)), [96, 95, 68, 78, 114, 68, 98, 76, 104, 103, 103, 102]);
  const lavaCounts = snapshots.map(row => row.waves!.reduce((sum, wave) => sum + wave.enemies.filter(id => id === 4).length, 0));
  assert.deepEqual(lavaCounts, [0, 1, 2, 4, 0, 5, 5, 0, 1, 1, 1, 1]);
  // Три обычных seeded-запуска исходника выбирают Lava; seed42 её не выбирает.
  assert.equal(snapshots.filter(row => row.mode === 'xorshift32' && row.waves!.some(wave => wave.enemies.includes(4))).length, 3);
  assert.ok(snapshots.every(row => row.waves!.every(wave => !wave.enemies.includes(5))));
  const batch = snapshots.find(row => row.mode === 'scripted-batch1')!;
  assert.deepEqual(batch.selections!.filter(group => group.wave === 0).map(group => group.ids[0]), [7, 4, 19]);
  const ranged = snapshots.find(row => row.mode === 'scripted-ranged')!;
  const first = ranged.selections!.filter(group => group.wave === 0);
  assert.deepEqual(first.map(group => group.ids[0]), [7, 2, 4, 10, 3]);
  assert.deepEqual(first[4].flags, ['RANGED']); assert.equal(first[4].drawAfter - first[4].drawBefore, 7);
  assert.equal(first.reduce((sum, group) => sum + group.budget, 0), 90);
  assert.deepEqual([
    snapshots.find(row => row.mode === 'constant-zero')!.selections![0].drawBefore,
    batch.selections![0].drawBefore, first[0].drawBefore,
    snapshots.find(row => row.mode === 'ranged-at-threshold')!.selections![0].drawBefore,
  ], [5, 6, 7, 8]);
  assert.ok(snapshots.every(row => row.powerOrg === 1760 && row.reward === 760 && row.spawnRate === 13.4));
  assert.ok(snapshots.every(row => (row.loot as number[]).length === (row.mode === 'constant-high' ? 1 : 0)));
  assert.deepEqual(snapshots.find(row => row.mode === 'constant-high')!.loot, [1038]);
  const at = snapshots.find(row => row.mode === 'fallback-barbarian-at')!;
  const above = snapshots.find(row => row.mode === 'fallback-barbarian-above')!;
  for (const [row, id, value] of [[at, 3, 0.5], [above, 7, 0.500001]] as const) {
    const selection = row.selections!.filter(group => group.wave === 0)[4];
    assert.equal(selection.fallback, true); assert.equal(selection.ids[0], id);
    assert.deepEqual([selection.drawBefore, selection.drawAfter], [25, 32]);
    assert.deepEqual(row.drawValues!.slice(25, 32), [0, 0, 0, 0, 0, 0, value]);
  }
  const result = compareNinthDayWaveTrace(records);
  assert.equal(result.status, 'passed'); assert.equal(result.matchedSnapshots, 12);
});

test('ninth-day reference rejects reordered random draws and replacement of the non-ranged fallback', () => {
  // Меняем порядок шестого/седьмого значений только на входе настоящего генератора;
  // сохранённый исходный fixture и число чтений пары остаются неизменными.
  const reordered = compareNinthDayWaveTrace(records, random => {
    let index = 0, held = 0;
    return () => {
      const position = index++;
      if (position === 5) { held = random(); return random(); }
      if (position === 6) return held;
      return random();
    };
  });
  assert.equal(reordered.status, 'failed');
  assert.ok(reordered.comparisons.some(row => row.differences.some(value => value.field === 'waves')));

  const corrupted = structuredClone(records);
  const ranged = corrupted.find(row => row.mode === 'scripted-ranged')!;
  ranged.waves![0].enemies = ranged.waves![0].enemies.map(id => id === 3 ? 2 : id);
  ranged.waves![0].delays[0] += 0.05;
  const changed = compareNinthDayWaveTrace(corrupted);
  assert.equal(changed.status, 'failed');
  assert.ok(changed.comparisons.find(row => row.mode === 'scripted-ranged')!.differences.some(row => row.field === 'waves'));
});

test('ninth-day reference rejects treating the Barbarian fallback boundary as inclusive', () => {
  const changed = compareNinthDayWaveTrace(records, random => {
    let index = 0;
    return () => { const value = random(); return index++ === 31 && value === 0.5 ? 0.500001 : value; };
  });
  assert.equal(changed.status, 'failed');
  assert.ok(changed.comparisons.find(row => row.mode === 'fallback-barbarian-at')!.differences.some(row => row.field === 'waves'));
});
