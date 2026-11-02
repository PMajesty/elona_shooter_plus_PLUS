import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { readFlashAdventure } from '../src/flash-adventure.ts';
import { readFlashSharedObject } from '../src/flash-shared-object.ts';
import { Simulation } from '../src/simulation.ts';
import { HERO_CLASSES, type HeroClass } from '../src/hero-classes.ts';
import { adventureFixture, sourceAdventure } from './helpers/flash-adventure-fixture.ts';
import { flashFixture } from './helpers/flash-fixture.ts';

test('original adventure schema imports all eight hero classes, modes and exact owned/town contents', () => {
  for (const [index, classId] of (Object.keys(HERO_CLASSES) as HeroClass[]).entries()) {
    const { sim, profile, bytes } = adventureFixture(classId, 3, index === 6 ? 'casual' : index === 7 ? 'hardcore' : 'normal');
    const imported = readFlashAdventure(bytes, profile), s = imported.save.simulation, original = sim.state;
    assert.equal(imported.originalSlot, 3); assert.equal(imported.originalVersion, 1304);
    for (const field of ['day', 'gold', 'totalMoney', 'perfectDays', 'castleHp', 'castleMaxHp', 'wallLevel', 'mode'] as const) assert.equal(s[field], original[field], `${classId}: ${field}`);
    assert.equal(s.player.classId, classId); assert.deepEqual(s.player.traits, original.player.traits);
    assert.deepEqual(s.hero, original.hero); assert.deepEqual(s.inventory, original.inventory);
    assert.deepEqual(s.party.slots.map(slot => slot.weapon), original.party.slots.map(slot => slot.weapon));
    assert.deepEqual(s.town!.preparation === 'ready' && s.town.shop, original.town!.preparation === 'ready' && original.town.shop);
    assert.deepEqual(s.town!.preparation === 'ready' && s.town.mission, original.town!.preparation === 'ready' && original.town.mission);
    assert.deepEqual(imported.save.profile, profile);
    assert.deepEqual(Simulation.fromSave(JSON.parse(JSON.stringify(s))).toSave(), s);
  }
});

test('town actions, customized gear, depleted recruit cells, counters and options survive conversion', () => {
  const fixture = adventureFixture('hunter', 3), sim = fixture.sim, s = sim.state;
  s.gold = 4321; s.killHistory = { completed: 42 }; s.town!.ap = 50;
  Object.assign(s.economy, { villa: 2, chickens: 6, specialTrainer: 2 });
  if (s.town?.preparation === 'ready') s.town.flags.egg = false;
  s.player.traits[125] = 1; sim['refreshPartySkills']();
  for (const action of ['pray', 'dinner', 'party', 'eggs', 'taunt', 'train'] as const) assert.equal(sim.performTownActivity(action).outcome, 'done');
  const weapon = s.inventory[0]!; Object.assign(weapon, { attack: 197, ammo: 1, manualReload: true, livingWeapon: 1234, modText: 'Damage +10%\nLiving Weapon\n' });
  s.party.slots[4].exists = false; s.party.slots[4].weapon!.num = 0;
  const data = sourceAdventure(sim); data.game.optionColor = true; data.game.optionLowQuality = true;
  const bytes = flashFixture('elonas2', data), before = structuredClone(data), profileBefore = structuredClone(fixture.profile);
  const imported = readFlashAdventure(bytes, fixture.profile), loaded = Simulation.fromSave(imported.save.simulation);
  assert.deepEqual(data, before); assert.deepEqual(fixture.profile, profileBefore);
  assert.deepEqual(loaded.state.inventory, s.inventory); assert.deepEqual(loaded.state.economy, s.economy);
  assert.equal(loaded.state.killHistory!.completed, 42); assert.equal(loaded.state.kills, 0);
  assert.deepEqual(loaded.state.town!.preparation === 'ready' && loaded.state.town.mission, s.town!.preparation === 'ready' && s.town.mission);
  assert.equal(loaded.state.party.slots[4].exists, false); assert.equal(loaded.state.party.slots[4].weapon!.num, 0);
  assert.equal(imported.save.options!.colorBlind, true); assert.equal(imported.save.options!.lowQuality, true);
  assert.deepEqual(readFlashAdventure(bytes, fixture.profile), imported);
  const copy = Simulation.fromSave(JSON.parse(JSON.stringify(loaded.toSave())));
  assert.ok(loaded.startNextDay()); assert.ok(copy.startNextDay());
  for (let i = 0; i < 300; i++) { loaded.tick(); copy.tick(); }
  assert.deepEqual(loaded.toSave(), copy.toSave());
});

test('a later-cycle Hardcore town imports without applying starting bonuses a second time', () => {
  const { sim, profile, bytes } = adventureFixture('sheriff', 41, 'hardcore');
  const imported = readFlashAdventure(bytes, profile), restored = Simulation.fromSave(imported.save.simulation);
  assert.equal(restored.state.day, 41); assert.equal(restored.state.mode, 'hardcore');
  assert.equal(restored.state.gold, sim.state.gold); assert.deepEqual(restored.state.inventory, sim.state.inventory);
  assert.deepEqual(restored.state.town!.preparation === 'ready' && restored.state.town.mission, sim.state.town!.preparation === 'ready' && sim.state.town.mission);
  assert.ok(restored.startNextDay()); assert.equal(restored.state.day, 42);
  assert.equal(restored.state.activeMission.strength, 200);
  assert.deepEqual(Simulation.fromSave(JSON.parse(JSON.stringify(restored.toSave()))).toSave(), restored.toSave());
});

test('deleted, corrupt, unsupported and medal-incompatible Flash adventures fail before changing input', () => {
  const { data, profile } = adventureFixture('sheriff', 1), before = structuredClone(data);
  for (const mutate of [
    (d: typeof data) => { d.deleted = true; },
    (d: typeof data) => { d.game.version = 1200; },
    (d: typeof data) => { d.game.day = 1001; },
    (d: typeof data) => { d.player.money[0] = Infinity; },
    (d: typeof data) => { d.inventory.attack[20] = -1; },
    (d: typeof data) => { d.game.HC = d.game.casual = true; },
    (d: typeof data) => { d.mission.absorbFix = 0.04; },
  ]) {
    const invalid = structuredClone(data); mutate(invalid);
    assert.throws(() => readFlashAdventure(flashFixture('elonas0', invalid), profile));
  }
  assert.throws(() => readFlashAdventure(flashFixture('elonas8', data), profile));
  assert.throws(() => readFlashAdventure(flashFixture('elonas_idx', {}), profile));
  assert.deepEqual(data, before);
});

test('converter follows preserved saveGame object names and exports a controlled browser sample', () => {
  const source = readFileSync(new URL('../../src/original/MainTimeline.as', import.meta.url), 'utf8');
  for (const key of ['game', 'player', 'inventory', 'mission']) assert.ok(source.includes(`obj.${key} = cloneObj(${key})`));
  const fixture = adventureFixture(); fixture.data.game.totalKill = 42; fixture.data.player.money[0] = 4321;
  const bytes = flashFixture('elonas3', fixture.data), imported = readFlashAdventure(bytes, fixture.profile);
  assert.equal(readFlashSharedObject(bytes).name, 'elonas3');
  mkdirSync('../.build/browser-qa', { recursive: true });
  writeFileSync('../.build/browser-qa/flash-adventure.sol', bytes);
  writeFileSync('../.build/browser-qa/flash-adventure-expected.json', JSON.stringify(imported.save, null, 2));
});
