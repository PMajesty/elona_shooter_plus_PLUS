import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation, type SimulationState } from '../src/simulation.ts';
import { isOccupiedItem } from '../src/items.ts';
import { TRAIT, SHERIFF_TRAITS, SHERIFF_CHOICE_ORDER } from '../src/progression.ts';
import { asLegacyV6Save } from './legacy-save-support.ts';

function completeOpeningBattle(): Simulation {
  const simulation = new Simulation(42);
  for (let i = 0; i < 5000 && simulation.state.phase === 'battle'; i++) {
    const enemy = simulation.state.enemies.filter(candidate => candidate.hp > 0 && candidate.x > 20).sort((a, b) => b.x - a.x)[0];
    const weapon = simulation.weapon!;
    simulation.tick({ aimX: enemy?.x ?? 450, aimY: enemy?.y ?? 240, firePressed: Boolean(enemy) && weapon.reloadTime === 0 && weapon.ammo > 0, reload: weapon.ammo === 0 || (!enemy && weapon.ammo < 3) });
  }
  assert.equal(simulation.state.phase, 'victory');
  return simulation;
}

function asVersion2(state: SimulationState): Record<string, any> {
  const value = asLegacyV6Save(state);
  value.version = 2;
  if (value.phase === 'victory' && value.town === null) value.gold += value.result.netReward;
  for (const field of ['bossKilled', 'skillChoices', 'traitsProvenance', 'bossKilledProvenance', 'town', 'totalMoney', 'hero']) delete value[field];
  delete value.player.traits;
  return value;
}

function roundTrip(simulation: Simulation): Simulation {
  const saved = JSON.parse(JSON.stringify(simulation.toSave()));
  const restored = Simulation.fromSave(saved);
  assert.deepEqual(restored.state, saved);
  return restored;
}

test('a completed opening battle delivers ordinary loot, one boss prize, one earned skill and results across saves', () => {
  let simulation = completeOpeningBattle();
  assert.equal(simulation.state.bossKilled, 1);
  assert.equal(simulation.state.player.level, 2);
  assert.equal(simulation.state.player.skillPoints, 1);
  assert.equal(simulation.state.player.traits[TRAIT.SHERIFF], 2);
  assert.equal(simulation.state.postbattle, 'loot');
  simulation = roundTrip(simulation);
  assert.equal(simulation.finishLoot(), true);
  assert.equal(simulation.state.postbattle, 'boss-loot');
  assert.equal(simulation.state.lootOffers.filter(isOccupiedItem).length, 1);
  assert.equal(simulation.collectLoot(0, 2), true);
  const prize = structuredClone(simulation.state.inventory[2]);
  simulation = roundTrip(simulation);
  assert.equal(simulation.finishLoot(), true);
  assert.equal(simulation.state.postbattle, 'skill');
  assert.equal(simulation.state.skillChoices.length, 3);
  simulation = roundTrip(simulation);
  const pending = simulation.toSave();
  assert.equal(simulation.chooseSkill(TRAIT.SHERIFF), false);
  assert.equal(simulation.finishLoot(), false);
  assert.equal(simulation.dropLootItem(2), false);
  assert.deepEqual(simulation.toSave(), pending);
  const chosen = simulation.state.skillChoices[0], before = simulation.state.player.traits[chosen] ?? 0;
  assert.equal(simulation.chooseSkill(chosen), true);
  assert.equal(simulation.state.player.traits[chosen], before + 1);
  assert.equal(simulation.state.player.skillPoints, 0);
  assert.equal(simulation.state.postbattle, 'result');
  assert.deepEqual(simulation.state.skillChoices, []);
  assert.deepEqual(simulation.state.inventory[2], prize);
  assert.notEqual(simulation.state.rng, pending.rng);
  assert.equal(simulation.state.gold, pending.gold + pending.result.netReward);
  assert.deepEqual(simulation.state.town, { ap: 4, preparation: 'pending' });
  simulation = roundTrip(simulation);
  const finished = simulation.toSave();
  assert.equal(simulation.chooseSkill(chosen), false);
  assert.equal(simulation.finishLoot(), false);
  assert.deepEqual(simulation.toSave(), finished);
});

test('pending multiple skill points consume one at a time and preserve the next rolled choices', () => {
  let simulation = completeOpeningBattle();
  simulation.state.player.skillPoints = 2;
  simulation.finishLoot(); simulation.finishLoot();
  const chosen = simulation.state.skillChoices[0];
  assert.equal(simulation.chooseSkill(chosen), true);
  assert.equal(simulation.state.player.skillPoints, 1);
  assert.equal(simulation.state.postbattle, 'skill');
  simulation = roundTrip(simulation);
  assert.equal(simulation.chooseSkill(simulation.state.skillChoices[0]), true);
  assert.equal(simulation.state.postbattle, 'result');
  assert.equal(simulation.state.player.skillPoints, 0);
});

test('v2 battle migration preserves existing item metadata and its combat random stream', () => {
  const original = new Simulation(42);
  for (let frame = 0; frame < 150; frame++) original.tick();
  original.fireAt(450, 240);
  const oldSave = asVersion2(original.toSave());
  oldSave.inventory[0].value += 1 / 3;
  const untouched = structuredClone(oldSave);
  const migrated = Simulation.fromSave(oldSave);
  assert.deepEqual(oldSave, untouched);
  assert.equal(migrated.state.version, 8);
  assert.equal(migrated.state.rng, oldSave.rng);
  assert.deepEqual(migrated.state.inventory, oldSave.inventory);
  assert.deepEqual(migrated.state.waves, oldSave.waves);
  assert.deepEqual(migrated.state.enemies, oldSave.enemies.map((enemy: { kind: string }) => ({ ...enemy, appearance: enemy.kind === 'boss' ? 51 : 0 })));
  assert.equal(migrated.state.traitsProvenance, 'legacy-reconstructed');
  assert.equal(migrated.state.hero.provenance, 'legacy-reconstructed');
  assert.ok(migrated.state.player.traits[TRAIT.BASE_AIMING] >= 1);
  assert.ok(migrated.state.player.traits[TRAIT.BASE_TEAMWORK] >= 1);
  assert.equal(migrated.state.bossKilled, 0);
  roundTrip(migrated);
});

