import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation, type LootArea } from '../src/simulation.ts';
import { ItemFactory, isOccupiedItem, type Item } from '../src/items.ts';
import type { LootItemAddress } from '../src/equipment.ts';
import { asLegacyV19Save } from './legacy-save-support.ts';

const save = (sim: Simulation) => JSON.parse(JSON.stringify(sim.toSave()));
const address = (area: LootArea, index: number): LootItemAddress => ({ area, index });
const cell = (sim: Simulation, at: LootItemAddress): Item | null => (at.area === 'offers' ? sim.state.lootOffers : sim.state.inventory)[at.index];
const put = (sim: Simulation, at: LootItemAddress, item: Item | null): void => { (at.area === 'offers' ? sim.state.lootOffers : sim.state.inventory)[at.index] = item; };
const combinations: [LootArea, LootArea][] = [['offers', 'inventory'], ['inventory', 'offers'], ['offers', 'offers'], ['inventory', 'inventory']];
function loot(stage: 'loot' | 'boss-loot' = 'loot', capacity = 6): Simulation {
  const sim = new Simulation(42);
  // Контролируемая граница награды проверяет транзакции; это не доказательство прохождения боя.
  while (sim.state.inventory.length < capacity) sim.state.inventory.push(null);
  if (stage === 'boss-loot') sim.state.bossKilled = 1;
  (sim as unknown as { finishDay(): void }).finishDay();
  if (stage === 'boss-loot') assert.equal(sim.finishLoot(), true);
  assert.equal(sim.state.postbattle, stage);
  return sim;
}
function setup(sim: Simulation, modArea: LootArea, gunArea: LootArea, modId = 4): { mod: LootItemAddress; gun: LootItemAddress } {
  const factory = new ItemFactory(() => 0.5), mod = address(modArea, modArea === 'offers' ? 0 : sim.state.inventory.length - 1), gun = address(gunArea, gunArea === 'offers' ? 1 : 0);
  const source = factory.generate(8); factory.setMod(source, modId);
  put(sim, mod, source); put(sim, gun, { ...factory.generate(3), ammo: 1, reloadTime: 3 });
  return { mod, gun };
}
function restore(sim: Simulation): Simulation {
  const checkpoint = save(sim), untouched = structuredClone(checkpoint), result = Simulation.fromSave(checkpoint);
  assert.deepEqual(result.state, checkpoint); assert.deepEqual(checkpoint, untouched);
  return result;
}

test('ordinary and boss loot mount all four offered/owned directions after an exact pending save, without payment or rerolls', () => {
  for (const stage of ['loot', 'boss-loot'] as const) for (const [modArea, gunArea] of combinations) {
    const sim = loot(stage), { mod, gun } = setup(sim, modArea, gunArea), before = save(sim);
    assert.equal(sim.moveLootItem(mod.area, mod.index, gun.area, gun.index), true);
    assert.deepEqual(sim.state.pendingLootAction, { kind: 'mod', mod, gun });
    assert.deepEqual(sim.toSave(), { ...before, pendingLootAction: { kind: 'mod', mod, gun } });
    const resumed = restore(sim), pending = save(sim);
    for (const current of [sim, resumed]) {
      assert.equal(current.finishLoot(), false);
      assert.equal(current.collectLoot(2, 2), false); assert.equal(current.dropLootItem(0, 7), false);
      assert.equal(current.moveLootItem('offers', 1, 'offers', 2), false);
      assert.equal(current.beginLootModMount(mod, gun), 'unavailable');
      assert.deepEqual(current.toSave(), pending);
      assert.equal(current.resolveLootModMount(true), 'mounted');
      const sourceBefore = (mod.area === 'offers' ? before.lootOffers : before.inventory)[mod.index];
      const gunBefore = (gun.area === 'offers' ? before.lootOffers : before.inventory)[gun.index];
      assert.deepEqual(cell(current, mod), { ...sourceBefore, num: 0 });
      assert.ok(cell(current, gun)!.attack! > gunBefore.attack);
      assert.equal(cell(current, gun)!.ammo, cell(current, gun)!.ammoMax);
      assert.equal(cell(current, gun)!.reloadTime, gunBefore.reloadTime);
      const expected = structuredClone(before);
      (gun.area === 'offers' ? expected.lootOffers : expected.inventory)[gun.index] = structuredClone(cell(current, gun));
      (mod.area === 'offers' ? expected.lootOffers : expected.inventory)[mod.index].num = 0;
      assert.deepEqual(current.toSave(), expected);
      assert.equal(current.resolveLootModMount(true), 'unavailable');
      restore(current);
    }
    assert.deepEqual(resumed.state, sim.state);
  }
});

test('No swaps complete source records in every loot direction; reverse gun-to-MOD is a plain swap', () => {
  for (const stage of ['loot', 'boss-loot'] as const) for (const [modArea, gunArea] of combinations) {
    const sim = loot(stage), { mod, gun } = setup(sim, modArea, gunArea), before = save(sim);
    assert.equal(sim.beginLootModMount(mod, gun), 'previewed');
    const resumed = restore(sim);
    assert.equal(resumed.resolveLootModMount(false), 'swapped');
    const expected = structuredClone(before), source = mod.area === 'offers' ? expected.lootOffers : expected.inventory, target = gun.area === 'offers' ? expected.lootOffers : expected.inventory;
    [source[mod.index], target[gun.index]] = [target[gun.index], source[mod.index]];
    assert.deepEqual(resumed.toSave(), expected); restore(resumed);
    const reverse = Simulation.fromSave(before);
    assert.equal(reverse.moveLootItem(gun.area, gun.index, mod.area, mod.index), true);
    assert.deepEqual(reverse.toSave(), expected);
    assert.equal(reverse.state.pendingLootAction, null);
  }
});

