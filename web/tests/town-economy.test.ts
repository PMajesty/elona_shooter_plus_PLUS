import assert from 'node:assert/strict';
import test from 'node:test';
import { writeFileSync, mkdirSync } from 'node:fs';
import { Simulation, type ReadyTown } from '../src/simulation.ts';
import { castleUpgradeCost, castleUpkeep } from '../src/castle-upgrades.ts';
import { museumIncome } from '../src/town-economy.ts';
import { SAVE_VERSION } from '../src/save-version.ts';
import { isOccupiedItem } from '../src/items.ts';
import type { HeroClass } from '../src/hero-classes.ts';

function settle(sim: Simulation): void {
  sim['finishDay']();
  while (sim.state.postbattle === 'loot' || sim.state.postbattle === 'boss-loot') assert.ok(sim.finishLoot());
  while (sim.state.postbattle === 'skill') assert.ok(sim.chooseSkill(sim.state.skillChoices[0]));
  assert.ok(sim.enterTown());
}
function town(classId: HeroClass = 'sheriff'): Simulation {
  const sim = new Simulation(42, { heroClass: classId }); settle(sim);
  sim.state.gold = 1000000; sim.state.town!.ap = 14;
  return sim;
}
const restore = (sim: Simulation) => Simulation.fromSave(JSON.parse(JSON.stringify(sim.toSave())));

test('Castle page two prices, caps and Smith purchases regenerate stock without resetting mission or owned items', () => {
  const sim = town();
  assert.deepEqual(['smith', 'museum', 'chicken', 'sister', 'villa', 'special-trainer'].map(kind => castleUpgradeCost(kind as any, sim.state)), [200, 2000, 20, 250, 2500, 2500]);
  const mission = structuredClone((sim.state.town as ReadyTown).mission), inventory = structuredClone(sim.state.inventory);
  for (let level = 1; level <= 6; level++) {
    assert.equal(sim.buyCastleUpgrade('smith'), 'purchased');
    assert.equal((sim.state.town as ReadyTown).shop.filter(isOccupiedItem).length, 2 + level);
    assert.deepEqual((sim.state.town as ReadyTown).mission, mission); assert.deepEqual(sim.state.inventory, inventory);
  }
  assert.equal(sim.state.town!.ap, 14);
  const capped = sim.toSave(); assert.equal(sim.buyCastleUpgrade('smith'), 'capped'); assert.deepEqual(sim.toSave(), capped);
  for (let level = 1; level <= 9; level++) assert.equal(sim.buyCastleUpgrade('special-trainer'), 'purchased');
  const trainingCap = sim.toSave(); assert.equal(sim.buyCastleUpgrade('special-trainer'), 'capped'); assert.deepEqual(sim.toSave(), trainingCap);
  sim.state.gold = 0; const empty = sim.toSave();
  assert.equal(sim.buyCastleUpgrade('villa'), 'not-enough-gold'); assert.deepEqual(sim.toSave(), empty);
  assert.deepEqual(restore(sim).toSave(), sim.toSave());
});

test('stock and recruit refresh each cost two AP and preserve owned equipment and the prepared mission', () => {
  const sim = town('hunter'); sim.buyCastleUpgrade('smith');
  const inventory = structuredClone(sim.state.inventory), girl = structuredClone(sim.state.party.slots[0]);
  const mission = structuredClone((sim.state.town as ReadyTown).mission), rng = sim.state.rng;
  assert.equal(sim.refreshTownStock(), 'refreshed'); assert.notEqual(sim.state.rng, rng);
  assert.equal(sim.refreshTownRecruit(), 'refreshed'); assert.equal(sim.state.town!.ap, 10);
  assert.deepEqual(sim.state.inventory, inventory); assert.deepEqual(sim.state.party.slots[0], girl);
  assert.deepEqual((sim.state.town as ReadyTown).mission, mission);
  assert.equal(sim.state.party.slots[4].member?.name, (sim.state.town as ReadyTown).recruit.name);
  sim.state.town!.ap = 1; const before = sim.toSave();
  assert.equal(sim.refreshTownStock(), 'not-enough-ap'); assert.equal(sim.refreshTownRecruit(), 'not-enough-ap');
  assert.deepEqual(sim.toSave(), before); assert.deepEqual(restore(sim).toSave(), before);
});

test('chickens produce collectable eggs from the next town, once per day, with medal bonuses', () => {
  let sim = town();
  for (let i = 0; i < 30; i++) assert.equal(sim.buyCastleUpgrade('chicken'), 'purchased');
  assert.ok(sim.state.earnedMedals.includes(50)); assert.equal(sim.townActivityAvailable('eggs'), false);
  assert.ok(sim.startNextDay()); settle(sim); sim = restore(sim);
  const before = sim.state.gold, ap = sim.state.town!.ap;
  assert.equal(sim.performTownActivity('eggs').outcome, 'done');
  assert.equal(sim.state.town!.ap, ap - 1);
  assert.equal(sim.state.gold - before, Math.trunc(sim.state.economy.eggsCollected * 12 * 1.05));
  const collected = sim.toSave(); assert.equal(sim.performTownActivity('eggs').outcome, 'unavailable');
  assert.deepEqual(sim.toSave(), collected); assert.deepEqual(restore(sim).toSave(), collected);
  assert.ok(sim.startNextDay()); settle(sim); assert.equal(sim.townActivityAvailable('eggs'), true);
});

