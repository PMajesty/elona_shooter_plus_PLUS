import test from 'node:test';
import assert from 'node:assert/strict';
import { ItemFactory, type Item } from '../src/items.ts';
import { prepareEarlyTown } from '../src/town-preparation.ts';
import { validTownPreparation } from '../src/town-save.ts';

function randomAt(seed: number) {
  let state = seed;
  return () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 4294967296; };
}
const generatedItem = (value: unknown): value is Item => Boolean(value && typeof value === 'object' && 'id' in value && 'num' in value);

test('town save validation binds mission level, calendar loot and absorption to the campaign boundary', () => {
  const town = prepareEarlyTown(randomAt(42), 2, { searched: 321, absorbFix: 0.01 });
  assert.equal(validTownPreparation(town, generatedItem, 2, 0.01), true);
  assert.equal(validTownPreparation(town, generatedItem, 1, 0.01), false);
  assert.equal(validTownPreparation(town, generatedItem, 2, 0), false);
  const wrongStatue = structuredClone(town); wrongStatue.mission.loot = [1117];
  assert.equal(validTownPreparation(wrongStatue, generatedItem, 2, 0.01), false);
});

test('town saves retain old Militia slots while rejecting unrelated recruit slots', () => {
  const factory = new ItemFactory(randomAt(9));
  const oldSlots = { 47: factory.generate(40), 48: factory.generate(16) };
  const town = prepareEarlyTown(randomAt(1), 2, { searched: 321, recruitSlots: oldSlots });
  assert.equal(validTownPreparation(town, generatedItem, 2, 0), true);
  assert.notEqual(town.recruit.devType, 4);
  assert.deepEqual(town.recruit.items[47], oldSlots[47]);
  assert.deepEqual(town.recruit.items[48], oldSlots[48]);
  town.recruit.items[46] = factory.generate(3);
  assert.equal(validTownPreparation(town, generatedItem, 2, 0), false);
});
