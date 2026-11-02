import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation, type EnemyState } from '../src/simulation.ts';
import { castleDamageMultiplier, castleUpgradeCost, castleUpkeep } from '../src/castle-upgrades.ts';
import { TRAIT } from '../src/progression.ts';
import { asLegacyV17Save } from './legacy-save-support.ts';

type Boundary = { finishDay(): void; prepareResult(): void; spawnEnemy(kind: 'rat'): void; damageCastle(amount: number, attacker?: EnemyState): void; refreshPartySkills(): void };
const boundary = (simulation: Simulation) => simulation as unknown as Boundary;
const saved = (simulation: Simulation) => JSON.parse(JSON.stringify(simulation.toSave()));
function settle(simulation: Simulation): void {
  boundary(simulation).finishDay();
  while (simulation.state.postbattle !== 'result') {
    if (simulation.state.postbattle === 'skill') assert.equal(simulation.chooseSkill(simulation.state.skillChoices[0]), true);
    else assert.equal(simulation.finishLoot(), true);
  }
}
function town(): Simulation {
  const simulation = new Simulation(42);
  // Контролируемый конец боя; пропуск perfect исключает медаль из проверки нового множителя.
  simulation.state.noDamage = false;
  settle(simulation); assert.equal(simulation.enterTown(), true); return simulation;
}
function restore(simulation: Simulation): Simulation {
  const value = saved(simulation), resumed = Simulation.fromSave(value);
  assert.deepEqual(resumed.toSave(), value); return resumed;
}

test('Sandbag purchases use original prices, work at AP0, preserve unrelated state and cap at ten', () => {
  let simulation = town(); simulation.state.gold = 999; simulation.state.town!.ap = 0;
  const before = saved(simulation);
  assert.equal(simulation.buyCastleUpgrade('sandbag'), 'not-enough-gold'); assert.deepEqual(saved(simulation), before);
  const prices = [1000, 1240, 1960, 3160, 4840, 7000, 9640, 12760, 16360, 20440];
  for (const [level, price] of prices.entries()) {
    simulation.state.gold = price;
    const expected = saved(simulation); expected.gold = 0; expected.sandbagLevel = level + 1;
    assert.equal(castleUpgradeCost('sandbag', simulation.state), price);
    assert.equal(simulation.buyCastleUpgrade('sandbag'), 'purchased');
    assert.deepEqual(saved(simulation), expected, 'only gold and Sandbag level change');
    simulation = restore(simulation);
  }
  assert.equal(castleUpgradeCost('sandbag', simulation.state), 0);
  assert.equal(castleDamageMultiplier(simulation.state), 0.5);
  assert.equal(castleUpkeep(simulation.state), 440);
  const capped = saved(simulation);
  assert.equal(simulation.buyCastleUpgrade('sandbag'), 'capped'); assert.deepEqual(saved(simulation), capped);
});

test('pending town/party confirmation and battle state block Sandbag purchases atomically', () => {
  const simulation = town(); simulation.state.gold = 10000;
  assert.equal(simulation.beginWeaponUpgrade(0), 'previewed');
  let before = saved(simulation);
  assert.equal(simulation.buyCastleUpgrade('sandbag'), 'unavailable'); assert.deepEqual(saved(simulation), before);
  assert.equal(simulation.resolveTownEquipment(false), 'cancelled');
  assert.equal(simulation.requestRecruit(), 'previewed'); before = saved(simulation);
  assert.equal(simulation.buyCastleUpgrade('sandbag'), 'unavailable'); assert.deepEqual(saved(simulation), before);
  assert.equal(simulation.resolvePartyAction(false), 'cancelled'); assert.equal(simulation.startNextDay(), true);
  before = saved(simulation);
  assert.equal(simulation.buyCastleUpgrade('sandbag'), 'unavailable'); assert.deepEqual(saved(simulation), before);
});

test('castle damage truncates the argument before scaling, subtracts mission absorption and retains minimum one', () => {
  // Входы изолируют double→int и сложение поглощений, а не выдают их за естественные удары дня1.
  for (const [level, absorption, amount, expected] of [
    [0, 0, 10.9, 10], [1, 0.01, 10.9, 9], [10, 0.02, 100, 48], [10, 0.02, 1.9, 1], [10, 0, 0, 1],
  ]) {
    const simulation = new Simulation(42);
    simulation.state.sandbagLevel = level; simulation.state.activeMission.absorbFix = absorption;
    boundary(simulation).damageCastle(amount);
    assert.equal(simulation.state.castleHp, 40 - expected);
    assert.deepEqual(simulation.events.filter(event => event.type === 'castle-hit').map(event => event.amount), [expected]);
  }
});

