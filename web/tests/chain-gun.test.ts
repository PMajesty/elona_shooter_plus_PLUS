import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../src/simulation.ts';
import { COMBAT_TRAIT, idleChainGun } from '../src/combat-stats.ts';
import { ItemFactory } from '../src/items.ts';
import { SAVE_VERSION } from '../src/save-version.ts';

function militia(): Simulation {
  const sim = new Simulation(42, { heroClass: 'militia' });
  sim.state.spawnTimer = 100000;
  assert.ok(sim.useSlot(3)); assert.equal(sim.weapon!.id, 16);
  return sim;
}
const hold = { fireHeld: true, aimX: 100, aimY: 100 };

test('manual Chain Gun winds up without bullets or recoil, then fires at the source counter boundary', () => {
  const sim = militia(), idle = militia(), ammo = sim.weapon!.ammo;
  for (let i = 0; i < 43; i++) {
    sim.tick(hold); idle.tick({ aimX: hold.aimX, aimY: hold.aimY });
    assert.equal(sim.weapon!.ammo, ammo); assert.equal(sim.state.player.accuracyFix, idle.state.player.accuracyFix);
    assert.ok(!sim.events.some(e => e.type === 'shot'));
  }
  assert.equal(sim.heroChainState!.chainMode, 3); assert.equal(sim.heroChainState!.chainPos, 86);
  sim.tick(hold);
  assert.equal(sim.weapon!.ammo, ammo - 1); assert.equal(sim.heroChainState!.chainPos, 82);
  assert.ok(sim.events.some(e => e.type === 'shot' && e.weaponId === 16));
  sim.tick(hold); assert.equal(sim.weapon!.ammo, ammo - 2);
});

test('release stops bullets, decays manual spin, and JSON replay, F toggles and weapon changes retain the right state', () => {
  const sim = militia(); for (let i = 0; i < 44; i++) sim.tick(hold);
  const ammo = sim.weapon!.ammo;
  sim.tick({ fireReleased: true });
  assert.equal(sim.weapon!.ammo, ammo); assert.equal(sim.heroChainState!.chainMode, 1);
  assert.equal(sim.heroChainState!.chainPos, 80);
  for (let i = 0; i < 5; i++) sim.tick();
  assert.equal(sim.heroChainState!.chainPos, 70);
  const saved = JSON.parse(JSON.stringify(sim.toSave())), replay = Simulation.fromSave(saved);
  for (let i = 0; i < 12; i++) { sim.tick(hold); replay.tick(hold); }
  assert.deepEqual(sim.toSave(), replay.toSave()); assert.ok(sim.weapon!.ammo < ammo);
  const spin = structuredClone(sim.heroChainState);
  sim.toggleFireAtWill(); assert.equal(sim.state.player.chainGun, undefined);
  for (const key of ['chainMode', 'chainPos', 'chainTime'] as const) assert.equal(sim.heroChainState![key], spin![key]);
  sim.toggleFireAtWill(); sim.tick({ fireReleased: true });
  assert.equal(sim.heroChainState!.chainMode, 1);
  assert.ok(sim.useSlot(0)); assert.ok(sim.useSlot(3));
  assert.equal(sim.heroChainState!.chainMode, 0); assert.equal(sim.heroChainState!.chainPos, 0);
  sim.tick(hold); assert.equal(sim.heroChainState!.chainMode, 2); assert.equal(sim.heroChainState!.chainPos, 2);
  const manual = militia(); manual.tick(hold); assert.ok(manual.useSlot(0));
  assert.equal(manual.state.player.chainGun, undefined);
});

test('sound cutoff is deterministic at a slower aimed-shot rate, and companions retain source idle spin', () => {
  const sim = militia(), ammo = sim.weapon!.ammo;
  sim.state.player.traits[COMBAT_TRAIT.AIMED_SHOT] = 1;
  for (let i = 0; i < 63; i++) sim.tick(hold);
  assert.equal(sim.heroChainState!.chainMode, 3); assert.ok(sim.heroChainState!.chainPos < 82);
  assert.equal(sim.weapon!.ammo, ammo);
  sim.tick(hold); sim.tick(hold); assert.equal(sim.weapon!.ammo, ammo - 1);
  const hunter = new Simulation(42, { heroClass: 'hunter' }); hunter.state.spawnTimer = 100000;
  hunter['spawnEnemy']('sheep'); const enemy = hunter.state.enemies[0]; enemy.x = 150; enemy.hp = enemy.maxHp = 100000;
  const girl = hunter.state.party.slots[0]; girl.weapon = new ItemFactory(() => 0.1).generate(16);
  girl.member!.traits[girl.weapon.reqTrait!] = girl.weapon.reqLv!;
  const ai = girl.member!.aiState!; Object.assign(ai, { targetUid: enemy.uid, aimCount: 0, shooting: true });
  const initialAmmo = girl.weapon.ammo;
  for (let i = 0; i < 43; i++) hunter.tick();
  assert.equal(girl.weapon.ammo, initialAmmo); assert.equal(ai.chainMode, 3);
  hunter.tick(); assert.equal(girl.weapon.ammo, initialAmmo - 1);
  ai.shooting = false; ai.aimCount = 100;
  for (let i = 0; i < 20; i++) hunter.tick();
  assert.equal(ai.chainMode, 1); assert.equal(ai.chainPos, 64);
  const settledAmmo = girl.weapon.ammo;
  hunter.tick(); assert.equal(girl.weapon.ammo, settledAmmo); assert.equal(ai.chainPos, 64);
  idleChainGun(ai, true); assert.equal(ai.chainPos, 62);
  assert.deepEqual(Simulation.fromSave(hunter.toSave()).toSave(), hunter.toSave());
});

test('old saves acquire no spin or RNG changes and invalid or duplicated manual spin is refused', () => {
  const old = new Simulation(42).toSave(); old.version = 38;
  const expected = structuredClone(old); expected.version = SAVE_VERSION;
  assert.deepEqual(Simulation.fromSave(old).toSave(), expected);
  const sim = militia(); sim.tick(hold); const saved = sim.toSave();
  for (const patch of [{ chainMode: 4 }, { chainPos: -1 }, { chainTime: 2463 }]) {
    const bad = structuredClone(saved); Object.assign(bad.player.chainGun!, patch);
    assert.throws(() => Simulation.fromSave(bad), /Chain Gun/);
  }
  const oldWithSpin = structuredClone(saved); oldWithSpin.version = 38;
  assert.throws(() => Simulation.fromSave(oldWithSpin), /Chain Gun/);
  sim.toggleFireAtWill(); const duplicated = sim.toSave(); duplicated.player.chainGun = { chainMode: 2, chainPos: 2 };
  assert.throws(() => Simulation.fromSave(duplicated), /Chain Gun/);
});
