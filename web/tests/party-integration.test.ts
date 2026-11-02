import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation, type EnemyState } from '../src/simulation.ts';
import { generateEarlyTownRecruit } from '../src/recruits.ts';
import { installCandidate } from '../src/party.ts';
import { companionWage, partySkills } from '../src/party-progression.ts';
import { ItemFactory } from '../src/items.ts';
import type { EnemyKind } from '../src/content.ts';
import { asLegacyV14Save, withLegacyPartyDefaults } from './legacy-save-support.ts';

interface Boundary {
  finishDay(): void;
  prepareResult(): void;
  spawnEnemy(kind: EnemyKind): void;
  fireActorAt(slot: number, x: number, y: number): boolean;
  damageEnemy(enemy: EnemyState, damage: number, critical: boolean, weaponSlot: number | null, x: number, y: number, actorSlot: number): void;
}
const boundary = (simulation: Simulation) => simulation as unknown as Boundary;
const saved = (simulation: Simulation) => JSON.parse(JSON.stringify(simulation.toSave()));
function restore(simulation: Simulation): Simulation {
  const snapshot = saved(simulation), resumed = Simulation.fromSave(snapshot);
  assert.deepEqual(resumed.state, snapshot);
  return resumed;
}
function rewards(simulation: Simulation): void {
  for (let count = 0; count < 30 && simulation.state.postbattle !== 'result'; count++) {
    if (simulation.state.postbattle === 'skill') assert.equal(simulation.chooseSkill(simulation.state.skillChoices[0]), true);
    else assert.equal(simulation.finishLoot(), true);
  }
  assert.equal(simulation.state.postbattle, 'result');
}
function town(): Simulation {
  const simulation = new Simulation(42);
  // Контролируемый конец боя — та же граница, что в shop.test; это не заявление о прохождении боя.
  boundary(simulation).finishDay(); rewards(simulation);
  assert.equal(simulation.enterTown(), true);
  assert.ok(simulation.state.town?.preparation === 'ready');
  return simulation;
}
function classTown(classId: number): Simulation {
  const simulation = town();
  assert.ok(simulation.state.town?.preparation === 'ready');
  // Меняем только вход генерации класса, а не выдумываем поля/навыки/оружие рекрута.
  const prefix = [0.5, 0.5, 0.5, (classId - 0.5) / 9];
  const recruit = generateEarlyTownRecruit(() => prefix.shift() ?? 0.5, 1);
  assert.equal(recruit.devType, classId);
  simulation.state.town.recruit = structuredClone(recruit);
  installCandidate(simulation.state.party, recruit);
  simulation.state.gold = recruit.cost + 500;
  return simulation;
}
function hire(simulation: Simulation): void {
  assert.equal(simulation.requestRecruit(), 'previewed');
  assert.equal(simulation.resolvePartyAction(true), 'hired');
}
function readyBattle(classId: number): Simulation {
  const simulation = classTown(classId); hire(simulation);
  assert.equal(simulation.startNextDay(), true);
  while (simulation.state.newWave) simulation.tick({ fireReleased: false });
  // Изолируем проверку владельца/сохранения от очередной волны, не меняя исполнение AI.
  simulation.state.newWave = false; simulation.state.spawnTimer = 1000;
  return simulation;
}
const inventory = (slot: number) => ({ area: 'inventory', slot } as const);
const companion = (slot = 1) => ({ area: 'party', slot } as const);

test('ordinary town preparation installs its actual recruit once as the canonical candidate', () => {
  const simulation = town(), value = simulation.state.town;
  assert.ok(value?.preparation === 'ready');
  const candidate = simulation.state.party.slots[4];
  assert.equal(candidate.exists, true);
  assert.equal(candidate.member!.name, value.recruit.name);
  assert.equal(candidate.member!.devType, value.recruit.devType);
  assert.deepEqual(candidate.member!.traits, value.recruit.trait);
  assert.deepEqual(candidate.weapon, value.recruit.items[45]);
  const before = saved(simulation);
  assert.equal(simulation.enterTown(), false);
  assert.deepEqual(saved(simulation), before);
  restore(simulation);
});

