import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { Simulation, type SimulationState } from '../src/simulation.ts';
import { generateLowLevelMission, generateLowLevelWaves, type GameMode } from '../src/missions.ts';
import { prepareEarlyTown } from '../src/town-preparation.ts';
import { createProfile, mergeProfile, mergeProfiles, validProfile } from '../src/profile.ts';
import { canSaveAdventure, clearSave, readSave, storeSave, readProfile, storeProfile, readMute, storeMute } from '../src/storage.ts';
import { SAVE_VERSION } from '../src/save-version.ts';

function battle(day: number, mode: GameMode): Simulation {
  const sim = new Simulation(42, { mode });
  let seed = 321;
  const random = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296; };
  const mission = generateLowLevelMission(day - 1, Math.max(1, day - 1), random, { casual: mode === 'casual' });
  sim.state.day = day;
  sim.state.activeMission = Object.fromEntries(Object.keys(sim.state.activeMission).map(key => [key, mission[key as keyof typeof mission]])) as SimulationState['activeMission'];
  sim.state.waves = generateLowLevelWaves(mission, day, random).waves;
  sim.state.waveIndex = mission.wave; sim.state.bossWave = mission.bossWave; sim.state.loot = [...mission.loot];
  if (day > 1) sim.state.previousTown = { ...prepareEarlyTown(random, day - 1, { casual: mode === 'casual' }), mission, ap: 4, preparation: 'ready' };
  return sim;
}
function town(sim: Simulation): Simulation {
  sim['finishDay']();
  while (['loot', 'boss-loot'].includes(sim.state.postbattle)) sim.finishLoot();
  while (sim.state.postbattle === 'skill') sim.chooseSkill(sim.state.skillChoices[0]);
  assert.ok(sim.enterTown());
  return sim;
}

test('Casual uses source encounter power, actual kill XP and lower settlement tax without changing damage rules', () => {
  assert.equal(new Simulation(42, { mode: 'casual' }).state.activeMission.powerOrg, 500);
  for (const [mode, xp, tax] of [['normal', 29, 850], ['casual', 39, 200], ['hardcore', 29, 850]] as const) {
    const sim = battle(30, mode);
    assert.equal(sim.state.activeMission.powerOrg, mode === 'casual' ? 3110 : 4280);
    sim['spawnEnemy']('sheep'); const sheep = sim.state.enemies[0];
    assert.equal(sheep.hp, 42); assert.equal(sheep.attack, 1);
    sim['damageEnemy'](sheep, 1000, false, 0, sheep.x, sheep.y);
    assert.equal(sim.state.player.exp, xp);
    town(sim);
    assert.equal(sim.state.result.tax, tax);
    assert.equal(sim.state.town!.mission.powerOrg, mode === 'casual' ? 3200 : 4400);
    assert.deepEqual(Simulation.fromSave(sim.toSave()).toSave(), sim.toSave());
  }
});

test('opening mode changes preserve the generated hero and RNG, and normal mode preserves the old save shape', () => {
  const sim = new Simulation(42, { deferOpeningWaves: true });
  const rng = sim.state.rng, hero = structuredClone(sim.state.hero), gear = structuredClone(sim.state.inventory);
  assert.ok(sim.setOpeningMode('casual')); assert.equal(sim.state.activeMission.powerOrg, 500);
  assert.ok(sim.setOpeningMode('hardcore')); assert.equal(sim.state.activeMission.powerOrg, 800);
  assert.ok(sim.setOpeningMode('normal')); assert.equal(sim.state.mode, undefined);
  assert.equal(sim.state.rng, rng); assert.deepEqual(sim.state.hero, hero); assert.deepEqual(sim.state.inventory, gear);
  sim.startOpeningBattle();
  assert.equal(sim.setOpeningMode('casual'), false);
  const old = new Simulation(42).toSave(); old.version = 33;
  assert.deepEqual(Simulation.fromSave(old).toSave(), { ...old, version: SAVE_VERSION });
});

