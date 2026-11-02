import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { Simulation, type Input, type SimulationEvent, type SimulationOptions } from '../src/simulation.ts';
import { ordinaryEnemyHit, type CollisionGeometry } from '../src/collision.ts';
import { ENEMIES } from '../src/content.ts';
import { isOccupiedItem } from '../src/items.ts';
import { generateEarlyTownRecruit } from '../src/recruits.ts';
import { installCandidate } from '../src/party.ts';

const output = fileURLToPath(new URL('../../.build/party-soak', import.meta.url));
const browserOutput = fileURLToPath(new URL('../../.build/browser-qa', import.meta.url));
mkdirSync(output, { recursive: true }); mkdirSync(browserOutput, { recursive: true });
const seedCount = Number(process.argv[2] ?? 32);
assert.ok(Number.isInteger(seedCount) && seedCount >= 1 && seedCount <= 32, 'Use 1–32 natural seeds.');
const sourceHashes = Object.fromEntries(['simulation.ts', 'party.ts', 'party-ai.ts', 'party-progression.ts', 'party-save.ts', 'projectiles.ts', 'collision.ts', 'town-preparation.ts', 'town-save.ts']
  .map(file => [file, createHash('sha256').update(readFileSync(new URL(`../src/${file}`, import.meta.url))).digest('hex')]));
const geometrySha256 = createHash('sha256').update(readFileSync(new URL('../public/assets/collision-geometry.json', import.meta.url))).digest('hex');
const geometry = JSON.parse(readFileSync(new URL('../public/assets/collision-geometry.json', import.meta.url), 'utf8')) as CollisionGeometry;
const options: SimulationOptions = { hitTest: (enemy, x, y) => {
  if (enemy.kind !== 'boss') return ordinaryEnemyHit(enemy, x, y, geometry);
  // Босс использует ту же явно отмеченную замену, что и прежний headless soak.
  const [left, right, top, bottom] = ENEMIES.boss.body;
  return x - enemy.x > left && x - enemy.x < right && y - enemy.y > top && y - enemy.y < bottom;
} };
type Save = ReturnType<Simulation['toSave']>;
type Operation = { action: string; args: unknown[] };
type Scenario = { id: string; seed: number; kind: 'natural' | 'controlled-start'; classId?: number; origin?: string };
type Activity = { shots: number; hits: number; damage: number; kills: number; reloads: number; reloadCompletions: number; bowDraws: number; projectiles: number; projectileKinds: Record<string, number>; levelUps: number; wages: number; wageSettlements: number; battles: number; victories: number; castleDefeats: number };
const emptyActivity = (): Activity => ({ shots: 0, hits: 0, damage: 0, kills: 0, reloads: 0, reloadCompletions: 0, bowDraws: 0, projectiles: 0, projectileKinds: {}, levelUps: 0, wages: 0, wageSettlements: 0, battles: 0, victories: 0, castleDefeats: 0 });
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const snapshots: { scenario: string; classId: number; reason: string; file: string; sha256: string; operation: number; day: number; tick: number }[] = [];
const classes: Record<number, { natural: Activity; controlled: Activity }> = {};
for (let id = 1; id <= 9; id++) classes[id] = { natural: emptyActivity(), controlled: emptyActivity() };
const naturalHired = new Set<number>();
const results: unknown[] = [];
let scenario: Scenario | undefined, checkpoint: Save | undefined, sinceCheckpoint: Operation[] = [];
let firstTown: { save: Save; scenario: string; seed: number; operations: number } | undefined;
let totalFrames = 0, totalCheckpoints = 0, totalRest = 0, totalRewards = 0;
const reachedDays: Record<number, number> = {}, wonDays: Record<number, number> = {};

function finite(value: unknown, path = 'state'): void {
  if (typeof value === 'number') assert.ok(Number.isFinite(value), `${path} is not finite`);
  else if (Array.isArray(value)) value.forEach((item, index) => finite(item, `${path}[${index}]`));
  else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) finite(item, `${path}.${key}`);
}

