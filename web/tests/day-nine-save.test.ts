import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../src/simulation.ts';

interface Boundary { finishDay(): void; prepareResult(): void; spawnEnemy(kind: 'boss'): void }
const boundary = (simulation: Simulation) => simulation as unknown as Boundary;
const restore = (simulation: Simulation) => Simulation.fromSave(JSON.parse(JSON.stringify(simulation.toSave())));
function settle(simulation: Simulation): void {
  boundary(simulation).finishDay();
  for (let step = 0; step < 30 && simulation.state.postbattle !== 'result'; step++) {
    if (simulation.state.postbattle === 'skill') assert.equal(simulation.chooseSkill(simulation.state.skillChoices[0]), true);
    else assert.equal(simulation.finishLoot(), true);
  }
  assert.equal(simulation.state.postbattle, 'result');
}
function eighthTown(): Simulation {
  const simulation = new Simulation(42);
  // Это изолированная проверка переходов, а не доказательство победы в восьми боях.
  for (let day = 1; day <= 8; day++) {
    settle(simulation); assert.equal(simulation.enterTown(), true);
    if (day < 8) assert.equal(simulation.startNextDay(), true);
  }
  return simulation;
}

test('v23 town8 migrates without rerolls and Rest transfers its prepared mission to Day9', () => {
  const simulation = eighthTown();
  assert.equal(simulation.claimTitle(), 'claimed');
  assert.equal(simulation.buyCastleUpgrade('house'), 'purchased');
  assert.equal(simulation.requestRecruit(), 'previewed'); assert.equal(simulation.resolvePartyAction(true), 'hired');
  const before = simulation.toSave(), legacy = { ...before, version: 23 };
  const untouched = structuredClone(legacy), migrated = Simulation.fromSave(legacy);
  assert.deepEqual(legacy, untouched); assert.deepEqual(migrated.toSave(), before);
  assert.equal(simulation.startNextDay(), true); assert.equal(migrated.startNextDay(), true);
  assert.deepEqual(migrated.state, simulation.state); assert.deepEqual(migrated.events, simulation.events);
  assert.equal(simulation.state.day, 9); assert.equal(simulation.state.activeMission.level, 8);
  assert.equal(simulation.state.activeMission.powerOrg, 1760); assert.equal(simulation.state.activeMission.absorbFix, 0.03);
  assert.deepEqual(simulation.state.previousTown, before.town);
  assert.equal(simulation.state.castleHp, before.castleHp); assert.equal(simulation.state.gold, before.gold);
  assert.deepEqual(simulation.state.inventory, before.inventory);
  assert.equal(simulation.state.party.slots[0].member!.name, before.party.slots[0].member!.name);
  assert.deepEqual(restore(simulation).state, simulation.state);
});

test('Day9 boss initializes HP350 and appearance59, then restores its ordinary live update exactly', () => {
  const simulation = eighthTown(); assert.equal(simulation.startNextDay(), true);
  // Пропущенные бои не создавали боссов: отдельно задаём проверяемый исходный счётчик.
  simulation.state.bossesSpawned = 8;
  boundary(simulation).spawnEnemy('boss');
  const boss = simulation.state.enemies.at(-1)!;
  assert.equal(boss.maxHp, 350); assert.equal(boss.appearance, 59);
  let resumed = restore(simulation);
  for (let frame = 0; frame < 90; frame++) {
    simulation.tick(); resumed.tick();
    assert.deepEqual(resumed.state, simulation.state); assert.deepEqual(resumed.events, simulation.events);
    if (frame === 44) resumed = restore(simulation);
  }
});

test('Day9 settles once, preserves the earned medal and prepares the first boss-day town without enabling Day10', () => {
  const simulation = eighthTown(); assert.equal(simulation.claimTitle(), 'claimed');
  assert.equal(simulation.startNextDay(), true); const beforeGold = simulation.state.gold;
  settle(simulation);
  assert.deepEqual(simulation.state.result, { reward: 760, perfectBonus: 228, upkeep: 40, tax: 115, salary: 100, wages: 0, netReward: 933 });
  assert.equal(simulation.state.gold, beforeGold + 933);
  assert.equal(simulation.state.perfectDays, 9); assert.ok(simulation.state.earnedMedals.includes(62));
  assert.equal(simulation.state.earnedMedals.includes(63), false);
  let resumed = restore(simulation), paid = resumed.toSave(); boundary(resumed).prepareResult();
  assert.deepEqual(resumed.toSave(), paid);
  assert.equal(simulation.enterTown(), true); assert.equal(resumed.enterTown(), true);
  assert.deepEqual(resumed.state, simulation.state);
  assert.ok(simulation.state.town?.preparation === 'ready');
  const mission = simulation.state.town.mission;
  assert.equal(mission.level, 9); assert.equal(mission.wave, 6); assert.equal(mission.bossDay, true); assert.equal(mission.bossWave, 5);
  assert.equal(mission.powerOrg, 1880); assert.deepEqual(mission.loot.slice(-2), [1035, 1110]);
  resumed = restore(simulation); const town = resumed.toSave();
  assert.equal(resumed.startNextDay(), false); assert.deepEqual(resumed.toSave(), town);
  assert.equal(resumed.claimTitle(), 'unavailable'); assert.deepEqual(resumed.toSave(), town);
});

test('Day9 rejects older-version claims and malformed prepared boss-day state without changing the input', () => {
  const simulation = eighthTown(); assert.equal(simulation.startNextDay(), true); settle(simulation); assert.equal(simulation.enterTown(), true);
  const valid = simulation.toSave();
  for (const change of [
    (value: any) => { value.version = 23; },
    (value: any) => { value.day = 10; },
    (value: any) => { value.town.mission.wave = 5; },
    (value: any) => { value.town.mission.bossDay = false; },
    (value: any) => { value.town.mission.bossWave = 3; },
    (value: any) => { value.town.mission.loot = [1110, 1035]; },
    (value: any) => { value.activeMission.bossDay = true; },
  ]) {
    const invalid = structuredClone(valid); change(invalid); const untouched = structuredClone(invalid);
    assert.throws(() => Simulation.fromSave(invalid)); assert.deepEqual(invalid, untouched);
  }
});
