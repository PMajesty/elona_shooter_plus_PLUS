import test from 'node:test';
import assert from 'node:assert/strict';
import { ItemFactory, ITEM_TYPE, type Item } from '../src/items.ts';
import { generateEarlyTownRecruit, type RecruitClass } from '../src/recruits.ts';
import { prepareEarlyTown } from '../src/town-preparation.ts';
import { validTownPreparation } from '../src/town-save.ts';

function randomAt(seed: number) {
  let state = seed;
  return () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 4294967296; };
}
const generatedItem = (value: unknown): value is Item => Boolean(value && typeof value === 'object' && 'id' in value && 'num' in value);
function recruitAt(devType: RecruitClass, level: 2 | 3, reverse = false) {
  const values = [level === 2 ? 0 : 0.99, 0.75, 7.25 / 132, (devType - 0.5) / 9, 0.25, 0.5, 0.99, 0,
    ...Array.from({ length: level - 1 }, () => reverse ? [0.99, 0] : [0, 0.99]).flat(), 0.123, 0.999];
  let draws = 0;
  const recruit = generateEarlyTownRecruit(() => values[draws++] ?? 0.5, 5);
  return { recruit, draws };
}

test('fifth town returns to ordinary stock and prepares Holy Grail while retaining shared slot history', () => {
  const factory = new ItemFactory(randomAt(9));
  const priorOffers = Array.from({ length: 8 }, () => factory.generate(8));
  const before = structuredClone(priorOffers);
  const town = prepareEarlyTown(randomAt(42), 5, { priorOffers, searched: 321, absorbFix: 0.02 });
  assert.equal(town.shop[0]!.type, ITEM_TYPE.gun);
  assert.equal(town.flags.specialSale, 0);
  assert.deepEqual(town.shop.slice(2), before.slice(2).map(item => ({ ...item, num: 0 })));
  assert.deepEqual(priorOffers, before);
  assert.ok(town.mission.loot.includes(1037));
  assert.equal(town.mission.loot.includes(1102), false);
  assert.equal(town.searched, 321);
  assert.equal(validTownPreparation(town, generatedItem, 5, 0.02), true);
});

test('all nine level-three classes receive two ordered growth steps without spending SP or changing class equipment', () => {
  for (let id = 1; id <= 9; id++) {
    const lower = recruitAt(id as RecruitClass, 2), higher = recruitAt(id as RecruitClass, 3);
    assert.equal(higher.draws, lower.draws + 2);
    assert.equal(lower.recruit.lv, 2); assert.equal(lower.recruit.sp, 1); assert.equal(lower.recruit.cost, 450);
    assert.equal(higher.recruit.lv, 3); assert.equal(higher.recruit.sp, 2); assert.equal(higher.recruit.cost, 500);
    assert.equal(higher.recruit.trait[id], 3);
    assert.equal(higher.recruit.trait[900], 12); assert.equal(higher.recruit.trait[901], 1);
    assert.equal(higher.recruit.nextTrait, 12); assert.equal(higher.recruit.pic, 21);
    assert.deepEqual(higher.recruit.items, lower.recruit.items);
    assert.deepEqual(higher.recruit.trait, { ...lower.recruit.trait, [id]: 3, 900: 12 });
  }
  const reverse = recruitAt(6, 3, true).recruit;
  assert.equal(reverse.trait[900], 10); assert.equal(reverse.trait[901], 3);
});

test('fifth-town save checks accept levels two/three and reject impossible growth or previous-calendar loot', () => {
  const town = prepareEarlyTown(randomAt(42), 5, { searched: 321 });
  for (const level of [2, 3] as const) {
    town.recruit = recruitAt(6, level).recruit;
    assert.equal(validTownPreparation(town, generatedItem, 5, 0), true);
  }
  for (const mutate of [
    (value: typeof town) => { value.recruit.sp = 1; },
    (value: typeof town) => { value.recruit.cost = 450; },
    (value: typeof town) => { value.recruit.trait[6] = 2; },
    (value: typeof town) => { value.recruit.trait[900] = 13; },
    (value: typeof town) => { value.mission.loot = [1102]; },
    (value: typeof town) => { value.recruit.lv = 1; value.recruit.sp = 0; value.recruit.cost = 400; value.recruit.trait[6] = 1; value.recruit.trait[900] = 10; },
  ]) {
    const invalid = structuredClone(town); mutate(invalid);
    assert.equal(validTownPreparation(invalid, generatedItem, 5, 0), false);
  }
  const earlier = prepareEarlyTown(randomAt(42), 4, { searched: 321 }); earlier.recruit = town.recruit;
  assert.equal(validTownPreparation(earlier, generatedItem, 4, 0), false);
});
