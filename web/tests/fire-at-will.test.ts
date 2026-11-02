import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../src/simulation.ts';
import { ItemFactory } from '../src/items.ts';
import { SAVE_VERSION } from '../src/save-version.ts';

test('F is battle-only, uses original aiming/workrate and preserves RNG and the existing class meter', () => {
  const sim = new Simulation(42, { heroClass: 'sniper', deferOpeningWaves: true });
  assert.equal(sim.toggleFireAtWill(), false); assert.ok(sim.startOpeningBattle());
  Object.assign(sim.state.player.classState!, { frenzy: 7, idleCount: 4, burst: 2 });
  const rng = sim.state.rng;
  assert.ok(sim.toggleFireAtWill()); assert.equal(sim.fireAtWill, true);
  const ai = sim.state.heroAI!.state, traits = sim.state.player.traits;
  assert.equal(ai.aimTime, Math.max(2, (18 - Math.sqrt(traits[900]) * 1.4 - traits[900] * 0.05) * 100 / (100 + sim.state.partySkills.effects[116])));
  assert.equal(ai.workRate, Math.min(0.3, 0.03 + Math.sqrt(traits[901]) * 0.025));
  assert.deepEqual([ai.frenzy, ai.idleCount, ai.burst], [7, 4, 2]);
  assert.equal(sim.state.player.classState, undefined);
  assert.ok(sim.toggleFireAtWill()); assert.equal(sim.fireAtWill, false);
  assert.equal(sim.state.rng, rng);
  assert.deepEqual(Simulation.fromSave(sim.toSave()).toSave(), sim.toSave());
  sim.state.phase = 'defeat'; assert.equal(sim.toggleFireAtWill(), false);
});

test('Fire at will acquires enemies, shoots, reloads and earns kills without player aiming or clicks', () => {
  const sim = new Simulation(42); sim.toggleFireAtWill();
  let shots = 0, reloads = 0, hits = 0;
  for (let tick = 0; tick < 2200 && sim.state.phase === 'battle'; tick++) {
    sim.tick({ aimX: 6000, aimY: 6000 });
    shots += sim.events.filter(e => e.type === 'shot' && !e.actorSlot).length;
    reloads += sim.events.filter(e => e.type === 'reload' && !e.actorSlot).length;
    hits += sim.events.filter(e => e.type === 'hit' && !e.actorSlot).length;
  }
  assert.ok(shots > 5); assert.ok(reloads > 0); assert.ok(hits > 0); assert.ok(sim.state.kills > 0);
  assert.equal(sim.state.aimX, 6000);
  assert.equal(sim.fireAt(300, 200), false, 'Manual firing must not bypass the AI target while F is enabled.');
  assert.deepEqual(Simulation.fromSave(sim.toSave()).toSave(), sim.toSave());
});

test('AI and manual modes replay exactly through JSON, including a bow and advanced-class meters', () => {
  for (const heroClass of ['sheriff', 'hunter', 'sniper', 'duelist'] as const) {
    const sim = new Simulation(42, { heroClass }); sim.toggleFireAtWill();
    for (let i = 0; i < 500; i++) sim.tick();
    const restored = Simulation.fromSave(JSON.parse(JSON.stringify(sim.toSave())));
    for (let i = 0; i < 420; i++) {
      if (i === 80 || i === 200) { sim.toggleFireAtWill(); restored.toggleFireAtWill(); }
      const input = { aimX: 200, aimY: 220, firePressed: i % 25 === 0, fireHeld: i % 25 < 15 };
      sim.tick(input); restored.tick(input); assert.deepEqual(restored.events, sim.events);
    }
    assert.deepEqual(restored.toSave(), sim.toSave());
    assert.deepEqual(Simulation.fromSave(sim.toSave()).toSave(), sim.toSave());
  }
});

