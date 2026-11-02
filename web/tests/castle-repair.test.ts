import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../src/simulation.ts';
import { castleUpgradeCost, castleUpkeep, castleRepairAmount } from '../src/castle-upgrades.ts';
import { asLegacyV16Save } from './legacy-save-support.ts';

type Boundary = { finishDay(): void; timerTick(): void; prepareResult(): void };
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
  // Только конец боя задан стендом; покупки, награды, переходы и сохранения выполняет обычный API.
  settle(simulation); assert.equal(simulation.enterTown(), true);
  return simulation;
}
function restore(simulation: Simulation): Simulation {
  const checkpoint = saved(simulation), resumed = Simulation.fromSave(checkpoint);
  assert.deepEqual(resumed.toSave(), checkpoint); return resumed;
}

test('paid Fix Wall charges the deficit at AP0 and increments only its independent purchase counter', () => {
  let simulation = town(); simulation.state.castleHp = 30; simulation.state.gold = 79; simulation.state.town!.ap = 0;
  assert.equal(castleUpgradeCost('fix-wall', simulation.state), 80);
  const insufficient = saved(simulation);
  assert.equal(simulation.buyCastleUpgrade('fix-wall'), 'not-enough-gold');
  assert.deepEqual(saved(simulation), insufficient);
  simulation.state.gold = 80;
  const expected = saved(simulation);
  Object.assign(expected, { gold: 0, castleHp: 40, wallFixCount: 1 });
  assert.equal(simulation.buyCastleUpgrade('fix-wall'), 'purchased');
  assert.deepEqual(saved(simulation), expected, 'no AP, RNG, totalMoney, level, preparation or settled-result change');
  simulation = restore(simulation);
  assert.equal(castleUpgradeCost('fix-wall', simulation.state), 0);
  assert.equal(simulation.buyCastleUpgrade('fix-wall'), 'capped'); assert.deepEqual(saved(simulation), expected);
  assert.equal(castleUpkeep(simulation.state), 40, 'the paid-repair counter has no continuing upkeep');
  simulation.state.gold = 1000; assert.equal(simulation.buyCastleUpgrade('wall'), 'purchased');
  simulation.state.castleHp = 41;
  assert.equal(castleUpgradeCost('fix-wall', simulation.state), 32);
  assert.equal(simulation.buyCastleUpgrade('fix-wall'), 'purchased');
  assert.deepEqual([simulation.state.wallFixCount, simulation.state.wallLevel, simulation.state.castleHp, simulation.state.castleMaxHp], [2, 2, 45, 45]);
  restore(simulation);
});

test('Repairman buys use the current level price, do not heal immediately and charge only later upkeep', () => {
  let simulation = town(); simulation.state.castleHp = 30; simulation.state.gold = 699; simulation.state.town!.ap = 0;
  const insufficient = saved(simulation);
  assert.equal(simulation.buyCastleUpgrade('repairman'), 'not-enough-gold'); assert.deepEqual(saved(simulation), insufficient);
  for (const [cost, level] of [[700, 1], [950, 2]] as const) {
    simulation.state.gold = cost; const expected = saved(simulation);
    assert.equal(castleUpgradeCost('repairman', simulation.state), cost);
    expected.gold = 0; expected.repairmanLevel = level;
    assert.equal(simulation.buyCastleUpgrade('repairman'), 'purchased'); assert.deepEqual(saved(simulation), expected);
    simulation = restore(simulation);
  }
  assert.equal(castleUpgradeCost('repairman', simulation.state), 1700);
  assert.equal(castleRepairAmount(simulation.state), 4);
  assert.equal(castleUpkeep(simulation.state), 160);
  assert.equal(simulation.state.result.upkeep, 40);
  const paid = saved(simulation); boundary(simulation).prepareResult(); assert.deepEqual(saved(simulation), paid);
  assert.equal(simulation.startNextDay(), true); assert.equal(simulation.state.castleHp, 30);
  settle(simulation); assert.equal(simulation.state.result.upkeep, 160);
  restore(simulation);
});

test('Fix Wall and Repairman respect pending party/equipment actions and cannot be bought in battle', () => {
  const simulation = town(); simulation.state.gold = 10000; simulation.state.castleHp = 25;
  assert.equal(simulation.beginWeaponUpgrade(0), 'previewed');
  let before = saved(simulation);
  for (const kind of ['fix-wall', 'repairman'] as const) assert.equal(simulation.buyCastleUpgrade(kind), 'unavailable');
  assert.deepEqual(saved(simulation), before); assert.equal(simulation.resolveTownEquipment(false), 'cancelled');
  assert.equal(simulation.requestRecruit(), 'previewed'); before = saved(simulation);
  for (const kind of ['fix-wall', 'repairman'] as const) assert.equal(simulation.buyCastleUpgrade(kind), 'unavailable');
  assert.deepEqual(saved(simulation), before); assert.equal(simulation.resolvePartyAction(false), 'cancelled');
  assert.equal(simulation.startNextDay(), true); before = saved(simulation);
  for (const kind of ['fix-wall', 'repairman'] as const) assert.equal(simulation.buyCastleUpgrade(kind), 'unavailable');
  assert.deepEqual(saved(simulation), before);
});

