import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { Simulation, type SimulationOptions } from '../src/simulation.ts';
import { ItemFactory, ITEM_TYPE } from '../src/items.ts';
import { SAVE_VERSION } from '../src/save-version.ts';

function town(options: SimulationOptions = {}): Simulation {
  const sim = new Simulation(42, options); sim['finishDay']();
  while (['loot', 'boss-loot'].includes(sim.state.postbattle)) sim.finishLoot();
  while (sim.state.postbattle === 'skill') sim.chooseSkill(sim.state.skillChoices[0]);
  assert.ok(sim.enterTown()); return sim;
}
const gun = () => ({ ...new ItemFactory(() => 0.2).generate(1), attack: 100, modMax: 6 });
const damageMod = () => new ItemFactory(() => 0).generate(10);

test('Recycle spends five AP, replaces the same owned gun with the source random MOD and grants no money', () => {
  const sim = town(); sim.state.town!.ap = 7; sim.state.inventory[2] = gun();
  const before = sim.toSave(); let seed = before.rng;
  const random = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296; };
  const expected = new ItemFactory(random, { day: 1 }).randomItem(before.inventory[2]!.value / 2 + 250, 3, before.inventory[2]!);
  assert.equal(sim.serviceTownItem('recycle', 2), 'recycled');
  assert.equal(sim.state.town!.ap, 2); assert.equal(sim.state.recycleCount, 1);
  assert.equal(sim.state.inventory[2]!.type, ITEM_TYPE.mod); assert.deepEqual(sim.state.inventory[2], expected);
  assert.equal(sim.state.rng, seed >>> 0); assert.equal(sim.state.gold, before.gold); assert.equal(sim.state.totalMoney, before.totalMoney);
  assert.deepEqual(sim.state.inventory.slice(0, 2), before.inventory.slice(0, 2));
  assert.deepEqual(Simulation.fromSave(sim.toSave()).toSave(), sim.toSave());
});

test('Restock refills eligible consumables for three AP without rerolling, changing cooldowns or reviving spent items', () => {
  const sim = town(); sim.state.town!.ap = 12;
  for (const id of [11, 12]) {
    const item = new ItemFactory(() => 0.2).generate(id); item.ammo = 1; item.reloadTime = 1;
    sim.state.inventory[2] = item; const before = sim.toSave();
    assert.equal(sim.serviceTownItem('restock', 2), 'restocked');
    assert.deepEqual(sim.state.inventory[2], { ...before.inventory[2], ammo: item.ammoMax });
    assert.equal(sim.state.town!.ap, before.town!.ap - 3); assert.equal(sim.state.rng, before.rng); assert.equal(sim.state.gold, before.gold);
    assert.deepEqual(sim.state.itemCooldowns, before.itemCooldowns);
  }
  const full = sim.toSave(); assert.equal(sim.serviceTownItem('restock', 2), 'restocked');
  assert.equal(sim.state.town!.ap, full.town!.ap - 3);
  sim.state.inventory[2]!.num = 0; const spent = sim.toSave();
  assert.equal(sim.serviceTownItem('restock', 2), 'unavailable'); assert.deepEqual(sim.toSave(), spent);
});

test('service failures are atomic for insufficient AP, invalid selections, modal actions and battle use', () => {
  const sim = town(); sim.state.inventory[2] = gun();
  let before = sim.toSave(); assert.equal(sim.serviceTownItem('recycle', 2), 'not-enough-ap'); assert.deepEqual(sim.toSave(), before);
  for (const [action, slot] of [['recycle', 1], ['restock', 0], ['recycle', -1], ['restock', 99], ['recycle', 1.5]] as const) {
    before = sim.toSave(); assert.equal(sim.serviceTownItem(action, slot), 'unavailable'); assert.deepEqual(sim.toSave(), before);
  }
  assert.ok(sim.beginModMount(3, 0) === 'unavailable');
  sim.state.inventory[3] = damageMod(); assert.equal(sim.beginModMount(3, 0), 'previewed');
  before = sim.toSave(); assert.equal(sim.serviceTownItem('restock', 1), 'unavailable'); assert.deepEqual(sim.toSave(), before);
  sim.resolveTownEquipment(false); sim.startNextDay(); before = sim.toSave();
  assert.equal(sim.serviceTownItem('restock', 1), 'unavailable'); assert.deepEqual(sim.toSave(), before);
});

