import assert from 'node:assert/strict';
import test from 'node:test';
import { writeFileSync, mkdirSync } from 'node:fs';
import { Simulation, type SimulationState } from '../src/simulation.ts';
import { calendarLoot, generateLowLevelMission, generateLowLevelWaves, MAX_CAMPAIGN_DAY } from '../src/missions.ts';
import { ENEMIES, type EnemyKind } from '../src/content.ts';
import { ENEMY_TIMELINES } from '../src/enemy-timelines.ts';
import { prepareEarlyTown } from '../src/town-preparation.ts';
import { SAVE_VERSION } from '../src/save-version.ts';
import { generateHenchman } from '../src/party.ts';
import { ItemFactory } from '../src/items.ts';
import { RAT_DROP_BODY_X, ratDropLocalPoint } from '../src/bird-drop.ts';
import { createEnemyArrow, createEnemyShot, advanceEnemyArrow } from '../src/enemy-arrows.ts';

test('Disarm truncates attack before a boss pistol volley, including an older in-flight save', () => {
  const hitTest = () => true;
  const sim = new Simulation(42, { heroClass: 'sniper', hitTest });
  sim.state.player.traits[130] = 1;
  sim.state.inventory[0] = new ItemFactory(() => 0.5).generate(1);
  sim.state.player.traits[sim.weapon!.reqTrait!] = 20;
  sim['random'] = () => 0.5; sim['spawnEnemy']('boss');
  const boss = sim.state.enemies[0];
  Object.assign(boss, { x: 250, y: 230, attack: 3, hp: 10000, maxHp: 10000, bossAction: 1, bossWeapon: 1, bossIdle: 0, bossFireNum: 1 });
  assert.ok(sim.fireAt(250, 230)); assert.equal(boss.attack, 2);
  const old = sim.toSave(); old.version = 44; old.enemies[0].attack = 2.5;
  for (const run of [sim, Simulation.fromSave(old, { hitTest })]) {
    run.tick();
    assert.equal(run.events.find(event => event.type === 'castle-hit')?.amount, 8);
  }
});

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
  sim.state.loot = [...mission.loot];
  if (day > 1) {
    const town = prepareEarlyTown(random, day - 1);
    town.mission = mission;
    sim.state.previousTown = { ...town, ap: 4, preparation: 'ready' };
  }
  return sim;
}

test('late ranged enemies launch original visible attacks at the damage frame, with resumable flights and no impact damage', () => {
  for (const [kind, frame, shotKind] of [['cata', 113, 'bolt'], ['tank', 102, 'tank-bolt'], ['dino', 146, null], ['dragon', 66, 'fireball']] as const) {
    const sim = atDay(35); sim.state.spawnTimer = 100000;
    sim['spawnEnemy'](kind); const enemy = sim.state.enemies[0];
    Object.assign(enemy, { x: 220, speed: 0, frame: frame - 1, attacking: true });
    const hp = sim.state.castleHp, attack = enemy.attack, rng = sim.state.rng;
    sim.tick();
    assert.equal(enemy.frame, frame);
    assert.equal(sim.state.castleHp, hp - attack);
    assert.ok(sim.events.some(event => event.type === 'enemy-attack' && event.enemyKind === kind));
    assert.equal(sim.state.enemyArrows.length, shotKind ? 1 : 0);
    if (shotKind) {
      const shot = sim.state.enemyArrows[0];
      assert.equal(shot.kind, shotKind); assert.equal(shot.age, 0);
      assert.equal(shot.x, 220 + (kind === 'tank' ? 65 : 50));
    }
    const save = sim.toSave(), restored = Simulation.fromSave(JSON.parse(JSON.stringify(save)));
    assert.deepEqual(restored.toSave(), save);
    for (let tick = 0; tick < 30; tick++) {
      sim.tick(); restored.tick();
      assert.deepEqual(restored.toSave(), sim.toSave()); assert.deepEqual(restored.events, sim.events);
      assert.equal(sim.state.castleHp, hp - attack);
    }
    assert.equal(sim.state.enemyArrows.length, 0);
    assert.notEqual(sim.state.rng, rng); // Только исходное damageCastle расходует случайные числа.
  }
});

