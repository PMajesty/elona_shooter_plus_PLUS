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
function recruitAt(devType: RecruitClass, level: 3 | 4, reverse = false) {
  const values = [level === 4 ? 0.99 : 0.7, 0.75, 7.25 / 132, (devType - 0.5) / 9, 0.25, 0.5, 0.99, 0,
    ...Array.from({ length: level - 1 }, () => reverse ? [0.99, 0] : [0, 0.99]).flat(), 0.123, 0.999];
  let draws = 0;
  const recruit = generateEarlyTownRecruit(() => values[draws++] ?? 0.5, 7);
  return { recruit, draws };
}

test('seventh town retains shared metadata and prepares no guaranteed calendar item with the new medal absorption', () => {
  const factory = new ItemFactory(randomAt(9));
  const priorOffers = Array.from({ length: 8 }, () => factory.generate(8));
  const before = structuredClone(priorOffers);
  const town = prepareEarlyTown(randomAt(42), 7, { priorOffers, searched: 321, absorbFix: 0.03 });
  assert.equal(town.shop[0]!.type, ITEM_TYPE.gun); assert.equal(town.flags.specialSale, 0);
  assert.deepEqual(town.shop.slice(2), before.slice(2).map(item => ({ ...item, num: 0 })));
  assert.deepEqual(priorOffers, before); assert.equal(town.searched, 321);
  assert.ok(town.mission.loot.length === 0 || town.mission.loot.length === 1 && town.mission.loot[0] === 1038);
  assert.equal(validTownPreparation(town, generatedItem, 7, 0.03), true);
  const invalid = structuredClone(town); invalid.mission.loot = [1106];
  assert.equal(validTownPreparation(invalid, generatedItem, 7, 0.03), false);
  assert.equal(validTownPreparation(town, generatedItem, 6, 0.03), false);
});

test('all nine level-four recruit classes gain three ordered growth steps while preserving their class equipment', () => {
  const town = prepareEarlyTown(randomAt(42), 7, { searched: 321 });
  for (let id = 1; id <= 9; id++) {
    const lower = recruitAt(id as RecruitClass, 3), higher = recruitAt(id as RecruitClass, 4);
    assert.equal(higher.draws, lower.draws + 2);
    assert.equal(higher.recruit.lv, 4); assert.equal(higher.recruit.sp, 3); assert.equal(higher.recruit.cost, 550);
    assert.equal(higher.recruit.trait[id], 4);
    assert.equal(higher.recruit.trait[900], 13); assert.equal(higher.recruit.trait[901], 1);
    assert.equal(higher.recruit.nextTrait, 12); assert.equal(higher.recruit.pic, 21);
    assert.deepEqual(higher.recruit.items, lower.recruit.items);
    assert.deepEqual(higher.recruit.trait, { ...lower.recruit.trait, [id]: 4, 900: 13 });
    town.recruit = higher.recruit;
    assert.equal(validTownPreparation(town, generatedItem, 7, 0), true);
  }
  const reverse = recruitAt(6, 4, true).recruit;
  assert.equal(reverse.trait[900], 10); assert.equal(reverse.trait[901], 4);
});

test('day7 recruitment crosses both new distribution boundaries and rejects impossible level-four metadata', () => {
  for (const [roll, level] of [[10 / 21 - 1e-8, 2], [10 / 21 + 1e-8, 3], [20 / 21 - 1e-8, 3], [20 / 21 + 1e-8, 4]]) {
    let draws = 0;
    const recruit = generateEarlyTownRecruit(() => draws++ === 0 ? roll : 0.5, 7);
    assert.equal(recruit.lv, level); assert.equal(recruit.sp, level - 1); assert.equal(recruit.cost, 350 + level * 50);
  }
  const town = prepareEarlyTown(randomAt(42), 7, { searched: 321 }); town.recruit = recruitAt(6, 4).recruit;
  for (const mutate of [
    (value: typeof town) => { value.recruit.sp = 2; },
    (value: typeof town) => { value.recruit.cost = 500; },
    (value: typeof town) => { value.recruit.trait[6] = 3; },
    (value: typeof town) => { value.recruit.trait[900] = 14; },
    (value: typeof town) => { value.recruit.trait[105] = 4; },
  ]) {
    const invalid = structuredClone(town); mutate(invalid);
    assert.equal(validTownPreparation(invalid, generatedItem, 7, 0), false);
  }
  const previous = prepareEarlyTown(randomAt(42), 6, { searched: 321 }); previous.recruit = town.recruit;
  assert.equal(validTownPreparation(previous, generatedItem, 6, 0), false);
});
