import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { Simulation, type EnemyState, type SimulationEvent } from '../src/simulation.ts';
import { ENEMIES, type EnemyKind } from '../src/content.ts';
import type { Item } from '../src/items.ts';
import { advanceProjectile, createProjectile, type ExplosionKind, type ProjectileState } from '../src/projectiles.ts';

type Actor = Record<string, number | string | boolean | null>;
interface OriginalPlayer {
  selectedSlot: number; shootTimer: number; accuracyFix: number; shooting: boolean; bowDrawing: boolean;
  rampage: number; level: number; exp: number; skillPoints: number; traits: Record<number, number>;
  potentialAim: number; potentialTeam: number; weaponExp: number[]; kills: number;
  criticalKills: number; loot: number[]; castleHp: number;
}
interface OriginalEnemy {
  id: number; x: number; y: number; hp: number; attack: number; speed: number; speedOrg: number;
  gold: number; exp: number; knockBack: number; attacking: boolean; attacked: boolean;
  drop: number; deathTicks: number; frame: number; alive: boolean; free: boolean; shadowHit: boolean;
}
interface World { player: OriginalPlayer; weapons: { slot: number; item: Record<string, unknown> }[]; enemies: { slot: number; state: OriginalEnemy }[] }
interface RandomDraw { index: number; state: number; value: number }
interface Target { slot: number; shapeHit: boolean; shadowExcluded: boolean; alive: boolean }
interface Callback {
  actor: number; step: number; kind: 'hit' | ExplosionKind; x: number; y: number; damage: number;
  weaponSlot: number | null; drawBefore: number; drawAfter: number; result?: boolean; targets?: Target[];
}
interface DamageEvent { actor: number; step: number; enemyId: number; damage: number; critType: number; hpBefore: number; x: number; y: number; drawCount: number }
interface Config { name: string; id: number; aimX: number; aimY: number; switchAt?: number; direct?: string }
export interface ProjectileRecord {
  type: string; version: number; kind: string; rng?: string; clock?: string; seed?: number;
  cases?: number; snapshots?: number; ok?: boolean; scenario?: string; config?: Config;
  before?: World; drawn?: World | null; launched?: { world: World; actors: Actor[]; nativeInit: boolean[]; drawCount: number };
  steps?: { step: number; actors: Actor[]; drawCount: number }[];
  callbacks?: Callback[]; damageEvents?: DamageEvent[]; after?: World;
  draws?: RandomDraw[]; drawCount?: number; rngState?: number; exhausted?: boolean; verticalDiagnostic?: boolean;
  birthFrame?: number; events?: { event: string; frame: number; actor: Actor }[];
}
interface Boundary {
  random(): number; spawnEnemy(kind: EnemyKind): void;
  processPellet(x: number, y: number, damage: number, slot: number): boolean;
  explodeProjectile(x: number, y: number, damage: number, slot: number | null, kind: ExplosionKind): void;
}
const ITEM_FIELDS: (keyof Item)[] = ['num', 'id', 'graphic', 'type', 'reloadTime', 'reloadTimeMax', 'ammo', 'ammoMax', 'value', 'mod', 'modMax', 'shell', 'manualReload', 'automatic', 'modText', 'lv', 'typeMinor', 'special', 'leech', 'impact', 'shootRate', 'rare', 'autoReload', 'livingWeapon', 'name', 'baseAccuracy', 'accuracyDec', 'attack', 'dmgAir', 'dmgArmor', 'reqTrait', 'reqLv', 'range'];
const GAMEPLAY_FIELDS = ['attached', 'x', 'rootY', 'y', 'startX', 'startY', 'targetX', 'targetY', 'speed', 'damage', 'weaponSlot', 'curve', 'count', 'acceleration', 'direction', 'penetrations'];
const VISUAL_FIELDS = ['rotation', 'rotationStep', 'scale', 'scaleY', 'alpha', 'shadowY', 'shadowAlpha', 'shadowVisible'];
const NAMES = ['hand_grenade', 'launcher_grenade', 'rocket', 'crossbow', 'bow', 'wind_bow', 'repeating_crossbow', 'crossbow_fade', 'gravity', 'flame', 'bow_sky', 'crossbow_overlap_corpse', 'switch_in_flight', 'arrow_penetration', 'vertical_grenade', 'vertical_rocket'];
export interface ProjectileDifference { field: string; expected: unknown; actual: unknown }