for (let classId = 1; classId <= 9; classId++) test(`class ${classId}: hire, equipment, Rest, owner XP, wages and dismissal use production Simulation`, () => {
  let simulation = classTown(classId);
  const before = saved(simulation), candidate = structuredClone(simulation.state.party.slots[4]);
  assert.equal(simulation.requestRecruit(), 'previewed');
  assert.equal(simulation.state.gold, before.gold);
  assert.equal(simulation.state.rng, before.rng);
  assert.equal(simulation.state.town!.ap, before.town.ap);
  assert.equal(simulation.startNextDay(), false, 'a confirmation must block Rest');
  assert.equal(simulation.setCompanionOrder(1, 6), false);
  simulation = restore(simulation);
  assert.equal(simulation.resolvePartyAction(false), 'cancelled');
  assert.deepEqual(saved(simulation), before, 'cancel must not change candidate, RNG, AP or money');
  assert.equal(simulation.requestRecruit(), 'previewed');
  simulation = restore(simulation);
  assert.equal(simulation.resolvePartyAction(true), 'hired');
  assert.equal(simulation.state.gold, before.gold - candidate.member!.cost);
  assert.equal(simulation.state.totalMoney, before.totalMoney);
  assert.equal(simulation.state.rng, before.rng);
  assert.equal(simulation.state.town!.ap, before.town.ap);
  assert.deepEqual(simulation.state.party.slots[0].member, candidate.member);
  assert.deepEqual(simulation.state.party.slots[0].weapon, candidate.weapon);
  assert.equal(simulation.state.party.slots[4].exists, false);
  assert.deepEqual(simulation.state.town, before.town, 'prepared recruit snapshot is historical');
  const hired = saved(simulation);
  assert.equal(simulation.requestRecruit(), 'no-candidate');
  assert.deepEqual(saved(simulation), hired);

  // Обычный перенос оружия не требует AP и не генерирует новый предмет.
  const originalGun = structuredClone(simulation.actorWeapon(1));
  assert.equal(simulation.movePartyEquipment(companion(), inventory(5)), 'moved');
  assert.equal(simulation.actorWeapon(1), null);
  assert.deepEqual(simulation.state.inventory[5], originalGun);
  simulation = restore(simulation);
  assert.equal(simulation.movePartyEquipment(inventory(5), companion()), 'moved');
  assert.deepEqual(simulation.actorWeapon(1), originalGun);
  assert.equal(simulation.state.gold, hired.gold); assert.equal(simulation.state.rng, hired.rng);
  assert.equal(simulation.state.town!.ap, hired.town.ap);
  const gun = simulation.actorWeapon(1)!;
  gun.ammo = 0; gun.reloadTime = Math.min(2, gun.reloadTimeMax);
  simulation.state.inventory[1]!.ammo = 2;
  simulation.state.castleHp = 31;
  const resting = saved(simulation);
  assert.equal(simulation.startNextDay(), true);
  assert.equal(simulation.state.day, 2); assert.equal(simulation.state.castleHp, 31);
  assert.equal(simulation.state.gold, resting.gold); assert.equal(simulation.state.previousTown!.ap, resting.town.ap);
  assert.equal(simulation.state.inventory[1]!.ammo, 2, 'Rest does not refill usable grenades');
  assert.equal(simulation.actorWeapon(1)!.ammo, gun.ammoMax); assert.equal(simulation.actorWeapon(1)!.reloadTime, 0);
  assert.ok(simulation.state.party.slots[0].member!.aiState);
  simulation = restore(simulation);

  // Первый Timer переводит исходный wave=5 к действующей волне4 до создания цели.
  while (simulation.state.newWave) simulation.tick({ fireReleased: false });

  const member = simulation.state.party.slots[0].member!;
  const hero = structuredClone(simulation.state.player), priorExp = member.exp;
  boundary(simulation).spawnEnemy('sheep');
  const enemy = simulation.state.enemies.at(-1)!;
  const baseExp = enemy.exp;
  const expectedExp = Math.trunc(Math.trunc(baseExp * 2) * 1.5 * (classId === 8 ? 1.4 : 1));
  const req = simulation.actorWeapon(1)!.reqTrait;
  const bucket = [103, 106, 104, 105].indexOf(req!);
  boundary(simulation).damageEnemy(enemy, 9999, false, 0, enemy.x, enemy.y, 1);
  assert.equal(member.kills, 1);
  assert.equal(member.exp, priorExp + expectedExp, 'underlevel companion catch-up and class multiplier');
  assert.equal(member.weaponExp[bucket < 0 ? 4 : bucket], 2, 'catch-up adds a second point to the owner weapon category');
  assert.deepEqual(simulation.state.player, hero, 'companion kill must not credit hero XP, weapon XP or rampage');
  assert.ok(simulation.events.some(event => event.type === 'kill' && event.actorSlot === 1));
  simulation = restore(simulation);
  const preSettlement = saved(simulation), cachedSkills = structuredClone(simulation.state.partySkills);
  const ownerBefore = structuredClone(simulation.state.party.slots[0].member!);
  boundary(simulation).finishDay();
  const ownerAfter = simulation.state.party.slots[0].member!;
  assert.equal(ownerAfter.exp, ownerBefore.exp + 250, 'source after-battle XP goes to every existing actor');
  assert.deepEqual(simulation.state.partySkills, cachedSkills, 'same-result PARTY effects remain cached across growth');
  rewards(simulation);
  const wages = companionWage(ownerAfter, cachedSkills.effects[127] ?? 0);
  const result = simulation.state.result as typeof simulation.state.result & { wages: number };
  assert.equal(result.wages, wages);
  assert.equal(result.netReward, result.reward + result.perfectBonus + result.salary - result.upkeep - result.tax - wages);
  assert.equal(simulation.state.gold, preSettlement.gold + result.netReward);
  simulation = restore(simulation);
  const paid = saved(simulation); boundary(simulation).prepareResult(); assert.deepEqual(saved(simulation), paid);
  assert.equal(simulation.enterTown(), true);
  const inTown = saved(simulation);
  assert.equal(simulation.requestDismiss(1), true); simulation = restore(simulation);
  assert.equal(simulation.resolvePartyAction(false), 'cancelled'); assert.deepEqual(saved(simulation), inTown);
  assert.equal(simulation.requestDismiss(1), true); simulation = restore(simulation);
  assert.equal(simulation.resolvePartyAction(true), 'dismissed');
  assert.equal(simulation.state.party.slots[0].exists, false);
  assert.deepEqual(simulation.state.party.slots[0].member, inTown.party.slots[0].member);
  assert.deepEqual(simulation.state.party.slots[0].weapon, inTown.party.slots[0].weapon);
  assert.equal(simulation.state.gold, inTown.gold); assert.equal(simulation.state.rng, inTown.rng);
  assert.deepEqual(simulation.state.town, inTown.town); restore(simulation);
});

