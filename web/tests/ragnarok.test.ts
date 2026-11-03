import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { Simulation, type SimulationState } from '../src/simulation.ts';
import { ItemFactory } from '../src/items.ts';
import { companionWage } from '../src/party-progression.ts';
import { createProfile, mergeProfile } from '../src/profile.ts';
import { SAVE_VERSION } from '../src/save-version.ts';

function equipped(): Simulation {
  const sim = new Simulation(42, { heroClass: 'hunter' });
  sim.state.inventory[2] = new ItemFactory(() => 0.5).generate(38);
  return sim;
}

test('Ragnarok consumes the owned artifact, spawns thirty source dinosaurs and extends the spawn timer once', () => {
  const sim = equipped(), before = sim.toSave();
  assert.ok(sim.useSlot(2));
  assert.equal(sim.state.enemies.length, 30);
  assert.ok(sim.state.enemies.every(enemy => enemy.kind === 'dino' && enemy.hp === 700 && enemy.attack === 25));
  assert.equal(sim.state.spawnTimer, before.spawnTimer + 200);
  assert.deepEqual(sim.state.waves, before.waves);
  assert.equal(sim.state.newWave, before.newWave);
  assert.equal(sim.state.activeMission.ragnarok, true);
  assert.equal(sim.state.earnedMedals.includes(92), false);
  assert.equal(sim.state.inventory[2]!.num, 0);
  assert.equal(sim.state.inventory[2]!.ammo, -1);
  assert.deepEqual(sim.state.inventory[0], before.inventory[0]);
  assert.equal(sim.state.player.selectedSlot, before.player.selectedSlot);
  assert.deepEqual(sim.events.at(-1), { type: 'ragnarok', amount: 30, message: "Let's Ragnarok!" });
  const used = sim.toSave();
  assert.equal(sim.useSlot(2), false);
  assert.deepEqual(sim.toSave(), used);
  assert.deepEqual(Simulation.fromSave(JSON.parse(JSON.stringify(used))).toSave(), used);
});

test('Ragnarok respects the shared enemy capacity and saves replay actual dinosaur attacks', () => {
  const full = equipped();
  for (let i = 0; i < 195; i++) full['spawnEnemy']('sheep');
  assert.ok(full.useSlot(2));
  assert.equal(full.state.enemies.length, 200);
  assert.equal(full.events.at(-1)!.amount, 5);
  full.state.inventory[3] = new ItemFactory(() => 0.5).generate(38);
  const rng = full.state.rng;
  assert.ok(full.useSlot(3));
  assert.equal(full.events.at(-1)!.amount, 0);
  assert.equal(full.state.spawnTimer, 430);
  assert.equal(full.state.rng, rng);
  const sim = equipped(); sim.state.castleHp = sim.state.castleMaxHp = 100000;
  sim.useSlot(2);
  const resumed = Simulation.fromSave(JSON.parse(JSON.stringify(sim.toSave())));
  let damageEvents = 0;
  for (let frame = 0; frame < 600; frame++) {
    sim.tick(); resumed.tick();
    damageEvents += sim.events.filter(event => event.type === 'castle-hit').length;
    assert.deepEqual(resumed.events, sim.events);
  }
  assert.ok(damageEvents > 0);
  assert.deepEqual(resumed.toSave(), sim.toSave());
});

test('surviving Ragnarok awards its medal without a wage discount, carries Luck into New Game and resets only the battle flag', () => {
  let sim = equipped();
  sim.state.castleHp = sim.state.castleMaxHp = 100000;
  sim.state.inventory[0] = new ItemFactory(() => 0.5).generate(3);
  Object.assign(sim.state.inventory[0]!, { attack: 1000000, baseAccuracy: 1000000, ammoMax: 1000, ammo: 1000, shootRate: 1 });
  mkdirSync('../.build/browser-qa', { recursive: true });
  writeFileSync('../.build/browser-qa/ragnarok-before.json', JSON.stringify({ format: 'elona-shooter-browser', version: SAVE_VERSION, appearance: 0, simulation: sim.toSave() }));
  assert.ok(sim.useSlot(2));
  let dinosKilled = 0;
  for (let frame = 0; frame < 15000 && sim.state.phase === 'battle'; frame++) {
    const aliveDinos = sim.state.enemies.filter(enemy => enemy.kind === 'dino' && enemy.hp > 0).length;
    const target = sim.state.enemies.filter(enemy => enemy.hp > 0 && !enemy.removed).sort((a, b) => b.x - a.x)[0];
    sim.tick({ aimX: target?.x ?? 250, aimY: target?.y ?? 230, firePressed: Boolean(target), reload: sim.weapon!.ammo === 0 });
    dinosKilled += Math.max(0, aliveDinos - sim.state.enemies.filter(enemy => enemy.kind === 'dino' && enemy.hp > 0).length);
  }
  assert.ok(dinosKilled > 0);
  assert.equal(sim.state.phase, 'victory');
  assert.ok(sim.state.earnedMedals.includes(92));
  const wage = (medal: boolean) => sim.state.party.slots.slice(0, 4).reduce((sum, slot) => sum + (slot.exists && slot.member ? companionWage(slot.member, sim.state.partySkills.effects[127], medal) : 0), 0);
  assert.equal(sim.state.result.wages, wage(false));
  assert.ok(wage(true) < wage(false));
  sim = Simulation.fromSave(sim.toSave());
  while (['loot', 'boss-loot'].includes(sim.state.postbattle)) assert.ok(sim.finishLoot());
  while (sim.state.postbattle === 'skill') assert.ok(sim.chooseSkill(sim.state.skillChoices[0]));
  assert.ok(sim.enterTown());
  assert.equal(sim.state.town!.mission.ragnarok, false);
  const profile = mergeProfile(createProfile(), sim.state);
  const next = new Simulation(42, { medals: profile.medals });
  assert.equal(next.state.player.traits[108], 1);
  assert.ok(sim.startNextDay());
  assert.equal(sim.state.activeMission.ragnarok, undefined);
  assert.ok(sim.state.earnedMedals.includes(92));
  assert.deepEqual(Simulation.fromSave(sim.toSave()).toSave(), sim.toSave());
});

test('defeat cannot award the survivor medal and malformed or old-format Ragnarok flags are rejected', () => {
  const sim = equipped(); sim.useSlot(2);
  for (const change of [
    (save: SimulationState) => { save.activeMission.ragnarok = false as true; },
    (save: SimulationState) => { save.activeMission.ragnarok = 'true' as unknown as true; },
    (save: SimulationState) => { save.version = 32; },
  ]) { const save = sim.toSave(); change(save); assert.throws(() => Simulation.fromSave(save), /Ragnarok/); }
  sim['damageCastle'](1000);
  for (let i = 0; i < 3 && sim.state.phase === 'battle'; i++) sim.tick();
  assert.equal(sim.state.phase, 'defeat');
  assert.equal(sim.state.earnedMedals.includes(92), false);
  assert.deepEqual(Simulation.fromSave(sim.toSave()).toSave(), sim.toSave());
  const old = new Simulation(42).toSave(); old.version = 32;
  assert.deepEqual(Simulation.fromSave(old).toSave(), { ...old, version: SAVE_VERSION });
});