test('the tenth recycle awards Gun Mania across JSON replay; Carry Over counts recycling but suppresses the new medal', () => {
  const sim = town(); sim.state.town!.ap = 50;
  for (let i = 0; i < 9; i++) { sim.state.inventory[2] = gun(); assert.equal(sim.serviceTownItem('recycle', 2), 'recycled'); }
  assert.equal(sim.state.recycleCount, 9); assert.equal(sim.state.earnedMedals.includes(83), false);
  const restored = Simulation.fromSave(JSON.parse(JSON.stringify(sim.toSave())));
  for (const game of [sim, restored]) { game.state.inventory[2] = gun(); game.serviceTownItem('recycle', 2); }
  assert.deepEqual(restored.toSave(), sim.toSave()); assert.ok(sim.state.earnedMedals.includes(83));
  sim.startNextDay(); restored.startNextDay(); for (let i = 0; i < 50; i++) { sim.tick(); restored.tick(); }
  assert.deepEqual(restored.toSave(), sim.toSave());
  const carried = town(); carried.state.carryOver = true; carried.state.recycleCount = 9; carried.state.town!.ap = 5;
  carried.state.inventory[2] = gun(); carried.serviceTownItem('recycle', 2);
  assert.equal(carried.state.recycleCount, 10); assert.equal(carried.state.earnedMedals.includes(83), false);
});

test('Gun Mania applies its source efficiency to hero, companion and loot MOD mounting', () => {
  for (const medals of [[], [83]]) {
    const sim = town({ heroClass: 'hunter', medals }); sim.state.inventory[0] = gun(); sim.state.inventory[2] = damageMod();
    assert.equal(sim.beginModMount(2, 0), 'previewed'); assert.equal(sim.resolveTownEquipment(true), 'mounted');
    assert.equal(sim.state.inventory[0]!.attack, medals.length ? 134 : 130);
    sim.state.party.slots[0].weapon = gun(); sim.state.inventory[2] = damageMod();
    assert.equal(sim.movePartyEquipment({ area: 'inventory', slot: 2 }, { area: 'party', slot: 1 }), 'previewed');
    assert.equal(sim.resolvePartyAction(true), 'mounted'); assert.equal(sim.state.party.slots[0].weapon!.attack, medals.length ? 134 : 130);
    assert.deepEqual(Simulation.fromSave(sim.toSave()).toSave(), sim.toSave());
    const loot = new Simulation(42, { medals }); loot['finishDay'](); loot.state.lootOffers[0] = gun(); loot.state.lootOffers[1] = damageMod();
    assert.equal(loot.beginLootModMount({ area: 'offers', index: 1 }, { area: 'offers', index: 0 }), 'previewed');
    assert.equal(loot.resolveLootModMount(true), 'mounted'); assert.equal(loot.state.lootOffers[0]!.attack, medals.length ? 134 : 130);
  }
});

test('legacy defaults retain their state, malformed counters are rejected and export a controlled Equipment town', () => {
  const old = new Simulation(42).toSave(); old.version = 36;
  assert.deepEqual(Simulation.fromSave(old).toSave(), { ...old, version: SAVE_VERSION });
  for (const recycleCount of [-1, 0.5, '10', null, 1000001]) assert.throws(() => Simulation.fromSave({ ...old, version: SAVE_VERSION, recycleCount }), /recycling/);
  assert.throws(() => Simulation.fromSave({ ...old, recycleCount: 1 }), /recycling/);
  const sim = town(); sim.state.town!.ap = 8; sim.state.recycleCount = 9;
  sim.state.inventory[2] = gun(); sim.state.inventory[1]!.ammo = 1;
  mkdirSync('../.build/browser-qa', { recursive: true });
  writeFileSync('../.build/browser-qa/equipment-services-town.json', JSON.stringify({ format: 'elona-shooter-browser', version: SAVE_VERSION,
    appearance: 0, simulation: sim.toSave(), profile: { version: 1, medals: sim.state.earnedMedals, bestDay: 1 } }));
});
