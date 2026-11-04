import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../src/simulation.ts';
import { parseAdventureSave } from '../src/adventure-save.ts';
import { createProfile, mergeProfile, mergeProfiles } from '../src/profile.ts';
import { readProfile, storeProfile, storeSave, readSave } from '../src/storage.ts';
import { saveSlotLabel } from '../src/save-slots.ts';

const envelope = (sim: Simulation) => ({ format: 'elona-shooter-browser' as const, version: sim.state.version,
  appearance: 0, simulation: sim.toSave(), profile: createProfile(sim.state.ruleset.id) });

test('old adventures default to Classic, current saves require a supported edition and revision', () => {
  const old: any = envelope(new Simulation(42)); old.version = old.simulation.version = 45; delete old.simulation.ruleset;
  const untouched = structuredClone(old);
  const migrated = parseAdventureSave(old).simulation;
  assert.deepEqual(migrated.state.ruleset, { id: 'classic', revision: 1 });
  assert.equal(migrated.state.rng, old.simulation.rng); assert.deepEqual(old, untouched);
  const current: any = envelope(migrated);
  for (const ruleset of [undefined, { id: 'unknown', revision: 1 }, { id: 'classic', revision: 2 }]) {
    const invalid = structuredClone(current); invalid.simulation.ruleset = ruleset;
    assert.throws(() => parseAdventureSave(invalid), /edition|revision/);
  }
  old.simulation.ruleset = { id: 'expanded', revision: 1 };
  assert.throws(() => parseAdventureSave(old), /edition|revision/);
});

test('Expanded without its optional order retains Classic simulation and RNG', () => {
  for (const seed of [42, 123]) {
    const classic = new Simulation(seed, { heroClass: 'rogue' });
    const expanded = new Simulation(seed, { heroClass: 'rogue', ruleset: 'expanded' });
    for (let i = 0; i < 120; i++) { classic.tick(); expanded.tick(); }
    const left = classic.toSave(), right = expanded.toSave(); right.ruleset = left.ruleset;
    assert.deepEqual(right, left); assert.deepEqual(expanded.events, classic.events);
  }
});

test('Expanded saves select their own edition and reject mismatched medals and Classic-only orders', () => {
  const sim = new Simulation(42, { heroClass: 'rogue', ruleset: 'expanded' });
  sim.state.party.slots[0].member!.ai = 7;
  const saved = envelope(sim), loaded = parseAdventureSave(saved, { ruleset: 'classic' });
  assert.deepEqual(loaded.simulation.toSave(), sim.toSave());
  assert.match(saveSlotLabel({ kind: 'saved', data: saved }), /^Expanded/);
  const mismatched = { ...saved, profile: createProfile('classic') };
  assert.throws(() => parseAdventureSave(mismatched), /different game edition/);
  assert.throws(() => parseAdventureSave(mismatched, {}, true), /different game edition/);
  const classic = structuredClone(saved); classic.simulation.ruleset.id = 'classic'; classic.profile = createProfile();
  assert.throws(() => parseAdventureSave(classic), /party/);
  const hero = envelope(sim); hero.simulation.heroSettings = { order: 7, focus: -1, wall: true, boss: true };
  assert.throws(() => parseAdventureSave(hero), /hero orders/);
});

test('Carry Over cannot change an adventure edition', () => {
  const sim = new Simulation(42, { ruleset: 'expanded' });
  sim['finishDay']();
  while (['loot', 'boss-loot'].includes(sim.state.postbattle)) sim.finishLoot();
  while (sim.state.postbattle === 'skill') sim.chooseSkill(sim.state.skillChoices[0]);
  assert.ok(sim.enterTown());
  const checkpoint = sim.toSave(); sim.startNextDay();
  assert.deepEqual(sim.readCarryCheckpoint(checkpoint), checkpoint);
  checkpoint.ruleset.id = 'classic';
  assert.throws(() => sim.readCarryCheckpoint(checkpoint), /Carry Over/);
});

test('profiles and slot inspection never mix edition progress or mutate stored saves', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  } });
  try {
    const classic = mergeProfile(createProfile(), { earnedMedals: [65], day: 10 });
    const expanded = mergeProfile(createProfile('expanded'), { ruleset: { id: 'expanded', revision: 1 }, earnedMedals: [68], day: 99 });
    assert.ok(storeProfile(classic)); assert.ok(storeProfile(expanded));
    assert.deepEqual(readProfile().profile, classic); assert.deepEqual(readProfile('expanded').profile, expanded);
    assert.throws(() => mergeProfiles(classic, expanded), /different game edition/);
    assert.throws(() => mergeProfile(classic, { ruleset: { id: 'expanded', revision: 1 }, earnedMedals: [68], day: 99 }), /different game edition/);
    const saved = envelope(new Simulation(42, { ruleset: 'expanded' })); saved.profile = expanded;
    storeSave(saved, 3); const before = new Map(values);
    assert.match(saveSlotLabel(readSave(3)), /^Expanded/);
    parseAdventureSave(saved); assert.deepEqual(values, before);
    const invalid = structuredClone(saved); invalid.simulation.ruleset.revision = 99 as 1;
    assert.throws(() => parseAdventureSave(invalid)); assert.deepEqual(values, before);
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
    else delete (globalThis as { localStorage?: unknown }).localStorage;
  }
});
