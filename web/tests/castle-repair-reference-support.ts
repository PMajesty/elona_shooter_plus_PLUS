import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { Simulation } from '../src/simulation.ts';
import { castleUpgradeCost, castleUpkeep, type CastleUpgradeKind, type CastleUpgradeOutcome } from '../src/castle-upgrades.ts';

type Row = Record<string, any>;
type Methods = { random(): number; timerTick(): void; finishDay(): void };
export interface RepairReferenceActions {
  purchase?: (simulation: Simulation, kind: CastleUpgradeKind) => CastleUpgradeOutcome;
  timer?: (simulation: Simulation, originalStep: () => void) => void;
}
const timerScenarios = ['opening-restore', 'ordinary-partial', 'ordinary-clamp', 'no-repairman', 'already-failed',
  'between-transitions', 'terminal-damaged', 'terminal-full', 'lethal-gate'];
const townScenarios = ['fix-insufficient', 'fix-exact', 'fix-repeat-full', 'fix-upgraded-counter',
  'repairman-insufficient', 'repairman-first', 'repairman-second', 'repairman-sequence'];

function town(input: Row): Simulation {
  const simulation = new Simulation(42);
  (simulation as unknown as Methods).finishDay();
  while (simulation.state.postbattle !== 'result') {
    if (simulation.state.postbattle === 'skill') simulation.chooseSkill(simulation.state.skillChoices[0]);
    else simulation.finishLoot();
  }
  assert.equal(simulation.enterTown(), true);
  Object.assign(simulation.state, { day: 7, castleHp: input.hp, castleMaxHp: input.maxHp,
    wallFixCount: input.wallFixCount, repairmanLevel: input.repairmanLevel, gold: input.gold,
    totalMoney: input.totalMoney, noDamage: input.noDamage, rng: input.rngState });
  simulation.state.town!.ap = input.ap;
  return simulation;
}

function observeTown(simulation: Simulation, drawCount: number) {
  const state = simulation.state;
  const tile = (kind: 'fix-wall' | 'repairman') => {
    const cost = castleUpgradeCost(kind, state), possible = cost !== 0 && cost <= state.gold;
    const name = kind === 'fix-wall' ? 'Fix Wall' : `Repairman${state.repairmanLevel ? ` Lv ${state.repairmanLevel}` : ''}`;
    return { cost, possible, name, priceText: String(cost), mouseEnabled: possible };
  };
  return { wallFixCount: state.wallFixCount, repairmanLevel: state.repairmanLevel,
    hp: state.castleHp, maxHp: state.castleMaxHp, gold: state.gold, ap: state.town!.ap, totalMoney: state.totalMoney,
    noDamage: state.noDamage, upkeep: castleUpkeep(state), upkeepText: String(castleUpkeep(state)),
    fixWall: tile('fix-wall'), repairman: tile('repairman'), drawCount, rngState: state.rng,
    dialog: state.pendingTownAction !== null || state.pendingPartyAction !== null, eventDialog: false };
}

