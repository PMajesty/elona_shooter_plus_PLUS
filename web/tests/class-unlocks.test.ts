import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { Simulation } from '../src/simulation.ts';
import { HERO_CLASSES, heroClassUnlocked, type HeroClass } from '../src/hero-classes.ts';
import { createProfile, mergeProfile, validProfile } from '../src/profile.ts';
import { readProfile, storeProfile } from '../src/storage.ts';
import { SAVE_VERSION } from '../src/save-version.ts';

const restore = (sim: Simulation) => Simulation.fromSave(JSON.parse(JSON.stringify(sim.toSave())));
function target(classId: HeroClass): Simulation {
  const sim = new Simulation(42, { heroClass: classId });
  sim.state.newWave = false; sim.state.waveIndex = sim.state.waves.length - 1; sim.state.spawnTimer = 900;
  sim['spawnEnemy']('sheep'); Object.assign(sim.state.enemies[0], { x: 400, y: 240, hp: 10000, maxHp: 10000, speed: 0 });
  sim.state.inventory[0]!.baseAccuracy = 1000000; return sim;
}

test('the four class awards unlock the corresponding source classes and the browser collection survives new games', () => {
  const first = createProfile(); assert.ok(validProfile(first));
  for (const classId of ['rogue', 'hunter', 'sheriff', 'militia'] as const) assert.ok(heroClassUnlocked(classId, []));
  for (const [classId, medal] of [['sniper', 68], ['ranger', 65], ['duelist', 66], ['noble', 67]] as const) {
    assert.equal(heroClassUnlocked(classId, first.medals), false);
    const profile = mergeProfile(first, { earnedMedals: [40, medal], day: 12 });
    assert.ok(heroClassUnlocked(classId, profile.medals)); assert.equal(profile.bestDay, 12);
    const sim = new Simulation(42, { heroClass: classId, medals: profile.medals });
    assert.equal(sim.state.player.classId, classId); assert.ok(sim.state.earnedMedals.includes(medal));
    assert.deepEqual(restore(sim).toSave(), sim.toSave());
  }
  const memory = new Map<string, string>();
  const previous = globalThis.localStorage;
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => memory.set(key, value) } });
  try {
    const collection = mergeProfile(first, { earnedMedals: [40, 65, 66, 67, 68], day: 20 });
    assert.ok(storeProfile(collection)); assert.deepEqual(readProfile().profile, collection);
    assert.equal(mergeProfile(collection, { earnedMedals: [40], day: 1 }).bestDay, 20);
    memory.set([...memory.keys()][0], '{broken'); assert.ok(readProfile().warning);
    assert.deepEqual(readProfile().profile, createProfile());
  } finally {
    if (previous === undefined) delete (globalThis as any).localStorage;
    else Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: previous });
  }
});

test('carried medals apply original starting money, skills, fame, storage, castle absorption and Gravity Gun once', () => {
  const medals = [40, 41, 42, 43, 44, 45, 46, 60, 61, 62, 63, 70, 71, 72, 86, 87, 92, 95, 96, 97];
  const sim = new Simulation(42, { heroClass: 'rogue', medals, deferOpeningWaves: true });
  assert.equal(sim.state.gold, 200); assert.equal(sim.state.inventory.length, 6);
  assert.ok(sim.startOpeningBattle());
  assert.equal(sim.state.gold, 3050); assert.equal(sim.state.resultBefore, 3050);
  assert.equal(sim.state.player.traits[108], 6); assert.equal(sim.state.player.traits[111], 2);
  assert.equal(sim.state.player.traits[101], 2); assert.equal(sim.state.inventory.length, 7);
  assert.equal(sim.state.economy.fame, 20); assert.equal(sim.state.inventory[2]!.id, 27);
  assert.equal(sim.state.activeMission.absorbFix, 0.04);
  const before = sim.toSave(); assert.equal(sim.startOpeningBattle(), false); assert.deepEqual(sim.toSave(), before);
  assert.deepEqual(restore(sim).toSave(), sim.toSave());
});

