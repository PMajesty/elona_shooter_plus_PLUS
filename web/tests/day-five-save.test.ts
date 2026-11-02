import test from 'node:test';
import assert from 'node:assert/strict';
import { withLegacyPartyDefaults } from './legacy-save-support.ts';
import { Simulation, type EnemyState } from '../src/simulation.ts';

interface Boundary {
  spawnEnemy(kind: 'fly' | 'sheep'): void;
  tickEnemy(enemy: EnemyState): void;
  damageEnemy(enemy: EnemyState, damage: number, critical: boolean, slot: null, x: number, y: number): void;
}
function isolatedFly() {
  const simulation = new Simulation(42);
  const boundary = simulation as unknown as Boundary;
  boundary.spawnEnemy('fly');
  simulation.state.newWave = false; simulation.state.waveIndex = 4; simulation.state.spawnTimer = 1000;
  return {simulation, boundary, fly: simulation.state.enemies[0]};
}

test('Fly wait counter and movement resume identically after JSON save at the stop boundary', () => {
  const {simulation, fly} = isolatedFly();
  Object.assign(fly, {x: 200, frame: 3, flyCounter: 39});
  simulation.state.rng = 0xdeadbeef;
  simulation.tick();
  assert.equal(fly.x, 200); assert.equal(fly.speed, 0); assert.equal(fly.flyCounter, 40);
  const restored = Simulation.fromSave(JSON.parse(JSON.stringify(simulation.toSave())));
  let resumed = false;
  for (let frame = 0; frame < 200; frame++) {
    simulation.tick(); restored.tick();
    assert.deepEqual(restored.state, simulation.state); assert.deepEqual(restored.events, simulation.events);
    if (fly.flyCounter === 0) resumed = true;
  }
  assert.equal(resumed, true);
});

test('Fly death starts at source frame12, enables the fallen shadow at23, holds41 and is removed at200', () => {
  const {simulation, boundary, fly} = isolatedFly();
  boundary.damageEnemy(fly, 2, false, null, fly.x, fly.y);
  assert.equal(fly.hp, 0); assert.equal(fly.frame, 12); assert.equal(fly.shadowHit, false);
  const restored = Simulation.fromSave(JSON.parse(JSON.stringify(simulation.toSave())));
  for (let frame = 1; frame <= 200; frame++) {
    simulation.tick(); restored.tick();
    assert.deepEqual(restored.state, simulation.state); assert.deepEqual(restored.events, simulation.events);
    if (frame < 200) { assert.equal(fly.frame, Math.min(12 + frame, 41)); assert.equal(fly.shadowHit, frame >= 11); }
    if (frame % 25 === 0) assert.deepEqual(Simulation.fromSave(simulation.toSave()).state, simulation.state);
  }
  assert.equal(fly.removed, true); assert.equal(fly.frame, 126); assert.equal(fly.hp, -1); assert.equal(fly.deathTicks, 201);
});

test('a Fly crossing x640 damages the castle once and leaves no surviving actor or kill reward', () => {
  const {simulation, fly} = isolatedFly();
  fly.x = 640;
  simulation.tick();
  assert.equal(simulation.state.castleHp, 38); assert.equal(simulation.state.enemies.length, 0);
  assert.equal(simulation.state.kills, 0); assert.equal(simulation.state.totalMoney, 0);
  assert.equal(simulation.events.filter(event => event.type === 'castle-hit').length, 1);
  simulation.tick(); assert.equal(simulation.state.castleHp, 38);
});

test('v11 migration initializes party state without changing the saved battle; current Fly saves require valid counter and frame state', () => {
  const simulation = new Simulation(42);
  const legacy: Record<string, any> = simulation.toSave(); legacy.version = 11;
  const untouched = structuredClone(legacy);
  assert.deepEqual(Simulation.fromSave(legacy).toSave(), withLegacyPartyDefaults(legacy));
  assert.deepEqual(legacy, untouched);
  const {simulation: flySimulation} = isolatedFly();
  for (const corrupt of [
    (value: any) => { delete value.enemies[0].flyCounter; },
    (value: any) => { value.enemies[0].flyCounter = -1; },
    (value: any) => { value.enemies[0].flyCounter = 1.5; },
    (value: any) => { value.enemies[0].frame = 127; },
    (value: any) => { value.version = 11; },
  ]) {
    const invalid = flySimulation.toSave(); corrupt(invalid);
    assert.throws(() => Simulation.fromSave(invalid));
  }
});
