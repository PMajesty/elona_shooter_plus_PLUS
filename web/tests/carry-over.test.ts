import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { Simulation, type SimulationOptions, type SimulationState } from '../src/simulation.ts';
import { SAVE_VERSION } from '../src/save-version.ts';
import { HERO_CLASSES } from '../src/hero-classes.ts';

function town(options: SimulationOptions = {}): Simulation {
  const sim = new Simulation(42, options);
  sim['finishDay']();
  while (['loot', 'boss-loot'].includes(sim.state.postbattle)) sim.finishLoot();
  while (sim.state.postbattle === 'skill') sim.chooseSkill(sim.state.skillChoices[0]);
  assert.ok(sim.enterTown());
  return sim;
}
function lose(sim: Simulation, earnings = 50): void {
  sim.state.gold += earnings;
  sim.state.player.exp += 123;
  sim.state.inventory[0]!.ammo = 0;
  sim.state.castleHp = 0;
  for (let i = 0; i < 3 && sim.state.phase === 'battle'; i++) sim.tick();
  assert.equal(sim.state.phase, 'defeat');
}

test('Carry Over restores the full last town, grants source money and AP, and retains independently earned medals', () => {
  for (const earnings of [-50, 50, 731]) {
    const sim = town({ heroClass: 'hunter', mode: 'casual', mods: { laptop: true } });
    const checkpoint = sim.toSave();
    assert.ok(sim.startNextDay()); lose(sim, earnings);
    sim.state.earnedMedals.push(70);
    const snapshot = JSON.stringify(checkpoint);
    assert.ok(sim.canCarryOver(checkpoint)); assert.ok(sim.carryOver(checkpoint));
    const expected = { ...checkpoint, gold: checkpoint.gold + Math.max(200, earnings), carryOver: true,
      town: { ...checkpoint.town!, ap: checkpoint.town!.ap + 1 }, earnedMedals: [...new Set([...checkpoint.earnedMedals, 70])] };
    assert.deepEqual(sim.toSave(), expected);
    assert.equal(JSON.stringify(checkpoint), snapshot);
    assert.equal(sim.state.totalMoney, checkpoint.totalMoney);
  }
});

test('repeated Carry Over is deterministic across JSON restoration and does not accumulate nested checkpoints', () => {
  const sim = town(); const checkpoint = sim.toSave();
  assert.ok(sim.startNextDay()); lose(sim); assert.ok(sim.carryOver(checkpoint));
  const retry = sim.toSave(), restored = Simulation.fromSave(JSON.parse(JSON.stringify(retry)));
  for (const game of [sim, restored]) { assert.ok(game.startNextDay()); lose(game, 400); assert.ok(game.carryOver(retry)); }
  assert.deepEqual(restored.toSave(), sim.toSave());
  assert.equal(sim.state.gold, checkpoint.gold + 600);
  assert.equal(sim.state.town!.ap, checkpoint.town!.ap + 2);
  assert.equal('carryCheckpoint' in sim.toSave(), false);
  assert.ok(sim.startNextDay()); assert.ok(restored.startNextDay());
  for (let i = 0; i < 100; i++) { sim.tick(); restored.tick(); }
  assert.deepEqual(restored.toSave(), sim.toSave());
});

test('Carry Over refuses Day1, Hardcore, incompatible and malformed checkpoints without changing the adventure', () => {
  const sim = town(); const checkpoint = sim.toSave();
  assert.equal(sim.carryOver(checkpoint), false);
  assert.ok(sim.startNextDay()); lose(sim);
  const before = sim.toSave();
  const otherHero = town({ heroClass: 'hunter' }).toSave();
  const invalid: unknown[] = [null, {}, otherHero, { ...checkpoint, mode: 'casual' }, { ...checkpoint, mods: { tight: true } },
    { ...checkpoint, day: 2 }, { ...checkpoint, carryOver: true }, { ...checkpoint, carryCheckpoint: checkpoint }];
  for (const value of invalid) { assert.equal(sim.carryOver(value), false); assert.deepEqual(sim.toSave(), before); }
  const first = new Simulation(42); lose(first); assert.equal(first.carryOver(checkpoint), false);
  const hc = town({ mode: 'hardcore' }), hcTown = hc.toSave(); hc.startNextDay(); lose(hc); assert.equal(hc.carryOver(hcTown), false);
});

test('Carry Over blocks source medal categories while keeping counters and allowed badges', () => {
  const sim = town(), checkpoint = sim.toSave(); sim.startNextDay(); lose(sim); sim.carryOver(checkpoint);
  const existing = [...sim.state.earnedMedals];
  for (const id of [41, 50, 60, 65, 70, 80, 83, 92, 94, 95, 96, 97]) sim['awardMedal'](id);
  assert.deepEqual(sim.state.earnedMedals, existing);
  sim.state.economy.prayers = 14;
  assert.equal(sim.performTownActivity('pray').outcome, 'done');
  assert.equal(sim.state.economy.prayers, 15); assert.equal(sim.state.earnedMedals.includes(80), false);
  sim.state.economy.chickens = 29; sim.state.gold = 1000000;
  assert.equal(sim.buyCastleUpgrade('chicken'), 'purchased');
  assert.equal(sim.state.economy.chickens, 30); assert.equal(sim.state.earnedMedals.includes(50), false);
  sim['awardMedal'](86); sim['awardMedal'](93);
  assert.ok(sim.state.earnedMedals.includes(86)); assert.ok(sim.state.earnedMedals.includes(93));
  sim.startNextDay(); const perfect = sim.state.perfectDays;
  sim.state.activeMission.ragnarok = true; sim.state.player.level = 10;
  sim.state.player.traits[HERO_CLASSES[sim.state.player.classId].id] = 10;
  sim.state.noDamage = true; sim['finishDay']();
  assert.equal(sim.state.perfectDays, perfect + 1);
  assert.equal(sim.state.earnedMedals.includes(92), false); assert.equal(sim.state.earnedMedals.includes(65), false);
  assert.deepEqual(Simulation.fromSave(sim.toSave()).toSave(), sim.toSave());
});

test('legacy defaults retain their state and malformed Carry Over flags are rejected; export a controlled browser defeat', () => {
  const old = new Simulation(42).toSave(); old.version = 35;
  assert.deepEqual(Simulation.fromSave(old).toSave(), { ...old, version: SAVE_VERSION });
  for (const carryOver of [false, 1, 'true']) assert.throws(() => Simulation.fromSave({ ...old, version: SAVE_VERSION, carryOver }), /Carry Over/);
  assert.throws(() => Simulation.fromSave({ ...old, carryOver: true }), /Carry Over/);
  const sim = town(), checkpoint: SimulationState = sim.toSave(); sim.startNextDay(); lose(sim, 333);
  mkdirSync('../.build/browser-qa', { recursive: true });
  writeFileSync('../.build/browser-qa/carry-over-defeat.json', JSON.stringify({ format: 'elona-shooter-browser', version: SAVE_VERSION, appearance: 0,
    simulation: sim.toSave(), carryCheckpoint: checkpoint, profile: { version: 1, medals: sim.state.earnedMedals, bestDay: 2 } }));
});