// Герой целится обычным вводом; союзник получает только сохранённый исходный приказ и действует сам.
function inputFor(simulation: Simulation): Input {
  const state = simulation.state, weapon = simulation.weapon;
  const target = state.enemies.filter(enemy => enemy.hp > 0 && enemy.x > 20).sort((a, b) => b.x - a.x)[0];
  const grenade = state.inventory[1];
  return { aimX: target?.x ?? 450, aimY: target?.y ?? 240,
    firePressed: Boolean(target && weapon && weapon.reloadTime === 0 && weapon.ammo > 0),
    fireReleased: false,
    reload: Boolean(weapon && (weapon.ammo === 0 || !target && weapon.ammo < 3)),
    slot: target?.kind === 'boss' && isOccupiedItem(grenade) && grenade.id === 11 && grenade.ammo > 0 && state.itemCooldowns[1] === 0 ? 1 : undefined };
}

function run(current: Scenario, initial?: Save): void {
  scenario = current;
  const simulation = initial ? Simulation.fromSave(initial, options) : new Simulation(current.seed, options);
  let restored = Simulation.fromSave(clone(simulation.toSave()), options);
  const operations: Operation[] = [], activity = emptyActivity(), seenProjectiles = new Set<number>(), recorded = new Set<string>();
  const hired: { day: number; classId: number; cost: number; name: string }[] = [];
  let checkpoints = 0, rests = 0, victories = 0;
  const compare = (label: string, actualEvents: SimulationEvent[], expectedEvents: SimulationEvent[]) => {
    assert.deepEqual(restored.state, simulation.state, `${current.id}: state differs after ${label}`);
    assert.deepEqual(actualEvents, expectedEvents, `${current.id}: events differ after ${label}`);
    finite(simulation.state); finite(simulation.events, 'events');
  };
  const save = () => {
    checkpoint = clone(simulation.toSave()); restored = Simulation.fromSave(checkpoint, options);
    assert.deepEqual(restored.state, simulation.state, `${current.id}: JSON checkpoint changed state`);
    sinceCheckpoint = []; totalCheckpoints++; checkpoints++;
  };
  const act = (action: string, args: unknown[], invoke: (sim: Simulation) => unknown) => {
    const operation = { action, args }; operations.push(operation); sinceCheckpoint.push(operation);
    const before = simulation.events, beforeLength = before.length, beforeRestored = restored.events, beforeRestoredLength = beforeRestored.length;
    const result = invoke(simulation); assert.deepEqual(invoke(restored), result, `${current.id}: ${action} outcome differs`);
    // Однократные события до сохранения уже потреблены UI и не входят в файл; сравниваем новые события действия.
    compare(action, restored.events === beforeRestored ? restored.events.slice(beforeRestoredLength) : restored.events,
      simulation.events === before ? simulation.events.slice(beforeLength) : simulation.events); return result;
  };
  const activeClass = () => simulation.state.party.slots.find(slot => slot.slot <= 3 && slot.exists)?.member?.devType;
  const recordFixture = (reason: string) => {
    const classId = activeClass();
    if (!classId || recorded.has(reason)) return;
    recorded.add(reason);
    const file = `party-${current.id}-${reason}-v15.json`, value = { format: 'elona-shooter-browser', version: 15, appearance: 0, simulation: simulation.toSave() };
    const encoded = JSON.stringify(value, null, 2) + '\n';
    writeFileSync(resolve(browserOutput, file), encoded);
    snapshots.push({ scenario: current.id, classId, reason, file, sha256: hash(encoded), operation: operations.length, day: simulation.state.day, tick: simulation.state.tick });
  };
  const countEvent = (event: SimulationEvent) => {
    if (!event.actorSlot) return;
    if (event.type === 'shot') activity.shots++;
    if (event.type === 'hit') { activity.hits++; activity.damage += event.amount ?? 0; }
    if (event.type === 'kill') activity.kills++;
    if (event.type === 'reload') activity.reloads++;
    if (event.type === 'reloaded') activity.reloadCompletions++;
    if (event.type === 'bow-draw') activity.bowDraws++;
    if (event.type === 'level-up') activity.levelUps++;
  };
  save();
  while (simulation.state.day <= 7) {
    const day = simulation.state.day;
    if (simulation.state.phase === 'battle') {
      reachedDays[day] = (reachedDays[day] ?? 0) + 1;
      if (activeClass()) activity.battles++;
      for (let frame = 0; frame < 6000 && simulation.state.phase === 'battle'; frame++) {
        const input = inputFor(simulation);
        act('tick', [input], sim => sim.tick(input)); totalFrames++;
        for (const event of simulation.events) countEvent(event);
        for (const projectile of simulation.state.projectiles) if (projectile.actorSlot && !seenProjectiles.has(projectile.uid)) {
          seenProjectiles.add(projectile.uid); activity.projectiles++;
          activity.projectileKinds[projectile.kind] = (activity.projectileKinds[projectile.kind] ?? 0) + 1;
          if (!recorded.has('projectile')) { recordFixture('projectile'); save(); }
        }
        if (!recorded.has('reloading') && simulation.state.party.slots.some(slot => slot.exists && slot.slot <= 3 && slot.weapon && slot.weapon.reloadTime > 0)) {
          recordFixture('reloading'); save();
        }
        if (frame % 137 === 136) save();
      }
      assert.notEqual(simulation.state.phase, 'battle', `${current.id}: Day${day} exceeded 6000 frames`);
      if (simulation.state.phase === 'defeat') { if (activeClass()) activity.castleDefeats++; recordFixture('defeat'); break; }
      assert.equal(simulation.state.phase, 'victory'); victories++;
      wonDays[day] = (wonDays[day] ?? 0) + 1;
      if (activeClass()) activity.victories++;
    }
    if (simulation.state.phase === 'victory') {
      for (let reward = 0; simulation.state.postbattle !== 'result'; reward++) {
        assert.ok(reward < 30, 'Rewards did not settle');
        const state = simulation.state;
        if (state.postbattle === 'skill') {
          const choice = state.skillChoices[(current.seed + day + reward) % state.skillChoices.length];
          assert.equal(act('chooseSkill', [choice], sim => sim.chooseSkill(choice)), true);
        } else {
          const offer = state.lootOffers.findIndex(isOccupiedItem), slot = state.inventory.findIndex(item => !isOccupiedItem(item));
          if (offer >= 0 && slot >= 0) assert.equal(act('collectLoot', [offer, slot], sim => sim.collectLoot(offer, slot)), true);
          else assert.equal(act('finishLoot', [], sim => sim.finishLoot()), true);
        }
        totalRewards++; save();
      }
      if (activeClass()) { activity.wages += simulation.state.result.wages; activity.wageSettlements++; recordFixture('result'); }
      assert.equal(act('enterTown', [], sim => sim.enterTown()), true); save();
    }
    assert.equal(simulation.state.phase, 'town');
    if (!firstTown && current.kind === 'natural' && day === 1) {
      firstTown = { save: clone(simulation.toSave()), scenario: current.id, seed: current.seed, operations: operations.length };
      writeFileSync(resolve(output, 'earned-first-town.json'), JSON.stringify(firstTown, null, 2) + '\n');
    }
    if (!activeClass()) {
      const candidate = simulation.state.party.slots[4].member;
      const outcome = act('requestRecruit', [], sim => sim.requestRecruit());
      if (outcome === 'previewed') {
        assert.ok(candidate); save();
        assert.equal(act('resolvePartyAction', [true], sim => sim.resolvePartyAction(true)), 'hired');
        hired.push({ day, classId: candidate.devType, cost: candidate.cost, name: candidate.name });
        if (current.kind === 'natural') naturalHired.add(candidate.devType);
        recordFixture('hired-town'); save();
      } else assert.ok(['not-enough-gold', 'no-candidate', 'house-full', 'party-full'].includes(String(outcome)));
    }
    if (day === 6) act('claimTitle', [], sim => sim.claimTitle());
    act('freeRepair', [], sim => sim.freeRepair()); save();
    if (day === 7) break;
    assert.equal(act('startNextDay', [], sim => sim.startNextDay()), true); totalRest++; rests++;
    recordFixture('battle-entry'); save();
  }
  save();
  const classId = hired[0]?.classId ?? activeClass();
  if (classId) {
    const aggregate = classes[classId][current.kind === 'natural' ? 'natural' : 'controlled'];
    for (const key of Object.keys(activity) as (keyof Activity)[]) {
      if (key === 'projectileKinds') for (const [kind, count] of Object.entries(activity.projectileKinds)) aggregate.projectileKinds[kind] = (aggregate.projectileKinds[kind] ?? 0) + count;
      else aggregate[key] += activity[key];
    }
  }
  writeFileSync(resolve(output, `${current.id}-replay.json`), JSON.stringify({ scenario: current, initial: initial ?? null, operations }, null, 2) + '\n');
  results.push({ ...current, hired, activity, finalDay: simulation.state.day, phase: simulation.state.phase, castleHp: simulation.state.castleHp,
    gold: simulation.state.gold, victories, checkpoints, rests, operationCount: operations.length });
  console.log(JSON.stringify({ scenario: current.id, classId, day: simulation.state.day, phase: simulation.state.phase, shots: activity.shots, hits: activity.hits, kills: activity.kills, projectiles: activity.projectiles, wages: activity.wages }));
}

