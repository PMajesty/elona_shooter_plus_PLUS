import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../src/simulation.ts';
import { asLegacyV9Save } from './legacy-save-support.ts';

function attackingArcher(): Simulation {
  const simulation = new Simulation(42);
  (simulation as unknown as { spawnEnemy(kind: 'archer'): void }).spawnEnemy('archer');
  Object.assign(simulation.state.enemies[0], { x: 310, frame: 58, speed: 0, attacking: true, rangedCounter: 80 });
  simulation.state.newWave = false;
  simulation.state.waveIndex = 4;
  simulation.state.spawnTimer = 1000;
  return simulation;
}

test('v9 migration initializes enemy arrows without changing the saved battle or RNG', () => {
  const simulation = new Simulation(42);
  simulation.fireAt(300, 200);
  const legacy = asLegacyV9Save(simulation.toSave());
  const untouched = structuredClone(legacy);
  const restored = Simulation.fromSave(legacy);
  assert.deepEqual(restored.toSave(), { ...legacy, version: 13, enemyArrows: [] });
  assert.deepEqual(legacy, untouched);
});

test('archer launch damages the castle once at birth; its saved visual flight never adds impact damage', () => {
  const simulation = attackingArcher();
  simulation.tick();
  assert.equal(simulation.state.castleHp, 37);
  assert.equal(simulation.state.enemyArrows.length, 1);
  assert.equal(simulation.state.enemyArrows[0].age, 0);
  assert.ok(simulation.events.some(event => event.type === 'enemy-arrow'));
  const restored = Simulation.fromSave(JSON.parse(JSON.stringify(simulation.toSave())));
  for (let frame = 0; frame < 24; frame++) {
    simulation.tick(); restored.tick();
    assert.deepEqual(restored.state, simulation.state);
    assert.deepEqual(restored.events, simulation.events);
    assert.equal(simulation.state.castleHp, 37);
  }
  assert.equal(simulation.state.enemyArrows.length, 0);
});

test('current saves require archer counters and finite, uniquely identified arrow state', () => {
  const simulation = attackingArcher(); simulation.tick();
  const saved = simulation.toSave();
  for (const corrupt of [
    (value: any) => { delete value.enemyArrows; },
    (value: any) => { delete value.enemies[0].rangedCounter; },
    (value: any) => { value.enemies[0].rangedCounter = -1; },
    (value: any) => { value.enemies[0].frame = 999; value.enemies[0].knockBack = 2; },
    (value: any) => { value.enemyArrows[0].x = Infinity; },
    (value: any) => { value.enemyArrows[0].uid = value.enemies[0].uid; },
    (value: any) => { value.version = 9; },
    (value: any) => { value.day = 4; },
  ]) {
    const bad = structuredClone(saved); corrupt(bad);
    assert.throws(() => Simulation.fromSave(bad));
  }
});
