import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../src/simulation.ts';
import { castleStorageLevel, castleUpgradeCost, castleUpkeep } from '../src/castle-upgrades.ts';
import { ItemFactory, isOccupiedItem, itemPrice } from '../src/items.ts';
import { asLegacyV18Save } from './legacy-save-support.ts';

const saved = (simulation: Simulation) => JSON.parse(JSON.stringify(simulation.toSave()));
const factory = () => new ItemFactory(() => 0.5);
function settle(simulation: Simulation): void {
  (simulation as unknown as { finishDay(): void }).finishDay();
  while (simulation.state.postbattle !== 'result') {
    if (simulation.state.postbattle === 'skill') assert.equal(simulation.chooseSkill(simulation.state.skillChoices[0]), true);
    else assert.equal(simulation.finishLoot(), true);
  }
}
function town(): Simulation {
  const simulation = new Simulation(42);
  // Контролируемый конец боя и капитал проверяют операции, а не обычную доступность всех покупок.
  settle(simulation); assert.equal(simulation.enterTown(), true); simulation.state.gold = 100000;
  return simulation;
}
function capacity(simulation: Simulation, count: number): void {
  while (simulation.state.inventory.length < count) assert.equal(simulation.buyCastleUpgrade('storage'), 'purchased');
}
function restore(simulation: Simulation): Simulation {
  const checkpoint = saved(simulation), resumed = Simulation.fromSave(checkpoint);
  assert.deepEqual(resumed.toSave(), checkpoint); return resumed;
}

test('Storage appends one empty slot at AP0, preserves every existing record and caps sixteen slots', () => {
  let simulation = town(); simulation.state.gold = 369; simulation.state.town!.ap = 0;
  const insufficient = saved(simulation);
  assert.equal(simulation.buyCastleUpgrade('storage'), 'not-enough-gold'); assert.deepEqual(saved(simulation), insufficient);
  const prices = [370, 520, 730, 1000, 1330, 1720, 2170, 2680, 3250, 3880];
  for (const [index, price] of prices.entries()) {
    simulation.state.gold = price; const expected = saved(simulation);
    expected.gold = 0; expected.inventory.push(null);
    assert.equal(castleUpgradeCost('storage', simulation.state), price);
    assert.equal(simulation.buyCastleUpgrade('storage'), 'purchased');
    assert.deepEqual(saved(simulation), expected, 'no AP, RNG, HP, preparation or settled-result mutation');
    assert.equal(simulation.state.inventory.length, index + 7);
    assert.equal(castleStorageLevel(simulation.state), index + 2);
    assert.equal(Object.hasOwn(simulation.state, 'storageLevel'), false);
    simulation = restore(simulation);
  }
  assert.equal(castleStorageLevel(simulation.state), 11); assert.equal(castleUpkeep(simulation.state), 440);
  assert.equal(castleUpgradeCost('storage', simulation.state), 0);
  const capped = saved(simulation); assert.equal(simulation.buyCastleUpgrade('storage'), 'capped'); assert.deepEqual(saved(simulation), capped);
});

test('the seventh owned slot buys real stock, swaps, sells and applies a Shop Token', () => {
  let simulation = town(); capacity(simulation, 7);
  assert.ok(simulation.state.town?.preparation === 'ready');
  const stock = simulation.state.town.shop.findIndex(isOccupiedItem), item = structuredClone(simulation.state.town.shop[stock])!;
  const gold = simulation.state.gold;
  assert.equal(simulation.buyStock(stock, 6), 'purchased');
  assert.deepEqual(simulation.state.inventory[6], item); assert.equal(simulation.state.gold, gold - Math.trunc(item.value));
  simulation = restore(simulation);
  assert.equal(simulation.moveTownItem(6, 5), true); assert.equal(simulation.moveTownItem(5, 6), true);
  const beforeSale = simulation.state.gold, total = simulation.state.totalMoney;
  assert.equal(simulation.sellTownItem(6), itemPrice(item));
  assert.equal(simulation.state.gold, beforeSale + itemPrice(item)); assert.equal(simulation.state.totalMoney, total + itemPrice(item));
  assert.deepEqual(simulation.state.inventory[6], { ...item, num: 0 }, 'sold metadata remains in its expanded slot');
  simulation.state.inventory[6] = factory().generate(35);
  assert.ok(simulation.state.town?.preparation === 'ready');
  const target = simulation.state.town.shop.findIndex(isOccupiedItem), value = simulation.state.town.shop[target]!.value;
  const discount = simulation.state.inventory[6]!.attack!;
  assert.equal(simulation.applyShopToken(6, target), true);
  assert.equal(simulation.state.town.shop[target]!.value, Math.max(0, value - discount));
  assert.equal(simulation.state.inventory[6]!.num, 0); restore(simulation);
  const before = saved(simulation);
  assert.equal(simulation.buyStock(target, 7), 'unavailable'); assert.equal(simulation.sellTownItem(7), null);
  assert.equal(simulation.applyShopToken(7, target), false); assert.deepEqual(saved(simulation), before);
});

