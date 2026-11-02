import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { Simulation, type Input, type SimulationOptions } from '../src/simulation.ts';
import { isOccupiedItem, ITEM_TYPE } from '../src/items.ts';
import { ENEMIES } from '../src/content.ts';
import { ordinaryEnemyHit, type CollisionGeometry } from '../src/collision.ts';
import { weaponStats } from '../src/combat-stats.ts';
import { modMountFailure } from '../src/equipment.ts';

const outputDirectory = resolve('../.build/soak');
mkdirSync(outputDirectory, { recursive: true });
const seedCount = Number(process.argv[2] ?? 32);
assert.ok(Number.isInteger(seedCount) && seedCount >= 1 && seedCount <= 1000, 'Seed count must be between 1 and 1000.');
const policies = ['idle', 'aimed', 'interruptions'] as const;
type Policy = typeof policies[number];
const geometry = JSON.parse(readFileSync(new URL('../public/assets/collision-geometry.json', import.meta.url), 'utf8')) as CollisionGeometry;
const simulationOptions: SimulationOptions = { hitTest: (enemy, x, y) => {
  if (enemy.kind !== 'boss') return ordinaryEnemyHit({ ...enemy, kind: enemy.kind }, x, y, geometry);
  // Геометрия босса пока зависит от Phaser; её прямоугольная замена отмечена в отчёте.
  const [left, right, top, bottom] = ENEMIES.boss.body;
  return x - enemy.x > left && x - enemy.x < right && y - enemy.y > top && y - enemy.y < bottom;
} };

function inputFor(simulation: Simulation, policy: Policy): Input {
  if (policy === 'idle') return {};
  const { enemies, tick, inventory, itemCooldowns } = simulation.state;
  const weapon = simulation.weapon;
  const grenade = inventory[1];
  const target = enemies.filter(enemy => enemy.hp > 0 && enemy.x > 20).sort((left, right) => right.x - left.x)[0];
  const aiming = { aimX: target?.x ?? 450, aimY: target?.y ?? 240 };
  if (policy === 'aimed') return {
    ...aiming,
    firePressed: Boolean(target) && Boolean(weapon && weapon.reloadTime === 0 && weapon.ammo > 0),
    reload: Boolean(weapon && (weapon.ammo === 0 || (!target && weapon.ammo < 3))),
    slot: target?.kind === 'boss' && isOccupiedItem(grenade) && grenade.ammo > 0 && itemCooldowns[1] === 0 ? 1 : undefined,
  };
  const usableSlots = inventory.slice(0, 5).flatMap((item, slot) => {
    if (!isOccupiedItem(item)) return [];
    if (item.type === ITEM_TYPE.gun && !item.special && weaponStats(item, simulation.state.player.traits).canFire) return [slot];
    if ([11, 12, 37].includes(item.id) && itemCooldowns[slot] === 0) return [slot];
    return [];
  });
  return {
    ...aiming,
    aimX: tick % 7 === 0 ? 510 : aiming.aimX,
    fireHeld: tick % 37 < 24, firePressed: tick % 29 === 0,
    reload: tick % 41 === 0,
    slot: tick % 127 === 0 && usableSlots.length ? usableSlots[Math.floor(tick / 127) % usableSlots.length] : undefined,
  };
}

function assertFinite(value: unknown, path = 'state'): void {
  if (typeof value === 'number') assert.ok(Number.isFinite(value), `${path} is not finite`);
  else if (Array.isArray(value)) value.forEach((item, index) => assertFinite(item, `${path}[${index}]`));
  else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) assertFinite(item, `${path}.${key}`);
}

