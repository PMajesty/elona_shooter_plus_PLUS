import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { Simulation, type EnemyState } from '../src/simulation.ts';
import { ENEMIES, type EnemyKind } from '../src/content.ts';

type Row = Record<string, any>;
interface Boundary { timerTick(): void; spawnEnemy(kind: EnemyKind): void; random(): number }
const fields = ['x', 'y', 'hp', 'attack', 'speed', 'speedOrg', 'gold', 'exp', 'knockBack', 'attacking', 'attacked', 'type', 'drop', 'deathTicks', 'frame'];
const pick = (row: Row, keys: string[]) => Object.fromEntries(keys.map(key => [key, row[key]]));
const kindFor = (id: number) => {
  const kind = (Object.keys(ENEMIES) as EnemyKind[]).find(value => ENEMIES[value].id === id);
  assert.ok(kind, `Original enemy ${id} lacks production content`); return kind;
};
const originalEnemy = (enemy: Row) => ({ id: enemy.id, ...pick(enemy, fields), shadowHit: enemy.shadowHit !== false,
  ...(enemy.id === 999 ? { boss: pick(enemy.boss, ['weapon', 'action', 'count', 'hpMax']) } : {}) });
const portEnemy = (enemy: EnemyState) => ({ id: ENEMIES[enemy.kind].id, ...pick(enemy, fields), shadowHit: enemy.shadowHit,
  ...(enemy.kind === 'boss' ? { boss: { weapon: enemy.bossWeapon, action: enemy.bossAction, count: enemy.bossCount, hpMax: enemy.maxHp } } : {}) });
const scenarios = ['sheep-first-below', 'sheep-first-at-second-break', 'rat-first-below', 'rat-first-at-second-break',
  'rat-second-at-continue', 'mixed-shrinking-even', 'mixed-shrinking-odd', 'final-rat-deferred-empty',
  'chicken-first-break', 'lava-first-break', 'boss-first-break', 'empty-queue'];

export function compareNinthDaySpawnTrace(records: Row[], changeInput?: (simulation: Simulation, row: Row) => void) {
  assert.equal(records[0].type, 'ready'); assert.equal(records[0].kind, 'ninth-day-spawn');
  assert.equal(records[0].clock, 'synchronous-original-onTick'); assert.equal(records[0].actorsDisabled, true);
  assert.equal(records[0].enemyFrameAdvance, false); assert.equal(records[0].missionLevel, 8); assert.equal(records[0].day, 9);
  const snapshots = records.filter(row => row.type === 'snapshot');
  assert.deepEqual(snapshots.map(row => row.scenario), scenarios);
  assert.equal(records.at(-1)?.type, 'complete'); assert.equal(records.at(-1)?.snapshots, 12); assert.equal(records.at(-1)?.ok, true);
  const comparisons = snapshots.map(row => {
    const simulation = new Simulation(42), state = simulation.state, boundary = simulation as unknown as Boundary;
    const before = row.before;
    Object.assign(state, { day: 9, enemies: [], newWave: before.newWave, spawnTimer: before.time, waveIndex: before.wave,
      castleHp: before.hp, noDamage: before.noDamage, bossesSpawned: before.bossCounter, rng: 42 });
    state.activeMission.level = 8; state.activeMission.fixedLv = 8;
    for (const slot of state.party.slots) slot.exists = false;
    state.partySkills.effects[112] = 0;
    state.waves[4] = { enemies: before.queue.map(kindFor), delays: [...before.delays], initialCount: before.queue.length };
    let tick = 0, drawCount = 0;
    const draws: Row[] = [], spawnEvents: Row[] = [], steps: Row[] = [];
    boundary.random = () => {
      let value = state.rng | 0; value ^= value << 13; value ^= value >>> 17; value ^= value << 5; state.rng = value >>> 0;
      const result = drawCount < row.config.prefix.length ? row.config.prefix[drawCount] : state.rng / 4294967296;
      draws.push({ index: ++drawCount, state: state.rng, value: result }); return result;
    };
    const spawn = boundary.spawnEnemy.bind(simulation);
    boundary.spawnEnemy = kind => {
      const slot = state.enemies.length;
      spawn(kind);
      spawnEvents.push({ tick, id: ENEMIES[kind].id, slot, drawCount, rngState: state.rng,
        remaining: state.waves[4].enemies.map(value => ENEMIES[value].id), enemy: portEnemy(state.enemies[slot]) });
    };
    changeInput?.(simulation, row);
    for (tick = 1; tick <= (row.config.ticks ?? 1); tick++) {
      // Вызывается таймер продукта; кадры врагов и ввод героев здесь намеренно не продвигаются.
      boundary.timerTick();
      steps.push({ tick, wave: state.waveIndex, newWave: state.newWave, time: state.spawnTimer,
        queue: state.waves[4].enemies.map(value => ENEMIES[value].id), delays: [...state.waves[4].delays], enemies: state.enemies.map(portEnemy),
        bossCounter: state.bossesSpawned, hp: state.castleHp, noDamage: state.noDamage, drawCount, rngState: state.rng });
    }
    const actual = { steps, spawnEvents, draws, drawCount, rngState: state.rng };
    const expected = { steps: row.steps.map((step: Row) => ({ ...step, enemies: step.enemies.map(originalEnemy) })),
      spawnEvents: row.spawnEvents.map((event: Row) => ({ ...event, enemy: originalEnemy(event.enemy) })),
      draws: row.draws, drawCount: row.drawCount, rngState: row.rngState };
    const differences = Object.entries(actual).filter(([key, value]) => !isDeepStrictEqual(value, expected[key as keyof typeof expected]))
      .map(([field, value]) => ({ field, actual: value, expected: expected[field as keyof typeof expected] }));
    return { scenario: row.scenario, matched: differences.length === 0, originalDrawCount: row.drawCount, portDrawCount: drawCount, differences };
  });
  return { status: comparisons.every(row => row.matched) ? 'passed' as const : 'failed' as const,
    observedSnapshots: snapshots.length, matchedSnapshots: comparisons.filter(row => row.matched).length, comparisons };
}
