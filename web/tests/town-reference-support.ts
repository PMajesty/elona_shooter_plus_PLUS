import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { Simulation } from '../src/simulation.ts';

export interface TownReferenceRecord {
  version: number; type: string; kind: string; rng?: string; clock?: string;
  day?: number; classId?: number; frame71?: boolean; seeds?: number[];
  scenario?: string; seed?: number; noDamage?: boolean; goldBefore?: number; initialReward?: number;
  gold?: number; ap?: number; apFix?: number; totalMoney?: number;
  result?: { reward: number; wage: number; upkeep: number; income: number; netReward: number };
  op?: string; step?: number; hp?: number; maxHp?: number; eventDialog?: number;
  dialog?: null | { title: string; text: string; cardFrame: number }; messages?: string[];
  drawCount?: number; rngState?: number; ok?: boolean; snapshots?: number; resultCases?: number; actionCases?: number;
}

interface PrivateSimulation { finishDay(): void; prepareResult(): void; random(): number }

function observeRandom(simulation: Simulation) {
  const methods = simulation as unknown as PrivateSimulation;
  const random = methods.random.bind(simulation);
  let draws = 0;
  methods.random = () => { draws++; return random(); };
  return () => draws;
}

export function compareTownTrace(records: TownReferenceRecord[]) {
  const ready = records[0], complete = records.at(-1);
  assert.equal(ready?.version, 1); assert.equal(ready.type, 'ready'); assert.equal(ready.kind, 'town');
  assert.equal(ready.rng, 'xorshift32'); assert.equal(ready.clock, 'synchronous-original-result-and-free-repair');
  assert.equal(ready.day, 1); assert.equal(ready.classId, 6); assert.equal(ready.frame71, false);
  assert.deepEqual(ready.seeds, [42, 1, 3735928559]);
  assert.equal(complete?.version, 1); assert.equal(complete.type, 'complete'); assert.equal(complete.kind, 'town');
  assert.equal(complete.ok, true); assert.equal(complete.frame71, false);
  assert.equal(complete.snapshots, 11); assert.equal(complete.resultCases, 6); assert.equal(complete.actionCases, 5);
  assert.equal(records.length, 13);
  const snapshots = records.filter(record => record.type === 'snapshot');
  assert.deepEqual(snapshots.slice(0, 6).map(record => [record.scenario, record.seed, record.noDamage]), [42, 1, 3735928559].flatMap(seed => [false, true].map(perfect => ['result', seed, perfect])));
  assert.deepEqual(snapshots.slice(6).map(record => [record.scenario, record.op, record.step]), [['repair_sequence', 'freeRepair', 0], ['repair_sequence', 'acknowledge', 1], ['repair_sequence', 'freeRepair', 2], ['low_ap', 'freeRepair', 0], ['full_low_ap', 'freeRepair', 0]]);
  let actionSimulation: Simulation | undefined;
  let actionDraws: (() => number) | undefined;
  const comparisons = snapshots.map(record => {
    assert.equal(record.version, 1); assert.equal(record.kind, 'town'); assert.equal(record.day, 1);
    let actual: Record<string, unknown>, expected: Record<string, unknown>;
    if (record.scenario === 'result') {
      assert.equal(record.goldBefore, 200); assert.equal(record.initialReward, 600);
      const simulation = new Simulation(1);
      simulation.state.noDamage = record.noDamage!;
      // Расчёт плана итогов проходит через рабочий finishDay; вход RNG задаётся позже, у renewResult.
      const methods = simulation as unknown as PrivateSimulation;
      methods.finishDay();
      simulation.state.phase = 'victory'; simulation.state.postbattle = 'result'; simulation.state.town = null;
      simulation.state.gold = record.goldBefore!; simulation.state.rng = record.seed!;
      const draws = observeRandom(simulation);
      methods.prepareResult();
      actual = {
        gold: simulation.state.gold, totalMoney: simulation.state.totalMoney, ap: simulation.state.town?.ap,
        result: { reward: simulation.state.result.reward + simulation.state.result.perfectBonus, upkeep: simulation.state.result.upkeep, netReward: simulation.state.result.netReward },
        drawCount: draws(), rngState: simulation.state.rng,
      };
      expected = { gold: record.gold, totalMoney: record.totalMoney, ap: record.ap, result: { reward: record.result!.reward, upkeep: record.result!.upkeep, netReward: record.result!.netReward }, drawCount: record.drawCount, rngState: record.rngState };
    } else {
      assert.equal(record.seed, 42);
      if (record.step === 0) {
        actionSimulation = new Simulation(1);
        // Эта исходная запись исключает frame71: enterTown добавил бы генерацию лавки и другие броски.
        actionSimulation.state.phase = 'town'; actionSimulation.state.postbattle = 'result';
        actionSimulation.state.town = { ap: record.scenario === 'repair_sequence' ? 2 : record.scenario === 'low_ap' ? 1 : 0, preparation: 'pending' };
        actionSimulation.state.castleHp = record.scenario === 'full_low_ap' ? 40 : 17;
        actionSimulation.state.gold = 200; actionSimulation.state.rng = 42;
        actionDraws = observeRandom(actionSimulation);
      }
      assert.ok(actionSimulation && actionDraws);
      const outcome = record.op === 'freeRepair' ? actionSimulation.freeRepair() : undefined;
      if (record.op === 'acknowledge') {
        // Диалог принадлежит интерфейсу; здесь сверяются только неизменные игровые значения после закрытия.
        assert.equal(record.eventDialog, 0); assert.equal(record.dialog, null);
      }
      const sourceOutcome = record.op === 'acknowledge' ? undefined : record.dialog ? 'repaired' : record.messages?.includes('The castle is not damaged!') ? 'not-damaged' : record.messages?.includes("You don't have enough action points!") ? 'not-enough-ap' : 'unknown';
      actual = { outcome, day: actionSimulation.state.day, hp: actionSimulation.state.castleHp, maxHp: actionSimulation.state.castleMaxHp, gold: actionSimulation.state.gold, ap: actionSimulation.state.town!.ap, drawCount: actionDraws(), rngState: actionSimulation.state.rng };
      expected = { outcome: sourceOutcome, day: record.day, hp: record.hp, maxHp: record.maxHp, gold: record.gold, ap: record.ap, drawCount: record.drawCount, rngState: record.rngState };
    }
    const differences: { field: string; expected: unknown; actual: unknown }[] = [];
    for (const field of Object.keys(actual)) if (!isDeepStrictEqual(actual[field], expected[field])) differences.push({ field, expected: expected[field], actual: actual[field] });
    return { scenario: record.scenario!, seed: record.seed!, noDamage: record.noDamage, op: record.op, step: record.step, matched: differences.length === 0, originalDrawCount: record.drawCount!, portDrawCount: actual.drawCount as number, differences };
  });
  return { status: comparisons.every(row => row.matched) ? 'passed' as const : 'failed' as const, matchedSnapshots: comparisons.filter(row => row.matched).length, comparisons };
}
