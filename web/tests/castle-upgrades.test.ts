import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../src/simulation.ts';
import { castleUpgradeCost, castleUpkeep } from '../src/castle-upgrades.ts';
import { companionWage } from '../src/party-progression.ts';
import { asLegacyV15Save } from './legacy-save-support.ts';

type Boundary = { finishDay(): void; prepareResult(): void };
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
  // Управляемый конец боя изолирует городскую транзакцию; это не доказательство победы в бою.
  settle(simulation); assert.equal(simulation.enterTown(), true);
  return simulation;
}
function restore(simulation: Simulation): Simulation {
  const checkpoint = saved(simulation), resumed = Simulation.fromSave(checkpoint);
  assert.deepEqual(resumed.toSave(), checkpoint);
  return resumed;
}

test('House buys are immediate at AP0, preserve settled state and stop at capacity three', () => {
  const simulation = town(); simulation.state.town!.ap = 0;
  for (const [gold, cost, capacity] of [[1999, 2000, 1], [2000, 2000, 2], [5000, 5000, 3]] as const) {
    simulation.state.gold = gold;
    const before = saved(simulation);
    assert.equal(castleUpgradeCost('house', simulation.state), cost);
    assert.equal(simulation.buyCastleUpgrade('house'), gold < cost ? 'not-enough-gold' : 'purchased');
    if (gold >= cost) { before.gold -= cost; before.party.capacity = capacity; }
    assert.deepEqual(saved(simulation), before, 'only money and canonical House capacity change');
    restore(simulation);
  }
  assert.equal(castleUpgradeCost('house', simulation.state), 0);
  const capped = saved(simulation);
  assert.equal(simulation.buyCastleUpgrade('house'), 'capped');
  assert.deepEqual(saved(simulation), capped);
  assert.equal(castleUpkeep(simulation.state), 140);
});

test('Wall preserves damage deficit and recalculates its price from independent maximum HP', () => {
  let simulation = town(); simulation.state.castleHp = 30; simulation.state.gold = 239; simulation.state.town!.ap = 0;
  const insufficient = saved(simulation);
  assert.equal(simulation.buyCastleUpgrade('wall'), 'not-enough-gold');
  assert.deepEqual(saved(simulation), insufficient);
  for (const [cost, hp, maxHp, level] of [[240, 35, 45, 2], [410, 40, 50, 3]] as const) {
    simulation.state.gold = cost;
    const expected = saved(simulation);
    Object.assign(expected, { gold: 0, castleHp: hp, castleMaxHp: maxHp, wallLevel: level });
    assert.equal(castleUpgradeCost('wall', simulation.state), cost);
    assert.equal(simulation.buyCastleUpgrade('wall'), 'purchased');
    assert.deepEqual(saved(simulation), expected);
    simulation = restore(simulation);
  }
  assert.equal(castleUpgradeCost('wall', simulation.state), 600);
  assert.equal(castleUpkeep(simulation.state), 60);
  // Независимый +1 максимум соответствует исходному Search; сам Search здесь не реализован.
  simulation = town(); simulation.state.castleMaxHp = 41; simulation.state.gold = 272;
  simulation = restore(simulation);
  assert.equal(castleUpgradeCost('wall', simulation.state), 272);
  assert.equal(simulation.buyCastleUpgrade('wall'), 'purchased');
  assert.deepEqual([simulation.state.wallLevel, simulation.state.castleHp, simulation.state.castleMaxHp], [2, 45, 46]);
  assert.equal(castleUpkeep(simulation.state), 52);
  restore(simulation);
});

test('pending town and party confirmations block Castle purchases without any side effect', () => {
  const simulation = town(); simulation.state.gold = 10000;
  assert.equal(simulation.beginWeaponUpgrade(0), 'previewed');
  let checkpoint = saved(simulation);
  assert.equal(simulation.buyCastleUpgrade('wall'), 'unavailable');
  assert.deepEqual(saved(simulation), checkpoint);
  assert.equal(simulation.resolveTownEquipment(false), 'cancelled');
  assert.equal(simulation.requestRecruit(), 'previewed');
  checkpoint = saved(simulation);
  assert.equal(simulation.buyCastleUpgrade('house'), 'unavailable');
  assert.deepEqual(saved(simulation), checkpoint);
  assert.equal(simulation.resolvePartyAction(false), 'cancelled');
  assert.equal(simulation.startNextDay(), true);
  checkpoint = saved(simulation);
  assert.equal(simulation.buyCastleUpgrade('wall'), 'unavailable');
  assert.equal(simulation.buyCastleUpgrade('fix-wall' as 'wall'), 'unavailable');
  assert.deepEqual(saved(simulation), checkpoint);
});