test('expanded-slot weapon upgrades and MOD confirmations save exactly, and lock Storage while pending', () => {
  let simulation = town(); capacity(simulation, 9);
  assert.equal(simulation.moveTownItem(0, 6), true);
  assert.equal(simulation.beginWeaponUpgrade(6), 'previewed');
  const preview = structuredClone(simulation.state.upgradeReference), pending = saved(simulation);
  assert.equal(simulation.buyCastleUpgrade('storage'), 'unavailable'); assert.deepEqual(saved(simulation), pending);
  simulation = restore(simulation);
  assert.equal(simulation.resolveTownEquipment(true), 'upgraded'); assert.deepEqual(simulation.state.inventory[6], preview);
  const maker = factory(), mod = maker.generate(8); maker.setMod(mod, 4);
  simulation.state.inventory[6] = mod; simulation.state.inventory[8] = maker.generate(3);
  assert.equal(simulation.beginModMount(6, 8), 'previewed'); simulation = restore(simulation);
  const invalid = saved(simulation); invalid.inventory.length = 6;
  assert.throws(() => Simulation.fromSave(invalid), /pending mod slots/);
  assert.equal(simulation.resolveTownEquipment(false), 'swapped');
  assert.equal(simulation.state.inventory[8]!.type, mod.type);
  const attack = simulation.state.inventory[6]!.attack!;
  assert.equal(simulation.beginModMount(8, 6), 'previewed'); simulation = restore(simulation);
  assert.equal(simulation.resolveTownEquipment(true), 'mounted');
  assert.ok(simulation.state.inventory[6]!.attack! > attack); assert.equal(simulation.state.inventory[8]!.num, 0);
  restore(simulation);
});

test('the sixteenth slot exchanges companion equipment and retains a pending companion MOD across saves', () => {
  let simulation = town(); capacity(simulation, 16);
  assert.equal(simulation.requestRecruit(), 'previewed');
  const before = saved(simulation); assert.equal(simulation.buyCastleUpgrade('storage'), 'unavailable'); assert.deepEqual(saved(simulation), before);
  assert.equal(simulation.resolvePartyAction(true), 'hired');
  const owned = { area: 'inventory', slot: 15 } as const, ally = { area: 'party', slot: 1 } as const;
  const weapon = structuredClone(simulation.actorWeapon(1));
  assert.equal(simulation.movePartyEquipment(ally, owned), 'moved'); simulation = restore(simulation);
  assert.deepEqual(simulation.state.inventory[15], weapon);
  assert.equal(simulation.movePartyEquipment(owned, ally), 'moved');
  const maker = factory(), mod = maker.generate(8); maker.setMod(mod, 4); simulation.state.inventory[15] = mod;
  const attack = simulation.actorWeapon(1)!.attack!;
  assert.equal(simulation.movePartyEquipment(owned, ally), 'previewed'); simulation = restore(simulation);
  assert.equal(simulation.resolvePartyAction(true), 'mounted');
  assert.ok(simulation.actorWeapon(1)!.attack! > attack); assert.equal(simulation.state.inventory[15]!.num, 0);
  restore(simulation);
});

