import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation, type EnemyState } from '../src/simulation.ts';
import { WORLD } from '../src/content.ts';
import { asLegacyV6Save } from './legacy-save-support.ts';

type EnemyOperations = {
  spawnEnemy(kind: 'sheep'): void;
  damageEnemy(enemy: EnemyState, raw: number, critical: boolean, weapon: number | null, x: number, y: number): void;
};

function attackingSheep(): { simulation: Simulation; enemy: EnemyState; operations: EnemyOperations } {
  const simulation = new Simulation(42);
  simulation.tick(); simulation.tick();
  const operations = simulation as unknown as EnemyOperations;
  operations.spawnEnemy('sheep');
  const enemy = simulation.state.enemies[0];
  assert.equal(enemy.shadowHit, true);
  enemy.x = WORLD.defenseLine;
  simulation.tick();
  assert.equal(enemy.attacking, true);
  assert.equal(enemy.shadowHit, false);
  return { simulation, enemy, operations };
}

test('sheep keeps original shadow exclusion after Sheriff knockback, alive loop and save restore', () => {
  const { simulation, enemy, operations } = attackingSheep();
  operations.damageEnemy(enemy, 1, false, 0, enemy.x, enemy.y);
  assert.ok(enemy.knockBack > 0);
  simulation.tick();
  assert.equal(enemy.attacking, false);
  assert.equal(enemy.frame, 6);
  assert.equal(enemy.shadowHit, false);
  const saved = simulation.toSave();
  const restored = Simulation.fromSave(JSON.parse(JSON.stringify(saved)));
  assert.deepEqual(restored.state, saved);
  for (let frame = 0; frame < 40; frame++) {
    simulation.tick(); restored.tick();
    assert.equal(simulation.state.enemies[0].shadowHit, false);
  }
  assert.deepEqual(restored.state, simulation.state);
});

test('original sheep death frame restores shadow hits', () => {
  const { simulation, enemy, operations } = attackingSheep();
  operations.damageEnemy(enemy, enemy.hp, false, null, enemy.x, enemy.y);
  assert.equal(enemy.frame, 107);
  assert.equal(enemy.shadowHit, true);
  simulation.tick();
  assert.equal(enemy.shadowHit, true);
});

test('older saves infer only their former frame rule, preserve RNG and reject invalid shadow state', () => {
  const { simulation } = attackingSheep();
  for (const version of [2, 3]) {
    for (const [frame, expected] of [[5, true], [44, false], [107, true]] as const) {
      const saved = asLegacyV6Save(simulation.toSave());
      saved.version = version;
      for (const field of ['town', 'totalMoney', 'hero']) delete saved[field];
      delete saved.player.traits[900]; delete saved.player.traits[901];
      if (version < 3) {
        for (const field of ['bossKilled', 'skillChoices', 'traitsProvenance', 'bossKilledProvenance']) delete saved[field];
        delete saved.player.traits;
      }
      for (const enemy of saved.enemies) { delete enemy.bossDamage; delete enemy.disarmed; }
      saved.enemies[0].frame = frame;
      delete saved.enemies[0].shadowHit;
      const untouched = structuredClone(saved);
      const restored = Simulation.fromSave(saved);
      assert.equal(restored.state.enemies[0].shadowHit, expected);
      assert.equal(restored.state.rng, saved.rng);
      assert.deepEqual(saved, untouched);
    }
  }
  const invalid = simulation.toSave() as unknown as Record<string, any>;
  invalid.enemies[0].shadowHit = 'false';
  const untouched = structuredClone(invalid);
  assert.throws(() => Simulation.fromSave(invalid), /Invalid enemies/);
  assert.deepEqual(invalid, untouched);
  const missing = simulation.toSave() as unknown as Record<string, any>;
  delete missing.enemies[0].shadowHit;
  const missingUntouched = structuredClone(missing);
  assert.throws(() => Simulation.fromSave(missing), /Missing enemy shadow history/);
  assert.deepEqual(missing, missingUntouched);
});
