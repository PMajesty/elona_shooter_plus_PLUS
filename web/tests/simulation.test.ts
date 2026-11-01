import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation, type Input } from '../src/simulation.ts';
import { FIRST_DAY, SHOTGUN } from '../src/content.ts';

function advance(simulation: Simulation, frames: number, input: Input = {}): void {
  for (let i = 0; i < frames; i++) simulation.tick(input);
}

test('New Game uses the original mission-zero first battle and five backwards-played waves', () => {
  const simulation = new Simulation(42);
  assert.equal(FIRST_DAY.missionLevel, 0);
  assert.equal(simulation.state.castleHp, 40);
  assert.equal(simulation.state.gold, 200);
  assert.equal(simulation.state.inventory[0]!.ammo, 5);
  assert.equal(simulation.state.bossWave, 2);
  assert.equal(simulation.state.waves.length, 5);
  assert.equal(simulation.state.waves.flatMap(wave => wave.enemies).filter(kind => kind === 'boss').length, 1);
  assert.ok(simulation.state.waves[2].enemies.includes('boss'));
  advance(simulation, 2);
  assert.equal(simulation.state.waveIndex, 4);
});

test('shotgun retains its 25-frame cooldown and does not become automatic while held', () => {
  const simulation = new Simulation(5);
  assert.equal(simulation.fireAt(450, 230), true);
  assert.equal(simulation.state.inventory[0]!.ammo, 4);
  advance(simulation, 24);
  assert.equal(simulation.fireAt(450, 230), false);
  advance(simulation, 1);
  assert.equal(simulation.fireAt(450, 230), true);
  advance(simulation, 100, { fireHeld: true, aimX: 450, aimY: 230 });
  assert.equal(simulation.state.inventory[0]!.ammo, 2);
});

test('press during cooldown queues one shot while held and release cancels that queue', () => {
  const simulation = new Simulation(5);
  simulation.fireAt(450, 230);
  advance(simulation, 5);
  advance(simulation, 19, { fireHeld: true });
  assert.equal(simulation.state.inventory[0]!.ammo, 4);
  advance(simulation, 1, { fireHeld: true });
  assert.equal(simulation.state.inventory[0]!.ammo, 3);
  advance(simulation, 30, { fireHeld: true });
  assert.equal(simulation.state.inventory[0]!.ammo, 3);
  simulation.tick({ fireHeld: false });
  simulation.fireAt(450, 230);
  advance(simulation, 3, { fireHeld: true });
  simulation.tick({ fireHeld: false });
  advance(simulation, 30);
  assert.equal(simulation.state.inventory[0]!.ammo, 2);
});

test('reload uses the independent 20 Hz timer and clicking interrupts after a partial shell reload', () => {
  const simulation = new Simulation(7);
  simulation.state.inventory[0]!.ammo = 2;
  assert.equal(simulation.requestReload(), true);
  advance(simulation, 10);
  assert.equal(simulation.state.inventory[0]!.ammo, 2);
  advance(simulation, 1);
  assert.equal(simulation.state.inventory[0]!.ammo, 3);
  assert.ok(simulation.state.inventory[0]!.reloadTime > 0);
  assert.equal(simulation.fireAt(450, 230), false);
  assert.equal(simulation.state.inventory[0]!.reloadTime, 0);
  assert.equal(simulation.state.inventory[0]!.ammo, 3);
  assert.equal(simulation.fireAt(450, 230), true);
  assert.equal(simulation.state.inventory[0]!.ammo, 2);
});

