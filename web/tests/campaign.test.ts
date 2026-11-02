import assert from 'node:assert/strict';
import test from 'node:test';
import { writeFileSync, mkdirSync } from 'node:fs';
import { Simulation, type SimulationState } from '../src/simulation.ts';
import { calendarLoot, generateLowLevelMission, generateLowLevelWaves, MAX_CAMPAIGN_DAY } from '../src/missions.ts';
import { ENEMIES, type EnemyKind } from '../src/content.ts';
import { ENEMY_TIMELINES } from '../src/enemy-timelines.ts';
import { prepareEarlyTown } from '../src/town-preparation.ts';
import { SAVE_VERSION } from '../src/save-version.ts';

const seeded = (seed: number) => () => {
  seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
  return (seed >>> 0) / 4294967296;
};

function atDay(day: number): Simulation {
  const sim = new Simulation(42), random = seeded(321);
  const mission = generateLowLevelMission(day - 1, Math.max(1, day - 1), random);
  sim.state.day = day;
  sim.state.activeMission = Object.fromEntries(Object.keys(sim.state.activeMission).map(key => [key, mission[key as keyof typeof mission]])) as SimulationState['activeMission'];
  sim.state.waves = generateLowLevelWaves(mission, day, random).waves;
  sim.state.waveIndex = mission.wave; sim.state.bossWave = mission.bossWave;
  sim.state.loot = mission.loot;
  if (day > 1) {
    const town = prepareEarlyTown(random, day - 1);
    town.mission = mission;
    sim.state.previousTown = { ...town, ap: 4, preparation: 'ready' };
  }
  return sim;
}

test('shared mission rules generate every first-cycle encounter and all boss-day groups across seeded runs', () => {
  const kinds = new Set<EnemyKind>();
  for (let seed = 1; seed <= 12; seed++) for (let day = 1; day <= MAX_CAMPAIGN_DAY; day++) {
    const random = seeded(seed), mission = generateLowLevelMission(day - 1, Math.max(1, day - 1), random);
    const waves = generateLowLevelWaves(mission, day, random).waves;
    assert.equal(waves.length, mission.wave);
    for (const wave of waves) {
      assert.equal(wave.enemies.length, wave.delays.length);
      for (const kind of wave.enemies) { assert.ok(ENEMIES[kind]); kinds.add(kind); }
    }
    if (day % 10 === 0) assert.equal(waves[mission.bossWave].enemies.length, 1 + Math.trunc(Math.sqrt(day - 1)));
  }
  for (const kind of Object.keys(ENEMY_TIMELINES)) assert.ok(kinds.has(kind as EnemyKind), `Missing encounter: ${kind}`);
  assert.deepEqual(calendarLoot(39), [1035, 1115]);
  assert.deepEqual(calendarLoot(20), [1109]);
});

test('every later enemy runs its source attack timeline or drops rats, with resumable AI state', () => {
  for (const kind of Object.keys(ENEMY_TIMELINES) as EnemyKind[]) {
    const sim = atDay(35);
    sim.state.castleHp = sim.state.castleMaxHp = 10000;
    sim['spawnEnemy'](kind);
    const enemy = sim.state.enemies[0]; enemy.x = kind === 'bird' ? 0 : 440;
    const before = sim.state.castleHp;
    for (let i = 0; i < 500 && !enemy.removed; i++) sim['tickEnemy'](enemy);
    if (kind === 'bird') assert.ok(sim.state.enemies.some(e => e.kind === 'dropped-rat'));
    else assert.ok(sim.state.castleHp < before, `${kind} must damage the castle`);
    assert.deepEqual(Simulation.fromSave(sim.toSave()).toSave(), sim.toSave());
  }
});

test('later combat, armor targeting and dropped enemies replay identically across JSON save restoration', () => {
  const sim = atDay(30); sim.state.castleHp = sim.state.castleMaxHp = 100000;
  for (const kind of Object.keys(ENEMY_TIMELINES) as EnemyKind[]) sim['spawnEnemy'](kind);
  for (let i = 0; i < 200; i++) sim.tick();
  const restored = Simulation.fromSave(JSON.parse(JSON.stringify(sim.toSave())));
  for (let i = 0; i < 250; i++) {
    const input = { aimX: 220, aimY: 230, firePressed: i % 20 === 0 };
    sim.tick(input); restored.tick(input); assert.deepEqual(restored.events, sim.events);
  }
  assert.deepEqual(restored.toSave(), sim.toSave());
});

