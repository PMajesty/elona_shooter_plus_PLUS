import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEFAULT_GAME_OPTIONS, GAME_OPTIONS_VERSION, defaultGameOptions, savedGameOptions, validGameOptions, showDamageNumber, pauseStatistics } from '../src/game-options.ts';
import { parseAdventureSave } from '../src/adventure-save.ts';
import { fireworkPlan, FIREWORK_MEDAL_FRAMES } from '../src/fireworks.ts';
import { Simulation } from '../src/simulation.ts';

test('original presentation defaults omit extra save fields and six options survive JSON', () => {
  assert.deepEqual(DEFAULT_GAME_OPTIONS, { showDamage: true, showAllyDamage: false, lowQuality: false, disableFireworks: false, colorBlind: false, disableFlash: false });
  assert.equal(savedGameOptions({ ...DEFAULT_GAME_OPTIONS }), undefined);
  const changed = Object.fromEntries(Object.entries(DEFAULT_GAME_OPTIONS).map(([key, value]) => [key, !value]));
  assert.ok(validGameOptions(changed)); assert.deepEqual(savedGameOptions(changed), changed);
  assert.ok(validGameOptions(JSON.parse(JSON.stringify(changed))));
  for (const bad of [null, [], {}, { ...changed, showDamage: 1 }, { ...changed, other: true }]) assert.equal(validGameOptions(bad), false);
});

test('player and NPC damage visibility are independent and critical type3 never displays a number', () => {
  assert.ok(showDamageNumber(DEFAULT_GAME_OPTIONS, 0)); assert.equal(showDamageNumber(DEFAULT_GAME_OPTIONS, 1), false);
  const options = { ...DEFAULT_GAME_OPTIONS, showDamage: false, showAllyDamage: true };
  assert.equal(showDamageNumber(options, 0), false); assert.ok(showDamageNumber(options, 4));
  assert.equal(showDamageNumber(options, 4, 3), false); assert.equal(showDamageNumber(DEFAULT_GAME_OPTIONS, 0, 3), false);
});

test('Expanded enables companion damage on old saves and remembers a later opt-out', () => {
  for (const edition of ['classic', 'expanded'] as const) {
    const sim = new Simulation(42, { ruleset: edition });
    const original = { format: 'elona-shooter-browser', version: sim.state.version, appearance: 0,
      simulation: sim.toSave(), options: { ...DEFAULT_GAME_OPTIONS, lowQuality: true } };
    const before = structuredClone(original), loaded = parseAdventureSave(original);
    assert.equal(loaded.options.showAllyDamage, edition === 'expanded');
    assert.equal(loaded.options.lowQuality, true);assert.deepEqual(original, before);
    assert.deepEqual(loaded.simulation.toSave(), sim.toSave());
    const off = { ...defaultGameOptions(edition), showAllyDamage: false };
    const current = { ...original, optionsVersion: GAME_OPTIONS_VERSION, options: savedGameOptions(off, edition) };
    assert.equal(parseAdventureSave(current).options.showAllyDamage, false);
    const noOptions = { ...current, options: undefined };
    assert.equal(parseAdventureSave(noOptions).options.showAllyDamage, edition === 'expanded');
    assert.throws(() => parseAdventureSave({ ...current, optionsVersion: 2 }), /option settings/);
  }
});

test('the original statistics text includes mode, MODs, Carry Over and accumulated counters', () => {
  const sim = new Simulation(42, { mode: 'casual', mods: { intense: true, tight: true } });
  Object.assign(sim.state, { carryOver: true, perfectDays: 2, kills: 123, totalMoney: 456 });
  Object.assign(sim.state.economy, { eggsCollected: 8, sistersExploded: 9, visitorsRobbed: 10 });
  const text = pauseStatistics(sim.state);
  for (const line of ['Elona Shooter Stactics  Day 1', 'You are playing Casual Mode.', 'Mod(Intense Start) is on.',
    'Mod(Tighter crosshair) is on.', "You've used Carry Over Option.", '2 Perfect Games scored.', '8 eggs collected.',
    'Exploded 9 sisters.', 'Robbed 10 children.', 'Total of 123 enemies killed.', 'Total of 456 GP earned.', 'This game modded by Alfred.']) assert.ok(text.includes(line));
});

test('the packaged firework clips have the SWF timelines for the rocket and both sparks', () => {
  const assets = new URL('../public/assets/', import.meta.url);
  const { clips } = JSON.parse(readFileSync(new URL('manifest.json', assets), 'utf8'));
  for (const [key, symbol, frames] of [['fireworkLaunch', 96, 93], ['fireworkBit1', 101, 40], ['fireworkBit2', 91, 31]] as const) {
    const clip = clips[key];
    assert.deepEqual([clip.characterId, clip.count], [symbol, frames]);
    const atlas = JSON.parse(readFileSync(new URL(clip.json, assets), 'utf8'));
    assert.equal(Object.keys(atlas.frames).length, frames);
  }
});

test('medal firework counts, delays and particle families use an independent deterministic stream', () => {
  const sim = new Simulation(42), before = sim.toSave(), plan = fireworkPlan(sim.state.rng, []);
  assert.equal(plan.length, 48); const bonus = fireworkPlan(sim.state.rng, [93]);
  assert.equal(bonus.length, 73); assert.deepEqual(bonus.slice(0, 48), plan);
  assert.deepEqual(fireworkPlan(sim.state.rng, [65]), plan);
  assert.deepEqual(fireworkPlan(sim.state.rng, []), plan); assert.notDeepEqual(fireworkPlan(43, []), plan);
  assert.deepEqual(sim.toSave(), before);
  for (const [index, burst] of plan.entries()) {
    assert.ok(burst.x >= 50 && burst.x <= 600 && burst.y >= 10 && burst.y <= 50);
    if (index) assert.ok(burst.delay - plan[index - 1].delay >= 10 && burst.delay - plan[index - 1].delay <= 20);
    assert.ok([40, 49].includes(burst.particles.length));
    assert.ok(burst.particles.every(p => p.scale > 0 && Number.isFinite(p.angle) && p.tint >= 0 && p.tint <= 0xffffff));
  }
  assert.equal(FIREWORK_MEDAL_FRAMES, 651);
});

test('Ha-na-bi is awarded only on results, survives saves and remains allowed after Carry Over', () => {
  const sim = new Simulation(42); assert.equal(sim.watchFireworks(), false);
  sim['finishDay']();
  while (['loot', 'boss-loot'].includes(sim.state.postbattle)) sim.finishLoot();
  while (sim.state.postbattle === 'skill') sim.chooseSkill(sim.state.skillChoices[0]);
  sim.state.carryOver = true;
  const rng = sim.state.rng;
  assert.ok(sim.watchFireworks()); assert.equal(sim.watchFireworks(), false);
  assert.equal(sim.state.rng, rng); assert.ok(sim.state.earnedMedals.includes(93));
  assert.deepEqual(Simulation.fromSave(sim.toSave()).toSave(), sim.toSave());
});