test('old completed results receive omitted rewards once using normal reward RNG without altering input', () => {
  const oldSave = asVersion2(completeOpeningBattle().toSave());
  oldSave.postbattle = 'result'; oldSave.lootOffers.fill(null);
  const untouched = structuredClone(oldSave);
  const migrated = Simulation.fromSave(oldSave);
  assert.deepEqual(oldSave, untouched);
  assert.equal(migrated.state.bossKilled, 1);
  assert.equal(migrated.state.bossKilledProvenance, 'legacy-inferred');
  assert.equal(migrated.state.postbattle, 'boss-loot');
  assert.notEqual(migrated.state.rng, oldSave.rng);
  assert.deepEqual(Simulation.fromSave(oldSave).state, migrated.state);
  roundTrip(migrated);
  migrated.finishLoot();
  assert.equal(migrated.state.postbattle, 'skill');
  roundTrip(migrated);
  migrated.chooseSkill(migrated.state.skillChoices[0]);
  assert.equal(migrated.state.postbattle, 'result');
  roundTrip(migrated);
});

test('legacy boss inference distinguishes a removed dead boss from a surviving or still-queued boss', () => {
  const won = completeOpeningBattle();
  const removedBoss = asVersion2(won.toSave());
  removedBoss.enemies = removedBoss.enemies.filter((enemy: { kind: string }) => enemy.kind !== 'boss');
  assert.equal(Simulation.fromSave(removedBoss).state.bossKilled, 1);
  const queued = asVersion2(new Simulation(42).toSave());
  assert.equal(Simulation.fromSave(queued).state.bossKilled, 0);
  const boundary = won as unknown as { spawnEnemy(kind: 'boss'): void };
  won.state.enemies = won.state.enemies.filter(enemy => enemy.kind !== 'boss');
  boundary.spawnEnemy('boss');
  const survivor = asVersion2(won.toSave());
  survivor.postbattle = 'result'; survivor.lootOffers.fill(null);
  const migrated = Simulation.fromSave(survivor);
  assert.equal(migrated.state.bossKilled, 0);
  assert.equal(migrated.state.postbattle, 'skill');
});

test('current save corruption cannot enter reward stages with invalid traits, duplicate choices or missing entitlement', () => {
  const simulation = completeOpeningBattle();
  simulation.finishLoot(); simulation.finishLoot();
  const saved = simulation.toSave();
  const changes = [
    { skillChoices: [] }, { skillChoices: [100, 100, 105] }, { skillChoices: [100, 101, 6] },
    { bossKilled: 2 }, { bossKilledProvenance: 'invented' }, { traitsProvenance: 'invented' },
    { player: { ...saved.player, skillPoints: 0 } },
    { player: { ...saved.player, traits: { ...saved.player.traits, 999: 1 } } },
    { player: { ...saved.player, traits: { ...saved.player.traits, [TRAIT.CAPABLE]: 3 } } },
    { player: { ...saved.player, traits: { ...saved.player.traits, [TRAIT.SHERIFF]: 1 } } },
    { postbattle: 'result' },
  ];
  for (const change of changes) assert.throws(() => Simulation.fromSave({ ...saved, ...change }));
  simulation.state.postbattle = 'boss-loot'; simulation.state.skillChoices = []; simulation.state.bossKilled = 0;
  assert.throws(() => Simulation.fromSave(simulation.toSave()));
});

test('an imported pending reward with no eligible skill is rejected before its loot can be lost', () => {
  const simulation = completeOpeningBattle();
  simulation.state.bossKilled = 0;
  simulation.state.player.level = 999;
  simulation.state.player.traits[TRAIT.SHERIFF] = 999;
  for (const id of SHERIFF_CHOICE_ORDER) simulation.state.player.traits[id] = SHERIFF_TRAITS[id].maxLevel;
  const saved = simulation.toSave();
  const untouched = structuredClone(saved);
  assert.equal(saved.player.skillPoints, 1);
  assert.ok(saved.lootOffers.some(isOccupiedItem));
  assert.throws(() => Simulation.fromSave(saved), /no available Sheriff skill/);
  assert.deepEqual(saved, untouched);
  assert.throws(() => simulation.finishLoot(), /No Sheriff skills are available/);
  assert.deepEqual(simulation.toSave(), saved);
});

test('maxed skills remain valid when the pending reward still has eligible original choices', () => {
  const simulation = completeOpeningBattle();
  simulation.state.bossKilled = 0;
  simulation.state.player.level = 999;
  simulation.state.player.traits[TRAIT.SHERIFF] = 999;
  for (const id of SHERIFF_CHOICE_ORDER) simulation.state.player.traits[id] = SHERIFF_TRAITS[id].maxLevel;
  for (const id of [TRAIT.SHOTGUN, TRAIT.COOL, TRAIT.ACCURACY, TRAIT.RELOADING, TRAIT.DR_HOLLIDAY]) simulation.state.player.traits[id] = id === TRAIT.SHOTGUN ? 2 : 1;
  const restored = roundTrip(simulation);
  assert.equal(restored.finishLoot(), true);
  assert.equal(restored.state.postbattle, 'skill');
  assert.equal(restored.state.skillChoices.length, 5);
  roundTrip(restored);
});
