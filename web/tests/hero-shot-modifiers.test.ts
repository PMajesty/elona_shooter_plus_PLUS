import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../src/simulation.ts';
import { ItemFactory } from '../src/items.ts';
import type { HeroClass } from '../src/hero-classes.ts';
import { COMBAT_TRAIT, criticalKillCooldown } from '../src/combat-stats.ts';
import { SAVE_VERSION } from '../src/save-version.ts';

function manual(classId: HeroClass, weapon = 1): Simulation {
  const sim = new Simulation(20261103, { heroClass: classId, hitTest: () => true });
  const item = new ItemFactory(() => 0.2).generate(weapon);
  sim.state.inventory[0] = item;
  sim.state.player.traits[item.reqTrait!] = 10;
  return sim;
}

test('all four base classes apply One Shot through the actual manual-fire path', () => {
  for (const classId of ['hunter', 'rogue', 'sheriff', 'militia'] as const) {
    const sim = manual(classId);
    sim.state.player.traits[136] = 1;
    sim.state.inventory[0]!.ammo = 1;
    sim.tick({ firePressed: true, aimX: 300, aimY: 70 });
    const shot = sim.events.find(event => event.type === 'shot' && !event.actorSlot);
    assert.equal(shot?.oneShot, true, classId);
    assert.ok(shot?.pellets?.every(pellet => pellet.specialHitType === 2));
    assert.equal(sim.state.inventory[0]!.ammo, 0);
  }
});

test('Power Shot changes actual manual-hit damage on a base class', () => {
  const damage = (skill: number) => {
    const sim = manual('rogue');
    (sim as unknown as { random(): number }).random = () => 0;
    sim.state.inventory[0]!.automatic = false;
    sim.state.player.traits[140] = skill;
    (sim as unknown as { spawnEnemy(kind: string): void }).spawnEnemy('rat');
    Object.assign(sim.state.enemies.at(-1)!, { x: 400, y: 220, hp: 10000, maxHp: 10000, speed: 0 });
    sim.tick({ firePressed: true, aimX: 400, aimY: 220 });
    const shot = sim.events.find(event => event.type === 'shot');
    assert.ok(shot?.pellets?.every(pellet => pellet.specialHitType === (skill ? 1 : undefined)));
    return sim.events.find(event => event.type === 'hit' && !event.actorSlot)!.amount!;
  };
  assert.ok(damage(1) > damage(0));
});

test('One Hit Kill retains its source trail type on subsequent pellets in the actual shot', () => {
  const sim = manual('hunter');
  (sim as unknown as { random(): number }).random = () => 0;
  Object.assign(sim.state.inventory[0]!, { typeMinor: 1, shell: 2 });
  sim.state.player.traits[COMBAT_TRAIT.ONE_HIT_KILL] = 1;
  (sim as unknown as { spawnEnemy(kind: string): void }).spawnEnemy('rat');
  Object.assign(sim.state.enemies.at(-1)!, { x: 400, y: 220, hp: 10000, maxHp: 10000, speed: 0 });
  sim.tick({ firePressed: true, aimX: 400, aimY: 220 });
  const shot = sim.events.find(event => event.type === 'shot');
  assert.equal(shot?.pellets?.length, 2);
  assert.ok(shot?.pellets?.every(pellet => pellet.specialHitType === 3));
});

test('Killer reduces the actual cooldown after a manual base-class critical kill', () => {
  const fire = (skill: number) => {
    const sim = manual('hunter');
    (sim as unknown as { random(): number }).random = () => 0;
    sim.state.player.traits[COMBAT_TRAIT.SENSE] = 10;
    sim.state.player.traits[COMBAT_TRAIT.KILLER] = skill;
    (sim as unknown as { spawnEnemy(kind: string): void }).spawnEnemy('rat');
    Object.assign(sim.state.enemies.at(-1)!, { x: 400, y: 220, hp: 1, speed: 0 });
    sim.tick({ firePressed: true, aimX: 400, aimY: 220 });
    assert.ok(sim.events.some(event => event.type === 'kill' && event.critical));
    return sim;
  };
  const baseline = fire(0), skilled = fire(1);
  assert.equal(skilled.state.player.shootTimer, criticalKillCooldown(baseline.state.player.shootTimer, skilled.state.player.traits));
  assert.ok(skilled.state.player.shootTimer < baseline.state.player.shootTimer);
});

test('manual Burst counts early rifle rounds and survives save plus AI-control transfer', () => {
  const sim = manual('sheriff', 5);
  sim.state.player.traits[135] = 1;
  for (let shot = 0; shot < 3; shot++) {
    sim.state.player.shootTimer = 0;
    sim.tick({ firePressed: true, aimX: 300, aimY: 70 });
  }
  assert.equal(sim.heroClassState!.burst, 3);
  const saved = sim.toSave(), restored = Simulation.fromSave(saved);
  assert.deepEqual(restored.toSave(), saved);
  assert.equal(restored.toggleFireAtWill(), true);
  assert.equal(restored.heroClassState!.burst, 3);
  assert.equal(restored.state.player.classState, undefined);
  assert.equal(restored.toggleFireAtWill(), true);
  assert.equal(restored.heroClassState!.burst, 3);
  assert.deepEqual(Simulation.fromSave(restored.toSave()).toSave(), restored.toSave());
  const replay = Simulation.fromSave(restored.toSave());
  for (let frame = 0; frame < 45; frame++) {
    const input = { aimX: 300, aimY: 70, firePressed: frame === 3 || frame === 20, reload: frame === 21 };
    restored.tick(input); replay.tick(input);
    assert.deepEqual(replay.events, restored.events);
    assert.deepEqual(replay.toSave(), restored.toSave());
  }
});

test('v41 manual saves change only version; optional v42 Burst state is validated', () => {
  const legacy = structuredClone(manual('rogue').toSave()) as unknown as Record<string, any>;
  legacy.version = 41; delete legacy.player.classState;
  const before = structuredClone(legacy), upgraded = Simulation.fromSave(legacy).toSave();
  assert.equal(upgraded.version, SAVE_VERSION);
  assert.equal(upgraded.player.classState, undefined);
  const comparable = structuredClone(upgraded) as unknown as Record<string, any>;
  comparable.version = 41; delete comparable.player.classState;
  assert.deepEqual(comparable, before);
  assert.deepEqual(legacy, before);
  const invalid = structuredClone(upgraded); invalid.player.classState = { frenzy: 0, idleCount: 0, burst: -1 };
  assert.throws(() => Simulation.fromSave(invalid), /Invalid hero class state/);
  invalid.player.classState.burst = 0;
  assert.doesNotThrow(() => Simulation.fromSave(invalid));
  invalid.version = 41;
  assert.throws(() => Simulation.fromSave(invalid), /Invalid hero class state/);
});
