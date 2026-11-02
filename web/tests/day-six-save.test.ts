import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation, type EnemyState } from '../src/simulation.ts';

interface Boundary {
  finishDay(): void;
  spawnEnemy(kind: 'barbarian'): void;
  damageEnemy(enemy: EnemyState, damage: number, critical: boolean, slot: number | null, x: number, y: number): void;
}
const restore = (simulation: Simulation) => Simulation.fromSave(JSON.parse(JSON.stringify(simulation.toSave())));

function finishAndEnterTown(simulation: Simulation): void {
  (simulation as unknown as Boundary).finishDay();
  for (let step = 0; step < 20 && simulation.state.postbattle !== 'result'; step++) {
    if (simulation.state.postbattle === 'skill') assert.equal(simulation.chooseSkill(simulation.state.skillChoices[0]), true);
    else assert.equal(simulation.finishLoot(), true);
  }
  assert.equal(simulation.state.postbattle, 'result');
  assert.equal(simulation.enterTown(), true);
}

function dayBattle(day: 5 | 6): Simulation {
  const simulation = new Simulation(42);
  // Изолируем переходы и сохранения; это не автоматическое прохождение пяти боёв.
  while (simulation.state.day < day) {
    finishAndEnterTown(simulation);
    assert.equal(simulation.startNextDay(), true);
  }
  simulation.state.newWave = false; simulation.state.waveIndex = 4; simulation.state.spawnTimer = 1000;
  return simulation;
}

function isolatedBarbarian() {
  const simulation = dayBattle(6), boundary = simulation as unknown as Boundary;
  boundary.spawnEnemy('barbarian');
  const barbarian = simulation.state.enemies[0];
  barbarian.x = 100;
  return { simulation, boundary, barbarian };
}

function triggerRage(simulation: Simulation, boundary: Boundary, barbarian: EnemyState): void {
  // Управляемый RNG вызывает исходную ветку ярости через настоящий damageEnemy.
  simulation.state.rng = 12345;
  boundary.damageEnemy(barbarian, 1, false, null, barbarian.x, barbarian.y);
  assert.equal(barbarian.rampage, 100); assert.equal(barbarian.rageEffectFrame, 1);
  assert.equal(simulation.events.filter(event => event.type === 'enemy-rage').length, 1);
}

test('v12 saves gain only v13 title and result fields, without consuming RNG or mutating the input', () => {
  const simulation = dayBattle(5);
  for (let step = 0; step < 7; step++) simulation.tick();
  const legacy: Record<string, any> = simulation.toSave();
  legacy.version = 12; delete legacy.title; delete legacy.result.tax; delete legacy.result.salary;
  const before = structuredClone(legacy);
  const migrated = Simulation.fromSave(legacy);
  assert.deepEqual(migrated.toSave(), { ...legacy, version: 14, title: 0, result: { ...legacy.result, tax: 0, salary: 0 } });
  assert.equal(migrated.state.rng, legacy.rng);
  assert.deepEqual(legacy, before);
  assert.deepEqual(restore(migrated).state, migrated.state);
});

test('Day6 title claim spends four AP once, preserves already settled results and survives JSON restore', () => {
  const simulation = dayBattle(6);
  assert.equal(simulation.claimTitle(), 'unavailable');
  finishAndEnterTown(simulation);
  const before = simulation.toSave();
  assert.equal(before.town!.ap, 4); assert.equal(before.result.tax, 10); assert.equal(before.result.salary, 0);
  assert.equal(simulation.claimTitle(), 'claimed');
  assert.equal(simulation.state.title, 1); assert.equal(simulation.state.town!.ap, 0);
  assert.equal(simulation.state.gold, before.gold); assert.equal(simulation.state.totalMoney, before.totalMoney);
  assert.equal(simulation.state.rng, before.rng); assert.deepEqual(simulation.state.result, before.result);
  const restored = restore(simulation);
  assert.deepEqual(restored.state, simulation.state);
  const after = restored.toSave();
  assert.equal(restored.claimTitle(), 'unavailable');
  assert.deepEqual(restored.toSave(), after);
  // Источник запрещает новый титул при нехватке AP, сохраняя доступность на следующий день.
  const lowAp = Simulation.fromSave(before);
  lowAp.state.castleHp = 17;
  assert.equal(lowAp.freeRepair(), 'repaired');
  const repaired = lowAp.toSave();
  assert.equal(lowAp.state.town!.ap, 2);
  assert.equal(lowAp.claimTitle(), 'not-enough-ap');
  assert.deepEqual(lowAp.toSave(), repaired);
});