export function compareCastleRepairTrace(records: Row[], actions: RepairReferenceActions = {}) {
  const ready = records[0], complete = records.at(-1);
  assert.equal(ready.version, 1); assert.equal(ready.type, 'ready'); assert.equal(ready.kind, 'castle-repair');
  assert.equal(ready.clock, 'synchronous-original-town-input-and-wave-timer'); assert.equal(ready.rng, 'xorshift32');
  assert.equal(ready.timerMethod, 'onTick'); assert.equal(ready.terminalBoundary, 'exitBattle2-entry');
  assert.equal(ready.fireworksDisabled, true); assert.equal(ready.actorsDisabled, true); assert.equal(ready.continuedTownEntry, true);
  assert.equal(complete?.type, 'complete'); assert.equal(complete.kind, 'castle-repair'); assert.equal(complete.ok, true);
  assert.equal(complete.snapshots, 37); assert.equal(complete.timerCases, 9); assert.equal(complete.townCases, 8);
  const snapshots = records.filter(row => row.type === 'snapshot'); assert.equal(snapshots.length, 37);
  assert.deepEqual([...new Set(snapshots.map(row => row.scenario))], [...timerScenarios, ...townScenarios]);
  const comparisons: { scenario: string; boundary: string; op: string; step: number; matched: boolean; differences: { field: string; actual: unknown; expected: unknown }[] }[] = [];
  for (const scenario of [...timerScenarios, ...townScenarios]) {
    const rows = snapshots.filter(row => row.scenario === scenario), before = rows[0];
    assert.equal(before.op, 'before'); assert.equal(before.drawCount, 0); assert.equal(before.rngState, 42);
    const isTimer = before.boundary === 'timer';
    const simulation = isTimer ? new Simulation(42) : town(before);
    const state = simulation.state, methods = simulation as unknown as Methods;
    if (isTimer) Object.assign(state, { castleHp: before.hp, castleMaxHp: before.maxHp,
      repairmanLevel: before.repairmanLevel, waveIndex: before.wave, newWave: before.newWave,
      spawnTimer: before.time, noDamage: before.noDamage, rng: before.rngState });
    const invariant = structuredClone({ town: state.town, slots: state.party.slots, result: state.result,
      cache: state.partySkills, activeMission: state.activeMission, wallLevel: state.wallLevel, capacity: state.party.capacity });
    const random = methods.random.bind(simulation); let draws = 0, exitReached = false;
    methods.random = () => { draws++; return random(); };
    // Терминальная запись остановлена до exitBattle2; порт остановлен у соответствующего входа в finishDay.
    methods.finishDay = () => { exitReached = true; throw new Error('REPAIR_EXIT_BOUNDARY'); };
    for (const [step, row] of rows.entries()) {
      let outcome: CastleUpgradeOutcome | undefined, expectedOutcome: CastleUpgradeOutcome | undefined;
      if (step > 0 && isTimer) {
        assert.equal(row.op, 'timer');
        try { (actions.timer ?? ((_simulation, originalStep) => originalStep()))(simulation, () => methods.timerTick()); }
        catch (error) { if (!(error instanceof Error) || error.message !== 'REPAIR_EXIT_BOUNDARY') throw error; }
      } else if (step > 0) {
        assert.equal(row.op, 'click'); assert.ok(row.target === 'fix-wall' || row.target === 'repairman');
        const previous = rows[step - 1], tile = row.target === 'fix-wall' ? 'fixWall' : 'repairman';
        expectedOutcome = row.gold !== previous.gold ? 'purchased' : previous[tile].cost === 0 ? 'capped' : 'not-enough-gold';
        outcome = (actions.purchase ?? ((value, kind) => value.buyCastleUpgrade(kind)))(simulation, row.target);
      }
      const actual: Row = isTimer ? { repairmanLevel: state.repairmanLevel, hp: state.castleHp, maxHp: state.castleMaxHp,
        wave: state.waveIndex, newWave: state.newWave, time: state.spawnTimer, noDamage: state.noDamage,
        gameOver: state.phase === 'defeat', exitReached, drawCount: draws, rngState: state.rng }
        : { ...observeTown(simulation, draws), outcome };
      const expected: Row = { ...row, outcome: expectedOutcome };
      if (!isTimer) for (const tile of ['fixWall', 'repairman']) {
        const { hint: _hint, ...stateFields } = row[tile]; expected[tile] = stateFields;
      }
      const differences = Object.entries(actual).filter(([field, value]) => !isDeepStrictEqual(value, expected[field]))
        .map(([field, value]) => ({ field, actual: value, expected: expected[field] }));
      if (!isTimer) {
        const afterInvariant = { town: state.town, slots: state.party.slots, result: state.result,
          cache: state.partySkills, activeMission: state.activeMission, wallLevel: state.wallLevel, capacity: state.party.capacity };
        if (!isDeepStrictEqual(invariant, afterInvariant)) differences.push({ field: 'unrelatedState', actual: afterInvariant, expected: invariant });
      }
      comparisons.push({ scenario, boundary: row.boundary, op: row.op, step, matched: differences.length === 0, differences });
    }
  }
  return { status: comparisons.every(row => row.matched) ? 'passed' as const : 'failed' as const,
    observedSnapshots: snapshots.length, inputSnapshots: 17, timerOutcomes: 9, transactionOutcomes: 11,
    matchedSnapshots: comparisons.filter(row => row.matched).length, comparisons };
}
