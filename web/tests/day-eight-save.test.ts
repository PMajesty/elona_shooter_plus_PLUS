import { SAVE_VERSION } from '../src/save-version.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation, type EnemyState } from '../src/simulation.ts';
import { castleUpkeep, type CastleUpgradeKind } from '../src/castle-upgrades.ts';

interface Boundary {
  finishDay(): void;
  prepareResult(): void;
  spawnEnemy(kind: 'lava'): void;
  damageEnemy(enemy: EnemyState, damage: number, critical: boolean, slot: number | null, x: number, y: number): void;
}
const boundary = (simulation: Simulation) => simulation as unknown as Boundary;
const restore = (simulation: Simulation) => Simulation.fromSave(JSON.parse(JSON.stringify(simulation.toSave())));
function settle(simulation: Simulation): void {
  boundary(simulation).finishDay();
  for (let step = 0; step < 30 && simulation.state.postbattle !== 'result'; step++) {
    if (simulation.state.postbattle === 'skill') assert.equal(simulation.chooseSkill(simulation.state.skillChoices[0]), true);
    else assert.equal(simulation.finishLoot(), true);
  }
  assert.equal(simulation.state.postbattle, 'result');
}
function seventhTown(): Simulation {
  const simulation = new Simulation(42);
  // Контролируемая последовательность завершений изолирует переходы: это не прохождение семи боёв.
  for (let day = 1; day <= 7; day++) {
    settle(simulation); assert.equal(simulation.enterTown(), true);
    if (day < 7) assert.equal(simulation.startNextDay(), true);
  }
  return simulation;
}
function eighthBattle(hire = false): Simulation {
  const simulation = seventhTown();
  if (hire) {
    assert.equal(simulation.requestRecruit(), 'previewed'); assert.equal(simulation.resolvePartyAction(true), 'hired');
  }
  assert.equal(simulation.startNextDay(), true);
  // Обычные tick остаются активны; изолируем только следующую запланированную волну.
  simulation.state.newWave = false; simulation.state.waveIndex = 4; simulation.state.spawnTimer = 1000;
  return simulation;
}
function spawn(simulation: Simulation, x: number) {
  boundary(simulation).spawnEnemy('lava');
  const enemy = simulation.state.enemies.at(-1)!; enemy.x = x;
  return enemy;
}
function tickPair(simulation: Simulation, resumed: Simulation): void {
  simulation.tick(); resumed.tick();
  assert.deepEqual(resumed.state, simulation.state); assert.deepEqual(resumed.events, simulation.events);
}

test('v22 town7 migrates without rerolls and normal Rest preserves upgrades, party and the prepared .03 mission', () => {
  const simulation = seventhTown();
  assert.equal(simulation.claimTitle(), 'claimed');
  for (const kind of ['house', 'wall', 'repairman', 'sandbag', 'storage', 'looter', 'trainer'] as CastleUpgradeKind[]) {
    assert.equal(simulation.buyCastleUpgrade(kind), 'purchased');
  }
  assert.equal(simulation.requestRecruit(), 'previewed'); assert.equal(simulation.resolvePartyAction(true), 'hired');
  const before = simulation.toSave();
  assert.equal(before.perfectDays, 7); assert.ok(before.earnedMedals.includes(62));
  assert.ok(before.town?.preparation === 'ready'); assert.equal(before.town.mission.absorbFix, 0.03);
  const legacy: Record<string, any> = structuredClone(before); legacy.version = 22;
  const untouched = structuredClone(legacy), migrated = Simulation.fromSave(legacy);
  assert.deepEqual(migrated.toSave(), { ...before, version: SAVE_VERSION }); assert.deepEqual(legacy, untouched);
  assert.equal(migrated.state.rng, before.rng);
  assert.equal(simulation.startNextDay(), true); assert.equal(migrated.startNextDay(), true);
  assert.deepEqual(migrated.state, simulation.state); assert.deepEqual(migrated.events, simulation.events);
  assert.equal(simulation.state.day, 8); assert.equal(simulation.state.activeMission.level, 7);
  assert.equal(simulation.state.activeMission.absorbFix, 0.03); assert.equal(simulation.state.title, 1);
  assert.deepEqual(simulation.state.previousTown, before.town);
  assert.equal(simulation.state.gold, before.gold); assert.equal(simulation.state.castleHp, before.castleHp);
  for (const key of ['wallLevel', 'wallFixCount', 'repairmanLevel', 'sandbagLevel', 'looterLevel', 'trainerLevel'] as const) {
    assert.equal(simulation.state[key], before[key]);
  }
  assert.equal(simulation.state.inventory.length, 7); assert.equal(simulation.state.party.capacity, 2);
  assert.equal(simulation.state.party.slots[0].exists, true);
  assert.equal(simulation.state.party.slots[0].member!.name, before.party.slots[0].member!.name);
  assert.deepEqual(simulation.state.party.slots[0].member!.traits, before.party.slots[0].member!.traits);
  assert.deepEqual(simulation.state.party.slots[4], before.party.slots[4]);
  assert.deepEqual(restore(simulation).state, simulation.state);
});

