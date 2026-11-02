import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../src/simulation.ts';
import { ItemFactory } from '../src/items.ts';
import { createProjectile, advanceProjectile, type ProjectileKind, type ProjectileState, type ProjectileCallbacks } from '../src/projectiles.ts';
import { asLegacyV7Save } from './legacy-save-support.ts';

const item = (id: number) => new ItemFactory(() => 0.5).generate(id);
const jsonSave = (simulation: Simulation) => JSON.parse(JSON.stringify(simulation.toSave()));

test('v7 in-flight grenade migration preserves its stored trajectory, damage, RNG and input without relaunching', () => {
  const simulation = new Simulation(42);
  simulation.state.inventory[1]!.attack = 73;
  assert.equal(simulation.throwGrenade(100, 230), true);
  for (let frame = 0; frame < 9; frame++) simulation.tick();
  const legacy = asLegacyV7Save(simulation.state);
  assert.equal(legacy.grenades.length, 1);
  // Потерянную точность прежних координат сохраняем, а не заменяем повторным расчётом полёта.
  legacy.grenades[0].x += 1e-9;
  legacy.grenades[0].y -= 1e-9;
  const untouched = structuredClone(legacy);
  const migrated = Simulation.fromSave(legacy);
  assert.deepEqual(legacy, untouched);
  assert.equal(migrated.state.version, 16);
  assert.equal(Object.hasOwn(migrated.state, 'grenades'), false);
  assert.equal(migrated.state.player.bowDrawing, false);
  assert.equal(migrated.state.rng, legacy.rng);
  const actor = migrated.state.projectiles[0], old = legacy.grenades[0];
  assert.equal(actor.kind, 'hand-grenade');
  assert.equal(actor.weaponSlot, null);
  for (const field of ['uid', 'x', 'y', 'startX', 'startY', 'targetX', 'targetY', 'damage'] as const) assert.equal(actor[field], old[field], field);
  assert.equal(actor.speed, -old.speed);
  assert.equal(actor.count, old.remaining);
  assert.equal(actor.frame, 9);
  assert.equal(actor.rotation, -36);
  const restored = Simulation.fromSave(jsonSave(migrated));
  let explosions = 0;
  for (let frame = 0; frame < 100; frame++) {
    migrated.tick(); restored.tick();
    explosions += migrated.events.filter(event => event.type === 'explosion').length;
    assert.deepEqual(restored.state, migrated.state);
    assert.deepEqual(restored.events, migrated.events);
  }
  assert.equal(explosions, 1);
  assert.equal(migrated.state.projectiles.length, 0);
});

test('v8 preserves all projectile families at active lifecycle checkpoints, including arrow fade and bolt shrink', () => {
  const cases: [ProjectileKind, number | null, number][] = [
    ['hand-grenade', null, 12], ['grenade', 21, 12], ['rocket', 22, 10],
    ['bolt', 23, 20], ['arrow', 24, 10], ['gravity', 27, 10], ['flame', 40, 10],
  ];
  for (const [kind, weaponId, speedBase] of cases) {
    const simulation = new Simulation(42);
    if (weaponId !== null) simulation.state.inventory[2] = item(weaponId);
    const actor = createProjectile({ uid: simulation.state.nextUid++, kind, weaponSlot: weaponId === null ? null : 2, damage: 37, startX: 510, startY: 245, targetX: 350, targetY: 220, speedBase, penetrations: kind === 'bolt' ? 1 : 0 });
    simulation.state.projectiles.push(actor);
    const silent = { hit: () => false, explode: () => {} };
    for (let frame = 0; frame < 3; frame++) advanceProjectile(actor, silent);
    if (kind === 'arrow') {
      while (actor.count > -40 && !actor.removed) advanceProjectile(actor, silent);
      assert.ok(actor.alpha < 0);
    }
    if (kind === 'bolt') {
      // Десять вычитаний 0.1 оставляют положительный остаток Number до следующего кадра.
      for (let shrink = 0; shrink < 10; shrink++) { actor.y = 100; advanceProjectile(actor, silent); }
      assert.ok(actor.scale > 0 && actor.scale < 1e-12);
    }
    assert.equal(actor.removed, false, kind);
    const saved = jsonSave(simulation), restored = Simulation.fromSave(saved);
    assert.deepEqual(restored.state, saved, kind);
    for (let frame = 0; frame < 10 && !actor.removed; frame++) {
      const left: unknown[] = [], right: unknown[] = [];
      advanceProjectile(actor, { hit: (...args) => { left.push(['hit', ...args]); return false; }, explode: (...args) => { left.push(['explode', ...args]); } });
      advanceProjectile(restored.state.projectiles[0], { hit: (...args) => { right.push(['hit', ...args]); return false; }, explode: (...args) => { right.push(['explode', ...args]); } });
      assert.deepEqual(restored.state.projectiles[0], actor, kind);
      assert.deepEqual(right, left, kind);
    }
  }
});

