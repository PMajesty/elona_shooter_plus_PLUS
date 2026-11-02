import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../src/simulation.ts';
import { ItemFactory } from '../src/items.ts';
import { asLegacyV8Save } from './legacy-save-support.ts';

function town(): Simulation {
  const simulation = new Simulation(42);
  (simulation as unknown as { finishDay(): void }).finishDay();
  while (simulation.state.postbattle !== 'result') {
    if (simulation.state.postbattle === 'skill') simulation.chooseSkill(simulation.state.skillChoices[0]);
    else simulation.finishLoot();
  }
  assert.equal(simulation.enterTown(), true);
  // Деньги задаются только для проверки транзакции, а не как результат обычного первого боя.
  simulation.state.gold = 10000;
  return simulation;
}

function restore(simulation: Simulation): Simulation {
  const saved = JSON.parse(JSON.stringify(simulation.toSave()));
  const untouched = structuredClone(saved);
  const restored = Simulation.fromSave(saved);
  assert.deepEqual(restored.state, saved);
  assert.deepEqual(saved, untouched);
  return restored;
}

test('v8 migration adds empty town-equipment state without consuming RNG or changing projectile flight', () => {
  const simulation = new Simulation(42);
  simulation.throwGrenade(510, 180);
  simulation.tick();
  const legacy = asLegacyV8Save(simulation.toSave()), untouched = structuredClone(legacy);
  const restored = Simulation.fromSave(legacy);
  assert.deepEqual(legacy, untouched);
  assert.deepEqual(restored.state, { ...legacy, version: 13, upgradeReference: null, pendingTownAction: null, enemyArrows: [] });
  for (let frame = 0; frame < 35; frame++) {
    restored.tick(); simulation.tick();
    assert.deepEqual(restored.state, simulation.state);
    assert.deepEqual(restored.events, simulation.events);
  }
});

test('saved upgrade preview and cancellation preserve the generated reference and the consumed RNG', () => {
  const simulation = town(), before = simulation.toSave();
  assert.equal(simulation.beginWeaponUpgrade(0), 'previewed');
  const preview = simulation.toSave();
  assert.equal(preview.gold, before.gold);
  assert.equal(preview.town!.ap, before.town!.ap);
  assert.notEqual(preview.rng, before.rng);
  assert.ok(preview.upgradeReference);
  const restored = restore(simulation);
  for (const current of [simulation, restored]) {
    assert.equal(current.resolveTownEquipment(false), 'cancelled');
    assert.equal(current.state.pendingTownAction, null);
    assert.equal(current.state.rng, preview.rng);
    assert.deepEqual(current.state.upgradeReference, preview.upgradeReference);
    assert.deepEqual(current.state.inventory, before.inventory);
    assert.equal(current.state.gold, before.gold);
    assert.equal(current.state.town!.ap, before.town!.ap);
  }
  assert.deepEqual(restored.state, simulation.state);
  assert.equal(restored.beginWeaponUpgrade(0), 'previewed');
  assert.equal(simulation.beginWeaponUpgrade(0), 'previewed');
  assert.notEqual(simulation.state.rng, preview.rng);
  assert.deepEqual(restored.state, simulation.state);
});

test('restored upgrade confirms the exact saved preview once and retains old slot49 metadata through Rest', () => {
  const simulation = town();
  assert.equal(simulation.beginWeaponUpgrade(0), 'previewed');
  const before = simulation.toSave();
  assert.equal(before.pendingTownAction?.kind, 'upgrade');
  if (before.pendingTownAction?.kind !== 'upgrade') throw new Error('Missing upgrade fixture');
  const restored = restore(simulation);
  for (const current of [simulation, restored]) {
    assert.equal(current.resolveTownEquipment(true), 'upgraded');
    assert.deepEqual(current.state.inventory[0], before.upgradeReference);
    assert.deepEqual(current.state.upgradeReference, before.inventory[0]);
    assert.equal(current.state.gold, before.gold - before.pendingTownAction.cost);
    assert.equal(current.state.totalMoney, before.totalMoney);
    assert.equal(current.state.town!.ap, before.town!.ap - 4);
    assert.equal(current.state.rng, before.rng);
    const completed = current.toSave();
    assert.equal(current.resolveTownEquipment(true), 'unavailable');
    assert.deepEqual(current.state, completed);
    assert.equal(current.startNextDay(), true);
    assert.deepEqual(current.state.upgradeReference, before.inventory[0]);
    assert.equal(current.state.pendingTownAction, null);
  }
  assert.deepEqual(restored.state, simulation.state);
  restore(restored);
});

