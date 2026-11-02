import { SAVE_VERSION } from '../src/save-version.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../src/simulation.ts';
import { asLegacyV6Save } from './legacy-save-support.ts';

function afterBattle(perfect = false): Simulation {
  const simulation = new Simulation(42);
  simulation.state.player.exp = 750;
  simulation.state.noDamage = perfect;
  if (!perfect) simulation.state.castleHp = 17;
  (simulation as unknown as { finishDay(): void }).finishDay();
  return simulation;
}

function completeRewards(simulation: Simulation): void {
  for (let step = 0; simulation.state.postbattle !== 'result' && step < 10; step++) {
    if (simulation.state.postbattle === 'skill') assert.equal(simulation.chooseSkill(simulation.state.skillChoices[0]), true);
    else assert.equal(simulation.finishLoot(), true);
  }
  assert.equal(simulation.state.postbattle, 'result');
}

function restore(simulation: Simulation): Simulation {
  const saved = JSON.parse(JSON.stringify(simulation.toSave()));
  const loaded = Simulation.fromSave(saved);
  assert.deepEqual(loaded.state, saved);
  return loaded;
}

function legacyVictory(simulation: Simulation, version: 1 | 2 | 3): Record<string, any> {
  const value = asLegacyV6Save(simulation.toSave());
  if (value.town === null) value.gold += value.result.netReward;
  value.version = version; delete value.town; delete value.totalMoney; delete value.hero;
  delete value.player.traits[900]; delete value.player.traits[901];
  if (version < 3) {
    for (const field of ['bossKilled', 'skillChoices', 'traitsProvenance', 'bossKilledProvenance']) delete value[field];
    delete value.player.traits;
  }
  if (version === 1) for (const field of ['inventory', 'lootOffers', 'postbattle', 'inventoryProvenance', 'legacyReconstructionSeed']) delete value[field];
  return value;
}

test('settlement waits for the final reward, consumes the three original result draws once, and enters Day 1 town', () => {
  for (const perfect of [false, true]) {
    let simulation = afterBattle(perfect);
    assert.equal(simulation.state.gold, 200);
    assert.equal(simulation.state.town, null);
    assert.equal(simulation.enterTown(), false);
    assert.equal(simulation.freeRepair(), 'unavailable');
    simulation.finishLoot();
    assert.equal(simulation.state.postbattle, 'skill');
    assert.equal(simulation.state.gold, 200);
    const boundary = simulation as unknown as { random(): number; prepareResult(): void };
    const random = boundary.random.bind(simulation);
    let draws = 0;
    boundary.random = () => { draws++; return random(); };
    simulation.chooseSkill(simulation.state.skillChoices[0]);
    assert.equal(draws, 3);
    assert.equal(simulation.state.gold, perfect ? 940 : 760);
    assert.equal(simulation.state.totalMoney, perfect ? 780 : 600);
    assert.deepEqual(simulation.state.town, { ap: 4, preparation: 'pending' });
    const result = simulation.toSave();
    boundary.prepareResult();
    assert.equal(draws, 3);
    assert.deepEqual(simulation.toSave(), result);
    simulation = restore(simulation);
    assert.equal(simulation.enterTown(), true);
    assert.equal(simulation.state.phase, 'town');
    assert.equal(simulation.state.day, 1);
    assert.equal(simulation.state.postbattle, 'result');
    assert.notEqual(simulation.state.rng, result.rng);
    assert.equal(simulation.state.town?.preparation, 'ready');
    assert.equal(simulation.state.town?.ap, 4);
    assert.equal(simulation.state.gold, result.gold);
    assert.equal(simulation.state.totalMoney, result.totalMoney);
    const entered = simulation.toSave();
    assert.equal(simulation.enterTown(), false);
    simulation.tick({ firePressed: true, slot: 1, reload: true });
    assert.deepEqual(simulation.toSave(), entered);
    restore(simulation);
  }
});

test('Free Repair spends exactly two AP, restores all HP, and preserves inventory, gold and RNG through saves', () => {
  let simulation = afterBattle();
  assert.equal(simulation.moveLootItem('inventory', 0, 'inventory', 5), true);
  completeRewards(simulation);
  simulation.enterTown();
  simulation = restore(simulation);
  const before = simulation.toSave();
  assert.equal(simulation.freeRepair(), 'repaired');
  const expected = structuredClone(before);
  expected.castleHp = 40; expected.town!.ap = 2;
  assert.deepEqual(simulation.toSave(), expected);
  simulation = restore(simulation);
  assert.equal(simulation.freeRepair(), 'not-damaged');
  assert.deepEqual(simulation.toSave(), expected);
  simulation.state.castleHp = 1;
  assert.equal(simulation.freeRepair(), 'repaired');
  assert.equal(simulation.state.town!.ap, 0);
  assert.equal(simulation.state.castleHp, 40);
  assert.equal(simulation.state.rng, before.rng);
  restore(simulation);
});

test('Free Repair checks full HP before insufficient AP and rejects unavailable stages without mutation', () => {
  const simulation = afterBattle();
  completeRewards(simulation);
  assert.equal(simulation.freeRepair(), 'unavailable');
  simulation.enterTown();
  for (const ap of [0, 1]) {
    simulation.state.town!.ap = ap;
    simulation.state.castleHp = 40;
    const full = simulation.toSave();
    assert.equal(simulation.freeRepair(), 'not-damaged');
    assert.deepEqual(simulation.toSave(), full);
    simulation.state.castleHp = 39;
    const damaged = simulation.toSave();
    assert.equal(simulation.freeRepair(), 'not-enough-ap');
    assert.deepEqual(simulation.toSave(), damaged);
  }
});

