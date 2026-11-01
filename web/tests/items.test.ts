import test from 'node:test';
import assert from 'node:assert/strict';
import { ItemFactory, collectLoot, isOccupiedItem, itemPrice, sellInventoryItem, swapInventorySlots } from '../src/items.ts';

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
  const soldRecord = { ...statue, num: 0 };
  assert.equal(sellInventoryItem(slots, 0), 150);
  assert.deepEqual(slots[0], soldRecord);
  assert.equal(isOccupiedItem(slots[0]), false);
  assert.equal(sellInventoryItem(slots, 0), null);
  assert.equal(slots[1], gun);
});

test('inactive slot records accept loot and move their complete metadata back to the source', () => {
  const factory = new ItemFactory(() => 0.1);
  const inactiveGun = { ...factory.generate(3), num: 0, ammo: 2 };
  const modifier = factory.generate(8);
  const slots = [factory.generate(6), inactiveGun, null];
  const offers = [modifier];
  assert.equal(collectLoot(offers, slots, 0), true);
  assert.equal(slots[1], modifier);
  assert.equal(offers[0], inactiveGun);
  const afterCollection = structuredClone({ slots, offers });
  assert.equal(collectLoot(offers, slots, 0, 2), false);
  assert.deepEqual({ slots, offers }, afterCollection);

  slots[2] = inactiveGun;
  assert.equal(swapInventorySlots(slots, 1, 2), true);
  assert.equal(slots[1], inactiveGun);
  assert.equal(slots[2], modifier);
  const afterSwap = structuredClone(slots);
  assert.equal(swapInventorySlots(slots, 1, 0), false);
  assert.deepEqual(slots, afterSwap);
  assert.equal(isOccupiedItem(null), false);
  assert.equal(isOccupiedItem(undefined), false);
});

test('ordinary rewards clear occupancy while preserving unused and overwritten slot metadata', () => {
  const factory = new ItemFactory(() => 0.18);
  const previous = [factory.generate(3), factory.generate(11), factory.generate(117), null];
  previous[1]!.num = 0;
  const before = structuredClone(previous);
  const { offers, queue } = factory.ordinaryLoot([1117], previous);
  assert.deepEqual(previous, before);
  assert.deepEqual(queue, [117]);
  assert.equal(offers.length, 8);
  assert.equal(offers.filter(isOccupiedItem).length, 1);
  assert.equal(offers[0]?.id, 117);
  assert.equal(offers[0]?.num, 1);
  assert.equal(offers[0]?.baseAccuracy, previous[0]?.baseAccuracy);
  assert.deepEqual(offers[1], { ...previous[1], num: 0 });
  assert.deepEqual(offers[2], { ...previous[2], num: 0 });
  assert.notEqual(offers[1], previous[1]);
  assert.ok(offers.slice(3).every(item => item === null));
  const cleared = factory.ordinaryLoot([], offers).offers;
  assert.deepEqual(cleared, offers.map(item => item ? { ...item, num: 0 } : null));
  assert.equal(offers[0]?.num, 1);
});

test('boss prizes replace old offers without mutating their metadata and cap the reward slots', () => {
  // Первый кандидат — мод ID 8, поэтому отклонённое оружие не перезаписывает старые поля.
  const factory = new ItemFactory(() => 0.18);
  const previous = Array.from({ length: 8 }, () => factory.generate(3));
  previous[0].num = 0;
  const before = structuredClone(previous);
  const offers = factory.bossLoot(16, true, previous);
  assert.equal(offers.length, 8);
  assert.ok(offers.every(item => item?.type === 5 && item.num === 1));
  assert.deepEqual(previous, before);
  assert.equal(offers[0]?.baseAccuracy, previous[0].baseAccuracy);
  const fewer = factory.bossLoot(1, true, previous);
  assert.equal(fewer.filter(isOccupiedItem).length, 1);
  assert.deepEqual(fewer.slice(1), previous.slice(1).map(item => ({ ...item, num: 0 })));
  assert.notEqual(fewer[1], previous[1]);
  assert.deepEqual(previous, before);
});
