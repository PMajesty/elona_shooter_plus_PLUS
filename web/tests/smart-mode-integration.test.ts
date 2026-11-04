import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../src/simulation.ts';
import { ItemFactory } from '../src/items.ts';
import { SMART_DAMAGE_MULTIPLIER } from '../src/smart-mode.ts';
import { createPartyAIState, refreshPartyAI } from '../src/party-ai.ts';

function battle(weaponId: number, order: number) {
  const sim = new Simulation(42, { heroClass: 'rogue', ruleset: 'expanded', hitTest: () => true });
  sim.state.newWave = false; sim.state.waveIndex = 4; sim.state.spawnTimer = 1000;
  sim['spawnEnemy']('sheep');
  Object.assign(sim.state.enemies[0], { x: 250, y: 230, hp: 10000, maxHp: 10000, speed: 0, speedOrg: 0 });
  const slot = sim.state.party.slots[0], member = slot.member!;
  slot.weapon = new ItemFactory(() => 0.5).generate(weaponId);
  member.traits[slot.weapon.reqTrait!] = Math.max(member.traits[slot.weapon.reqTrait!] ?? 0, slot.weapon.reqLv!);
  member.ai = order; refreshPartyAI(slot);
  Object.assign(member.aiState!, { targetUid: sim.state.enemies[0].uid, shooting: true, aimCount: 0 });
  return sim;
}

test('Smart rifle fire keeps ammunition/cooldown/traits and pays the 15% damage cost', () => {
  const standard = battle(4, 6), smart = battle(4, 7);
  const traits = structuredClone(smart.state.party.slots[0].member!.traits);
  standard.tick(); smart.tick();
  const oldHit = standard.events.find(e => e.type === 'hit')!, newHit = smart.events.find(e => e.type === 'hit')!;
  assert.ok(oldHit && newHit);
  assert.ok(Math.abs(newHit.amount! - oldHit.amount! * SMART_DAMAGE_MULTIPLIER) <= 1);
  assert.equal(smart.state.party.slots[0].weapon!.ammo, standard.state.party.slots[0].weapon!.ammo);
  assert.equal(smart.state.party.slots[0].member!.shootTimer, standard.state.party.slots[0].member!.shootTimer);
  assert.deepEqual(smart.state.party.slots[0].member!.traits, traits);
});

test('a shotgun drops a safe sheep target for a distant chicken, then defends an urgent approach', () => {
  const sim = battle(3, 7), sheep = sim.state.enemies[0];
  Object.assign(sheep, { x: 310, speed: 0.5, speedOrg: 0.5 });
  sim['spawnEnemy']('chicken');
  const chicken = sim.state.enemies.at(-1)!;
  Object.assign(chicken, { x: 90, y: 220, speed: 0, frame: 105, attacking: true });
  const member = sim.state.party.slots[0].member!;
  sim.tick();
  assert.equal(member.aiState!.targetUid, chicken.uid);
  assert.equal(member.aiState!.shooting, false);
  const restored = Simulation.fromSave(sim.toSave(), { hitTest: () => true });
  sim.tick(); restored.tick(); assert.deepEqual(restored.toSave(), sim.toSave());
  sheep.x = 440;
  sim.tick(); assert.equal(member.aiState!.targetUid, sheep.uid);
});

test('Smart projectile cost is fixed at launch and saved across a later order change', () => {
  const standard = battle(23, 6), smart = battle(23, 7);
  standard.tick(); smart.tick();
  assert.equal(smart.state.projectiles[0].damage, Math.trunc(standard.state.projectiles[0].damage * SMART_DAMAGE_MULTIPLIER));
  const damage = smart.state.projectiles[0].damage;
  smart.state.party.slots[0].member!.ai = 6;
  const resumed = Simulation.fromSave(smart.toSave(), { hitTest: () => true });
  assert.equal(resumed.state.projectiles[0].damage, damage);
  for (let i = 0; i < 25; i++) { smart.tick(); resumed.tick(); }
  assert.deepEqual(resumed.toSave(), smart.toSave()); assert.deepEqual(resumed.events, smart.events);
});