test('version 1–3 pending reward migration reverses early payment and restores exactly the old final balance', () => {
  for (const version of [1, 2, 3] as const) {
    const original = afterBattle();
    const oldSave = legacyVictory(original, version);
    const untouched = structuredClone(oldSave);
    let migrated = Simulation.fromSave(oldSave);
    assert.deepEqual(oldSave, untouched);
    assert.equal(migrated.state.version, SAVE_VERSION);
    assert.equal(migrated.state.gold, oldSave.gold - oldSave.result.netReward);
    assert.equal(migrated.state.rng, oldSave.rng);
    assert.equal(migrated.state.town, null);
    migrated = restore(migrated);
    completeRewards(migrated);
    assert.equal(migrated.state.gold, oldSave.gold);
    assert.equal(migrated.state.totalMoney, oldSave.result.reward + oldSave.result.perfectBonus);
    assert.equal(migrated.state.town!.ap, 4);
    migrated = restore(migrated);
    migrated.enterTown();
    assert.equal(migrated.state.gold, oldSave.gold);
    restore(migrated);
  }
});

test('an old version 3 completed result receives AP without receiving its settlement twice', () => {
  const simulation = afterBattle(true);
  completeRewards(simulation);
  const oldSave = legacyVictory(simulation, 3);
  const untouched = structuredClone(oldSave);
  const migrated = Simulation.fromSave(oldSave);
  assert.deepEqual(oldSave, untouched);
  assert.equal(migrated.state.gold, oldSave.gold);
  assert.equal(migrated.state.postbattle, 'result');
  assert.deepEqual(migrated.state.inventory, oldSave.inventory);
  assert.deepEqual(Object.fromEntries(Object.entries(migrated.state.player.traits).filter(([id]) => id !== '900' && id !== '901')), oldSave.player.traits);
  assert.equal(migrated.state.hero.provenance, 'legacy-reconstructed');
  assert.deepEqual(migrated.state.town, { ap: 4, preparation: 'pending' });
  assert.notEqual(migrated.state.rng, oldSave.rng);
  assert.deepEqual(Simulation.fromSave(oldSave).state, migrated.state);
  restore(migrated);
});

test('version 4 town migration prepares its missing stock once without repeating settlement or repair', () => {
  const simulation = afterBattle();
  completeRewards(simulation);
  const oldSave = asLegacyV6Save(simulation.toSave());
  oldSave.version = 4; delete oldSave.totalMoney; delete oldSave.hero;
  delete oldSave.player.traits[900]; delete oldSave.player.traits[901];
  oldSave.phase = 'town'; oldSave.town = { ap: 2, preparation: 'pending' };
  oldSave.castleHp = 40; oldSave.lootOffers.fill(null);
  const untouched = structuredClone(oldSave);
  const migrated = Simulation.fromSave(oldSave);
  assert.deepEqual(oldSave, untouched);
  assert.equal(migrated.state.version, SAVE_VERSION);
  assert.equal(migrated.state.phase, 'town');
  assert.equal(migrated.state.town?.preparation, 'ready');
  assert.equal(migrated.state.town?.ap, 2);
  assert.equal(migrated.state.castleHp, 40);
  assert.equal(migrated.state.gold, oldSave.gold);
  assert.equal(migrated.state.totalMoney, oldSave.result.reward + oldSave.result.perfectBonus);
  assert.deepEqual(migrated.state.inventory, oldSave.inventory);
  const migratedPlayer = asLegacyV6Save(migrated.state).player;
  delete migratedPlayer.traits[900]; delete migratedPlayer.traits[901];
  assert.deepEqual(migratedPlayer, oldSave.player);
  assert.equal(migrated.state.hero.provenance, 'legacy-reconstructed');
  assert.notEqual(migrated.state.rng, oldSave.rng);
  assert.deepEqual(Simulation.fromSave(oldSave).state, migrated.state);
  const prepared = migrated.toSave();
  assert.equal(migrated.enterTown(), false);
  assert.deepEqual(migrated.toSave(), prepared);
  restore(migrated);
});

test('town save validation rejects impossible phases, missing preparation and invalid AP', () => {
  const simulation = afterBattle(); completeRewards(simulation); simulation.enterTown();
  const saved = simulation.toSave();
  for (const change of [
    { town: null }, { town: undefined }, { town: { ...saved.town, ap: -1 } },
    { town: { ...saved.town, ap: 15 } }, { town: { ...saved.town, ap: 1.5 } },
    { town: { ap: 4, preparation: 'pending' } },
    { town: { ap: 4, preparation: 'complete' } }, { postbattle: 'loot' },
    { castleHp: 0 }, { day: 2 }, { version: 3 }, { phase: 'battle' },
    { phase: 'victory', town: { ap: 2, preparation: 'pending' } },
  ]) assert.throws(() => Simulation.fromSave({ ...saved, ...change }));
  assert.throws(() => Simulation.fromSave({ ...afterBattle().toSave(), town: { ap: 4, preparation: 'pending' } }));
});
