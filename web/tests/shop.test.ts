import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../src/simulation.ts';
import { ItemFactory, isOccupiedItem, itemPrice } from '../src/items.ts';
import { prepareFirstTown } from '../src/town-preparation.ts';

function town(seed = 42): Simulation {
  const simulation = new Simulation(seed);
  (simulation as unknown as { finishDay(): void }).finishDay();
  while (simulation.state.postbattle !== 'result') {
    if (simulation.state.postbattle === 'skill') simulation.chooseSkill(simulation.state.skillChoices[0]);
    else simulation.finishLoot();
  }
  simulation.enterTown();
  return simulation;
}

function prepared(simulation: Simulation) {
  const value = simulation.state.town;
  assert.ok(value?.preparation === 'ready');
  return value;
}

function resume(simulation: Simulation): Simulation {
  const saved = JSON.parse(JSON.stringify(simulation.toSave()));
  const restored = Simulation.fromSave(saved);
  assert.deepEqual(restored.state, saved);
  return restored;
}

test('town entry transfers inactive reward history into the original preparation sequence', () => {
  const simulation = new Simulation(42);
  (simulation as unknown as { finishDay(): void }).finishDay();
  const factory = new ItemFactory(() => 0.5);
  simulation.state.lootOffers[7] = factory.generate(16);
  simulation.finishLoot();
  const result = simulation.toSave();
  assert.equal(result.lootOffers[7]!.num, 0);
  const control = Simulation.fromSave(result) as Simulation & { random(): number };
  const expected = prepareFirstTown(() => control.random(), { priorOffers: result.lootOffers, absorbFix: 0.01, shopEngineer: 0, missionNegotiator: 0, recruitEngineer: 0 });
  assert.equal(simulation.enterTown(), true);
  assert.deepEqual(prepared(simulation), { ap: 4, preparation: 'ready', ...expected });
  assert.deepEqual(prepared(simulation).shop[7], result.lootOffers[7]);
  assert.deepEqual(simulation.state.lootOffers, Array(8).fill(null));
  assert.equal(simulation.state.rng, control.state.rng);
  resume(simulation);
});

test('purchase transfers every field, preserves inactive destination history, and resumes without restock', () => {
  let simulation = town();
  const stock = prepared(simulation).shop[0]!;
  const old = new ItemFactory(() => 0.5).generate(11); old.num = 0;
  simulation.state.inventory[2] = old;
  simulation.state.gold = 10000;
  const before = simulation.toSave();
  const price = Math.trunc(stock.value);
  assert.equal(simulation.buyStock(0, 2), 'purchased');
  assert.equal(simulation.state.gold, before.gold - price);
  assert.equal(simulation.state.inventory[2], stock);
  assert.equal(prepared(simulation).shop[0], old);
  assert.equal(simulation.state.totalMoney, before.totalMoney);
  assert.equal(simulation.state.rng, before.rng);
  simulation = resume(simulation);
  const bought = simulation.toSave();
  assert.equal(simulation.buyStock(0, 3), 'unavailable');
  assert.deepEqual(simulation.toSave(), bought);
});

test('occupied destinations, insufficient gold, invalid indices and unavailable stages are atomic failures', () => {
  const simulation = town();
  simulation.state.gold = 0;
  for (const [stock, slot, outcome] of [[0, 0, 'occupied'], [0, 2, 'not-enough-gold'], [-1, 2, 'unavailable'], [8, 2, 'unavailable'], [0, 6, 'unavailable'], [0.5, 2, 'unavailable']] as const) {
    const before = simulation.toSave();
    assert.equal(simulation.buyStock(stock, slot), outcome);
    assert.deepEqual(simulation.toSave(), before);
  }
  const battle = new Simulation(1), before = battle.toSave();
  assert.equal(battle.buyStock(0, 2), 'unavailable');
  assert.equal(battle.sellTownItem(0), null);
  assert.equal(battle.moveTownItem(0, 5), false);
  assert.equal(battle.applyShopToken(0, 0), false);
  assert.deepEqual(battle.toSave(), before);
});