test('manual Sniper idle adrenaline increases actual damage, resets on misses and persists through save/replay', () => {
  const sim = target('sniper');
  for (let frame = 0; frame < 30; frame++) sim.tick();
  assert.ok(sim.state.player.classState!.idleCount > 0.98);
  const normal = restore(sim), charged = restore(sim); normal.state.player.classState!.idleCount = 0; charged.state.player.classState!.idleCount = 30;
  normal.fireAt(400, 240); charged.fireAt(400, 240);
  assert.ok(charged.state.enemies[0].hp < normal.state.enemies[0].hp);
  const miss = restore(sim); miss.fireAt(10, 50); assert.equal(miss.state.player.classState!.idleCount, 0);
  const copy = restore(charged);
  for (let frame = 0; frame < 45; frame++) { copy.tick(); charged.tick(); assert.deepEqual(copy.events, charged.events); }
  assert.deepEqual(copy.toSave(), charged.toSave());
});

test('manual Duelist hits add damage adrenaline and decay at the original hero rate', () => {
  const sim = target('duelist'); sim.fireAt(400, 240);
  const gained = sim.state.player.classState!.frenzy; assert.ok(gained > 0);
  sim.tick(); assert.ok(Math.abs(sim.state.player.classState!.frenzy - (gained - 0.12)) < 1e-9);
  sim.state.player.shootTimer = 0; sim.state.player.classState!.burst = 7;
  assert.equal(sim.requestReload(), true); assert.equal(sim.state.player.classState!.burst, 0);
  const plain = target('duelist'), charged = restore(plain); charged.state.player.classState!.frenzy = 30;
  plain.fireAt(400, 240); charged.fireAt(400, 240); assert.ok(charged.state.enemies[0].hp < plain.state.enemies[0].hp);
  assert.deepEqual(restore(charged).toSave(), charged.toSave());
});

test('manual Ranger kills trigger a whole-party rampage and Noble earns the original extra kill experience', () => {
  const ranger = target('ranger'); ranger.state.enemies[0].exp = 1000;
  ranger['damageEnemy'](ranger.state.enemies[0], 100000, false, null, 400, 240);
  assert.ok(ranger.state.player.rampageTicks > 0); assert.equal(ranger.state.player.classState!.frenzy, 0);
  assert.ok(ranger.events.some(event => event.type === 'rampage'));
  assert.deepEqual(restore(ranger).toSave(), ranger.toSave());
  const noble = target('noble'), ordinary = restore(noble); ordinary.state.player.traits[8] = 0;
  for (const sim of [noble, ordinary]) sim['damageEnemy'](sim.state.enemies[0], 100000, false, null, 400, 240);
  assert.equal(noble.state.player.exp, Math.trunc(ordinary.state.player.exp * 1.4));
});

test('new class meters reject malformed saves and old class saves migrate without state or RNG changes', () => {
  const old: any = new Simulation(42).toSave(); old.version = 30;
  assert.deepEqual(Simulation.fromSave(old).toSave(), { ...old, version: SAVE_VERSION });
  for (const mutate of [
    (s: any) => { delete s.player.classState; }, (s: any) => { s.player.classState.frenzy = -1; },
    (s: any) => { s.player.classState.idleCount = Infinity; }, (s: any) => { s.player.classState.burst = 0.5; },
    (s: any) => { s.version = 30; },
  ]) { const bad = target('sniper').toSave(); mutate(bad); assert.throws(() => Simulation.fromSave(bad)); }
  assert.equal(validProfile({ version: 1, medals: [40, 500], bestDay: 2 }), false);
  assert.equal(validProfile({ version: 1, medals: [40, 40], bestDay: 2 }), false);
  assert.equal(validProfile({ version: 1, medals: [40], bestDay: NaN }), false);
  mkdirSync('../.build/browser-qa', { recursive: true });
  const sim = new Simulation(42);
  const profile = mergeProfile(createProfile(), { earnedMedals: [40, 65, 66, 67, 68], day: 20 });
  writeFileSync('../.build/browser-qa/unlocked-classes.json', JSON.stringify({ format: 'elona-shooter-browser', version: SAVE_VERSION, appearance: 0, profile, simulation: sim.toSave() }));
  writeFileSync('../.build/browser-qa/invalid-profile.json', JSON.stringify({ format: 'elona-shooter-browser', version: SAVE_VERSION, appearance: 0, profile: { ...profile, medals: [500] }, simulation: sim.toSave() }));
  assert.equal(Object.keys(HERO_CLASSES).length, 8);
});
