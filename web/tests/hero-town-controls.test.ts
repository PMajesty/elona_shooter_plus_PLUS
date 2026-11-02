import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../src/simulation.ts';
import { TRAIT } from '../src/progression.ts';
import { rollHeroChoices } from '../src/hero-classes.ts';
import { shotSpread } from '../src/combat-stats.ts';

function town(heroClass: 'sheriff' | 'sniper' | 'militia' = 'sheriff'): Simulation {
  const sim = new Simulation(42, { heroClass }); sim['finishDay']();
  while (sim.state.postbattle === 'loot' || sim.state.postbattle === 'boss-loot') sim.finishLoot();
  while (sim.state.postbattle === 'skill') sim.chooseSkill(sim.state.skillChoices[0]);
  assert.ok(sim.enterTown()); return sim;
}

function isolatedBattle(order: number, heroClass: 'sheriff' | 'sniper' | 'militia' = 'sheriff'): Simulation {
  const sim = town(heroClass); assert.ok(sim.setCompanionOrder(0, order)); assert.ok(sim.startNextDay());
  sim.state.spawnTimer = 10000; sim.state.newWave = false; sim.state.waveIndex = sim.state.waves.length - 1;
  return sim;
}

test('hero town preferences are free, idempotent and restricted to valid owned skills/orders', () => {
  const sim = town(), before = sim.toSave();
  assert.deepEqual(sim.heroSettings, { order: -1, focus: -1, boss: true, wall: true });
  assert.ok(sim.setCompanionOrder(0, -1)); assert.ok(sim.setCompanionFocus(0, -1));
  assert.ok(sim.setCompanionPriorities(0, { boss: true, wall: true }));
  assert.deepEqual(sim.toSave(), before);
  for (const id of [6, 900, 901, 999, 123.5]) assert.equal(sim.setCompanionFocus(0, id), false);
  for (const order of [-2, 7, 1.5]) assert.equal(sim.setCompanionOrder(0, order), false);
  assert.ok(sim.setCompanionFocus(0, 121)); assert.ok(sim.setCompanionOrder(0, 4));
  assert.ok(sim.setCompanionPriorities(0, { boss: false, wall: false }));
  const expected = structuredClone(before); expected.heroSettings = { order: 4, focus: 121, boss: false, wall: false };
  assert.deepEqual(sim.toSave(), expected);
  assert.deepEqual(Simulation.fromSave(JSON.parse(JSON.stringify(expected))).toSave(), expected);
  sim.state.pendingPartyAction = { kind: 'hire' };
  assert.equal(sim.setCompanionOrder(0, 0), false); assert.equal(sim.setCompanionFocus(0, -1), false);
});

test('hero focus uses the original first-choice 50% check and reaches ordinary result skill choices', () => {
  const sim = town(); assert.ok(sim.setCompanionFocus(0, 121)); assert.ok(sim.startNextDay());
  const rolls: number[] = [];
  const choices = rollHeroChoices('sheriff', 1, sim.state.player.traits, () => { rolls.push(0.4); return 0.4; }, 121);
  assert.equal(choices[0], 121); assert.ok(rolls.length >= choices.length);
  sim.state.player.skillPoints = 1; sim['finishDay']();
  while (sim.state.postbattle === 'loot' || sim.state.postbattle === 'boss-loot') sim.finishLoot();
  sim.state.rng = 42; sim['prepareSkillChoices']();
  assert.equal(sim.state.skillChoices[0], 121);
  const restored = Simulation.fromSave(JSON.parse(JSON.stringify(sim.toSave())));
  assert.ok(sim.chooseSkill(121)); assert.ok(restored.chooseSkill(121));
  assert.deepEqual(restored.toSave(), sim.toSave());
  assert.equal(sim.state.player.traits[121], 2); assert.equal(sim.heroSettings.focus, 121);
});

test('air-only hero orders select and kill an airborne enemy, ignoring mouse fire and ground targets', () => {
  const sim = isolatedBattle(4);
  sim.weapon!.baseAccuracy = 1000000; sim.weapon!.attack = 1000;
  sim['spawnEnemy']('sheep'); sim['spawnEnemy']('fly');
  const [sheep, fly] = sim.state.enemies;
  Object.assign(sheep, { x: 300, y: 240, speed: 0, speedOrg: 0 });
  Object.assign(fly, { x: 300, y: 90, speed: 0, speedOrg: 0, hp: 1 });
  const sheepHp = sheep.hp;
  assert.equal(sim.heroAutomatic, true); assert.equal(sim.fireAtWill, false);
  assert.equal(sim.fireAt(300, 240), false);
  for (let i = 0; i < 300 && fly.hp > 0; i++) sim.tick({ aimX: 300, aimY: 240, firePressed: true, fireHeld: true });
  assert.ok(fly.hp <= 0); assert.equal(sheep.hp, sheepHp); assert.equal(sim.state.kills, 1);
  assert.equal(sim['partyAIContext']().heroSlot, -1);
  assert.equal(sim.setCompanionOrder(0, -1), false, 'Town controls must not change battle orders.');
});

