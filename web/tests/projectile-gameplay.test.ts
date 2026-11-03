import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Simulation, type EnemyState } from '../src/simulation.ts';
import { createProjectile } from '../src/projectiles.ts';
import { ItemFactory } from '../src/items.ts';
import { ordinaryEnemyHit, type CollisionGeometry } from '../src/collision.ts';

const geometry: CollisionGeometry = JSON.parse(readFileSync(new URL('../public/assets/collision-geometry.json', import.meta.url), 'utf8'));
const options = { heroClass: 'rogue' as const, hitTest: (e: Readonly<EnemyState>, x: number, y: number) =>
  e.kind === 'sheep' && ordinaryEnemyHit({ ...e, kind: e.kind }, x, y, geometry) };

for (const shot of [{ seed: 12, bow: 24, uid: 3, tick: 153 }, { seed: 1, bow: 23, uid: 2, tick: 55 }]) {
  test(`weapon ${shot.bow} hits the moving sheep between checks, including after Continue`, () => {
    const sim = new Simulation(shot.seed, options);
    if (shot.bow === 23) {
      const slot = sim.state.party.slots[0], weapon = new ItemFactory(() => 0.5).generate(23);
      slot.weapon = weapon;
      slot.member!.traits[weapon.reqTrait!] = weapon.reqLv!;
    }
    sim.state.newWave = false; sim.state.waveIndex--; sim.state.spawnTimer = 1000;
    sim['spawnEnemy']('sheep');
    while (sim.state.tick < shot.tick) sim.tick();
    const sheep = sim.state.enemies[0], arrow = sim.state.projectiles.find(p => p.uid === shot.uid)!;
    const hp = sheep.hp, penetrations = arrow.penetrations;
    const checkpoint = sim.toSave(), resumed = Simulation.fromSave(checkpoint, options);
    const legacy = structuredClone(checkpoint);
    delete legacy.projectiles.find(p => p.uid === shot.uid)!.previousArrowPoint;
    const oldSave = Simulation.fromSave(legacy, options);
    oldSave.tick();
    assert.equal(oldSave.state.enemies[0].hp, hp);
    sim.tick(); resumed.tick();
    assert.ok(sheep.hp < hp);
    if (penetrations) assert.equal(arrow.penetrations, penetrations - 1);
    else assert.ok(!sim.state.projectiles.includes(arrow));
    assert.deepEqual(resumed.toSave(), sim.toSave());
    assert.deepEqual(resumed.events, sim.events);
  });
}

test('a crossbow bolt aimed exactly at the ground boundary can damage a target after Continue', () => {
  const sim = new Simulation(42, { hitTest: options.hitTest });
  sim.state.newWave = false; sim.state.waveIndex--; sim.state.spawnTimer = 1000;
  sim['spawnEnemy']('sheep');
  const sheep = sim.state.enemies[0];
  Object.assign(sheep, { x: 355, y: 202 });
  const bolt = createProjectile({ uid: sim.state.nextUid++, kind: 'bolt', weaponSlot: 0, damage: 10,
    startX: 510, startY: 245, targetX: 150, targetY: 131, speedBase: 20 });
  assert.equal(bolt.targetY, 135);
  sim.state.projectiles.push(bolt);
  for (let i = 0; i < 3; i++) sim.tick();
  assert.ok(bolt.previousArrowPoint);
  const restored = Simulation.fromSave(sim.toSave(), { hitTest: options.hitTest }), hp = sheep.hp;
  for (let i = 0; i < 25 && sim.state.projectiles.includes(bolt); i++) { sim.tick(); restored.tick(); }
  assert.ok(sheep.hp < hp);
  assert.deepEqual(restored.toSave(), sim.toSave());
});

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

test('a Duelist arrow builds adrenaline from its launch bow after switching and resuming', () => {
  const hitTest = () => true;
  const sim = new Simulation(42, { heroClass: 'duelist', hitTest });
  const factory = new ItemFactory(() => 0.5);
  sim.state.inventory[0] = factory.generate(24);
  sim.state.inventory[2] = factory.generate(1);
  sim.state.inventory[3] = factory.generate(117);
  sim.state.player.traits[sim.weapon!.reqTrait!] = 20;
  sim.state.newWave = false; sim.state.waveIndex = 4; sim.state.spawnTimer = 100;
  sim['spawnEnemy']('rat');
  Object.assign(sim.state.enemies[0], { x: 250, y: 230, speed: 0, speedOrg: 0, hp: 10000, maxHp: 10000 });
  sim['random'] = () => 0.5;
  assert.ok(sim.fireAt(250, 230)); assert.ok(sim.fireAt(250, 230));
  const flight = sim.toSave();
  for (const slot of [2, 3]) {
    const switching = Simulation.fromSave(flight, { hitTest });
    assert.ok(switching.useSlot(slot));
    const run = Simulation.fromSave(switching.toSave(), { hitTest });
    run['random'] = () => 0.5;
    for (let frame = 0; frame < 60 && !run.heroClassState!.frenzy; frame++) run.tick();
    assert.equal(run.heroClassState!.frenzy, 7 / (55 * 0.03) + 0.1);
  }
});
