import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { Simulation, type SimulationEvent } from '../src/simulation.ts';
import { createPartyAIState, refreshPartyAI } from '../src/party-ai.ts';
import { partySkills } from '../src/party-progression.ts';
import type { PartyMember } from '../src/party.ts';
import type { Item } from '../src/items.ts';
import { castleTrainerMultiplier, castleUpgradeCost, castleUpkeep } from '../src/castle-upgrades.ts';
import { inputSlot, rawSlot } from './town-preparation-reference-support.ts';

type Row = Record<string, any>;
interface Boundary {
  random(): number; spawnEnemy(kind: 'sheep'): void;
  processPellet(x: number, y: number, damage: number, weaponSlot: number, actorSlot: number): boolean;
  finishDay(): void; prepareOrdinaryLoot(random: () => number): void;
}
const actorFields = ['level', 'exp', 'skillPoints', 'traits', 'weaponExp', 'shootTimer', 'accuracyFix', 'rampageTicks'];
const companionFields = ['devType', 'potentialAim', 'potentialTeam', 'nextTrait', 'focus', 'appearance', 'kills', 'earnedGold', 'money'];
const enemyFields = ['x', 'y', 'hp', 'attack', 'speed', 'speedOrg', 'gold', 'exp', 'knockBack', 'attacking', 'attacked', 'drop', 'deathTicks', 'frame', 'shadowHit'];
const pick = (value: Row, keys: string[]) => Object.fromEntries(keys.map(key => [key, value[key]]));
// updateAlly обнуляет таймер даже никогда не созданного предмета; null порта не имеет такого таймера.
const slotProjection = (item: Row) => item.id == null ? { ...item, reloadTime: null } : item;

const combatScenarios = ['hero-normal-0', 'hero-normal-1', 'hero-growth-0', 'hero-growth-1',
  'companion-growth-0', 'companion-growth-1', 'companion-critical-0', 'companion-critical-1',
  'noble-gap-0', 'noble-gap-10', 'noble-gap-growth-0', 'noble-gap-growth-10',
  'mission-fraction-0', 'mission-fraction-3', 'settlement-reserves-0', 'settlement-reserves-10'];