test('Cata/Tank bolts and Dragon fireball follow source per-frame positions, rotation and lifetime without RNG', () => {
  const bolt = createEnemyShot(1, 'bolt', 220, 240), tank = createEnemyShot(2, 'tank-bolt', 220, 240);
  assert.equal(bolt.y, -34.05); assert.equal(tank.y, -27.55);
  assert.equal(bolt.rotation, 74); assert.equal(bolt.shadowY, -12.05);
  advanceEnemyArrow(bolt); advanceEnemyArrow(tank);
  assert.deepEqual([bolt.x, tank.x, bolt.y, tank.y, bolt.rotation, bolt.shadowY], [295, 310, 211.1, 211.1, 75, 250]);
  const fireball = createEnemyShot(3, 'fireball', 220, 90);
  assert.equal(fireball.y, -34.5); advanceEnemyArrow(fireball);
  assert.deepEqual([fireball.x, fireball.y, fireball.rotation], [295, 97.5, 100]);
  for (let tick = 0; tick < 14; tick++) advanceEnemyArrow(fireball);
  assert.equal(fireball.x, 645); assert.equal(fireball.removed, false);
  advanceEnemyArrow(fireball); assert.equal(fireball.removed, true);
});

test('v40 arrows keep their exact legacy fields and RNG while new shot kinds are validated', () => {
  const sim = new Simulation(42); sim.state.spawnTimer = 100000;
  sim.state.enemyArrows.push(createEnemyArrow(sim.state.nextUid++, 220, 240));
  const legacy = sim.toSave(); legacy.version = 40;
  const untouched = structuredClone(legacy), restored = Simulation.fromSave(legacy);
  assert.deepEqual(restored.toSave(), { ...legacy, version: SAVE_VERSION });
  assert.deepEqual(legacy, untouched);
  for (const kind of ['bolt', 'tank-bolt', 'fireball'] as const) {
    const save = sim.toSave(); save.enemyArrows[0] = createEnemyShot(save.enemyArrows[0].uid, kind, 220, 240);
    assert.deepEqual(Simulation.fromSave(save).toSave(), save);
    for (const invalidKind of ['invented', ['bolt'], null, 7, {}]) {
      const invalid = structuredClone(save); (invalid.enemyArrows[0] as any).kind = invalidKind;
      assert.throws(() => Simulation.fromSave(invalid), /enemy arrow/);
    }
    save.version = 40; assert.throws(() => Simulation.fromSave(save), /enemy arrow/);
  }
});

test('bird drops retain ground anchors, drift, tilt and aerial AI targeting from the original enemy rules', () => {
  const sim = atDay(35); sim.state.spawnTimer = 100000;
  sim['spawnEnemy']('bird'); const bird = sim.state.enemies[0]; bird.x = 120; bird.y = 70;
  const originalRandom = sim['random'].bind(sim); sim['random'] = () => 0.99;
  sim['tickEnemy'](bird); sim['random'] = originalRandom;
  const rat = sim.state.enemies.find(enemy => enemy.kind === 'dropped-rat')!;
  assert.ok(rat.dropping); assert.equal(rat.y + rat.dropY!, 100);
  assert.ok(rat.y >= 170); assert.equal(rat.dropDrift, -0.5); assert.equal(rat.dropFrame, 1);
  assert.ok(sim.events.some(event => event.type === 'enemy-drop'));
  const before = { x: rat.x, y: rat.dropY! };
  sim['random'] = () => 0.96; sim['tickEnemy'](rat); sim['random'] = originalRandom;
  assert.equal(rat.x, before.x - 0.5); assert.equal(rat.dropY, before.y + 1.5);
  assert.equal(rat.dropRotation, -0.7); assert.equal(rat.dropDrift, 0.5);
  assert.equal(sim.state.partyAI.targets[0][0].uid, rat.uid);
  const local = ratDropLocalPoint(rat, rat.x + RAT_DROP_BODY_X, rat.y + rat.dropY!);
  assert.ok(Math.abs(local.x) < 1e-10 && Math.abs(local.y) < 1e-10);
  const knockX = rat.x, knockY = rat.dropY!;
  rat.knockBack = 2; sim['random'] = () => 0.1; sim['tickEnemy'](rat); sim['random'] = originalRandom;
  assert.ok(Math.abs(rat.x - (knockX - 1 / 40 - 1.1 / 2 - 0.2 + 0.5)) < 1e-10);
  assert.equal(rat.knockBack, 1); assert.equal(rat.dropY, knockY + 1.5);
  sim.toggleFireAtWill(); const ai = sim.state.heroAI!.state;
  Object.assign(ai, { targetUid: rat.uid, cursorY: 200, aimTime: 10, aimCount: 100, shooting: false });
  const expectedCursor = Math.trunc((200 + (rat.y + rat.dropY! - 200 + 1.5) / 10) * 20) / 20;
  sim.tick(); assert.equal(ai.cursorY, expectedCursor);
  const replay = Simulation.fromSave(JSON.parse(JSON.stringify(sim.toSave())));
  for (let i = 0; i < 25; i++) { sim.tick(); replay.tick(); }
  assert.deepEqual(sim.toSave(), replay.toSave());
});