test('v13 rejects missing or invalid title/result fields and titles outside the supported town/day boundary', () => {
  const simulation = dayBattle(6); finishAndEnterTown(simulation);
  const valid = simulation.toSave();
  for (const corrupt of [
    (value: any) => { delete value.title; },
    (value: any) => { value.title = 2; },
    (value: any) => { value.title = '1'; },
    (value: any) => { delete value.result.tax; },
    (value: any) => { value.result.tax = -1; },
    (value: any) => { delete value.result.salary; },
    (value: any) => { value.result.salary = Number.NaN; },
    (value: any) => { value.result.salary = -1; },
  ]) {
    const invalid = structuredClone(valid); corrupt(invalid);
    assert.throws(() => Simulation.fromSave(invalid));
  }
  const battle = dayBattle(6).toSave(); battle.title = 1;
  assert.throws(() => Simulation.fromSave(battle), /Invalid title/);
  const earlier = dayBattle(5); finishAndEnterTown(earlier);
  const earlierSave = earlier.toSave(); earlierSave.title = 1;
  assert.throws(() => Simulation.fromSave(earlierSave), /Invalid title/);
});

test('Barbarian rage and its transient effect resume exactly, then the effect disappears on its thirteenth frame', () => {
  const { simulation, boundary, barbarian } = isolatedBarbarian();
  triggerRage(simulation, boundary, barbarian);
  const restored = restore(simulation);
  for (let step = 1; step <= 35; step++) {
    simulation.tick(); restored.tick();
    assert.deepEqual(restored.state, simulation.state); assert.deepEqual(restored.events, simulation.events);
    if (step === 11) assert.equal(barbarian.rageEffectFrame, 12);
    if (step >= 12) assert.equal(barbarian.rageEffectFrame, 0);
    assert.equal(barbarian.rampage, 100);
  }
  const rng = simulation.state.rng;
  boundary.damageEnemy(barbarian, 1, false, null, barbarian.x, barbarian.y);
  assert.equal(simulation.state.rng, rng);
  assert.equal(barbarian.rageEffectFrame, 0);
  assert.equal(simulation.events.filter(event => event.type === 'enemy-rage').length, 0);
});

test('raging Barbarian attack frame45 damages once, and an actual Sheriff hit restores walking through saved knockback', () => {
  const { simulation, boundary, barbarian } = isolatedBarbarian();
  triggerRage(simulation, boundary, barbarian);
  barbarian.x = 454;
  simulation.tick();
  assert.equal(barbarian.attacking, true); assert.equal(barbarian.speed, 0);
  assert.equal(barbarian.frame, 38);
  let restored = restore(simulation);
  const hp = simulation.state.castleHp;
  for (let step = 0; step < 12 && barbarian.frame < 44; step++) {
    simulation.tick(); restored.tick();
    assert.deepEqual(restored.state, simulation.state); assert.deepEqual(restored.events, simulation.events);
    assert.equal(simulation.state.castleHp, hp);
  }
  assert.equal(barbarian.frame, 44);
  simulation.tick(); restored.tick();
  assert.equal(barbarian.frame, 45);
  assert.deepEqual(restored.state, simulation.state); assert.deepEqual(restored.events, simulation.events);
  assert.equal(simulation.events.filter(event => event.type === 'castle-hit').length, 1);
  assert.ok(simulation.state.castleHp < hp);
  boundary.damageEnemy(barbarian, 1, false, 0, barbarian.x, barbarian.y);
  assert.ok(barbarian.knockBack > 0); assert.equal(barbarian.attacking, true);
  const recoveredSpeed = barbarian.speedOrg;
  restored = restore(simulation);
  simulation.tick(); restored.tick();
  assert.equal(barbarian.attacking, false); assert.equal(barbarian.frame, 4);
  assert.equal(barbarian.speed, recoveredSpeed); assert.equal(barbarian.rampage, 100);
  assert.deepEqual(restored.state, simulation.state); assert.deepEqual(restored.events, simulation.events);
  for (let step = 0; step < 12; step++) {
    simulation.tick(); restored.tick();
    assert.deepEqual(restored.state, simulation.state); assert.deepEqual(restored.events, simulation.events);
  }
});

