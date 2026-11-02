import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../src/simulation.ts';
import { asLegacyV6Save, asLegacyV7Save } from './legacy-save-support.ts';

test('v6 migration moves active ammunition and cooldowns to canonical inventory while preserving its input', () => {
  const simulation = new Simulation(42);
  simulation.fireAt(450, 230);
  for (let frame = 0; frame < 25; frame++) simulation.tick();
  assert.equal(simulation.requestReload(), true);
  assert.equal(simulation.throwGrenade(100, 230), true);
  const legacy = asLegacyV6Save(simulation.toSave());
  const untouched = structuredClone(legacy);
  const restored = Simulation.fromSave(legacy);
  assert.deepEqual(legacy, untouched);
  assert.equal(restored.state.version, 21);
  assert.deepEqual(restored.state.inventory, legacy.inventory);
  assert.equal(restored.state.player.selectedSlot, 0);
  assert.deepEqual(restored.state.player.weaponExp, [0, 0, 0, legacy.player.weaponExp, 0]);
  for (const field of ['ammo', 'reloadTicks', 'grenades', 'grenadeCooldown']) assert.equal(Object.hasOwn(restored.state.player, field), false);
  assert.deepEqual(restored.state.itemCooldowns, [0, legacy.player.grenadeCooldown, 0, 0, 0]);
  assert.deepEqual(restored.state.protection, { counter: 0, blueMultiplierAdd: 0 });
  assert.deepEqual(asLegacyV7Save(restored.state).grenades, legacy.grenades.map((grenade: object) => ({ ...grenade, damage: 45 })));
  assert.deepEqual(restored.state.hero, legacy.hero);
  assert.equal(restored.state.rng, legacy.rng);
  const resumed = Simulation.fromSave(JSON.parse(JSON.stringify(restored.toSave())));
  for (let frame = 0; frame < 150; frame++) {
    const input = { firePressed: frame % 35 === 0, aimX: 350, aimY: 230 };
    restored.tick(input); resumed.tick(input);
    assert.deepEqual(resumed.state, restored.state);
    assert.deepEqual(resumed.events, restored.events);
  }
});

test('v6 keeps rejecting duplicate ammunition disagreements while current saves accept independent item ammo', () => {
  const state = new Simulation(42).toSave();
  const legacy = asLegacyV6Save(state);
  const changes = [
    (value: any) => { value.inventory[0].ammo = 2; },
    (value: any) => { value.inventory[1].ammo = 2; },
    (value: any) => { value.player.ammo = -1; },
    (value: any) => { value.player.ammo = 6; },
    (value: any) => { value.player.reloadTicks = 7; },
    (value: any) => { value.player.grenadeCooldown = -1; },
  ];
  for (const change of changes) {
    const invalid = structuredClone(legacy); change(invalid);
    const untouched = structuredClone(invalid);
    assert.throws(() => Simulation.fromSave(invalid));
    assert.deepEqual(invalid, untouched);
  }
  state.inventory[0]!.ammo = 2;
  assert.deepEqual(Simulation.fromSave(state).state, state);
});

test('depleted legacy grenades migrate to an inactive slot without replacing their recorded metadata', () => {
  const legacy = asLegacyV6Save(new Simulation(42).toSave());
  legacy.player.grenades = 0;
  legacy.inventory[1].ammo = 0;
  // v6 оставлял num=1 после последней гранаты, хотя отдельный счётчик уже запрещал бросок.
  legacy.inventory[1].num = 1;
  const originalItem = structuredClone(legacy.inventory[1]);
  const restored = Simulation.fromSave(legacy);
  assert.deepEqual(restored.state.inventory[1], { ...originalItem, num: 0 });
  assert.equal(restored.useSlot(1), false);
  assert.equal(restored.state.projectiles.length, 0);
  assert.deepEqual(Simulation.fromSave(restored.toSave()).state, restored.state);
});
