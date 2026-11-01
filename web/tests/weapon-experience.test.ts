import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../src/simulation.ts';
import { ItemFactory } from '../src/items.ts';
import { TRAIT } from '../src/progression.ts';
import { asLegacyV6Save } from './legacy-save-support.ts';

function grenadeKill(simulation: Simulation, slot = 1): void {
  (simulation as unknown as { spawnEnemy(kind: 'sheep'): void }).spawnEnemy('sheep');
  const sheep = simulation.state.enemies.at(-1)!;
  Object.assign(sheep, { x: 200, y: 220, hp: 1, speed: 0, speedOrg: 0 });
  assert.equal(simulation.throwGrenade(sheep.x, sheep.y, slot), true);
  for (let frame = 0; frame < 40 && sheep.hp > 0; frame++) simulation.tick();
  assert.ok(sheep.hp <= 0);
  assert.equal(simulation.state.kills, 1);
}

const finishDay = (simulation: Simulation) => (simulation as unknown as { finishDay(): void }).finishDay();
const item = (id: number) => new ItemFactory(() => 0.5).generate(id);

test('grenade kills while holding a Rat Statue go to the other bucket and cannot promote the owned Shotgun', () => {
  const simulation = new Simulation(42);
  simulation.state.inventory[2] = item(117);
  assert.equal(simulation.useSlot(2), true);
  simulation.state.player.weaponExp = [0, 0, 0, 44, 20];
  grenadeKill(simulation);
  assert.equal(simulation.state.player.selectedSlot, 2);
  assert.deepEqual(simulation.state.player.weaponExp, [0, 0, 0, 44, 21]);
  const resumed = Simulation.fromSave(JSON.parse(JSON.stringify(simulation.toSave())));
  finishDay(resumed);
  assert.equal(resumed.state.player.traits[TRAIT.SHOTGUN], 2);
  assert.deepEqual(resumed.state.player.weaponExp, [0, 0, 0, 44, 21]);
  assert.deepEqual(Simulation.fromSave(resumed.toSave()).state, resumed.state);
});

test('an unusable selected gun receives grenade-kill experience for its required skill and promotes that skill from zero', () => {
  for (const [id, skill, bucket] of [[1, 103, 0], [16, 106, 1], [4, 104, 2]] as const) {
    const simulation = new Simulation(42);
    simulation.state.inventory[2] = item(id);
    assert.equal(simulation.useSlot(2), true);
    assert.equal(simulation.state.player.traits[skill] ?? 0, 0);
    assert.equal(simulation.fireAt(200, 220), false);
    assert.ok(simulation.events.some(event => event.message === "You don't have the required weapon skill!"));
    simulation.state.player.weaponExp[bucket] = 20;
    grenadeKill(simulation);
    assert.equal(simulation.state.player.weaponExp[bucket], 21);
    assert.equal(simulation.state.player.weaponExp[3], 0);
    finishDay(simulation);
    assert.equal(simulation.state.player.traits[skill], 1);
    assert.equal(simulation.state.player.traits[TRAIT.SHOTGUN], 2);
    assert.deepEqual(simulation.state.player.weaponExp, [0, 0, 0, 0, 0]);
    assert.deepEqual(Simulation.fromSave(simulation.toSave()).state, simulation.state);
  }
});

test('weapon progression keeps each strict threshold independent and never promotes the other bucket', () => {
  const simulation = new Simulation(42);
  simulation.state.player.weaponExp = [20, 21, 150, 44, 999];
  finishDay(simulation);
  assert.equal(simulation.state.player.traits[103] ?? 0, 0);
  assert.equal(simulation.state.player.traits[106], 1);
  assert.equal(simulation.state.player.traits[104], 1);
  assert.equal(simulation.state.player.traits[TRAIT.SHOTGUN], 2);
  assert.deepEqual(simulation.state.player.weaponExp, [20, 0, 0, 44, 999]);
});

test('the last grenade retains selected-slot weapon experience metadata after its item becomes inactive', () => {
  const simulation = new Simulation(42), factory = new ItemFactory(() => 0.5);
  // generateStuff сохраняет reqTrait прежнего лука; Rest выбирает слот 0 даже с расходником.
  simulation.state.inventory[0] = factory.generate(11, factory.generate(24));
  simulation.state.inventory[0]!.ammo = 1;
  assert.equal(simulation.state.inventory[0]!.reqTrait, 103);
  simulation.state.player.weaponExp[0] = 20;
  grenadeKill(simulation, 0);
  assert.equal(simulation.state.inventory[0]!.num, 0);
  assert.equal(simulation.selectedItem, null);
  assert.equal(simulation.state.player.selectedSlot, 0);
  assert.deepEqual(simulation.state.player.weaponExp, [21, 0, 0, 0, 0]);
  const resumed = Simulation.fromSave(JSON.parse(JSON.stringify(simulation.toSave())));
  finishDay(resumed);
  assert.equal(resumed.state.player.traits[103], 1);
  assert.equal(resumed.state.player.traits[TRAIT.SHOTGUN], 2);
  assert.deepEqual(resumed.state.player.weaponExp, [0, 0, 0, 0, 0]);
});

test('legacy numeric weapon experience maps only to Shotgun while malformed current arrays are rejected', () => {
  const simulation = new Simulation(42);
  simulation.state.player.weaponExp[3] = 43;
  const legacy = asLegacyV6Save(simulation.toSave());
  assert.equal(legacy.player.weaponExp, 43);
  const untouched = structuredClone(legacy);
  const restored = Simulation.fromSave(legacy);
  assert.deepEqual(restored.state.player.weaponExp, [0, 0, 0, 43, 0]);
  assert.deepEqual(legacy, untouched);
  const saved = simulation.toSave();
  for (const weaponExp of [0, [], [0, 0, 0, 0], [0, 0, 0, -1, 0], [0, 0, 0, 1.5, 0], [0, 0, 0, NaN, 0]]) {
    const invalid = { ...saved, player: { ...saved.player, weaponExp } };
    const before = structuredClone(invalid);
    assert.throws(() => Simulation.fromSave(invalid), /Invalid weapon experience/);
    assert.deepEqual(invalid, before);
  }
});
