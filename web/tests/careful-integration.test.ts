import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../src/simulation.ts';
import { ItemFactory } from '../src/items.ts';
import { CAREFUL_DAMAGE_MULTIPLIER } from '../src/careful-consideration.ts';
import { refreshPartyAI } from '../src/party-ai.ts';

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

test('Careful rifle fire keeps ammunition/cooldown/traits and pays the 15% damage cost', () => {
  const standard = battle(4, 6), careful = battle(4, 7);
  const traits = structuredClone(careful.state.party.slots[0].member!.traits);
  standard.tick(); careful.tick();
  const oldHit = standard.events.find(e => e.type === 'hit')!, newHit = careful.events.find(e => e.type === 'hit')!;
  assert.ok(oldHit && newHit);
  assert.ok(Math.abs(newHit.amount! - oldHit.amount! * CAREFUL_DAMAGE_MULTIPLIER) <= 1);
  assert.equal(careful.state.party.slots[0].weapon!.ammo, standard.state.party.slots[0].weapon!.ammo);
  assert.equal(careful.state.party.slots[0].member!.shootTimer, standard.state.party.slots[0].member!.shootTimer);
  assert.deepEqual(careful.state.party.slots[0].member!.traits, traits);
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

test('Careful projectile cost is fixed at launch and saved across a later order change', () => {
  const standard = battle(23, 6), careful = battle(23, 7);
  standard.tick(); careful.tick();
  assert.equal(careful.state.projectiles[0].damage, Math.trunc(standard.state.projectiles[0].damage * CAREFUL_DAMAGE_MULTIPLIER));
  const damage = careful.state.projectiles[0].damage;
  careful.state.party.slots[0].member!.ai = 6;
  const resumed = Simulation.fromSave(careful.toSave(), { hitTest: () => true });
  assert.equal(resumed.state.projectiles[0].damage, damage);
  for (let i = 0; i < 25; i++) { careful.tick(); resumed.tick(); }
  assert.deepEqual(resumed.toSave(), careful.toSave()); assert.deepEqual(resumed.events, careful.events);
});

test('the Careful order and selected target survive Continue with identical future events', () => {
  const sim = battle(2, 7);
  for (let i = 0; i < 12; i++) sim.tick();
  const resumed = Simulation.fromSave(sim.toSave(), { hitTest: () => true });
  assert.equal(resumed.state.party.slots[0].member!.ai, 7);
  for (let i = 0; i < 80; i++) {
    sim.tick(); resumed.tick();
    assert.deepEqual(resumed.toSave(), sim.toSave()); assert.deepEqual(resumed.events, sim.events);
  }
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

test('a contracted henchman receives the saved Inn order after Rest, only in Expanded', () => {
  for (const ruleset of ['classic', 'expanded'] as const) {
    const sim = new Simulation(42, { ruleset });
    assert.equal(sim.setHenchmanCareful(true), false);
    sim['finishDay']();
    while (['loot', 'boss-loot'].includes(sim.state.postbattle)) sim.finishLoot();
    while (sim.state.postbattle === 'skill') sim.chooseSkill(sim.state.skillChoices[0]);
    assert.ok(sim.enterTown());
    assert.equal(sim.setHenchmanCareful(true), false);
    assert.equal(sim.requestMissionHire(), 'previewed');
    assert.equal(sim.resolvePartyAction(true), 'contracted');
    assert.equal(sim.setHenchmanCareful(true), ruleset === 'expanded');
    const saved = sim.toSave(), resumed = Simulation.fromSave(saved);
    assert.ok(sim.startNextDay()); assert.ok(resumed.startNextDay());
    assert.equal(sim.state.party.slots[3].member!.ai, ruleset === 'expanded' ? 7 : 6);
    assert.deepEqual(resumed.toSave(), sim.toSave());
    assert.deepEqual(Simulation.fromSave(sim.toSave()).toSave(), sim.toSave());
    assert.equal(sim.setHenchmanCareful(false), false);
    if (ruleset === 'expanded') {
      const town = Simulation.fromSave(saved);
      assert.ok(town.setHenchmanCareful(false)); assert.ok(town.startNextDay());
      assert.equal(town.state.party.slots[3].member!.ai, 6);
      const wrong = structuredClone(saved); wrong.ruleset.id = 'classic';
      assert.throws(() => Simulation.fromSave(wrong), /hired gun order/);
    }
  }
});
