import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { BASE_ITEM_FIELDS, ItemFactory, isOccupiedItem, type Item } from '../src/items.ts';

export interface ItemReferenceRecord {
  type: string; version: number; kind?: string; rng?: string; clock?: string; day?: number;
  weaponLevelMode?: boolean; engineer?: number; looter?: number; recycleMedal?: boolean;
  scenario?: string; seed?: number; id?: number; mode?: 0 | 1 | 2 | 3 | 4; targetValue?: number;
  item?: Record<string, unknown>; inputQueue?: number[]; queue?: number[];
  offers?: (Record<string, unknown> | null)[]; slots?: (Record<string, unknown> | null)[];
  bossKilled?: number; modifiersOnly?: boolean; previousOffers?: (Record<string, unknown> | null)[];
  drawCount?: number; rngState?: number; ok?: boolean; snapshots?: number;
  baseCases?: number; randomCases?: number; ordinaryCases?: number; startingCases?: number; bossCases?: number;
}

const FIELDS: (keyof Item)[] = ['num', 'id', 'graphic', 'type', 'reloadTime', 'reloadTimeMax', 'ammo', 'ammoMax', 'value', 'mod', 'modMax', 'shell', 'manualReload', 'automatic', 'modText', 'lv', 'typeMinor', 'special', 'leech', 'impact', 'shootRate', 'rare', 'autoReload', 'livingWeapon', 'name', 'baseAccuracy', 'accuracyDec', 'attack', 'dmgAir', 'dmgArmor', 'reqTrait', 'reqLv', 'range'];

function project(item: Item | null) {
  // Наблюдатель generateLoot/generateLootBoss выдаёт null для num=0, скрывая сохранённые поля.
  if (!isOccupiedItem(item)) return null;
  // В исходном наблюдателе undefined сериализуется как null; остальные значения не преобразуются.
  return Object.fromEntries(FIELDS.map(field => [field, item[field] ?? null]));
}

export function compareItemTrace(records: ItemReferenceRecord[]) {
  const ready = records[0];
  assert.equal(ready?.type, 'ready'); assert.equal(ready.version, 1); assert.equal(ready.kind, 'loot');
  assert.equal(ready.rng, 'xorshift32'); assert.equal(ready.clock, 'synchronous-original-item-methods');
  assert.equal(ready.day, 1); assert.equal(ready.weaponLevelMode, false);
  assert.equal(ready.engineer, 0); assert.equal(ready.looter, 0); assert.equal(ready.recycleMedal, false);
  const completed = records.at(-1);
  assert.equal(completed?.type, 'complete'); assert.equal(completed.kind, 'loot'); assert.equal(completed.ok, true);
  assert.equal(completed.baseCases, 116); assert.equal(completed.randomCases, 15);
  assert.equal(completed.ordinaryCases, 6); assert.equal(completed.startingCases, 2);
  const bossCases = completed.bossCases ?? 0;
  assert.ok(bossCases === 0 || bossCases === 18);
  const snapshots = records.filter(record => record.type === 'snapshot');
  assert.equal(snapshots.length, 139 + bossCases); assert.equal(completed.snapshots, snapshots.length); assert.equal(records.length, snapshots.length + 2);
  assert.deepEqual(snapshots.filter(record => record.scenario === 'base').map(record => [record.seed, record.id]), [42, 3735928559].flatMap(seed => Object.keys(BASE_ITEM_FIELDS).map(id => [seed, Number(id)])));
  assert.equal(snapshots.filter(record => record.scenario === 'boss').length, bossCases);
  if (bossCases) assert.deepEqual(snapshots.filter(record => record.scenario === 'boss').map(record => [record.seed, record.bossKilled, record.modifiersOnly, Boolean(record.previousOffers?.length)]), [42, 1, 3735928559].flatMap(seed => [[1, false, false], [2, false, false], [16, false, false], [2, true, false], [2, false, true], [2, true, true]].map(row => [seed, ...row])));

  const comparisons = snapshots.map(record => {
    assert.equal(record.version, 1); assert.equal(record.kind, 'loot');
    let rng = record.seed! >>> 0 || 1;
    let draws = 0;
    const factory = new ItemFactory(() => {
      let value = rng | 0;
      value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
      rng = value >>> 0; draws++;
      return rng / 4294967296;
    });
    const actual: Record<string, unknown> = {};
    switch (record.scenario) {
      case 'base': actual.item = project(factory.generate(record.id!)); break;
      case 'random': actual.item = project(factory.randomItem(record.targetValue!, record.mode!)); break;
      case 'ordinary': {
        const loot = factory.ordinaryLoot(record.inputQueue!);
        actual.offers = loot.offers.map(project); actual.queue = loot.queue;
        break;
      }
      case 'starting': actual.slots = factory.startingInventory().map(project); break;
      case 'boss': {
        // null означает undefined только в записи полей оригинального наблюдателя.
        const previous = record.previousOffers!.map(item => item ? Object.fromEntries(Object.entries(item).filter(([, value]) => value !== null)) as unknown as Item : null);
        actual.offers = factory.bossLoot(record.bossKilled!, record.modifiersOnly!, previous).map(project);
        break;
      }
      default: throw new Error(`Unknown original item scenario: ${record.scenario}`);
    }
    actual.drawCount = draws; actual.rngState = rng;
    const differences: { field: string; expected: unknown; actual: unknown }[] = [];
    for (const [field, value] of Object.entries(actual)) {
      const expected = record[field as keyof ItemReferenceRecord];
      if (!isDeepStrictEqual(value, expected)) differences.push({ field, expected, actual: value });
    }
    return { scenario: record.scenario!, seed: record.seed!, id: record.id, mode: record.mode, matched: differences.length === 0, originalDrawCount: record.drawCount!, portDrawCount: draws, differences };
  });
  return { status: comparisons.every(row => row.matched) ? 'passed' as const : 'failed' as const, matchedSnapshots: comparisons.filter(row => row.matched).length, comparisons };
}
