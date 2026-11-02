import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { Simulation, type SimulationState } from '../src/simulation.ts';
import { generateLowLevelMission, generateLowLevelWaves } from '../src/missions.ts';
import { prepareEarlyTown } from '../src/town-preparation.ts';
import { TITLES, type Title } from '../src/titles.ts';
import { SAVE_VERSION } from '../src/save-version.ts';

const promotions: [number, Title, string, number][] = [
  [6, 1, 'Honorary Citizen', 100], [11, 2, 'Private', 200], [16, 3, 'Knight Apprentice', 400],
  [26, 4, 'Knight', 700], [41, 5, 'Baron', 1000], [61, 6, 'Duke', 1500],
  [81, 7, 'Prince', 2000], [101, 8, 'King', 3000],
];
function settle(sim: Simulation): void {
  sim['finishDay']();
  while (['loot', 'boss-loot'].includes(sim.state.postbattle)) sim.finishLoot();
  while (sim.state.postbattle === 'skill') sim.chooseSkill(sim.state.skillChoices[0]);
}
function town(day: number, title: Title): Simulation {
  const sim = new Simulation(42); let seed = 321;
  const random = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296; };
  const mission = generateLowLevelMission(day - 1, Math.max(1, day - 1), random);
  sim.state.day = day; sim.state.title = title;
  sim.state.activeMission = Object.fromEntries(Object.keys(sim.state.activeMission).map(key => [key, mission[key as keyof typeof mission]])) as SimulationState['activeMission'];
  sim.state.waves = generateLowLevelWaves(mission, day, random).waves;
  sim.state.waveIndex = mission.wave; sim.state.bossWave = mission.bossWave; sim.state.loot = [...mission.loot];
  sim.state.previousTown = { ...prepareEarlyTown(random, day - 1), mission, ap: 4, preparation: 'ready' };
  settle(sim); assert.ok(sim.enterTown());
  return Simulation.fromSave(sim.toSave());
}

test('all eight source promotions unlock on their calendar day, cost four AP and pay only at the next settlement', () => {
  for (const [day, title, name, salary] of promotions) {
    const previous = (title - 1) as Title;
    const early = town(day - 1, previous), earlySave = early.toSave();
    assert.equal(early.claimTitle(), 'unavailable'); assert.deepEqual(early.toSave(), earlySave);
    const sim = town(day, previous), before = sim.toSave();
    assert.equal(sim.claimTitle(), 'claimed'); assert.equal(sim.state.title, title);
    assert.equal(TITLES[sim.state.title].name, name); assert.equal(sim.state.town!.ap, before.town!.ap - 4);
    assert.equal(sim.state.gold, before.gold); assert.equal(sim.state.totalMoney, before.totalMoney);
    assert.equal(sim.state.rng, before.rng); assert.deepEqual(sim.state.result, before.result);
    const restored = Simulation.fromSave(JSON.parse(JSON.stringify(sim.toSave())));
    for (const game of [sim, restored]) {
      assert.ok(game.startNextDay()); assert.equal(game.claimTitle(), 'unavailable');
      settle(game); assert.equal(game.state.result.salary, salary);
    }
    assert.deepEqual(restored.toSave(), sim.toSave());
    const paid = sim.toSave(); assert.equal(sim.finishLoot(), false); assert.deepEqual(sim.toSave(), paid);
    assert.ok(sim.enterTown()); assert.equal(sim.state.gold, paid.gold);
  }
});

test('delayed promotions remain sequential, AP refusal is atomic and King is the final rank', () => {
  const sim = town(101, 0); sim.state.town!.ap = 3;
  const before = sim.toSave(); assert.equal(sim.claimTitle(), 'not-enough-ap'); assert.deepEqual(sim.toSave(), before);
  sim.state.town!.ap = 32;
  for (const [, title] of promotions) { assert.equal(sim.claimTitle(), 'claimed'); assert.equal(sim.state.title, title); }
  assert.equal(sim.state.town!.ap, 0); sim.state.town!.ap = 4;
  const king = sim.toSave(); assert.equal(sim.claimTitle(), 'unavailable'); assert.deepEqual(sim.toSave(), king);
  assert.deepEqual(Simulation.fromSave(king).toSave(), king);
});

test('save validation rejects malformed and premature ranks, retaining earlier numeric title saves without migration', () => {
  const sim = town(101, 7), valid = sim.toSave();
  for (const title of [-1, 9, 1.5, '7', null]) assert.throws(() => Simulation.fromSave({ ...valid, title }), /Invalid title/);
  for (const [day, title] of promotions) {
    const early = town(day - 1, (title - 1) as Title).toSave();
    assert.throws(() => Simulation.fromSave({ ...early, title }), /Invalid title/);
  }
  const old = town(11, 1).toSave(); old.version = 35;
  assert.deepEqual(Simulation.fromSave(old).toSave(), { ...old, version: SAVE_VERSION });
  const earned = town(11, 1); earned.claimTitle(); const checkpoint = earned.toSave();
  earned.startNextDay(); earned.state.castleHp = 0; earned.tick(); earned.tick();
  assert.ok(earned.carryOver(checkpoint)); assert.equal(earned.state.title, 2);
  assert.deepEqual(Simulation.fromSave(earned.toSave()).toSave(), earned.toSave());
});

test('export a controlled late-game town for the ordinary Claim title browser flow', () => {
  const sim = town(101, 7);
  mkdirSync('../.build/browser-qa', { recursive: true });
  writeFileSync('../.build/browser-qa/title-town.json', JSON.stringify({ format: 'elona-shooter-browser', version: SAVE_VERSION,
    appearance: 0, simulation: sim.toSave(), profile: { version: 1, medals: sim.state.earnedMedals, bestDay: 101 } }));
});