const purchaseScenarios = ['trainer-insufficient', 'trainer-first', 'trainer-sequence', 'trainer-float-hint', 'trainer-high-level'];
export function compareCastleTrainerTrace(records: Row[], changeInput?: (simulation: Simulation, row: Row) => void) {
  assert.equal(records[0].type, 'ready'); assert.equal(records[0].kind, 'castle-trainer');
  assert.equal(records[0].clock, 'synchronous-original-methods-and-castle-clicks');
  assert.equal(records[0].geometry, 'original-vector-procHit'); assert.equal(records[0].seed, 42);
  assert.equal(records.at(-1)?.type, 'complete'); assert.equal(records.at(-1)?.ok, true);
  const all = records.filter(row => row.type === 'snapshot');
  assert.equal(all.length, 27); assert.equal(all.length, records.at(-1)?.snapshots);
  const snapshots = all.filter(row => row.boundary !== 'purchase');
  assert.deepEqual(snapshots.map(row => row.scenario), combatScenarios);
  assert.deepEqual([...new Set(all.filter(row => row.boundary === 'purchase').map(row => row.scenario))], purchaseScenarios);
  for (const row of snapshots.filter(row => row.config.boundary === 'hit')) {
    assert.equal(row.geometry.body, true, row.scenario); assert.equal(row.geometry.shadow, false, row.scenario);
    assert.equal(row.hit, true, row.scenario); assert.equal(row.damageEvents.length, 1, row.scenario);
    assert.equal(row.damageEvents[0].actorSlot, row.config.actor, row.scenario);
    assert.equal(row.xpEvents.length, 1); assert.equal(row.xpEvents[0].pcType, 'undefined');
    assert.equal(row.xpEvents[0].pcValue, 'undefined'); assert.equal(row.xpEvents[0].declaredHero, 0);
  }
  const comparisons = snapshots.map(row => {
    const before = row.before, config = row.config;
    let drawCount = 0;
    // Контур оригинала является входом; критическую область, эффекты и порядок RNG проверяет продукт.
    const simulation = new Simulation(42, { hitTest: () => row.geometry.body && !row.geometry.shadow });
    const boundary = simulation as unknown as Boundary, state = simulation.state;
    boundary.spawnEnemy('sheep');
    const enemy = state.enemies[0];
    Object.assign(enemy, pick(before.enemy, enemyFields), { removed: before.enemy.free });
    const hero = before.actors[0], source = before.actors[1];
    Object.assign(state.player, pick(hero, actorFields));
    state.player.traits = { ...hero.traits }; state.player.weaponExp = [...hero.weaponExp];
    state.hero = { provenance: 'original-generation', name: 'You', sex: 0,
      potentialAim: hero.potentialAim, potentialTeam: hero.potentialTeam, nextTrait: hero.nextTrait };
    state.inventory[0] = structuredClone(before.items[0]) as Item;
    const member: PartyMember = {
      ...structuredClone(source), sex: 0, name: 'Captured companion', trained: 0, optBoss: true, optWall: true,
      cost: 0, ai: 0, bowDrawing: false, aiState: createPartyAIState(1),
    };
    const slot = state.party.slots[0]; Object.assign(slot, { exists: true, member, weapon: structuredClone(before.items[1]) as Item });
    for (const reserve of before.reserves) {
      const entry = state.party.slots[reserve.slot - 1];
      Object.assign(entry, { exists: reserve.exists, member: { ...structuredClone(reserve),
        sex: 0, name: 'Captured reserve', trained: 0, optBoss: true, optWall: true,
        cost: 0, ai: 0, bowDrawing: false, aiState: null }, weapon: null });
    }
    state.partySkills = partySkills([state.player, member]);
    refreshPartyAI(slot, state.partySkills.effects[116]);
    Object.assign(member.aiState!, { targetUid: enemy.uid, idleCount: source.idleCount, frenzy: source.frenzy, burst: source.burst });
    state.trainerLevel = config.trainer; state.activeMission.expFix = config.expFix ?? 1;
    state.day = config.day ?? 1; state.gold = hero.money; state.totalMoney = before.totalMoney;
    state.castleHp = before.castleHp; state.castleMaxHp = before.castleMaxHp;
    state.kills = before.totalKill; state.criticalKills = before.criticalKills; state.bossKilled = before.bossKilled;
    state.loot = [...before.loot]; state.noDamage = false; state.waveIndex = 4; state.waves[4].initialCount = 10;
    state.rng = 42; state.enemies = [enemy];
    let prefixIndex = 0;
    const draws: Row[] = [], damageEvents: Row[] = [];
    boundary.random = () => {
      let value = state.rng | 0; value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
      state.rng = value >>> 0; drawCount++;
      const result = prefixIndex < (config.prefix?.length ?? 0) ? config.prefix[prefixIndex++] : state.rng / 4294967296;
      draws.push({ index: drawCount, state: state.rng, value: result }); return result;
    };
    simulation.events = [];
    const push = simulation.events.push.bind(simulation.events);
    let hpBefore = enemy.hp;
    simulation.events.push = (...events: SimulationEvent[]) => {
      for (const event of events) if (event.type === 'hit') {
        damageEvents.push({ enemyId: 3, damage: event.amount, critType: event.criticalType ?? Number(event.critical), hpBefore,
          x: event.x, y: event.y, actorSlot: event.actorSlot ?? 0, drawCount });
        hpBefore -= event.amount!;
      }
      return push(...events);
    };
    changeInput?.(simulation, row);
    let hit = false, stoppedBeforeLoot = false;
    if (config.boundary === 'hit') hit = boundary.processPellet(row.geometry.x, row.geometry.y, config.damage, 0, config.actor);
    else {
      // Прерывается лишь генерация следующего события: XP/рост/автонавыки выполняет настоящий finishDay.
      boundary.prepareOrdinaryLoot = () => { stoppedBeforeLoot = true; };
      boundary.finishDay();
    }
    const actual = {
      actors: [pick(state.player, actorFields), { ...pick(member, [...actorFields, ...companionFields]),
        idleCount: member.aiState!.idleCount, burst: member.aiState!.burst, frenzy: member.aiState!.frenzy }],
      items: [state.inventory[0], slot.weapon],
      enemy: { ...pick(enemy, enemyFields), alive: enemy.hp > 0, free: enemy.removed },
      reserves: [2, 5].map(index => { const value = state.party.slots[index - 1]; return {
        exists: value.exists, ...pick(value.member!, [...actorFields, ...companionFields]),
      }; }),
      party: state.partySkills, castleHp: state.castleHp, castleMaxHp: state.castleMaxHp,
      totalKill: state.kills, totalMoney: state.totalMoney, money: state.gold,
      loot: state.loot, criticalKills: state.criticalKills, bossKilled: state.bossKilled,
      hit, damageEvents, draws, drawCount, rngState: state.rng,
    };
    const expected = {
      // eventAfterBattle переносит SP героя в очередь _eventLevel=7; порт хранит те же ожидающие очки в actor.
      actors: [{ ...pick(row.after.actors[0], actorFields), skillPoints: row.after.actors[0].skillPoints
        + row.after.eventList.filter((event: number) => event === 7).length }, pick(row.after.actors[1], [...actorFields, ...companionFields, 'idleCount', 'burst', 'frenzy'])],
      items: row.after.items, enemy: { ...pick(row.after.enemy, enemyFields), alive: row.after.enemy.alive, free: row.after.enemy.free },
      reserves: row.after.reserves.map((value: Row) => pick(value, ['exists', ...actorFields, ...companionFields])),
      party: row.after.party, castleHp: row.after.castleHp, castleMaxHp: row.after.castleMaxHp,
      totalKill: row.after.totalKill, totalMoney: row.after.totalMoney, money: row.after.actors[0].money,
      loot: row.after.loot, criticalKills: row.after.criticalKills, bossKilled: row.after.bossKilled,
      hit: row.hit, damageEvents: row.damageEvents, draws: row.draws, drawCount: row.drawCount, rngState: row.rngState,
    };
    const differences = Object.entries(actual).filter(([key, value]) => !isDeepStrictEqual(value, expected[key as keyof typeof expected]))
      .map(([field, value]) => ({ field, expected: expected[field as keyof typeof expected], actual: value }));
    if (config.boundary === 'settlement' && !stoppedBeforeLoot) differences.push({ field: 'settlementBoundary', expected: true, actual: false });
    return { scenario: row.scenario, matched: differences.length === 0, originalDrawCount: row.drawCount, portDrawCount: drawCount, differences };
  });
  for (const scenario of purchaseScenarios) {
    const rows = all.filter(row => row.scenario === scenario), before = rows[0];
    const simulation = new Simulation(42), boundary = simulation as unknown as Boundary;
    boundary.finishDay();
    while (simulation.state.postbattle !== 'result') {
      if (simulation.state.postbattle === 'skill') simulation.chooseSkill(simulation.state.skillChoices[0]); else simulation.finishLoot();
    }
    assert.equal(simulation.enterTown(), true);
    const state = simulation.state;
    Object.assign(state, { trainerLevel: before.trainerLevel, gold: before.gold, castleHp: before.hp,
      castleMaxHp: before.maxHp, totalMoney: before.totalMoney, inventory: before.inventory.map(slotProjection).map(inputSlot), rng: before.rngState });
    state.town!.ap = before.ap;
    const invariant = structuredClone({ inventory: state.inventory, town: state.town, result: state.result,
      party: state.party, cache: state.partySkills, mission: state.activeMission });
    let draws = 0; const random = boundary.random.bind(simulation);
    boundary.random = () => { draws++; return random(); };
    for (const [index, row] of rows.entries()) {
      if (index > 0) simulation.buyCastleUpgrade('trainer');
      const cost = castleUpgradeCost('trainer', state), multiplier = castleTrainerMultiplier(state);
      const actual = { trainerLevel: state.trainerLevel, multiplier, upkeep: castleUpkeep(state), gold: state.gold, ap: state.town!.ap,
        totalMoney: state.totalMoney, hp: state.castleHp, maxHp: state.castleMaxHp, inventory: state.inventory.map(rawSlot),
        tile: { cost, possible: cost > 0 && cost <= state.gold, name: `Trainer${state.trainerLevel ? ` Lv ${state.trainerLevel}` : ''}` },
        drawCount: draws, rngState: state.rng };
      const expected = { ...row, inventory: row.inventory.map(slotProjection), tile: pick(row.tile, ['cost', 'possible', 'name']) };
      const differences = Object.entries(actual).filter(([key, value]) => !isDeepStrictEqual(value, expected[key]))
        .map(([field, value]) => ({ field, expected: expected[field], actual: value }));
      const after = { inventory: state.inventory, town: state.town, result: state.result,
        party: state.party, cache: state.partySkills, mission: state.activeMission };
      if (!isDeepStrictEqual(invariant, after)) differences.push({ field: 'unrelatedState', expected: invariant, actual: after });
      comparisons.push({ scenario, matched: differences.length === 0, originalDrawCount: row.drawCount, portDrawCount: draws, differences });
    }
  }
  return { observedSnapshots: 27, status: comparisons.every(row => row.matched) ? 'passed' as const : 'failed' as const, matchedSnapshots: comparisons.filter(row => row.matched).length, comparisons };
}
