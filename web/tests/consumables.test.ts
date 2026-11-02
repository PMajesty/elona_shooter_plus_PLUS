import test from 'node:test';
import assert from 'node:assert/strict';
import { ItemFactory } from '../src/items.ts';
import { advanceGrenadeFlight, advanceProtection, createGrenadeFlight, explosionContains, explosionStats, planConsumableUse } from '../src/consumables.ts';

const factory = () => new ItemFactory(() => 0.5);
const context = { castleHp: 35, castleMaxHp: 40, slotCooling: false };

test('grenade consumption preserves the item and creates a slot cooldown only while charges remain', () => {
  const item = factory().generate(11), before = structuredClone(item);
  const plan = planConsumableUse(item, context);
  assert.equal(plan.status, 'ready');
  if (plan.status !== 'ready') return;
  assert.deepEqual(plan.effect, { kind: 'grenade', damage: 45, baseSpeed: 12, weaponSlot: null });
  assert.equal(plan.itemAfter.ammo, item.ammo - 1);
  assert.equal(plan.cooldownFrames, 100); assert.equal(plan.blocksForUpdates, 101);
  assert.deepEqual(item, before);
  const last = planConsumableUse({ ...item, ammo: 1 }, context);
  assert.equal(last.status, 'ready');
  if (last.status !== 'ready') return;
  assert.equal(last.itemAfter.ammo, 0); assert.equal(last.itemAfter.num, 0);
  assert.equal(last.cooldownFrames, null); assert.equal(last.blocksForUpdates, 0);
  assert.equal(planConsumableUse(item, { ...context, slotCooling: true }).status, 'cooling');
});

test('Repair Hammer clamps healing but spends a charge at full HP, with source Supplier recharge', () => {
  const hammer = factory().generate(12);
  const plan = planConsumableUse(hammer, { ...context, supplierEffect: 20 });
  assert.equal(plan.status, 'ready');
  if (plan.status !== 'ready') return;
  assert.deepEqual(plan.effect, { kind: 'repair', castleHp: 40, restoredHp: 5, flashFrames: 15 });
  assert.equal(plan.cooldownFrames, 1666); assert.equal(plan.blocksForUpdates, 1667);
  const full = planConsumableUse(hammer, { ...context, castleHp: 40 });
  assert.equal(full.status, 'ready');
  if (full.status !== 'ready' || full.effect.kind !== 'repair') return;
  assert.equal(full.effect.restoredHp, 0); assert.equal(full.itemAfter.ammo, hammer.ammo - 1);
});

test('single-use artifacts begin at zero ammo and become inactive with the original minus-one sentinel', () => {
  for (const id of [37, 38]) {
    const item = factory().generate(id);
    assert.equal(item.ammo, 0);
    const plan = planConsumableUse(item, context);
    assert.equal(plan.status, 'ready');
    if (plan.status !== 'ready') continue;
    assert.equal(plan.itemAfter.ammo, -1); assert.equal(plan.itemAfter.num, 0);
    assert.equal(plan.cooldownFrames, null); assert.equal(plan.blocksForUpdates, 0);
    assert.equal(planConsumableUse(plan.itemAfter, context).status, 'unavailable');
    if (id === 37) assert.deepEqual(plan.effect, { kind: 'protection', frames: 250, effectX: 550, effectY: 270 });
    else assert.deepEqual(plan.effect, { kind: 'ragnarok', enemyId: 13, spawnAttempts: 30, missionTimeDelta: 200, message: "Let's Ragnarok!" });
  }
});

test('invalid consumable calculations and unusable slots do not mutate inventory', () => {
  const item = factory().generate(11), before = structuredClone(item);
  assert.equal(planConsumableUse({ ...item, attack: undefined }, context).status, 'invalid');
  assert.equal(planConsumableUse(item, { ...context, supplierEffect: Number.NaN }).status, 'invalid');
  assert.equal(planConsumableUse({ ...item, ammo: 0 }, context).status, 'unavailable');
  assert.equal(planConsumableUse(factory().generate(3), context).status, 'unavailable');
  assert.equal(planConsumableUse({ ...item, id: 999 }, context).status, 'unsupported');
  assert.deepEqual(item, before);
});

test('blast geometry is a strict rectangle with full damage, and large visuals do not add damage', () => {
  const normal = explosionStats(45, 6), large = explosionStats(45, 6, true);
  assert.equal(normal.damage, 47); assert.equal(large.damage, 47);
  assert.equal(normal.radiusX, 60 * 1.06); assert.equal(normal.radiusY, 50 * 1.06);
  assert.equal(large.radiusX, 60 * (1.06 * 1.1));
  assert.equal(explosionContains(normal, 0, 0, normal.radiusX - 0.001, normal.radiusY - 0.001, true), true);
  assert.equal(explosionContains(normal, 0, 0, normal.radiusX, 0, true), false);
  assert.equal(explosionContains(normal, 0, 0, 0, -normal.radiusY, true), false);
  assert.equal(explosionContains(normal, 0, 0, 0, 0, false), false);
  const visual = explosionStats(-1, 100, true);
  assert.equal(visual.damage, -1); assert.equal(explosionContains(visual, 0, 0, 0, 0, true), false);
});

test('grenade flight follows source count and endpoint overshoot without hiding a vertical singularity', () => {
  const flight = createGrenadeFlight(500, 200, 400, 200)!;
  assert.equal(flight.speed, 12.1); assert.equal(flight.remainingUpdates, 9);
  let step = advanceGrenadeFlight(flight);
  assert.equal(step.x, 487.9); assert.equal(step.shadowY, 200);
  assert.equal(step.exploded, false);
  for (let i = 1; i < 9; i++) step = advanceGrenadeFlight(step);
  assert.equal(step.remainingUpdates, 0); assert.equal(step.exploded, true);
  assert.ok(step.x < 400);
  assert.equal(createGrenadeFlight(500, 200, 500, 100), null);
  assert.ok(createGrenadeFlight(500, 200, 600, 200)!.speed < 0);
});

test('Grail protection ends before its negative visual fade and preserves the original double decrement', () => {
  assert.deepEqual(advanceProtection(250, 0), { counter: 249, blueMultiplierAdd: 0.1, protectsCastle: true });
  assert.deepEqual(advanceProtection(1, 0), { counter: -1, blueMultiplierAdd: -0.1, protectsCastle: false });
  assert.deepEqual(advanceProtection(-1, -0.1), { counter: -3, blueMultiplierAdd: -0.1, protectsCastle: false });
  assert.deepEqual(advanceProtection(-99, 0.1), { counter: 0, blueMultiplierAdd: 0, protectsCastle: false });
  assert.deepEqual(advanceProtection(0, 0), { counter: 0, blueMultiplierAdd: 0, protectsCastle: false });
});