test('killing an airborne rat stops drift, accelerates its fall and enters ordinary death on landing', () => {
  const sim = atDay(35); sim['spawnEnemy']('dropped-rat'); const rat = sim.state.enemies[0];
  rat.x = 220; rat.y = 250; rat.dropY = -6; rat.dropRotation = 7;
  sim['damageEnemy'](rat, 1000000, false);
  assert.equal(rat.frame, 2); assert.equal(rat.dropFrame, 16);
  const rng = sim.state.rng;
  sim['tickEnemy'](rat); assert.equal(rat.dropY, 2); assert.equal(rat.dropRotation, 0);
  assert.equal(rat.x, 220); assert.equal(sim.state.rng, rng); assert.equal(rat.dropFrame, 17);
  const copy = Simulation.fromSave(JSON.parse(JSON.stringify(sim.toSave())));
  for (let i = 0; i < 2; i++) { sim['tickEnemy'](rat); copy['tickEnemy'](copy.state.enemies[0]); }
  assert.equal(rat.dropping, undefined); assert.equal(rat.dropY, undefined);
  assert.equal(rat.frame, 93); assert.equal(rat.deathTicks, 3); assert.equal(rat.shadowHit, false);
  assert.deepEqual(sim.toSave(), copy.toSave());
});

test('legacy falling-rat saves migrate without RNG draws and malformed new fall state is refused', () => {
  const sim = atDay(35); sim['spawnEnemy']('dropped-rat'); const saved = sim.toSave(), old = saved.enemies[0];
  saved.version = 39; old.y = 100; old.fallTargetY = 250;
  for (const key of ['dropping', 'dropY', 'dropDrift', 'dropRotation', 'dropFrame'] as const) delete old[key];
  const migrated = Simulation.fromSave(saved).toSave(), rat = migrated.enemies[0];
  assert.equal(rat.y, 250); assert.equal(rat.dropY, -150); assert.equal(rat.dropDrift, 0.5);
  assert.equal(rat.fallTargetY, undefined); assert.equal(migrated.rng, saved.rng);
  assert.deepEqual(Simulation.fromSave(migrated).toSave(), migrated);
  for (const patch of [{ dropFrame: 15 }, { dropY: 17 }, { dropDrift: 1 }]) {
    const bad = structuredClone(migrated); Object.assign(bad.enemies[0], patch);
    assert.throws(() => Simulation.fromSave(bad), /dropped rat/);
  }
});