test('each intermediate shell restarts reload feedback, followed by one completion event', () => {
  const simulation = new Simulation(7);
  simulation.state.inventory[0]!.ammo = 2;
  const feedback: { type: string; timerStep: number; ammo: number; reloadTime: number }[] = [];
  const capture = () => {
    for (const event of simulation.events) {
      if (event.type === 'reload' || event.type === 'reloaded') feedback.push({
        type: event.type, timerStep: Math.floor(simulation.state.tick * 20 / 30),
        ammo: simulation.state.inventory[0]!.ammo, reloadTime: simulation.state.inventory[0]!.reloadTime,
      });
    }
  };
  assert.equal(simulation.requestReload(), true);
  capture();
  for (let frame = 0; frame < 45; frame++) { simulation.tick(); capture(); }
  assert.deepEqual(feedback, [
    { type: 'reload', timerStep: 0, ammo: 2, reloadTime: 7 },
    { type: 'reload', timerStep: 7, ammo: 3, reloadTime: 7 },
    { type: 'reload', timerStep: 14, ammo: 4, reloadTime: 7 },
    { type: 'reloaded', timerStep: 21, ammo: 5, reloadTime: 0 },
  ]);
});

test('empty held trigger starts reload without cancelling it on the next frame', () => {
  const simulation = new Simulation(7);
  simulation.state.inventory[0]!.ammo = 0;
  simulation.tick({ fireHeld: true });
  assert.equal(simulation.state.inventory[0]!.reloadTime, 7);
  advance(simulation, 52, { fireHeld: true });
  assert.equal(simulation.state.inventory[0]!.ammo, SHOTGUN.magazine);
  assert.equal(simulation.state.inventory[0]!.reloadTime, 0);
});

test('Space at the last positive cooldown tick is rejected before a queued held shot fires', () => {
  const simulation = new Simulation(7);
  simulation.fireAt(450, 230);
  advance(simulation, 24, { fireHeld: true });
  assert.ok(simulation.state.player.shootTimer > 0);
  // Исходный KeyDown проверяет таймер до вычитания в onEnterFrame; это подтверждено equipment oracle.
  simulation.tick({ fireHeld: true, reload: true });
  assert.equal(simulation.state.inventory[0]!.ammo, 3);
  assert.equal(simulation.state.inventory[0]!.reloadTime, 0);
  assert.equal(simulation.events.some(event => event.type === 'reload'), false);
  assert.equal(simulation.events.some(event => event.type === 'shot'), true);
});

test('a Space reload accepted after cooldown protects an already queued held shot until reloading completes', () => {
  const simulation = new Simulation(7);
  simulation.fireAt(450, 230);
  advance(simulation, 25);
  // Восстанавливаем допустимую очередь удерживаемого спуска на границе таймера.
  simulation.state.pendingShot = true;
  simulation.state.fireHeld = true;
  assert.ok(simulation.state.player.shootTimer <= 0);
  simulation.tick({ fireHeld: true, reload: true });
  assert.equal(simulation.state.inventory[0]!.ammo, 4);
  assert.ok(simulation.state.inventory[0]!.reloadTime > 0);
  advance(simulation, 12, { fireHeld: true });
  assert.equal(simulation.state.inventory[0]!.ammo, 4);
  assert.equal(simulation.state.inventory[0]!.reloadTime, 0);
  assert.ok(simulation.state.player.shootTimer > 0);
});

test('grenade count, cooldown and vertical trajectory stay finite', () => {
  const simulation = new Simulation(9);
  assert.equal(simulation.throwGrenade(510, 200), true);
  assert.equal(simulation.throwGrenade(100, 200), false);
  assert.equal(simulation.state.inventory[1]!.ammo, 4);
  simulation.tick();
  assert.equal(simulation.events.some(event => event.type === 'explosion'), false);
  for (let frame = 0; frame < 20 && !simulation.events.some(event => event.type === 'explosion'); frame++) simulation.tick();
  assert.ok(simulation.events.some(event => event.type === 'explosion' && event.x === 510 && event.y === 200));
  assert.ok(simulation.events.every(event => event.x === undefined || Number.isFinite(event.x)));
  assert.ok(simulation.events.every(event => event.y === undefined || Number.isFinite(event.y)));
  advance(simulation, 100);
  assert.equal(simulation.throwGrenade(100, 200), true);
});