test('pending MOD saves retain both valid and incompatible choices until confirmation, without charges or RNG', () => {
  for (const gunId of [3, 24]) {
    const simulation = town(), factory = new ItemFactory(() => 0.5);
    simulation.state.inventory[2] = factory.generate(8);
    simulation.state.inventory[5] = factory.generate(gunId);
    assert.equal(simulation.state.inventory[2]!.mod, 2, 'controlled original Reloading MOD');
    const before = simulation.toSave();
    assert.equal(simulation.beginModMount(2, 5), 'previewed');
    const restored = restore(simulation);
    for (const current of [simulation, restored]) {
      assert.equal(current.resolveTownEquipment(true), gunId === 3 ? 'mounted' : 'incompatible-ammo-mod');
      assert.equal(current.state.pendingTownAction, null);
      assert.equal(current.state.rng, before.rng);
      assert.equal(current.state.gold, before.gold);
      assert.equal(current.state.town!.ap, before.town!.ap);
      if (gunId === 3) {
        assert.deepEqual(current.state.inventory[2], { ...before.inventory[2]!, num: 0 });
        assert.equal(current.state.inventory[5]!.mod, 1);
        assert.equal(current.state.inventory[5]!.ammo, current.state.inventory[5]!.ammoMax);
      } else assert.deepEqual(current.state.inventory, before.inventory);
    }
    assert.deepEqual(restored.state, simulation.state);
    restore(restored);
  }
});

test('cancelling a restored owned MOD dialog performs the original item swap', () => {
  const simulation = town();
  simulation.state.inventory[2] = new ItemFactory(() => 0.5).generate(8);
  const before = simulation.toSave();
  assert.equal(simulation.beginModMount(2, 0), 'previewed');
  const restored = restore(simulation);
  for (const current of [simulation, restored]) {
    assert.equal(current.resolveTownEquipment(false), 'swapped');
    assert.deepEqual(current.state.inventory[2], before.inventory[0]);
    assert.deepEqual(current.state.inventory[0], before.inventory[2]);
    assert.equal(current.state.pendingTownAction, null);
    assert.equal(current.state.rng, before.rng);
    assert.equal(current.state.gold, before.gold);
  }
  assert.deepEqual(restored.state, simulation.state);
});

test('restored pending equipment dialogs block unrelated town mutations until resolved', () => {
  for (const kind of ['upgrade', 'mod'] as const) {
    let simulation = town();
    simulation.state.castleHp = 30;
    simulation.state.inventory[2] = new ItemFactory(() => 0.5).generate(8);
    assert.equal(kind === 'upgrade' ? simulation.beginWeaponUpgrade(0) : simulation.beginModMount(2, 0), 'previewed');
    simulation = restore(simulation);
    const before = simulation.toSave();
    assert.equal(simulation.startNextDay(), false);
    assert.equal(simulation.freeRepair(), 'unavailable');
    assert.equal(simulation.buyStock(0, 5), 'unavailable');
    assert.equal(simulation.sellTownItem(0), null);
    assert.equal(simulation.moveTownItem(0, 5), false);
    assert.equal(simulation.beginWeaponUpgrade(0), 'unavailable');
    assert.equal(simulation.beginModMount(2, 0), 'unavailable');
    assert.deepEqual(simulation.state, before);
  }
});

test('an unaffordable saved preview closes without rerolling, spending AP or losing its reference', () => {
  let simulation = town();
  simulation.state.gold = 0;
  assert.equal(simulation.beginWeaponUpgrade(0), 'previewed');
  simulation = restore(simulation);
  const before = simulation.toSave();
  assert.equal(simulation.resolveTownEquipment(true), 'not-enough-gold');
  assert.deepEqual(simulation.state, { ...before, pendingTownAction: null });
  restore(simulation);
});