test('shared mission rules generate every first-cycle encounter and all boss-day groups across seeded runs', () => {
  const kinds = new Set<EnemyKind>();
  for (let seed = 1; seed <= 12; seed++) for (let day = 1; day <= 40; day++) {
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

test('campaign imports reject unsupported days and malformed later AI, armor rows and wave configurations', () => {
  const sim = atDay(25); sim['spawnEnemy']('tank');
  for (const change of [
    (save: SimulationState) => { save.day = MAX_CAMPAIGN_DAY + 1; },
    (save: SimulationState) => { save.enemies[0].behaviorCounter = NaN; },
    (save: SimulationState) => { save.enemies[0].frame = 10000; },
    (save: SimulationState) => { save.enemies[0].type = 0; },
  ]) {
    const save = sim.toSave(); change(save); assert.throws(() => Simulation.fromSave(save));
  }
  const mission = generateLowLevelMission(20, 20, seeded(2)); mission.wave = 1;
  assert.throws(() => generateLowLevelWaves(mission, 21, seeded(3)), /wave configuration/);
});

test('later cycles use source fixed levels for selection, real levels for boss counts and calendar loot', () => {
  for (const [level, fixedLv, strength, powerOrg] of [[40, 3, 200, 3750], [46, 9, 200, 4470], [80, 6, 400, 6700], [120, 9, 600, 9650], [999, 111, 4800, 76280]]) {
    const mission = generateLowLevelMission(level, level, seeded(42));
    assert.deepEqual([mission.fixedLv, mission.strength, mission.powerOrg], [fixedLv, strength, powerOrg]);
    assert.equal(mission.bossDay, fixedLv % 10 === 9);
    const waves = generateLowLevelWaves(mission, level + 1, seeded(45)).waves;
    if (mission.bossDay) assert.equal(waves[mission.bossWave].enemies.length, 1 + Math.trunc(Math.sqrt(level)));
    assert.ok(waves.every(wave => wave.delays.every(Number.isFinite)));
  }
  const later = generateLowLevelMission(43, 43, seeded(42));
  const early = generateLowLevelMission(6, 43, seeded(42));
  later.powerOrg = early.powerOrg;
  assert.deepEqual(generateLowLevelWaves(later, 44, seeded(78)), generateLowLevelWaves(early, 44, seeded(78)));
  assert.deepEqual(calendarLoot(79), [1115]);
  assert.deepEqual(Simulation.fromSave(atDay(1000).toSave()).toSave(), atDay(1000).toSave());
  const hired = atDay(1000);
  generateHenchman(hired.state.party, 999, seeded(42));
  hired.state.activeMission.hire = hired.state.previousTown!.mission.hire = true;
  hired['initializePartyBattle']();
  assert.deepEqual(Simulation.fromSave(hired.toSave()).toSave(), hired.toSave());
});

test('cycle strength and source large variants affect actual spawned stats and geometry, with resumable state', () => {
  const sim = atDay(41);
  sim['random'] = () => 0.99;
  sim['spawnEnemy']('sheep');
  const sheep = sim.state.enemies[0];
  assert.equal(sheep.large, true);
  assert.equal(sheep.hp, Math.trunc(42 * 340 / 100) * 3);
  assert.equal(sheep.attack, 2);
  assert.equal(sheep.speed, (0.7 + 0.99 * 0.4) * 125 / 100 * 0.75);
  assert.equal(sheep.exp, (1 + Math.trunc(70 * 0.4)) * 2);
  assert.ok(sim['hitEnemy'](sheep, sheep.x + 24, sheep.y));
  assert.equal(sim['hitEnemy']({ ...sheep, large: undefined }, sheep.x + 24, sheep.y), false);
  for (const kind of ['boss', 'ogre', 'dino', 'dragon', 'dropped-rat'] as const) {
    sim['spawnEnemy'](kind); assert.equal(sim.state.enemies.at(-1)!.large, undefined);
  }
  const boss = sim.state.enemies.find(enemy => enemy.kind === 'boss')!;
  assert.equal(boss.hp, 1150); assert.equal(boss.attack, 3);
  sim['spawnEnemy']('sister-bomb');
  assert.equal(sim.state.enemies.at(-1)!.large, true);
  assert.equal(sim.state.enemies.at(-1)!.attack, 610);
  const resumed = Simulation.fromSave(JSON.parse(JSON.stringify(sim.toSave())));
  // Убираем контролируемый генератор до проверки обычного сохранённого RNG.
  delete (sim as unknown as { random?: unknown }).random;
  for (let i = 0; i < 80; i++) { sim.tick(); resumed.tick(); assert.deepEqual(resumed.events, sim.events); }
  assert.deepEqual(resumed.toSave(), sim.toSave());
  for (const change of [
    (save: SimulationState) => { save.enemies[0].large = false as true; },
    (save: SimulationState) => { save.enemies.find(enemy => enemy.kind === 'boss')!.large = true; },
    (save: SimulationState) => { save.activeMission.strength = 0; },
    (save: SimulationState) => { save.version = 31; },
  ]) { const save = sim.toSave(); change(save); assert.throws(() => Simulation.fromSave(save)); }
  const old = new Simulation(42).toSave(); old.version = 31;
  assert.deepEqual(Simulation.fromSave(old).toSave(), { ...old, version: SAVE_VERSION });
});

test('ordinary Rest, combat, rewards and saves cross the first two cycle boundaries', () => {
  for (const start of [39, 77]) {
    let sim = atDay(start);
    sim.state.castleHp = sim.state.castleMaxHp = 1000000;
    Object.assign(sim.state.inventory[0]!, { attack: 1000000, baseAccuracy: 1000000, ammoMax: 1000, ammo: 1000, shootRate: 1 });
    for (let day = start; day < start + 6; day++) {
      for (let frame = 0; frame < 30000 && sim.state.phase === 'battle'; frame++) {
        const target = sim.state.enemies.filter(enemy => enemy.hp > 0 && !enemy.removed).sort((a, b) => b.x - a.x)[0];
        sim.tick({ aimX: target?.x ?? 250, aimY: target?.y ?? 230, firePressed: Boolean(target), reload: sim.weapon!.ammo === 0 });
      }
      assert.equal(sim.state.phase, 'victory', `Day ${day} stalled`);
      while (['loot', 'boss-loot'].includes(sim.state.postbattle)) assert.ok(sim.finishLoot());
      while (sim.state.postbattle === 'skill') assert.ok(sim.chooseSkill(sim.state.skillChoices[0]));
      assert.ok(sim.enterTown());
      sim = Simulation.fromSave(JSON.parse(JSON.stringify(sim.toSave())));
      if (day === 40) {
        mkdirSync('../.build/browser-qa', { recursive: true });
        writeFileSync('../.build/browser-qa/cycle-town40.json', JSON.stringify({ format: 'elona-shooter-browser', version: SAVE_VERSION, appearance: 0, simulation: sim.toSave() }));
      }
      assert.ok(sim.startNextDay());
      sim = Simulation.fromSave(sim.toSave());
      assert.equal(sim.state.day, day + 1);
    }
  }
});

test('controlled equipment completes the full 40-day progression with natural waves, rewards, towns and save boundaries', () => {
  let sim = new Simulation(42);
  // Усиленное снаряжение проверяет связность кампании, а не исходную сложность.
  sim.state.castleHp = sim.state.castleMaxHp = 1000000;
  Object.assign(sim.state.inventory[0]!, { attack: 1000000, baseAccuracy: 1000000, ammoMax: 1000, ammo: 1000, shootRate: 1 });
  const encountered = new Set<EnemyKind>();
  let frames = 0;
  for (let day = 1; day <= 40; day++) {
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
    if (day < 40) { assert.ok(sim.startNextDay()); sim = Simulation.fromSave(sim.toSave()); }
    if (day === 25) {
      mkdirSync('../.build/browser-qa', { recursive: true });
      writeFileSync('../.build/browser-qa/campaign-town25.json', JSON.stringify({ format: 'elona-shooter-browser', version: SAVE_VERSION, appearance: 0, simulation: sim.toSave() }));
    }
  }
  assert.ok(sim.startNextDay());
  assert.equal(sim.state.day, 41);
  // Случайный выбор редких видов не гарантирует каждый вид за один цикл; выше проверены все виды отдельно.
  console.log(`Controlled campaign: ${frames} simulation frames, ${encountered.size} enemy kinds (${[...encountered].sort().join(', ')}), forty towns and save boundaries.`);
});
