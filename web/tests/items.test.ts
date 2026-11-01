import test from 'node:test';
import assert from 'node:assert/strict';
import { ItemFactory, collectLoot, itemPrice, sellInventoryItem, swapInventorySlots } from '../src/items.ts';

test('full inventory cannot silently consume loot; explicit replacement preserves both items', () => {
  const factory = new ItemFactory(() => 0.1);
  const slots = Array.from({ length: 6 }, () => factory.generate(6));
  const offers = [factory.generate(117)];
  const before = structuredClone({ slots, offers });
  assert.equal(collectLoot(offers, slots, 0), false);
  assert.deepEqual({ slots, offers }, before);
  assert.equal(collectLoot(offers, slots, 0, 2), true);
  assert.equal(slots[2].id, 117); assert.equal(offers[0]?.id, 6);
  assert.equal(collectLoot(offers, slots, 0, 2), true);
  assert.deepEqual({ slots, offers }, before);
});

test('moving a mod onto a gun does not silently mount or consume it', () => {
  const factory = new ItemFactory(() => 0.1);
  const slots = [factory.generate(3), factory.generate(8)];
  const before = structuredClone(slots);
  assert.equal(swapInventorySlots(slots, 1, 0), false);
  assert.deepEqual(slots, before);
  const offers = [factory.generate(8)];
  assert.equal(collectLoot(offers, slots, 0, 0), false);
  assert.equal(offers[0]?.id, 8);
});

test('source selling preserves statue value, truncates equipment value, and removes an item only once', () => {
  const factory = new ItemFactory(() => 0.1);
  const statue = factory.generate(117);
  assert.equal(itemPrice(statue), 150);
  const gun = factory.generate(3); gun.value = 529.9;
  assert.equal(itemPrice(gun, true), 529); assert.equal(itemPrice(gun), 105);
  const slots = [statue, gun, null];
  assert.equal(sellInventoryItem(slots, 0), 150);
  assert.equal(sellInventoryItem(slots, 0), null);
  assert.equal(slots[1], gun);
});