test('v8 rejects malformed projectile state and live non-gun references without mutating imports', () => {
  const simulation = new Simulation(42);
  simulation.state.inventory[2] = item(21);
  simulation.state.projectiles.push(createProjectile({ uid: simulation.state.nextUid++, kind: 'grenade', weaponSlot: 2, damage: 50, startX: 510, startY: 245, targetX: 100, targetY: 230, speedBase: 12 }));
  const valid = jsonSave(simulation);
  const changes: ((value: any) => void)[] = [
    value => { delete value.projectiles; }, value => { value.grenades = []; },
    value => { value.projectiles[0].kind = 'invented'; }, value => { delete value.projectiles[0].pulseFrame; },
    value => { value.projectiles[0].x = NaN; }, value => { value.projectiles[0].speed = 0; },
    value => { value.projectiles[0].targetX = value.projectiles[0].startX; },
    value => { value.projectiles[0].curve = 0; }, value => { value.projectiles[0].direction = -1; },
    value => { value.projectiles[0].count = 0; }, value => { value.projectiles[0].frame = 0.5; },
    value => { value.projectiles[0].weaponSlot = null; }, value => { value.projectiles[0].weaponSlot = 5; },
    value => { value.projectiles[0].uid = value.nextUid; }, value => { value.projectiles.push(structuredClone(value.projectiles[0])); },
    value => { value.inventory[2] = item(117); }, value => { value.projectiles[0].removed = true; },
    value => { value.projectiles[0].shadowVisible = 1; }, value => { value.player.bowDrawing = true; },
  ];
  for (const change of changes) {
    const invalid = structuredClone(valid); change(invalid);
    const untouched = structuredClone(invalid);
    assert.throws(() => Simulation.fromSave(invalid));
    assert.deepEqual(invalid, untouched);
  }
});

test('v8 preserves draw-and-release across reload and cancels draw when selection changes', () => {
  const simulation = new Simulation(42);
  simulation.state.inventory[2] = item(24);
  simulation.state.player.traits[103] = 1;
  assert.equal(simulation.useSlot(2), true);
  simulation.tick({ aimX: 200, aimY: 230, fireHeld: true });
  assert.equal(simulation.state.player.bowDrawing, true);
  assert.equal(simulation.state.projectiles.length, 0);
  const saved = jsonSave(simulation), restored = Simulation.fromSave(saved);
  assert.deepEqual(restored.state, saved);
  simulation.tick({ aimX: 150, aimY: 200, fireHeld: false });
  restored.tick({ aimX: 150, aimY: 200, fireHeld: false });
  assert.deepEqual(restored.state, simulation.state);
  assert.deepEqual(restored.events, simulation.events);
  assert.equal(restored.state.player.bowDrawing, false);
  assert.equal(restored.state.projectiles.length, 1);
  const cancelled = Simulation.fromSave(saved);
  cancelled.useSlot(0);
  assert.equal(cancelled.state.player.bowDrawing, false);
  cancelled.tick({ fireHeld: false });
  assert.equal(cancelled.state.projectiles.length, 0);
});

