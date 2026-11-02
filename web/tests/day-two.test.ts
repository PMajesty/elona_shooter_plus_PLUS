import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../src/simulation.ts';
import { TRAIT } from '../src/progression.ts';
import { ItemFactory } from '../src/items.ts';
import { ENEMIES, type EnemyKind } from '../src/content.ts';

function restore(simulation: Simulation): Simulation {
  const saved = JSON.parse(JSON.stringify(simulation.toSave()));
  const resumed = Simulation.fromSave(saved);
  assert.deepEqual(resumed.state, saved);
  return resumed;
}

function playBattle(simulation: Simulation, observe: () => void = () => {}): void {
  // Это проверка связного состояния: стандартный hitTest использует прямоугольники,
  // а независимые исходные контуры и браузерная проводка проверяются отдельно.
  for (let frame = 0; frame < 6000 && simulation.state.phase === 'battle'; frame++) {
    // В седьмой день видимый замах босса и лучники требуют приоритета над ближней целью.
    const priority = (enemy: { kind: EnemyKind; bossAction?: number }) => simulation.state.day !== 7 ? 0
      : enemy.kind === 'boss' && enemy.bossAction === 5 ? 1000 : enemy.kind === 'archer' ? 500 : 0;
    const target = simulation.state.enemies.filter(enemy => enemy.hp > 0 && enemy.x > 20)
      .sort((a, b) => priority(b) - priority(a) || b.x - a.x)[0];
    const critical = target && simulation.state.day === 7 && !['boss', 'fly'].includes(target.kind)
      ? ENEMIES[target.kind].critical : [0, 0, 0, 0];
    const weapon = simulation.weapon!;
    simulation.tick({ aimX: target ? target.x + (critical[0] + critical[1]) / 2 : 450,
      aimY: target ? target.y + (critical[2] + critical[3]) / 2 : 240,
      firePressed: Boolean(target) && weapon.reloadTime === 0 && weapon.ammo > 0,
      slot: simulation.state.day === 7 && target?.kind === 'boss' && simulation.state.inventory[1]!.ammo > 0
        && simulation.state.itemCooldowns[1] === 0 ? 1 : undefined,
      reload: weapon.ammo === 0 || (!target && weapon.ammo < 3) });
    observe();
  }
  assert.equal(simulation.state.phase, 'victory');
}

function claimRewards(simulation: Simulation): Simulation {
  const stages: string[] = [];
  for (let count = 0; count < 20 && simulation.state.postbattle !== 'result'; count++) {
    stages.push(simulation.state.postbattle);
    simulation = restore(simulation);
    if (simulation.state.postbattle === 'skill') {
      const choice = simulation.state.skillChoices.find(id => id !== TRAIT.SHOTGUN) ?? simulation.state.skillChoices[0];
      assert.equal(simulation.chooseSkill(choice), true);
    } else assert.equal(simulation.finishLoot(), true);
  }
  assert.equal(simulation.state.postbattle, 'result');
  assert.ok(stages.includes('loot'));
  assert.ok(stages.includes('boss-loot'));
  assert.ok(stages.includes('skill'));
  return restore(simulation);
}

function firstTown(): Simulation {
  let simulation = new Simulation(42);
  // Контролируемая повреждённая стена делает историю медали двух дней различимой.
  simulation.state.castleHp = 39;
  playBattle(simulation);
  assert.equal(simulation.state.noDamage, false);
  simulation = claimRewards(simulation);
  assert.equal(simulation.enterTown(), true);
  return restore(simulation);
}

test('normal first battle, rewards and town lead to a saved Day 2 with the prepared mission and no Rest healing or cost', () => {
  let simulation = firstTown();
  simulation.state.inventory[0]!.ammo = 2;
  simulation.state.inventory[1]!.ammo = 3;
  simulation.state.inventory[2] = new ItemFactory(() => 0.5).generate(12);
  simulation.state.inventory[2]!.ammo = 2;
  const before = simulation.toSave();
  assert.ok(before.town?.preparation === 'ready');
  assert.equal(simulation.startNextDay(), true);
  assert.equal(simulation.state.day, 2);
  assert.equal(simulation.state.phase, 'battle');
  assert.equal(simulation.state.postbattle, 'none');
  assert.equal(simulation.state.castleHp, before.castleHp);
  assert.equal(simulation.state.gold, before.gold);
  assert.equal(simulation.state.resultBefore, before.gold);
  assert.deepEqual(simulation.state.previousTown, before.town);
  assert.equal(simulation.state.previousTown!.ap, before.town.ap);
  assert.equal(simulation.state.town, null);
  assert.equal(simulation.state.activeMission.level, 1);
  assert.equal(simulation.state.activeMission.reward, 620);
  assert.equal(simulation.state.activeMission.absorbFix, 0);
  assert.deepEqual(simulation.state.loot, before.town.mission.loot);
  assert.equal(simulation.state.inventory[0]!.ammo, 5);
  assert.equal(simulation.state.inventory[1]!.ammo, 3);
  assert.equal(simulation.state.inventory[2]!.ammo, 2);
  assert.deepEqual(simulation.state.itemCooldowns, [0, 0, 0, 0, 0]);
  simulation = restore(simulation);
  const started = simulation.toSave();
  assert.equal(simulation.startNextDay(), false);
  assert.deepEqual(simulation.toSave(), started);
  const replay = restore(simulation);
  for (let frame = 0; frame < 180; frame++) {
    const input = { firePressed: frame % 29 === 0, aimX: 350, aimY: 230, slot: frame === 10 ? 1 : undefined };
    simulation.tick(input); replay.tick(input);
    assert.deepEqual(replay.state, simulation.state);
    assert.deepEqual(replay.events, simulation.events);
  }
});