test('equipment rejection is atomic and saved ally-MOD No preserves both records', () => {
  let simulation = classTown(6); hire(simulation);
  const factory = new ItemFactory(() => 0.5);
  simulation.state.inventory[2] = factory.generate(1); // Sheriff has no Small Gun skill.
  const before = saved(simulation);
  assert.equal(simulation.movePartyEquipment(inventory(2), companion()), 'unavailable');
  assert.equal(simulation.movePartyEquipment(companion(), inventory(1)), 'unavailable');
  assert.deepEqual(saved(simulation), before);
  const mod = factory.generate(8); factory.setMod(mod, 4);
  simulation.state.inventory[2] = mod;
  const pendingBefore = saved(simulation);
  assert.equal(simulation.movePartyEquipment(inventory(2), companion()), 'previewed');
  simulation = restore(simulation);
  assert.equal(simulation.resolvePartyAction(false), 'cancelled');
  assert.deepEqual(saved(simulation), pendingBefore);
  assert.equal(simulation.movePartyEquipment(inventory(2), companion()), 'previewed');
  const attack = simulation.actorWeapon(1)!.attack;
  simulation = restore(simulation);
  assert.equal(simulation.resolvePartyAction(true), 'mounted');
  assert.ok(simulation.actorWeapon(1)!.attack > attack);
  assert.equal(simulation.state.inventory[2]!.num, 0);
  assert.equal(simulation.state.gold, pendingBefore.gold); assert.equal(simulation.state.town!.ap, pendingBefore.town.ap);
  restore(simulation);
});