test('Lava attack, self-explosion and removal resume exactly without a kill reward or second castle hit', () => {
  const simulation = eighthBattle(), enemy = spawn(simulation, 454);
  let resumed = restore(simulation), hits = 0, explosions = 0;
  const before = { kills: simulation.state.kills, gold: simulation.state.gold, exp: simulation.state.player.exp };
  while (!enemy.attacking) tickPair(simulation, resumed);
  assert.equal(enemy.shadowHit, false); assert.equal(enemy.alerted, true);
  while (enemy.frame < 34) tickPair(simulation, resumed);
  resumed = restore(simulation);
  tickPair(simulation, resumed);
  assert.equal(enemy.frame, 35); assert.equal(enemy.hp, -1);
  hits += simulation.events.filter(event => event.type === 'castle-hit').length;
  explosions += simulation.events.filter(event => event.type === 'lava-explode').length;
  assert.equal(hits, 1); assert.equal(explosions, 1);
  assert.deepEqual({ kills: simulation.state.kills, gold: simulation.state.gold, exp: simulation.state.player.exp }, before);
  resumed = restore(simulation);
  for (let step = 0; step < 30 && simulation.state.enemies.length; step++) {
    tickPair(simulation, resumed);
    hits += simulation.events.filter(event => event.type === 'castle-hit').length;
    explosions += simulation.events.filter(event => event.type === 'lava-explode').length;
  }
  assert.equal(simulation.state.enemies.length, 0); assert.equal(enemy.frame, 223);
  assert.equal(hits, 1); assert.equal(explosions, 1);
  assert.deepEqual(restore(simulation).state, simulation.state);
});

test('a killed Lava uses the ordinary death path and persists overlapping blood and critical effects', () => {
  const simulation = eighthBattle(), enemy = spawn(simulation, 100);
  boundary(simulation).damageEnemy(enemy, 1, true, null, enemy.x, enemy.y);
  assert.deepEqual(enemy.hitEffects!.map(effect => effect.frame), [50, 70]);
  assert.deepEqual(restore(simulation).state, simulation.state);
  const oldKills = simulation.state.kills;
  boundary(simulation).damageEnemy(enemy, enemy.hp + 1, false, null, enemy.x, enemy.y);
  assert.equal(simulation.state.kills, oldKills + 1); assert.equal(enemy.frame, 98);
  let resumed = restore(simulation), explosions = 0;
  for (let step = 0; step < 200; step++) {
    tickPair(simulation, resumed);
    explosions += simulation.events.filter(event => event.type === 'lava-explode').length;
    if (step === 29) { assert.equal(enemy.frame, 128); resumed = restore(simulation); }
  }
  assert.equal(explosions, 0); assert.equal(simulation.state.enemies.length, 0);
  assert.equal(enemy.frame, 223); assert.deepEqual(restore(simulation).state, simulation.state);
});