test('Rest refills guns throughout expanded storage, preserves consumable ammo and keeps only five battle slots', () => {
  let simulation = town(); capacity(simulation, 9);
  const maker = factory();
  simulation.state.inventory[6] = { ...maker.generate(3), ammo: 1, reloadTime: 3 };
  simulation.state.inventory[7] = { ...maker.generate(4), num: 0, ammo: 0, reloadTime: 3 };
  simulation.state.inventory[8] = { ...maker.generate(11), ammo: 2 };
  const consumable = structuredClone(simulation.state.inventory[8]);
  const oldResult = structuredClone(simulation.state.result);
  assert.equal(oldResult.upkeep, 40); assert.equal(castleUpkeep(simulation.state), 160);
  simulation = restore(simulation); assert.equal(simulation.startNextDay(), true);
  for (const slot of [6, 7]) {
    assert.equal(simulation.state.inventory[slot]!.ammo, simulation.state.inventory[slot]!.ammoMax);
    assert.equal(simulation.state.inventory[slot]!.reloadTime, 0);
  }
  assert.deepEqual(simulation.state.inventory[8], consumable); assert.equal(simulation.state.itemCooldowns.length, 5);
  for (const slot of [5, 6, 8]) assert.equal(simulation.useSlot(slot), false);
  assert.equal(simulation.state.player.selectedSlot, 0); simulation = restore(simulation);
  const replay = restore(simulation);
  for (let frame = 0; frame < 20; frame++) { simulation.tick(); replay.tick(); assert.deepEqual(replay.state, simulation.state); assert.deepEqual(replay.events, simulation.events); }
  settle(simulation); assert.equal(simulation.state.result.upkeep, 160); restore(simulation);
});

test('ordinary postbattle loot can occupy a newly purchased seventh slot without expanding the eight offers', () => {
  let simulation = town(); capacity(simulation, 7);
  for (let slot = 2; slot < 6; slot++) simulation.state.inventory[slot] = factory().generate(6);
  assert.equal(simulation.startNextDay(), true);
  (simulation as unknown as { finishDay(): void }).finishDay();
  const offer = simulation.state.lootOffers.findIndex(isOccupiedItem), item = structuredClone(simulation.state.lootOffers[offer]);
  assert.ok(item); assert.equal(simulation.state.lootOffers.length, 8);
  assert.equal(simulation.collectLoot(offer), true); assert.deepEqual(simulation.state.inventory[6], item);
  simulation = restore(simulation); assert.equal(simulation.dropLootItem(6, offer), true);
  assert.deepEqual(simulation.state.lootOffers[offer], item); assert.equal(simulation.state.inventory.length, 7);
  restore(simulation);
});

test('settlement preserves imported consumable reload metadata, while the following Rest resets it without adding ammo', () => {
  let simulation = town(); capacity(simulation, 7);
  assert.equal(simulation.startNextDay(), true);
  // Допустимые импортированные метаданные, не утверждение обычного получения такого таймера.
  simulation.state.inventory[6] = { ...factory().generate(11), ammo: 1, reloadTime: 1 };
  simulation = restore(simulation);
  const before = structuredClone(simulation.state.inventory[6]);
  settle(simulation);
  assert.deepEqual(simulation.state.inventory[6], before);
  simulation = restore(simulation);
  assert.equal(simulation.enterTown(), true);
  assert.equal(simulation.startNextDay(), true);
  assert.deepEqual(simulation.state.inventory[6], { ...before, reloadTime: 0 });
  restore(simulation);
});

test('v18 migration keeps repairs, Sandbags, companions and RNG; v19 onward accepts six through sixteen valid slots', () => {
  const simulation = town();
  for (const kind of ['house', 'wall', 'repairman', 'sandbag'] as const) assert.equal(simulation.buyCastleUpgrade(kind), 'purchased');
  simulation.state.castleHp = 43; assert.equal(simulation.buyCastleUpgrade('fix-wall'), 'purchased');
  assert.equal(simulation.requestRecruit(), 'previewed'); assert.equal(simulation.resolvePartyAction(true), 'hired');
  const legacy = asLegacyV18Save(simulation.toSave()), before = structuredClone(legacy);
  assert.deepEqual(Simulation.fromSave(legacy).toSave(), { ...legacy, version: 23, trainerLevel: 0, looterLevel: 0, pendingLootAction: null }); assert.deepEqual(legacy, before);
  assert.equal(simulation.buyCastleUpgrade('storage'), 'purchased'); const checkpoint = saved(simulation);
  for (const corrupt of [
    (value: any) => { value.version = 18; },
    (value: any) => { value.inventory.length = 5; },
    (value: any) => { value.inventory = Array(17).fill(null); },
    (value: any) => { delete value.inventory[6]; },
    (value: any) => { value.inventory[6] = { id: 999999 }; },
    (value: any) => { value.player.selectedSlot = 6; },
    (value: any) => { value.itemCooldowns.push(0); },
  ]) {
    const invalid = structuredClone(checkpoint); corrupt(invalid); const untouched = structuredClone(invalid);
    assert.throws(() => Simulation.fromSave(invalid)); assert.deepEqual(invalid, untouched);
  }
});