test('AI projectile ownership follows the selected inventory slot and returns to manual control', () => {
  const sim = new Simulation(42);
  sim.state.inventory[2] = new ItemFactory(() => 0.5).generate(24);
  sim.state.player.traits[sim.state.inventory[2]!.reqTrait!] = 50;
  assert.ok(sim.useSlot(2)); sim.toggleFireAtWill();
  let arrow = false;
  for (let i = 0; i < 1200 && sim.state.phase === 'battle'; i++) {
    sim.tick();
    if (sim.state.projectiles.some(p => (p.actorSlot ?? 0) === 0 && p.weaponSlot === 2)) {
      arrow = true; assert.deepEqual(Simulation.fromSave(sim.toSave()).toSave(), sim.toSave()); break;
    }
  }
  assert.ok(arrow); sim.toggleFireAtWill();
  sim.state.player.shootTimer = 0; sim.weapon!.reloadTime = 0;
  assert.ok(sim.fireAt(250, 220));
  assert.equal(sim.fireAtWill, false);
});

test('new missions reset F and its AI, restoring the ordinary advanced-class meter', () => {
  const sim = new Simulation(42, { heroClass: 'sniper' }); sim.toggleFireAtWill();
  sim['finishDay']();
  while (['loot', 'boss-loot'].includes(sim.state.postbattle)) sim.finishLoot();
  while (sim.state.postbattle === 'skill') sim.chooseSkill(sim.state.skillChoices[0]);
  assert.ok(sim.enterTown()); assert.equal(sim.toggleFireAtWill(), false);
  assert.ok(sim.startNextDay());
  assert.equal(sim.fireAtWill, false); assert.equal(sim.state.heroAI, undefined);
  assert.deepEqual(sim.state.player.classState, { frenzy: 0, idleCount: 0, burst: 0 });
  assert.deepEqual(Simulation.fromSave(sim.toSave()).toSave(), sim.toSave());
});

test('mouse input in AI mode cancels a manual reload and triggers the AI target before aim completes', () => {
  const sim = new Simulation(42); sim.toggleFireAtWill(); sim['spawnEnemy']('sheep');
  const enemy = sim.state.enemies[0], ai = sim.state.heroAI!.state;
  enemy.x = 200;
  ai.targetUid = enemy.uid; ai.aimCount = 100; ai.shooting = false;
  sim.weapon!.reloadTime = 20; sim.weapon!.ammo = 2;
  sim.tick({ firePressed: true, fireHeld: true, aimX: 6000, aimY: 6000 });
  assert.equal(sim.weapon!.reloadTime, 0); assert.equal(sim.weapon!.ammo, 2);
  assert.ok(sim.events.some(e => e.type === 'reloaded'));
  sim.state.player.shootTimer = 0;
  sim.tick({ firePressed: true, fireHeld: true, aimX: 6000, aimY: 6000 });
  assert.ok(ai.aimCount > 0); assert.equal(sim.weapon!.ammo, 1);
  assert.ok(sim.events.some(e => e.type === 'shot'));
  sim.tick({ fireReleased: true }); assert.equal(ai.shooting, false); assert.equal(ai.burst, 0);
});

test('v37 adventures migrate without AI state or extra RNG and malformed AI saves are refused', () => {
  const sim = new Simulation(42), legacy = sim.toSave(); legacy.version = 37;
  const expected = structuredClone(legacy); expected.version = SAVE_VERSION;
  assert.deepEqual(Simulation.fromSave(legacy).toSave(), expected);
  sim.toggleFireAtWill(); const valid = sim.toSave();
  for (const mutate of [
    (s: any) => { s.version = 37; },
    (s: any) => { s.heroAI.enabled = 'yes'; },
    (s: any) => { s.heroAI.state.workRate = 1; },
    (s: any) => { s.heroAI.state.targetUid = 999999; },
    (s: any) => { s.player.classState = { frenzy: 0, idleCount: 0, burst: 0 }; },
  ]) {
    const invalid = structuredClone(valid); mutate(invalid);
    assert.throws(() => Simulation.fromSave(invalid), /Fire at will|hero target|class state/);
  }
});
