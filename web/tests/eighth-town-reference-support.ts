import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { prepareEarlyTown } from '../src/town-preparation.ts';
import { generateEarlyTownRecruit } from '../src/recruits.ts';
import { ItemFactory, type Item } from '../src/items.ts';
import { Simulation } from '../src/simulation.ts';
import { inputSlot, project, rawSlot, type TownPreparationReferenceRecord } from './town-preparation-reference-support.ts';

interface Reference extends TownPreparationReferenceRecord { [key: string]: any }
interface PrivateSimulation { finishDay(): void; prepareResult(): void; random(): number }
const differs = (actual: Record<string, unknown>, expected: Record<string, unknown>) => Object.entries(actual)
  .filter(([field, value]) => !isDeepStrictEqual(value, expected[field]))
  .map(([field, value]) => ({ field, expected: expected[field], actual: value }));

function controlledRandom(seed: number, prefix: number[] = []) {
  let rng = seed >>> 0, count = 0;
  return {
    random: () => { let value = rng | 0; value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
      rng = value >>> 0; return prefix[count++] ?? rng / 4294967296; },
    state: () => ({ drawCount: count, rngState: rng }),
  };
}

export function compareEighthTownTrace(records: Reference[], prepareTown = prepareEarlyTown,
  varyWeapon = (factory: ItemFactory, item: Item) => factory.varyWeapon(item)) {
  const ready = records[0], complete = records.at(-1);
  assert.equal(ready?.version, 1); assert.equal(ready.type, 'ready'); assert.equal(ready.kind, 'eighth-town');
  assert.equal(ready.rng, 'xorshift32'); assert.equal(ready.clock, 'synchronous-original-town-preparation-and-economy');
  assert.equal(ready.day, 8); assert.equal(ready.missionLevel, 8); assert.equal(ready.upgrades, false);
  assert.equal(ready.medals, true); assert.equal(ready.saveIo, false);
  assert.equal(complete?.type, 'complete'); assert.equal(complete.kind, 'eighth-town'); assert.equal(complete.ok, true);
  assert.equal(complete.snapshots, 18); assert.equal(records.length, 20);
  const snapshots = records.filter(record => record.type === 'snapshot');
  for (const row of snapshots) { assert.equal(row.version, 1); assert.equal(row.kind, 'eighth-town'); }
  const comparisons: { boundary: string; scenario?: string; seed: number; matched: boolean; originalDrawCount: number; portDrawCount: number; differences: ReturnType<typeof differs> }[] = [];
  const compare = (record: Reference, boundary: string, actual: Record<string, unknown>) => {
    const differences = differs(actual, record);
    comparisons.push({ boundary, scenario: record.probe, seed: record.seed!, matched: differences.length === 0,
      originalDrawCount: record.drawCount!, portDrawCount: actual.drawCount as number, differences });
  };
  const towns = snapshots.filter(record => !record.boundary);
  assert.deepEqual(towns.map(row => [row.seed, row.history, row.inputSearched, row.absorbFix]), [
    ...[42, 1, 3735928559].map(seed => [seed, 'reused', 321, 0]),
    ...[42, 1, 3735928559].map(seed => [seed, 'medal', 321, 0.03]),
  ]);
  for (const row of towns) {
    assert.equal(row.priorOffers?.length, 8); assert.equal(row.shop?.length, 8);
    const rng = controlledRandom(row.seed!);
    const town = prepareTown(rng.random, 8, {
      priorOffers: row.priorOffers!.map(inputSlot), searched: row.inputSearched!, absorbFix: row.absorbFix,
      recruitSlots: Object.fromEntries(Object.entries(row.priorRecruitSlots as Record<string, Record<string, unknown>>).map(([slot, item]) => [slot, inputSlot(item)])),
    });
    compare(row, 'preparation', { ...project(town), saveBoundary: rng.state(), ...rng.state() });
  }
  const recruits = snapshots.filter(row => row.boundary === 'recruit-growth');
  const recruitCases: [string, number, number][] = [
    ['below-5/12', 5 / 12 - 1e-8, 2], ['above-5/12', 5 / 12 + 1e-8, 3],
    ['below-5/6', 5 / 6 - 1e-8, 3], ['above-5/6', 5 / 6 + 1e-8, 4],
  ];
  assert.deepEqual(recruits.map(row => [row.probe, row.levelRoll, row.targetLevel]), recruitCases);
  for (const row of recruits) {
    assert.equal(row.seed, 42); assert.equal(row.classId, 6); assert.equal(row.reverse, false);
    assert.deepEqual(row.forced, [row.levelRoll, 0.75, 7.25 / 132, (6 - 0.5) / 9, 0.25, 0.5, 0.99, 0,
      ...Array.from({ length: row.targetLevel - 1 }, () => [0, 0.99]).flat(), 0.123, 0.999]);
    const rng = controlledRandom(row.seed, row.forced);
    const previousSlots = Object.fromEntries(Object.entries(row.priorRecruitSlots as Record<string, Record<string, unknown>>).map(([slot, item]) => [slot, inputSlot(item)]));
    const recruit = generateEarlyTownRecruit(rng.random, 8, { previousSlots });
    const items = { ...previousSlots, ...recruit.items };
    compare(row, 'recruit-growth', { recruit: { ...recruit, items: Object.fromEntries(Object.entries(items).map(([slot, item]) => [slot, rawSlot(item)])) }, ...rng.state() });
  }
  const variations = snapshots.filter(row => row.boundary === 'weapon-variation');
  assert.deepEqual(variations.map(row => [row.day, row.roll, row.probe]), [
    [7, 0.99, 'day7-cap'], [8, 5 / 9 - 1e-8, 'below-5/9'], [8, 5 / 9 + 1e-8, 'above-5/9'], [8, 0.99, 'day8-cap'],
  ]);
  for (const row of variations) {
    assert.equal(row.seed, 42);
    const rng = controlledRandom(row.seed, [row.roll]), item = inputSlot(row.before);
    assert.ok(item); assert.equal(item.id, 3);
    varyWeapon(new ItemFactory(rng.random, { day: row.day }), item);
    compare(row, 'weapon-variation', { after: rawSlot(item), ...rng.state() });
  }
  const results = snapshots.filter(row => row.boundary === 'result');
  assert.deepEqual(results.map(row => [row.day, row.seed, row.noDamage, row.title]), [
    [8, 42, false, 0], [8, 42, true, 0], [8, 42, false, 1], [8, 42, true, 1],
  ]);
  for (const row of results) {
    assert.equal(row.goldBefore, 200); assert.equal(row.result.wage, 0);
    const simulation = new Simulation(1), methods = simulation as unknown as PrivateSimulation;
    // Изолированная граница renewResult: бой и предшествующее получение предметов здесь не проверяются.
    const state = simulation.state as any;
    state.day = row.day; state.title = row.title; state.noDamage = row.noDamage;
    state.activeMission.level = row.day! - 1; state.activeMission.reward = row.initialReward;
    methods.finishDay();
    state.phase = 'victory'; state.postbattle = 'result'; state.town = null;
    state.gold = 200; state.totalMoney = 0; state.rng = row.seed;
    const random = methods.random.bind(simulation); let drawCount = 0;
    methods.random = () => { drawCount++; return random(); };
    methods.prepareResult();
    compare(row, 'result', {
      tax: state.result.tax, upkeep: state.result.upkeep, gold: state.gold, totalMoney: state.totalMoney, ap: state.town?.ap,
      title: state.title, titleMoney: state.title === 1 ? 100 : 0,
      result: { reward: state.result.reward + state.result.perfectBonus, wage: 0, combinedUpkeep: state.result.upkeep + state.result.tax, income: state.result.salary, netReward: state.result.netReward },
      drawCount, rngState: state.rng,
    });
  }
  return { status: comparisons.every(row => row.matched) ? 'passed' as const : 'failed' as const,
    matchedSnapshots: comparisons.filter(row => row.matched).length, comparisons };
}
