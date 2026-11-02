import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../src/simulation.ts';
import { generateSheriffHero, levelUpHero } from '../src/hero.ts';
import { generateLowLevelMission, generateLowLevelWaves } from '../src/missions.ts';
import { asLegacyV6Save } from './legacy-save-support.ts';

function stream(seed: number) {
  let state = seed >>> 0 || 1;
  return { state: () => state, random: () => {
    state ^= state << 13; state ^= state >>> 17; state ^= state << 5; state >>>= 0;
    return state / 4294967296;
  } };
}

test('New Game integrates mission then hero then waves without mixing their RNG boundaries', () => {
  for (const seed of [42, 1, 3735928559]) {
    const reference = stream(seed);
    const mission = generateLowLevelMission(0, 1, reference.random);
    const hero = generateSheriffHero(reference.random);
    const waves = generateLowLevelWaves(mission, 1, reference.random);
    const simulation = new Simulation(seed);
    assert.deepEqual(simulation.state.hero, hero.hero);
    assert.deepEqual(simulation.state.player.traits, hero.traits);
    assert.deepEqual(simulation.state.inventory, hero.inventory);
    assert.deepEqual(simulation.state.loot, mission.loot);
    assert.deepEqual(simulation.state.waves, waves.waves);
    assert.equal(simulation.state.rng, reference.state());
    assert.equal(simulation.state.version, 15);
    assert.deepEqual(Simulation.fromSave(simulation.toSave()).state, simulation.state);
  }
});

test('creation rerolls only the hero and Proceed prepares waves once after the selected generation', () => {
  const reference = stream(42), mission = generateLowLevelMission(0, 1, reference.random);
  let hero = generateSheriffHero(reference.random);
  const simulation = new Simulation(42, { deferOpeningWaves: true });
  assert.deepEqual(simulation.state.waves, []);
  assert.equal(simulation.state.rng, reference.state());
  const beforeTick = structuredClone(simulation.state);
  assert.throws(() => simulation.toSave());
  simulation.tick({ firePressed: true, slot: 1 });
  assert.deepEqual(simulation.state, beforeTick);
  for (let index = 0; index < 2; index++) {
    hero = generateSheriffHero(reference.random, hero.inventory);
    assert.equal(simulation.rerollOpeningHero(), true);
    assert.deepEqual(simulation.state.hero, hero.hero);
    assert.deepEqual(simulation.state.inventory, hero.inventory);
    assert.equal(simulation.state.rng, reference.state());
  }
  const waves = generateLowLevelWaves(mission, 1, reference.random);
  assert.equal(simulation.startOpeningBattle(), true);
  assert.deepEqual(simulation.state.waves, waves.waves);
  assert.deepEqual(simulation.state.loot, mission.loot);
  assert.equal(simulation.state.rng, reference.state());
  const started = simulation.toSave();
  assert.equal(simulation.startOpeningBattle(), false);
  assert.equal(simulation.rerollOpeningHero(), false);
  assert.deepEqual(simulation.toSave(), started);
});

test('loading an existing battle cannot re-enter deferred character creation', () => {
  const saved = new Simulation(42).toSave();
  const restored = Simulation.fromSave(saved, { deferOpeningWaves: true });
  assert.deepEqual(restored.toSave(), saved);
  assert.equal(restored.rerollOpeningHero(), false);
  assert.equal(restored.startOpeningBattle(), false);
  restored.tick();
  assert.equal(restored.state.tick, saved.tick + 1);
});

test('postbattle level growth uses the saved potentials and survives JSON restore', () => {
  const simulation = new Simulation(42);
  simulation.state.player.exp = 750;
  const reference = stream(simulation.state.rng);
  const expected = levelUpHero({ ...simulation.state.player, exp: 1000 }, simulation.state.hero, reference.random);
  const hero = structuredClone(simulation.state.hero);
  (simulation as unknown as { finishDay(): void }).finishDay();
  assert.equal(simulation.state.player.level, expected.level);
  assert.equal(simulation.state.player.exp, expected.exp);
  assert.equal(simulation.state.player.skillPoints, expected.skillPoints);
  assert.deepEqual(simulation.state.player.traits, expected.traits);
  assert.deepEqual(simulation.state.hero, hero);
  assert.deepEqual(Simulation.fromSave(JSON.parse(JSON.stringify(simulation.toSave()))).state, simulation.state);
});

test('v5 migration reconstructs only missing hero data without changing owned items, ordinary traits or combat RNG', () => {
  const simulation = new Simulation(42);
  simulation.state.player.level = 5; simulation.state.player.traits[6] = 5;
  simulation.state.player.traits[107] = 3; simulation.state.player.exp = 275;
  simulation.state.inventory[0]!.name = 'Preserved legacy shotgun';
  simulation.state.inventory[0]!.value += 1 / 3;
  const legacy = asLegacyV6Save(simulation.toSave());
  legacy.version = 5; delete legacy.hero;
  delete legacy.player.traits[900]; delete legacy.player.traits[901];
  const before = structuredClone(legacy);
  const first = Simulation.fromSave(legacy), second = Simulation.fromSave(legacy);
  assert.deepEqual(legacy, before);
  assert.deepEqual(first.state, second.state);
  assert.equal(first.state.rng, legacy.rng);
  assert.deepEqual(first.state.inventory, legacy.inventory);
  assert.deepEqual(first.state.waves, legacy.waves);
  assert.equal(first.state.player.level, 5); assert.equal(first.state.player.exp, 275);
  assert.equal(first.state.player.traits[107], 3);
  assert.equal(first.state.hero.provenance, 'legacy-reconstructed');
  if (first.state.hero.provenance === 'legacy-reconstructed') {
    assert.equal(first.state.hero.reconstructionSeed, legacy.rng);
    assert.equal(first.state.hero.reconstructedAtLevel, 5);
  }
  assert.ok(first.state.player.traits[900] >= 1); assert.ok(first.state.player.traits[901] >= 1);
  assert.deepEqual(Simulation.fromSave(first.toSave()).state, first.state);
});

test('current saves reject missing or malformed hero potentials and provenance before editing input', () => {
  const saved = new Simulation(42).toSave();
  const changes = [
    (value: any) => { delete value.hero; },
    (value: any) => { value.hero.potentialAim = null; },
    (value: any) => { value.hero.potentialTeam = 0.9; },
    (value: any) => { value.hero.provenance = 'legacy-reconstructed'; },
    (value: any) => { delete value.player.traits[900]; },
  ];
  for (const change of changes) {
    const value = structuredClone(saved); change(value);
    const before = structuredClone(value);
    assert.throws(() => Simulation.fromSave(value));
    assert.deepEqual(value, before);
  }
});
