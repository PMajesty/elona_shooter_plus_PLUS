import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import type { Item } from '../src/items.ts';
import { prepareFirstTown, type FirstTownPreparation } from '../src/town-preparation.ts';

type RawItem = Record<string, unknown>;
export interface TownPreparationReferenceRecord {
  version: number; type: string; kind: string; rng?: string; clock?: string;
  day?: number; missionLevel?: number; upgrades?: boolean; medals?: boolean; saveIo?: boolean;
  seed?: number; history?: string; inputSearched?: number | null; priorOffers?: RawItem[];
  shop?: RawItem[]; cards?: number[]; mission?: Record<string, unknown>;
  recruit?: Record<string, unknown>; flags?: Record<string, unknown>; searched?: number;
  saveBoundary?: { drawCount: number; rngState: number }; drawCount?: number; rngState?: number;
  ok?: boolean; snapshots?: number;
}

const ITEM_FIELDS: (keyof Item)[] = ['num', 'id', 'graphic', 'type', 'reloadTime', 'reloadTimeMax', 'ammo', 'ammoMax', 'value', 'mod', 'modMax', 'shell', 'manualReload', 'automatic', 'modText', 'lv', 'typeMinor', 'special', 'leech', 'impact', 'shootRate', 'rare', 'autoReload', 'livingWeapon', 'name', 'baseAccuracy', 'accuracyDec', 'attack', 'dmgAir', 'dmgArmor', 'reqTrait', 'reqLv', 'range'];

function rawSlot(item: Item | null): RawItem {
  // Никогда не теряем num=0 экземпляр: лишь совершенно новый слот имеет только num/value=0.
  return Object.fromEntries(ITEM_FIELDS.map(field => [field, item ? item[field] ?? null : field === 'num' || field === 'value' ? 0 : null]));
}

function inputSlot(raw: RawItem): Item | null {
  if (raw.id === null) {
    assert.deepEqual(raw, rawSlot(null), 'An uninitialized slot contains unexpected metadata.');
    return null;
  }
  return Object.fromEntries(Object.entries(raw).filter(([, value]) => value !== null)) as unknown as Item;
}

function project(town: FirstTownPreparation) {
  return {
    ...town,
    shop: town.shop.map(rawSlot),
    recruit: { ...town.recruit, items: Object.fromEntries(Object.entries(town.recruit.items).map(([slot, item]) => [slot, rawSlot(item)])) },
  };
}

export function compareTownPreparationTrace(records: TownPreparationReferenceRecord[], prepare = prepareFirstTown) {
  const ready = records[0], complete = records.at(-1);
  assert.equal(ready?.version, 1); assert.equal(ready.type, 'ready'); assert.equal(ready.kind, 'town-preparation');
  assert.equal(ready.rng, 'xorshift32'); assert.equal(ready.clock, 'synchronous-original-frame71-preparation');
  assert.equal(ready.day, 1); assert.equal(ready.missionLevel, 1); assert.equal(ready.upgrades, false);
  assert.equal(ready.medals, false); assert.equal(ready.saveIo, false);
  assert.equal(complete?.version, 1); assert.equal(complete.type, 'complete'); assert.equal(complete.kind, 'town-preparation');
  assert.equal(complete.ok, true); assert.equal(complete.snapshots, 16); assert.equal(records.length, 18);
  const snapshots = records.filter(record => record.type === 'snapshot');
  assert.deepEqual(snapshots.map(record => [record.seed, record.history, record.inputSearched]), [
    ...[42, 1, 3735928559, 2, 3, 4, 8, 10, 12].map(seed => [seed, 'fresh', null]),
    ...[42, 1, 3735928559].map(seed => [seed, 'reused', null]),
    ...[42, 1, 3735928559].map(seed => [seed, 'collected', null]),
    [42, 'fresh', 321],
  ]);
  const comparisons = snapshots.map(record => {
    assert.equal(record.version, 1); assert.equal(record.kind, 'town-preparation');
    assert.equal(record.priorOffers?.length, 8); assert.equal(record.shop?.length, 8);
    let rng = record.seed! >>> 0;
    const states = [rng];
    const random = () => {
      let value = rng | 0;
      value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
      rng = value >>> 0; states.push(rng);
      return rng / 4294967296;
    };
    const town = prepare(random, { priorOffers: record.priorOffers!.map(inputSlot), searched: record.inputSearched ?? undefined });
    const draws = states.length - 1;
    const saveDraws = draws - (record.inputSearched === null ? 1 : 0);
    const actual: Record<string, unknown> = { ...project(town), saveBoundary: { drawCount: saveDraws, rngState: states[saveDraws] }, drawCount: draws, rngState: rng };
    const differences: { field: string; expected: unknown; actual: unknown }[] = [];
    for (const [field, value] of Object.entries(actual)) {
      const expected = record[field as keyof TownPreparationReferenceRecord];
      if (!isDeepStrictEqual(value, expected)) differences.push({ field, expected, actual: value });
    }
    return { seed: record.seed!, history: record.history!, inputSearched: record.inputSearched, recruitClass: town.recruit.devType, matched: differences.length === 0, originalDrawCount: record.drawCount!, portDrawCount: draws, differences };
  });
  return { status: comparisons.every(row => row.matched) ? 'passed' as const : 'failed' as const, matchedSnapshots: comparisons.filter(row => row.matched).length, recruitClasses: [...new Set(snapshots.map(record => Number(record.recruit?.devType)))].sort((a, b) => a - b), comparisons };
}