test('companion projectile ownership survives an empty hero launch slot and rejects owner loss', () => {
  const simulation = classTown(1); hire(simulation);
  assert.equal(simulation.moveTownItem(0, 5), true);
  assert.equal(simulation.startNextDay(), true);
  while (simulation.state.newWave) simulation.tick({ fireReleased: false });
  simulation.state.newWave = false; simulation.state.spawnTimer = 1000;
  boundary(simulation).spawnEnemy('sheep');
  const target = simulation.state.enemies.at(-1)!;
  Object.assign(target, { x: 300, y: 215, hp: 1 });
  const member = simulation.state.party.slots[0].member!;
  member.aiState!.targetUid = target.uid;
  assert.equal(boundary(simulation).fireActorAt(1, target.x, target.y), true);
  assert.equal(simulation.state.projectiles.length, 1);
  assert.equal(simulation.state.projectiles[0].actorSlot, 1);
  assert.equal(simulation.state.projectiles[0].kind, 'bolt');
  assert.equal(simulation.state.inventory[0], null);
  const checkpoint = saved(simulation), resumed = restore(simulation);
  for (const change of [
    (value: any) => { delete value.projectiles[0].actorSlot; },
    (value: any) => { value.projectiles[0].actorSlot = 2; },
    (value: any) => { value.party.slots[0].exists = false; },
    (value: any) => { value.party.slots[0].weapon = null; },
  ]) {
    const invalid = structuredClone(checkpoint); change(invalid);
    const unchanged = structuredClone(invalid);
    assert.throws(() => Simulation.fromSave(invalid));
    assert.deepEqual(invalid, unchanged);
  }
  const hero = structuredClone(simulation.state.player);
  for (let frame = 0; frame < 90; frame++) {
    simulation.tick({ fireReleased: false }); resumed.tick({ fireReleased: false });
    assert.deepEqual(resumed.state, simulation.state); assert.deepEqual(resumed.events, simulation.events);
  }
  assert.ok(member.kills >= 1, 'the real projectile must reach and kill its target');
  assert.equal(simulation.state.player.exp, hero.exp);
  assert.deepEqual(simulation.state.player.weaponExp, hero.weaponExp);
});

test('current saves retain target ownership and pending dialogs; invalid party imports do not mutate their input', () => {
  let simulation = classTown(6); hire(simulation);
  assert.equal(simulation.setCompanionOrder(1, 4), true);
  assert.equal(simulation.setCompanionPriorities(1, { boss: false, wall: true }), true);
  assert.equal(simulation.setCompanionFocus(1, 121), true);
  const configured = saved(simulation);
  assert.equal(simulation.requestDismiss(1), true);
  simulation = restore(simulation);
  assert.equal(simulation.resolvePartyAction(false), 'cancelled');
  assert.deepEqual(saved(simulation), configured);
  assert.equal(simulation.startNextDay(), true);
  simulation = restore(simulation);
  const valid = saved(simulation);
  for (const change of [
    (value: any) => { delete value.party; },
    (value: any) => { value.party.slots[0].member.aiState = null; },
    (value: any) => { value.party.slots[0].member.aiState.targetUid = 999999; },
    (value: any) => { value.pendingPartyAction = { kind: 'hire' }; },
    (value: any) => { value.party.slots[0].member.focus = 900; },
  ]) {
    const invalid = structuredClone(valid); change(invalid); const unchanged = structuredClone(invalid);
    assert.throws(() => Simulation.fromSave(invalid)); assert.deepEqual(invalid, unchanged);
  }
});

test('end-day companion growth, wages and dismissal settle once through ordinary result/town actions', () => {
  let simulation = readyBattle(6);
  const member = simulation.state.party.slots[0].member!;
  member.exp = 750;
  const cachedSkills = structuredClone(simulation.state.partySkills);
  const beforeGold = simulation.state.gold, beforeTotal = simulation.state.totalMoney;
  boundary(simulation).finishDay();
  assert.equal(member.level, 2); assert.equal(member.exp, 0); assert.equal(member.traits[6], 2);
  assert.deepEqual(simulation.state.partySkills, cachedSkills);
  rewards(simulation);
  assert.equal(member.skillPoints, 0, 'all pending companion choices settle before loot/result');
  const wage = companionWage(member, cachedSkills.effects[127] ?? 0);
  const result = simulation.state.result as typeof simulation.state.result & { wages: number };
  assert.equal(result.wages, wage);
  assert.equal(result.netReward, result.reward + result.perfectBonus + result.salary - result.upkeep - result.tax - wage);
  assert.equal(simulation.state.gold, beforeGold + result.netReward);
  assert.equal(simulation.state.totalMoney, beforeTotal + result.reward + result.perfectBonus + result.salary);
  simulation = restore(simulation);
  const settled = saved(simulation); boundary(simulation).prepareResult(); assert.deepEqual(saved(simulation), settled);
  assert.equal(simulation.enterTown(), true);
  const current = structuredClone(simulation.state.party.slots[0]), historical = structuredClone(simulation.state.town);
  assert.equal(simulation.requestDismiss(1), true);
  simulation = restore(simulation);
  assert.equal(simulation.resolvePartyAction(true), 'dismissed');
  assert.equal(simulation.state.party.slots[0].exists, false);
  assert.deepEqual(simulation.state.party.slots[0].member, current.member);
  assert.deepEqual(simulation.state.party.slots[0].weapon, current.weapon);
  assert.deepEqual(simulation.state.town, historical);
  assert.equal(simulation.state.gold, settled.gold, 'dismissal does not repay wages or recruitment cost');
  assert.deepEqual(simulation.state.partySkills, partySkills([simulation.state.player]));
  restore(simulation);
});