test('JSON save resumes simulation and in-flight grenades without changing the outcome', () => {
  const original = new Simulation(42);
  advance(original, 120, { aimX: 160, aimY: 220 });
  original.throwGrenade(100, 230);
  original.tick({ aimX: 125, aimY: 230 });
  const restored = Simulation.fromSave(JSON.parse(JSON.stringify(original.toSave())));
  assert.deepEqual(restored.state, original.state);
  for (let i = 0; i < 500; i++) {
    const input = { aimX: 400, aimY: 240, firePressed: i % 32 === 0, reload: i % 150 === 0 };
    original.tick(input);
    restored.tick(input);
  }
  assert.deepEqual(restored.state, original.state);
});

test('corrupt saves are rejected before they can enter the simulation', () => {
  const saved = new Simulation(123).toSave();
  for (const change of [
    { version: 99 }, { phase: ['battle'] }, { rng: 0 }, { castleHp: Infinity }, { waveIndex: 8 },
    { enemies: [{ kind: '__proto__' }] }, { waves: [] },
    { inventory: [{ ...saved.inventory[0], ammo: -1 }, ...saved.inventory.slice(1)] },
    { inventory: [{ ...saved.inventory[0], ammo: 5, reloadTime: 7 }, ...saved.inventory.slice(1)] },
    { player: { ...saved.player, selectedSlot: 5 } }, { player: { ...saved.player, selectedSlot: -1 } },
    { itemCooldowns: [0, -1, 0, 0, 0] }, { itemCooldowns: [0, 0, 0, 0] },
    { grenades: [{ uid: 1, startX: 2, targetX: 2 }] },
  ]) assert.throws(() => Simulation.fromSave({ ...saved, ...change }));
  assert.throws(() => Simulation.fromSave(null));
});

test('restored entity identifiers cannot collide when the next enemy or grenade spawns', () => {
  const simulation = new Simulation(42);
  advance(simulation, 150);
  assert.ok(simulation.state.enemies.length > 0);
  simulation.throwGrenade(100, 200);
  const saved = simulation.toSave();
  assert.deepEqual(Simulation.fromSave(saved).state, saved);
  assert.throws(() => Simulation.fromSave({ ...saved, nextUid: saved.enemies[0].uid }));
  assert.throws(() => Simulation.fromSave({ ...saved, projectiles: [{ ...saved.projectiles[0], uid: saved.enemies[0].uid }] }));
  assert.throws(() => Simulation.fromSave({ ...saved, enemies: [{ ...saved.enemies[0], maxHp: 0 }] }));
});

test('leaving enemies unattended causes actual wall damage and defeat', () => {
  const simulation = new Simulation(42);
  advance(simulation, 3000);
  assert.equal(simulation.state.phase, 'defeat');
  assert.ok(simulation.state.castleHp <= 0);
  assert.equal(simulation.state.kills, 0);
  const saved = simulation.toSave();
  advance(simulation, 60);
  assert.deepEqual(simulation.state, saved);
});

test('the playable first battle reaches results with the original reward, upkeep, completion XP and refilled gun', () => {
  const simulation = new Simulation(42);
  for (let i = 0; i < 5000 && simulation.state.phase === 'battle'; i++) {
    const enemy = simulation.state.enemies.filter(candidate => candidate.hp > 0 && candidate.x > 20).sort((left, right) => right.x - left.x)[0];
    const weapon = simulation.weapon!;
    simulation.tick({ aimX: enemy?.x ?? 450, aimY: enemy?.y ?? 240, firePressed: Boolean(enemy) && weapon.reloadTime === 0 && weapon.ammo > 0, reload: weapon.ammo === 0 || (!enemy && weapon.ammo < 3) });
  }
  assert.equal(simulation.state.phase, 'victory');
  assert.ok(simulation.state.kills > 0);
  assert.equal(simulation.state.result.reward, 600);
  assert.equal(simulation.state.result.upkeep, 40);
  assert.equal(simulation.state.result.perfectBonus, simulation.state.noDamage ? 180 : 0);
  assert.equal(simulation.state.inventory[0]!.ammo, 5);
  assert.ok(simulation.state.player.exp + 1000 * (simulation.state.player.level - 1) >= 250);
  assert.deepEqual(Simulation.fromSave(simulation.toSave()).state, simulation.state);
});
