import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { Simulation, type ReadyTown } from '../src/simulation.ts';
import { HERO_CLASSES, type HeroClass } from '../src/hero-classes.ts';
import { MEDALS } from '../src/medals.ts';
import { SAVE_VERSION } from '../src/save-version.ts';

function rewards(sim: Simulation): void {
  while (['loot', 'boss-loot'].includes(sim.state.postbattle)) assert.ok(sim.finishLoot());
  while (sim.state.postbattle === 'skill') assert.ok(sim.chooseSkill(sim.state.skillChoices[0]));
}
function town(classId: HeroClass = 'sheriff'): Simulation {
  const sim = new Simulation(42, { heroClass: classId }); sim['finishDay'](); rewards(sim); sim.enterTown();
  sim.state.gold = 10000; sim.state.town!.ap = 14; return sim;
}
const restore = (sim: Simulation) => Simulation.fromSave(JSON.parse(JSON.stringify(sim.toSave())));

test('Museum robbery pays original skill-scaled amounts, costs two AP and diminishes within the day', () => {
  const sim = town('rogue'); sim.state.player.traits[122] = 2; sim['refreshPartySkills']();
  const rng = sim.state.rng, draw = restore(sim)['random'](), gold = sim.state.gold, total = sim.state.totalMoney;
  const raw = (6 + draw * 110) * 1.14;
  assert.equal(sim.robMuseumVisitors().outcome, 'done');
  assert.equal(sim.state.gold - gold, Math.trunc(raw)); assert.equal(sim.state.totalMoney - total, Math.trunc(raw));
  assert.equal(sim.state.town!.ap, 12); assert.equal(sim.state.economy.robberies, 1);
  assert.equal(sim.state.economy.visitorsRobbed, Math.trunc(raw / 10) + 1);
  sim.state.rng = rng; const before = sim.state.gold;
  sim.robMuseumVisitors(); assert.equal(sim.state.gold - before, Math.trunc(raw / 2));
  assert.equal((sim.state.town as ReadyTown).flags.robbed, 2);
  assert.deepEqual(restore(sim).toSave(), sim.toSave());
});

test('the twentieth robbery grants Robber; its 25% bonus begins on the next payout', () => {
  const sim = town(); sim.state.economy.robberies = 19;
  const draw = restore(sim)['random'](), before = sim.state.gold;
  sim.robMuseumVisitors(); assert.equal(sim.state.gold - before, Math.trunc(6 + draw * 110));
  assert.ok(sim.state.earnedMedals.includes(84));
  const copy = restore(sim), nextDraw = restore(sim)['random'](), gold = sim.state.gold;
  assert.deepEqual(sim.robMuseumVisitors(), copy.robMuseumVisitors());
  assert.equal(sim.state.gold - gold, Math.trunc((6 + nextDraw * 110) / 2 * 1.25));
  assert.deepEqual(copy.toSave(), sim.toSave());
});

test('robbery refuses insufficient AP and pending actions without changing RNG, counters, money or other state', () => {
  const sim = town(); sim.state.town!.ap = 1; let before = sim.toSave();
  assert.equal(sim.robMuseumVisitors().outcome, 'not-enough-ap'); assert.deepEqual(sim.toSave(), before);
  sim.state.town!.ap = 14; sim.requestMissionHire(); before = sim.toSave();
  assert.equal(sim.robMuseumVisitors().outcome, 'unavailable'); assert.deepEqual(sim.toSave(), before);
  const battle = new Simulation(42), start = battle.toSave();
  assert.equal(battle.robMuseumVisitors().outcome, 'unavailable'); assert.deepEqual(battle.toSave(), start);
});

test('robbery counters persist across days while the diminishing daily divisor resets', () => {
  const sim = town(); sim.robMuseumVisitors(); sim.robMuseumVisitors();
  const total = sim.state.economy.robberies, victims = sim.state.economy.visitorsRobbed;
  assert.ok(sim.startNextDay()); assert.deepEqual(restore(sim).toSave(), sim.toSave());
  sim['finishDay'](); rewards(sim); sim.enterTown();
  assert.equal((sim.state.town as ReadyTown).flags.robbed, 0);
  assert.equal(sim.state.economy.robberies, total); assert.equal(sim.state.economy.visitorsRobbed, victims);
  assert.equal(sim.robMuseumVisitors().outcome, 'done'); assert.equal(sim.state.economy.robberies, total + 1);
});

