import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { ENEMIES, type EnemyKind } from '../src/content.ts';
import type { Item } from '../src/items.ts';
import { weaponStats } from '../src/combat-stats.ts';
import { Simulation, type EnemyState, type SimulationEvent } from '../src/simulation.ts';

interface OriginalPlayer {
  level: number; exp: number; skillPoints: number; traits: Record<number, number>;
  potentialAim: number; potentialTeam: number; shootTimer: number; accuracyFix: number;
  idleCount: number; burst: number; frenzy: number; rampage: number; kills: number;
  weaponExp: number; earnedGold: number; criticalKills: number; loot: number[]; castleHp: number;
}
interface OriginalEnemy {
  id: number; x: number; y: number; hp: number; attack: number; speed: number; speedOrg: number;
  gold: number; exp: number; knockBack: number; attacking: boolean; attacked: boolean; drop: number;
  deathTicks: number; frame: number; alive: boolean; free: boolean; shadowHit: boolean;
  boss: { action: number; count: number; weapon: number; hpMax: number; damage: number };
}
interface OriginalState { player: OriginalPlayer; enemy: OriginalEnemy; weapon: Record<string, unknown> }
interface OriginalPellet {
  index: number; x: number; y: number; damage: number; drawCount: number;
  targets: { slot: number; id: number; alive: boolean; frame: number; shapeHit: boolean; shadowExcluded: boolean }[];
}
interface DamageEvent { enemyId: number; damage: number; critType: number; hpBefore: number; x: number; y: number; drawCount: number }
interface RandomDraw { index: number; state: number; value: number }
export interface ShootReferenceRecord {
  type: string; version: number; kind: string; rng?: string; clock?: string; geometry?: string;
  seeds?: number[]; scenarios?: string[]; inputSeam?: string; displayAdvance?: string;
  ok?: boolean; snapshots?: number; scenario?: string; seed?: number; config?: Record<string, unknown>;
  aim?: { x: number; y: number }; before?: OriginalState; after?: OriginalState;
  stats?: { shells: number; accuracyDiv: number; rangeFix: number; aimTime: number; workRate: number };
  pellets?: OriginalPellet[]; damageEvents?: DamageEvent[]; draws?: RandomDraw[];
  drawCount?: number; rngState?: number;
}
interface Boundary { random(): number; spawnEnemy(kind: EnemyKind): void }

const ITEM_FIELDS: (keyof Item)[] = ['num', 'id', 'graphic', 'type', 'reloadTime', 'reloadTimeMax', 'ammo', 'ammoMax', 'value', 'mod', 'modMax', 'shell', 'manualReload', 'automatic', 'modText', 'lv', 'typeMinor', 'special', 'leech', 'impact', 'shootRate', 'rare', 'autoReload', 'livingWeapon', 'name', 'baseAccuracy', 'accuracyDec', 'attack', 'dmgAir', 'dmgArmor', 'reqTrait', 'reqLv', 'range'];
const SCENARIOS = ['miss', 'body', 'critical', 'dead_body', 'holliday', 'sense', 'learned_modified', 'lethal', 'level_up_living', 'boss_nonlethal', 'boss_accumulated'];