test('incompatibilities are deferred to Yes and preserve every item field, while No still swaps', () => {
  const cases = [
    { id: 4, expected: 'no-mod-slot', mutate: (gun: Item) => { gun.mod = gun.modMax; } },
    { id: 2, expected: 'incompatible-ammo-mod', mutate: (gun: Item) => { gun.ammoMax = 1; gun.ammo = 1; } },
    { id: 7, expected: 'incompatible-ammo-mod', mutate: (gun: Item) => { gun.reloadTimeMax = 0; } },
    { id: 10, expected: 'incompatible-auto-reload', mutate: (gun: Item) => { gun.manualReload = false; } },
    { id: 11, expected: 'already-living', mutate: (gun: Item) => { gun.livingWeapon = 1; } },
  ];
  for (const probe of cases) {
    const sim = loot('boss-loot'), { mod, gun } = setup(sim, 'inventory', 'offers', probe.id);
    probe.mutate(cell(sim, gun)!); const before = save(sim);
    assert.equal(sim.beginLootModMount(mod, gun), 'previewed');
    const resumed = restore(sim);
    assert.equal(resumed.resolveLootModMount(true), probe.expected);
    assert.deepEqual(resumed.toSave(), before);
    assert.equal(resumed.beginLootModMount(mod, gun), 'previewed');
    assert.equal(resumed.resolveLootModMount(false), 'swapped');
    assert.deepEqual(cell(resumed, gun), before.inventory[mod.index]);
    assert.deepEqual(cell(resumed, mod), before.lootOffers[gun.index]);
  }
});

test('a sixteenth-slot pending mount survives JSON and an offered modified gun can then be collected and used after Rest', () => {
  let sim = loot('boss-loot', 16), { mod, gun } = setup(sim, 'inventory', 'offers');
  assert.equal(mod.index, 15);
  assert.equal(sim.beginLootModMount(mod, gun), 'previewed'); sim = restore(sim);
  assert.equal(sim.resolveLootModMount(true), 'mounted'); const mounted = structuredClone(cell(sim, gun));
  assert.equal(sim.collectLoot(gun.index, 0), true);
  while (sim.state.postbattle !== 'result') {
    if (sim.state.postbattle === 'skill') assert.equal(sim.chooseSkill(sim.state.skillChoices[0]), true);
    else assert.equal(sim.finishLoot(), true);
  }
  assert.equal(sim.enterTown(), true); assert.equal(sim.startNextDay(), true);
  assert.deepEqual(sim.weapon, { ...mounted, reloadTime: 0 });
  assert.equal(isOccupiedItem(sim.state.inventory[15]), false);
  sim = restore(sim);
  assert.equal(sim.fireAt(300, 240), true);
  assert.ok(sim.events.some(event => event.type === 'shot'));
  assert.equal(sim.weapon!.ammo, sim.weapon!.ammoMax - 1);
});

test('v19 migration preserves expanded inventory and RNG while adding only a null loot action', () => {
  const sim = loot('loot', 16); setup(sim, 'offers', 'inventory');
  const legacy = asLegacyV19Save(sim.toSave()), untouched = structuredClone(legacy);
  const migrated = Simulation.fromSave(legacy);
  assert.deepEqual(migrated.toSave(), { ...legacy, version: 23, trainerLevel: 0, looterLevel: 0, pendingLootAction: null });
  assert.deepEqual(legacy, untouched);
  assert.deepEqual(Simulation.fromSave({ ...legacy, pendingLootAction: { kind: 'unknown' } }).state, migrated.state);
});

test('v20 rejects malformed or unavailable pending loot endpoints without mutating the supplied save', () => {
  const sim = loot(), { mod, gun } = setup(sim, 'offers', 'inventory');
  assert.equal(sim.beginLootModMount(mod, gun), 'previewed'); const checkpoint = save(sim);
  for (const corrupt of [
    (value: any) => { delete value.pendingLootAction; },
    (value: any) => { value.pendingLootAction = []; },
    (value: any) => { value.pendingLootAction.kind = 'upgrade'; },
    (value: any) => { value.pendingLootAction.mod = null; },
    (value: any) => { value.pendingLootAction.mod.area = 'shop'; },
    (value: any) => { value.pendingLootAction.mod.index = '0'; },
    (value: any) => { value.pendingLootAction.mod.index = 8; },
    (value: any) => { value.pendingLootAction.gun.index = 6; },
    (value: any) => { value.pendingLootAction.gun.index = -1; },
    (value: any) => { value.pendingLootAction.gun.index = 0.5; },
    (value: any) => { value.pendingLootAction.gun = { ...value.pendingLootAction.mod }; },
    (value: any) => { value.lootOffers[0].num = 0; },
    (value: any) => { value.inventory[0] = value.inventory[1]; },
    (value: any) => { value.postbattle = 'skill'; },
    (value: any) => { value.phase = 'battle'; value.postbattle = 'none'; },
    (value: any) => { value.pendingTownAction = { kind: 'mod', modSlot: 2, gunSlot: 0 }; },
    (value: any) => { value.pendingPartyAction = { kind: 'hire' }; },
  ]) {
    const invalid = structuredClone(checkpoint); corrupt(invalid); const before = structuredClone(invalid);
    assert.throws(() => Simulation.fromSave(invalid)); assert.deepEqual(invalid, before);
  }
  for (const bad of [address('offers', -1), address('offers', 8), address('inventory', 6), { area: 'shop', index: 0 } as any]) {
    const clean = loot(); assert.equal(clean.beginLootModMount(bad, gun), 'unavailable');
  }
});