test('the Smart order and selected target survive Continue with identical future events', () => {
  const sim = battle(2, 7);
  for (let i = 0; i < 12; i++) sim.tick();
  const resumed = Simulation.fromSave(sim.toSave(), { hitTest: () => true });
  assert.equal(resumed.state.party.slots[0].member!.ai, 7);
  for (let i = 0; i < 80; i++) {
    sim.tick(); resumed.tick();
    assert.deepEqual(resumed.toSave(), sim.toSave()); assert.deepEqual(resumed.events, sim.events);
  }
});

test('saving during Smart acquisition preserves the remaining wait and later shot timing', () => {
  const sim = battle(4, 7), member = sim.state.party.slots[0].member!;
  Object.assign(member.aiState!, { targetUid: null, shooting: false, aimCount: 0, workRate: 0.3 });
  for (let i = 0; i < 40 && member.aiState!.targetUid === null; i++) sim.tick();
  assert.notEqual(member.aiState!.targetUid, null);
  sim.tick(); sim.tick();
  const remaining = member.aiState!.aimCount; assert.ok(remaining > 0);
  const resumed = Simulation.fromSave(sim.toSave(), { hitTest: () => true });
  assert.equal(resumed.state.party.slots[0].member!.aiState!.aimCount, remaining);
  assert.equal(resumed.setCompanionOrder(1, 0), false);
  let fired = false;
  for (let i = 0; i < remaining + 30; i++) {
    sim.tick(); resumed.tick();
    assert.deepEqual(resumed.toSave(), sim.toSave()); assert.deepEqual(resumed.events, sim.events);
    if (sim.events.some(event => event.type === 'shot' && event.actorSlot === 1)) fired = true;
  }
  assert.ok(fired);
});

test('changing orders in the Barracks is reversible and does not permanently reduce a companion', () => {
  for (const ruleset of ['classic', 'expanded'] as const) {
    const sim = new Simulation(42, { ruleset, heroClass: 'rogue' });
    sim['finishDay']();
    while (['loot', 'boss-loot'].includes(sim.state.postbattle)) sim.finishLoot();
    while (sim.state.postbattle === 'skill') sim.chooseSkill(sim.state.skillChoices[0]);
    assert.ok(sim.enterTown());
    const member = sim.state.party.slots[0].member!, traits = structuredClone(member.traits), weapon = structuredClone(sim.state.party.slots[0].weapon);
    assert.equal(sim.setCompanionOrder(1, 7), ruleset === 'expanded');
    assert.equal(sim.setCompanionOrder(0, 7), false);
    assert.equal(sim.setCompanionOrder(5, 7), false);
    assert.ok(sim.setCompanionOrder(1, 6));
    assert.deepEqual(member.traits, traits); assert.deepEqual(sim.state.party.slots[0].weapon, weapon);
    assert.deepEqual(Simulation.fromSave(sim.toSave()).toSave(), sim.toSave());
  }
});

test('new Expanded hired guns default to Smart Mode, with a saved opt-out at the Inn', () => {
  for (const ruleset of ['classic', 'expanded'] as const) {
    const sim = new Simulation(42, { ruleset });
    assert.equal(sim.setHenchmanSmart(true), false);
    sim['finishDay']();
    while (['loot', 'boss-loot'].includes(sim.state.postbattle)) sim.finishLoot();
    while (sim.state.postbattle === 'skill') sim.chooseSkill(sim.state.skillChoices[0]);
    assert.ok(sim.enterTown());
    assert.equal(sim.setHenchmanSmart(true), false);
    assert.equal(sim.requestMissionHire(), 'previewed');
    assert.equal(sim.resolvePartyAction(true), 'contracted');
    assert.equal(sim.state.henchmanOrder, ruleset === 'expanded' ? 7 : undefined);
    const saved = sim.toSave(), resumed = Simulation.fromSave(saved);
    assert.ok(sim.startNextDay()); assert.ok(resumed.startNextDay());
    assert.equal(sim.state.party.slots[3].member!.ai, ruleset === 'expanded' ? 7 : 6);
    assert.deepEqual(resumed.toSave(), sim.toSave());
    assert.deepEqual(Simulation.fromSave(sim.toSave()).toSave(), sim.toSave());
    assert.equal(sim.setHenchmanSmart(false), false);
    if (ruleset === 'expanded') {
      const town = Simulation.fromSave(saved);
      assert.ok(town.setHenchmanSmart(false)); assert.ok(town.startNextDay());
      assert.equal(town.state.party.slots[3].member!.ai, 6);
      const wrong = structuredClone(saved); wrong.ruleset.id = 'classic';
      assert.throws(() => Simulation.fromSave(wrong), /hired gun order/);
    }
  }
});

