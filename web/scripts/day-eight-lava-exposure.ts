import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Simulation, type Input, type SimulationOptions } from '../src/simulation.ts';
import { ordinaryEnemyHit, type CollisionGeometry } from '../src/collision.ts';
import { ENEMIES } from '../src/content.ts';

const path = (name: string) => fileURLToPath(new URL('../../' + name, import.meta.url));
const hash = (name: string) => createHash('sha256').update(readFileSync(path(name))).digest('hex');
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const campaigns = JSON.parse(readFileSync(path('.build/day-eight-party-soak/report.json'), 'utf8'));
const originScenario = process.argv[2] ?? 'natural-2';
const origin = campaigns.snapshots.find((row: { scenario: string; reason: string }) => row.scenario === originScenario && row.reason === 'day7-town');
assert.ok(origin, 'A naturally earned seventh town is required.');
const originPath = '.build/browser-qa/' + origin.file;
assert.equal(hash(originPath), origin.sha256);
for (const [file, sha] of Object.entries(campaigns.sourceHashes)) assert.equal(hash('web/src/' + file), sha, file);
assert.equal(hash('web/public/assets/collision-geometry.json'), campaigns.geometrySha256);
const envelope = JSON.parse(readFileSync(path(originPath), 'utf8'));
const geometry = JSON.parse(readFileSync(path('web/public/assets/collision-geometry.json'), 'utf8')) as CollisionGeometry;
const options: SimulationOptions = { hitTest: (enemy, x, y) => {
  if (enemy.kind !== 'boss') return ordinaryEnemyHit(enemy, x, y, geometry);
  const [left, right, top, bottom] = ENEMIES.boss.body;
  return x - enemy.x > left && x - enemy.x < right && y - enemy.y > top && y - enemy.y < bottom;
} };
const simulation = Simulation.fromSave(envelope.simulation, options);
let replay = Simulation.fromSave(clone(simulation.toSave()), options);
const operations: { action: string; args: unknown[] }[] = [];
const fixtures: { reason: string; file: string; sha256: string; operation: number; tick: number }[] = [];
const events: object[] = [];
const act = (action: string, args: unknown[], invoke: (sim: Simulation) => unknown) => {
  const before = simulation.events, count = before.length, beforeReplay = replay.events, replayCount = beforeReplay.length;
  assert.deepEqual(invoke(simulation), invoke(replay), action);
  assert.deepEqual(simulation.state, replay.state, action);
  assert.deepEqual(simulation.events === before ? simulation.events.slice(count) : simulation.events,
    replay.events === beforeReplay ? replay.events.slice(replayCount) : replay.events, action);
  operations.push({ action, args });
};
const save = (reason: string) => {
  if (fixtures.some(row => row.reason === reason)) return;
  const file = `day-eight-lava-exposure-${reason}-v23.json`;
  const current = { ...envelope, version: 23, simulation: simulation.toSave() };
  writeFileSync(path('.build/browser-qa/' + file), JSON.stringify(current, null, 2) + '\n');
  fixtures.push({ reason, file, sha256: hash('.build/browser-qa/' + file), operation: operations.length, tick: simulation.state.tick });
  replay = Simulation.fromSave(clone(current.simulation), options);
};

// Меняем только доступные приказы в заработанном городе; характеристики, HP и RNG не подменяем.
for (const slot of simulation.state.party.slots.filter(slot => slot.exists && slot.slot <= 3)) {
  act('setCompanionOrder', [slot.slot, 5], sim => sim.setCompanionOrder(slot.slot, 5));
  act('setCompanionPriorities', [slot.slot, { wall: false, boss: false }], sim => sim.setCompanionPriorities(slot.slot, { wall: false, boss: false }));
}
save('town-orders');
act('startNextDay', [], sim => sim.startNextDay());
assert.equal(simulation.state.day, 8);
save('entry');
let explodedUid: number | undefined;
for (let frame = 0; frame < 6000 && simulation.state.phase === 'battle'; frame++) {
  const lava = simulation.state.enemies.find(enemy => enemy.kind === 'lava' && enemy.hp > 0);
  if (lava?.attacking) save('attack');
  if (lava?.frame === 34) save('before-explosion');
  const target = simulation.state.enemies.filter(enemy => enemy.hp > 0 && enemy.x > 20 && enemy.kind !== 'lava'
    && !simulation.state.enemies.some(other => other.kind === 'lava' && other.hp > 0 && Math.abs(other.x - enemy.x) < 50 && Math.abs(other.y - enemy.y) < 50))
    .sort((a, b) => b.x - a.x)[0];
  const weapon = simulation.weapon;
  const input: Input = { aimX: target?.x ?? 450, aimY: target?.y ?? 240, firePressed: Boolean(!lava && target && weapon && weapon.reloadTime === 0 && weapon.ammo > 0),
    fireHeld: false, fireReleased: false, reload: Boolean(weapon && (weapon.ammo === 0 || !target && weapon.ammo < 3)) };
  act('tick', [input], sim => sim.tick(input));
  if (simulation.state.enemies.some(enemy => enemy.kind === 'lava' && enemy.hp > 0)) save('live');
  const explosion = simulation.events.find(event => event.type === 'lava-explode');
  if (explosion) {
    explodedUid = explosion.enemyUid;
    events.push({ tick: simulation.state.tick, events: clone(simulation.events), hp: simulation.state.castleHp });
    save('explosion');
  }
  if (explodedUid && !simulation.state.enemies.some(enemy => enemy.uid === explodedUid)) { save('removed'); break; }
}
assert.ok(fixtures.some(row => row.reason === 'before-explosion'), 'No earned Lava attack reached its pre-explosion boundary.');
assert.ok(fixtures.some(row => row.reason === 'removed'), 'The observed explosion was not removed normally.');
writeFileSync(path('.build/browser-qa/day-eight-lava-exposure-replay.json'), JSON.stringify({ origin, operations }, null, 2) + '\n');
const report = { status: 'passed', origin, sourceHashes: campaigns.sourceHashes, geometrySha256: campaigns.geometrySha256,
  operations: operations.length, fixtures, events, finalHp: simulation.state.castleHp,
  policy: 'Branch from a verified naturally earned Day7 town; ordinary armor-only/no-priorities orders, Rest, manual Sheriff shots only while no living Lava is present. No grants, invincibility, forced damage or private completion. Every operation replayed, with JSON restores at each fixture.',
  limits: 'Deliberate input exposure, separate from the four ordinary campaigns. Production ordinary contours; declared boss rectangle fallback. Original parity is established by separate source traces.' };
writeFileSync(path('.build/browser-qa/day-eight-lava-exposure-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