function projectActor(actor: ProjectileState): Actor {
  const arrow = actor.kind === 'arrow' || actor.kind === 'bolt';
  const shadow = actor.kind !== 'gravity' && actor.kind !== 'flame';
  return {
    attached: !actor.removed, x: actor.x, rootY: 0, y: actor.y,
    startX: actor.startX, startY: actor.startY, targetX: actor.targetX, targetY: actor.targetY,
    speed: actor.speed, damage: actor.damage, weaponSlot: actor.weaponSlot, curve: actor.curve,
    count: actor.kind === 'rocket' ? null : actor.count,
    acceleration: actor.kind === 'rocket' ? actor.acceleration : null,
    direction: actor.kind === 'rocket' ? actor.direction : null,
    penetrations: arrow ? actor.penetrations : null,
    rotation: actor.rotation, rotationStep: arrow ? actor.rotationStep : null,
    scale: actor.scale, scaleY: actor.scale, alpha: actor.alpha,
    shadowY: shadow ? actor.shadowY : null, shadowAlpha: shadow ? actor.shadowAlpha : null, shadowVisible: shadow ? actor.shadowVisible : null,
  };
}

function compareCase(record: ProjectileRecord) {
  assert.ok(record.config && record.before && record.after && record.launched && record.steps && record.callbacks && record.draws);
  const before = record.before, config = record.config;
  let currentActor = -1, step = 0, activeHit: Callback | undefined;
  const callbacks: Callback[] = [], damageEvents: DamageEvent[] = [], draws: RandomDraw[] = [];
  const uidToSlot = new Map<number, number>();
  const simulation = new Simulation(42, { hitTest: (enemy) => {
    const target = activeHit?.targets?.find(row => row.slot === uidToSlot.get(enemy.uid));
    return Boolean(target?.shapeHit && !target.shadowExcluded);
  } });
  const state = simulation.state, boundary = simulation as unknown as Boundary;
  state.enemies = []; state.projectiles = [];
  for (const row of before.enemies) {
    const source = row.state;
    const kind = (Object.keys(ENEMIES) as EnemyKind[]).find(name => ENEMIES[name].id === source.id);
    assert.ok(kind);
    boundary.spawnEnemy(kind);
    const enemy = state.enemies.at(-1)!;
    uidToSlot.set(enemy.uid, row.slot);
    Object.assign(enemy, {
      x: source.x, y: source.y, hp: source.hp, maxHp: Math.max(source.hp, ENEMIES[kind].hp),
      attack: source.attack, speed: source.speed, speedOrg: source.speedOrg, gold: source.gold, exp: source.exp,
      knockBack: source.knockBack, attacking: source.attacking, attacked: source.attacked, drop: source.drop,
      deathTicks: source.deathTicks, frame: source.frame, removed: source.free, shadowHit: source.shadowHit,
    });
  }
  for (const { slot, item } of before.weapons) state.inventory[slot] = Object.fromEntries(Object.entries(item).filter(([, value]) => value !== null)) as unknown as Item;
  Object.assign(state.player, {
    selectedSlot: before.player.selectedSlot, shootTimer: before.player.shootTimer, accuracyFix: before.player.accuracyFix,
    bowDrawing: before.player.bowDrawing, rampageTicks: before.player.rampage,
    level: before.player.level, exp: before.player.exp, skillPoints: before.player.skillPoints,
    traits: structuredClone(before.player.traits), weaponExp: [...before.player.weaponExp],
  });
  state.hero.potentialAim = before.player.potentialAim; state.hero.potentialTeam = before.player.potentialTeam;
  state.kills = before.player.kills; state.criticalKills = before.player.criticalKills; state.loot = [...before.player.loot];
  state.castleHp = before.player.castleHp; state.waveIndex = 4; state.waves[4].initialCount = 10;
  state.newWave = false; state.spawnTimer = 100000; state.rng = record.seed!;
  state.aimX = config.aimX; state.aimY = config.aimY; state.pendingShot = before.player.shooting;
  const random = boundary.random.bind(simulation);
  boundary.random = () => { const value = random(); draws.push({ index: draws.length + 1, state: state.rng, value }); return value; };
  simulation.events = [];
  const push = simulation.events.push.bind(simulation.events);
  simulation.events.push = (...events: SimulationEvent[]) => {
    for (const event of events) if (event.type === 'hit') {
      const enemy = state.enemies.find(row => row.uid === event.enemyUid)!;
      damageEvents.push({ actor: currentActor, step, enemyId: ENEMIES[enemy.kind].id, damage: event.amount!, critType: event.criticalType ?? Number(event.critical), hpBefore: enemy.hp + event.amount!, x: event.x!, y: event.y!, drawCount: draws.length });
    }
    return push(...events);
  };
  const differences: ProjectileDifference[] = [], visualDifferences: ProjectileDifference[] = [];
  const check = (field: string, actual: unknown, expected: unknown, visual = false) => {
    let equal = isDeepStrictEqual(actual, expected);
    if (typeof actual === 'number' && typeof expected === 'number') {
      const delta = field.endsWith('.rotation') ? Math.abs(((actual - expected + 540) % 360 + 360) % 360 - 180) : Math.abs(actual - expected);
      equal = delta <= (visual ? 1e-7 : 1e-9);
    }
    if (!equal && (visual ? visualDifferences : differences).length < 100) (visual ? visualDifferences : differences).push({ field, expected, actual });
  };
  const compareWorld = (label: string, expected: World) => {
    const player = state.player;
    const actualPlayer = {
      selectedSlot: player.selectedSlot, shootTimer: player.shootTimer, accuracyFix: player.accuracyFix,
      bowDrawing: player.bowDrawing, rampage: player.rampageTicks, level: player.level, exp: player.exp,
      skillPoints: player.skillPoints, traits: player.traits, potentialAim: state.hero.potentialAim,
      potentialTeam: state.hero.potentialTeam, weaponExp: player.weaponExp, kills: state.kills,
      criticalKills: state.criticalKills, loot: state.loot, castleHp: state.castleHp,
    };
    for (const field of Object.keys(actualPlayer) as (keyof typeof actualPlayer)[]) check(`${label}.player.${field}`, actualPlayer[field], expected.player[field]);
    for (const { slot, item } of expected.weapons) for (const field of ITEM_FIELDS) check(`${label}.inventory[${slot}].${field}`, state.inventory[slot]?.[field] ?? null, item[field]);
    for (const { slot, state: enemyExpected } of expected.enemies) {
      const enemy = state.enemies.find(row => uidToSlot.get(row.uid) === slot)!;
      for (const field of ['x', 'y', 'hp', 'attack', 'speed', 'speedOrg', 'gold', 'exp', 'knockBack', 'attacking', 'attacked', 'drop', 'deathTicks', 'frame', 'shadowHit'] as const) check(`${label}.enemy[${slot}].${field}`, enemy[field], enemyExpected[field]);
      check(`${label}.enemy[${slot}].alive`, enemy.hp > 0, enemyExpected.alive);
      check(`${label}.enemy[${slot}].free`, enemy.removed, enemyExpected.free);
    }
  };
  compareWorld('before', before);
  if (config.id === 11) assert.equal(simulation.useSlot(0), true);
  else {
    assert.equal(simulation.fireAt(config.aimX, config.aimY), true);
    if (record.drawn) { compareWorld('drawn', record.drawn); assert.equal(state.projectiles.length, 0); assert.equal(simulation.fireAt(config.aimX, config.aimY), true); }
  }
  const actors = [...state.projectiles];
  const compareActors = (label: string, expected: Actor[]) => {
    check(`${label}.length`, actors.length, expected.length);
    actors.forEach((actor, index) => {
      const actual = projectActor(actor), reference = expected[index];
      if (!reference) return;
      for (const field of GAMEPLAY_FIELDS) check(`${label}[${index}].${field}`, actual[field], reference[field]);
      for (const field of VISUAL_FIELDS) check(`${label}[${index}].${field}`, actual[field], reference[field], true);
    });
  };
  compareWorld('launched', record.launched.world); compareActors('launched.actors', record.launched.actors);
  check('launched.drawCount', draws.length, record.launched.drawCount);
  for (const originalStep of record.steps) {
    step = originalStep.step;
    actors.forEach((actor, index) => {
      currentActor = index;
      advanceProjectile(actor, {
        hit: (x, y, damage, weaponSlot) => {
          activeHit = record.callbacks![callbacks.length];
          const callback: Callback = { actor: index, step, kind: 'hit', x, y, damage, weaponSlot, drawBefore: draws.length, drawAfter: 0 };
          callback.result = boundary.processPellet(x, y, damage, weaponSlot);
          callback.drawAfter = draws.length; callbacks.push(callback); activeHit = undefined;
          return callback.result;
        },
        explode: (x, y, damage, weaponSlot, kind) => {
          const callback: Callback = { actor: index, step, kind, x, y, damage, weaponSlot, drawBefore: draws.length, drawAfter: 0 };
          boundary.explodeProjectile(x, y, damage, weaponSlot, kind);
          callback.drawAfter = draws.length; callbacks.push(callback);
        },
      });
    });
    if (config.switchAt === step) assert.equal(simulation.useSlot(2), true);
    compareActors(`step${step}.actors`, originalStep.actors); check(`step${step}.drawCount`, draws.length, originalStep.drawCount);
  }
  compareWorld('after', record.after);
  check('exhausted', actors.every(actor => actor.removed), record.exhausted);
  check('callbacks', callbacks, record.callbacks.map(({ targets: _targets, ...callback }) => callback));
  check('damageEvents', damageEvents, record.damageEvents);
  check('draws', draws, record.draws); check('drawCount', draws.length, record.drawCount); check('rngState', state.rng, record.rngState);
  return { scenario: record.scenario!, matched: differences.length === 0 && visualDifferences.length === 0, steps: record.steps.length, originalDrawCount: record.drawCount!, portDrawCount: draws.length, differences, visualDifferences };
}

