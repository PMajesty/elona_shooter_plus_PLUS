import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { Simulation } from '../src/simulation.ts';
import { castleUpgradeCost, castleUpkeep, type CastleUpgradeKind, type CastleUpgradeOutcome } from '../src/castle-upgrades.ts';

type Row = Record<string, any>;
type Purchase = (simulation: Simulation, kind: CastleUpgradeKind) => CastleUpgradeOutcome;
const scenarios = ['house-insufficient', 'house-exact', 'house-second', 'house-cap', 'house-sequence',
  'wall-insufficient', 'wall-exact', 'wall-damaged', 'wall-sequence', 'wall-search-offset'];

function controlledTown(input: Row): Simulation {
  const simulation = new Simulation(42);
  (simulation as unknown as { finishDay(): void }).finishDay();
  while (simulation.state.postbattle !== 'result') {
    if (simulation.state.postbattle === 'skill') simulation.chooseSkill(simulation.state.skillChoices[0]);
    else simulation.finishLoot();
  }
  assert.equal(simulation.enterTown(), true);
  const state = simulation.state;
  // Генерация города вне границы записи: входные значения заданы после неё, как в исходном стенде.
  state.day = 7; state.party.capacity = input.capacity; state.wallLevel = input.wallLevel;
  state.castleHp = input.hp; state.castleMaxHp = input.maxHp; state.gold = input.gold;
  state.totalMoney = input.totalMoney; state.town!.ap = input.ap; state.rng = input.rngState;
  return simulation;
}

function observe(simulation: Simulation, draws: number) {
  const state = simulation.state;
  const tile = (kind: CastleUpgradeKind) => {
    const cost = castleUpgradeCost(kind, state), possible = cost !== 0 && cost <= state.gold;
    return { cost, possible, name: `${kind === 'house' ? 'House' : 'Wall'} Lv ${kind === 'house' ? state.party.capacity : state.wallLevel}`,
      priceText: String(cost), mouseEnabled: possible };
  };
  return { capacity: state.party.capacity, wallLevel: state.wallLevel, hp: state.castleHp, maxHp: state.castleMaxHp,
    gold: state.gold, ap: state.town!.ap, totalMoney: state.totalMoney, upkeep: castleUpkeep(state),
    upkeepText: String(castleUpkeep(state)), house: tile('house'), wall: tile('wall'),
    dialog: state.pendingTownAction !== null || state.pendingPartyAction !== null, eventDialog: false,
    drawCount: draws, rngState: state.rng };
}

export function compareCastleUpgradesTrace(records: Row[], purchase: Purchase = (simulation, kind) => simulation.buyCastleUpgrade(kind)) {
  const ready = records[0], complete = records.at(-1);
  assert.equal(ready.version, 1); assert.equal(ready.type, 'ready'); assert.equal(ready.kind, 'castle-upgrades');
  assert.equal(ready.clock, 'synchronous-original-town-tile-clicks'); assert.equal(ready.rng, 'xorshift32');
  assert.equal(ready.frame71, true); assert.equal(ready.continuedTownEntry, true);
  assert.equal(complete?.type, 'complete'); assert.equal(complete.kind, 'castle-upgrades');
  assert.equal(complete.ok, true); assert.equal(complete.snapshots, 23); assert.equal(complete.scenarios, 10);
  const snapshots = records.filter(row => row.type === 'snapshot'); assert.equal(snapshots.length, 23);
  assert.deepEqual([...new Set(snapshots.map(row => row.scenario))], scenarios);
  const comparisons: { scenario: string; op: string; step: number; matched: boolean; differences: { field: string; actual: unknown; expected: unknown }[] }[] = [];
  for (const scenario of scenarios) {
    const rows = snapshots.filter(row => row.scenario === scenario), before = rows[0];
    assert.equal(before.op, 'before'); assert.equal(before.drawCount, 0); assert.equal(before.rngState, 42);
    const simulation = controlledTown(before);
    const invariant = structuredClone({ town: simulation.state.town, partySlots: simulation.state.party.slots,
      result: simulation.state.result, cache: simulation.state.partySkills, activeMission: simulation.state.activeMission });
    const methods = simulation as unknown as { random(): number };
    const random = methods.random.bind(simulation); let draws = 0;
    methods.random = () => { draws++; return random(); };
    for (const [step, row] of rows.entries()) {
      assert.equal(row.version, 1); assert.equal(row.kind, 'castle-upgrades');
      let outcome: CastleUpgradeOutcome | undefined, expectedOutcome: CastleUpgradeOutcome | undefined;
      if (step > 0) {
        assert.equal(row.op, 'click'); assert.ok(row.target === 'house' || row.target === 'wall');
        const previous = rows[step - 1];
        expectedOutcome = row.gold !== previous.gold ? 'purchased'
          : previous[row.target].cost === 0 ? 'capped' : 'not-enough-gold';
        outcome = purchase(simulation, row.target);
      }
      const actual: Row = { ...observe(simulation, draws), outcome };
      const expected: Row = { ...row, outcome: expectedOutcome };
      const differences = Object.entries(actual).filter(([field, value]) => !isDeepStrictEqual(value, expected[field]))
        .map(([field, value]) => ({ field, actual: value, expected: expected[field] }));
      const afterInvariant = { town: simulation.state.town, partySlots: simulation.state.party.slots,
        result: simulation.state.result, cache: simulation.state.partySkills, activeMission: simulation.state.activeMission };
      if (!isDeepStrictEqual(afterInvariant, invariant)) differences.push({ field: 'unrelatedState', actual: afterInvariant, expected: invariant });
      comparisons.push({ scenario, op: row.op, step, matched: differences.length === 0, differences });
    }
  }
  return { status: comparisons.every(row => row.matched) ? 'passed' as const : 'failed' as const,
    observedSnapshots: snapshots.length, inputSnapshots: scenarios.length, transactionSnapshots: snapshots.length - scenarios.length,
    matchedSnapshots: comparisons.filter(row => row.matched).length, comparisons };
}
