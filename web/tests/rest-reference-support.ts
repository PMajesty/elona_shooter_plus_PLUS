import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { ENEMIES } from '../src/content.ts';
import { Simulation } from '../src/simulation.ts';
import { createSheriffTraits, TRAIT } from '../src/progression.ts';
import { prepareFirstTown, type FirstTownMission } from '../src/town-preparation.ts';
import { inputSlot, rawSlot } from './town-preparation-reference-support.ts';

interface RestRecord {
  version: number; type: string; kind: string; clock?: string; rng?: string; seeds?: number[];
  seed?: number; op?: string; day?: number; hp?: number; maxHp?: number; gold?: number; ap?: number;
  selectedSlot?: number; inventory?: Record<string, unknown>[]; mission?: Record<string, unknown>;
  player?: Record<string, number | boolean>; resultBefore?: number; resultTaken?: number;
  waves?: unknown[]; drawCount?: number; rngState?: number; snapshots?: number; cases?: number; ok?: boolean;
}

function captureTransition(before: RestRecord) {
  const sim = new Simulation(42);
  const state = sim.state;
  const internal = sim as unknown as { random(): number };
  const random = internal.random.bind(sim);
  // Только входные данные границы берутся из исходного наблюдения; сбросы выполняет startNextDay.
  state.phase = 'town'; state.postbattle = 'result'; state.day = 1;
  state.castleHp = before.hp!; state.castleMaxHp = before.maxHp!; state.gold = before.gold!;
  state.inventory = before.inventory!.map(inputSlot);
  state.town = { ...prepareFirstTown(random), ap: before.ap!, preparation: 'ready', mission: structuredClone(before.mission) as unknown as FirstTownMission };
  state.earnedMedals = before.mission!.absorbFix === 0.01 ? [40, 60] : [40];
  state.resultBefore = before.resultBefore!;
  Object.assign(state.player, {
    level: before.player!.level, exp: before.player!.exp, selectedSlot: before.selectedSlot! - 20,
    shootTimer: before.player!.shootTimer, accuracyFix: before.player!.accuracyFix, rampageTicks: before.player!.rampage,
    traits: { ...createSheriffTraits(4, 5), [TRAIT.SHERIFF]: before.player!.level },
  });
  state.pendingShot = state.fireHeld = Boolean(before.player!.shooting);
  state.rng = before.seed!;
  let drawCount = 0;
  internal.random = () => { drawCount++; return random(); };
  assert.equal(sim.startNextDay(), true, 'Production Rest rejected a valid prepared town.');
  assert.equal(state.phase, 'battle'); assert.equal(state.town, null);
  assert.equal(sim.startNextDay(), false, 'Rest must not consume the prepared mission twice.');
  return {
    day: state.day, hp: state.castleHp, maxHp: state.castleMaxHp, gold: state.gold, ap: state.previousTown!.ap,
    selectedSlot: state.player.selectedSlot + 20,
    inventory: state.inventory.map(item => item === null ? null : rawSlot(item)),
    player: { level: state.player.level, exp: state.player.exp, shootTimer: state.player.shootTimer, accuracyFix: state.player.accuracyFix, rampage: state.player.rampageTicks, shooting: state.pendingShot },
    mission: { ...state.activeMission, wave: state.waveIndex, bossWave: state.bossWave, group: state.waves.map(wave => wave.initialCount), loot: state.loot, newWave: state.newWave, time: state.spawnTimer, bossKilled: state.bossKilled, noDamage: state.noDamage, criticalCount: state.criticalKills },
    resultBefore: state.resultBefore,
    waves: state.waves.map((wave, index) => ({ index, enemies: wave.enemies.map(kind => ENEMIES[kind].id), delays: wave.delays, initialCount: wave.initialCount })),
    drawCount, rngState: state.rng,
  };
}

export function compareRestTrace(records: RestRecord[]) {
  const ready = records[0], complete = records.at(-1);
  assert.equal(ready?.version, 1); assert.equal(ready.type, 'ready'); assert.equal(ready.kind, 'rest');
  assert.equal(ready.clock, 'original-rest-with-explicit-begin-frame'); assert.equal(ready.rng, 'xorshift32');
  assert.deepEqual(ready.seeds, [42, 1, 3735928559]);
  assert.equal(complete?.type, 'complete'); assert.equal(complete.kind, 'rest'); assert.equal(complete.ok, true);
  assert.equal(complete.snapshots, 12); assert.equal(complete.cases, 3); assert.equal(records.length, 14);
  const snapshots = records.filter(record => record.type === 'snapshot');
  assert.deepEqual(snapshots.map(row => [row.seed, row.op]), ready.seeds!.flatMap(seed => ['before', 'dialog', 'after-ack', 'battle-ready'].map(op => [seed, op])));
  const comparisons = ready.seeds!.map(seed => {
    const before = snapshots.find(row => row.seed === seed && row.op === 'before')!;
    const expected = snapshots.find(row => row.seed === seed && row.op === 'battle-ready')!;
    const actual = captureTransition(before);
    const differences: { field: string; expected: unknown; actual: unknown }[] = [];
    for (const [field, value] of Object.entries(actual)) {
      let reference: unknown = expected[field as keyof RestRecord];
      if (field === 'player' || field === 'mission') reference = Object.fromEntries(Object.keys(value as object).map(key => [key, (reference as Record<string, unknown>)[key]]));
      // Совершенно неинициализированные слоты не имеют Item; их reloadTime=0 всегда
      // перезаписывается generateStuff и не является историей ранее существовавшей вещи.
      if (field === 'inventory') reference = expected.inventory!.map(item => item.id === null ? null : item);
      if (!isDeepStrictEqual(value, reference)) differences.push({ field, expected: reference, actual: value });
    }
    return { seed, matched: differences.length === 0, originalDrawCount: expected.drawCount!, portDrawCount: actual.drawCount, differences };
  });
  return { status: comparisons.every(row => row.matched) ? 'passed' as const : 'failed' as const, sourceSnapshots: 12, matchedTransitions: comparisons.filter(row => row.matched).length, comparisons };
}
