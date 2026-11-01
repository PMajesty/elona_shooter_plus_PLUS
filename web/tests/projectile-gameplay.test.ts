import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../src/simulation.ts';
import { ItemFactory } from '../src/items.ts';

function prepared(id: number): Simulation {
  const simulation = new Simulation(42);
  const state = simulation.state;
  state.newWave = false; state.waveIndex = 4; state.spawnTimer = 100000;
  state.inventory[2] = new ItemFactory(() => 0.5).generate(id);
  state.player.traits[state.inventory[2]!.reqTrait!] = 20;
  simulation.useSlot(2);
  simulation.events = [];
  return simulation;
}

test('a bow draws without spending RNG or ammunition, holds, and launches at release-time aim', () => {
  const simulation = prepared(24);
  const rng = simulation.state.rng, ammo = simulation.weapon!.ammo;
  simulation.tick({ aimX: 200, aimY: 210, firePressed: true, fireHeld: true });
  assert.equal(simulation.state.player.bowDrawing, true);
  assert.ok(simulation.events.some(event => event.type === 'bow-draw'));
  for (let frame = 0; frame < 30; frame++) simulation.tick({ fireHeld: true });
  assert.equal(simulation.state.rng, rng);
  assert.equal(simulation.state.projectiles.length, 0);
  simulation.tick({ aimX: 350, aimY: 260, fireReleased: true });
  assert.equal(simulation.state.player.bowDrawing, false);
  assert.equal(simulation.state.projectiles.length, 1);
  const arrow = simulation.state.projectiles[0];
  assert.equal(arrow.kind, 'arrow');
  assert.equal(arrow.weaponSlot, 2);
  assert.equal(arrow.frame, 0);
  assert.equal(arrow.x, arrow.startX);
  assert.ok(Math.abs(arrow.targetX - 350) < 30);
  assert.ok(Math.abs(arrow.targetY - 266) < 30);
  assert.equal(simulation.weapon!.ammo, ammo);
  assert.notEqual(simulation.state.rng, rng);
  simulation.tick();
  assert.equal(arrow.frame, 1);
  assert.ok(arrow.x < arrow.startX);
});

test('bow quick taps and explicit absent release do not invent a shot; selection cancels the draw', () => {
  const simulation = prepared(24);
  simulation.tick({ firePressed: true, fireReleased: true });
  assert.equal(simulation.state.player.bowDrawing, false);
  assert.equal(simulation.state.projectiles.length, 0);
  simulation.tick({ firePressed: true, fireHeld: true });
  const rng = simulation.state.rng;
  simulation.tick({ fireHeld: false, fireReleased: false });
  assert.equal(simulation.state.player.bowDrawing, true);
  assert.equal(simulation.state.projectiles.length, 0);
  assert.equal(simulation.state.rng, rng);
  simulation.tick({ slot: 2, fireReleased: true });
  assert.equal(simulation.state.player.bowDrawing, false);
  assert.equal(simulation.state.projectiles.length, 0);
});

test('Wind Bow releases its three-arrow fan using one shared target roll', () => {
  const simulation = prepared(25);
  simulation.fireAt(250, 230);
  assert.equal(simulation.state.projectiles.length, 0);
  let draws = 0;
  const operations = simulation as unknown as { random(): number };
  const original = operations.random.bind(simulation);
  operations.random = () => { draws++; return original(); };
  simulation.fireAt(250, 230);
  assert.equal(draws, 4);
  const [right, middle, left] = simulation.state.projectiles;
  assert.equal(simulation.state.projectiles.length, 3);
  assert.deepEqual([right.startX - middle.startX, left.startX - middle.startX], [5, -5]);
  assert.deepEqual([right.targetX - middle.targetX, left.targetX - middle.targetX], [20, -20]);
  assert.equal(right.targetY, middle.targetY); assert.equal(left.targetY, middle.targetY);
});

test('a launched grenade keeps its gun effects while kill experience follows the current selection', () => {
  const simulation = prepared(21);
  const launchWeapon = simulation.weapon!;
  launchWeapon.attack = 1000; launchWeapon.livingWeapon = 2;
  simulation.state.inventory[3] = new ItemFactory(() => 0.5).generate(24);
  const operations = simulation as unknown as { spawnEnemy(kind: 'rat'): void };
  operations.spawnEnemy('rat');
  const enemy = simulation.state.enemies[0];
  Object.assign(enemy, { x: 300, y: 230, speed: 0, speedOrg: 0 });
  assert.equal(simulation.fireAt(300, 230), true);
  assert.equal(simulation.state.projectiles[0].weaponSlot, 2);
  simulation.useSlot(3);
  for (let frame = 0; frame < 80 && simulation.state.kills === 0; frame++) simulation.tick();
  assert.equal(simulation.state.kills, 1);
  assert.equal(launchWeapon.livingWeapon, 1);
  assert.equal(simulation.state.player.weaponExp[0], 1);
  assert.equal(simulation.state.player.weaponExp[1], 0);
});

test('Gravity Gun begins reloading immediately while its projectile remains active', () => {
  const simulation = prepared(27);
  assert.equal(simulation.fireAt(100, 230), true);
  assert.equal(simulation.weapon!.ammo, 0);
  assert.ok(simulation.weapon!.reloadTime > 0);
  assert.ok(simulation.state.player.shootTimer > 0);
  assert.equal(simulation.state.projectiles[0].kind, 'gravity');
  const remaining = simulation.weapon!.reloadTime;
  for (let frame = 0; frame < 20; frame++) simulation.tick();
  assert.ok(simulation.weapon!.reloadTime < remaining);
  assert.ok(simulation.state.projectiles.some(actor => actor.kind === 'gravity'));
});