const started = performance.now();
const results: { seed: number; policy: Policy; phase: string; day: number; daysCompleted: number; ticks: number; kills: number; checkpoints: number }[] = [];
let scenario: { seed: number; policy: Policy } | undefined;
let lastCheckpoint: unknown;
let inputs: Input[] = [];
let frames = 0;
let rewardTransitions = 0;
let townActions = 0;
let restTransitions = 0;
let secondDayVictories = 0;
let thirdDayVictories = 0;
let fourthDayVictories = 0;
let fifthDayVictories = 0;
let sixthDayVictories = 0;
let seventhDayVictories = 0;
let seventhDayArrivals = 0;
let titleClaims = 0;
let equipmentSelections = 0;
let modificationPreviews = 0, modsMounted = 0, weaponsUpgraded = 0, upgradeCancellations = 0;
try {
  for (let index = 0; index < seedCount; index++) {
    // Мультипликативная последовательность охватывает разные 32-битные начальные состояния.
    const seed = index === 0 ? 42 : Math.imul(index, 0x9e3779b1) >>> 0;
    for (const policy of policies) {
      scenario = { seed, policy };
      const simulation = new Simulation(seed, simulationOptions);
      let restored = Simulation.fromSave(JSON.parse(JSON.stringify(simulation.toSave())), simulationOptions);
      lastCheckpoint = simulation.toSave(); inputs = [];
      let checkpoints = 1;
      let daysCompleted = 0;
      for (let day = 1; day <= 7; day++) {
        assert.equal(simulation.state.day, day);
        if (day === 7) seventhDayArrivals++;
        for (let frame = 0; frame < 6000 && simulation.state.phase === 'battle'; frame++) {
          const input = inputFor(simulation, policy);
          inputs.push(input);
          simulation.tick(input); restored.tick(input); frames++;
          equipmentSelections += simulation.events.filter(event => event.type === 'select').length;
          assert.deepEqual(restored.state, simulation.state, `Save/replay state diverged at tick ${simulation.state.tick}`);
          assert.deepEqual(restored.events, simulation.events, `Save/replay events diverged at tick ${simulation.state.tick}`);
          assertFinite(simulation.state); assertFinite(simulation.events, 'events');
          for (const item of simulation.state.inventory) {
            if (!item) continue;
            if (item.type === ITEM_TYPE.gun) assert.ok(item.ammo >= 0 && item.ammo <= item.ammoMax);
            // generateStuff независимо бросает ammo и ammoMax гранаты: 8 зарядов при максимуме 3 допустимы.
            if (item.id === 11) assert.ok(Number.isInteger(item.ammo) && item.ammo >= 0 && item.ammo <= 8);
          }
          assert.equal(simulation.state.itemCooldowns.length, 5);
          assert.ok(simulation.state.itemCooldowns.every(time => Number.isInteger(time) && time >= 0));
          assert.equal(simulation.state.player.weaponExp.length, 5);
          assert.ok(simulation.state.player.weaponExp.every(amount => Number.isInteger(amount) && amount >= 0));
          if (frame % 137 === 136) {
            lastCheckpoint = JSON.parse(JSON.stringify(simulation.toSave()));
            restored = Simulation.fromSave(lastCheckpoint, simulationOptions);
            inputs = []; checkpoints++;
          }
        }
        assert.notEqual(simulation.state.phase, 'battle', `Day ${day} did not terminate within 6000 frames.`);
        if (policy === 'idle') assert.equal(simulation.state.phase, 'defeat');
        if (simulation.state.phase === 'victory') { daysCompleted++; if (day === 2) secondDayVictories++; if (day === 3) thirdDayVictories++; if (day === 4) fourthDayVictories++; if (day === 5) fifthDayVictories++; if (day === 6) sixthDayVictories++; if (day === 7) seventhDayVictories++; }
        if (day === 7 && simulation.state.phase === 'victory') {
          assert.equal(simulation.state.title, 1);
          assert.equal(simulation.state.result.salary, 100);
          assert.equal(simulation.state.result.tax, 45);
          assert.equal(simulation.state.result.netReward, 735 + simulation.state.result.perfectBonus);
        }
        let rewardActions = 0;
        while (simulation.state.phase === 'victory' && simulation.state.postbattle !== 'result') {
          assert.ok(rewardActions++ < 30, 'Earned rewards did not reach results.');
          const state = simulation.state;
          if (state.postbattle === 'loot' || state.postbattle === 'boss-loot') {
            const offer = state.lootOffers.findIndex(isOccupiedItem);
            const slot = state.inventory.findIndex(item => !isOccupiedItem(item));
            if (offer >= 0 && slot >= 0) {
              assert.equal(simulation.collectLoot(offer, slot), true);
              assert.equal(restored.collectLoot(offer, slot), true);
            } else {
              assert.equal(simulation.finishLoot(), true);
              assert.equal(restored.finishLoot(), true);
            }
          } else {
            assert.equal(state.postbattle, 'skill');
            // Семена и последовательные награды выбирают разные исходные варианты развития.
            const choice = state.skillChoices[(seed + rewardActions + day) % state.skillChoices.length];
            assert.equal(simulation.chooseSkill(choice), true);
            assert.equal(restored.chooseSkill(choice), true);
          }
          assert.deepEqual(restored.state, simulation.state, 'Reward replay changed the offered items or skills.');
          assertFinite(simulation.state);
          lastCheckpoint = JSON.parse(JSON.stringify(simulation.toSave()));
          restored = Simulation.fromSave(lastCheckpoint, simulationOptions);
          assert.deepEqual(restored.state, simulation.state, 'Reward save/restore rerolled state.');
          checkpoints++; rewardTransitions++;
        }
        if (simulation.state.phase === 'victory') {
          assert.equal(simulation.enterTown(), true);
          assert.equal(restored.enterTown(), true);
          assert.deepEqual(restored.state, simulation.state, 'Town entry changed restored state.');
          lastCheckpoint = JSON.parse(JSON.stringify(simulation.toSave()));
          restored = Simulation.fromSave(lastCheckpoint, simulationOptions);
          checkpoints++; townActions++;
          // Титул проверяется до остальных расходов AP; зарплата не меняет уже оплаченный итог.
          if (day === 6) {
            const before = simulation.toSave();
            assert.equal(simulation.claimTitle(), 'claimed');
            assert.equal(restored.claimTitle(), 'claimed');
            assert.equal(simulation.state.title, 1);
            assert.equal(simulation.state.town!.ap, before.town!.ap - 4);
            assert.equal(simulation.state.gold, before.gold);
            assert.equal(simulation.state.totalMoney, before.totalMoney);
            assert.equal(simulation.state.rng, before.rng);
            assert.deepEqual(simulation.state.result, before.result);
            assert.deepEqual(restored.state, simulation.state, 'Title claim changed restored state.');
            lastCheckpoint = JSON.parse(JSON.stringify(simulation.toSave()));
            restored = Simulation.fromSave(lastCheckpoint, simulationOptions);
            assert.deepEqual(restored.state, simulation.state, 'Title save/restore changed AP, balance or reward history.');
            const claimed = simulation.toSave();
            assert.equal(simulation.claimTitle(), 'unavailable');
            assert.equal(restored.claimTitle(), 'unavailable');
            assert.deepEqual(simulation.state, claimed, 'Repeated title claim changed state.');
            assert.deepEqual(restored.state, claimed);
            checkpoints++; townActions++; titleClaims++;
          }
          const modSlot = simulation.state.inventory.findIndex(item => isOccupiedItem(item) && item.type === ITEM_TYPE.mod);
          const gunSlot = simulation.state.inventory.findIndex(item => modSlot >= 0 && modMountFailure(simulation.state.inventory[modSlot], item) === null);
          if (modSlot >= 0 && gunSlot >= 0) {
            assert.equal(simulation.beginModMount(modSlot, gunSlot), 'previewed');
            assert.equal(restored.beginModMount(modSlot, gunSlot), 'previewed');
            assert.deepEqual(restored.state, simulation.state);
            lastCheckpoint = JSON.parse(JSON.stringify(simulation.toSave()));
            restored = Simulation.fromSave(lastCheckpoint, simulationOptions); checkpoints++;
            assert.equal(simulation.resolveTownEquipment(true), 'mounted');
            assert.equal(restored.resolveTownEquipment(true), 'mounted');
            assert.deepEqual(restored.state, simulation.state, 'Mounted weapon changed after restoring its confirmation.');
            modsMounted++; townActions++;
          }
          if (simulation.state.town?.preparation === 'ready' && simulation.state.town.ap >= 4) {
            const upgradeSlot = simulation.state.inventory.findIndex((item, index) => isOccupiedItem(item) && item.type === ITEM_TYPE.gun && (day === 7 || index > 1));
            if (upgradeSlot >= 0) {
              assert.equal(simulation.beginWeaponUpgrade(upgradeSlot), 'previewed');
              assert.equal(restored.beginWeaponUpgrade(upgradeSlot), 'previewed');
              assert.deepEqual(restored.state, simulation.state, 'Upgrade preview changed RNG or item after replay.');
              lastCheckpoint = JSON.parse(JSON.stringify(simulation.toSave()));
              restored = Simulation.fromSave(lastCheckpoint, simulationOptions); checkpoints++; modificationPreviews++;
              const action = simulation.state.pendingTownAction;
              assert.ok(action?.kind === 'upgrade');
              const confirm = simulation.state.gold >= action.cost && seed % 3 !== 0;
              const outcome = simulation.resolveTownEquipment(confirm);
              assert.equal(restored.resolveTownEquipment(confirm), outcome);
              assert.equal(outcome, confirm ? 'upgraded' : 'cancelled');
              assert.deepEqual(restored.state, simulation.state, 'Upgrade decision changed stored preview or resources.');
              if (confirm) weaponsUpgraded++; else upgradeCancellations++;
              townActions++;
            }
          }
          assert.equal(restored.freeRepair(), simulation.freeRepair());
          assert.deepEqual(restored.state, simulation.state, 'Town repair changed restored state.');
          lastCheckpoint = JSON.parse(JSON.stringify(simulation.toSave()));
          restored = Simulation.fromSave(lastCheckpoint, simulationOptions);
          assert.deepEqual(restored.state, simulation.state, 'Town save/restore changed AP, HP or rewards.');
          checkpoints++; townActions++;
          // Прицельная политика сохраняет дробовик; другая проверяет бой после покупки случайного товара.
          const saleSlot = policy === 'aimed'
            ? simulation.state.inventory.findIndex((item, index) => index > 1 && isOccupiedItem(item) && item.type !== ITEM_TYPE.gun)
            : 0;
          if (saleSlot >= 0) {
            assert.notEqual(simulation.sellTownItem(saleSlot), null);
            assert.notEqual(restored.sellTownItem(saleSlot), null);
            assert.deepEqual(restored.state, simulation.state, 'Town sale changed restored state.');
            assert.equal(simulation.buyStock(0, saleSlot), restored.buyStock(0, saleSlot));
            assert.deepEqual(restored.state, simulation.state, 'Town purchase changed restored state.');
            townActions += 2;
          }
          lastCheckpoint = JSON.parse(JSON.stringify(simulation.toSave()));
          restored = Simulation.fromSave(lastCheckpoint, simulationOptions);
          checkpoints++;
          if (day < 7) {
            const previous = simulation.toSave();
            assert.equal(simulation.startNextDay(), true);
            assert.equal(restored.startNextDay(), true);
            assert.equal(simulation.state.gold, previous.gold);
            assert.equal(simulation.state.castleHp, previous.castleHp);
            assert.deepEqual(simulation.state.previousTown, previous.town);
            assert.deepEqual(restored.state, simulation.state, 'Rest changed restored mission or equipment.');
            lastCheckpoint = JSON.parse(JSON.stringify(simulation.toSave()));
            restored = Simulation.fromSave(lastCheckpoint, simulationOptions);
            assert.deepEqual(restored.state, simulation.state, 'Next-day checkpoint changed prepared waves.');
            checkpoints++; restTransitions++; inputs = [];
          } else {
            const completed = simulation.toSave();
            assert.equal(simulation.startNextDay(), false);
            assert.deepEqual(simulation.toSave(), completed);
          }
        }
        if (simulation.state.phase !== 'battle') break;
      }
      assert.deepEqual(Simulation.fromSave(simulation.toSave(), simulationOptions).state, simulation.state);
      results.push({ ...scenario, phase: simulation.state.phase, day: simulation.state.day, daysCompleted, ticks: simulation.state.tick, kills: simulation.state.kills, checkpoints });
    }
  }
  assert.ok(restTransitions > 0, 'No scenario reached Day 2.');
  assert.ok(secondDayVictories > 0, 'No scenario completed Day 2.');
  assert.ok(thirdDayVictories > 0, 'No scenario completed Day 3.');
  assert.ok(fourthDayVictories > 0, 'No scenario completed Day 4.');
  assert.ok(fifthDayVictories > 0, 'No scenario completed Day 5.');
  assert.ok(sixthDayVictories > 0, 'No scenario completed Day 6.');
  assert.ok(titleClaims > 0, 'No scenario claimed and saved the Day6 title.');
  assert.ok(seventhDayArrivals > 0, 'No scenario entered Day 7.');
  const report = {
    status: 'passed', seedCount, policies, scenarios: results.length, simulationFrames: frames,
    checkpoints: results.reduce((sum, result) => sum + result.checkpoints, 0), rewardTransitions, townActions, restTransitions, secondDayVictories, thirdDayVictories, fourthDayVictories, fifthDayVictories, sixthDayVictories, seventhDayArrivals, seventhDayVictories, titleClaims, equipmentSelections,
    modificationPreviews, modsMounted, weaponsUpgraded, upgradeCancellations,
    elapsedMs: Math.round(performance.now() - started),
    collision: 'Production ordinary-enemy contours; boss uses the documented rectangular headless fallback',
    limits: ['Port self-consistency, finite state and JSON replay only; not an original-game parity proof', 'Sheriff Days 1–7 only; boss shape geometry not exercised', 'Day7 arrivals and victories are separate observed counts; this policy does not guarantee a win', 'No browser rendering, input latency, audio or wall-clock performance comparison'],
    results,
  };
  writeFileSync(resolve(outputDirectory, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ ...report, results: undefined }, null, 2));
} catch (error) {
  // Контрольная точка и входы после неё позволяют повторить сбой без реакции человека в реальном времени.
  writeFileSync(resolve(outputDirectory, 'failure.json'), JSON.stringify({ scenario, checkpoint: lastCheckpoint, inputs, error: String(error) }, null, 2) + '\n');
  throw error;
}