test('v14 town migration installs the retained candidate without RNG, preparation or money changes', () => {
  const simulation = town();
  const legacy: Record<string, any> = saved(simulation);
  legacy.version = 14;
  for (const key of ['party', 'partySkills', 'partyAI', 'retainedAITargets', 'pendingPartyAction']) delete legacy[key];
  delete legacy.result.wages;
  const untouched = structuredClone(legacy);
  const migrated = Simulation.fromSave(legacy);
  assert.deepEqual(legacy, untouched);
  assert.equal(migrated.state.version, 21);
  assert.equal(migrated.state.rng, legacy.rng); assert.equal(migrated.state.gold, legacy.gold);
  assert.equal(migrated.state.totalMoney, legacy.totalMoney);
  assert.deepEqual(migrated.state.inventory, legacy.inventory);
  assert.deepEqual(migrated.state.town, legacy.town);
  assert.equal(migrated.state.party.slots[4].exists, true);
  assert.deepEqual(migrated.state.party.slots[4].weapon, legacy.town.recruit.items[45]);
  assert.equal(migrated.state.party.slots[4].member!.name, legacy.town.recruit.name);
  assert.equal(migrated.state.pendingPartyAction, null);
  restore(migrated);
});

test('all three companion Wind Bow arrows survive a save while airborne', () => {
  const simulation = readyBattle(9), slot = simulation.state.party.slots[0], member = slot.member!;
  const bow = new ItemFactory(() => 0.5).generate(25);
  member.traits[bow.reqTrait!] = Math.max(member.traits[bow.reqTrait!] ?? 0, bow.reqLv!);
  slot.weapon = bow;
  boundary(simulation).spawnEnemy('sheep');
  const enemy = simulation.state.enemies.at(-1)!; Object.assign(enemy, { x: 300, y: 215 });
  member.aiState!.targetUid = enemy.uid;
  assert.equal(boundary(simulation).fireActorAt(1, 300, 215), true);
  member.shootTimer = 0;
  assert.equal(boundary(simulation).fireActorAt(1, 300, 215), true);
  assert.deepEqual(simulation.state.projectiles.map(p => p.startX), [517, 512, 507]);
  const resumed = restore(simulation);
  for (let frame = 0; frame < 90; frame++) {
    simulation.tick(); resumed.tick();
    assert.deepEqual(resumed.state, simulation.state); assert.deepEqual(resumed.events, simulation.events);
  }
});

test('battle exit refills active and retained inactive companion weapons before town equipment access', () => {
  const simulation = readyBattle(6);
  const active = simulation.state.party.slots[0];
  active.weapon!.ammo = 0; active.weapon!.reloadTime = 3;
  const inactive = simulation.state.party.slots[1];
  inactive.weapon = structuredClone(active.weapon);
  boundary(simulation).finishDay();
  for (const slot of [active, inactive]) {
    assert.equal(slot.weapon!.ammo, slot.weapon!.ammoMax);
    assert.equal(slot.weapon!.reloadTime, 0);
  }
  rewards(simulation); assert.equal(simulation.enterTown(), true);
  assert.equal(simulation.movePartyEquipment(companion(), inventory(5)), 'moved');
  assert.equal(simulation.state.inventory[5]!.ammo, simulation.state.inventory[5]!.ammoMax);
  restore(simulation);
});

test('real Crow and Fly spawns enter the air cache and obey Air versus Armor companion orders', () => {
  for (const kind of ['crow', 'fly'] as const) for (const order of [4, 5]) {
    const simulation = classTown(6); hire(simulation);
    assert.equal(simulation.setCompanionOrder(1, order), true);
    assert.equal(simulation.startNextDay(), true);
    while (simulation.state.newWave) simulation.tick();
    simulation.state.spawnTimer = 1000;
    // Управляем только местом реального spawn и броском поиска; тип и кеш создаёт обычный tick.
    boundary(simulation).spawnEnemy(kind);
    const enemy = simulation.state.enemies.at(-1)!; enemy.x = 200;
    assert.equal(enemy.type, 1, `${kind}: Main._air=1, _armor=2`);
    simulation.tick();
    assert.equal(simulation.state.partyAI.targets[1][1].uid, enemy.uid);
    assert.ok(simulation.state.partyAI.targets[2].every(cell => cell.uid === null));
    simulation.state.rng = 1;
    simulation.tick();
    assert.equal(simulation.state.party.slots[0].member!.aiState!.targetUid, order === 4 ? enemy.uid : null, `${kind}: order ${order}`);
    restore(simulation);
  }
});

