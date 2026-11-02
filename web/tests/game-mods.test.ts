import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation, type SimulationState } from '../src/simulation.ts';
import { GAME_MODS, validGameMods, type GameMods } from '../src/game-mods.ts';
import { generateLowLevelMission, generateLowLevelWaves } from '../src/missions.ts';
import { prepareEarlyTown } from '../src/town-preparation.ts';
import { ITEM_TYPE, isOccupiedItem } from '../src/items.ts';
import { SAVE_VERSION } from '../src/save-version.ts';
import { addStartingLittleGirl } from '../src/party.ts';

const seeded = (seed: number) => () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296; };
function battle(day: number, mods: GameMods): Simulation {
  const sim = new Simulation(42, { mods }), random = seeded(321);
  const mission = generateLowLevelMission(day - 1, Math.max(1, day - 1), random, { intense: mods.intense });
  sim.state.day = day;
  sim.state.activeMission = Object.fromEntries(Object.keys(sim.state.activeMission).map(key => [key, mission[key as keyof typeof mission]])) as SimulationState['activeMission'];
  sim.state.waves = generateLowLevelWaves(mission, day, random, mods).waves;
  sim.state.waveIndex = mission.wave; sim.state.bossWave = mission.bossWave; sim.state.loot = [...mission.loot];
  if (day > 1) sim.state.previousTown = { ...prepareEarlyTown(random, day - 1, { intense: mods.intense, community: mods.community }), mission, ap: 4, preparation: 'ready' };
  return sim;
}
function finish(sim: Simulation): void {
  while (['loot', 'boss-loot'].includes(sim.state.postbattle)) sim.finishLoot();
  while (sim.state.postbattle === 'skill') sim.chooseSkill(sim.state.skillChoices[0]);
}
function town(day: number, mods: GameMods): Simulation {
  const sim = battle(day, mods); sim['finishDay'](); finish(sim); assert.ok(sim.enterTown()); return sim;
}

test('Game MOD selection preserves the hero and RNG, composes with mode, resets cleanly and rejects malformed saves', () => {
  const sim = new Simulation(42, { deferOpeningWaves: true });
  const hero = structuredClone(sim.state.hero), inventory = structuredClone(sim.state.inventory), rng = sim.state.rng;
  assert.ok(sim.setOpeningMods({ intense: true, tight: true }));
  assert.equal(sim.state.activeMission.powerOrg, 1175);
  assert.ok(sim.setOpeningMode('casual')); assert.equal(sim.state.activeMission.powerOrg, 875);
  assert.deepEqual(sim.state.hero, hero); assert.deepEqual(sim.state.inventory, inventory); assert.equal(sim.state.rng, rng);
  assert.ok(sim.setOpeningMods({})); assert.equal(sim.state.mods, undefined); assert.equal(sim.state.activeMission.powerOrg, 500);
  sim.startOpeningBattle(); assert.equal(sim.setOpeningMods({ laptop: true }), false);
  const all = Object.fromEntries(Object.keys(GAME_MODS).map(key => [key, true])) as GameMods;
  assert.equal(validGameMods(all), true);
  const active = new Simulation(42, { mods: all });
  assert.deepEqual(Simulation.fromSave(active.toSave()).toSave(), active.toSave());
  for (const mods of [{ laptop: false }, { unknown: true }, [], 'intense']) assert.throws(() => Simulation.fromSave({ ...active.toSave(), mods }), /MODs/);
  assert.throws(() => Simulation.fromSave({ ...active.toSave(), version: 34 }), /MODs/);
  const old = new Simulation(42).toSave(); old.version = 34;
  assert.deepEqual(Simulation.fromSave(old).toSave(), { ...old, version: SAVE_VERSION });
});

test('Intense Start changes early source power and spawn delay and expires after town9 prepares Day10', () => {
  const intense = new Simulation(42, { mods: { intense: true } }), ordinary = new Simulation(42);
  assert.equal(intense.state.activeMission.powerOrg, 1175);
  assert.ok(intense.state.waves.reduce((sum, wave) => sum + wave.initialCount, 0) > ordinary.state.waves.reduce((sum, wave) => sum + wave.initialCount, 0));
  const mission = generateLowLevelMission(0, 1, seeded(1));
  const plain = generateLowLevelWaves(mission, 1, seeded(5)), fast = generateLowLevelWaves(mission, 1, seeded(5), { intense: true });
  assert.equal(plain.waves[0].delays[0] - fast.waves[0].delays[0], 20);
  assert.equal(generateLowLevelMission(9, 9, seeded(1), { intense: true }).powerOrg, 2055);
  assert.equal(generateLowLevelMission(10, 10, seeded(1), { intense: true }).powerOrg, 2000);
  for (const day of [2, 10, 11]) assert.deepEqual(Simulation.fromSave(battle(day, { intense: true }).toSave()).toSave(), battle(day, { intense: true }).toSave());
});

test('Skip hard waves suppresses both source batch branches while retaining random and air/ranged generation', () => {
  const mission = generateLowLevelMission(20, 20, seeded(1));
  const batchTwo = () => { const rolls = [0.5, 0.5, 0.5, 0.01]; return () => rolls.shift() ?? 0.5; };
  const plain = generateLowLevelWaves(mission, 21, batchTwo()).waves[0];
  const skipped = generateLowLevelWaves(mission, 21, batchTwo(), { skipHard: true }).waves[0];
  assert.equal(new Set(plain.enemies).size, 1); assert.ok(new Set(skipped.enemies).size > 1);
  const batchOne = () => { const rolls = [0.5, 0.01]; return () => rolls.shift() ?? 0.5; };
  assert.notDeepEqual(generateLowLevelWaves(mission, 21, batchOne()).waves[0], generateLowLevelWaves(mission, 21, batchOne(), { skipHard: true }).waves[0]);
  const air = () => { const rolls = [0.01]; return () => rolls.shift() ?? 0.5; };
  assert.deepEqual(generateLowLevelWaves(mission, 21, air()), generateLowLevelWaves(mission, 21, air(), { skipHard: true }));
});