function capture(record: ShootReferenceRecord) {
  assert.ok(record.before && record.after && record.aim && record.pellets && record.draws);
  const before = record.before;
  const kind = (Object.keys(ENEMIES) as EnemyKind[]).find(value => ENEMIES[value].id === before.enemy.id);
  assert.ok(kind);
  let draws = 0, geometryCalls = 0;
  const randomDraws: RandomDraw[] = [], points: { index: number; x: number; y: number; drawCount: number }[] = [];
  // Силуэт оригинала — вход этого сравнения; координаты, критические области и RNG вычисляет fireAt.
  const simulation = new Simulation(1, { hitTest: (_enemy, x, y) => {
    const index = geometryCalls++;
    points.push({ index, x, y, drawCount: draws });
    const target = record.pellets![index]?.targets[0];
    return Boolean(target?.shapeHit && !target.shadowExcluded);
  } });
  const boundary = simulation as unknown as Boundary, state = simulation.state;
  boundary.spawnEnemy(kind);
  const enemy = state.enemies[0];
  // Граница начинается непосредственно перед shoot: снимок исходного входа не используется как ожидаемый выход.
  Object.assign(enemy, {
    x: before.enemy.x, y: before.enemy.y, hp: before.enemy.hp, maxHp: kind === 'boss' ? before.enemy.boss.hpMax : Math.max(ENEMIES[kind].hp, before.enemy.hp),
    attack: before.enemy.attack, speed: before.enemy.speed, speedOrg: before.enemy.speedOrg, gold: before.enemy.gold,
    exp: before.enemy.exp, knockBack: before.enemy.knockBack, attacking: before.enemy.attacking, attacked: before.enemy.attacked,
    drop: before.enemy.drop, deathTicks: before.enemy.deathTicks, frame: before.enemy.frame, removed: before.enemy.free,
    shadowHit: before.enemy.shadowHit, bossDamage: before.enemy.boss.damage ?? 0,
    ...(kind === 'boss' ? { bossAction: before.enemy.boss.action, bossCount: before.enemy.boss.count, bossWeapon: before.enemy.boss.weapon } : {}),
  });
  const inputItem = Object.fromEntries(Object.entries(before.weapon).filter(([, value]) => value !== null)) as unknown as Item;
  state.inventory[0] = inputItem;
  Object.assign(state.player, {
    level: before.player.level, exp: before.player.exp, skillPoints: before.player.skillPoints, traits: structuredClone(before.player.traits),
    selectedSlot: 0, shootTimer: before.player.shootTimer,
    accuracyFix: before.player.accuracyFix, rampageTicks: before.player.rampage, weaponExp: [0, 0, 0, before.player.weaponExp, 0],
  });
  state.hero.potentialAim = before.player.potentialAim; state.hero.potentialTeam = before.player.potentialTeam;
  state.kills = before.player.kills; state.criticalKills = before.player.criticalKills; state.loot = [...before.player.loot];
  state.castleHp = before.player.castleHp; state.waveIndex = 4; state.waves[4].initialCount = 10;
  state.newWave = false; state.spawnTimer = 100000; state.rng = record.seed!;
  const random = boundary.random.bind(simulation);
  boundary.random = () => {
    const value = random(); draws++;
    randomDraws.push({ index: draws, state: state.rng, value });
    return value;
  };
  const profile = weaponStats(inputItem, state.player.traits);
  const stats = { shells: profile.shells, accuracyDiv: profile.accuracyDiv, rangeFix: profile.rangeFix, aimTime: profile.aimTime, workRate: profile.workRate };
  const damageEvents: DamageEvent[] = [];
  let hpBefore = enemy.hp;
  simulation.events = [];
  const push = simulation.events.push.bind(simulation.events);
  simulation.events.push = (...events: SimulationEvent[]) => {
    for (const event of events) if (event.type === 'hit') {
      damageEvents.push({ enemyId: ENEMIES[kind].id, damage: event.amount!, critType: event.criticalType ?? Number(event.critical), hpBefore, x: event.x!, y: event.y!, drawCount: draws });
      hpBefore -= event.amount!;
    }
    return push(...events);
  };
  const fired = simulation.fireAt(record.aim.x, record.aim.y);
  const weapon = state.inventory[0]!;
  const afterPlayer = {
    level: state.player.level, exp: state.player.exp, skillPoints: state.player.skillPoints, traits: state.player.traits,
    potentialAim: state.hero.potentialAim, potentialTeam: state.hero.potentialTeam,
    shootTimer: state.player.shootTimer, accuracyFix: state.player.accuracyFix, rampage: state.player.rampageTicks,
    kills: state.kills, weaponExp: state.player.weaponExp[3], criticalKills: state.criticalKills, loot: state.loot, castleHp: state.castleHp,
  };
  const afterEnemy = (target: EnemyState) => ({
    hp: target.hp, attack: target.attack, speed: target.speed, speedOrg: target.speedOrg, knockBack: target.knockBack,
    drop: target.drop, deathTicks: target.deathTicks, frame: target.frame, alive: target.hp > 0, free: target.removed,
    ...(kind === 'boss' ? { boss: { action: target.bossAction, count: target.bossCount, weapon: target.bossWeapon, hpMax: target.maxHp, damage: target.bossDamage } } : {}),
  });
  return {
    fired, stats, points, damageEvents, draws: randomDraws, drawCount: draws, rngState: state.rng,
    weapon: Object.fromEntries(ITEM_FIELDS.map(field => [field, weapon[field] ?? null])),
    player: afterPlayer, enemy: afterEnemy(enemy),
    pellets: simulation.events.find(event => event.type === 'shot')?.pellets,
  };
}