test('pre-party saves reconstruct source air targeting types without altering their RNG or input', () => {
  const simulation = new Simulation(42);
  boundary(simulation).spawnEnemy('crow');
  const legacy = asLegacyV14Save(simulation.toSave()), before = structuredClone(legacy);
  const restored = Simulation.fromSave(legacy);
  assert.deepEqual(restored.toSave(), withLegacyPartyDefaults(legacy));
  assert.equal(restored.state.enemies[0].type, 1);
  assert.deepEqual(legacy, before); assert.equal(restored.state.rng, legacy.rng);
});

test('early v15 air classification repair moves complete cache cells and preserves selected and retained targets', () => {
  const simulation = readyBattle(6);
  boundary(simulation).spawnEnemy('crow'); boundary(simulation).spawnEnemy('fly'); boundary(simulation).spawnEnemy('sheep');
  const [crow, fly, sheep] = simulation.state.enemies;
  Object.assign(crow, { x: 220, tag: 17, onMark: true });
  Object.assign(sheep, { x: 350, tag: 9 });
  // Контролируемый сохранённый снимок после удаления Fly, на которого ещё ссылается союзник.
  simulation.state.enemies = [crow, sheep];
  simulation.state.retainedAITargets = [{ uid: fly.uid, x: 80.25, y: fly.y, speed: fly.speed, hp: -1,
    removed: true, type: 1, tag: 11, onMark: true }];
  const shared = simulation.state.partyAI;
  shared.targets[0][2] = { uid: sheep.uid, x: 348.15 };
  shared.targets[1][0] = { uid: fly.uid, x: 78.55 };
  shared.targets[1][1] = { uid: crow.uid, x: 219.35 };
  shared.nextAlertUid = fly.uid; shared.sharedWeaponRange = 2;
  Object.assign(simulation.state.party.slots[0].member!.aiState!, { targetUid: fly.uid, onMark: true, aimCount: 7, idleCount: 0.231 });
  const correct = saved(simulation), current = restore(simulation);
  const early = structuredClone(correct);
  early.version = 15; delete early.wallLevel;
  early.enemies.find((enemy: EnemyState) => enemy.kind === 'crow').type = 2;
  early.retainedAITargets[0].type = 2;
  early.partyAI.targets[2] = early.partyAI.targets[1];
  early.partyAI.targets[1] = Array.from({ length: 3 }, () => ({ uid: null, x: 1000 }));
  const unchanged = structuredClone(early);
  const repaired = Simulation.fromSave(early);
  assert.deepEqual(repaired.toSave(), correct);
  assert.deepEqual(early, unchanged); assert.equal(repaired.state.rng, early.rng);
  for (let frame = 0; frame < 5; frame++) {
    repaired.tick(); current.tick();
    assert.deepEqual(repaired.state, current.state); assert.deepEqual(repaired.events, current.events);
  }
  for (const corrupt of [
    (value: any) => { value.retainedAITargets[0].type = 1; },
    (value: any) => { value.partyAI.targets[1][1] = structuredClone(value.partyAI.targets[2][1]); },
    (value: any) => { value.enemies.find((enemy: EnemyState) => enemy.kind === 'sheep').type = 2; },
    (value: any) => { value.partyAI.targets[2][2] = structuredClone(value.partyAI.targets[0][2]); },
  ]) {
    const invalid = structuredClone(early); corrupt(invalid); const before = structuredClone(invalid);
    assert.throws(() => Simulation.fromSave(invalid), /Ambiguous early v15/);
    assert.deepEqual(invalid, before);
  }
  const misplaced = structuredClone(correct);
  misplaced.partyAI.targets[2][1] = misplaced.partyAI.targets[1][1];
  misplaced.partyAI.targets[1][1] = { uid: null, x: 1000 };
  assert.throws(() => Simulation.fromSave(misplaced), /Invalid party target row/);
});
