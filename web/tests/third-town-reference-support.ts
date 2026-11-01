import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { prepareEarlyTown } from '../src/town-preparation.ts';
import { inputSlot, project, type TownPreparationReferenceRecord } from './town-preparation-reference-support.ts';

interface RecordWithInputs extends TownPreparationReferenceRecord {
  priorRecruitSlots?: Record<string, Record<string, unknown>>; absorbFix?: number;
}

export function compareThirdTownTrace(records: RecordWithInputs[]) {
  const ready = records[0], complete = records.at(-1);
  assert.equal(ready?.version, 1); assert.equal(ready.type, 'ready'); assert.equal(ready.kind, 'third-town');
  assert.equal(ready.rng, 'xorshift32'); assert.equal(ready.clock, 'synchronous-original-frame71-preparation');
  assert.equal(ready.day, 3); assert.equal(ready.missionLevel, 3); assert.equal(ready.upgrades, false);
  assert.equal(ready.medals, true); assert.equal(ready.saveIo, false);
  assert.equal(complete?.type, 'complete'); assert.equal(complete.kind, 'third-town'); assert.equal(complete.ok, true);
  assert.equal(complete.snapshots, 6); assert.equal(records.length, 8);
  const snapshots = records.filter(record => record.type === 'snapshot');
  assert.deepEqual(snapshots.map(record => [record.seed, record.history, record.inputSearched, record.absorbFix]), [
    ...[42, 1, 3735928559].map(seed => [seed, 'reused', 321, 0]),
    ...[42, 1, 3735928559].map(seed => [seed, 'medal', 321, 0.01]),
  ]);
  const comparisons = snapshots.map(record => {
    assert.equal(record.version, 1); assert.equal(record.kind, 'third-town');
    assert.equal(record.priorOffers?.length, 8); assert.equal(record.shop?.length, 8);
    assert.deepEqual(Object.keys(record.priorRecruitSlots!).sort(), ['45', '47', '48']);
    let rng = record.seed! >>> 0, drawCount = 0;
    const random = () => { let value = rng | 0; value ^= value << 13; value ^= value >>> 17; value ^= value << 5; rng = value >>> 0; drawCount++; return rng / 4294967296; };
    const town = prepareEarlyTown(random, 3, {
      priorOffers: record.priorOffers!.map(inputSlot), searched: record.inputSearched!, absorbFix: record.absorbFix,
      recruitSlots: Object.fromEntries(Object.entries(record.priorRecruitSlots!).map(([slot, item]) => [slot, inputSlot(item)])),
    });
    const actual = { ...project(town), saveBoundary: { drawCount, rngState: rng }, drawCount, rngState: rng };
    const differences: { field: string; expected: unknown; actual: unknown }[] = [];
    for (const [field, value] of Object.entries(actual)) {
      const expected = record[field as keyof RecordWithInputs];
      if (!isDeepStrictEqual(value, expected)) differences.push({ field, expected, actual: value });
    }
    return { seed: record.seed, history: record.history, matched: differences.length === 0, originalDrawCount: record.drawCount, portDrawCount: drawCount, differences };
  });
  return { status: comparisons.every(row => row.matched) ? 'passed' as const : 'failed' as const, matchedSnapshots: comparisons.filter(row => row.matched).length, comparisons };
}
