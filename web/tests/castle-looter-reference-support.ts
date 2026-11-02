import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { Simulation } from '../src/simulation.ts';
import { ItemFactory, itemPrice, type Item } from '../src/items.ts';
import { castleLootMultiplier, castleUpgradeCost, castleUpkeep } from '../src/castle-upgrades.ts';
import { prepareEarlyTown } from '../src/town-preparation.ts';
import { inputSlot, rawSlot } from './town-preparation-reference-support.ts';

type Row = Record<string, any>;
type Boundary = { random(): number; finishDay(): void; prepareOrdinaryLoot(random: () => number): void };
export interface LooterReferenceActions {
  generate?: (simulation: Simulation, mode: string, original: () => void) => void;
  target?: (target: number, simulation: Simulation, mode: string) => number;
  purchase?: (simulation: Simulation) => unknown;
}
const scenarios = ['ordinary-floor-0', 'ordinary-floor-1', 'ordinary-budget-0', 'ordinary-budget-1', 'ordinary-budget-3',
  'guaranteed-0', 'guaranteed-12', 'boss-budget-0', 'boss-budget-1', 'boss-budget-3', 'boss-alternate-3', 'boss-mod-0', 'boss-mod-3',
  'shop-control-0', 'shop-control-12'];
const purchases = ['looter-insufficient', 'looter-first', 'looter-sequence', 'looter-float-hint', 'looter-above-twelve'];
const pick = (row: Row, keys: string[]) => Object.fromEntries(keys.map(key => [key, row[key]]));
const differences = (actual: Row, expected: Row) => Object.entries(actual).filter(([key, value]) => !isDeepStrictEqual(value, expected[key]))
  .map(([field, value]) => ({ field, actual: value, expected: expected[field] }));

function generation(row: Row, actions: LooterReferenceActions) {
  const simulation = new Simulation(42), state = simulation.state, boundary = simulation as unknown as Boundary, config = row.config;
  Object.assign(state, { day: config.day, phase: 'victory', postbattle: config.mode === 'boss' ? 'loot' : 'none',
    looterLevel: config.level, rng: config.seed, loot: [...(config.queue ?? [])], bossKilled: config.killed ?? 0,
    previousTown: null, lootOffers: row.previous.map(inputSlot) });
  const draws: Row[] = [], calls: Row[] = []; let shopEnd = 0;
  boundary.random = () => {
    let value = state.rng | 0; value ^= value << 13; value ^= value >>> 17; value ^= value << 5; state.rng = value >>> 0;
    const result = state.rng / 4294967296; draws.push({ index: draws.length + 1, state: state.rng, value: result }); return result;
  };
  const originalRandomItem = ItemFactory.prototype.randomItem;
  ItemFactory.prototype.randomItem = function(target, mode, previous) {
    target = actions.target?.(target, simulation, config.mode) ?? target;
    calls.push({ targetValue: target, mode, drawCount: draws.length, rngState: state.rng });
    const result = originalRandomItem.call(this, target, mode, previous);
    if (config.mode === 'shop' && calls.length === 3) shopEnd = draws.length;
    return result;
  };
  let offers: (Item | null)[] = [];
  try {
    const original = () => {
      if (config.mode === 'ordinary') { boundary.prepareOrdinaryLoot(() => boundary.random()); offers = state.lootOffers; }
      else if (config.mode === 'boss') { assert.equal(simulation.finishLoot(), true); offers = state.lootOffers; }
      else offers = prepareEarlyTown(() => boundary.random(), config.day, { priorOffers: row.previous.map(inputSlot) }).shop;
    };
    (actions.generate ?? ((_simulation, _mode, run) => run()))(simulation, config.mode, original);
  } finally { ItemFactory.prototype.randomItem = originalRandomItem; }
  // prepareEarlyTown продолжает карты/миссию/найм; исходный generateShop заканчивается после третьего randomStuff.
  const comparedDraws = config.mode === 'shop' ? draws.slice(0, shopEnd) : draws;
  const comparedCalls = config.mode === 'shop' ? calls.slice(0, 3) : calls;
  if (config.mode === 'shop') assert.ok(shopEnd > 0);
  const actual = { multiplier: castleLootMultiplier(state), offers: offers.map(rawSlot), queue: state.loot,
    sellValues: offers.map(value => value ? itemPrice(value) : 0), buyValues: offers.map(value => value ? itemPrice(value, true) : 0),
    calls: comparedCalls, draws: comparedDraws, drawCount: comparedDraws.length,
    rngState: comparedDraws.at(-1)?.state ?? config.seed };
  return differences(actual, { ...row, calls: row.calls.map((call: Row) => pick(call, ['targetValue', 'mode', 'drawCount', 'rngState'])) });
}

