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
function recruitAt(devType: RecruitClass, level: 1 | 2, aimGrowth = 0, teamGrowth = 0.99) {
  const values = [level === 2 ? 0.99 : 0, 0.75, 7.25 / 132, (devType - 0.5) / 9, 0.25, 0.5, 0.99, 0,
    ...(level === 2 ? [aimGrowth, teamGrowth] : []), 0.123, 0.999];
  let draws = 0;
  const recruit = generateEarlyTownRecruit(() => values[draws++] ?? 0.5, 4);
  return { recruit, draws };
}

test('fourth town performs the original MOD sale and prepares the Archer statue with medal60/61 absorption', () => {
  const factory = new ItemFactory(randomAt(9));
  const priorOffers = Array.from({ length: 8 }, () => factory.generate(3));
  const before = structuredClone(priorOffers);
  const town = prepareEarlyTown(randomAt(42), 4, { priorOffers, searched: 321, absorbFix: 0.02 });
  assert.equal(town.shop[0]!.id, 8);
  assert.equal(town.shop[0]!.mod, 10);
  assert.equal(town.shop[0]!.name, 'Auto Reload Mod Lv.1');
  assert.equal(town.shop[1]!.type, ITEM_TYPE.mod);
  assert.equal(town.flags.specialSale, 0);
  assert.deepEqual(town.shop.slice(2), before.slice(2).map(item => ({ ...item, num: 0 })));
  assert.deepEqual(priorOffers, before);
  assert.ok(town.mission.loot.includes(1102));
  assert.equal(town.mission.loot.includes(1035), false);
  assert.equal(validTownPreparation(town, generatedItem, 4, 0.02), true);
  assert.equal(validTownPreparation(town, generatedItem, 4, 0.01), false);
});

test('level-two recruits in all nine classes grow before nextTrait/portrait/items and retain unspent SP', () => {
  for (let id = 1; id <= 9; id++) {
    const low = recruitAt(id as RecruitClass, 1), high = recruitAt(id as RecruitClass, 2);
    assert.equal(high.draws, low.draws + 2);
    assert.equal(high.recruit.lv, 2); assert.equal(high.recruit.sp, 1); assert.equal(high.recruit.cost, 450);
    assert.equal(high.recruit.trait[id], 2);
    assert.equal(high.recruit.trait[900], 11); assert.equal(high.recruit.trait[901], 1);
    assert.equal(high.recruit.nextTrait, 12); assert.equal(high.recruit.pic, 21);
    assert.deepEqual(high.recruit.items, low.recruit.items);
    assert.deepEqual(high.recruit.trait, { ...low.recruit.trait, [id]: 2, 900: 11 });
  }
  const reverse = recruitAt(6, 2, 0.99, 0).recruit;
  assert.equal(reverse.trait[900], 10); assert.equal(reverse.trait[901], 2);
});

test('fourth-town saves bind grown recruit level, class rank, SP, cost and hidden growth bounds', () => {
  const town = prepareEarlyTown(randomAt(42), 4, { searched: 321 });
  town.recruit = recruitAt(6, 2).recruit;
  assert.equal(validTownPreparation(town, generatedItem, 4, 0), true);
  for (const mutate of [
    (value: typeof town) => { value.recruit.sp = 0; },
    (value: typeof town) => { value.recruit.cost = 400; },
    (value: typeof town) => { value.recruit.trait[6] = 1; },
    (value: typeof town) => { value.recruit.trait[900] = 12; },
    (value: typeof town) => { value.mission.loot = [1035]; },
  ]) {
    const invalid = structuredClone(town); mutate(invalid);
    assert.equal(validTownPreparation(invalid, generatedItem, 4, 0), false);
  }
  const earlier = prepareEarlyTown(randomAt(42), 3, { searched: 321 });
  earlier.recruit = town.recruit;
  assert.equal(validTownPreparation(earlier, generatedItem, 3, 0), false);
});