export function compareShootTrace(records: ShootReferenceRecord[]) {
  const ready = records[0], complete = records.at(-1);
  assert.equal(ready.type, 'ready'); assert.equal(ready.version, 1); assert.equal(ready.kind, 'shoot');
  assert.equal(ready.clock, 'synchronous-original-shoot'); assert.equal(ready.rng, 'xorshift32');
  assert.equal(ready.geometry, 'original-vector-hitTestPoint'); assert.equal(ready.inputSeam, 'manual-aim-reads-only');
  assert.deepEqual(ready.seeds, [42, 3735928559]); assert.deepEqual(ready.scenarios, SCENARIOS);
  assert.equal(complete?.type, 'complete'); assert.equal(complete?.kind, 'shoot'); assert.equal(complete?.ok, true);
  const snapshots = records.filter(record => record.type === 'snapshot');
  assert.equal(snapshots.length, 22); assert.equal(complete.snapshots, 22); assert.equal(records.length, 24);
  assert.deepEqual(snapshots.map(record => [record.seed, record.scenario]), ready.seeds!.flatMap(seed => SCENARIOS.map(scenario => [seed, scenario])));
  // Название сценария не доказывает покрытие: проверяем реально наблюдённые ветви оригинала.
  for (const record of snapshots.filter(row => row.scenario === 'dead_body')) {
    assert.equal(record.damageEvents!.length, 0);
    assert.ok(record.pellets!.some(pellet => pellet.targets.some(target => !target.alive && target.shapeHit && !target.shadowExcluded)));
    assert.ok(record.drawCount! > record.pellets!.length * 4);
  }
  for (const record of snapshots.filter(row => row.scenario === 'sense')) {
    assert.ok(record.damageEvents!.length > 0);
    assert.ok(record.damageEvents!.every(event => event.critType === 0 || event.critType === 2));
  }
  const comparisons = snapshots.map(record => {
    assert.equal(record.kind, 'shoot'); assert.equal(record.version, 1);
    const actual = capture(record);
    const differences: { field: string; expected: unknown; actual: unknown }[] = [];
    const check = (field: string, observed: unknown, expected: unknown) => { if (!isDeepStrictEqual(observed, expected)) differences.push({ field, expected, actual: observed }); };
    check('fired', actual.fired, true); check('stats', actual.stats, record.stats);
    let hitSoFar = false;
    check('pellets', actual.pellets, record.pellets!.map(({ x, y, targets }) => {
      hitSoFar ||= targets.some(target => target.shapeHit && !target.shadowExcluded);
      return { x, y, ...(!hitSoFar && y > 150 ? { groundImpact: true } : {}) };
    }));
    check('points', actual.points, record.pellets!.map(({ index, x, y, drawCount }) => ({ index, x, y, drawCount })));
    check('damageEvents', actual.damageEvents, record.damageEvents);
    check('draws', actual.draws, record.draws); check('drawCount', actual.drawCount, record.drawCount); check('rngState', actual.rngState, record.rngState);
    check('weapon', actual.weapon, record.after!.weapon);
    for (const field of Object.keys(actual.player) as (keyof typeof actual.player)[]) check(`player.${field}`, actual.player[field], record.after!.player[field]);
    for (const field of Object.keys(actual.enemy) as (keyof typeof actual.enemy)[]) {
      if (field === 'boss') for (const key of ['action', 'count', 'weapon', 'hpMax', 'damage'] as const) check(`enemy.boss.${key}`, actual.enemy.boss?.[key], record.after!.enemy.boss[key]);
      else check(`enemy.${field}`, actual.enemy[field], record.after!.enemy[field]);
    }
    return { scenario: record.scenario!, seed: record.seed!, matched: differences.length === 0, originalDrawCount: record.drawCount!, portDrawCount: actual.drawCount, differences };
  });
  return { status: comparisons.every(row => row.matched) ? 'passed' as const : 'failed' as const, matchedSnapshots: comparisons.filter(row => row.matched).length, comparisons };
}
