import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { ENEMIES, type EnemyKind } from '../src/content.ts';
import { Simulation, type EnemyState } from '../src/simulation.ts';

interface OriginalEnemy {
  id: number; level: number; x: number; y: number; hp: number; attack: number;
  speed: number; speedOrg: number; gold: number; exp: number; crit: number[];
  knockBack: number; attacking: boolean; attacked: boolean; dropping: boolean;
  drop: number; deathTicks: number; frame: number; alive: boolean; free: boolean;
  boss: { weapon: number | null; action: number | null; count: number | null; idle: number | null; fireNum: number | null; hpMax: number | null };
}
interface DamageObservation { enemyId: number; damage: number; critType: number; hpBefore: number; x: number; y: number }
export interface CombatReferenceRecord {
  version: number; type: string; kind?: string; rng?: string; clock?: string; geometry?: string | { shapeHit: boolean; shadowExcluded: boolean };
  displayAdvance?: string; spawnSeeds?: number[]; enemyIds?: number[]; ok?: boolean;
  snapshots?: number; spawnCases?: number; hitCases?: number; scenario?: string; seed?: number;
  enemyId?: number; drawCount?: number; rngState?: number; enemy?: OriginalEnemy;
  point?: { x: number; y: number }; rawDamage?: number; before?: OriginalEnemy; after?: OriginalEnemy;
  hit?: boolean; damageEvents?: DamageObservation[];
  playerDelta?: { exp: number; kills: number; weaponExp: number; rampage: number; earnedGold: number; criticalKills: number; loot: number[] };
}
interface Difference { field: string; expected: unknown; actual: unknown }
interface TestBoundary {
  random(): number; spawnEnemy(kind: EnemyKind): void;
  processPellet(x: number, y: number, damage: number): boolean;
}

function capture(record: CombatReferenceRecord) {
  const kind = (Object.keys(ENEMIES) as EnemyKind[]).find(key => ENEMIES[key].id === record.enemyId);
  assert.ok(kind, `Unsupported original enemy ID ${record.enemyId}`);
  const geometry = typeof record.geometry === 'object' ? record.geometry : undefined;
  const simulation = new Simulation(1, { hitTest: () => Boolean(geometry?.shapeHit && !geometry.shadowExcluded) });
  const boundary = simulation as unknown as TestBoundary;
  const state = simulation.state;
  state.rng = record.seed!; state.loot = []; state.waveIndex = 4;
  state.waves[4].initialCount = 10; state.newWave = false; state.spawnTimer = 100000;
  let draws = 0;
  const originalRandom = boundary.random.bind(simulation);
  // Перехват считает фактические вызовы порта, не подменяя генератор.
  boundary.random = () => { draws++; return originalRandom(); };
  boundary.spawnEnemy(kind);
  const enemy = state.enemies[0];
  assert.ok(enemy);

  const projection = (target: EnemyState) => ({
    id: ENEMIES[target.kind].id, level: target.kind === 'boss' ? 0 : ENEMIES[target.kind].level,
    x: target.x, y: target.y, hp: target.hp, attack: target.attack,
    speed: target.speed, speedOrg: target.speedOrg, gold: target.gold, exp: target.exp,
    crit: [...ENEMIES[target.kind].critical], knockBack: target.knockBack,
    attacking: target.attacking, attacked: target.attacked, drop: target.drop,
    deathTicks: target.deathTicks, frame: target.frame, alive: target.hp > 0, free: target.removed,
    ...(target.kind === 'boss' ? { boss: { weapon: target.bossWeapon, action: target.bossAction, count: target.bossCount, hpMax: target.maxHp } } : {}),
  });
  if (record.scenario === 'spawn') return { coverage: 'spawn' as const, enemy: projection(enemy), drawCount: draws, rngState: state.rng };

  assert.ok(record.before && record.after && record.point && record.damageEvents && record.playerDelta && geometry);
  // Это входные операции эталонного сценария, а не копирование вычисленных HP или наград.
  enemy.x = 200; enemy.y = 220; enemy.frame = record.before.frame;
  const before = projection(enemy);
  state.rng = record.seed!; draws = 0; simulation.events = [];
  assert.equal(typeof boundary.processPellet, 'function', 'The comparison requires the same point processor used by fireAt.');
  // Оригинал задаёт только результат проверки силуэта; критическую область проверяет сам порт.
  const hit = boundary.processPellet(record.point.x, record.point.y, record.rawDamage!);
  let hpBefore = before.hp;
  const damageEvents = simulation.events.filter(event => event.type === 'hit').map(event => {
    const observation = { enemyId: record.enemyId!, damage: event.amount!, critType: event.critical ? 1 : 0, hpBefore, x: event.x!, y: event.y! };
    hpBefore -= event.amount!;
    return observation;
  });
  return {
    coverage: 'single-point-original-geometry-input' as const,
    before, after: projection(enemy), hit, damageEvents, drawCount: draws, rngState: state.rng,
    playerDelta: {
      exp: state.player.exp, kills: state.kills, weaponExp: state.player.weaponExp,
      rampage: state.player.rampageTicks, criticalKills: state.criticalKills, loot: state.loot,
    },
  };
}