test('frozen postbattle projectiles allow inventory changes while their launch slot remains required in battle', () => {
  const simulation = new Simulation(42);
  simulation.state.inventory[2] = item(23);
  simulation.state.projectiles.push(createProjectile({ uid: simulation.state.nextUid++, kind: 'bolt', weaponSlot: 2, damage: 36, startX: 510, startY: 245, targetX: 200, targetY: 230, speedBase: 20, penetrations: 1 }));
  (simulation as unknown as { finishDay(): void }).finishDay();
  simulation.state.inventory[2] = item(117);
  const saved = jsonSave(simulation), restored = Simulation.fromSave(saved);
  assert.deepEqual(restored.state, saved);
  restored.tick({ firePressed: true });
  assert.deepEqual(restored.state, saved);
});

const verticalCases: [ProjectileKind, number | null, number][] = [
  ['hand-grenade', null, 12], ['grenade', 21, 12], ['rocket', 22, 10],
  ['bolt', 23, 20], ['arrow', 24, 10], ['gravity', 27, 10], ['flame', 40, 10],
];
type ProjectileObservation = { type: 'hit' | 'explode'; x: number; y: number; damage: number; slot: number | null; kind?: string };

function observeProjectile(events: ProjectileObservation[]): ProjectileCallbacks {
  return {
    hit: (x, y, damage, slot) => { events.push({ type: 'hit', x, y, damage, slot }); return false; },
    explode: (x, y, damage, slot, kind) => { events.push({ type: 'explode', x, y, damage, slot, kind }); },
  };
}

function assertFiniteVertical(actor: ProjectileState, label: string): void {
  for (const [key, value] of Object.entries(actor)) {
    if (typeof value === 'number') assert.ok(Number.isFinite(value), `${label}: finite ${key}`);
  }
  assert.equal(actor.x, 510, `${label}: no horizontal drift`);
  assert.ok(Math.abs(actor.y) <= 1000 && Math.abs(actor.shadowY) <= 1000, `${label}: bounded position`);
}

test('vertical fallback terminates every projectile family up, down and at the launch point with finite callbacks', () => {
  for (const [kind, weaponId, speedBase] of verticalCases) for (const targetY of [180, 300, 245]) {
    const label = `${kind} toward (510, ${targetY})`;
    const actor = createProjectile({ uid: 1, kind, weaponSlot: weaponId === null ? null : 2, damage: 37, startX: 510, startY: 245, targetX: 510, targetY, speedBase });
    const events: ProjectileObservation[] = [];
    const callbacks = observeProjectile(events);
    for (let frame = 0; frame < 1000 && !actor.removed; frame++) {
      assertFiniteVertical(actor, label);
      advanceProjectile(actor, callbacks);
    }
    assert.equal(actor.removed, true, `${label}: terminates within 1000 updates`);
    assertFiniteVertical(actor, label);
    assert.ok(events.length > 0, `${label}: exercises hit or explosion callbacks`);
    for (const event of events) {
      assert.ok(Number.isFinite(event.x) && Number.isFinite(event.y), `${label}: finite callback point`);
      assert.ok(Math.abs(event.y) <= 1000, `${label}: bounded callback point`);
      assert.equal(event.x, event.type === 'hit' ? 506 : 510, `${label}: source hit offset or explosion centre`);
      assert.equal(event.damage, 37, label);
      assert.equal(event.slot, weaponId === null ? null : 2, label);
    }
    if (kind === 'hand-grenade' || kind === 'grenade' || kind === 'rocket') {
      // Исправленная вертикальная траектория обязана взорваться именно в указанной точке.
      assert.deepEqual(events, [{ type: 'explode', x: 510, y: targetY, damage: 37, slot: weaponId === null ? null : 2, kind: kind === 'rocket' ? 'rocket' : 'grenade' }], label);
    } else if (kind === 'arrow' || kind === 'bolt') {
      assert.ok(events.every(event => event.type === 'hit'), label);
    } else {
      assert.ok(events.every(event => event.type === 'explode' && event.kind === kind), label);
    }
  }
});

