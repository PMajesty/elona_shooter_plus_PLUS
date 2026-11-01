import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { Simulation, type Input, type SimulationOptions } from '../src/simulation.ts';
import { ENEMIES } from '../src/content.ts';
import { ordinaryEnemyHit, type CollisionGeometry } from '../src/collision.ts';

const outputDirectory = resolve('../.build/soak');
mkdirSync(outputDirectory, { recursive: true });
const seedCount = Number(process.argv[2] ?? 32);
assert.ok(Number.isInteger(seedCount) && seedCount >= 1 && seedCount <= 1000, 'Seed count must be between 1 and 1000.');
const policies = ['idle', 'aimed', 'interruptions'] as const;
type Policy = typeof policies[number];
const geometry = JSON.parse(readFileSync(new URL('../public/assets/collision-geometry.json', import.meta.url), 'utf8')) as CollisionGeometry;
const simulationOptions: SimulationOptions = { hitTest: (enemy, x, y) => {
  if (enemy.kind !== 'boss') return ordinaryEnemyHit({ ...enemy, kind: enemy.kind }, x, y, geometry);
  // Геометрия босса пока зависит от Phaser; её прямоугольная замена отмечена в отчёте.
  const [left, right, top, bottom] = ENEMIES.boss.body;
  return x - enemy.x > left && x - enemy.x < right && y - enemy.y > top && y - enemy.y < bottom;
} };

function inputFor(simulation: Simulation, policy: Policy): Input {
  if (policy === 'idle') return {};
  const { player, enemies, tick } = simulation.state;
  const target = enemies.filter(enemy => enemy.hp > 0 && enemy.x > 20).sort((left, right) => right.x - left.x)[0];
  const aiming = { aimX: target?.x ?? 450, aimY: target?.y ?? 240 };
  if (policy === 'aimed') return {
    ...aiming,
    firePressed: Boolean(target) && player.reloadTicks === 0 && player.ammo > 0,
    reload: player.ammo === 0 || (!target && player.ammo < 3),
    grenade: Boolean(target?.kind === 'boss') && player.grenades > 0 && player.grenadeCooldown === 0,
  };
  return {
    ...aiming,
    aimX: tick % 7 === 0 ? 510 : aiming.aimX,
    fireHeld: tick % 37 < 24, firePressed: tick % 29 === 0,
    reload: tick % 41 === 0, grenade: tick % 127 === 0,
  };
}

function assertFinite(value: unknown, path = 'state'): void {
  if (typeof value === 'number') assert.ok(Number.isFinite(value), `${path} is not finite`);
  else if (Array.isArray(value)) value.forEach((item, index) => assertFinite(item, `${path}[${index}]`));
  else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) assertFinite(item, `${path}.${key}`);
}

