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
import { castleUpgradeCost, castleUpkeep, castleLootMultiplier } from '../src/castle-upgrades.ts';

const sandbagMode = process.argv[3] === 'sandbag';
const storageMode = process.argv[3] === 'storage';
const looterMode = process.argv[3] === 'looter';
const repairMode = sandbagMode || process.argv[3] === 'repair';
const castleMode = looterMode || storageMode || repairMode || process.argv[3] === 'castle';
const fixturePrefix = looterMode ? 'looter-party' : storageMode ? 'storage-party' : sandbagMode ? 'sandbag-party' : repairMode ? 'repair-party' : castleMode ? 'castle-party' : 'party';
const output = fileURLToPath(new URL(`../../.build/${fixturePrefix}-soak`, import.meta.url));
const browserOutput = fileURLToPath(new URL('../../.build/browser-qa', import.meta.url));
mkdirSync(output, { recursive: true }); mkdirSync(browserOutput, { recursive: true });
const seedCount = Number(process.argv[2] ?? 32);
assert.ok(Number.isInteger(seedCount) && seedCount >= 1 && seedCount <= 32, 'Use 1–32 natural seeds.');
const sourceHashes = Object.fromEntries(['simulation.ts', 'items.ts', 'party.ts', 'party-ai.ts', 'party-progression.ts', 'party-save.ts', 'projectiles.ts', 'collision.ts', 'town-preparation.ts', 'town-save.ts', 'castle-upgrades.ts']
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
type Scenario = { id: string; seed: number; kind: 'natural' | 'controlled-start' | 'capital-start'; classId?: number; origin?: string };
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
const actorActivity: Record<number, Activity> = { 1: emptyActivity(), 2: emptyActivity(), 3: emptyActivity() };
const partyBattleCounts: Record<number, number> = {};
const expandedNaturalScenarios = new Set<string>();
let housePurchases = 0, wallPurchases = 0, maximumCompanions = 0;
let fixWallPurchases = 0, repairmanPurchases = 0;
let sandbagPurchases = 0, ambiguousSandbagFrames = 0;
let storagePurchases = 0, maximumInventorySlots = 6, expandedLootTransfers = 0;
let looterPurchases = 0;
const looterObservations: object[] = [];
const storageRestObservations: { scenario: string; day: number; capacity: number; occupiedExtraSlots: number }[] = [];
const sandbagObservations: { scenario: string; tick: number; day: number; level: number; damageWith: number; damageWithout: number; avoided: number; rng: number }[] = [];
const repairObservations: { scenario: string; tick: number; day: number; level: number; waveBefore: number; hpBefore: number; damage: number; hpAfter: number; restoredHp: number }[] = [];

function finite(value: unknown, path = 'state'): void {
  if (typeof value === 'number') assert.ok(Number.isFinite(value), `${path} is not finite`);
  else if (Array.isArray(value)) value.forEach((item, index) => finite(item, `${path}[${index}]`));
  else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) finite(item, `${path}.${key}`);
}

