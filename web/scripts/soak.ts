import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { Simulation, type Input } from '../src/simulation.ts';

const outputDirectory = resolve('../.build/soak');
mkdirSync(outputDirectory, { recursive: true });
const seedCount = Number(process.argv[2] ?? 32);
assert.ok(Number.isInteger(seedCount) && seedCount >= 1 && seedCount <= 1000, 'Seed count must be between 1 and 1000.');
const policies = ['idle', 'aimed', 'interruptions'] as const;
type Policy = typeof policies[number];

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
try {
  for (let index = 0; index < seedCount; index++) {
    // Мультипликативная последовательность охватывает разные 32-битные начальные состояния.
    const seed = index === 0 ? 42 : Math.imul(index, 0x9e3779b1) >>> 0;
    for (const policy of policies) {
      scenario = { seed, policy };
      const simulation = new Simulation(seed);
      let restored = Simulation.fromSave(JSON.parse(JSON.stringify(simulation.toSave())));
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
          restored = Simulation.fromSave(lastCheckpoint);
          inputs = []; checkpoints++;
        }
      }
      assert.notEqual(simulation.state.phase, 'battle', 'Opening battle did not terminate within 6000 frames.');
      if (policy === 'idle') assert.equal(simulation.state.phase, 'defeat');
      assert.deepEqual(Simulation.fromSave(simulation.toSave()).state, simulation.state);
      results.push({ ...scenario, phase: simulation.state.phase, ticks: simulation.state.tick, kills: simulation.state.kills, checkpoints });
    }
  }
  const report = {
    status: 'passed', seedCount, policies, scenarios: results.length, simulationFrames: frames,
    checkpoints: results.reduce((sum, result) => sum + result.checkpoints, 0),
    elapsedMs: Math.round(performance.now() - started),
    limits: ['Port self-consistency, finite state and JSON replay only; not an original-game parity proof', 'First-day Sheriff only, rectangular headless hit testing', 'No browser rendering, input latency, audio or wall-clock performance comparison'],
    results,
  };
  writeFileSync(resolve(outputDirectory, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ ...report, results: undefined }, null, 2));
} catch (error) {
  // Контрольная точка и входы после неё позволяют повторить сбой без реакции человека в реальном времени.
  writeFileSync(resolve(outputDirectory, 'failure.json'), JSON.stringify({ scenario, checkpoint: lastCheckpoint, inputs, error: String(error) }, null, 2) + '\n');
  throw error;
}