test('upgraded HP survives Rest, repairs to the new maximum and changes only the next settlement upkeep', () => {
  let simulation = town(); simulation.state.gold = 3000; simulation.state.castleHp = 30;
  const paidResult = structuredClone(simulation.state.result);
  assert.equal(simulation.buyCastleUpgrade('house'), 'purchased');
  assert.equal(simulation.buyCastleUpgrade('wall'), 'purchased');
  assert.deepEqual(simulation.state.result, paidResult);
  const paid = saved(simulation); boundary(simulation).prepareResult(); assert.deepEqual(saved(simulation), paid);
  assert.equal(simulation.freeRepair(), 'repaired'); assert.equal(simulation.state.castleHp, 45);
  simulation = restore(simulation);
  assert.equal(simulation.startNextDay(), true);
  assert.deepEqual([simulation.state.castleHp, simulation.state.castleMaxHp, simulation.state.wallLevel, simulation.state.party.capacity], [45, 45, 2, 2]);
  simulation = restore(simulation);
  const before = saved(simulation);
  settle(simulation);
  assert.equal(simulation.state.result.upkeep, 100);
  assert.equal(simulation.state.gold, before.gold + simulation.state.result.netReward);
  const settled = saved(simulation); boundary(simulation).prepareResult(); assert.deepEqual(saved(simulation), settled);
  restore(simulation);
});

test('House purchases unlock actual generated candidates in all three permanent slots and retain their wages and replay', () => {
  let simulation = town();
  // Капитал задан явно для проверки вместимости; кандидаты каждого дня генерируются обычным городом.
  simulation.state.gold = 20000;
  for (let slot = 1; slot <= 3; slot++) {
    if (slot > 1) assert.equal(simulation.buyCastleUpgrade('house'), 'purchased');
    const candidate = structuredClone(simulation.state.party.slots[4]);
    assert.equal(simulation.requestRecruit(), 'previewed');
    assert.equal(simulation.resolvePartyAction(true), 'hired');
    assert.deepEqual(simulation.state.party.slots[slot - 1].member, candidate.member);
    assert.deepEqual(simulation.state.party.slots[slot - 1].weapon, candidate.weapon);
    simulation = restore(simulation);
    assert.equal(simulation.startNextDay(), true);
    assert.deepEqual(simulation.state.partySkills.guardianSlots, Array.from({ length: slot + 1 }, (_, index) => index));
    if (slot < 3) { settle(simulation); assert.equal(simulation.enterTown(), true); }
  }
  const resumed = restore(simulation);
  for (let frame = 0; frame < 90; frame++) {
    simulation.tick(); resumed.tick();
    assert.deepEqual(resumed.toSave(), simulation.toSave()); assert.deepEqual(resumed.events, simulation.events);
  }
  settle(simulation);
  assert.equal(simulation.state.result.upkeep, 140);
  const wages = simulation.state.party.slots.slice(0, 3).reduce((sum, slot) => sum + companionWage(slot.member!, simulation.state.partySkills.effects[127], simulation.state.earnedMedals.includes(92)), 0);
  assert.equal(simulation.state.result.wages, wages); assert.ok(wages > 0);
  restore(simulation);
});

test('v15 migration adds Wall1 without recomputing party, money, paid results or RNG', () => {
  const simulation = town();
  assert.equal(simulation.requestRecruit(), 'previewed'); assert.equal(simulation.resolvePartyAction(true), 'hired');
  const legacy = asLegacyV15Save(simulation.toSave()), untouched = structuredClone(legacy);
  const expected = { ...legacy, version: 19, wallLevel: 1, wallFixCount: 0, repairmanLevel: 0, sandbagLevel: 0 };
  assert.deepEqual(Simulation.fromSave(legacy).toSave(), expected);
  assert.deepEqual(legacy, untouched);
  const stray = { ...legacy, wallLevel: 1234 };
  assert.deepEqual(Simulation.fromSave(stray).toSave(), expected, 'unrecognized old fields cannot manufacture upgrades');
});

test('v16 rejects inconsistent Castle levels, maximum HP and capacity without changing import input', () => {
  const simulation = town(); simulation.state.gold = 1000;
  assert.equal(simulation.buyCastleUpgrade('wall'), 'purchased');
  const checkpoint = saved(simulation);
  for (const corrupt of [
    (value: any) => { delete value.wallLevel; },
    (value: any) => { value.wallLevel = 0; },
    (value: any) => { value.wallLevel = 1.5; },
    (value: any) => { value.wallLevel = 3; },
    (value: any) => { value.castleMaxHp = 44.5; },
    (value: any) => { value.castleHp = 46; },
    (value: any) => { value.party.capacity = 4; },
    (value: any) => { value.version = 15; },
  ]) {
    const invalid = structuredClone(checkpoint); corrupt(invalid); const before = structuredClone(invalid);
    assert.throws(() => Simulation.fromSave(invalid)); assert.deepEqual(invalid, before);
  }
});
