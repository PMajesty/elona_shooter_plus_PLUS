import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { Simulation } from '../src/simulation.ts';
import type { Item } from '../src/items.ts';
import { compareProjectileTrace, type ProjectileRecord } from './projectile-reference-support.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-projectile-trace.json', import.meta.url), 'utf8'));
const records = fixture.records as ProjectileRecord[];
const sample = (name: string) => records.find(row => row.scenario === name)!;

test('original projectile callback probe matches 650 manual flight steps; gameplay hit deduplication is tested separately', () => {
  assert.equal(fixture.format, 'elona-original-projectile-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  assert.equal(createHash('sha256').update(JSON.stringify(records)).digest('hex'), fixture.traceSha256);
  // Наблюдённые ветви оригинала: общий бросок Wind Bow, трупы, повторные попадания и поздний импульс.
  assert.equal(sample('wind_bow').launched!.actors.length, 3);
  assert.equal(sample('wind_bow').launched!.drawCount, 4);
  assert.equal(sample('crossbow_overlap_corpse').drawCount, 10);
  assert.equal(sample('crossbow_overlap_corpse').damageEvents!.length, 4);
  assert.equal(sample('arrow_penetration').damageEvents!.length, 3);
  // Зонд вызывает procHit без объекта снаряда и сохраняет свидетельство повторных попаданий Flash.
  // Обычный Simulation.tick ведёт историю целей; исправление проверяется в projectile-gameplay.test.ts.
  assert.equal(sample('crossbow_fade').steps!.at(-1)!.actors[0].attached, false);
  assert.ok(Number(sample('crossbow_fade').steps!.at(-1)!.actors[0].scale) < 0);
  for (const name of ['gravity', 'flame']) {
    const row = sample(name);
    assert.equal(row.callbacks!.at(-1)!.step, row.steps!.length);
    assert.equal(row.steps!.at(-1)!.actors[0].attached, false);
  }
  assert.deepEqual(sample('switch_in_flight').after!.player.weaponExp, [0, 0, 0, 1, 0]);
  assert.equal(sample('switch_in_flight').after!.enemies[0].state.frame, 58);
  const result = compareProjectileTrace(records);
  assert.equal(result.status, 'passed');
  assert.equal(result.observedSnapshots, 17); assert.equal(result.matchedSnapshots, 14);
  assert.equal(result.comparisons.reduce((total, row) => total + row.steps, 0), 650);
  assert.equal(result.verticalFixChecks, 2);
});

test('the differential comparison rejects changed trajectory, random stream and birth ordering', () => {
  const corrupted = structuredClone(records);
  const crossbow = corrupted.find(row => row.scenario === 'crossbow')!;
  crossbow.steps![0].actors[0].x = Number(crossbow.steps![0].actors[0].x) + 0.05;
  crossbow.draws![0].value += 0.01;
  const comparison = compareProjectileTrace(corrupted);
  assert.equal(comparison.status, 'failed');
  const differences = comparison.comparisons.find(row => row.scenario === 'crossbow')!.differences;
  assert.ok(differences.some(row => row.field === 'step1.actors[0].x'));
  assert.ok(differences.some(row => row.field === 'draws'));
  const wrongBirth = structuredClone(records);
  wrongBirth.find(row => row.scenario === 'native_birth')!.events!.find(row => row.event === 'advance')!.frame = 1;
  assert.throws(() => compareProjectileTrace(wrongBirth), assert.AssertionError);
});

test('ordinary Simulation input defers the first projectile advance to the frame after birth, as observed in the original', () => {
  const birth = sample('native_birth');
  const init = birth.events!.find(row => row.event === 'init')!;
  const advances = birth.events!.filter(row => row.event === 'advance');
  assert.equal(advances[0].frame - init.frame, 1);
  const simulation = new Simulation(42);
  const state = simulation.state, launch = sample('launcher_grenade');
  state.newWave = false; state.waveIndex = 4; state.spawnTimer = 100000;
  state.inventory[0] = Object.fromEntries(Object.entries(launch.before!.weapons[0].item).filter(([, value]) => value !== null)) as unknown as Item;
  state.player.traits = structuredClone(launch.before!.player.traits);
  state.player.selectedSlot = 0; state.player.shootTimer = 0;
  (simulation as unknown as { random(): number }).random = () => 0.5;
  simulation.tick({ aimX: Number(init.actor.targetX), aimY: Number(init.actor.targetY), firePressed: true, fireHeld: true });
  const actor = state.projectiles[0];
  assert.ok(actor);
  assert.equal(actor.frame, 0);
  assert.equal(actor.x, init.actor.x); assert.equal(actor.y, init.actor.y);
  simulation.tick();
  assert.equal(actor.frame, 1);
  // Второе наблюдение advance снято перед телом второго вызова, то есть после первого движения.
  assert.equal(actor.x, advances[1].actor.x); assert.equal(actor.y, advances[1].actor.y);
});
