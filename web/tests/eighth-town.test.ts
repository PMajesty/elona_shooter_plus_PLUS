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

test('eighth town preserves shared inactive slots and search state while preparing mission8 without a calendar guarantee', () => {
  const factory = new ItemFactory(randomAt(9));
  const priorOffers = Array.from({ length: 8 }, () => factory.generate(8));
  priorOffers[3].num = 0;
  const recruitSlots = { 45: factory.generate(3), 47: factory.generate(40), 48: factory.generate(16) };
  recruitSlots[47].num = 0;
  const before = structuredClone({ priorOffers, recruitSlots });
  const town = prepareEarlyTown(randomAt(42), 8, { priorOffers, recruitSlots, searched: 321, absorbFix: 0.03 });
  assert.equal(town.shop[0]!.type, ITEM_TYPE.gun); assert.equal(town.flags.specialSale, 0);
  assert.deepEqual(town.shop.slice(2), before.priorOffers.slice(2).map(item => ({ ...item, num: 0 })));
  assert.deepEqual({ priorOffers, recruitSlots }, before); assert.equal(town.searched, 321);
  assert.equal(town.mission.level, 8); assert.equal(town.mission.powerOrg, 1760);
  assert.equal(town.mission.reward, 760); assert.equal(town.mission.spawnRate, 13.4);
  assert.ok(town.mission.loot.length === 0 || town.mission.loot.length === 1 && town.mission.loot[0] === 1038);
  if (town.recruit.devType !== 4) {
    assert.deepEqual(town.recruit.items[47], before.recruitSlots[47]);
    assert.deepEqual(town.recruit.items[48], before.recruitSlots[48]);
  }
  assert.equal(validTownPreparation(town, generatedItem, 8, 0.03), true);
  for (const mutate of [
    (value: typeof town) => { value.mission.loot = [1106]; },
    (value: typeof town) => { value.mission.level = 7; },
    (value: typeof town) => { value.mission.absorbFix = 0.04; },
  ]) {
    const invalid = structuredClone(town); mutate(invalid);
    assert.equal(validTownPreparation(invalid, generatedItem, 8, 0.03), false);
  }
  assert.equal(validTownPreparation(town, generatedItem, 7, 0.03), false);
});

test('day8 recruit distribution crosses5/12 and5/6 without adding a new level or losing growth draws', () => {
  const town = prepareEarlyTown(randomAt(42), 8, { searched: 321 });
  const drawsByLevel = new Map<number, number>();
  for (const [roll, level] of [[5 / 12 - 1e-8, 2], [5 / 12 + 1e-8, 3], [5 / 6 - 1e-8, 3], [5 / 6 + 1e-8, 4]]) {
    let draws = 0;
    const recruit = generateEarlyTownRecruit(() => draws++ === 0 ? roll : 0.5, 8);
    assert.equal(recruit.lv, level); assert.equal(recruit.sp, level - 1); assert.equal(recruit.cost, 350 + level * 50);
    assert.equal(recruit.trait[recruit.devType], level);
    town.recruit = recruit;
    assert.equal(validTownPreparation(town, generatedItem, 8, 0), true);
    if (drawsByLevel.has(level)) assert.equal(draws, drawsByLevel.get(level));
    drawsByLevel.set(level, draws);
  }
  assert.equal(drawsByLevel.get(3), drawsByLevel.get(2)! + 2);
  assert.equal(drawsByLevel.get(4), drawsByLevel.get(3)! + 2);
  const invalid = structuredClone(town); invalid.recruit.trait[invalid.recruit.devType] = 5;
  assert.equal(validTownPreparation(invalid, generatedItem, 8, 0), false);
});

test('day8 permits Mk3 weapon variation while day7 still truncates the same high roll to Mk2', () => {
  const original = new ItemFactory(() => 0.5).generate(3);
  const outputs: Item[] = [];
  for (const [day, roll, level] of [[7, 0.99, 2], [8, 5 / 9 - 1e-8, 2], [8, 5 / 9 + 1e-8, 3], [8, 0.99, 3]]) {
    let draws = 0;
    const factory = new ItemFactory(() => { draws++; return roll; }, { day });
    const item = structuredClone(original); factory.varyWeapon(item);
    assert.equal(draws, 1); assert.equal(item.lv, level);
    assert.equal(item.name, `${original.name} Mk-${level}`);
    outputs.push(item);
  }
  assert.deepEqual(outputs[0], outputs[1]); assert.deepEqual(outputs[2], outputs[3]);
  assert.ok(outputs[2].attack! > outputs[1].attack!);
  assert.ok(outputs[2].reqLv! > outputs[1].reqLv!);
});
