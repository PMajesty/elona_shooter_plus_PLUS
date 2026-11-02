import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { prepareEarlyTown } from '../src/town-preparation.ts';
import { generateEarlyTownRecruit } from '../src/recruits.ts';
import { Simulation } from '../src/simulation.ts';
import { inputSlot, project, rawSlot, type TownPreparationReferenceRecord } from './town-preparation-reference-support.ts';

interface Reference extends TownPreparationReferenceRecord { [key: string]: any }
interface PrivateSimulation { finishDay(): void; prepareResult(): void; random(): number }
const differs = (actual: Record<string, unknown>, expected: Record<string, unknown>) => Object.entries(actual)
  .filter(([field, value]) => !isDeepStrictEqual(value, expected[field]))
  .map(([field, value]) => ({ field, expected: expected[field], actual: value }));

function observeRandom(simulation: Simulation) {
  const methods = simulation as unknown as PrivateSimulation, random = methods.random.bind(simulation);
  let count = 0;
  methods.random = () => { count++; return random(); };
  return () => count;
}

export function compareSeventhTownTrace(records: Reference[], prepareTown = prepareEarlyTown) {
  const ready = records[0], complete = records.at(-1);
  assert.equal(ready?.version, 1); assert.equal(ready.type, 'ready'); assert.equal(ready.kind, 'seventh-town');
  assert.equal(ready.rng, 'xorshift32'); assert.equal(ready.clock, 'synchronous-original-town-preparation-and-economy');
  assert.equal(ready.day, 7); assert.equal(ready.missionLevel, 7); assert.equal(ready.upgrades, false);
  assert.equal(ready.medals, true); assert.equal(ready.saveIo, false);
  assert.equal(complete?.type, 'complete'); assert.equal(complete.kind, 'seventh-town'); assert.equal(complete.ok, true);
  assert.equal(complete.snapshots, 38); assert.equal(records.length, 40);
  const snapshots = records.filter(record => record.type === 'snapshot');
  for (const row of snapshots) { assert.equal(row.version, 1); assert.equal(row.kind, 'seventh-town'); }
  const towns = snapshots.filter(record => !record.boundary);
  assert.deepEqual(towns.map(row => [row.seed, row.history, row.inputSearched, row.absorbFix]), [
    ...[42, 1, 3735928559].map(seed => [seed, 'reused', 321, 0]),
    ...[42, 1, 3735928559].map(seed => [seed, 'medal', 321, 0.03]),
  ]);
  const comparisons: { boundary: string; scenario?: string; seed: number; matched: boolean; originalDrawCount: number; portDrawCount: number; differences: ReturnType<typeof differs> }[] = [];
  const compare = (record: Reference, boundary: string, actual: Record<string, unknown>, expected: Record<string, unknown> = record) => {
    const differences = differs(actual, expected);
    comparisons.push({ boundary, scenario: record.scenario, seed: record.seed!, matched: differences.length === 0, originalDrawCount: record.drawCount!, portDrawCount: actual.drawCount as number, differences });
  };
  for (const row of towns) {
    assert.equal(row.priorOffers?.length, 8); assert.equal(row.shop?.length, 8);
    let rng = row.seed! >>> 0, drawCount = 0;
    const random = () => { let value = rng | 0; value ^= value << 13; value ^= value >>> 17; value ^= value << 5; rng = value >>> 0; drawCount++; return rng / 4294967296; };
    const town = prepareTown(random, 7, {
      priorOffers: row.priorOffers!.map(inputSlot), searched: row.inputSearched!, absorbFix: row.absorbFix,
      recruitSlots: Object.fromEntries(Object.entries(row.priorRecruitSlots as Record<string, Record<string, unknown>>).map(([slot, item]) => [slot, inputSlot(item)])),
    });
    compare(row, 'preparation', { ...project(town), saveBoundary: { drawCount, rngState: rng }, drawCount, rngState: rng });
  }
  const recruits = snapshots.filter(row => row.boundary === 'recruit-growth');
  assert.deepEqual(recruits.map(row => [row.classId, row.reverse, row.targetLevel, row.probe]), [
    ...Array.from({ length: 9 }, (_, index) => [index + 1, false, 4, 'class']),
    [6, true, 4, 'class'], [6, false, 2, 'below-10/21'], [6, false, 3, 'above-10/21'],
    [6, false, 3, 'below-20/21'], [6, false, 4, 'above-20/21'],
  ]);
  for (const row of recruits) {
    assert.equal(row.seed, 42);
    const levelRoll = ({ 'class': 0.99, 'below-10/21': 10 / 21 - 1e-8, 'above-10/21': 10 / 21 + 1e-8,
      'below-20/21': 20 / 21 - 1e-8, 'above-20/21': 20 / 21 + 1e-8 } as Record<string, number>)[row.probe];
    assert.equal(row.levelRoll, levelRoll);
    assert.deepEqual(row.forced, [levelRoll, 0.75, 7.25 / 132, (row.classId - 0.5) / 9, 0.25, 0.5, 0.99, 0,
      ...Array.from({ length: row.targetLevel - 1 }, () => row.reverse ? [0.99, 0] : [0, 0.99]).flat(), 0.123, 0.999]);
    let rng = row.seed! >>> 0, drawCount = 0;
    const random = () => { let value = rng | 0; value ^= value << 13; value ^= value >>> 17; value ^= value << 5; rng = value >>> 0; return row.forced[drawCount++] ?? rng / 4294967296; };
    const previousSlots = Object.fromEntries(Object.entries(row.priorRecruitSlots as Record<string, Record<string, unknown>>).map(([slot, item]) => [slot, inputSlot(item)]));
    const recruit = generateEarlyTownRecruit(random, 7, { previousSlots });
    const items = { ...previousSlots, ...recruit.items };
    compare(row, 'recruit-growth', { recruit: { ...recruit, items: Object.fromEntries(Object.entries(items).map(([slot, item]) => [slot, rawSlot(item)])) }, drawCount, rngState: rng });
  }
  const results = snapshots.filter(row => row.boundary === 'result');
  assert.deepEqual(results.map(row => [row.day, row.seed, row.noDamage, row.title]), [
    ...[42, 1, 3735928559].flatMap(seed => [0, 1].flatMap(title => [false, true].map(perfect => [7, seed, perfect, title]))),
  ]);
  for (const row of results) {
    assert.equal(row.goldBefore, 200); assert.equal(row.result.wage, 0);
    const simulation = new Simulation(1), methods = simulation as unknown as PrivateSimulation;
    // Изолируем исходную границу renewResult от предшествующей генерации наград.
    const state = simulation.state as any;
    state.day = row.day; state.title = row.title; state.noDamage = row.noDamage;
    state.activeMission.level = row.day! - 1; state.activeMission.reward = row.initialReward;
    methods.finishDay();
    state.phase = 'victory'; state.postbattle = 'result'; state.town = null;
    state.gold = 200; state.totalMoney = 0; state.rng = row.seed;
    const draws = observeRandom(simulation);
    methods.prepareResult();
    compare(row, 'result', {
      tax: state.result.tax, upkeep: state.result.upkeep, gold: state.gold, totalMoney: state.totalMoney, ap: state.town?.ap,
      title: state.title, titleMoney: state.title === 1 ? 100 : 0,
      result: { reward: state.result.reward + state.result.perfectBonus, wage: 0, combinedUpkeep: state.result.upkeep + state.result.tax, income: state.result.salary, netReward: state.result.netReward },
      drawCount: draws(), rngState: state.rng,
    });
  }
  const actions = snapshots.filter(row => row.boundary === 'claim-title');
  assert.deepEqual(actions.map(row => [row.scenario, row.op, row.step]), [
    ['claim_sequence', 'eligibility', 0], ['claim_sequence', 'claim', 1], ['claim_sequence', 'acknowledge', 2], ['claim_sequence', 'repeat', 3], ['low_ap', 'claim', 0], ['inherited_title', 'claim', 0],
  ]);
  let simulation: Simulation, draws: () => number;
  for (const row of actions) {
    if (row.step === 0) {
      simulation = new Simulation(1);
      const state = simulation.state as any;
      state.day = row.day; state.title = row.scenario === 'inherited_title' ? 1 : 0; state.phase = 'town'; state.postbattle = 'result';
      let preparationRng = 42;
      const preparationRandom = () => { preparationRng ^= preparationRng << 13; preparationRng ^= preparationRng >>> 17; preparationRng ^= preparationRng << 5; return (preparationRng >>> 0) / 4294967296; };
      state.town = { ...prepareEarlyTown(preparationRandom, row.day as 7, { searched: 321 }), preparation: 'ready', ap: row.scenario === 'low_ap' ? 3 : 4 };
      state.gold = 200; state.totalMoney = 0; state.rng = 42;
      draws = observeRandom(simulation);
    }
    const state = simulation!.state as any;
    if (row.op === 'repeat') state.town.ap = 4;
    const acts = row.op === 'claim' || row.op === 'repeat';
    const outcome = acts ? (simulation! as unknown as { claimTitle(): string }).claimTitle() : undefined;
    const expectedOutcome = !acts ? undefined : !row.eligible ? 'unavailable' : row.dialog ? 'claimed' : row.messages.includes("You don't have enough action points!") ? 'not-enough-ap' : 'unknown';
    if (row.op === 'acknowledge') { assert.equal(row.eventDialog, 0); assert.equal(row.dialog, null); }
    compare(row, 'claim-title', {
      outcome, day: state.day, title: state.title, titleMoney: state.title === 1 ? 100 : 0,
      gold: state.gold, totalMoney: state.totalMoney, ap: state.town.ap, drawCount: draws!(), rngState: state.rng,
    }, { ...row, outcome: expectedOutcome });
  }
  return { status: comparisons.every(row => row.matched) ? 'passed' as const : 'failed' as const, matchedSnapshots: comparisons.filter(row => row.matched).length, comparisons };
}