test('lethal Barbarian damage starts84, holds119 and removes at252 after200 updates across save/load', () => {
  const { simulation, boundary, barbarian } = isolatedBarbarian();
  boundary.damageEnemy(barbarian, barbarian.hp, false, null, barbarian.x, barbarian.y);
  assert.equal(barbarian.hp, 0); assert.equal(barbarian.frame, 84);
  const restored = restore(simulation);
  for (let step = 1; step <= 200; step++) {
    simulation.tick(); restored.tick();
    assert.deepEqual(restored.state, simulation.state); assert.deepEqual(restored.events, simulation.events);
    if (step < 200) assert.equal(barbarian.frame, Math.min(84 + step, 119));
    if (step === 35 || step === 199) assert.deepEqual(restore(simulation).state, simulation.state);
  }
  assert.equal(barbarian.frame, 252); assert.equal(barbarian.hp, -1); assert.equal(barbarian.deathTicks, 201);
  assert.equal(barbarian.removed, true); assert.equal(simulation.state.enemies.length, 0);
});

test('overlapping Barbarian blood and critical effects retain their separate ages through JSON reload', () => {
  const { simulation, boundary, barbarian } = isolatedBarbarian();
  triggerRage(simulation, boundary, barbarian);
  simulation.tick(); simulation.tick();
  boundary.damageEnemy(barbarian, 1, true, null, barbarian.x, barbarian.y);
  assert.deepEqual(barbarian.hitEffects!.map(effect => effect.frame), [52, 50, 70]);
  const restored = restore(simulation);
  for (let step = 1; step <= 14; step++) {
    simulation.tick(); restored.tick();
    assert.deepEqual(restored.state, simulation.state); assert.deepEqual(restored.events, simulation.events);
    if (step === 5) assert.equal(barbarian.hitEffects!.at(-1)!.frame, 75);
    if (step === 6) assert.equal(barbarian.hitEffects!.length, 2);
    if (step === 11) assert.equal(barbarian.hitEffects!.length, 1);
    if (step >= 13) assert.deepEqual(barbarian.hitEffects, []);
  }
});

test('Barbarian saves require the v13 rage, animation and effect fields', () => {
  const { simulation } = isolatedBarbarian();
  for (const corrupt of [
    (value: any) => { delete value.enemies[0].rampage; },
    (value: any) => { value.enemies[0].rampage = 1; },
    (value: any) => { value.enemies[0].rageEffectFrame = 1; },
    (value: any) => { delete value.enemies[0].rageEffectFrame; },
    (value: any) => { value.enemies[0].rampage = 100; value.enemies[0].rageEffectFrame = 13; },
    (value: any) => { value.enemies[0].rampage = 100; value.enemies[0].rageEffectFrame = 1.5; },
    (value: any) => { value.enemies[0].frame = 120; },
    (value: any) => { value.enemies[0].frame = 0; },
    (value: any) => { value.enemies[0].hitEffects = {}; },
    (value: any) => { value.enemies[0].hitEffects = [{ frame: 63, x: 0, y: 0 }]; },
    (value: any) => { value.enemies[0].hitEffects = [{ frame: 50, x: Infinity, y: 0 }]; },
  ]) {
    const invalid = simulation.toSave(); corrupt(invalid);
    assert.throws(() => Simulation.fromSave(invalid));
  }
  // Изолируем версию самого врага от отдельного запрета Day6 в старом формате.
  const olderDay = new Simulation(42);
  (olderDay as unknown as Boundary).spawnEnemy('barbarian');
  const legacy: Record<string, any> = olderDay.toSave(); legacy.version = 12;
  assert.throws(() => Simulation.fromSave(legacy), /Invalid Barbarian state/);
});