function town(before: Row): Simulation {
  const simulation = new Simulation(42); (simulation as unknown as Boundary).finishDay();
  while (simulation.state.postbattle !== 'result') {
    if (simulation.state.postbattle === 'skill') simulation.chooseSkill(simulation.state.skillChoices[0]); else simulation.finishLoot();
  }
  assert.equal(simulation.enterTown(), true);
  Object.assign(simulation.state, { looterLevel: before.looterLevel, gold: before.gold, castleHp: before.hp,
    castleMaxHp: before.maxHp, totalMoney: before.totalMoney, inventory: before.inventory.map(inputSlot), rng: before.rngState });
  simulation.state.town!.ap = before.ap;
  return simulation;
}

export function compareCastleLooterTrace(records: Row[], actions: LooterReferenceActions = {}) {
  const ready = records[0], complete = records.at(-1);
  assert.equal(ready.type, 'ready'); assert.equal(ready.version, 1); assert.equal(ready.kind, 'castle-looter');
  assert.equal(ready.clock, 'synchronous-original-rewards-and-castle-clicks'); assert.equal(ready.rng, 'xorshift32');
  assert.equal(ready.generationCases, 15); assert.equal(ready.purchaseCases, 5);
  assert.deepEqual(pick(complete!, ['type', 'kind', 'ok', 'snapshots', 'generationCases', 'purchaseCases']),
    { type: 'complete', kind: 'castle-looter', ok: true, snapshots: 26, generationCases: 15, purchaseCases: 5 });
  const snapshots = records.filter(row => row.type === 'snapshot'); assert.equal(snapshots.length, 26);
  assert.deepEqual([...new Set(snapshots.map(row => row.scenario))], [...scenarios, ...purchases]);
  const comparisons = snapshots.filter(row => row.boundary === 'generation').map(row => {
    const mismatch = generation(row, actions);
    return { scenario: row.scenario as string, boundary: row.boundary as string, op: row.config.mode as string,
      matched: mismatch.length === 0, differences: mismatch };
  });
  for (const scenario of purchases) {
    const rows = snapshots.filter(row => row.scenario === scenario), before = rows[0], simulation = town(before), state = simulation.state;
    assert.equal(before.op, 'before');
    const invariant = structuredClone({ inventory: state.inventory, town: state.town, result: state.result,
      party: state.party, cache: state.partySkills, mission: state.activeMission });
    let draws = 0; const boundary = simulation as unknown as Boundary, random = boundary.random.bind(simulation);
    boundary.random = () => { draws++; return random(); };
    for (const [index, row] of rows.entries()) {
      if (index > 0) (actions.purchase ?? (value => value.buyCastleUpgrade('looter')))(simulation);
      const cost = castleUpgradeCost('looter', state), multiplier = castleLootMultiplier(state);
      const actual = { looterLevel: state.looterLevel, multiplier, upkeep: castleUpkeep(state), gold: state.gold, ap: state.town!.ap,
        totalMoney: state.totalMoney, hp: state.castleHp, maxHp: state.castleMaxHp, inventory: state.inventory.map(rawSlot),
        tile: { cost, possible: cost > 0 && cost <= state.gold, name: `Looter${state.looterLevel ? ` Lv ${state.looterLevel}` : ''}` },
        drawCount: draws, rngState: state.rng };
      const mismatch = differences(actual, { ...row, tile: pick(row.tile, ['cost', 'possible', 'name']) });
      const afterInvariant = { inventory: state.inventory, town: state.town, result: state.result,
        party: state.party, cache: state.partySkills, mission: state.activeMission };
      if (!isDeepStrictEqual(invariant, afterInvariant)) mismatch.push({ field: 'unrelatedState', actual: afterInvariant, expected: invariant });
      comparisons.push({ scenario, boundary: 'purchase', op: row.op, matched: mismatch.length === 0, differences: mismatch });
    }
  }
  return { status: comparisons.every(row => row.matched) ? 'passed' as const : 'failed' as const,
    observedSnapshots: 26, matchedSnapshots: comparisons.filter(row => row.matched).length, comparisons };
}
