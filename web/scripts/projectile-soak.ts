import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { Simulation, type Input, type SimulationOptions, type SimulationState } from '../src/simulation.ts';
import { ENEMIES, WORLD, type EnemyKind } from '../src/content.ts';
import { ItemFactory } from '../src/items.ts';
import { ordinaryEnemyHit, type CollisionGeometry } from '../src/collision.ts';

const seeds = [42, 1, 0xdeadbeef];
const weaponIds = [11, 21, 22, 23, 24, 25, 26, 27, 40];
const frameBudget = 360;
const outputDirectory = resolve('../.build/soak');
mkdirSync(outputDirectory, { recursive: true });
const geometry = JSON.parse(readFileSync(new URL('../public/assets/collision-geometry.json', import.meta.url), 'utf8')) as CollisionGeometry;
const options: SimulationOptions = { hitTest: (enemy, x, y) => {
  if (enemy.kind !== 'boss') return ordinaryEnemyHit({ ...enemy, kind: enemy.kind }, x, y, geometry);
  // Прямоугольник здесь лишь headless-замена Phaser-маски босса; не доказательство её точности.
  const [left, right, top, bottom] = ENEMIES.boss.body;
  return x - enemy.x > left && x - enemy.x < right && y - enemy.y > top && y - enemy.y < bottom;
} };

function sourceHashes(): Record<string, string> {
  return Object.fromEntries(['src/simulation.ts', 'src/projectiles.ts', 'src/combat-stats.ts', 'src/consumables.ts', 'src/collision.ts', 'public/assets/collision-geometry.json'].map(path => [path, createHash('sha256').update(readFileSync(new URL(`../${path}`, import.meta.url))).digest('hex')]));
}

function assertFinite(value: unknown, path = 'state'): void {
  if (typeof value === 'number') assert.ok(Number.isFinite(value), `${path} is not finite`);
  else if (Array.isArray(value)) value.forEach((item, index) => assertFinite(item, `${path}[${index}]`));
  else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) assertFinite(item, `${path}.${key}`);
}

function configuredSimulation(seed: number, weaponId: number): Simulation {
  const simulation = new Simulation(seed, options);
  const boundary = simulation as unknown as { random(): number; spawnEnemy(kind: EnemyKind): void };
  const factory = new ItemFactory(() => boundary.random());
  // Это явно настроенная проверка, а не достижение позднего оружия обычным прохождением.
  if (weaponId !== 11) {
    const gun = factory.generate(weaponId);
    simulation.state.inventory[2] = gun;
    simulation.state.player.traits[gun.reqTrait!] = Math.max(simulation.state.player.traits[gun.reqTrait!] ?? 0, gun.reqLv!);
    assert.equal(simulation.useSlot(2), true);
  }
  simulation.state.inventory[3] = factory.generate(117);
  // Волны отключены только на границе сценария; дальнейшие движение/попадания/рост выполняет tick.
  simulation.state.waveIndex = 4; simulation.state.newWave = false; simulation.state.spawnTimer = 1_000_000;
  const targets: [EnemyKind, number, number][] = [
    ['sheep', 260, 220], ['rat', 300, 235], ['chicken', 220, 245], ['crow', 320, 90], ['boss', 190, 210],
  ];
  for (const [kind, x, y] of targets) {
    boundary.spawnEnemy(kind);
    Object.assign(simulation.state.enemies.at(-1)!, { x, y });
  }
  simulation.events = [];
  return simulation;
}

function inputFor(simulation: Simulation, weaponId: number, frame: number): Input {
  const living = simulation.state.enemies.filter(enemy => enemy.hp > 0);
  const ground = living.filter(enemy => enemy.kind !== 'crow').sort((a, b) => b.x - a.x)[0];
  const air = living.find(enemy => enemy.kind === 'crow');
  const policy = Math.floor(frame / 60) % 6;
  const aims = [
    [ground?.x ?? 300, ground?.y ?? 225], [air?.x ?? 300, air?.y ?? 90],
    [600, 210], [WORLD.playerX, 150], [50, 230], [510.000001, 245],
  ];
  const [aimX, aimY] = aims[policy];
  const cycle = frame % 90;
  let slot: number | undefined = cycle === 30 ? 3 : cycle === 40 ? (weaponId === 11 ? 0 : 2) : undefined;
  if (weaponId === 11 && frame % 110 === 0) slot = 1;
  const bow = weaponId === 24 || weaponId === 25;
  const firing = weaponId !== 11 && (bow ? cycle >= 10 && cycle < 13 : cycle >= 10 && cycle < 26);
  return {
    aimX, aimY, slot, fireHeld: firing, fireReleased: bow && cycle === 13,
    firePressed: weaponId !== 11 && (cycle === 10 || (!bow && cycle === 59)),
    reload: weaponId !== 11 && cycle === 65,
  };
}

interface CaseResult {
  seed: number; weaponId: number; frames: number; phase: string; checkpoints: number;
  launched: number; hits: number; kills: number; explosions: number; pulses: number;
  bowDrawCheckpoints: number; inFlightSwitches: number; verticalAimFrames: number;
  maximumConcurrent: number; maximumAbsoluteCoordinate: number; maximumTickMs: number;
}

