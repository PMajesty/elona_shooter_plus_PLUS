import test from 'node:test';
import assert from 'node:assert/strict';
import { withLegacyPartyDefaults } from './legacy-save-support.ts';
import { Simulation } from '../src/simulation.ts';
import { COMBAT_TRAIT } from '../src/combat-stats.ts';

interface Boundary {
  finishDay(): void;
  prepareResult(): void;
  spawnEnemy(kind: 'boss' | 'sheep'): void;
  explodeProjectile(x: number, y: number, damage: number, slot: number | null, kind: 'grenade'): void;
}
const restore = (simulation: Simulation) => Simulation.fromSave(JSON.parse(JSON.stringify(simulation.toSave())));
function settle(simulation: Simulation): void {
  (simulation as unknown as Boundary).finishDay();
  for (let step = 0; step < 30 && simulation.state.postbattle !== 'result'; step++) {
    if (simulation.state.postbattle === 'skill') assert.equal(simulation.chooseSkill(simulation.state.skillChoices[0]), true);
    else assert.equal(simulation.finishLoot(), true);
  }
  assert.equal(simulation.state.postbattle, 'result');
}
function battle(day: 6 | 7): Simulation {
  const simulation = new Simulation(42);
  // Контролируемые переходы без AI прежних боёв; полное прохождение проверяется отдельно.
  while (simulation.state.day < day) {
    settle(simulation); assert.equal(simulation.enterTown(), true); assert.equal(simulation.startNextDay(), true);
  }
  simulation.state.newWave = false; simulation.state.waveIndex = 4; simulation.state.spawnTimer = 1000;
  return simulation;
}
function sixthTown(): Simulation {
  const simulation = battle(6); settle(simulation); assert.equal(simulation.enterTown(), true); return simulation;
}
function bossWindup() {
  const simulation = battle(7);
  (simulation as unknown as Boundary).spawnEnemy('boss');
  const boss = simulation.state.enemies[0];
  Object.assign(boss, { x: 300, y: 245, bossAction: 5, bossIdle: 3, bossFacing: -1, frame: 184, speed: 0 });
  simulation.state.rng = 42;
  return { simulation, boss };
}

test('v13 title-bearing town gains a candidate party without changing existing state, RNG or the supplied save', () => {
  const simulation = sixthTown(); assert.equal(simulation.claimTitle(), 'claimed');
  const legacy: Record<string, any> = simulation.toSave(); legacy.version = 13;
  const untouched = structuredClone(legacy);
  const migrated = Simulation.fromSave(legacy);
  assert.deepEqual(migrated.toSave(), withLegacyPartyDefaults(legacy));
  assert.deepEqual(legacy, untouched); assert.equal(migrated.state.rng, legacy.rng);
  assert.deepEqual(restore(migrated).state, migrated.state);
});

test('claimed title survives Rest into Day7 and credits its salary exactly once at settlement', () => {
  const simulation = sixthTown(); assert.equal(simulation.claimTitle(), 'claimed');
  assert.equal(simulation.startNextDay(), true); assert.equal(simulation.state.day, 7);
  assert.equal(simulation.state.title, 1); assert.deepEqual(restore(simulation).state, simulation.state);
  const beforeGold = simulation.state.gold, beforeTotal = simulation.state.totalMoney;
  settle(simulation);
  assert.equal(simulation.state.result.salary, 100); assert.equal(simulation.state.result.tax, 45);
  assert.equal(simulation.state.result.upkeep, 40); assert.equal(simulation.state.result.netReward, 951);
  assert.equal(simulation.state.gold, beforeGold + 951); assert.equal(simulation.state.totalMoney, beforeTotal + 1036);
  const paid = restore(simulation), settled = paid.toSave();
  (paid as unknown as Boundary).prepareResult();
  assert.deepEqual(paid.toSave(), settled);
  assert.equal(paid.enterTown(), true); assert.equal(paid.state.title, 1);
  const town = paid.toSave(); assert.equal(paid.claimTitle(), 'unavailable'); assert.deepEqual(paid.toSave(), town);
  assert.deepEqual(restore(paid).state, paid.state);
});

test('the seventh perfect medal affects only new town preparation, and a delayed first title remains claimable', () => {
  const simulation = battle(7);
  assert.equal(simulation.state.title, 0); assert.equal(simulation.state.perfectDays, 6);
  assert.equal(simulation.state.activeMission.absorbFix, 0.02);
  settle(simulation);
  assert.equal(simulation.state.result.salary, 0); assert.equal(simulation.state.result.netReward, 851);
  assert.equal(simulation.state.perfectDays, 7); assert.ok(simulation.state.earnedMedals.includes(62));
  assert.equal(simulation.enterTown(), true);
  assert.ok(simulation.state.town?.preparation === 'ready');
  assert.equal(simulation.state.town.mission.absorbFix, 0.03);
  assert.equal(simulation.state.previousTown!.mission.absorbFix, 0.02);
  assert.equal(simulation.state.activeMission.absorbFix, 0.02);
  const before = simulation.toSave(); assert.equal(simulation.claimTitle(), 'claimed');
  assert.equal(simulation.state.title, 1); assert.equal(simulation.state.town.ap, 0);
  assert.equal(simulation.state.gold, before.gold); assert.deepEqual(simulation.state.result, before.result);
  assert.deepEqual(restore(simulation).state, simulation.state);
  for (const change of [
    (value: any) => { value.perfectDays = 6; },
    (value: any) => { value.phase = 'battle'; },
  ]) {
    const invalid = structuredClone(before); change(invalid);
    Object.assign(invalid, { version: 30 }); // До v31 медаль не могла прийти из другого приключения.
    assert.throws(() => Simulation.fromSave(invalid), /Invalid earned medals/);
  }
  const earlier: Record<string, any> = battle(6).toSave(); earlier.earnedMedals.push(62);
  earlier.version = 30;
  assert.throws(() => Simulation.fromSave(earlier), /Invalid earned medals/);
  earlier.version = 13;
  assert.throws(() => Simulation.fromSave(earlier), /Invalid earned medals/);
  assert.equal(simulation.startNextDay(), true);
  assert.equal(simulation.state.day, 8);
  assert.equal(simulation.state.activeMission.absorbFix, 0.03);
  assert.deepEqual(restore(simulation).state, simulation.state);
});

