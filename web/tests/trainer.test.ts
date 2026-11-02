import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation, type EnemyState } from '../src/simulation.ts';
import { castleTrainerMultiplier, castleUpgradeCost, castleUpkeep } from '../src/castle-upgrades.ts';
import { generateEarlyTownRecruit } from '../src/recruits.ts';
import { installCandidate } from '../src/party.ts';
import { ItemFactory } from '../src/items.ts';
import { asLegacyV21Save } from './legacy-save-support.ts';

interface Boundary {
  finishDay(): void;
  spawnEnemy(kind: 'rat'): void;
  damageEnemy(enemy: EnemyState, raw: number, critical: boolean, slot: number | null, x: number, y: number, actorSlot?: number): void;
  random(): number;
}
const boundary = (sim: Simulation) => sim as unknown as Boundary;
const saved = (sim: Simulation) => JSON.parse(JSON.stringify(sim.toSave()));
function rewards(sim: Simulation): void {
  while (sim.state.postbattle !== 'result') {
    if (sim.state.postbattle === 'skill') sim.chooseSkill(sim.state.skillChoices[0]);
    else assert.equal(sim.finishLoot(), true);
  }
}
function town(): Simulation {
  const sim = new Simulation(42); boundary(sim).finishDay(); rewards(sim); assert.equal(sim.enterTown(), true);
  // Контролируемая граница и капитал проверяют покупку, а не обычную доступность Trainer13.
  sim.state.gold = 1000000;
  return sim;
}
function buy(sim: Simulation, level: number): void {
  while (sim.state.trainerLevel < level) assert.equal(sim.buyCastleUpgrade('trainer'), 'purchased');
}
function candidate(sim: Simulation, classId: number): void {
  const prefix = [0.5, 0.5, 0.5, (classId - 0.5) / 9];
  const recruit = generateEarlyTownRecruit(() => prefix.shift() ?? 0.5, 1);
  assert.equal(recruit.devType, classId);
  installCandidate(sim.state.party, recruit);
}
function battle(trainer = 1, classId = 2): Simulation {
  const sim = town(); buy(sim, trainer); candidate(sim, classId);
  assert.equal(sim.requestRecruit(), 'previewed'); assert.equal(sim.resolvePartyAction(true), 'hired');
  assert.equal(sim.startNextDay(), true);
  while (sim.state.newWave) sim.tick();
  sim.state.spawnTimer = 1000;
  return sim;
}
function restore(sim: Simulation): Simulation {
  const checkpoint = saved(sim), untouched = structuredClone(checkpoint), resumed = Simulation.fromSave(checkpoint);
  assert.deepEqual(resumed.state, checkpoint); assert.deepEqual(checkpoint, untouched); return resumed;
}
function enemy(sim: Simulation, experience: number): EnemyState {
  boundary(sim).spawnEnemy('rat');
  const target = sim.state.enemies.at(-1)!;
  // Изолированные значения EXP проверяют исходный порядок int, не параметры обычного Rat.
  target.exp = experience; target.x = 200; target.y = 240;
  return target;
}
function kill(sim: Simulation, target: EnemyState, actorSlot = 0, critical = false): void {
  boundary(sim).damageEnemy(target, 10000, critical, 0, target.x, target.y, actorSlot);
}

test('Trainer costs follow the original unbounded sequence and never change upkeep, AP, prepared state or existing XP', () => {
  const sim = town(); sim.state.town!.ap = 0; sim.state.gold = 249;
  const beforeFailure = saved(sim); assert.equal(sim.buyCastleUpgrade('trainer'), 'not-enough-gold'); assert.deepEqual(saved(sim), beforeFailure);
  assert.equal(castleTrainerMultiplier(sim.state), 1);
  for (const [level, cost] of [250, 430, 970, 1870].entries()) {
    sim.state.gold = cost; const before = saved(sim), upkeep = castleUpkeep(sim.state);
    assert.equal(castleUpgradeCost('trainer', sim.state), cost); assert.equal(sim.buyCastleUpgrade('trainer'), 'purchased');
    assert.deepEqual(saved(sim), { ...before, gold: 0, trainerLevel: level + 1 });
    assert.equal(castleUpkeep(sim.state), upkeep); restore(sim);
  }
  sim.state.gold = 1000000; buy(sim, 12);
  assert.equal(castleUpgradeCost('trainer', sim.state), 26170);
  assert.equal(sim.buyCastleUpgrade('trainer'), 'purchased'); assert.equal(sim.state.trainerLevel, 13); restore(sim);
});