export function compareProjectileTrace(records: ProjectileRecord[]) {
  const ready = records[0], complete = records.at(-1);
  assert.equal(ready.type, 'ready'); assert.equal(ready.kind, 'projectiles'); assert.equal(ready.version, 1);
  assert.equal(ready.rng, 'xorshift32'); assert.equal(ready.seed, 42); assert.equal(ready.cases, 16);
  assert.equal(ready.clock, 'native-birth-probe-then-manual-original-projectile-callbacks');
  assert.equal(complete?.type, 'complete'); assert.equal(complete?.ok, true); assert.equal(complete?.snapshots, 17);
  const snapshots = records.filter(row => row.type === 'snapshot');
  assert.deepEqual(snapshots.map(row => row.scenario), ['native_birth', ...NAMES]);
  const birth = snapshots[0];
  const firstAdvance = birth.events!.find(row => row.event === 'advance')!;
  assert.equal(birth.birthFrame, 1); assert.equal(firstAdvance.frame, 2);
  const vertical = snapshots.filter(row => row.verticalDiagnostic);
  for (const row of vertical) {
    assert.equal(row.steps![0].actors[0].calculatedYNaN, true);
    assert.equal(row.steps![0].actors[0].y, 0);
    const actor = createProjectile({ uid: 1, kind: row.config!.direct as 'grenade' | 'rocket', weaponSlot: 0, damage: 50, startX: 510, startY: 245, targetX: 510, targetY: 180, speedBase: row.config!.direct === 'rocket' ? 10 : 12 });
    const explosions: { x: number; y: number }[] = [];
    for (let frame = 0; frame < 500 && !actor.removed; frame++) {
      advanceProjectile(actor, { hit: () => false, explode: (x, y) => { explosions.push({ x, y }); } });
      assert.ok([actor.x, actor.y, actor.speed, actor.shadowY].every(Number.isFinite), 'Intentional vertical-trajectory correction must remain finite.');
      assert.equal(actor.x, 510, 'A vertical launch must retain its requested horizontal position.');
    }
    assert.equal(actor.removed, true, 'A vertical explosive must finish within the bounded flight.');
    assert.deepEqual(explosions, [{ x: 510, y: 180 }], 'The correction must deliver one explosion at the requested target, not merely finite coordinates.');
  }
  const comparisons = snapshots.filter(row => row.scenario !== 'native_birth' && !row.verticalDiagnostic).map(compareCase);
  return {
    status: comparisons.every(row => row.matched) ? 'passed' as const : 'failed' as const,
    observedSnapshots: snapshots.length, comparedSnapshots: comparisons.length,
    matchedSnapshots: comparisons.filter(row => row.matched).length,
    nativeFirstAdvanceFrame: firstAdvance.frame, verticalFixChecks: vertical.length, comparisons,
  };
}
