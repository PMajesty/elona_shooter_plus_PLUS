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

test('ninth town retains inactive metadata and validates its first prepared boss day without broadening earlier towns', () => {
  const factory = new ItemFactory(randomAt(9));
  const priorOffers = Array.from({ length: 8 }, () => factory.generate(8));
  priorOffers[3].num = 0;
  const recruitSlots = { 45: factory.generate(3), 47: factory.generate(40), 48: factory.generate(16) };
  recruitSlots[47].num = 0;
  const before = structuredClone({ priorOffers, recruitSlots });
  const town = prepareEarlyTown(randomAt(42), 9, { priorOffers, recruitSlots, searched: 321, absorbFix: 0.03 });
  assert.equal(town.shop[0]!.type, ITEM_TYPE.gun); assert.equal(town.flags.specialSale, 0);
  assert.deepEqual(town.shop.slice(2), before.priorOffers.slice(2).map(item => ({ ...item, num: 0 })));
  assert.deepEqual({ priorOffers, recruitSlots }, before); assert.equal(town.searched, 321);
  assert.equal(town.mission.level, 9); assert.equal(town.mission.powerOrg, 1880);
  assert.equal(town.mission.reward, 780); assert.equal(town.mission.spawnRate, 13.2);
  assert.equal(town.mission.wave, 6); assert.equal(town.mission.bossDay, true); assert.equal(town.mission.bossWave, 5);
  assert.ok([[1035, 1110].join(), [1038, 1035, 1110].join()].includes(town.mission.loot.join()));
  if (town.recruit.devType !== 4) {
    assert.deepEqual(town.recruit.items[47], before.recruitSlots[47]);
    assert.deepEqual(town.recruit.items[48], before.recruitSlots[48]);
  }
  assert.equal(validTownPreparation(town, generatedItem, 9, 0.03), true);
  for (const mutate of [
    (value: typeof town) => { value.mission.loot = [1110, 1035]; },
    (value: typeof town) => { value.mission.loot = [1110]; },
    (value: typeof town) => { value.mission.bossDay = false; },
    (value: typeof town) => { value.mission.wave = 5; },
    (value: typeof town) => { value.mission.bossWave = 3; },
    (value: typeof town) => { value.mission.absorbFix = 0.04; },
  ]) {
    const invalid = structuredClone(town); mutate(invalid);
    assert.equal(validTownPreparation(invalid, generatedItem, 9, 0.03), false);
  }
  assert.equal(validTownPreparation(town, generatedItem, 8, 0.03), false);
  const priorTown = prepareEarlyTown(randomAt(42), 8, { searched: 321 });
  assert.equal(validTownPreparation(priorTown, generatedItem, 8, 0), true);
  priorTown.mission.wave = 6; priorTown.mission.bossDay = true; priorTown.mission.bossWave = 5;
  assert.equal(validTownPreparation(priorTown, generatedItem, 8, 0), false);
});

test('day9 recruit boundaries10/27 and20/27 keep level2–4 growth, cost and retained candidate gear', () => {
  const town = prepareEarlyTown(randomAt(42), 9, { searched: 321 });
  const drawsByLevel = new Map<number, number>();
  for (const [roll, level] of [[10 / 27 - 1e-8, 2], [10 / 27 + 1e-8, 3], [20 / 27 - 1e-8, 3], [20 / 27 + 1e-8, 4]]) {
    let draws = 0;
    const recruit = generateEarlyTownRecruit(() => draws++ === 0 ? roll : 0.5, 9);
    assert.equal(recruit.lv, level); assert.equal(recruit.sp, level - 1); assert.equal(recruit.cost, 350 + level * 50);
    assert.equal(recruit.trait[recruit.devType], level);
    town.recruit = recruit;
    assert.equal(validTownPreparation(town, generatedItem, 9, 0), true);
    if (drawsByLevel.has(level)) assert.equal(draws, drawsByLevel.get(level));
    drawsByLevel.set(level, draws);
  }
  assert.equal(drawsByLevel.get(3), drawsByLevel.get(2)! + 2);
  assert.equal(drawsByLevel.get(4), drawsByLevel.get(3)! + 2);
});

test('day9 changes the Mk3 probability boundary but not its cap, and the prepared Dragonfly Statue uses the existing item', () => {
  const original = new ItemFactory(() => 0.5).generate(3);
  const outputs: Item[] = [];
  for (const [day, roll, level] of [[8, 0.99, 3], [9, 10 / 19 - 1e-8, 2], [9, 10 / 19 + 1e-8, 3], [9, 0.99, 3]]) {
    let draws = 0;
    const factory = new ItemFactory(() => { draws++; return roll; }, { day });
    const item = structuredClone(original); factory.varyWeapon(item);
    assert.equal(draws, 1); assert.equal(item.lv, level); outputs.push(item);
  }
  assert.deepEqual(outputs[0], outputs[2]); assert.deepEqual(outputs[0], outputs[3]);
  assert.ok(outputs[2].reqLv! > outputs[1].reqLv!);
  const statue = new ItemFactory(() => 0.5, { day: 9 }).generate(110);
  assert.equal(statue.name, 'Statue of Dragonfly'); assert.equal(statue.type, ITEM_TYPE.sell); assert.equal(statue.value, 150);
});