test('boss windup and released visual-only grenade replay exactly; new projectiles do not move on their birth tick', () => {
  const { simulation, boss } = bossWindup();
  let restored = restore(simulation);
  for (let step = 0; step < 3; step++) {
    simulation.tick(); restored.tick();
    assert.deepEqual(restored.state, simulation.state); assert.deepEqual(restored.events, simulation.events);
    assert.equal(boss.bossAction, 5); assert.equal(boss.frame, 184); assert.equal(simulation.state.projectiles.length, 0);
  }
  const hpBefore = simulation.state.castleHp;
  simulation.tick(); restored.tick();
  assert.deepEqual(restored.state, simulation.state); assert.deepEqual(restored.events, simulation.events);
  assert.equal(simulation.events.filter(event => event.type === 'boss-special').length, 1);
  assert.equal(simulation.events.filter(event => event.type === 'castle-hit').length, 1);
  assert.ok(simulation.state.castleHp < hpBefore);
  const projectile = simulation.state.projectiles[0];
  assert.equal(projectile.kind, 'grenade'); assert.equal(projectile.damage, -1); assert.equal(projectile.weaponSlot, null);
  assert.equal(projectile.frame, 0); assert.equal(projectile.pulseFrame, 1); assert.equal(projectile.x, boss.x);
  assert.equal(projectile.y, -79.85); assert.ok(projectile.count < boss.bossIdle);
  const hpAfterRelease = simulation.state.castleHp;
  restored = restore(simulation);
  let explosions = 0;
  for (let step = 0; step < 100 && simulation.state.projectiles.length > 0; step++) {
    simulation.tick(); restored.tick();
    assert.deepEqual(restored.state, simulation.state); assert.deepEqual(restored.events, simulation.events);
    if (step === 0) assert.equal(projectile.frame, 1);
    assert.equal(simulation.state.castleHp, hpAfterRelease);
    assert.equal(simulation.events.filter(event => event.type === 'castle-hit').length, 0);
    explosions += simulation.events.filter(event => event.type === 'explosion').length;
  }
  assert.equal(explosions, 1); assert.equal(simulation.state.projectiles.length, 0);
});

test('negative-damage boss grenades reject player-weapon, family, calendar and legacy save combinations', () => {
  const { simulation } = bossWindup();
  for (let step = 0; step < 4; step++) simulation.tick();
  const valid = simulation.toSave(); assert.equal(valid.projectiles.length, 1);
  for (const change of [
    (value: any) => { value.projectiles[0].weaponSlot = 0; },
    (value: any) => { value.projectiles[0].kind = 'hand-grenade'; },
    (value: any) => { value.projectiles[0].kind = 'rocket'; },
    (value: any) => { value.projectiles[0].damage = -2; },
    (value: any) => { value.projectiles[0].damage = 0; },
    (value: any) => { value.version = 13; },
  ]) {
    const invalid = structuredClone(valid); change(invalid); assert.throws(() => Simulation.fromSave(invalid));
  }
  const earlier = battle(6), boundary = earlier as unknown as Boundary;
  boundary.spawnEnemy('boss'); earlier.state.enemies[0].bossAction = 5;
  assert.throws(() => Simulation.fromSave(earlier.toSave()), /Invalid boss action/);
  earlier.state.enemies = [];
  const oldDay: Record<string, any> = earlier.toSave();
  oldDay.projectiles = structuredClone(valid.projectiles); oldDay.nextUid = valid.nextUid;
  assert.throws(() => Simulation.fromSave(oldDay), /Invalid projectile counters/);
  oldDay.version = 13;
  assert.throws(() => Simulation.fromSave(oldDay), /Invalid projectile counters/);
});

test('boss landing is visual-only over enemies and ignores the controlled player DaBomb skill', () => {
  const simulation = battle(7);
  (simulation as unknown as Boundary).spawnEnemy('sheep');
  const sheep = simulation.state.enemies[0]; Object.assign(sheep, { x: 300, y: 245 });
  const altered = restore(simulation);
  // Этот навык не принадлежит шерифу: задаём его только после загрузки для проверки маршрута взрыва.
  altered.state.player.traits[COMBAT_TRAIT.DA_BOMB] = 10;
  const beforeHp = sheep.hp, beforeCastle = simulation.state.castleHp;
  (simulation as unknown as Boundary).explodeProjectile(300, 245, -1, null, 'grenade');
  (altered as unknown as Boundary).explodeProjectile(300, 245, -1, null, 'grenade');
  assert.deepEqual(altered.events, simulation.events); assert.equal(altered.state.rng, simulation.state.rng);
  assert.equal(sheep.hp, beforeHp); assert.equal(altered.state.enemies[0].hp, beforeHp);
  assert.equal(simulation.state.castleHp, beforeCastle); assert.equal(altered.state.castleHp, beforeCastle);
  assert.equal(simulation.events.filter(event => event.type === 'explosion').length, 1);
  assert.equal(simulation.events.filter(event => event.type === 'hit' || event.type === 'castle-hit').length, 0);
});