test('opening and ordinary wave boundaries heal before testing remaining damage, without restoring a lost perfect flag', () => {
  for (const row of [
    { wave: 5, hp: 39, level: 1, beforePerfect: true, hpAfter: 40, perfectAfter: true },
    { wave: 3, hp: 36, level: 2, beforePerfect: true, hpAfter: 40, perfectAfter: true },
    { wave: 1, hp: 35, level: 2, beforePerfect: true, hpAfter: 39, perfectAfter: false },
    { wave: 2, hp: 39, level: 1, beforePerfect: false, hpAfter: 40, perfectAfter: false },
    { wave: 4, hp: 39, level: 0, beforePerfect: true, hpAfter: 39, perfectAfter: false },
  ]) {
    const simulation = new Simulation(42), state = simulation.state;
    Object.assign(state, { waveIndex: row.wave, newWave: true, castleHp: row.hp, repairmanLevel: row.level, noDamage: row.beforePerfect });
    const rng = state.rng;
    boundary(simulation).timerTick();
    assert.deepEqual({ hp: state.castleHp, wave: state.waveIndex, newWave: state.newWave, perfect: state.noDamage, rng: state.rng },
      { hp: row.hpAfter, wave: row.wave - 1, newWave: false, perfect: row.perfectAfter, rng });
    assert.ok(simulation.events.every(event => event.type !== 'repair'), 'source wave repair is silent');
    state.spawnTimer = 1000;
    for (let timer = 0; timer < 10; timer++) boundary(simulation).timerTick();
    assert.equal(state.castleHp, row.hpAfter, 'there is no continuous healing between wave boundaries');
  }
});

test('final boundary cannot repair a deficit or rescue a destroyed castle', () => {
  const simulation = new Simulation(42);
  Object.assign(simulation.state, { waveIndex: 0, newWave: true, castleHp: 39, repairmanLevel: 10, noDamage: true });
  boundary(simulation).timerTick();
  assert.equal(simulation.state.phase, 'victory'); assert.equal(simulation.state.castleHp, 39);
  assert.equal(simulation.state.noDamage, false); assert.equal(simulation.state.result.perfectBonus, 0);
  assert.equal(simulation.state.result.upkeep, 640);
  const lethal = new Simulation(42);
  Object.assign(lethal.state, { castleHp: 0, repairmanLevel: 10 });
  const before = saved(lethal); boundary(lethal).timerTick();
  assert.equal(lethal.state.phase, 'defeat'); assert.equal(lethal.state.castleHp, 0);
  assert.equal(lethal.state.waveIndex, before.waveIndex); assert.equal(lethal.state.newWave, true);
  assert.equal(lethal.state.rng, before.rng); assert.deepEqual(lethal.events, [{ type: 'defeat' }]);
});

test('Repairman opening trigger survives an in-flight timer accumulator save and Free Repair leaves paid history unchanged', () => {
  let simulation = town(); simulation.state.gold = 3000;
  assert.equal(simulation.buyCastleUpgrade('wall'), 'purchased');
  assert.equal(simulation.buyCastleUpgrade('repairman'), 'purchased');
  assert.equal(simulation.buyCastleUpgrade('repairman'), 'purchased');
  simulation.state.castleHp = 40;
  assert.equal(simulation.buyCastleUpgrade('fix-wall'), 'purchased');
  simulation.state.castleHp = 43; assert.equal(simulation.freeRepair(), 'repaired'); assert.equal(simulation.state.wallFixCount, 1);
  simulation.state.castleHp = 43; assert.equal(simulation.startNextDay(), true);
  simulation.tick(); assert.equal(simulation.state.timerRemainder, 20); assert.equal(simulation.state.castleHp, 43);
  const resumed = restore(simulation);
  for (let frame = 0; frame < 12; frame++) {
    simulation.tick(); resumed.tick();
    assert.deepEqual(resumed.toSave(), simulation.toSave()); assert.deepEqual(resumed.events, simulation.events);
  }
  assert.equal(simulation.state.castleHp, 45); assert.equal(simulation.state.noDamage, true);
  assert.equal(simulation.state.wallFixCount, 1); assert.equal(simulation.state.repairmanLevel, 2);
});

test('v16 migration preserves upgraded walls and party state while new repair fields default without RNG', () => {
  const simulation = town(); simulation.state.gold = 4000;
  assert.equal(simulation.buyCastleUpgrade('house'), 'purchased'); assert.equal(simulation.buyCastleUpgrade('wall'), 'purchased');
  assert.equal(simulation.requestRecruit(), 'previewed'); assert.equal(simulation.resolvePartyAction(true), 'hired');
  const legacy = asLegacyV16Save(simulation.toSave()), before = structuredClone(legacy);
  const expected = { ...legacy, version: 22, trainerLevel: 0, looterLevel: 0, pendingLootAction: null, wallFixCount: 0, repairmanLevel: 0, sandbagLevel: 0 };
  assert.deepEqual(Simulation.fromSave(legacy).toSave(), expected); assert.deepEqual(legacy, before);
  assert.deepEqual(Simulation.fromSave({ ...legacy, wallFixCount: 40, repairmanLevel: 999 }).toSave(), expected);
  const current = saved(simulation);
  for (const field of ['wallFixCount', 'repairmanLevel']) for (const bad of [undefined, -1, 0.5, '1', null, Infinity]) {
    const invalid = structuredClone(current); invalid[field] = bad; const untouched = structuredClone(invalid);
    assert.throws(() => Simulation.fromSave(invalid)); assert.deepEqual(invalid, untouched);
  }
});
