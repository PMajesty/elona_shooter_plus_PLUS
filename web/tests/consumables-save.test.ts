import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation, type EnemyState } from '../src/simulation.ts';
import { ItemFactory } from '../src/items.ts';
import { WORLD } from '../src/content.ts';

const item = (id: number) => new ItemFactory(() => 0.5).generate(id);
function restore(simulation: Simulation): Simulation {
  const saved = JSON.parse(JSON.stringify(simulation.toSave()));
  const resumed = Simulation.fromSave(saved);
  assert.deepEqual(resumed.state, saved);
  return resumed;
}

test('full-HP repair consumes a hammer charge, preserves the selected gun and blocks only its own slot', () => {
  const simulation = new Simulation(42);
  simulation.state.inventory[2] = item(12);
  simulation.state.inventory[3] = item(12);
  simulation.state.inventory[0]!.ammo = 2;
  assert.equal(simulation.requestReload(), true);
  const gun = structuredClone(simulation.state.inventory[0]);
  const before = simulation.toSave();
  assert.equal(simulation.useSlot(2), true);
  assert.equal(simulation.state.castleHp, 40);
  assert.equal(simulation.state.inventory[2]!.ammo, before.inventory[2]!.ammo - 1);
  assert.equal(simulation.state.itemCooldowns[2], 2001);
  assert.deepEqual(simulation.state.inventory[0], gun);
  assert.equal(simulation.state.player.selectedSlot, 0);
  assert.equal(simulation.state.rng, before.rng);
  assert.ok(simulation.events.some(event => event.type === 'repair' && event.amount === 0));
  const used = simulation.toSave();
  assert.equal(simulation.useSlot(2), false);
  assert.deepEqual(simulation.toSave(), used);
  assert.equal(simulation.useSlot(3), true);
  assert.equal(simulation.state.itemCooldowns[3], 2001);
  const resumed = restore(simulation);
  for (let frame = 0; frame < 12; frame++) { simulation.tick(); resumed.tick(); }
  assert.deepEqual(resumed.state, simulation.state);
  assert.equal(simulation.state.inventory[0]!.ammo, 3);
  assert.equal(simulation.state.itemCooldowns[2], 1989);
  assert.equal(simulation.state.itemCooldowns[3], 1989);
});

test('grenades retain launch damage and independent slot cooldowns through save and flight', () => {
  const simulation = new Simulation(42);
  simulation.state.inventory[2] = item(11);
  simulation.state.inventory[1]!.attack = 73;
  assert.equal(simulation.throwGrenade(100, 230, 1), true);
  assert.equal(simulation.throwGrenade(150, 230, 2), true);
  assert.deepEqual(simulation.state.itemCooldowns, [0, 101, 101, 0, 0]);
  assert.equal(simulation.state.grenades[0].damage, 73);
  assert.equal(simulation.state.grenades[1].damage, 45);
  simulation.state.inventory[1]!.attack = 91;
  const resumed = restore(simulation);
  assert.equal(resumed.state.grenades[0].damage, 73);
  let explosions = 0;
  for (let frame = 0; frame < 101; frame++) {
    simulation.tick(); resumed.tick();
    explosions += simulation.events.filter(event => event.type === 'explosion').length;
    assert.deepEqual(resumed.state, simulation.state);
    assert.deepEqual(resumed.events, simulation.events);
  }
  assert.equal(explosions, 2);
  assert.deepEqual(simulation.state.itemCooldowns, [0, 0, 0, 0, 0]);
  assert.equal(simulation.throwGrenade(100, 230, 1), true);
  assert.equal(simulation.state.grenades[0].damage, 91);
});

test('Grail blocks actual sheep wall attacks through restore and expires before the next unprotected hit', () => {
  const simulation = new Simulation(42);
  simulation.state.inventory[2] = item(37);
  const operations = simulation as unknown as { spawnEnemy(kind: 'sheep'): void };
  operations.spawnEnemy('sheep');
  const sheep = simulation.state.enemies[0];
  Object.assign(sheep, { x: WORLD.defenseLine, speed: 0, attacking: true, frame: 43, shadowHit: false });
  assert.equal(simulation.useSlot(2), true);
  assert.equal(simulation.state.inventory[2]!.num, 0);
  assert.equal(simulation.state.inventory[2]!.ammo, -1);
  assert.equal(simulation.state.protection.counter, 250);
  assert.equal(simulation.state.itemCooldowns[2], 0);
  const resumed = restore(simulation);
  for (let frame = 0; frame < 249; frame++) {
    simulation.tick(); resumed.tick();
    assert.deepEqual(resumed.state, simulation.state);
    assert.equal(simulation.state.castleHp, 40);
    if (frame === 0) assert.ok(simulation.events.some(event => event.type === 'defend'));
  }
  assert.equal(simulation.state.protection.counter, 1);
  // Ставим исходный кадр атаки непосредственно перед истечением защиты.
  const attackNextFrame = (enemy: EnemyState) => { enemy.frame = 43; };
  attackNextFrame(sheep); attackNextFrame(resumed.state.enemies[0]);
  simulation.tick(); resumed.tick();
  assert.deepEqual(resumed.state, simulation.state);
  assert.equal(simulation.state.protection.counter, -1);
  assert.equal(simulation.state.castleHp, 40 - sheep.attack);
  assert.ok(simulation.events.some(event => event.type === 'castle-hit'));
  restore(simulation);
});

test('only inactive artifacts accept the original negative-ammo sentinel and unsupported Ragnarok remains owned', () => {
  const simulation = new Simulation(42);
  simulation.state.inventory[2] = item(37);
  simulation.useSlot(2);
  const saved = simulation.toSave();
  for (const change of [{ num: 1 }, { ammo: -2 }, { ammoMax: 1 }, { id: 11, graphic: 21 }]) {
    const invalid = structuredClone(saved);
    Object.assign(invalid.inventory[2]!, change);
    assert.throws(() => Simulation.fromSave(invalid));
  }
  simulation.state.inventory[3] = item(38);
  const before = simulation.toSave();
  assert.equal(simulation.useSlot(3), false);
  assert.deepEqual(simulation.toSave(), before);
  assert.ok(simulation.events.some(event => event.type === 'beep' && event.message?.includes('Ragnarok')));
});