test('Prayer, Provoker and Boomer medals award at their action thresholds and grant next-town AP chances once', () => {
  const sim = town(); Object.assign(sim.state.economy, { prayers: 14, taunts: 9, parties: 9, villa: 1 });
  sim.state.player.traits[125] = 1; sim['refreshPartySkills']();
  for (const action of ['pray', 'taunt', 'party'] as const) assert.equal(sim.performTownActivity(action).outcome, 'done');
  for (const id of [80, 81, 82]) assert.ok(sim.state.earnedMedals.includes(id));
  assert.ok(sim.startNextDay()); sim['finishDay'](); rewards(sim);
  const ap = sim.state.town!.ap, draws: number[] = [], random = sim['random'].bind(sim);
  sim['random'] = () => { const n = random(); draws.push(n); return n; };
  assert.ok(sim.enterTown()); assert.equal(sim.state.town!.ap, ap + draws.slice(-3).filter(n => n > 0.6).length);
  assert.equal((sim.state.town as any).bonusAp, undefined);
  const before = sim.toSave(); assert.equal(sim.enterTown(), false); assert.deepEqual(sim.toSave(), before);
  assert.deepEqual(restore(sim).toSave(), sim.toSave());
});

test('class medals identify the actual hero, and legacy wrong-class Sheriff awards migrate without rerolls', () => {
  for (const [classId, medal] of [['hunter', 65], ['rogue', 66], ['sheriff', 67], ['militia', 68]] as const) {
    const sim = new Simulation(42, { heroClass: classId });
    sim.state.player.level = 10; sim.state.player.traits[HERO_CLASSES[classId].id] = 10;
    sim['finishDay'](); rewards(sim); sim.enterTown(); assert.ok(sim.state.earnedMedals.includes(medal));
    assert.equal(sim.state.earnedMedals.filter(id => id >= 65 && id <= 68).length, 1);
    const legacy: any = sim.toSave(); legacy.version = 29;
    if (medal !== 67) legacy.earnedMedals = legacy.earnedMedals.map((id: number) => id === medal ? 67 : id);
    delete legacy.economy.robberies; delete legacy.economy.visitorsRobbed;
    const copy = Simulation.fromSave(legacy); assert.equal(copy.state.rng, legacy.rng);
    assert.ok(copy.state.earnedMedals.includes(medal)); assert.equal(copy.state.economy.robberies, 0);
  }
});

test('Museum badge is checked on visit, bad imports are rejected, and the muted-browser fixture is reproducible', () => {
  const sim = town(); assert.equal(sim.visitMuseum(), false);
  sim.state.earnedMedals = Object.keys(MEDALS).map(Number).filter(id => ![62, 86].includes(id)).slice(0, 25);
  assert.equal(sim.visitMuseum(), true); assert.ok(sim.state.earnedMedals.includes(86));
  const before = sim.toSave(); assert.equal(sim.visitMuseum(), false); assert.deepEqual(sim.toSave(), before);
  for (const mutate of [
    (s: any) => { s.town.flags.robbed = -1; }, (s: any) => { s.economy.robberies = 0.5; },
    (s: any) => { s.economy.visitorsRobbed = NaN; }, (s: any) => { s.earnedMedals.push(500); },
  ]) { const bad = town().toSave(); mutate(bad); assert.throws(() => Simulation.fromSave(bad)); }
  mkdirSync('../.build/browser-qa', { recursive: true });
  const fixture = town('rogue'); fixture.state.player.traits[122] = 2; fixture['refreshPartySkills']();
  fixture.state.economy.robberies = 19;
  writeFileSync('../.build/browser-qa/museum-town.json', JSON.stringify({ format: 'elona-shooter-browser', version: SAVE_VERSION, appearance: 0, simulation: fixture.toSave() }));
});
