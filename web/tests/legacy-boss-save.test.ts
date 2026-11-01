import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation, type EnemyState } from '../src/simulation.ts';
import { asLegacyV6Save, asLegacyV9Save } from './legacy-save-support.ts';

interface Boundary { spawnEnemy(kind: 'boss'): void; tickEnemy(enemy: EnemyState): void }
function walkingBoss(frame: number) {
  const simulation = new Simulation(42);
  (simulation as unknown as Boundary).spawnEnemy('boss');
  Object.assign(simulation.state.enemies[0], { bossAction: 2, bossCount: 100, bossIdle: 0, frame, x: 200 });
  return simulation;
}
function legacySave(simulation: Simulation, version: number): Record<string, any> {
  if (version === 6) return asLegacyV6Save(simulation.toSave());
  if (version === 9) return asLegacyV9Save(simulation.toSave());
  const saved: Record<string, any> = simulation.toSave(); saved.version = 10;
  for (const enemy of saved.enemies) delete enemy.bossFacing;
  return saved;
}

test('legacy walking frames 212–219 import into the source loop without consuming RNG or drifting into shield animation', () => {
  for (const version of [6, 9, 10]) for (const frame of [212, 219]) {
    const simulation = walkingBoss(frame);
    const saved = legacySave(simulation, version);
    const restored = Simulation.fromSave(JSON.parse(JSON.stringify(saved)));
    const enemy = restored.state.enemies[0];
    assert.equal(restored.state.rng, saved.rng);
    assert.equal(enemy.frame, 200 + (frame - 200) % 12);
    assert.equal(enemy.bossFacing, -1);
    const clone = Simulation.fromSave(JSON.parse(JSON.stringify(restored.toSave())));
    for (let step = 0; step < 32; step++) {
      (restored as unknown as Boundary).tickEnemy(enemy);
      (clone as unknown as Boundary).tickEnemy(clone.state.enemies[0]);
      assert.ok(enemy.frame >= 200 && enemy.frame <= 211);
      assert.equal(enemy.bossAction, 2);
      assert.deepEqual(clone.toSave(), restored.toSave());
    }
  }
});

test('legacy source-compatible frames and non-walking poses are preserved', () => {
  for (const [frame, action] of [[209, 2], [219, 1]]) {
    const simulation = walkingBoss(frame);
    simulation.state.enemies[0].bossAction = action;
    const saved = legacySave(simulation, 10);
    const restored = Simulation.fromSave(saved);
    assert.equal(restored.state.enemies[0].frame, frame);
    assert.equal(restored.state.enemies[0].bossAction, action);
    assert.equal(restored.state.rng, saved.rng);
  }
});