test('imported town reload metadata survives MOD ammo refill and a lowered reload limit until Rest clears it', () => {
  for (const configuration of [{ itemId: 8, random: 0, modId: 4, reload: 3 }, { itemId: 10, random: 0.5, modId: 2, reload: 6 }]) {
    let simulation = town();
    // Допустимый импорт, а не обычный переход из боя: finishDay уже обнуляет этот таймер.
    simulation.state.inventory[0]!.ammo--;
    simulation.state.inventory[0]!.reloadTime = configuration.reload;
    simulation.state.inventory[2] = new ItemFactory(() => configuration.random).generate(configuration.itemId);
    assert.equal(simulation.state.inventory[2]!.mod, configuration.modId);
    simulation = restore(simulation);
    assert.equal(simulation.beginModMount(2, 0), 'previewed');
    assert.equal(simulation.resolveTownEquipment(true), 'mounted');
    assert.equal(simulation.state.inventory[0]!.ammo, simulation.state.inventory[0]!.ammoMax);
    assert.equal(simulation.state.inventory[0]!.reloadTime, configuration.reload);
    if (configuration.modId === 2) assert.ok(simulation.state.inventory[0]!.reloadTime > simulation.state.inventory[0]!.reloadTimeMax + 1);
    simulation = restore(simulation);
    assert.equal(simulation.startNextDay(), true);
    assert.equal(simulation.state.inventory[0]!.reloadTime, 0);
    simulation = restore(simulation);
    const invalidBattle = simulation.toSave();
    invalidBattle.inventory[0]!.reloadTime = 3;
    assert.throws(() => Simulation.fromSave(invalidBattle), /battle weapon reload state/);
    invalidBattle.inventory[0]!.ammo--;
    invalidBattle.inventory[0]!.reloadTime = invalidBattle.inventory[0]!.reloadTimeMax + 2;
    assert.throws(() => Simulation.fromSave(invalidBattle), /battle weapon reload state/);
  }
});

test('v9 rejects missing equipment fields and malformed pending previews without modifying the import', () => {
  const simulation = town();
  assert.equal(simulation.beginWeaponUpgrade(0), 'previewed');
  const valid = simulation.toSave();
  const mutations: ((value: any) => void)[] = [
    value => { delete value.upgradeReference; }, value => { delete value.pendingTownAction; },
    value => { value.upgradeReference = null; }, value => { value.upgradeReference.attack = NaN; },
    value => { value.upgradeReference = new ItemFactory(() => 0.5).generate(117); },
    value => { value.upgradeReference.lv++; }, value => { value.upgradeReference.modMax++; },
    value => { value.upgradeReference = new ItemFactory(() => 0.5).generate(4); value.upgradeReference.lv = 2; },
    value => { value.pendingTownAction.kind = 'unknown'; },
    value => { value.pendingTownAction.cost++; }, value => { value.pendingTownAction.cost = Infinity; },
    value => { value.pendingTownAction.slot = -1; }, value => { value.pendingTownAction.slot = 6; },
    value => { value.pendingTownAction.slot = 0.5; }, value => { value.inventory[0].num = 0; },
    value => { value.inventory[0] = new ItemFactory(() => 0.5).generate(8); },
    value => { value.town.ap = 3; },
    value => { value.phase = 'battle'; value.postbattle = 'none'; value.town = null; },
  ];
  for (const mutate of mutations) {
    const invalid = structuredClone(valid); mutate(invalid);
    const untouched = structuredClone(invalid);
    assert.throws(() => Simulation.fromSave(invalid));
    assert.deepEqual(invalid, untouched);
  }
  simulation.resolveTownEquipment(false);
  simulation.state.inventory[2] = new ItemFactory(() => 0.5).generate(8);
  assert.equal(simulation.beginModMount(2, 0), 'previewed');
  const modSave = simulation.toSave();
  for (const mutate of [
    (value: any) => { value.pendingTownAction.modSlot = 6; },
    (value: any) => { value.pendingTownAction.gunSlot = -1; },
    (value: any) => { value.pendingTownAction.modSlot = 0; },
    (value: any) => { value.pendingTownAction.gunSlot = 2; },
    (value: any) => { value.inventory[2].num = 0; },
    (value: any) => { value.inventory[2].mod = 999; },
    (value: any) => { value.inventory[0] = new ItemFactory(() => 0.5).generate(117); },
  ]) {
    const invalid = structuredClone(modSave); mutate(invalid);
    const untouched = structuredClone(invalid);
    assert.throws(() => Simulation.fromSave(invalid));
    assert.deepEqual(invalid, untouched);
  }
});