test('Lava crossing the warning line assigns a real companion alert and preserves its target across a save', () => {
  const simulation = eighthBattle(true), enemy = spawn(simulation, 154);
  const member = simulation.state.party.slots[0].member!;
  assert.ok(member.aiState); assert.equal(member.aiState.onMark, false); assert.equal(enemy.alerted, false);
  const resumed = restore(simulation); tickPair(simulation, resumed);
  assert.equal(enemy.alerted, true); assert.equal(enemy.onMark, true);
  assert.equal(member.aiState.onMark, true); assert.equal(member.aiState.targetUid, enemy.uid);
  assert.ok(member.aiState.aimCount >= 2);
  assert.deepEqual(restore(simulation).state, simulation.state);
});

test('v23 rejects Lava in older or earlier saves and rejects missing alert history and malformed hit effects', () => {
  const simulation = eighthBattle(), enemy = spawn(simulation, 100), valid = simulation.toSave();
  for (const change of [
    (value: any) => { value.version = 22; },
    (value: any) => { value.day = 7; },
    (value: any) => { delete value.enemies[0].alerted; },
    (value: any) => { value.enemies[0].alerted = 1; },
    (value: any) => { value.enemies[0].frame = 129; },
    (value: any) => { delete value.enemies[0].hitEffects; },
    (value: any) => { value.enemies[0].hitEffects = [{ frame: 63, x: 0, y: 0 }]; },
  ]) {
    const invalid = structuredClone(valid); change(invalid); assert.throws(() => Simulation.fromSave(invalid));
  }
  const earlier = seventhTown(); assert.equal(earlier.state.day, 7);
  const oldDay = earlier.toSave(); oldDay.enemies = [structuredClone(enemy)]; oldDay.nextUid = enemy.uid + 1;
  assert.throws(() => Simulation.fromSave(oldDay), /Invalid Lava state/);
  const earlierWave = earlier.toSave(); earlierWave.waves[0].enemies = ['lava']; earlierWave.waves[0].delays = [30]; earlierWave.waves[0].initialCount = 1;
  assert.throws(() => Simulation.fromSave(earlierWave), /Lava is unavailable/);
});

test('Day8 settlement is paid once and prepares a resumable town8 with exact onward Rest', () => {
  const simulation = seventhTown(); assert.equal(simulation.claimTitle(), 'claimed');
  assert.equal(simulation.buyCastleUpgrade('repairman'), 'purchased');
  assert.equal(simulation.startNextDay(), true);
  const gold = simulation.state.gold; settle(simulation);
  assert.equal(simulation.state.result.reward, 740); assert.equal(simulation.state.result.perfectBonus, 222);
  assert.equal(simulation.state.result.tax, 80); assert.equal(simulation.state.result.salary, 100);
  assert.equal(simulation.state.result.upkeep, castleUpkeep(simulation.state));
  assert.equal(simulation.state.gold, gold + simulation.state.result.netReward);
  assert.equal(simulation.state.perfectDays, 8); assert.ok(simulation.state.earnedMedals.includes(62));
  assert.equal(simulation.state.earnedMedals.includes(63), false);
  let resumed = restore(simulation); const paid = resumed.toSave(); boundary(resumed).prepareResult();
  assert.deepEqual(resumed.toSave(), paid);
  assert.equal(simulation.enterTown(), true); assert.equal(resumed.enterTown(), true);
  assert.deepEqual(resumed.state, simulation.state);
  assert.ok(simulation.state.town?.preparation === 'ready');
  assert.equal(simulation.state.town.mission.level, 8); assert.equal(simulation.state.town.mission.absorbFix, 0.03);
  resumed = restore(simulation); const town = resumed.toSave();
  assert.equal(resumed.claimTitle(), 'unavailable'); assert.deepEqual(resumed.toSave(), town);
  assert.equal(resumed.startNextDay(), true); assert.equal(simulation.startNextDay(), true);
  assert.equal(resumed.state.day, 9); assert.deepEqual(resumed.state, simulation.state);
});
