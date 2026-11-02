import test from 'node:test';
import assert from 'node:assert/strict';
import { ItemFactory, ITEM_TYPE, type Item } from '../src/items.ts';
import { generateEarlyTownRecruit } from '../src/recruits.ts';
import { prepareEarlyTown } from '../src/town-preparation.ts';
import { validTownPreparation } from '../src/town-save.ts';

function randomAt(seed: number) {
  let state = seed;
  return () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 4294967296; };
}
const generatedItem = (value: unknown): value is Item => Boolean(value && typeof value === 'object' && 'id' in value && 'num' in value);

test('sixth town prepares Crow Statue, ordinary stock and retained metadata without mutating its inputs', () => {
  const factory = new ItemFactory(randomAt(9));
  const priorOffers = Array.from({ length: 8 }, () => factory.generate(8));
  const before = structuredClone(priorOffers);
  const town = prepareEarlyTown(randomAt(42), 6, { priorOffers, searched: 321, absorbFix: 0.02 });
  assert.equal(town.shop[0]!.type, ITEM_TYPE.gun);
  assert.equal(town.flags.specialSale, 0);
  assert.deepEqual(town.shop.slice(2), before.slice(2).map(item => ({ ...item, num: 0 })));
  assert.deepEqual(priorOffers, before);
  assert.ok(town.mission.loot.includes(1106));
  assert.equal(town.mission.loot.includes(1037), false);
  assert.equal(town.searched, 321);
  assert.equal(validTownPreparation(town, generatedItem, 6, 0.02), true);
  assert.equal(validTownPreparation(town, generatedItem, 5, 0.02), false);
});

test('day6 recruit distribution crosses level two to three around 5/9, adding one growth step', () => {
  const recruitAt = (levelRoll: number) => {
    let count = 0;
    const recruit = generateEarlyTownRecruit(() => count++ === 0 ? levelRoll : 0.5, 6);
    return { recruit, count };
  };
  const lower = recruitAt(5 / 9 - 1e-8), upper = recruitAt(5 / 9 + 1e-8);
  assert.equal(lower.recruit.lv, 2); assert.equal(lower.recruit.sp, 1); assert.equal(lower.recruit.cost, 450);
  assert.equal(upper.recruit.lv, 3); assert.equal(upper.recruit.sp, 2); assert.equal(upper.recruit.cost, 500);
  assert.equal(upper.count, lower.count + 2);
  assert.deepEqual(upper.recruit.items, lower.recruit.items);
  const town = prepareEarlyTown(randomAt(42), 6, { searched: 321 });
  for (const { recruit } of [lower, upper]) {
    town.recruit = recruit;
    assert.equal(validTownPreparation(town, generatedItem, 6, 0), true);
  }
  const invalid = structuredClone(town); invalid.mission.loot = [1037];
  assert.equal(validTownPreparation(invalid, generatedItem, 6, 0), false);
});
