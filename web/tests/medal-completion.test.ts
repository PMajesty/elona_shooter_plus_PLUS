import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation, type SimulationState } from '../src/simulation.ts';
import { generateLowLevelMission, generateLowLevelWaves } from '../src/missions.ts';
import { createProfile, mergeProfile } from '../src/profile.ts';
import { companionWage } from '../src/party-progression.ts';
import { prepareEarlyTown } from '../src/town-preparation.ts';

function battle(day: number, hardcore = false): Simulation {
  const sim = new Simulation(42, { ...(hardcore ? { mode: 'hardcore' } : {}) });
  let seed = 321;
  const random = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296; };
  const mission = generateLowLevelMission(day - 1, Math.max(1, day - 1), random);
  sim.state.day = day;
  sim.state.activeMission = Object.fromEntries(Object.keys(sim.state.activeMission).map(key => [key, mission[key as keyof typeof mission]])) as SimulationState['activeMission'];
  sim.state.waves = generateLowLevelWaves(mission, day, random).waves;
  sim.state.waveIndex = mission.wave; sim.state.bossWave = mission.bossWave; sim.state.loot = [...mission.loot];
  if (day > 1) sim.state.previousTown = { ...prepareEarlyTown(random, day - 1), mission, ap: 4, preparation: 'ready' };
  return sim;
}
function town(day = 1, hardcore = false): Simulation {
  const sim = battle(day, hardcore); sim.state.noDamage = false; sim['finishDay']();
  while (['loot', 'boss-loot'].includes(sim.state.postbattle)) sim.finishLoot();
  while (sim.state.postbattle === 'skill') sim.chooseSkill(sim.state.skillChoices[0]);
  assert.ok(sim.enterTown()); return sim;
}

test('all source survival milestones award at battle start, including Day50/80/150, without RNG or immediate money', () => {
  for (const [day, medal] of [[10, 41], [20, 42], [35, 43], [50, 44], [80, 45], [150, 46]] as const) {
    const before = battle(day - 1); before['initializePartyBattle'](); assert.equal(before.state.earnedMedals.includes(medal), false);
    const sim = battle(day), rng = sim.state.rng, gold = sim.state.gold;
    sim['initializePartyBattle'](); assert.ok(sim.state.earnedMedals.includes(medal));
    assert.equal(sim.state.rng, rng); assert.equal(sim.state.gold, gold);
    sim['initializePartyBattle'](); assert.equal(sim.state.earnedMedals.filter(id => id === medal).length, 1);
    assert.deepEqual(Simulation.fromSave(sim.toSave()).toSave(), sim.toSave());
  }
  const blocked = battle(150); blocked.state.carryOver = true; blocked['initializePartyBattle']();
  assert.deepEqual(blocked.state.earnedMedals, [40]);
});

test('late survival awards reach the shared collection and add their original cumulative New Game gold', () => {
  const sim = battle(150); sim['initializePartyBattle']();
  const profile = mergeProfile(createProfile(), sim.state);
  const next = new Simulation(42, { medals: profile.medals });
  assert.equal(next.state.gold, 200 + 100 + 200 + 300 + 500 + 750 + 1000);
});

test('ordinary Rest into Day150 awards every elapsed milestone and preserves deterministic JSON replay', () => {
  const sim = town(149), gold = sim.state.gold;
  assert.ok(sim.startNextDay()); assert.equal(sim.state.day, 150); assert.equal(sim.state.gold, gold);
  for (const id of [41, 42, 43, 44, 45, 46]) assert.ok(sim.state.earnedMedals.includes(id));
  const restored = Simulation.fromSave(JSON.parse(JSON.stringify(sim.toSave())));
  for (let frame = 0; frame < 120; frame++) { sim.tick(); restored.tick(); assert.deepEqual(restored.events, sim.events); }
  assert.deepEqual(restored.toSave(), sim.toSave());
});

test('Impossible Badge is checked on a Museum visit at HC Day100 or from a previous HC record', () => {
  const early = town(99, true); assert.equal(early.visitMuseum(), false);
  const normal = town(100); assert.equal(normal.visitMuseum(), false);
  const hc = town(100, true), rng = hc.state.rng;
  assert.ok(hc.visitMuseum()); assert.ok(hc.state.earnedMedals.includes(87)); assert.equal(hc.state.rng, rng);
  const past = town(); assert.equal(past.visitMuseum(99), false); assert.ok(past.visitMuseum(100));
  assert.ok(past.state.earnedMedals.includes(87)); assert.equal(past.visitMuseum(100), false);
  const profile = mergeProfile(createProfile(), hc.state), next = new Simulation(42, { medals: profile.medals });
  assert.equal(next.state.economy.fame, 20);
  assert.deepEqual(Simulation.fromSave(hc.toSave()).toSave(), hc.toSave());
});

test('Museum badge checks preserve Carry Over allowance and reject invalid records, pending actions and battle use', () => {
  const sim = town(); sim.state.carryOver = true; assert.ok(sim.visitMuseum(100));
  for (const day of [-1, 0.5, NaN, 1000001]) {
    const fresh = town(), before = fresh.toSave(); assert.equal(fresh.visitMuseum(day), false); assert.deepEqual(fresh.toSave(), before);
  }
  const fighting = battle(100, true); assert.equal(fighting.visitMuseum(), false);
  const pending = town(); pending.requestMissionHire(); const before = pending.toSave();
  assert.equal(pending.visitMuseum(100), false); assert.deepEqual(pending.toSave(), before);
});

test('the source Kongregate link award persists, stays idempotent and discounts the next quoted and settled wages', () => {
  const sim = town(), rng = sim.state.rng;
  assert.ok(sim.visitKongregate()); assert.equal(sim.visitKongregate(), false);
  assert.equal(sim.state.rng, rng); assert.ok(sim.state.earnedMedals.includes(91));
  assert.deepEqual(Simulation.fromSave(sim.toSave()).toSave(), sim.toSave());
  for (const medal of [91, 92]) {
    const run = new Simulation(42, { heroClass: 'hunter', medals: [40, medal] });
    const member = run.state.party.slots[0].member!;
    member.level = member.traits[member.devType] = 50;
    const loaded = Simulation.fromSave(run.toSave()), girl = loaded.state.party.slots[0].member!;
    const expected = companionWage(girl, loaded.state.partySkills.effects[127], medal === 91);
    assert.ok(companionWage(girl, 0, true) < companionWage(girl, 0, false));
    assert.equal(loaded.wageFor(girl), expected);
    loaded['finishDay']();
    assert.equal(loaded.state.result.wages, expected);
  }
  assert.equal(new Simulation(42).visitKongregate(), false);
});