test('town accepts all seven source orders; Rest preserves the selection and F remains a separate flag', () => {
  const sim = town();
  for (let order = 0; order <= 6; order++) { assert.ok(sim.setCompanionOrder(0, order)); assert.equal(sim.heroSettings.order, order); }
  assert.ok(sim.startNextDay());
  assert.equal(sim.heroSettings.order, 6); assert.equal(sim.fireAtWill, false); assert.ok(sim.state.heroAI);
  const rng = sim.state.rng;
  assert.ok(sim.toggleFireAtWill()); assert.ok(sim.toggleFireAtWill());
  assert.equal(sim.heroAutomatic, true); assert.equal(sim.state.rng, rng);
  assert.equal(sim['heroAIActor']().member!.ai, 6);
  assert.equal(sim['partyAIContext']().heroSlot, -1);
});

test('normal autonomous orders retain normal accuracy; only Always fire at will and F add their penalty', () => {
  const normal = isolatedBattle(0), always = isolatedBattle(6), manual = isolatedBattle(-1); manual.toggleFireAtWill();
  for (const sim of [normal, always, manual]) { sim.state.player.shootTimer = 0; assert.ok(sim['fireActorAt'](0, 300, 240)); }
  const normalShot = normal.events.find(e => e.type === 'shot')!, alwaysShot = always.events.find(e => e.type === 'shot')!, manualShot = manual.events.find(e => e.type === 'shot')!;
  assert.deepEqual(alwaysShot.pellets, manualShot.pellets);
  assert.notDeepEqual(normalShot.pellets, alwaysShot.pellets);
  assert.ok(shotSpread(normal.weapon!, normal.state.player.traits, 0, { manualControl: false })
    < shotSpread(normal.weapon!, normal.state.player.traits, 0, { manualControl: false, fireAtWill: true }));
});

test('autonomous Sniper/Militia states replay through JSON with class meters, reloads and grenade ownership', () => {
  for (const heroClass of ['sniper', 'militia'] as const) {
    const sim = isolatedBattle(6, heroClass);
    for (const kind of ['sheep', 'rat', 'fly'] as const) sim['spawnEnemy'](kind);
    sim.state.castleHp = sim.state.castleMaxHp = 1000;
    if (heroClass === 'militia') sim.state.player.grenadeCount = 0;
    let grenadeSeen = false;
    for (let i = 0; i < 100; i++) { sim.tick(); grenadeSeen ||= sim.events.some(event => event.type === 'grenade' && event.actorSlot === 0); }
    if (heroClass === 'militia') assert.ok(grenadeSeen);
    const restored = Simulation.fromSave(JSON.parse(JSON.stringify(sim.toSave())));
    for (let i = 0; i < 300; i++) { sim.tick(); restored.tick(); assert.deepEqual(restored.events, sim.events); }
    assert.deepEqual(restored.toSave(), sim.toSave()); assert.equal(sim.state.player.classState, undefined);
  }
});

test('returning to Hero Mode resets battle AI but preserves focused skills and priorities', () => {
  const sim = town(); sim.setCompanionFocus(0, 121); sim.setCompanionPriorities(0, { boss: false }); sim.setCompanionOrder(0, 6);
  sim.startNextDay(); sim.toggleFireAtWill(); sim['finishDay']();
  while (sim.state.postbattle === 'loot' || sim.state.postbattle === 'boss-loot') sim.finishLoot();
  while (sim.state.postbattle === 'skill') sim.chooseSkill(sim.state.skillChoices[0]);
  sim.enterTown(); assert.ok(sim.setCompanionOrder(0, -1)); sim.startNextDay();
  assert.equal(sim.heroAutomatic, false); assert.equal(sim.fireAtWill, false); assert.equal(sim.state.heroAI, undefined);
  assert.deepEqual(sim.heroSettings, { order: -1, focus: 121, boss: false, wall: true });
  assert.ok(sim.fireAt(300, 240));
});

test('old saves retain their defaults; corrupt orders, unowned focus and missing autonomous AI are refused', () => {
  const sim = new Simulation(42), before = sim.toSave();
  assert.equal(before.heroSettings, undefined); assert.deepEqual(Simulation.fromSave(before).toSave(), before);
  const valid = { order: -1, focus: -1, boss: true, wall: true };
  for (const settings of [null, {}, { ...valid, order: 7 }, { ...valid, order: 0 }, { ...valid, boss: 1 }, { ...valid, focus: TRAIT.BASE_AIMING }, { ...valid, focus: 199 }]) {
    assert.throws(() => Simulation.fromSave({ ...before, heroSettings: settings }), /hero/i);
  }
});
