import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceBattleLighting, battleLightColor, battleCloudX } from '../src/battle-lighting.ts';
import { Simulation } from '../src/simulation.ts';

test('source dusk/night transitions reach their distinct colors after100 timer calls', () => {
  assert.equal(battleLightColor(), 0xffffff);
  for (const [phase, color] of [['dusk', 0xff9966], ['night', 0x1966ff]] as const) {
    let light = advanceBattleLighting(undefined, phase)!;
    assert.equal(light.step, 1);
    for (let step = 2; step <= 100; step++) light = advanceBattleLighting(light)!;
    assert.equal(light.step, 100);
    assert.equal(battleLightColor(light), color);
    assert.equal(advanceBattleLighting(light), light);
  }
  assert.equal(battleCloudX(0), 160);
  assert.equal(battleCloudX(5), 159);
  assert.ok(Math.abs(battleCloudX(7201) + 0.2) < 1e-9);
});

test('ordinary wave boundaries drive lighting and a mid-transition save replays exactly', () => {
  const sim = new Simulation(20261103);
  Object.assign(sim.state, { waveIndex: 3, newWave: true, spawnTimer: 10000 });
  while (!sim.state.battleLighting) sim.tick();
  assert.deepEqual(sim.state.battleLighting, { phase: 'dusk', step: 1 });
  assert.equal(sim.state.waveIndex, 2);
  const replay = Simulation.fromSave(sim.toSave());
  for (let frame = 0; frame < 151; frame++) { sim.tick(); replay.tick(); }
  assert.deepEqual(replay.toSave(), sim.toSave());
  assert.deepEqual(sim.state.battleLighting, { phase: 'dusk', step: 100 });
  Object.assign(sim.state, { waveIndex: 1, newWave: true });
  while (sim.state.battleLighting.phase !== 'night') sim.tick();
  assert.deepEqual(sim.state.battleLighting, { phase: 'night', step: 1 });
  assert.equal(sim.state.waveIndex, 0);
});

test('legacy late battles infer settled lighting without RNG draws; invalid saved phases fail', () => {
  const raw = new Simulation(9).toSave();
  const legacy = { ...raw, version: 42, waveIndex: 2, newWave: false };
  const restored = Simulation.fromSave(legacy).toSave();
  assert.equal(restored.rng, raw.rng);
  assert.deepEqual(restored.battleLighting, { phase: 'dusk', step: 100 });
  assert.equal(legacy.battleLighting, undefined);
  for (const bad of [{ phase: 'day', step: 1 }, { phase: 'dusk', step: 101 }, { phase: 'night', step: NaN }]) {
    assert.throws(() => Simulation.fromSave({ ...restored, battleLighting: bad }), /Invalid battle lighting/);
  }
  assert.throws(() => Simulation.fromSave({ ...legacy, battleLighting: { phase: 'dusk', step: 1 } }), /Invalid battle lighting/);
});
