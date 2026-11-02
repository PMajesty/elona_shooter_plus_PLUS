import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { Simulation } from '../src/simulation.ts';
import { calcTrait, createSheriffTraits, TRAIT } from '../src/progression.ts';

interface CastleConfig {
  name: string; seed: number; hp: number; damage: number; defender?: number; insurance?: number;
  lastHope?: number; rampage?: number; protection?: number; blue?: number; frames?: number; absorbFix?: number;
}
interface CastleState {
  castleHp: number; castleMaxHp: number; money: number; totalMoney: number;
  protection: { counter: number; blueMultiplierAdd: number }; rampage: number;
  defender: number; insurance: number; lastHope: number; fury: number;
  sandbag: number; absorbFix: number; immune: boolean;
}
interface RandomDraw { index: number; state: number; value: number }
export interface CastleRecord {
  type: string; version: number; kind: string; rng?: string; clock?: string; attacker?: string;
  sandbag?: number; maxAlly?: number; hero?: number; scenarios?: number; snapshots?: number; ok?: boolean;
  scenario?: string; config?: CastleConfig; before?: CastleState; afterFrames?: CastleState; after?: CastleState;
  defendEvents?: number; draws?: RandomDraw[]; drawCount?: number; rngState?: number;
}
const SCENARIOS = ['unskilled_full', 'unskilled_low', 'defender_blocks', 'defender_fails', 'insurance', 'insurance_before_block', 'last_hope_full', 'last_hope_low', 'last_hope_empty_ally', 'last_hope_gate_fails', 'last_hope_already_active', 'combined', 'protection_blocks_before_skills', 'protection_expires', 'protection_fade_finishes', 'absorb_truncation', 'absorb_minimum'];

export function compareCastleTrace(records: CastleRecord[]) {
  const ready = records[0], complete = records.at(-1);
  assert.equal(ready.type, 'ready'); assert.equal(ready.kind, 'castle'); assert.equal(ready.version, 1);
  assert.equal(ready.rng, 'xorshift32'); assert.equal(ready.clock, 'manual-original-frame-before-damageCastle');
  assert.equal(ready.attacker, 'undefined-solo-no-guardian'); assert.equal(ready.sandbag, 0);
  assert.equal(ready.maxAlly, 5); assert.equal(ready.hero, 0); assert.equal(ready.scenarios, SCENARIOS.length);
  assert.equal(complete?.type, 'complete'); assert.equal(complete?.kind, 'castle'); assert.equal(complete?.ok, true);
  assert.equal(complete.snapshots, SCENARIOS.length);
  const snapshots = records.filter(record => record.type === 'snapshot');
  assert.deepEqual(snapshots.map(row => row.scenario), SCENARIOS);
  const comparisons = snapshots.map(record => {
    assert.ok(record.config && record.before && record.afterFrames && record.after && record.draws);
    const config = record.config, simulation = new Simulation(42), state = simulation.state;
    state.player.traits = {
      ...createSheriffTraits(1, 1), [TRAIT.DEFENDER]: config.defender ?? 0,
      [TRAIT.INSURANCE]: config.insurance ?? 0, [TRAIT.LAST_HOPE]: config.lastHope ?? 0,
    };
    state.player.rampageTicks = config.rampage ?? 0;
    state.castleHp = config.hp; state.castleMaxHp = 40; state.gold = 100; state.totalMoney = 500;
    state.protection = { counter: config.protection ?? 0, blueMultiplierAdd: config.blue ?? 0 };
    state.activeMission.absorbFix = config.absorbFix ?? 0;
    state.enemies = []; state.projectiles = []; state.newWave = false; state.spawnTimer = 100000;
    state.waveIndex = 4; state.fireHeld = false; state.pendingShot = false;
    state.rng = config.seed;
    const boundary = simulation as unknown as { random(): number; damageCastle(amount: number): void; refreshPartySkills(): void };
    boundary.refreshPartySkills();
    const random = boundary.random.bind(simulation), draws: RandomDraw[] = [];
    boundary.random = () => {
      const value = random(); draws.push({ index: draws.length + 1, state: state.rng, value }); return value;
    };
    const project = () => ({
      castleHp: state.castleHp, castleMaxHp: state.castleMaxHp, money: state.gold, totalMoney: state.totalMoney,
      protection: { ...state.protection }, rampage: state.player.rampageTicks,
      defender: calcTrait(TRAIT.DEFENDER, state.player.traits[TRAIT.DEFENDER] ?? 0),
      insurance: calcTrait(TRAIT.INSURANCE, state.player.traits[TRAIT.INSURANCE] ?? 0),
      lastHope: calcTrait(TRAIT.LAST_HOPE, state.player.traits[TRAIT.LAST_HOPE] ?? 0),
      fury: calcTrait(TRAIT.FURY, state.player.traits[TRAIT.FURY] ?? 0),
      sandbag: 0, absorbFix: state.activeMission.absorbFix, immune: false,
    });
    const before = project();
    // Обычный tick вызывает тот же production advanceProtection; пустой мир исключает столкновения до заданного удара.
    for (let frame = 0; frame < (config.frames ?? 0); frame++) simulation.tick();
    const afterFrames = project();
    simulation.events = [];
    boundary.damageCastle(config.damage);
    const actual = { before, afterFrames, after: project(), defendEvents: simulation.events.filter(event => event.type === 'defend').length, draws, drawCount: draws.length, rngState: state.rng };
    const differences: { field: string; expected: unknown; actual: unknown }[] = [];
    const check = (field: string, observed: unknown, expected: unknown) => { if (!isDeepStrictEqual(observed, expected)) differences.push({ field, expected, actual: observed }); };
    for (const field of Object.keys(actual) as (keyof typeof actual)[]) check(field, actual[field], record[field]);
    return { scenario: record.scenario!, matched: differences.length === 0, originalDrawCount: record.drawCount!, portDrawCount: draws.length, differences };
  });
  return { status: comparisons.every(row => row.matched) ? 'passed' as const : 'failed' as const, matchedSnapshots: comparisons.filter(row => row.matched).length, comparisons };
}