const started = performance.now(), hashes = sourceHashes();
const results: CaseResult[] = [];
let scenario: { seed: number; weaponId: number } | undefined;
let lastCheckpoint: SimulationState | undefined;
let inputs: Input[] = [];
try {
  for (const seed of seeds) for (const weaponId of weaponIds) {
    scenario = { seed, weaponId };
    const simulation = configuredSimulation(seed, weaponId);
    lastCheckpoint = JSON.parse(JSON.stringify(simulation.toSave())) as SimulationState;
    let replay = Simulation.fromSave(lastCheckpoint, options);
    const firstUid = simulation.state.nextUid;
    const result: CaseResult = { seed, weaponId, frames: 0, phase: 'battle', checkpoints: 1, launched: 0, hits: 0, kills: 0, explosions: 0, pulses: 0, bowDrawCheckpoints: 0, inFlightSwitches: 0, verticalAimFrames: 0, maximumConcurrent: 0, maximumAbsoluteCoordinate: 0, maximumTickMs: 0 };
    inputs = [];
    for (let frame = 0; frame < frameBudget && simulation.state.phase === 'battle'; frame++) {
      const input = inputFor(simulation, weaponId, frame);
      inputs.push(input);
      if (Math.abs(input.aimX! - WORLD.playerX) < 0.01) result.verticalAimFrames++;
      if (input.slot !== undefined && input.slot !== 1 && simulation.state.projectiles.length) result.inFlightSwitches++;
      const tickStarted = performance.now();
      simulation.tick(input); replay.tick(input);
      result.maximumTickMs = Math.max(result.maximumTickMs, performance.now() - tickStarted);
      result.frames++;
      assert.deepEqual(replay.state, simulation.state, `State diverged in ${seed}/${weaponId} at frame${frame}`);
      assert.deepEqual(replay.events, simulation.events, `Events diverged in ${seed}/${weaponId} at frame${frame}`);
      assertFinite(simulation.state); assertFinite(simulation.events, 'events');
      const actors = simulation.state.projectiles;
      result.maximumConcurrent = Math.max(result.maximumConcurrent, actors.length);
      assert.ok(actors.length < 1000, 'Finite configured scenario accumulated an unexpected projectile backlog.');
      for (const actor of actors) {
        const extent = Math.max(Math.abs(actor.x), Math.abs(actor.y));
        result.maximumAbsoluteCoordinate = Math.max(result.maximumAbsoluteCoordinate, extent);
        assert.ok(extent < 1e10, 'Projectile coordinates escaped the bounded configured fixture.');
        assert.ok(actor.verticalProgress !== null || Math.abs(actor.targetX - actor.startX) >= 0.001, 'Uncorrected singular trajectory.');
        assert.equal(actor.removed, false);
      }
      result.hits += simulation.events.filter(event => event.type === 'hit').length;
      result.explosions += simulation.events.filter(event => event.type === 'explosion').length;
      result.pulses += simulation.events.filter(event => event.type === 'pulse').length;
      const cycle = frame % 90;
      if ([10, 12, 13, 30, 35, 40, 59, 65].includes(cycle) || frame % 47 === 46) {
        lastCheckpoint = JSON.parse(JSON.stringify(simulation.toSave())) as SimulationState;
        replay = Simulation.fromSave(lastCheckpoint, options);
        assert.deepEqual(replay.state, simulation.state, 'Checkpoint changed canonical state.');
        if (simulation.state.player.bowDrawing) result.bowDrawCheckpoints++;
        result.checkpoints++; inputs = [];
      }
    }
    result.phase = simulation.state.phase;
    result.launched = simulation.state.nextUid - firstUid;
    result.kills = simulation.state.kills;
    assert.ok(result.launched > 0, `Configured weapon${weaponId} never launched.`);
    if (weaponId === 24 || weaponId === 25) assert.ok(result.bowDrawCheckpoints > 0, 'Bow draw checkpoint was not reached.');
    if (weaponId === 27) assert.ok(result.pulses > 0, 'Gravity pulse branch was not reached.');
    results.push(result);
  }
  assert.ok(results.reduce((sum, row) => sum + row.hits, 0) > 0, 'No production damage path was reached.');
  assert.ok(results.some(row => row.inFlightSwitches > 0), 'No weapon switch during flight was exercised.');
  assert.deepEqual(sourceHashes(), hashes, 'Production files changed during this run; rerun against one consistent revision.');
  const totals = Object.fromEntries(['frames', 'checkpoints', 'launched', 'hits', 'kills', 'explosions', 'pulses', 'bowDrawCheckpoints', 'inFlightSwitches', 'verticalAimFrames'].map(key => [key, results.reduce((sum, row) => sum + Number(row[key as keyof CaseResult]), 0)]));
  const report = {
    format: 'elona-projectile-replay-soak', version: 1, status: 'passed', generatedAt: new Date().toISOString(),
    scenarioBoundary: 'Configured owned original guns with required weapon traits, seeded production item/enemy generation, fixed enemy placement and disabled ambient wave spawning. This is not ordinary progression to these weapons.',
    collision: 'Production ordinary-enemy contours; boss uses a rectangular headless fallback, not the browser alpha geometry.',
    purpose: 'Finite state and exact port save/event replay; not independent original-runtime parity, native scheduling or browser performance.',
    pauseScope: 'Browser pause input and wall-clock behavior are outside this headless fixture.',
    seeds, weaponIds, frameBudget, cases: results.length, totals,
    elapsedMs: performance.now() - started, maximumPairOfTicksMs: Math.max(...results.map(row => row.maximumTickMs)),
    sourceHashes: hashes, results,
  };
  writeFileSync(resolve(outputDirectory, 'projectile-report.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ status: report.status, cases: report.cases, ...totals, elapsedMs: report.elapsedMs }));
} catch (error) {
  writeFileSync(resolve(outputDirectory, 'projectile-failure.json'), `${JSON.stringify({ format: 'elona-projectile-replay-failure', scenario, error: String(error), stack: error instanceof Error ? error.stack : undefined, sourceHashes: hashes, lastCheckpoint, inputs, completedCases: results }, null, 2)}\n`);
  throw error;
}
