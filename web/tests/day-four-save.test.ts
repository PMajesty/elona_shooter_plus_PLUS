import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation, type EnemyState } from '../src/simulation.ts';

function fourthDay(): Simulation {
  const simulation = new Simulation(42);
  for (let day = 1; day < 4; day++) {
    // Изолируем переходы дней от боевого AI; полное прохождение отдельно проверяет campaign soak.
    (simulation as unknown as { finishDay(): void }).finishDay();
    while (simulation.state.postbattle !== 'result') {
      if (simulation.state.postbattle === 'skill') simulation.chooseSkill(simulation.state.skillChoices[0]);
      else simulation.finishLoot();
    }
    assert.equal(simulation.enterTown(), true);
    assert.equal(simulation.startNextDay(), true);
  }
  simulation.state.newWave = false; simulation.state.waveIndex = 4; simulation.state.spawnTimer = 1000;
  return simulation;
}

test('Day4 boss shield preserves entry facing, then stops and turns; the whole countdown survives JSON reload', () => {
  const simulation = fourthDay();
  (simulation as unknown as { spawnEnemy(kind: 'boss'): void }).spawnEnemy('boss');
  const boss = simulation.state.enemies[0];
  Object.assign(boss, { bossAction: 2, bossCount: 1, bossFacing: 1, frame: 209, x: 300, speed: -1.27 });
  simulation.state.rng = 1;
  simulation.tick();
  assert.equal(boss.bossAction, 6); assert.equal(boss.frame, 222);
  assert.equal(boss.x, 298.7); assert.equal(boss.bossFacing, 1); assert.equal(boss.speed, -1.27);
  const restored = Simulation.fromSave(JSON.parse(JSON.stringify(simulation.toSave())));
  const duration = boss.bossCount;
  for (let frame = 1; frame <= duration + 5; frame++) {
    simulation.tick(); restored.tick();
    assert.deepEqual(restored.state, simulation.state); assert.deepEqual(restored.events, simulation.events);
    assert.equal(boss.bossFacing, -1); assert.equal(boss.x, 298.7);
    if (frame < duration) { assert.equal(boss.bossAction, 6); assert.equal(boss.frame, Math.min(222 + frame, 236)); }
    if (frame === duration) assert.equal(boss.bossAction, 2);
  }
});

test('guarded hits apply the source one-tenth-plus-one reduction without reactive-shield RNG draws', () => {
  const simulation = fourthDay();
  (simulation as unknown as { spawnEnemy(kind: 'boss'): void }).spawnEnemy('boss');
  const boss = simulation.state.enemies[0];
  Object.assign(boss, { bossAction: 6, bossCount: 150, speed: 0, frame: 236 });
  const before = simulation.state.rng, hp = boss.hp;
  (simulation as unknown as { damageEnemy(enemy: EnemyState, raw: number, critical: boolean, slot: null, x: number, y: number): void }).damageEnemy(boss, 60, false, null, boss.x, boss.y);
  assert.equal(boss.hp, hp - 7); assert.equal(simulation.state.rng, before);
  assert.equal(simulation.events.at(-1)!.amount, 7);
});

test('fourth perfect day grants medal61 only to the newly prepared mission and retains the historical Day4 mission', () => {
  const simulation = fourthDay();
  assert.equal(simulation.state.perfectDays, 3);
  assert.equal(simulation.state.activeMission.absorbFix, 0.01);
  (simulation as unknown as { finishDay(): void }).finishDay();
  while (simulation.state.postbattle !== 'result') {
    if (simulation.state.postbattle === 'skill') simulation.chooseSkill(simulation.state.skillChoices[0]);
    else simulation.finishLoot();
  }
  assert.equal(simulation.enterTown(), true);
  assert.equal(simulation.state.perfectDays, 4);
  assert.ok(simulation.state.earnedMedals.includes(61));
  assert.ok(simulation.state.town?.preparation === 'ready');
  assert.equal(simulation.state.town.mission.absorbFix, 0.02);
  assert.equal(simulation.state.activeMission.absorbFix, 0.01);
  assert.equal(simulation.state.previousTown!.mission.absorbFix, 0.01);
  assert.deepEqual(Simulation.fromSave(simulation.toSave()).state, simulation.state);
  assert.equal(simulation.startNextDay(), false);
});

test('v10 boss facing migrates without RNG or input mutation; current saves reject impossible facing/actions', () => {
  const simulation = new Simulation(42);
  (simulation as unknown as { spawnEnemy(kind: 'boss'): void }).spawnEnemy('boss');
  const legacy: Record<string, any> = simulation.toSave();
  legacy.version = 10; delete legacy.enemies[0].bossFacing;
  const untouched = structuredClone(legacy);
  const migrated = Simulation.fromSave(legacy);
  assert.deepEqual(legacy, untouched);
  assert.deepEqual(migrated.toSave(), { ...legacy, version: 11, enemies: legacy.enemies.map((enemy: EnemyState) => ({ ...enemy, bossFacing: -1 })) });
  for (const change of [
    (value: any) => { delete value.enemies[0].bossFacing; },
    (value: any) => { value.enemies[0].bossFacing = 0; },
    (value: any) => { value.enemies[0].bossAction = 5; },
    (value: any) => { value.enemies[0].bossAction = 6; },
    (value: any) => { value.enemies[0].frame = 404; },
    (value: any) => { value.enemies[0].frame = 2.5; },
  ]) {
    const invalid = migrated.toSave(); change(invalid);
    assert.throws(() => Simulation.fromSave(invalid));
  }
  const day4: Record<string, any> = fourthDay().toSave(); day4.version = 10;
  assert.throws(() => Simulation.fromSave(day4));
});
