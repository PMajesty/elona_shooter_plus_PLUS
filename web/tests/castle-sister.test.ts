import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../src/simulation.ts';
import { STANDING_SISTER, advanceCastleSister, castleSisterHit } from '../src/castle-sister.ts';
import { ItemFactory } from '../src/items.ts';
import { TRAIT } from '../src/progression.ts';

function battle(): Simulation {
  const sim = new Simulation(42);
  sim.weapon!.baseAccuracy = 1000000;
  return sim;
}

test('original sister contours include her body/shadow and exclude the hidden Fire at will label', () => {
  assert.ok(castleSisterHit(4, 596, 97));
  assert.ok(castleSisterHit(4, 590, 109));
  assert.equal(castleSisterHit(4, 570, 97), false);
  assert.equal(castleSisterHit(4, 615, 70), false);
  const sister = { frame: 7, free: false, dead: false };
  for (let i = 0; i < 9; i++) advanceCastleSister(sister);
  assert.deepEqual(sister, { frame: 16, free: false, dead: false });
  advanceCastleSister(sister); assert.deepEqual(sister, STANDING_SISTER);
});

test('ordinary hitscan can kill the sister once without consuming RNG, rewards or blocking the shot', () => {
  const sim = battle(), control = Simulation.fromSave(sim.toSave());
  const hp = sim.state.castleHp, money = sim.state.gold;
  assert.ok(sim.fireAt(596, 97)); assert.ok(control.fireAt(400, 200));
  assert.deepEqual(sim.state.castleSister, { frame: 45, free: true, dead: true });
  assert.equal(sim.events.filter(e => e.type === 'sister-killed').length, 1);
  assert.ok(sim.events.some(e => e.type === 'shot'));
  assert.equal(sim.state.rng, control.state.rng);
  assert.deepEqual([sim.state.castleHp, sim.state.gold, sim.state.kills], [hp, money, 0]);
  sim.state.player.shootTimer = 0;
  assert.ok(sim.fireAt(596, 97));
  assert.equal(sim.events.filter(e => e.type === 'sister-killed').length, 1);
  const restored = Simulation.fromSave(JSON.parse(JSON.stringify(sim.toSave())));
  for (let i = 0; i < 100; i++) { sim.tick(); restored.tick(); assert.deepEqual(restored.events, sim.events); }
  assert.deepEqual(restored.toSave(), sim.toSave());
  assert.equal(sim.state.castleSister!.frame, 72);
});

test('companion hitscan also kills her, while projectiles do not use the hitscan-only check', () => {
  const companion = new Simulation(42, { heroClass: 'rogue' });
  companion.state.party.slots[0].weapon = structuredClone(battle().weapon!);
  const weapon = companion.state.party.slots[0].weapon!;
  companion.state.party.slots[0].member!.traits[weapon.reqTrait!] = 999;
  weapon.baseAccuracy = 1000000;
  assert.ok(companion['fireActorAt'](1, 596, 97));
  assert.equal(companion.state.castleSister?.dead, true);
  const launcher = battle();
  launcher.state.inventory[0] = new ItemFactory(() => 0.5).generate(21);
  launcher.weapon!.baseAccuracy = 1000000;
  launcher.state.player.traits[launcher.weapon!.reqTrait!] = 999;
  assert.ok(launcher.fireAt(596, 97));
  assert.equal(launcher.state.castleSister, undefined);
  for (let i = 0; i < 60; i++) launcher.tick();
  assert.equal(launcher.state.castleSister, undefined);
});

test('unblocked castle damage reacts once; protection, defender and death suppress the reaction', () => {
  const sim = battle();
  sim.state.protection.counter = 1; sim['damageCastle'](1);
  assert.equal(sim.state.castleSister, undefined);
  sim.state.protection.counter = 0; sim.state.partySkills.effects[TRAIT.DEFENDER] = 100;
  sim['damageCastle'](1); assert.equal(sim.state.castleSister, undefined);
  sim.state.partySkills.effects[TRAIT.DEFENDER] = 0;
  sim['damageCastle'](1); assert.deepEqual(sim.state.castleSister, { frame: 7, free: false, dead: false });
  for (let i = 0; i < 4; i++) advanceCastleSister(sim.state.castleSister!);
  sim['damageCastle'](1); assert.equal(sim.state.castleSister!.frame, 11);
  for (let i = 0; i < 6; i++) advanceCastleSister(sim.state.castleSister!);
  assert.deepEqual(sim.state.castleSister, STANDING_SISTER);
  sim.state.castleSister = { frame: 60, free: true, dead: true };
  sim['damageCastle'](1); assert.equal(sim.state.castleSister.frame, 60);
});

test('critical-kill cheering follows source interruption/free rules and stops its random voice draw after death', () => {
  function kill(dead: boolean): { sim: Simulation; draws: number } {
    const sim = battle(); sim['spawnEnemy']('sheep');
    sim.state.castleSister = dead ? { frame: 72, free: true, dead: true } : { frame: 10, free: false, dead: false };
    let draws = 0; const random = sim['random'].bind(sim);
    sim['random'] = () => { draws++; return random(); };
    const enemy = sim.state.enemies[0];
    sim['damageEnemy'](enemy, 999999, true, 0, enemy.x, enemy.y);
    return { sim, draws };
  }
  const alive = kill(false), dead = kill(true);
  assert.deepEqual(alive.sim.state.castleSister, { frame: 20, free: false, dead: false });
  assert.equal(dead.sim.state.castleSister!.frame, 72);
  assert.equal(alive.sim.state.criticalKills, 1); assert.equal(dead.sim.state.criticalKills, 1);
  assert.ok(alive.sim.events.some(e => e.type === 'kill' && e.goodShotIndex !== undefined));
  assert.ok(dead.sim.events.some(e => e.type === 'kill' && e.goodShotIndex === undefined));
  assert.equal(alive.draws, dead.draws + 1);
  alive.sim['damageCastle'](1); assert.equal(alive.sim.state.castleSister!.frame, 20);
  for (let i = 0; i < 16; i++) advanceCastleSister(alive.sim.state.castleSister!);
  assert.deepEqual(alive.sim.state.castleSister, STANDING_SISTER);
});

test('older saves keep their implicit living sister; invalid states fail and Rest revives the next scene', () => {
  const sim = battle(), before = sim.toSave();
  assert.equal(before.castleSister, undefined);
  assert.deepEqual(Simulation.fromSave(before).toSave(), before);
  for (const value of [null, {}, { frame: 73, free: true, dead: true }, { frame: 4, free: true, dead: true }, { frame: 20, free: 'yes', dead: false }]) {
    assert.throws(() => Simulation.fromSave({ ...before, castleSister: value }), /castle Sister/);
  }
  sim.state.castleSister = { frame: 72, free: true, dead: true };
  sim['finishDay']();
  while (sim.state.postbattle === 'loot' || sim.state.postbattle === 'boss-loot') sim.finishLoot();
  while (sim.state.postbattle === 'skill') sim.chooseSkill(sim.state.skillChoices[0]);
  assert.ok(sim.enterTown()); assert.ok(sim.startNextDay());
  assert.equal(sim.state.castleSister, undefined);
});