test('Expanded starting companions and recruits default to Smart Mode without controlling the hero', () => {
  for (const ruleset of ['classic', 'expanded'] as const) {
    for (const heroClass of ['rogue', 'hunter'] as const) {
      const sim = new Simulation(42, { ruleset, heroClass });
      assert.equal(sim.state.party.slots[0].member!.ai, ruleset === 'expanded' ? 7 : 6);
      assert.equal(sim.heroSettings.order, -1); assert.equal(sim.heroAutomatic, false);
      assert.deepEqual(Simulation.fromSave(sim.toSave()).toSave(), sim.toSave());
    }
    const sim = new Simulation(42, { ruleset }); sim['finishDay']();
    while (['loot', 'boss-loot'].includes(sim.state.postbattle)) sim.finishLoot();
    while (sim.state.postbattle === 'skill') sim.chooseSkill(sim.state.skillChoices[0]);
    assert.ok(sim.enterTown()); sim.state.gold = 50000;
    const candidate = sim.state.party.slots[4].member!, originalOrder = candidate.ai;
    assert.equal(sim.requestRecruit(), 'previewed');
    assert.equal(sim.resolvePartyAction(true), 'hired');
    assert.equal(sim.state.party.slots[0].member, candidate);
    assert.equal(candidate.ai, ruleset === 'expanded' ? 7 : originalOrder);
    assert.ok(sim.setCompanionOrder(1, 0));
    const resumed = Simulation.fromSave(sim.toSave()); assert.ok(resumed.startNextDay());
    assert.equal(resumed.state.party.slots[0].member!.ai, 0);
  }
});

test('v46 saved orders and hired-gun opt-outs are not overwritten by new defaults', () => {
  const sim = new Simulation(42, { ruleset: 'expanded', heroClass: 'rogue' });
  for (const order of [0, 6, 7]) {
    const saved = sim.toSave(); saved.party.slots[0].member!.ai = order; delete saved.henchmanOrder;
    const resumed = Simulation.fromSave(saved);
    assert.equal(resumed.state.party.slots[0].member!.ai, order);
    assert.equal(resumed.state.henchmanOrder, undefined);
    assert.deepEqual(resumed.toSave(), saved);
  }
});

test('two Smart companions spread actual battle targets and Continue preserves their coordination', () => {
  const sim = battle(2, 7), first = sim.state.party.slots[0];
  const second = sim.state.party.slots[1]; sim.state.party.capacity = 2;
  Object.assign(second, { exists: true, member: structuredClone(first.member), weapon: structuredClone(first.weapon) });
  second.member!.aiState = createPartyAIState(2);
  sim['refreshPartySkills']();
  for (const slot of [first, second]) {
    refreshPartyAI(slot);
    Object.assign(slot.member!.aiState!, { targetUid: null, shooting: false, aimCount: 0, workRate: 0.3 });
  }
  sim['spawnEnemy']('sheep');
  Object.assign(sim.state.enemies[1], { x: 270, y: 290, hp: 10000, maxHp: 10000, speed: 0, speedOrg: 0 });
  for (let i = 0; i < 50 && [first, second].some(slot => slot.member!.aiState!.targetUid === null); i++) sim.tick();
  assert.notEqual(first.member!.aiState!.targetUid, null); assert.notEqual(second.member!.aiState!.targetUid, null);
  assert.notEqual(first.member!.aiState!.targetUid, second.member!.aiState!.targetUid);
  const resumed = Simulation.fromSave(sim.toSave(), { hitTest: () => true });
  for (let i = 0; i < 50; i++) {
    sim.tick(); resumed.tick();
    assert.deepEqual(resumed.toSave(), sim.toSave()); assert.deepEqual(resumed.events, sim.events);
  }
});
