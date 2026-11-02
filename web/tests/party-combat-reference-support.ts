import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { Simulation, type EnemyState, type SimulationEvent } from '../src/simulation.ts';
import { createPartyAIState, refreshPartyAI } from '../src/party-ai.ts';
import { partySkills } from '../src/party-progression.ts';
import type { PartyMember } from '../src/party.ts';
import type { Item } from '../src/items.ts';

type Row = Record<string, any>;
interface Boundary {
  random(): number; spawnEnemy(kind: 'sheep'): void;
  processPellet(x: number, y: number, damage: number, weaponSlot: number, actorSlot: number): boolean;
  fireActorAt(slot: number, x: number, y: number): boolean;
  damageCastle(damage: number, attacker?: EnemyState): void;
  finishDay(): void; prepareOrdinaryLoot(random: () => number): void;
}
const actorFields = ['level', 'exp', 'skillPoints', 'traits', 'weaponExp', 'shootTimer', 'accuracyFix', 'rampageTicks'];
const companionFields = ['devType', 'potentialAim', 'potentialTeam', 'nextTrait', 'focus', 'appearance', 'kills', 'earnedGold', 'money'];
const enemyFields = ['x', 'y', 'hp', 'attack', 'speed', 'speedOrg', 'gold', 'exp', 'knockBack', 'attacking', 'attacked', 'drop', 'deathTicks', 'frame', 'shadowHit'];
const pick = (value: Row, keys: string[]) => Object.fromEntries(keys.map(key => [key, value[key]]));

export function comparePartyCombatTrace(records: Row[], changeInput?: (simulation: Simulation, row: Row) => void) {
  assert.equal(records[0].type, 'ready'); assert.equal(records[0].kind, 'party-combat');
  assert.equal(records[0].clock, 'synchronous-original-methods'); assert.equal(records[0].geometry, 'original-vector-procHit'); assert.equal(records[0].seed, 42);
  assert.equal(records.at(-1)?.type, 'complete'); assert.equal(records.at(-1)?.ok, true);
  const snapshots = records.filter(row => row.type === 'snapshot');
  assert.equal(snapshots.length, 37); assert.equal(snapshots.length, records.at(-1)?.snapshots);
  assert.deepEqual(snapshots.map(row => row.scenario), [
    ...Array.from({ length: 9 }, (_, i) => `contact_class_${i + 1}`),
    ...Array.from({ length: 9 }, (_, i) => `kill_growth_class_${i + 1}`),
    ...Array.from({ length: 9 }, (_, i) => `settlement_class_${i + 1}`),
    'ranger_team_threshold', 'living_weapon_kill', 'guardian_credits_hero', 'guardian_credits_companion', 'noble_level_gap',
    'companion_weapon_threshold_equal', 'companion_weapon_threshold_above',
    'actual_shoot_sniper_idle', 'actual_shoot_duelist_frenzy', 'actual_shoot_noble',
  ]);
  for (const row of snapshots.filter(row => row.config.boundary === 'hit')) {
    assert.equal(row.geometry.body, true, row.scenario); assert.equal(row.geometry.shadow, false, row.scenario);
    assert.equal(row.hit, true, row.scenario); assert.ok(row.damageEvents.length > 0, row.scenario);
    assert.equal(row.damageEvents[0].actorSlot, 1, row.scenario);
  }
  for (const row of snapshots.filter(row => row.config.boundary === 'shoot')) {
    assert.equal(row.hit, true, row.scenario); assert.equal(row.damageEvents.length, 1, row.scenario);
    assert.equal(row.pellets.length, 1, row.scenario); assert.equal(row.damageEvents[0].actorSlot, 1, row.scenario);
    assert.ok(row.pellets[0].targets.some((target: Row) => target.shapeHit && !target.shadowExcluded), row.scenario);
  }
  const comparisons = snapshots.map(row => {
    const before = row.before, config = row.config;
    let drawCount = 0, geometryCalls = 0;
    const geometryPoints: Row[] = [];
    // Контур оригинала является входом; критическую область, эффекты и порядок RNG проверяет продукт.
    const simulation = new Simulation(42, { hitTest: (_enemy, x, y) => {
      if (config.boundary !== 'shoot') return row.geometry.body && !row.geometry.shadow;
      const index = geometryCalls++;
      geometryPoints.push({ index, x, y, drawCount });
      const target = row.pellets[index]?.targets[0];
      return Boolean(target?.shapeHit && !target.shadowExcluded);
    } });
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
    state.partySkills = partySkills([state.player, member]);
    refreshPartyAI(slot, state.partySkills.effects[116]);
    Object.assign(member.aiState!, { targetUid: enemy.uid, idleCount: source.idleCount, frenzy: source.frenzy, burst: source.burst });
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
    if (config.boundary === 'hit') hit = boundary.processPellet(row.geometry.x, row.geometry.y, config.damage, 0, 1);
    else if (config.boundary === 'castle') boundary.damageCastle(3, enemy);
    else if (config.boundary === 'shoot') hit = boundary.fireActorAt(1, Math.trunc(enemy.x), Math.trunc(enemy.y));
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
      party: state.partySkills, castleHp: state.castleHp, castleMaxHp: state.castleMaxHp,
      totalKill: state.kills, totalMoney: state.totalMoney, money: state.gold,
      loot: state.loot, criticalKills: state.criticalKills, bossKilled: state.bossKilled,
      hit, damageEvents, draws, drawCount, rngState: state.rng,
    };
    const expected = {
      actors: [pick(row.after.actors[0], actorFields), pick(row.after.actors[1], [...actorFields, ...companionFields, 'idleCount', 'burst', 'frenzy'])],
      items: row.after.items, enemy: { ...pick(row.after.enemy, enemyFields), alive: row.after.enemy.alive, free: row.after.enemy.free },
      party: row.after.party, castleHp: row.after.castleHp, castleMaxHp: row.after.castleMaxHp,
      totalKill: row.after.totalKill, totalMoney: row.after.totalMoney, money: row.after.actors[0].money,
      loot: row.after.loot, criticalKills: row.after.criticalKills, bossKilled: row.after.bossKilled,
      hit: row.hit, damageEvents: row.damageEvents, draws: row.draws, drawCount: row.drawCount, rngState: row.rngState,
    };
    const differences = Object.entries(actual).filter(([key, value]) => !isDeepStrictEqual(value, expected[key as keyof typeof expected]))
      .map(([field, value]) => ({ field, expected: expected[field as keyof typeof expected], actual: value }));
    if (config.boundary === 'shoot') {
      const expectedPoints = row.pellets.map(({ index, x, y, drawCount }: Row) => ({ index, x, y, drawCount }));
      if (!isDeepStrictEqual(geometryPoints, expectedPoints)) differences.push({ field: 'pelletGeometry', expected: expectedPoints, actual: geometryPoints });
    }
    if (config.boundary === 'settlement' && !stoppedBeforeLoot) differences.push({ field: 'settlementBoundary', expected: true, actual: false });
    return { scenario: row.scenario, matched: differences.length === 0, originalDrawCount: row.drawCount, portDrawCount: drawCount, differences };
  });
  return { status: comparisons.every(row => row.matched) ? 'passed' as const : 'failed' as const, matchedSnapshots: comparisons.filter(row => row.matched).length, comparisons };
}