const started = performance.now();
try {
  for (let index = 0; index < seedCount; index++) {
    const seed = index === 0 ? 42 : Math.imul(index, 0x9e3779b1) >>> 0;
    run({ id: `natural-${index}`, seed, kind: 'natural' });
  }
  assert.ok(firstTown, 'No natural scenario earned a first town');
  for (let classId = 1; classId <= 9; classId++) if (!naturalHired.has(classId)) {
    const value = clone(firstTown.save), prefix = [0.5, 0.5, 0.5, (classId - 0.5) / 9];
    // Только пропущенный класс кандидата подменяется исходным генератором; деньги, HP, RNG и предметы героя не меняются.
    const recruit = generateEarlyTownRecruit(() => prefix.shift() ?? 0.5, 1);
    assert.equal(recruit.devType, classId); assert.ok(value.town?.preparation === 'ready');
    value.town.recruit = clone(recruit); installCandidate(value.party, recruit);
    assert.ok(value.gold >= recruit.cost, 'Earned first town cannot afford controlled candidate');
    run({ id: `controlled-class-${classId}`, seed: firstTown.seed, kind: 'controlled-start', classId,
      origin: `${firstTown.scenario} at operation${firstTown.operations}; candidate generation prefix [0.5,0.5,0.5,${(classId - 0.5) / 9}], remaining draws0.5; campaign RNG unchanged` }, value);
  }
  assert.ok(Object.values(classes).every(row => row.natural.battles + row.controlled.battles > 0), 'One or more classes never entered battle');
  const report = { status: 'passed', seedCount, sourceHashes, geometrySha256, scenarios: results.length, frames: totalFrames, checkpoints: totalCheckpoints, restTransitions: totalRest,
    rewardActions: totalRewards, reachedDays, wonDays, naturallyHiredClasses: [...naturalHired].sort(), classes,
    elapsedMs: Math.round(performance.now() - started),
    collision: 'Production ordinary-enemy filled contours; boss uses the same rectangular fallback as soak.ts',
    policy: 'Aimed Sheriff plus autonomous companion; generated equipment and skills retained; collect available loot; source skill choice indexed by seed/day; hire when affordable; Free Repair and Day6 title before Rest; no grants, invincibility, private battle completion or forced kills',
    limits: ['Port full-state/event replay and finite-state checks, not independent original parity or browser validation', 'Class coverage records actual hire/battle/activity; class presence does not imply that every behavior occurred', 'Controlled starts replace only the candidate generated at an actually earned first town, with provenance recorded separately', 'Deaths count castle defeats; companions have no separate HP/death model in the source combat actor'], snapshots, results };
  writeFileSync(resolve(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  writeFileSync(resolve(browserOutput, 'party-soak-fixtures.json'), JSON.stringify({ status: 'passed', report: '../party-soak/report.json', snapshots }, null, 2) + '\n');
  console.log(JSON.stringify({ ...report, classes: undefined, snapshots: undefined, results: undefined }, null, 2));
} catch (error) {
  writeFileSync(resolve(output, 'failure.json'), JSON.stringify({ scenario, sourceHashes, geometrySha256, checkpoint, operationsSinceCheckpoint: sinceCheckpoint,
    completedResults: results, error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error) }, null, 2) + '\n');
  throw error;
}