test('seven connected days preserve historical absorption, boss progression, title salary and the final town boundary', () => {
  let simulation = firstTown();
  assert.equal(simulation.state.earnedMedals.includes(60), false);
  assert.equal(simulation.freeRepair(), 'repaired');
  assert.equal(simulation.startNextDay(), true);
  const battleStart = simulation.toSave();
  let bossSeen = false;
  playBattle(simulation, () => {
    const boss = simulation.state.enemies.find(enemy => enemy.kind === 'boss');
    if (boss) { bossSeen = true; assert.equal(boss.maxHp, 175); assert.equal(boss.appearance, 52); }
  });
  assert.equal(bossSeen, true);
  assert.equal(simulation.state.noDamage, true);
  assert.equal(simulation.state.perfectDays, 1);
  assert.equal(simulation.state.earnedMedals.includes(60), true);
  assert.equal(simulation.state.result.reward, 620);
  assert.equal(simulation.state.result.perfectBonus, 186);
  assert.equal(simulation.state.resultBefore, battleStart.gold);
  simulation = claimRewards(simulation);
  assert.equal(simulation.enterTown(), true);
  assert.ok(simulation.state.town?.preparation === 'ready');
  assert.equal(simulation.state.activeMission.absorbFix, 0);
  assert.equal(simulation.state.previousTown!.mission.absorbFix, 0);
  assert.equal(simulation.state.town.mission.absorbFix, 0.01);
  assert.equal(simulation.state.town.mission.level, 2);
  simulation = restore(simulation);
  const finalTown = simulation.toSave();
  assert.equal(simulation.startNextDay(), true);
  assert.equal(simulation.state.day, 3);
  assert.equal(simulation.state.activeMission.absorbFix, 0.01);
  assert.equal(simulation.state.gold, finalTown.gold);
  assert.equal(simulation.state.castleHp, finalTown.castleHp);
  assert.deepEqual(simulation.state.previousTown, finalTown.town);
  simulation = restore(simulation);
  let thirdBossSeen = false;
  playBattle(simulation, () => {
    const boss = simulation.state.enemies.find(enemy => enemy.kind === 'boss');
    if (boss) { thirdBossSeen = true; assert.equal(boss.maxHp, 200); assert.equal(boss.appearance, 53); }
  });
  assert.equal(thirdBossSeen, true);
  assert.equal(simulation.state.result.reward, 640);
  simulation = claimRewards(simulation);
  assert.equal(simulation.enterTown(), true);
  assert.ok(simulation.state.town?.preparation === 'ready');
  assert.equal(simulation.state.town.mission.level, 3);
  assert.equal(simulation.state.town.mission.loot.at(-1), 1035);
  simulation = restore(simulation);
  const thirdTown = simulation.toSave();
  assert.equal(simulation.startNextDay(), true);
  assert.equal(simulation.state.day, 4);
  assert.deepEqual(simulation.state.previousTown, thirdTown.town);
  simulation = restore(simulation);
  let fourthBossSeen = false;
  playBattle(simulation, () => {
    const boss = simulation.state.enemies.find(enemy => enemy.kind === 'boss');
    if (boss) { fourthBossSeen = true; assert.equal(boss.maxHp, 225); assert.equal(boss.appearance, 54); }
  });
  assert.equal(fourthBossSeen, true);
  assert.equal(simulation.state.result.reward, 660);
  simulation = claimRewards(simulation);
  assert.equal(simulation.enterTown(), true);
  assert.ok(simulation.state.town?.preparation === 'ready');
  assert.equal(simulation.state.town.mission.level, 4);
  assert.equal(simulation.state.town.shop[0]!.mod, 10);
  simulation = restore(simulation);
  const fourthTown = simulation.toSave();
  assert.equal(simulation.startNextDay(), true);
  assert.equal(simulation.state.day, 5);
  assert.deepEqual(simulation.state.previousTown, fourthTown.town);
  simulation = restore(simulation);
  let fifthBossSeen = false;
  playBattle(simulation, () => {
    const boss = simulation.state.enemies.find(enemy => enemy.kind === 'boss');
    if (boss) { fifthBossSeen = true; assert.equal(boss.maxHp, 250); assert.equal(boss.appearance, 55); }
  });
  assert.equal(fifthBossSeen, true);
  assert.equal(simulation.state.result.reward, 680);
  simulation = claimRewards(simulation);
  assert.equal(simulation.enterTown(), true);
  assert.ok(simulation.state.town?.preparation === 'ready');
  assert.equal(simulation.state.town.mission.level, 5);
  assert.equal(simulation.state.town.mission.loot.at(-1), 1037);
  simulation = restore(simulation);
  assert.equal(simulation.freeRepair(), 'repaired');
  const fifthTown = simulation.toSave();
  assert.equal(simulation.startNextDay(), true);
  assert.equal(simulation.state.day, 6);
  assert.deepEqual(simulation.state.previousTown, fifthTown.town);
  assert.equal(simulation.state.activeMission.level, 5);
  assert.equal(simulation.state.activeMission.reward, 700);
  assert.deepEqual(simulation.state.loot, fifthTown.town!.preparation === 'ready' ? fifthTown.town!.mission.loot : []);
  simulation = restore(simulation);
  let sixthBossSeen = false;
  playBattle(simulation, () => {
    const boss = simulation.state.enemies.find(enemy => enemy.kind === 'boss');
    if (boss) { sixthBossSeen = true; assert.equal(boss.maxHp, 275); assert.equal(boss.appearance, 56); }
  });
  assert.equal(sixthBossSeen, true);
  assert.equal(simulation.state.result.reward, 700);
  assert.equal(simulation.state.result.perfectBonus, simulation.state.noDamage ? 210 : 0);
  assert.equal(simulation.state.result.upkeep, 40);
  assert.equal(simulation.state.result.tax, 10);
  assert.equal(simulation.state.result.salary, 0);
  assert.equal(simulation.state.result.netReward, 650 + simulation.state.result.perfectBonus);
  simulation = claimRewards(simulation);
  assert.equal(simulation.enterTown(), true);
  assert.ok(simulation.state.town?.preparation === 'ready');
  assert.equal(simulation.state.town.mission.level, 6);
  assert.equal(simulation.state.town.mission.loot.at(-1), 1106);
  simulation = restore(simulation);
  const sixthTown = simulation.toSave();
  assert.equal(simulation.claimTitle(), 'claimed');
  assert.equal(simulation.state.title, 1);
  assert.equal(simulation.state.town!.ap, sixthTown.town!.ap - 4);
  assert.equal(simulation.state.gold, sixthTown.gold);
  assert.equal(simulation.state.rng, sixthTown.rng);
  assert.deepEqual(simulation.state.result, sixthTown.result);
  simulation = restore(simulation);
  const titledTown = simulation.toSave();
  assert.equal(simulation.startNextDay(), true);
  assert.equal(simulation.state.day, 7);
  assert.equal(simulation.state.title, 1);
  assert.deepEqual(simulation.state.previousTown, titledTown.town);
  assert.equal(simulation.state.activeMission.level, 6);
  assert.equal(simulation.state.activeMission.reward, 720);
  assert.equal(simulation.state.loot.at(-1), 1106);
  assert.equal(simulation.state.gold, titledTown.gold);
  assert.equal(simulation.state.castleHp, titledTown.castleHp);
  simulation = restore(simulation);
  let seventhBossSeen = false;
  playBattle(simulation, () => {
    const boss = simulation.state.enemies.find(enemy => enemy.kind === 'boss');
    if (boss) { seventhBossSeen = true; assert.equal(boss.maxHp, 300); assert.equal(boss.appearance, 57); }
  });
  assert.equal(seventhBossSeen, true);
  assert.equal(simulation.state.result.reward, 720);
  assert.equal(simulation.state.result.perfectBonus, simulation.state.noDamage ? 216 : 0);
  assert.equal(simulation.state.result.upkeep, 40);
  assert.equal(simulation.state.result.tax, 45);
  assert.equal(simulation.state.result.salary, 100);
  assert.equal(simulation.state.result.netReward, 735 + simulation.state.result.perfectBonus);
  simulation = claimRewards(simulation);
  assert.equal(simulation.enterTown(), true);
  assert.ok(simulation.state.town?.preparation === 'ready');
  assert.equal(simulation.state.town.mission.level, 7);
  assert.ok(simulation.state.town.mission.loot.every(id => id === 1038));
  assert.equal(simulation.state.title, 1);
  simulation = restore(simulation);
  const seventhTown = simulation.toSave();
  assert.equal(simulation.startNextDay(), false);
  assert.deepEqual(simulation.toSave(), seventhTown);
});

test('weapon experience requires strictly more than 44 at Shotgun level 2 and discards excess after one increase', () => {
  for (const [experience, skill, remaining] of [[44, 2, 44], [45, 3, 0], [150, 3, 0]] as const) {
    const simulation = new Simulation(42);
    simulation.state.player.weaponExp[3] = experience;
    assert.equal(simulation.state.player.traits[TRAIT.SHOTGUN], 2);
    (simulation as unknown as { finishDay(): void }).finishDay();
    assert.equal(simulation.state.player.traits[TRAIT.SHOTGUN], skill);
    assert.deepEqual(simulation.state.player.weaponExp, [0, 0, 0, remaining, 0]);
    restore(simulation);
  }
});