const started = performance.now();
const results: { seed: number; policy: Policy; phase: string; ticks: number; kills: number; checkpoints: number }[] = [];
let scenario: { seed: number; policy: Policy } | undefined;
let lastCheckpoint: unknown;
let inputs: Input[] = [];
let frames = 0;
let rewardTransitions = 0;
let townActions = 0;
try {
  for (let index = 0; index < seedCount; index++) {
    // Мультипликативная последовательность охватывает разные 32-битные начальные состояния.
    const seed = index === 0 ? 42 : Math.imul(index, 0x9e3779b1) >>> 0;
    for (const policy of policies) {
      scenario = { seed, policy };
      const simulation = new Simulation(seed, simulationOptions);
      let restored = Simulation.fromSave(JSON.parse(JSON.stringify(simulation.toSave())), simulationOptions);
      lastCheckpoint = simulation.toSave(); inputs = [];
      let checkpoints = 1;
      for (let frame = 0; frame < 6000 && simulation.state.phase === 'battle'; frame++) {
        const input = inputFor(simulation, policy);
        inputs.push(input);
        simulation.tick(input); restored.tick(input); frames++;
        assert.deepEqual(restored.state, simulation.state, `Save/replay state diverged at tick ${simulation.state.tick}`);
        assert.deepEqual(restored.events, simulation.events, `Save/replay events diverged at tick ${simulation.state.tick}`);
        assertFinite(simulation.state); assertFinite(simulation.events, 'events');
        assert.ok(simulation.state.player.ammo >= 0 && simulation.state.player.ammo <= 5);
        assert.ok(simulation.state.player.grenades >= 0 && simulation.state.player.grenades <= 5);
        if (frame % 137 === 136) {
          lastCheckpoint = JSON.parse(JSON.stringify(simulation.toSave()));
          restored = Simulation.fromSave(lastCheckpoint, simulationOptions);
          inputs = []; checkpoints++;
        }
      }
      assert.notEqual(simulation.state.phase, 'battle', 'Opening battle did not terminate within 6000 frames.');
      if (policy === 'idle') assert.equal(simulation.state.phase, 'defeat');
      let rewardActions = 0;
      while (simulation.state.phase === 'victory' && simulation.state.postbattle !== 'result') {
        assert.ok(rewardActions++ < 30, 'Earned rewards did not reach results.');
        const state = simulation.state;
        if (state.postbattle === 'loot' || state.postbattle === 'boss-loot') {
          const offer = state.lootOffers.findIndex(item => item !== null);
          const slot = state.inventory.findIndex(item => item === null);
          if (offer >= 0 && slot >= 0) {
            assert.equal(simulation.collectLoot(offer, slot), true);
            assert.equal(restored.collectLoot(offer, slot), true);
          } else {
            assert.equal(simulation.finishLoot(), true);
            assert.equal(restored.finishLoot(), true);
          }
        } else {
          assert.equal(state.postbattle, 'skill');
          const choice = state.skillChoices[0];
          assert.equal(simulation.chooseSkill(choice), true);
          assert.equal(restored.chooseSkill(choice), true);
        }
        assert.deepEqual(restored.state, simulation.state, 'Reward replay changed the offered items or skills.');
        assertFinite(simulation.state);
        lastCheckpoint = JSON.parse(JSON.stringify(simulation.toSave()));
        restored = Simulation.fromSave(lastCheckpoint, simulationOptions);
        assert.deepEqual(restored.state, simulation.state, 'Reward save/restore rerolled state.');
        checkpoints++; rewardTransitions++;
      }
      if (simulation.state.phase === 'victory') {
        assert.equal(simulation.enterTown(), true);
        assert.equal(restored.enterTown(), true);
        assert.deepEqual(restored.state, simulation.state, 'Town entry changed restored state.');
        lastCheckpoint = JSON.parse(JSON.stringify(simulation.toSave()));
        restored = Simulation.fromSave(lastCheckpoint, simulationOptions);
        checkpoints++; townActions++;
        assert.equal(restored.freeRepair(), simulation.freeRepair());
        assert.deepEqual(restored.state, simulation.state, 'Town repair changed restored state.');
        lastCheckpoint = JSON.parse(JSON.stringify(simulation.toSave()));
        restored = Simulation.fromSave(lastCheckpoint, simulationOptions);
        assert.deepEqual(restored.state, simulation.state, 'Town save/restore changed AP, HP or rewards.');
        checkpoints++; townActions++;
      }
      assert.deepEqual(Simulation.fromSave(simulation.toSave(), simulationOptions).state, simulation.state);
      results.push({ ...scenario, phase: simulation.state.phase, ticks: simulation.state.tick, kills: simulation.state.kills, checkpoints });
    }
  }
  const report = {
    status: 'passed', seedCount, policies, scenarios: results.length, simulationFrames: frames,
    checkpoints: results.reduce((sum, result) => sum + result.checkpoints, 0), rewardTransitions, townActions,
    elapsedMs: Math.round(performance.now() - started),
    collision: 'Production ordinary-enemy contours; boss uses the documented rectangular headless fallback',
    limits: ['Port self-consistency, finite state and JSON replay only; not an original-game parity proof', 'First-day Sheriff only; boss shape geometry not exercised', 'No browser rendering, input latency, audio or wall-clock performance comparison'],
    results,
  };
  writeFileSync(resolve(outputDirectory, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ ...report, results: undefined }, null, 2));
} catch (error) {
  // Контрольная точка и входы после неё позволяют повторить сбой без реакции человека в реальном времени.
  writeFileSync(resolve(outputDirectory, 'failure.json'), JSON.stringify({ scenario, checkpoint: lastCheckpoint, inputs, error: String(error) }, null, 2) + '\n');
  throw error;
}