// Герой целится обычным вводом; союзник получает только сохранённый исходный приказ и действует сам.
function inputFor(simulation: Simulation, exposeCrow = false): Input {
  const state = simulation.state, weapon = simulation.weapon;
  const target = state.enemies.filter(enemy => enemy.hp > 0 && enemy.x > 20 && !(exposeCrow && enemy.kind === 'crow')).sort((a, b) => b.x - a.x)[0];
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
  const activeCount = () => simulation.state.party.slots.filter(slot => slot.slot <= 3 && slot.exists).length;
  const recordFixture = (reason: string, state = simulation.toSave()) => {
    const classId = activeClass() ?? (storageMode || looterMode ? 0 : undefined);
    if (classId === undefined || recorded.has(reason)) return;
    recorded.add(reason);
    const version = state.version;
    const file = `${fixturePrefix}-${current.id}-${reason}-v${version}.json`, value = { format: 'elona-shooter-browser', version, appearance: 0, simulation: state };
    const encoded = JSON.stringify(value, null, 2) + '\n';
    writeFileSync(resolve(browserOutput, file), encoded);
    snapshots.push({ scenario: current.id, classId, reason, file, sha256: hash(encoded), operation: operations.length - (state.tick < simulation.state.tick ? 1 : 0), day: state.day, tick: state.tick });
  };
  const observeLooter = (stage: 'ordinary' | 'boss', before: Save, input?: Input) => {
    // Меняется только уровень на одной границе награды; контроль не заменяет исходный oracle.
    const control = Simulation.fromSave({ ...before, looterLevel: 0 }, options);
    if (stage === 'ordinary') control.tick(input!); else assert.equal(control.finishLoot(), true);
    assert.equal(control.state.postbattle, simulation.state.postbattle);
    const full = simulation.state.lootOffers, without = control.state.lootOffers;
    const changed = JSON.stringify(full) !== JSON.stringify(without);
    const summary = (items: Save['lootOffers']) => items.map(item => isOccupiedItem(item)
      ? { id: item.id, name: item.name, value: item.value, level: item.lv, mods: item.mod } : null);
    const baseBudget = before.day * (stage === 'ordinary' ? 40 : 60) + (stage === 'ordinary' ? 250 : 500);
    if (stage === 'ordinary') assert.equal(control.state.result.upkeep + before.looterLevel * 5, simulation.state.result.upkeep);
    looterObservations.push({ scenario: current.id, day: before.day, stage, level: before.looterLevel, changed,
      baseBudget, targetBudget: Math.trunc(baseBudget * castleLootMultiplier(before)), minimumBudget: 500,
      beforeRng: before.rng, withRng: simulation.state.rng, withoutRng: control.state.rng,
      withItems: summary(full), withoutItems: summary(without), withSha256: hash(JSON.stringify(full)), withoutSha256: hash(JSON.stringify(without)) });
    recordFixture(`looter-${stage}-day${before.day}`); save();
  };
  const countEvent = (event: SimulationEvent) => {
    if (!event.actorSlot) return;
    for (const counter of [activity, ...(castleMode ? [actorActivity[event.actorSlot]] : [])]) {
      assert.ok(counter, 'Unexpected companion actor slot');
      if (event.type === 'shot') counter.shots++;
      if (event.type === 'hit') { counter.hits++; counter.damage += event.amount ?? 0; }
      if (event.type === 'kill') counter.kills++;
      if (event.type === 'reload') counter.reloads++;
      if (event.type === 'reloaded') counter.reloadCompletions++;
      if (event.type === 'bow-draw') counter.bowDraws++;
      if (event.type === 'level-up') counter.levelUps++;
    }
  };
  save();
  while (simulation.state.day <= 7) {
    const day = simulation.state.day;
    if (simulation.state.phase === 'battle') {
      reachedDays[day] = (reachedDays[day] ?? 0) + 1;
      partyBattleCounts[activeCount()] = (partyBattleCounts[activeCount()] ?? 0) + 1;
      if (activeClass()) activity.battles++;
      for (let frame = 0; frame < 6000 && simulation.state.phase === 'battle'; frame++) {
        const input = inputFor(simulation, sandbagMode && current.kind === 'capital-start'
          && !sandbagObservations.some(row => row.scenario === current.id && row.avoided > 0));
        const beforeSandbag = sandbagMode && simulation.state.sandbagLevel > 0 ? clone(simulation.toSave()) : undefined;
        const beforeRepair = repairMode && simulation.state.repairmanLevel > 0 && simulation.state.newWave && simulation.state.waveIndex > 0
          && simulation.state.timerRemainder + 20 >= 30 ? clone(simulation.toSave()) : undefined;
        const beforeLooter = looterMode && simulation.state.looterLevel > 0 && simulation.state.newWave && simulation.state.waveIndex === 0
          && simulation.state.timerRemainder + 20 >= 30 ? clone(simulation.toSave()) : undefined;
        if (beforeLooter) recordFixture(`before-looter-ordinary-day${beforeLooter.day}`);
        act('tick', [input], sim => sim.tick(input)); totalFrames++;
        if (beforeLooter && simulation.state.phase === 'victory') observeLooter('ordinary', beforeLooter, input);
        if (beforeSandbag) {
          const hits = simulation.events.filter(event => event.type === 'castle-hit');
          if (hits.length) {
            // Контроль меняет только уровень мешков на один кадр; это проверка интеграции порта, не исходный oracle.
            const control = Simulation.fromSave({ ...beforeSandbag, sandbagLevel: 0 }, options);
            control.tick(input);
            const controlHits = control.events.filter(event => event.type === 'castle-hit');
            if (hits.length === 1 && controlHits.length === 1 && control.state.rng === simulation.state.rng
              && simulation.state.castleHp > 0 && control.state.castleHp > 0) {
              const damageWith = hits[0].amount!, damageWithout = controlHits[0].amount!;
              assert.ok(damageWith <= damageWithout, 'Sandbags increased an otherwise identical castle hit');
              sandbagObservations.push({ scenario: current.id, tick: simulation.state.tick, day, level: beforeSandbag.sandbagLevel,
                damageWith, damageWithout, avoided: damageWithout - damageWith, rng: simulation.state.rng });
              if (damageWith < damageWithout && !beforeSandbag.enemies.some(enemy => enemy.kind === 'boss')) {
                recordFixture('before-sandbag-hit', beforeSandbag); recordFixture('after-sandbag-hit'); save();
              }
            } else ambiguousSandbagFrames++;
          }
        }
        if (beforeRepair && simulation.events.some(event => event.type === 'wave')
          && !simulation.events.some(event => event.type === 'repair')
          && !beforeRepair.inventory.some(item => isOccupiedItem(item) && item.leech)
          && !beforeRepair.party.slots.some(slot => slot.exists && slot.weapon?.leech)) {
          const damage = simulation.events.filter(event => event.type === 'castle-hit').reduce((sum, event) => sum + (event.amount ?? 0), 0);
          const expected = Math.min(beforeRepair.castleMaxHp, beforeRepair.castleHp - damage + beforeRepair.repairmanLevel * 2);
          assert.equal(simulation.state.castleHp, expected, 'Observed wave repair differs from source amount/cap');
          const restoredHp = expected - (beforeRepair.castleHp - damage);
          repairObservations.push({ scenario: current.id, tick: simulation.state.tick, day, level: beforeRepair.repairmanLevel,
            waveBefore: beforeRepair.waveIndex, hpBefore: beforeRepair.castleHp, damage, hpAfter: expected, restoredHp });
          if (restoredHp > 0) { recordFixture('before-wave-repair', beforeRepair); recordFixture('after-wave-repair'); save(); }
        }
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
          if (offer >= 0 && slot >= 0) {
            if (storageMode && slot >= 6) recordFixture(`before-loot-slot${slot + 1}`);
            assert.equal(act('collectLoot', [offer, slot], sim => sim.collectLoot(offer, slot)), true);
            if (storageMode && slot >= 6) { expandedLootTransfers++; recordFixture(`loot-slot${slot + 1}`); }
          }
          else {
            const beforeLooter = looterMode && state.looterLevel > 0 && state.postbattle === 'loot' && state.bossKilled > 0 ? clone(simulation.toSave()) : undefined;
            if (beforeLooter) recordFixture(`before-looter-boss-day${day}`);
            assert.equal(act('finishLoot', [], sim => sim.finishLoot()), true);
            if (beforeLooter) observeLooter('boss', beforeLooter);
          }
        }
        totalRewards++; save();
      }
      if (castleMode) assert.equal(simulation.state.result.upkeep, castleUpkeep(simulation.state));
      if (sandbagMode && simulation.state.sandbagLevel > 0) recordFixture('sandbag-result');
      if (storageMode && simulation.state.inventory.length > 6) recordFixture('storage-result');
      if (looterMode && simulation.state.looterLevel > 0) recordFixture('looter-result');
      if (activeClass()) { activity.wages += simulation.state.result.wages; activity.wageSettlements++; recordFixture('result'); if (castleMode) recordFixture(`result-party${activeCount()}`); }
      assert.equal(act('enterTown', [], sim => sim.enterTown()), true); save();
    }
    assert.equal(simulation.state.phase, 'town');
    if (!firstTown && current.kind === 'natural' && day === 1) {
      firstTown = { save: clone(simulation.toSave()), scenario: current.id, seed: current.seed, operations: operations.length };
      writeFileSync(resolve(output, 'earned-first-town.json'), JSON.stringify(firstTown, null, 2) + '\n');
    }
    if (castleMode) {
      const state = simulation.state;
      const candidateCost = state.party.slots[4].member?.cost ?? 0;
      while (looterMode && state.looterLevel < Math.min(4, day)
        && state.gold >= castleUpgradeCost('looter', state) + (activeCount() === 0 ? candidateCost : 0)) {
        recordFixture(`before-looter${state.looterLevel + 1}`);
        const before = clone(state), cost = castleUpgradeCost('looter', state);
        assert.equal(act('buyCastleUpgrade', ['looter'], sim => sim.buyCastleUpgrade('looter')), 'purchased');
        looterPurchases++;
        assert.deepEqual(state, { ...before, gold: before.gold - cost, looterLevel: before.looterLevel + 1 }, 'Looter repriced existing state');
        recordFixture(`looter${state.looterLevel}`); save();
      }
      while (storageMode && state.inventory.length < (current.kind === 'capital-start' ? 16 : Math.min(9, 6 + day))
        && state.gold >= castleUpgradeCost('storage', state) + (activeCount() === 0 ? candidateCost : 0)) {
        recordFixture(`before-storage${state.inventory.length + 1}`);
        const previousResult = clone(state.result), previousItems = clone(state.inventory);
        assert.equal(act('buyCastleUpgrade', ['storage'], sim => sim.buyCastleUpgrade('storage')), 'purchased');
        storagePurchases++; maximumInventorySlots = Math.max(maximumInventorySlots, state.inventory.length);
        assert.deepEqual(state.result, previousResult, 'Storage purchase repriced an already paid result');
        assert.deepEqual(state.inventory, [...previousItems, null], 'Storage changed existing items or granted an item');
        recordFixture(`storage${state.inventory.length}`); save();
      }
      while (sandbagMode && state.sandbagLevel < (current.kind === 'capital-start' ? 4 : day >= 4 ? 2 : 1)
        && state.gold >= castleUpgradeCost('sandbag', state) + (activeCount() === 0 ? candidateCost : 0)) {
        recordFixture(`before-sandbag${state.sandbagLevel + 1}`);
        const previousResult = clone(state.result);
        assert.equal(act('buyCastleUpgrade', ['sandbag'], sim => sim.buyCastleUpgrade('sandbag')), 'purchased');
        sandbagPurchases++;
        assert.deepEqual(state.result, previousResult, 'Sandbag purchase repriced an already paid result');
        recordFixture(`sandbag${state.sandbagLevel}`); save();
      }
      if (repairMode && state.repairmanLevel < (day >= 4 ? 2 : 1)
        && state.gold >= castleUpgradeCost('repairman', state) + (activeCount() === 0 ? candidateCost : 0)) {
        recordFixture(`before-repairman${state.repairmanLevel + 1}`);
        const previousResult = clone(state.result);
        assert.equal(act('buyCastleUpgrade', ['repairman'], sim => sim.buyCastleUpgrade('repairman')), 'purchased');
        repairmanPurchases++;
        assert.deepEqual(state.result, previousResult, 'Repairman purchase repriced an already paid result');
        recordFixture(`repairman${state.repairmanLevel}`); save();
      }
      if (activeCount() === state.party.capacity && state.party.capacity < 3 && state.party.slots[4].exists
        && state.gold >= castleUpgradeCost('house', state) + candidateCost) {
        recordFixture(`before-house${state.party.capacity + 1}`);
        const previousResult = clone(state.result);
        assert.equal(act('buyCastleUpgrade', ['house'], sim => sim.buyCastleUpgrade('house')), 'purchased');
        housePurchases++;
        assert.deepEqual(state.result, previousResult, 'House purchase repriced an already paid result');
        recordFixture(`house${state.party.capacity}`); save();
      }
      if (day >= 2 && state.wallLevel === 1 && state.gold >= castleUpgradeCost('wall', state) + candidateCost) {
        recordFixture('before-wall');
        const previousResult = clone(state.result);
        assert.equal(act('buyCastleUpgrade', ['wall'], sim => sim.buyCastleUpgrade('wall')), 'purchased');
        wallPurchases++;
        assert.deepEqual(state.result, previousResult, 'Wall purchase repriced an already paid result');
        recordFixture('wall'); save();
      }
    }
    if (castleMode ? activeCount() < simulation.state.party.capacity : !activeClass()) {
      const candidate = simulation.state.party.slots[4].member;
      const outcome = act('requestRecruit', [], sim => sim.requestRecruit());
      if (outcome === 'previewed') {
        assert.ok(candidate); save();
        assert.equal(act('resolvePartyAction', [true], sim => sim.resolvePartyAction(true)), 'hired');
        hired.push({ day, classId: candidate.devType, cost: candidate.cost, name: candidate.name });
        if (current.kind === 'natural') naturalHired.add(candidate.devType);
        maximumCompanions = Math.max(maximumCompanions, activeCount());
        if (castleMode && current.kind === 'natural' && activeCount() >= 2) expandedNaturalScenarios.add(current.id);
        recordFixture('hired-town'); if (castleMode) recordFixture(`hired${activeCount()}`); save();
      } else assert.ok(['not-enough-gold', 'no-candidate', 'house-full', 'party-full'].includes(String(outcome)));
    }
    if (sandbagMode && current.kind === 'capital-start') {
      for (const slot of simulation.state.party.slots.filter(slot => slot.exists && slot.slot <= 3)) {
        assert.equal(act('setCompanionOrder', [slot.slot, 5], sim => sim.setCompanionOrder(slot.slot, 5)), true);
        assert.equal(act('setCompanionPriorities', [slot.slot, { boss: false, wall: false }], sim => sim.setCompanionPriorities(slot.slot, { boss: false, wall: false })), true);
      }
      save();
    }
    if (day === 6) act('claimTitle', [], sim => sim.claimTitle());
    if (repairMode && simulation.state.castleHp < simulation.state.castleMaxHp && day % 2 === 0
      && simulation.state.gold >= castleUpgradeCost('fix-wall', simulation.state)) {
      recordFixture('before-fix-wall');
      assert.equal(act('buyCastleUpgrade', ['fix-wall'], sim => sim.buyCastleUpgrade('fix-wall')), 'purchased');
      fixWallPurchases++; recordFixture('fix-wall'); save();
    } else { act('freeRepair', [], sim => sim.freeRepair()); save(); }
    if (day === 7) break;
    const beforeRestInventory = storageMode ? clone(simulation.state.inventory) : undefined;
    if (storageMode && simulation.state.inventory.length > 6) recordFixture('before-storage-rest');
    assert.equal(act('startNextDay', [], sim => sim.startNextDay()), true); totalRest++; rests++;
    if (beforeRestInventory) {
      assert.equal(simulation.state.inventory.length, beforeRestInventory.length);
      for (let slot = 6; slot < beforeRestInventory.length; slot++) {
        const before = beforeRestInventory[slot], after = simulation.state.inventory[slot];
        assert.deepEqual(after, before ? { ...before, reloadTime: 0, ammo: before.type === 4 ? before.ammo : before.ammoMax } : null,
          'Rest failed to preserve or normalize an expanded inventory item');
      }
      storageRestObservations.push({ scenario: current.id, day: simulation.state.day, capacity: simulation.state.inventory.length,
        occupiedExtraSlots: simulation.state.inventory.slice(6).filter(isOccupiedItem).length });
      if (simulation.state.inventory.length > 6) recordFixture('storage-rest');
    }
    recordFixture('battle-entry'); if (castleMode) recordFixture(`battle-party${activeCount()}`); save();
  }
  save();
  const classId = hired[0]?.classId ?? activeClass();
  if (classId && !castleMode) {
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
  for (let classId = 1; !castleMode && classId <= 9; classId++) if (!naturalHired.has(classId)) {
    const value = clone(firstTown.save), prefix = [0.5, 0.5, 0.5, (classId - 0.5) / 9];
    // Только пропущенный класс кандидата подменяется исходным генератором; деньги, HP, RNG и предметы героя не меняются.
    const recruit = generateEarlyTownRecruit(() => prefix.shift() ?? 0.5, 1);
    assert.equal(recruit.devType, classId); assert.ok(value.town?.preparation === 'ready');
    value.town.recruit = clone(recruit); installCandidate(value.party, recruit);
    assert.ok(value.gold >= recruit.cost, 'Earned first town cannot afford controlled candidate');
    run({ id: `controlled-class-${classId}`, seed: firstTown.seed, kind: 'controlled-start', classId,
      origin: `${firstTown.scenario} at operation${firstTown.operations}; candidate generation prefix [0.5,0.5,0.5,${(classId - 0.5) / 9}], remaining draws0.5; campaign RNG unchanged` }, value);
  }
  if (castleMode && !looterMode) {
    const value = clone(firstTown.save);
    // Явный капитал — единственный контролируемый вход; кандидаты и бои затем идут обычным путём.
    const capital = storageMode ? 20000 : 12000;
    value.gold += capital;
    run({ id: storageMode ? 'capital-storage-capacity' : sandbagMode ? 'capital-sandbag-exposure' : 'capital-three-companions', seed: firstTown.seed, kind: 'capital-start',
      origin: `${firstTown.scenario} earned first town at operation${firstTown.operations}; add${capital}gold only; no grants to HP, traits, equipment, candidates or campaign RNG` }, value);
    if (!sandbagMode && !storageMode) {
      assert.ok((partyBattleCounts[2] ?? 0) > 0 && (partyBattleCounts[3] ?? 0) > 0, 'Expanded parties never entered battle');
      assert.ok(actorActivity[2].shots > 0 && actorActivity[3].shots > 0, 'Additional companion slots never fired');
    }
    if (!sandbagMode && !storageMode) assert.ok(expandedNaturalScenarios.size > 0, 'No natural campaign earned an expanded party');
  } else if (!castleMode) assert.ok(Object.values(classes).every(row => row.natural.battles + row.controlled.battles > 0), 'One or more classes never entered battle');
  if (repairMode) {
    assert.ok(fixWallPurchases > 0 && repairmanPurchases > 0, 'Campaigns did not exercise both repair purchases');
    assert.ok(repairObservations.some(row => row.scenario.startsWith('natural-') && row.restoredHp > 0), 'No natural campaign actually healed at a wave boundary');
  }
  if (sandbagMode) {
    assert.ok(sandbagPurchases > 0, 'Campaigns did not buy Sandbags');
    assert.ok(sandbagObservations.some(row => row.avoided > 0), 'No campaign had measured damage reduction');
  }
  if (storageMode) {
    assert.ok(storagePurchases > 0 && maximumInventorySlots === 16, 'Storage capacity was not purchased through its source cap');
    assert.ok(expandedLootTransfers > 0, 'No loot reached an expanded slot');
    assert.ok(storageRestObservations.some(row => row.occupiedExtraSlots > 0), 'No expanded item survived Rest');
  }
  if (looterMode) {
    assert.ok(looterPurchases > 0, 'Natural campaigns never bought Looter');
    assert.ok(looterObservations.some(row => (row as { changed: boolean }).changed), 'No generated reward differed at an observed boundary');
  }
  const report = { status: 'passed', seedCount, sourceHashes, geometrySha256, scenarios: results.length, frames: totalFrames, checkpoints: totalCheckpoints, restTransitions: totalRest,
    rewardActions: totalRewards, reachedDays, wonDays, naturallyHiredClasses: [...naturalHired].sort(), classes: castleMode ? undefined : classes,
    ...(storageMode ? { storagePurchases, maximumInventorySlots, expandedLootTransfers, storageRestObservations } : {}),
    ...(looterMode ? { looterPurchases, looterObservations } : {}),
    ...(sandbagMode ? { sandbagPurchases, sandbagObservations, ambiguousSandbagFrames,
      positiveDamageReductions: sandbagObservations.filter(row => row.avoided > 0).length,
      avoidedDamage: sandbagObservations.reduce((sum, row) => sum + row.avoided, 0) } : {}),
    ...(repairMode ? { fixWallPurchases, repairmanPurchases, repairObservations,
      positiveRepairObservations: repairObservations.filter(row => row.restoredHp > 0).length } : {}),
    ...(castleMode ? { housePurchases, wallPurchases, maximumCompanions, partyBattleCounts, expandedNaturalScenarios: [...expandedNaturalScenarios],
      actorActivity: Object.fromEntries(Object.entries(actorActivity).map(([slot, value]) => [slot, Object.fromEntries(
        ['shots', 'hits', 'damage', 'kills', 'reloads', 'reloadCompletions', 'bowDraws', 'levelUps'].map(key => [key, value[key as keyof Activity]]))])) } : {}),
    elapsedMs: Math.round(performance.now() - started),
    collision: 'Production ordinary-enemy filled contours; boss uses the same rectangular fallback as soak.ts',
    policy: looterMode ? 'Natural starts only; prioritize Looter toward level4 by town4 when affordable, reserve first hire cost, then existing House/Wall/hiring/repair policy. This target is a test purchase policy, not a game cap. No gold, item, HP or RNG grants, private completion or forced kills. Observe actual ordinary/boss generation boundaries; a one-boundary control changes only Looter to0. Generated item records and final random state may differ; no per-drop value increase is assumed. Purchase must preserve every existing item, prepared town and paid result.'
      : storageMode ? 'Aimed Sheriff and autonomous companions; buy capacity7/8/9 from town1/2/3 when affordable, reserve first hire cost, then existing House/Wall/hiring policy. Collect actual loot into first available slot including expanded backpack. Check every extra item across Rest and full-state/event replay. Natural starts have no grants; separate capital-start adds20000gold only at earned first town and buys all16slots through ordinary transactions. No granted items, forced kills or private battle completion.'
      : sandbagMode ? 'Aimed Sheriff and autonomous companions; prioritize Sandbag1, Sandbag2 from town4, then Repairman/House/Wall/hiring and paid/free repair policy. Reserve first hire cost. Natural runs have no grants. Separate capital-start grants12000gold only at earned first town, buys Sandbag4 normally, sets companions to armor-only/no priorities through normal town actions and avoids aiming at Crows until one positive reduction occurs. This input exposure addresses integer rounding that masks low-level Sandbags against small early-game hits. Measured damage pairs replay a single actual frame with only Sandbag level set to0; accept single-hit, same-final-RNG, surviving-wall pairs. This counterfactual is port integration evidence, separate from original damage reference.'
      : repairMode ? 'Aimed Sheriff and autonomous companions; prioritize Repairman1 when affordable (reserve first hire cost), Repairman2 from town4, then existing House/Wall/hiring policy. Pay Fix Wall on damaged even days when affordable; otherwise Free Repair. Separate capital-start grants12000gold only at an earned first town. No forced kills, HP grants or battle completion. Wave observations exclude leech weapons and item repair and account for same-frame castle-hit events.'
      : castleMode ? 'Aimed Sheriff plus autonomous permanent companions; buy House with enough gold for the next generated candidate, buy one Wall from town2 onward when affordable, then hire through ordinary confirmation; Free Repair and Day6 title before Rest; natural runs have no grants. Separate capital-start adds12000gold at an earned first town to exercise the three-slot party before the current Day7 boundary.'
      : 'Aimed Sheriff plus autonomous companion; generated equipment and skills retained; collect available loot; source skill choice indexed by seed/day; hire when affordable; Free Repair and Day6 title before Rest; no grants, invincibility, private battle completion or forced kills',
    limits: ['Port full-state/event replay and finite-state checks, not independent original parity or browser validation', 'Class coverage records actual hire/battle/activity; class presence does not imply that every behavior occurred',
      looterMode ? 'Counterfactual reward boundaries are port integration evidence; independent original generation traces establish source fidelity. Unchanged low-budget outcomes are retained, and higher budgets do not guarantee a more valuable individual drop.'
      : storageMode ? 'Capital capacity16 evidence grants20000gold only at earned first town; it does not establish natural full Storage affordability within seven days'
      : castleMode ? 'Natural scenarios and the one capital-start are separate: the latter grants12000gold only at an earned first town; it does not establish natural three-companion affordability within seven days'
        : 'Controlled starts replace only the candidate generated at an actually earned first town, with provenance recorded separately',
      'Deaths count castle defeats; companions have no separate HP/death model in the source combat actor'], snapshots, results };
  writeFileSync(resolve(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  writeFileSync(resolve(browserOutput, `${fixturePrefix}-soak-fixtures.json`), JSON.stringify({ status: 'passed', report: `../${fixturePrefix}-soak/report.json`, snapshots }, null, 2) + '\n');
  console.log(JSON.stringify({ ...report, classes: undefined, snapshots: undefined, results: undefined }, null, 2));
} catch (error) {
  writeFileSync(resolve(output, 'failure.json'), JSON.stringify({ scenario, sourceHashes, geometrySha256, checkpoint, operationsSinceCheckpoint: sinceCheckpoint,
    completedResults: results, sandbagObservations, ambiguousSandbagFrames, repairObservations, looterObservations,
    error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error) }, null, 2) + '\n');
  throw error;
}