test('Laptop slows actual enemies and Tight reduces real spread/recoil, range penalty and manual kill XP', () => {
  const normal = new Simulation(42), modded = new Simulation(42, { mods: { laptop: true, tight: true } });
  normal['spawnEnemy']('dino'); modded['spawnEnemy']('dino');
  const n = normal.state.enemies[0], m = modded.state.enemies[0];
  assert.ok(Math.abs(m.speed - n.speed * 0.7) < 1e-10);
  normal['tickEnemy'](n); modded['tickEnemy'](m);
  assert.ok(Math.abs((m.x + 20) - (n.x + 20) * 0.7) < 1e-10);
  normal.state.player.accuracyFix = modded.state.player.accuracyFix = 0.4;
  normal.fireAt(300, 240); modded.fireAt(300, 240);
  assert.ok(Math.abs((normal.state.player.accuracyFix - 0.4) / 2 - (modded.state.player.accuracyFix - 0.4)) < 1e-10);
  assert.notDeepEqual(normal.events.find(e => e.type === 'shot')!.pellets, modded.events.find(e => e.type === 'shot')!.pellets);
  for (const sim of [normal, modded]) { sim.state.player.accuracyFix = 0; sim.state.aimX = 620; sim['timerTick'](); }
  assert.ok(normal.state.player.accuracyFix > 0); assert.equal(modded.state.player.accuracyFix, 0);
  for (const [mode, expected] of [['normal', 20], ['casual', 27]] as const) {
    const sim = new Simulation(42, { mode, mods: { tight: true } }); sim['spawnEnemy']('sheep');
    sim['damageEnemy'](sim.state.enemies[0], 1000, false, 0, -20, 230);
    assert.equal(sim.state.player.exp, expected);
  }
});

test('boss MOD drops and weapon-level limits reach actual rewards, shops and paid upgrade previews', () => {
  const normal = new Simulation(42), modded = new Simulation(42, { mods: { bossMods: true } });
  for (const sim of [normal, modded]) { sim.state.bossKilled = 5; sim['finishDay'](); assert.ok(sim.finishLoot()); }
  assert.ok(modded.state.lootOffers.filter(isOccupiedItem).every(item => item.type === ITEM_TYPE.mod));
  assert.ok(normal.state.lootOffers.some(item => isOccupiedItem(item) && item.type === ITEM_TYPE.gun));
  const limited = town(80, { weaponLevel: true });
  const skills = limited['itemGenerationContext']().weaponSkillLevels;
  const stock = limited.state.town!.shop.filter(isOccupiedItem).filter(item => item.type === ITEM_TYPE.gun);
  assert.ok(stock.length > 0); assert.ok(stock.every(item => item.reqLv! <= skills[item.reqTrait!] + 2));
  limited.state.gold = 100000; limited.state.town!.ap = 10;
  assert.equal(limited.beginWeaponUpgrade(0), 'previewed');
  // Явный апгрейд Mk в исходнике обходит ограничение случайной генерации.
  assert.equal(limited.state.upgradeReference!.lv, limited.state.inventory[0]!.lv + 1);
  assert.deepEqual(Simulation.fromSave(limited.toSave()).toSave(), limited.toSave());
  addStartingLittleGirl(limited.state.party, seeded(6));
  limited.state.party.slots[0].member!.traits[104] = 12;
  const factory = limited['equipmentFactory'](() => 0.99), rifle = factory.generate(4);
  factory.varyWeapon(rifle);
  assert.ok(rifle.reqLv! > 2 && rifle.reqLv! <= 14);
});

test('Community Compilation gives fixed Active AP and retains repeating MOD sales across refresh and save/Rest', () => {
  const sim = battle(14, { community: true, weaponLevel: true });
  sim.state.player.traits[123] = 3; sim['refreshPartySkills']();
  const expectedAp = 4 + Math.trunc((sim.state.partySkills.effects[123] + 1) / 2);
  sim['finishDay'](); finish(sim); assert.equal(sim.state.town!.ap, expectedAp); assert.ok(sim.enterTown());
  assert.equal(sim.state.town!.flags.specialSale, 1); assert.equal(sim.state.town!.shop[0]!.id, 8);
  assert.equal(sim.refreshTownStock(), 'refreshed'); assert.equal(sim.state.town!.shop[0]!.id, 8);
  assert.deepEqual(Simulation.fromSave(sim.toSave()).toSave(), sim.toSave());
  assert.ok(sim.startNextDay());
  const resumed = Simulation.fromSave(JSON.parse(JSON.stringify(sim.toSave())));
  for (let i = 0; i < 120; i++) { sim.tick(); resumed.tick(); assert.deepEqual(resumed.events, sim.events); }
  assert.deepEqual(resumed.toSave(), sim.toSave());
  const ordinary = town(14, {});
  assert.equal(ordinary.state.town!.shop[0]!.id, 8); assert.equal(ordinary.state.town!.flags.specialSale, 0);
  assert.equal(ordinary.refreshTownStock(), 'refreshed'); assert.notEqual(ordinary.state.town!.shop[0]!.id, 8);
});
