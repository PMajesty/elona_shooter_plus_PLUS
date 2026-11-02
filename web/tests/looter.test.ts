import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../src/simulation.ts';
import { castleLootMultiplier, castleUpgradeCost, castleUpkeep } from '../src/castle-upgrades.ts';
import { ItemFactory } from '../src/items.ts';
import { asLegacyV20Save } from './legacy-save-support.ts';

const saved = (sim: Simulation) => JSON.parse(JSON.stringify(sim.toSave()));
const finish = (sim: Simulation) => (sim as unknown as { finishDay(): void }).finishDay();
function settle(sim: Simulation): void {
  finish(sim);
  while (sim.state.postbattle !== 'result') {
    if (sim.state.postbattle === 'skill') assert.equal(sim.chooseSkill(sim.state.skillChoices[0]), true);
    else assert.equal(sim.finishLoot(), true);
  }
}
function town(): Simulation {
  const sim = new Simulation(42); settle(sim); assert.equal(sim.enterTown(), true);
  // Капитал и граница боя заданы для проверки операций, не для оценки обычной доступности Looter10.
  sim.state.gold = 1000000;
  return sim;
}
function buy(sim: Simulation, level: number): void {
  while (sim.state.looterLevel < level) assert.equal(sim.buyCastleUpgrade('looter'), 'purchased');
}
function restore(sim: Simulation): Simulation {
  const checkpoint = saved(sim), untouched = structuredClone(checkpoint), restored = Simulation.fromSave(checkpoint);
  assert.deepEqual(restored.state, checkpoint); assert.deepEqual(checkpoint, untouched);
  return restored;
}
function reward(level: number, seed: number, queue: number[], boss = false): Simulation {
  const sim = town(); buy(sim, level); assert.equal(sim.startNextDay(), true);
  // Управляемая граница генератора: одинаковый поток до предметов выявляет влияние бюджета.
  sim.state.rng = seed; sim.state.loot = [...queue]; sim.state.bossKilled = boss ? 1 : 0;
  finish(sim); if (boss) assert.equal(sim.finishLoot(), true);
  return sim;
}

test('Looter purchases use original prices at AP0 without repricing any item, prepared town or paid result', () => {
  const sim = town(); sim.state.town!.ap = 0; sim.state.gold = 299;
  const unavailable = saved(sim);
  assert.equal(sim.buyCastleUpgrade('looter'), 'not-enough-gold'); assert.deepEqual(saved(sim), unavailable);
  const costs = [300, 425, 800, 1425];
  assert.equal(castleLootMultiplier(sim.state), 1);
  for (const [level, cost] of costs.entries()) {
    sim.state.gold = cost; const before = saved(sim);
    assert.equal(castleUpgradeCost('looter', sim.state), cost);
    assert.equal(sim.buyCastleUpgrade('looter'), 'purchased');
    assert.deepEqual(saved(sim), { ...before, gold: 0, looterLevel: level + 1 });
    assert.equal(castleUpkeep(sim.state), 40 + (level + 1) * 5);
    assert.equal(sim.state.result.upkeep, 40); restore(sim);
  }
  sim.state.gold = 1000000; buy(sim, 12);
  assert.equal(castleUpgradeCost('looter', sim.state), 18300);
  assert.equal(sim.buyCastleUpgrade('looter'), 'purchased');
  assert.equal(sim.state.looterLevel, 13); restore(sim);
});

test('Looter respects battle and existing town, party and loot confirmation guards atomically', () => {
  const battle = new Simulation(42), battleBefore = saved(battle);
  assert.equal(battle.buyCastleUpgrade('looter'), 'unavailable'); assert.deepEqual(saved(battle), battleBefore);
  for (const pending of ['town', 'party', 'loot'] as const) {
    const sim = town();
    if (pending === 'town') assert.equal(sim.beginWeaponUpgrade(0), 'previewed');
    else if (pending === 'party') assert.equal(sim.requestRecruit(), 'previewed');
    else {
      assert.equal(sim.startNextDay(), true); finish(sim);
      const factory = new ItemFactory(() => 0.5); sim.state.lootOffers[0] = factory.generate(8);
      assert.equal(sim.beginLootModMount({ area: 'offers', index: 0 }, { area: 'inventory', index: 0 }), 'previewed');
    }
    const before = saved(sim);
    assert.equal(sim.buyCastleUpgrade('looter'), 'unavailable'); assert.deepEqual(saved(sim), before);
  }
});