test('a real Rat attack uses purchased Sandbag after Rest and replays exactly across its hit frame', () => {
  const simulation = town(); simulation.state.gold = 1000;
  assert.equal(simulation.buyCastleUpgrade('sandbag'), 'purchased'); assert.equal(simulation.startNextDay(), true);
  assert.equal(simulation.state.activeMission.absorbFix, 0);
  while (simulation.state.newWave) simulation.tick();
  simulation.state.spawnTimer = 1000;
  boundary(simulation).spawnEnemy('rat');
  const rat = simulation.state.enemies.at(-1)!;
  // Сдвигаем только позицию/кадр настоящего актёра к границе удара, сохраняя исходную атаку2.
  Object.assign(rat, { x: 455, frame: 59, attacking: true, speed: 0 });
  const resumed = restore(simulation), baseline = restore(simulation);
  baseline.state.sandbagLevel = 0;
  const beforeHp = simulation.state.castleHp;
  simulation.tick(); resumed.tick(); baseline.tick();
  assert.equal(rat.frame, 60); assert.equal(simulation.state.castleHp, beforeHp - 1);
  assert.equal(baseline.state.castleHp, beforeHp - 2);
  assert.equal(simulation.state.rng, baseline.state.rng, 'the multiplier adds no random draws');
  assert.deepEqual(resumed.toSave(), simulation.toSave()); assert.deepEqual(resumed.events, simulation.events);
  for (let frame = 0; frame < 20; frame++) {
    simulation.tick(); resumed.tick();
    assert.deepEqual(resumed.toSave(), simulation.toSave()); assert.deepEqual(resumed.events, simulation.events);
  }
});

test('protection still precedes Insurance and Defender while unblocked hits preserve their random stream', () => {
  const configure = (level: number) => {
    const simulation = new Simulation(42);
    simulation.state.sandbagLevel = level;
    simulation.state.player.traits[TRAIT.INSURANCE] = 1;
    boundary(simulation).refreshPartySkills(); return simulation;
  };
  const protectedSim = configure(10); protectedSim.state.protection.counter = 2;
  const protectedBefore = saved(protectedSim);
  boundary(protectedSim).damageCastle(20);
  assert.deepEqual(saved(protectedSim), protectedBefore); assert.deepEqual(protectedSim.events, [{ type: 'defend' }]);
  const normal = configure(0), sandbag = configure(10);
  const gold = normal.state.gold, totalMoney = normal.state.totalMoney;
  boundary(normal).damageCastle(20); boundary(sandbag).damageCastle(20);
  assert.equal(normal.state.castleHp, 20); assert.equal(sandbag.state.castleHp, 30);
  assert.equal(normal.state.gold, gold + 2); assert.equal(sandbag.state.gold, gold + 2);
  assert.equal(sandbag.state.totalMoney, totalMoney + 2); assert.equal(sandbag.state.rng, normal.state.rng);
  const blocked = configure(10); blocked.state.player.traits[TRAIT.DEFENDER] = 1;
  boundary(blocked).refreshPartySkills(); blocked.state.rng = 42;
  boundary(blocked).damageCastle(20);
  assert.equal(blocked.state.castleHp, 40); assert.equal(blocked.state.gold, gold + 2);
  assert.deepEqual(blocked.events, [{ type: 'defend' }]);
});

test('Sandbag upkeep begins next settlement and preserves prior Wall, Repairman and companion state through v17 migration', () => {
  let simulation = town(); simulation.state.gold = 10000;
  assert.equal(simulation.buyCastleUpgrade('house'), 'purchased'); assert.equal(simulation.buyCastleUpgrade('wall'), 'purchased');
  assert.equal(simulation.buyCastleUpgrade('repairman'), 'purchased'); simulation.state.castleHp = 43;
  assert.equal(simulation.buyCastleUpgrade('fix-wall'), 'purchased');
  assert.equal(simulation.requestRecruit(), 'previewed'); assert.equal(simulation.resolvePartyAction(true), 'hired');
  const legacy = asLegacyV17Save(simulation.toSave()), before = structuredClone(legacy);
  const expected = { ...legacy, version: 23, trainerLevel: 0, looterLevel: 0, pendingLootAction: null, sandbagLevel: 0 };
  assert.deepEqual(Simulation.fromSave(legacy).toSave(), expected); assert.deepEqual(legacy, before);
  assert.deepEqual(Simulation.fromSave({ ...legacy, sandbagLevel: 10 }).toSave(), expected);
  const paidResult = structuredClone(simulation.state.result);
  assert.equal(simulation.buyCastleUpgrade('sandbag'), 'purchased'); assert.equal(simulation.buyCastleUpgrade('sandbag'), 'purchased');
  assert.deepEqual(simulation.state.result, paidResult);
  const paid = saved(simulation); boundary(simulation).prepareResult(); assert.deepEqual(saved(simulation), paid);
  simulation = restore(simulation);
  assert.equal(simulation.startNextDay(), true);
  assert.deepEqual([simulation.state.wallLevel, simulation.state.wallFixCount, simulation.state.repairmanLevel, simulation.state.sandbagLevel, simulation.state.party.capacity], [2, 1, 1, 2, 2]);
  assert.equal(simulation.state.party.slots[0].exists, true); assert.equal(simulation.state.castleMaxHp, 45);
  settle(simulation); assert.equal(simulation.state.result.upkeep, 240); assert.ok(simulation.state.result.wages > 0);
  restore(simulation);
});

test('v18 requires a finite integer Sandbag level from zero through ten and never mutates invalid imports', () => {
  const value = saved(town());
  for (const invalidLevel of [undefined, null, '1', -1, 0.5, 11, Infinity, NaN]) {
    const invalid = structuredClone(value); invalid.sandbagLevel = invalidLevel; const before = structuredClone(invalid);
    assert.throws(() => Simulation.fromSave(invalid), /Invalid Sandbag/); assert.deepEqual(invalid, before);
  }
});