test('Museum income and upkeep start at the next settlement and are paid once across saves', () => {
  let sim = town(); const paid = structuredClone(sim.state.result), baseUpkeep = castleUpkeep(sim.state);
  assert.equal(sim.buyCastleUpgrade('museum'), 'purchased'); assert.deepEqual(sim.state.result, paid);
  assert.equal(castleUpkeep(sim.state), baseUpkeep + 15);
  assert.ok(sim.startNextDay()); settle(sim);
  const expected = museumIncome(1, sim.state.earnedMedals);
  assert.equal(sim.state.result.museum, expected); assert.equal(sim.state.result.upkeep, baseUpkeep + 15);
  const before = sim.toSave(); sim = restore(sim); assert.deepEqual(sim.toSave(), before);
  assert.equal(sim.enterTown(), false); assert.deepEqual(sim.toSave(), before);
});

test('Prayer, Dinner, Villa Party, Taunt and Training persist through Rest and affect the next battle', () => {
  let sim = town();
  sim.state.player.traits[125] = 1; sim['refreshPartySkills']();
  sim.buyCastleUpgrade('villa'); sim.buyCastleUpgrade('special-trainer');
  for (const action of ['pray', 'dinner', 'party', 'train', 'taunt'] as const) {
    assert.equal(sim.performTownActivity(action).outcome, 'done', action); sim = restore(sim);
  }
  assert.equal(sim.state.town!.ap, 0); assert.equal(sim.state.economy.heroTraining, 1);
  const mission = structuredClone((sim.state.town as ReadyTown).mission);
  assert.ok(mission.absorbFix > 0.01); assert.equal(mission.dmgFix, 1.1); assert.ok(mission.expFix > 1);
  assert.ok(mission.hpFix > 1); assert.ok(mission.reward > 620);
  const before = sim.toSave();
  for (const action of ['pray', 'dinner', 'party', 'train'] as const) assert.equal(sim.performTownActivity(action).outcome, 'unavailable');
  assert.deepEqual(sim.toSave(), before);
  assert.ok(sim.startNextDay()); sim = restore(sim);
  assert.equal(sim.state.activeMission.dmgFix, mission.dmgFix); assert.equal(sim.state.activeMission.expFix, mission.expFix);
  assert.equal(sim.state.activeMission.absorbFix, mission.absorbFix); assert.equal(sim.state.activeMission.hpFix, mission.hpFix);
  sim['spawnEnemy']('sheep'); assert.equal(sim.state.enemies[0].hp, Math.trunc(42 * mission.hpFix));
  settle(sim); assert.equal(sim.state.economy.heroTraining, 1); assert.equal(sim.townActivityAvailable('train'), false);
  assert.equal((sim.state.town as ReadyTown).mission.dmgFix, 1); assert.equal((sim.state.town as ReadyTown).mission.expFix, 1);
});

test('Sister upgrades assign launches to waves; bombs fly, explode when shot and use Love compensation', () => {
  let sim = town('militia'); sim.buyCastleUpgrade('sister');
  sim.state.player.traits[138] = 1; sim['refreshPartySkills']();
  assert.ok(sim.startNextDay());
  assert.equal(sim.state.economy.sisterWaves.reduce((a, b) => a + b, 0), 1);
  sim.state.waveIndex = sim.state.economy.sisterWaves.findIndex(n => n > 0);
  sim['timerTick']();
  const bomb = sim.state.enemies.find(e => e.kind === 'sister-bomb')!;
  assert.ok(bomb); sim['tickEnemy'](bomb); assert.ok(bomb.x < 650);
  sim = restore(sim);
  const restoredBomb = sim.state.enemies.find(e => e.kind === 'sister-bomb')!;
  sim['spawnEnemy']('sheep'); const sheep = sim.state.enemies.at(-1)!;
  sheep.x = restoredBomb.x; sheep.y = restoredBomb.y;
  const before = sim.state.gold;
  sim['damageEnemy'](restoredBomb, 1, false, null, restoredBomb.x, restoredBomb.y);
  assert.equal(restoredBomb.removed, true); assert.equal(sim.state.economy.sistersExploded, 1);
  assert.equal(sim.state.gold - before, 10); assert.ok(sheep.hp <= 0);
  assert.deepEqual(restore(sim).toSave(), sim.toSave());
});

