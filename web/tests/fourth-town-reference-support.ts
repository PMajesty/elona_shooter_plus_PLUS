import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { prepareEarlyTown } from '../src/town-preparation.ts';
import { generateEarlyTownRecruit } from '../src/recruits.ts';
import { inputSlot, project, rawSlot, type TownPreparationReferenceRecord } from './town-preparation-reference-support.ts';

interface RecordWithInputs extends TownPreparationReferenceRecord {
  priorRecruitSlots?: Record<string, Record<string, unknown>>; absorbFix?: number;
  boundary?: string; classId?: number; reverse?: boolean; forced?: number[];
}

export function compareFourthTownTrace(records: RecordWithInputs[], prepareTown = prepareEarlyTown) {
  const ready = records[0], complete = records.at(-1);
  assert.equal(ready?.version, 1); assert.equal(ready.type, 'ready'); assert.equal(ready.kind, 'fourth-town');
  assert.equal(ready.rng, 'xorshift32'); assert.equal(ready.clock, 'synchronous-original-frame71-preparation');
  assert.equal(ready.day, 4); assert.equal(ready.missionLevel, 4); assert.equal(ready.upgrades, false);
  assert.equal(ready.medals, true); assert.equal(ready.saveIo, false);
  assert.equal(complete?.type, 'complete'); assert.equal(complete.kind, 'fourth-town'); assert.equal(complete.ok, true);
  assert.equal(complete.snapshots, 16); assert.equal(records.length, 18);
  const snapshots = records.filter(record => record.type === 'snapshot' && record.boundary !== 'recruit-growth');
  assert.deepEqual(snapshots.map(record => [record.seed, record.history, record.inputSearched, record.absorbFix]), [
    ...[42, 1, 3735928559].map(seed => [seed, 'reused', 321, 0]),
    ...[42, 1, 3735928559].map(seed => [seed, 'medal', 321, 0.02]),
  ]);
  const comparisons = snapshots.map(record => {
    assert.equal(record.version, 1); assert.equal(record.kind, 'fourth-town');
    assert.equal(record.priorOffers?.length, 8); assert.equal(record.shop?.length, 8);
    assert.deepEqual(Object.keys(record.priorRecruitSlots!).sort(), ['45', '47', '48']);
    let rng = record.seed! >>> 0, drawCount = 0;
    const random = () => { let value = rng | 0; value ^= value << 13; value ^= value >>> 17; value ^= value << 5; rng = value >>> 0; drawCount++; return rng / 4294967296; };
    const town = prepareTown(random, 4, {
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
  const recruitSamples = records.filter(record => record.type === 'snapshot' && record.boundary === 'recruit-growth');
  assert.deepEqual(recruitSamples.map(record => [record.classId, record.reverse]), [
    ...Array.from({ length: 9 }, (_, index) => [index + 1, false]), [6, true],
  ]);
  const recruitComparisons = recruitSamples.map(record => {
    assert.equal(record.kind, 'fourth-town'); assert.equal(record.version, 1); assert.equal(record.seed, 42);
    assert.deepEqual(record.forced, [0.99, 0.75, 7.25 / 132, (record.classId! - 0.5) / 9, 0.25, 0.5, 0.99, 0,
      record.reverse ? 0.99 : 0, record.reverse ? 0 : 0.99, 0.123, 0.999]);
    let rng = record.seed! >>> 0, drawCount = 0;
    const random = () => {
      let value = rng | 0; value ^= value << 13; value ^= value >>> 17; value ^= value << 5; rng = value >>> 0;
      return record.forced![drawCount++] ?? rng / 4294967296;
    };
    const previousSlots = Object.fromEntries(Object.entries(record.priorRecruitSlots!).map(([slot, item]) => [slot, inputSlot(item)]));
    const recruit = generateEarlyTownRecruit(random, 4, { previousSlots });
    // Генератор возвращает записи; остальные слоты кандидата остаются в общем исходном инвентаре.
    const items = { ...previousSlots, ...recruit.items };
    const actual = { recruit: { ...recruit, items: Object.fromEntries(Object.entries(items).map(([slot, item]) => [slot, rawSlot(item)])) }, drawCount, rngState: rng };
    const differences: { field: string; expected: unknown; actual: unknown }[] = [];
    for (const [field, value] of Object.entries(actual)) {
      const expected = record[field as keyof RecordWithInputs];
      if (!isDeepStrictEqual(value, expected)) differences.push({ field, expected, actual: value });
    }
    return { classId: record.classId, reverse: record.reverse, matched: differences.length === 0, originalDrawCount: record.drawCount, portDrawCount: drawCount, differences };
  });
  return {
    status: [...comparisons, ...recruitComparisons].every(row => row.matched) ? 'passed' as const : 'failed' as const,
    matchedSnapshots: [...comparisons, ...recruitComparisons].filter(row => row.matched).length,
    matchedTownSnapshots: comparisons.filter(row => row.matched).length,
    matchedRecruitSnapshots: recruitComparisons.filter(row => row.matched).length,
    comparisons, recruitComparisons,
  };
}