export function compareCombatTrace(records: CombatReferenceRecord[]) {
  const ready = records[0];
  assert.equal(ready?.type, 'ready'); assert.equal(ready.version, 1); assert.equal(ready.kind, 'combat');
  assert.equal(ready.rng, 'xorshift32'); assert.equal(ready.clock, 'synchronous-original-methods');
  assert.equal(ready.geometry, 'original-vector-hitTestPoint');
  assert.deepEqual(ready.spawnSeeds, [42, 3735928559]); assert.deepEqual(ready.enemyIds, [3, 17, 19, 6, 999]);
  const completed = records.at(-1);
  assert.equal(completed?.type, 'complete'); assert.equal(completed.kind, 'combat'); assert.equal(completed.ok, true);
  assert.equal(completed.spawnCases, 10); assert.equal(completed.hitCases, 11);
  const snapshots = records.filter(record => record.type === 'snapshot');
  assert.equal(snapshots.length, 21); assert.equal(completed.snapshots, snapshots.length);
  assert.equal(records.length, 23);
  assert.deepEqual(snapshots.slice(0, 10).map(record => [record.scenario, record.seed, record.enemyId]), ready.spawnSeeds.flatMap(seed => ready.enemyIds!.map(id => ['spawn', seed, id])));
  assert.deepEqual(snapshots.slice(10).map(record => record.scenario), [
    'sheep_miss', 'sheep_body', 'sheep_crit_inside', 'sheep_crit_left_boundary', 'sheep_crit_left_inside',
    'sheep_crit_right_boundary', 'sheep_crit_top_boundary', 'sheep_crit_top_inside', 'sheep_crit_bottom_boundary', 'crow_body', 'rat_lethal',
  ]);

  const comparisons = snapshots.map(record => {
    assert.equal(record.version, 1); assert.equal(record.kind, 'combat');
    assert.ok(Number.isInteger(record.drawCount) && record.drawCount! >= 0);
    const actual = capture(record);
    const differences: Difference[] = [];
    const check = (field: string, observed: unknown, expected: unknown) => {
      if (!isDeepStrictEqual(observed, expected)) differences.push({ field, expected, actual: observed });
    };
    const checkEnemy = (field: string, observed: NonNullable<typeof actual.enemy>, expected: OriginalEnemy) => {
      for (const key of Object.keys(observed) as (keyof typeof observed)[]) {
        if (key === 'boss') {
          for (const bossKey of ['weapon', 'action', 'count', 'hpMax'] as const) check(`${field}.boss.${bossKey}`, observed.boss?.[bossKey], expected.boss[bossKey]);
        } else check(`${field}.${key}`, observed[key], expected[key]);
      }
    };
    check('drawCount', actual.drawCount, record.drawCount); check('rngState', actual.rngState, record.rngState);
    if (record.scenario === 'spawn') {
      assert.ok(record.enemy); checkEnemy('enemy', actual.enemy!, record.enemy);
    } else {
      checkEnemy('before', actual.before!, record.before!); checkEnemy('after', actual.after!, record.after!);
      check('hit', actual.hit, record.hit); check('damageEvents', actual.damageEvents, record.damageEvents);
      for (const field of ['exp', 'kills', 'weaponExp', 'rampage', 'criticalKills', 'loot'] as const) check(`playerDelta.${field}`, actual.playerDelta![field], record.playerDelta![field]);
    }
    return {
      scenario: record.scenario!, seed: record.seed!, enemyId: record.enemyId!, coverage: actual.coverage,
      matched: differences.length === 0, originalDrawCount: record.drawCount!, portDrawCount: actual.drawCount,
      originalRngState: record.rngState!, portRngState: actual.rngState, differences,
    };
  });
  const completePointCoverage = comparisons.filter(row => row.scenario !== 'spawn').every(row => row.coverage === 'single-point-original-geometry-input');
  return {
    status: comparisons.every(row => row.matched) && completePointCoverage ? 'passed' as const : 'failed' as const,
    matchedSnapshots: comparisons.filter(row => row.matched).length, completePointCoverage, comparisons,
  };
}