test('purchased Looter reaches ordinary replacement and boss reward generation; the 500 floor and guaranteed loot remain unchanged', () => {
  const ordinary = reward(0, 3, [1, 2, 3, 4]), floor = reward(1, 3, [1, 2, 3, 4]), boosted = reward(10, 3, [1, 2, 3, 4]);
  assert.deepEqual(floor.state.lootOffers, ordinary.state.lootOffers);
  assert.equal(floor.state.rng, ordinary.state.rng);
  assert.notDeepEqual(boosted.state.lootOffers, ordinary.state.lootOffers);
  assert.notEqual(boosted.state.rng, ordinary.state.rng);
  const boss = reward(0, 1, [], true), bossBoosted = reward(10, 1, [], true);
  assert.equal(boss.state.postbattle, 'boss-loot');
  assert.notDeepEqual(bossBoosted.state.lootOffers, boss.state.lootOffers);
  assert.notEqual(bossBoosted.state.rng, boss.state.rng);
  const guaranteed = reward(0, 3, [1117]), guaranteedBoosted = reward(10, 3, [1117]);
  assert.deepEqual(guaranteedBoosted.state.lootOffers, guaranteed.state.lootOffers);
  assert.equal(guaranteedBoosted.state.rng, guaranteed.state.rng);
  assert.deepEqual(guaranteed.state.loot, [117]);
  for (const sim of [floor, boosted, bossBoosted, guaranteedBoosted]) restore(sim);
});

test('generated rewards never reroll after save and Looter upkeep starts with the next settlement', () => {
  let sim = town(); const paid = structuredClone(sim.state.result), prepared = structuredClone(sim.state.town);
  buy(sim, 2); assert.deepEqual(sim.state.result, paid); assert.deepEqual(sim.state.town, prepared);
  sim = restore(sim); assert.equal(sim.startNextDay(), true); sim.state.bossKilled = 1; finish(sim);
  const ordinary = saved(sim), resumed = restore(sim);
  assert.equal(sim.state.result.upkeep, 50);
  for (const current of [sim, resumed]) assert.equal(current.finishLoot(), true);
  assert.deepEqual(resumed.state, sim.state);
  const boss = saved(sim); assert.notEqual(boss.rng, ordinary.rng); restore(sim);
  const replay = restore(sim);
  for (const current of [sim, replay]) {
    while (current.state.postbattle !== 'result') {
      if (current.state.postbattle === 'skill') current.chooseSkill(current.state.skillChoices[0]);
      else current.finishLoot();
    }
  }
  assert.deepEqual(replay.state, sim.state); assert.equal(sim.state.result.upkeep, 50);
});

test('shop and recruit preparation, weapon upgrade and fixed enchant stay independent of Looter', () => {
  const sim = town(); buy(sim, 10);
  const low = restore(sim); low.state.looterLevel = 0;
  for (const current of [sim, low]) assert.equal(current.beginWeaponUpgrade(0), 'previewed');
  assert.deepEqual(sim.state.upgradeReference, low.state.upgradeReference); assert.equal(sim.state.rng, low.state.rng);
  for (const current of [sim, low]) assert.equal(current.resolveTownEquipment(false), 'cancelled');
  const factory = new ItemFactory(() => 0.5), mod = factory.generate(8); factory.setMod(mod, 4);
  for (const current of [sim, low]) {
    current.state.inventory[3] = structuredClone(mod);
    assert.equal(current.beginModMount(3, 0), 'previewed'); assert.equal(current.resolveTownEquipment(true), 'mounted');
  }
  assert.deepEqual(sim.state.inventory, low.state.inventory); assert.equal(sim.state.rng, low.state.rng);
  // Подготовка новой лавки получает одинаковый снимок после наград и одинаковый RNG.
  const pending = reward(0, 5, [1117]); settle(pending);
  const counterpart = restore(pending); counterpart.state.looterLevel = 10;
  assert.equal(pending.enterTown(), true); assert.equal(counterpart.enterTown(), true);
  assert.deepEqual(counterpart.state.town, pending.state.town);
  assert.deepEqual(counterpart.state.party, pending.state.party);
  assert.equal(counterpart.state.rng, pending.state.rng);
});

test('v20 migrates only Looter0, preserving expanded inventory, castle state, party and pending loot; v21 validates its level', () => {
  const sim = town();
  for (const kind of ['house', 'wall', 'repairman', 'sandbag', 'storage'] as const) assert.equal(sim.buyCastleUpgrade(kind), 'purchased');
  sim.state.castleHp = 43; assert.equal(sim.buyCastleUpgrade('fix-wall'), 'purchased');
  assert.equal(sim.requestRecruit(), 'previewed'); assert.equal(sim.resolvePartyAction(true), 'hired');
  assert.equal(sim.startNextDay(), true); finish(sim);
  sim.state.lootOffers[0] = new ItemFactory(() => 0.5).generate(8);
  assert.equal(sim.beginLootModMount({ area: 'offers', index: 0 }, { area: 'inventory', index: 0 }), 'previewed');
  const legacy = asLegacyV20Save(sim.toSave()), untouched = structuredClone(legacy);
  const expected = { ...legacy, version: 23, trainerLevel: 0, looterLevel: 0 };
  assert.deepEqual(Simulation.fromSave(legacy).toSave(), expected); assert.deepEqual(legacy, untouched);
  assert.deepEqual(Simulation.fromSave({ ...legacy, looterLevel: 100 }).toSave(), expected);
  for (const invalidLevel of [undefined, null, -1, 0.5, '1', Infinity, NaN]) {
    const invalid = { ...saved(sim), looterLevel: invalidLevel }, before = structuredClone(invalid);
    assert.throws(() => Simulation.fromSave(invalid)); assert.deepEqual(invalid, before);
  }
});