test('town action and Sister state replay identically, reject corruption, and produce a browser test fixture', () => {
  const sim = town();
  for (const kind of ['smith', 'museum', 'chicken', 'sister', 'villa', 'special-trainer'] as const) sim.buyCastleUpgrade(kind);
  const restored = restore(sim);
  for (const action of ['pray', 'dinner', 'party', 'train'] as const) assert.deepEqual(restored.performTownActivity(action), sim.performTownActivity(action));
  assert.deepEqual(restored.toSave(), sim.toSave());
  const invalid = sim.toSave(); invalid.economy.smith = 7; assert.throws(() => Simulation.fromSave(invalid), /economy/);
  const invalidBonus = sim.toSave(); (invalidBonus.town as ReadyTown).mission.absorbFix = 0.99; assert.throws(() => Simulation.fromSave(invalidBonus));
  const fresh = town();
  for (const kind of ['smith', 'museum', 'chicken', 'sister', 'villa', 'special-trainer'] as const) fresh.buyCastleUpgrade(kind);
  mkdirSync('../.build/browser-qa', { recursive: true });
  writeFileSync('../.build/browser-qa/town-economy.json', JSON.stringify({ format: 'elona-shooter-browser', version: SAVE_VERSION, appearance: 0, simulation: fresh.toSave() }));
  // Неподвижная повёрнутая цель исключает задержку оператора из браузерной проверки попадания.
  assert.ok(fresh.startNextDay()); fresh.state.newWave = false; fresh.state.spawnTimer = 900; fresh.state.waveIndex = 4;
  fresh['spawnEnemy']('sister-bomb');
  const bomb = fresh.state.enemies[0]; Object.assign(bomb, { x: 100, y: 240, speed: 0 });
  Object.assign(bomb.bomb!, { startY: 240, targetY: 240, curve: 0, counter: -1, rotation: 90 });
  fresh.state.inventory[0]!.baseAccuracy = 1000000;
  writeFileSync('../.build/browser-qa/sister-bomb-rotation.json', JSON.stringify({ format: 'elona-shooter-browser', version: SAVE_VERSION, appearance: 0, simulation: fresh.toSave() }));
});

test('next-day bonuses change actual shot damage, kill XP and castle damage', () => {
  const sim = town(); sim.buyCastleUpgrade('villa');
  for (const action of ['pray', 'dinner', 'party'] as const) assert.equal(sim.performTownActivity(action).outcome, 'done');
  assert.ok(sim.startNextDay());
  sim['spawnEnemy']('sheep');
  sim.state.waveIndex = sim.state.waves.length - 1; sim.state.newWave = false;
  Object.assign(sim.state.enemies[0], { x: 400, y: 240, hp: 10000, maxHp: 10000 });
  Object.assign(sim.state.inventory[0]!, { attack: 100, baseAccuracy: 1000000 });
  const normal = restore(sim), boosted = restore(sim);
  normal.state.activeMission.dmgFix = 1;
  normal.fireAt(400, 230); boosted.fireAt(400, 230);
  assert.ok(boosted.state.enemies[0].hp < normal.state.enemies[0].hp, 'Party must increase actual damage');
  const normalXp = restore(sim), boostedXp = restore(sim);
  normalXp.state.activeMission.expFix = 1;
  normalXp['damageEnemy'](normalXp.state.enemies[0], 100000, false, null, 400, 240);
  boostedXp['damageEnemy'](boostedXp.state.enemies[0], 100000, false, null, 400, 240);
  assert.ok(boostedXp.state.player.exp > normalXp.state.player.exp, 'Dinner must increase earned XP');
  const normalWall = restore(sim), prayedWall = restore(sim);
  normalWall.state.activeMission.absorbFix = 0;
  normalWall['damageCastle'](100); prayedWall['damageCastle'](100);
  assert.ok(prayedWall.state.castleHp > normalWall.state.castleHp, 'Prayer must absorb actual castle damage');
});

test('multiple Sister launches chain safely and earn their upgrade medal damage bonus', () => {
  const sim = town('militia');
  for (let i = 0; i < 10; i++) sim.buyCastleUpgrade('sister');
  assert.ok(sim.state.earnedMedals.includes(53)); assert.ok(sim.startNextDay());
  const waves = sim.state.economy.sisterWaves;
  sim.state.waveIndex = waves.indexOf(Math.max(...waves));
  const count = waves[sim.state.waveIndex]; assert.ok(count >= 2);
  sim['timerTick']();
  const bombs = sim.state.enemies.filter(enemy => enemy.kind === 'sister-bomb');
  assert.equal(bombs.length, count); assert.equal(bombs[0].attack, Math.trunc(110 * 1.1));
  sim['damageEnemy'](bombs[0], 1, false, null, bombs[0].x, bombs[0].y);
  assert.equal(sim.state.economy.sistersExploded, count);
  assert.ok(bombs.every(bomb => bomb.removed));
  assert.deepEqual(restore(sim).toSave(), sim.toSave());
});