test('vertical flight survives JSON save and restore without changing remaining callbacks or lifetime', () => {
  for (const [kind, weaponId, speedBase] of verticalCases) for (const targetY of [180, 300, 245]) {
    const label = `${kind} toward (510, ${targetY})`;
    const simulation = new Simulation(42);
    if (weaponId !== null) simulation.state.inventory[2] = item(weaponId);
    const actor = createProjectile({ uid: simulation.state.nextUid++, kind, weaponSlot: weaponId === null ? null : 2, damage: 37, startX: 510, startY: 245, targetX: 510, targetY, speedBase });
    simulation.state.projectiles.push(actor);
    // Нулевая дистанция гранаты завершается первым обновлением; остальные сохраняем в полёте.
    if (!(['hand-grenade', 'grenade'].includes(kind) && targetY === 245)) {
      const ignored: ProjectileObservation[] = [];
      for (let frame = 0; frame < 2; frame++) advanceProjectile(actor, observeProjectile(ignored));
      assert.ok(actor.frame > 0 && !actor.removed, `${label}: active checkpoint`);
    }
    const saved = jsonSave(simulation), restored = Simulation.fromSave(saved);
    assert.deepEqual(restored.state, saved, label);
    const resumedActor = restored.state.projectiles[0];
    const uninterrupted: ProjectileObservation[] = [], resumed: ProjectileObservation[] = [];
    for (let frame = 0; frame < 1000 && !actor.removed; frame++) {
      advanceProjectile(actor, observeProjectile(uninterrupted));
      advanceProjectile(resumedActor, observeProjectile(resumed));
      assert.deepEqual(resumedActor, actor, `${label}: continuation ${frame}`);
      assert.deepEqual(resumed, uninterrupted, `${label}: callbacks ${frame}`);
      assertFiniteVertical(resumedActor, label);
    }
    assert.equal(actor.removed, true, `${label}: restored flight terminates`);
  }
});

test('near-vertical fallback is bounded to its threshold and malformed saved progress is rejected', () => {
  const simulation = new Simulation(42);
  const makeActor = (targetX: number) => createProjectile({ uid: simulation.state.nextUid++, kind: 'hand-grenade', weaponSlot: null, damage: 45, startX: 510, startY: 245, targetX, targetY: 180, speedBase: 12 });
  const near = makeActor(510.005), ordinary = makeActor(510.02);
  assert.equal(near.targetX, 510);
  assert.equal(near.verticalProgress, 0);
  assert.equal(ordinary.targetX, 510.02, 'outside the fallback threshold the target remains unchanged');
  assert.equal(ordinary.verticalProgress, null);
  simulation.state.projectiles = [near];
  advanceProjectile(near, observeProjectile([]));
  const valid = jsonSave(simulation);
  assert.deepEqual(Simulation.fromSave(valid).state, valid);
  const changes: ((value: any) => void)[] = [
    value => { delete value.projectiles[0].verticalProgress; },
    value => { value.projectiles[0].verticalProgress = null; },
    value => { value.projectiles[0].verticalProgress = -1; },
    value => { value.projectiles[0].verticalProgress = NaN; },
    value => { value.projectiles[0].verticalProgress = Infinity; },
    value => { value.projectiles[0].verticalProgress = '12'; },
    value => { value.projectiles[0].x += 1; },
    value => { value.projectiles[0].targetX += 1; },
  ];
  for (const change of changes) {
    const invalid = structuredClone(valid); change(invalid);
    const untouched = structuredClone(invalid);
    assert.throws(() => Simulation.fromSave(invalid), /vertical projectile path/);
    assert.deepEqual(invalid, untouched);
  }
  simulation.state.projectiles = [ordinary];
  const normalSave = jsonSave(simulation);
  assert.deepEqual(Simulation.fromSave(normalSave).state, normalSave);
  normalSave.projectiles[0].verticalProgress = 0;
  assert.throws(() => Simulation.fromSave(normalSave), /vertical projectile path/);
});