test('Casual combat, rewards, town and Rest remain connected with exact mid-battle replay', () => {
  let sim = new Simulation(42, { mode: 'casual' });
  sim.state.castleHp = sim.state.castleMaxHp = 10000;
  Object.assign(sim.state.inventory[0]!, { attack: 10000, baseAccuracy: 10000, ammoMax: 1000, ammo: 1000, shootRate: 1 });
  for (let day = 1; day <= 2; day++) {
    for (let frame = 0; frame < 15000 && sim.state.phase === 'battle'; frame++) {
      const target = sim.state.enemies.filter(enemy => enemy.hp > 0 && !enemy.removed).sort((a, b) => b.x - a.x)[0];
      const input = { aimX: target?.x ?? 250, aimY: target?.y ?? 230, firePressed: Boolean(target), reload: sim.weapon!.ammo === 0 };
      const replay = frame === 600 ? Simulation.fromSave(JSON.parse(JSON.stringify(sim.toSave()))) : null;
      sim.tick(input);
      if (replay) { replay.tick(input); assert.deepEqual(replay.toSave(), sim.toSave()); assert.deepEqual(replay.events, sim.events); }
    }
    assert.equal(sim.state.phase, 'victory');
    while (['loot', 'boss-loot'].includes(sim.state.postbattle)) sim.finishLoot();
    while (sim.state.postbattle === 'skill') sim.chooseSkill(sim.state.skillChoices[0]);
    assert.ok(sim.enterTown()); sim = Simulation.fromSave(sim.toSave());
    assert.ok(sim.startNextDay()); sim = Simulation.fromSave(sim.toSave());
    assert.equal(sim.state.day, day + 1); assert.equal(sim.state.mode, 'casual');
  }
});

test('Hardcore medals use original day20/40/80 boundaries and feed the existing global starting bonuses', () => {
  for (const [day, medal] of [[19, 95], [79, 97]]) {
    const sim = town(battle(day, 'hardcore'));
    assert.equal(sim.state.earnedMedals.includes(medal), false);
    assert.ok(sim.startNextDay()); assert.ok(sim.state.earnedMedals.includes(medal));
    assert.equal(sim.state.mode, 'hardcore');
    assert.deepEqual(Simulation.fromSave(sim.toSave()).toSave(), sim.toSave());
  }
  const clear = town(battle(40, 'hardcore'));
  assert.ok(clear.state.earnedMedals.includes(96));
  assert.equal(town(battle(40, 'normal')).state.earnedMedals.includes(96), false);
  const next = new Simulation(42, { medals: clear.state.earnedMedals });
  assert.equal(next.state.inventory[2]!.id, 27);
  mkdirSync('../.build/browser-qa', { recursive: true });
  const checkpoint = town(battle(19, 'hardcore'));
  writeFileSync('../.build/browser-qa/hardcore-town19.json', JSON.stringify({ format: 'elona-shooter-browser', version: SAVE_VERSION, appearance: 0, simulation: checkpoint.toSave() }));
});

test('Hardcore allows only town persistence and clearing its save preserves medals and muted settings', () => {
  for (const phase of ['battle', 'victory', 'defeat', 'town']) {
    assert.equal(canSaveAdventure({ mode: 'hardcore', phase }), phase === 'town');
    assert.equal(canSaveAdventure({ mode: 'casual', phase }), true);
    assert.equal(canSaveAdventure({ phase }), true);
  }
  const prior = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) } });
  try {
    storeSave({ test: true }); storeProfile({ version: 1, medals: [40, 95], bestDay: 10, bestHardcoreDay: 20 }); storeMute(true);
    assert.ok(clearSave()); assert.equal(readSave().kind, 'empty');
    assert.deepEqual(readProfile().profile.medals, [40, 95]); assert.equal(readMute(), true);
  } finally { if (prior) Object.defineProperty(globalThis, 'localStorage', prior); else delete (globalThis as { localStorage?: unknown }).localStorage; }
});

test('global mode records merge independently, survive backups and reject invalid modes or record values', () => {
  let profile = mergeProfile(createProfile(), { day: 25, earnedMedals: [40] });
  profile = mergeProfile(profile, { day: 40, earnedMedals: [96], mode: 'hardcore' });
  profile = mergeProfile(profile, { day: 60, earnedMedals: [41], mode: 'casual' });
  assert.deepEqual([profile.bestDay, profile.bestHardcoreDay, profile.bestCasualDay], [25, 40, 60]);
  assert.equal(validProfile(profile), true);
  assert.deepEqual(mergeProfiles(createProfile(), profile), profile);
  assert.equal(validProfile({ ...profile, bestHardcoreDay: null }), false);
  assert.equal(validProfile({ ...profile, bestCasualDay: -1 }), false);
  const sim = new Simulation(42, { mode: 'casual' });
  for (const patch of [{ mode: 'easy' }, { mode: true }, { version: 33 }]) assert.throws(() => Simulation.fromSave({ ...sim.toSave(), ...patch }), /mode/);
});