test('Trainer honors battle and pending town, party and loot confirmation guards without mutation', () => {
  const sim = new Simulation(42), before = saved(sim);
  assert.equal(sim.buyCastleUpgrade('trainer'), 'unavailable'); assert.deepEqual(saved(sim), before);
  for (const kind of ['upgrade', 'hire', 'loot'] as const) {
    const current = town();
    if (kind === 'upgrade') assert.equal(current.beginWeaponUpgrade(0), 'previewed');
    else if (kind === 'hire') assert.equal(current.requestRecruit(), 'previewed');
    else {
      assert.equal(current.startNextDay(), true); boundary(current).finishDay();
      current.state.lootOffers[0] = new ItemFactory(() => 0.5).generate(8);
      assert.equal(current.beginLootModMount({ area: 'offers', index: 0 }, { area: 'inventory', index: 0 }), 'previewed');
    }
    const checkpoint = saved(current); assert.equal(current.buyCastleUpgrade('trainer'), 'unavailable'); assert.deepEqual(saved(current), checkpoint);
  }
});

test('kill XP applies Trainer after companion catch-up, level-gap and Noble integer stages, leaving weapon XP and enemy EXP unchanged', () => {
  const cases = [
    { actor: 0, classId: 2, level: 1, exp: 15, beforeTrainer: 15, gained: 16, weapon: 1 },
    { actor: 1, classId: 2, level: 2, exp: 13, beforeTrainer: 19, gained: 20, weapon: 1 },
    { actor: 1, classId: 2, level: 1, exp: 13, beforeTrainer: 39, gained: 41, weapon: 2 },
    { actor: 1, classId: 8, level: 6, exp: 111, beforeTrainer: 47, gained: 50, weapon: 1 },
  ];
  for (const probe of cases) for (const critical of [false, true]) {
    const sim = battle(1, probe.classId), actor = sim.actor(probe.actor)!;
    actor.level = probe.level; actor.exp = 0;
    actor.traits[probe.actor ? sim.state.party.slots[0].member!.devType : 6] = probe.level;
    const target = enemy(sim, probe.exp), low = restore(sim); low.state.trainerLevel = 0;
    const weapons = [...actor.weaponExp], cache = structuredClone(sim.state.partySkills);
    kill(sim, target, probe.actor, critical); kill(low, low.state.enemies.at(-1)!, probe.actor, critical);
    assert.equal(actor.exp, probe.gained); assert.equal(low.actor(probe.actor)!.exp, probe.beforeTrainer);
    assert.equal(target.exp, probe.beforeTrainer); assert.equal(low.state.enemies.at(-1)!.exp, probe.beforeTrainer);
    assert.equal(actor.weaponExp.reduce((n, amount, i) => n + amount - weapons[i], 0), probe.weapon);
    assert.deepEqual(actor.weaponExp, low.actor(probe.actor)!.weaponExp);
    assert.equal(sim.state.kills, low.state.kills); assert.equal(sim.state.rng, low.state.rng);
    assert.deepEqual(sim.state.partySkills, cache); restore(sim);
  }
});