test('later boss rockets are visual projectiles with immediate castle damage and can be restored', () => {
  const sim = atDay(25); sim['spawnEnemy']('boss');
  const boss = sim.state.enemies[0];
  Object.assign(boss, { x: 200, bossAction: 5, bossIdle: 0, bossSpecial: 'rocket' });
  const hp = sim.state.castleHp;
  sim['tickBoss'](boss);
  assert.equal(sim.state.castleHp, hp - boss.attack * 5);
  assert.ok(sim.state.projectiles.some(projectile => projectile.kind === 'rocket' && projectile.damage === -1));
  assert.deepEqual(Simulation.fromSave(sim.toSave()).toSave(), sim.toSave());
});

test('stopped Spider and Ghost poses cannot drift into an attack animation away from the castle', () => {
  for (const kind of ['spider', 'ghost'] as const) {
    const sim = atDay(25); sim['spawnEnemy'](kind);
    const enemy = sim.state.enemies[0], timeline = ENEMY_TIMELINES[kind];
    Object.assign(enemy, { x: 100, frame: timeline.labels.stop, speed: 0, attacking: false });
    const hp = sim.state.castleHp;
    for (let i = 0; i < 100; i++) sim['advanceLaterEnemy'](enemy, timeline);
    assert.equal(enemy.frame, timeline.labels.stop); assert.equal(sim.state.castleHp, hp);
  }
});

test('campaign imports reject unimplemented cycles and malformed later AI, armor rows and wave configurations', () => {
  const sim = atDay(25); sim['spawnEnemy']('tank');
  for (const change of [
    (save: SimulationState) => { save.day = 41; },
    (save: SimulationState) => { save.enemies[0].behaviorCounter = NaN; },
    (save: SimulationState) => { save.enemies[0].frame = 10000; },
    (save: SimulationState) => { save.enemies[0].type = 0; },
  ]) {
    const save = sim.toSave(); change(save); assert.throws(() => Simulation.fromSave(save));
  }
  const mission = generateLowLevelMission(20, 20, seeded(2)); mission.wave = 1;
  assert.throws(() => generateLowLevelWaves(mission, 21, seeded(3)), /wave configuration/);
});

test('controlled equipment completes the full 40-day progression with natural waves, rewards, towns and save boundaries', () => {
  let sim = new Simulation(42);
  // Усиленное снаряжение проверяет связность кампании, а не исходную сложность.
  sim.state.castleHp = sim.state.castleMaxHp = 1000000;
  Object.assign(sim.state.inventory[0]!, { attack: 1000000, baseAccuracy: 1000000, ammoMax: 1000, ammo: 1000, shootRate: 1 });
  const encountered = new Set<EnemyKind>();
  let frames = 0;
  for (let day = 1; day <= MAX_CAMPAIGN_DAY; day++) {
    for (let i = 0; i < 20000 && sim.state.phase === 'battle'; i++) {
      for (const enemy of sim.state.enemies) encountered.add(enemy.kind);
      const target = sim.state.enemies.filter(enemy => enemy.hp > 0 && !enemy.removed).sort((a, b) => b.x - a.x)[0];
      const weapon = sim.weapon!;
      sim.tick({ aimX: target?.x ?? 250, aimY: target?.y ?? 230, firePressed: Boolean(target) && weapon.reloadTime === 0, reload: weapon.ammo === 0 });
      frames++;
    }
    assert.equal(sim.state.phase, 'victory', `Day ${day} stalled`);
    while (sim.state.postbattle === 'loot' || sim.state.postbattle === 'boss-loot') assert.ok(sim.finishLoot());
    while (sim.state.postbattle === 'skill') assert.ok(sim.chooseSkill(sim.state.skillChoices[0]));
    assert.ok(sim.enterTown());
    sim = Simulation.fromSave(JSON.parse(JSON.stringify(sim.toSave())));
    assert.equal(sim.state.day, day);
    if (day < MAX_CAMPAIGN_DAY) { assert.ok(sim.startNextDay()); sim = Simulation.fromSave(sim.toSave()); }
    if (day === 25) {
      mkdirSync('../.build/browser-qa', { recursive: true });
      writeFileSync('../.build/browser-qa/campaign-town25.json', JSON.stringify({ format: 'elona-shooter-browser', version: SAVE_VERSION, appearance: 0, simulation: sim.toSave() }));
    }
  }
  assert.equal(sim.startNextDay(), false);
  for (const kind of Object.keys(ENEMY_TIMELINES)) assert.ok(encountered.has(kind as EnemyKind), `Campaign never encountered ${kind}`);
  console.log(`Controlled campaign: ${frames} simulation frames, ${encountered.size} enemy kinds, forty towns and save boundaries.`);
});
