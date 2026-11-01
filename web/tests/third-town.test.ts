import test from 'node:test';
import assert from 'node:assert/strict';
import { ItemFactory, type Item } from '../src/items.ts';
import { generateEarlyTownRecruit } from '../src/recruits.ts';
import { prepareEarlyTown } from '../src/town-preparation.ts';
import { validTownPreparation } from '../src/town-save.ts';

function randomAt(seed: number) {
  let state = seed;
  return () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 4294967296; };
}
const generatedItem = (value: unknown): value is Item => Boolean(value && typeof value === 'object' && 'id' in value && 'num' in value);

test('third town prepares a Shop Token instead of a statue and binds it to calendar 3 on load', () => {
  const town = prepareEarlyTown(randomAt(42), 3, { searched: 321, absorbFix: 0.01 });
  assert.ok(town.mission.loot.includes(1035));
  assert.equal(town.mission.loot.some(id => id >= 1100), false);
  assert.equal(town.mission.level, 3);
  assert.equal(validTownPreparation(town, generatedItem, 3, 0.01), true);
  assert.equal(validTownPreparation(town, generatedItem, 2, 0.01), false);
  for (const wrongLoot of [[1103], [1117], [1035, 1103], []]) {
    const invalid = structuredClone(town); invalid.mission.loot = wrongLoot;
    assert.equal(validTownPreparation(invalid, generatedItem, 3, 0.01), false);
  }
  const optionalRagnarok = structuredClone(town); optionalRagnarok.mission.loot = [1038, 1035];
  assert.equal(validTownPreparation(optionalRagnarok, generatedItem, 3, 0.01), true);
});

test('third-town generation retains unused shop and previous Militia metadata without mutating inputs', () => {
  const factory = new ItemFactory(randomAt(9));
  const priorOffers = Array.from({ length: 8 }, () => factory.generate(3));
  priorOffers[3].num = 0;
  const recruitSlots = { 47: factory.generate(40), 48: factory.generate(16) };
  const before = structuredClone({ priorOffers, recruitSlots });
  const town = prepareEarlyTown(randomAt(42), 3, { priorOffers, recruitSlots, searched: 321 });
  assert.deepEqual({ priorOffers, recruitSlots }, before);
  assert.deepEqual(town.shop.slice(2), before.priorOffers.slice(2).map(item => ({ ...item, num: 0 })));
  assert.notEqual(town.recruit.devType, 4);
  assert.deepEqual(town.recruit.items[47], before.recruitSlots[47]);
  assert.deepEqual(town.recruit.items[48], before.recruitSlots[48]);
  assert.equal(town.searched, 321);
  assert.equal(validTownPreparation(town, generatedItem, 3, 0), true);
  town.recruit.items[47].value++;
  assert.deepEqual(recruitSlots, before.recruitSlots);
});

test('the largest Day3 recruit level roll still produces level one without a growth draw', () => {
  const generate = (first: number) => {
    let draws = 0;
    const recruit = generateEarlyTownRecruit(() => draws++ === 0 ? first : 0.5, 3);
    return { recruit, draws };
  };
  const low = generate(0), high = generate(1 - Number.EPSILON);
  assert.deepEqual(high, low);
  assert.equal(high.recruit.lv, 1);
  assert.equal(high.recruit.sp, 0);
  assert.equal(high.recruit.cost, 400);
});