test('Trainer crosses hero and companion level thresholds with the two growth draws before drops, and resumes exactly', () => {
  for (const slot of [0, 1]) {
    let sim = battle(1), actor = sim.actor(slot)!;
    if (slot) { actor.level = 2; actor.traits[2] = 2; }
    actor.exp = slot ? 980 : 984;
    const target = enemy(sim, slot ? 13 : 15);
    sim.state.rng = 42; sim = restore(sim); actor = sim.actor(slot)!;
    const low = restore(sim); low.state.trainerLevel = 0;
    const resumed = restore(sim), previousLevel = actor.level, previousSP = actor.skillPoints;
    const aim = actor.traits[900], team = actor.traits[901], cache = structuredClone(sim.state.partySkills);
    const draws: number[] = [], original = boundary(sim).random.bind(sim);
    boundary(sim).random = () => { const value = original(); draws.push(value); return value; };
    for (const current of [sim, resumed, low]) kill(current, current.state.enemies.at(-1)!, slot);
    assert.equal(actor.level, previousLevel + 1); assert.equal(actor.skillPoints, previousSP + 1); assert.equal(actor.exp, 0);
    assert.equal(low.actor(slot)!.level, previousLevel); assert.equal(low.actor(slot)!.exp, 999);
    assert.deepEqual(actor.weaponExp, low.actor(slot)!.weaponExp);
    const potentials = slot ? sim.state.party.slots[0].member! : sim.state.hero;
    assert.equal(actor.traits[900], aim + Number(draws[0] < potentials.potentialAim));
    assert.equal(actor.traits[901], team + Number(draws[1] < potentials.potentialTeam));
    assert.equal(draws.length, 5);
    assert.deepEqual(sim.state, resumed.state); assert.deepEqual(sim.events, resumed.events);
    assert.deepEqual(sim.state.partySkills, cache); restore(sim);
  }
});

test('the fixed daily 250 XP and its growth RNG remain independent of Trainer for hero and active companions', () => {
  const sim = battle(10); sim.state.player.exp = 750; sim.state.party.slots[0].member!.exp = 750;
  candidate(sim, 8); const candidateBefore = structuredClone(sim.state.party.slots[4]);
  const low = restore(sim); low.state.trainerLevel = 0;
  boundary(sim).finishDay(); boundary(low).finishDay();
  assert.equal(sim.state.player.exp, 0); assert.equal(sim.state.party.slots[0].member!.exp, 0);
  assert.deepEqual(sim.state.party.slots[4], candidateBefore);
  assert.deepEqual(saved(sim), { ...saved(low), trainerLevel: 10 });
  assert.equal(sim.state.result.upkeep, low.state.result.upkeep); restore(sim);
});

test('v21 migration adds Trainer0 without changing Looter, capacity or pending loot; v22 rejects invalid levels', () => {
  const sim = town();
  for (const kind of ['looter', 'storage', 'house', 'wall', 'repairman', 'sandbag'] as const) assert.equal(sim.buyCastleUpgrade(kind), 'purchased');
  assert.equal(sim.requestRecruit(), 'previewed'); assert.equal(sim.resolvePartyAction(true), 'hired');
  assert.equal(sim.startNextDay(), true); boundary(sim).finishDay();
  sim.state.lootOffers[0] = new ItemFactory(() => 0.5).generate(8);
  assert.equal(sim.beginLootModMount({ area: 'offers', index: 0 }, { area: 'inventory', index: 0 }), 'previewed');
  const legacy = asLegacyV21Save(sim.toSave()), untouched = structuredClone(legacy), expected = { ...legacy, version: 23, trainerLevel: 0 };
  assert.deepEqual(Simulation.fromSave(legacy).toSave(), expected); assert.deepEqual(legacy, untouched);
  assert.deepEqual(Simulation.fromSave({ ...legacy, trainerLevel: 10 }).toSave(), expected);
  for (const invalidLevel of [undefined, null, -1, 0.5, '1', Infinity, NaN, 1e200]) {
    const invalid = { ...saved(sim), trainerLevel: invalidLevel }, before = structuredClone(invalid);
    assert.throws(() => Simulation.fromSave(invalid)); assert.deepEqual(invalid, before);
  }
});