test('confirmed sales preserve metadata, use original prices, and credit earned money exactly once', () => {
  const simulation = town();
  const factory = new ItemFactory(() => 0.5);
  simulation.state.inventory[2] = factory.generate(117);
  for (const slot of [2, 0, 1]) {
    const item = structuredClone(simulation.state.inventory[slot]!);
    const before = simulation.toSave();
    const price = itemPrice(item);
    assert.equal(simulation.sellTownItem(slot), price);
    assert.deepEqual(simulation.state.inventory[slot], { ...item, num: 0 });
    assert.equal(simulation.state.gold, before.gold + price);
    assert.equal(simulation.state.totalMoney, before.totalMoney + price);
    assert.equal(simulation.state.rng, before.rng);
    assert.deepEqual(prepared(simulation).shop, (before.town as ReturnType<typeof prepared>).shop);
    const sold = simulation.toSave();
    assert.equal(simulation.sellTownItem(slot), null);
    assert.deepEqual(simulation.toSave(), sold);
    resume(simulation);
  }
});

test('tokens discount stored stock price, consume only occupancy, and permit a zero-price purchase', () => {
  const simulation = town();
  const token = new ItemFactory(() => 0.5).generate(35);
  simulation.state.inventory[2] = token;
  prepared(simulation).shop[0]!.value = 100.75;
  const before = simulation.toSave();
  assert.equal(simulation.applyShopToken(2, 0), true);
  assert.equal(token.num, 0);
  assert.equal(prepared(simulation).shop[0]!.value, 0);
  assert.equal(simulation.state.gold, before.gold);
  assert.equal(simulation.state.totalMoney, before.totalMoney);
  assert.equal(simulation.state.rng, before.rng);
  const consumed = simulation.toSave();
  assert.equal(simulation.applyShopToken(2, 0), false);
  assert.deepEqual(simulation.toSave(), consumed);
  simulation.state.gold = 0;
  assert.equal(simulation.buyStock(0, 2), 'purchased');
  assert.equal(simulation.state.gold, 0);
  resume(simulation);
});

test('a token without its discount amount is rejected before it can corrupt stock or be consumed', () => {
  const simulation = town();
  const token = new ItemFactory(() => 0.5).generate(35);
  simulation.state.inventory[2] = token;
  delete token.attack;
  const invalid = simulation.toSave();
  assert.throws(() => Simulation.fromSave(invalid));
  assert.equal(simulation.applyShopToken(2, 0), false);
  assert.deepEqual(simulation.toSave(), invalid);
});

test('inventory moves retain full items and reject unimplemented MOD mounting without mutation', () => {
  const simulation = town();
  const factory = new ItemFactory(() => 0.5);
  simulation.state.inventory[2] = factory.generate(8);
  const before = simulation.toSave();
  assert.equal(simulation.moveTownItem(2, 0), false);
  assert.deepEqual(simulation.toSave(), before);
  assert.equal(simulation.moveTownItem(0, 5), true);
  assert.equal(isOccupiedItem(simulation.state.inventory[0]), false);
  assert.deepEqual(simulation.state.inventory[5], before.inventory[0]);
  assert.equal(simulation.moveTownItem(2, 0), true);
  assert.deepEqual(simulation.state.inventory[0], before.inventory[2]);
  resume(simulation);
});

test('prepared-town imports reject malformed generated data before changing a usable state', () => {
  const simulation = town(), before = simulation.toSave();
  const changes: ((value: any) => void)[] = [
    value => { value.town.shop.pop(); }, value => { value.town.shop[0].num = -1; },
    value => { value.town.cards = [-7, -7, -7, -7, -7]; }, value => { value.town.mission.reward = 1; },
    value => { value.town.recruit.items[45].ammo = NaN; }, value => { value.town.recruit.pic = 22; },
    value => { value.town.searched = 1000; }, value => { value.town.flags.prayed = true; },
    value => { value.totalMoney = -1; }, value => { value.lootOffers[0] = { ...value.town.shop[0], num: 0 }; },
  ];
  for (const change of changes) {
    const value = structuredClone(before); change(value);
    assert.throws(() => Simulation.fromSave(value));
    assert.deepEqual(simulation.toSave(), before);
  }
});
