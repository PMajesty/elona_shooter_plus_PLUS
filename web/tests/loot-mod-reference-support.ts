import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { Simulation, type LootItemAddress } from '../src/simulation.ts';
import { inputSlot, rawSlot } from './town-preparation-reference-support.ts';

type Row = Record<string, any>;
type Boundary = { random(): number; finishDay(): void };
export interface LootModReferenceActions {
  resolve?: (simulation: Simulation, confirm: boolean, original: () => string) => string;
}
const scenarios = ['offer-owned-yes', 'offer-owned-no', 'owned-offer-yes', 'owned-offer-outside', 'owned-owned-yes', 'owned-owned-no',
  'offer-offer-yes', 'offer-offer-no', 'boss-offer-last-owned-yes', 'boss-last-owned-offer-no', 'full-capacity', 'ammo-bow',
  'boss-reloading-bow', 'auto-reload-magazine', 'already-living', 'boss-living-new', 'repeated-damage-engineer', 'reverse-gun-mod'];
const address = (id: number): LootItemAddress => id < 20 ? { area: 'offers', index: id } : { area: 'inventory', index: id - 20 };
const differences = (actual: Row, expected: Row) => Object.entries(actual).filter(([key, value]) => !isDeepStrictEqual(value, expected[key]))
  .map(([field, value]) => ({ field, actual: value, expected: expected[field] }));

function expectedOutcome(row: Row): string | undefined {
  if (row.op === 'before') return undefined;
  if (row.op === 'preview') return 'previewed';
  if (row.op === 'cancel' || row.op === 'swap') return 'swapped';
  if (row.messages.includes("There's no available mod slot on this weapon!")) return 'no-mod-slot';
  if (row.messages.includes("This weapon can't use ammo/reloading mods.")) return 'incompatible-ammo-mod';
  if (row.messages.includes("This weapon can't use Auto Reload mod.")) return 'incompatible-auto-reload';
  if (row.messages.includes('This weapon is already alive.')) return 'already-living';
  return 'mounted';
}

export function compareLootModTrace(records: Row[], actions: LootModReferenceActions = {}) {
  const ready = records[0], complete = records.at(-1);
  assert.equal(ready.version, 1); assert.equal(ready.type, 'ready'); assert.equal(ready.kind, 'loot-mod');
  assert.equal(ready.clock, 'synchronous-original-loot-input-and-dialog'); assert.equal(ready.rng, 'xorshift32');
  assert.equal(ready.continuedTownEntry, true); assert.equal(ready.cases, 18);
  assert.equal(complete?.type, 'complete'); assert.equal(complete.kind, 'loot-mod'); assert.equal(complete.ok, true);
  assert.equal(complete.cases, 18); assert.equal(complete.snapshots, 53);
  const snapshots = records.filter(row => row.type === 'snapshot'); assert.equal(snapshots.length, 53);
  assert.deepEqual([...new Set(snapshots.map(row => row.scenario))], scenarios);
  const comparisons = [];
  for (const scenario of scenarios) {
    const rows = snapshots.filter(row => row.scenario === scenario), before = rows[0], config = before.config;
    assert.deepEqual(rows.map(row => row.op), config.reverse ? ['before', 'swap'] : ['before', 'preview', config.cancel ? 'cancel' : 'confirm']);
    assert.equal(before.rngState, 42); assert.equal(before.drawCount, 0); assert.equal(before.context.recycleMedal, false);
    const simulation = new Simulation(42), state = simulation.state, boundary = simulation as unknown as Boundary;
    boundary.finishDay();
    Object.assign(state, { inventory: before.inventory.map(inputSlot), lootOffers: before.offers.map(inputSlot), phase: 'victory',
      postbattle: before.mode, bossKilled: before.mode === 'boss-loot' ? 1 : 0, gold: before.gold, totalMoney: before.totalMoney,
      rng: before.rngState, pendingLootAction: null });
    state.partySkills.effects[120] = before.context.engineer;
    const invariant = structuredClone({ phase: state.phase, stage: state.postbattle, result: state.result, town: state.town,
      hero: state.player, party: state.party, cache: state.partySkills, previousTown: state.previousTown,
      mission: state.activeMission, loot: state.loot, bossKilled: state.bossKilled, reference: state.upgradeReference });
    let draws = 0; const random = boundary.random.bind(simulation); boundary.random = () => { draws++; return random(); };
    const from = address(config.from), to = address(config.to);
    for (const row of rows) {
      let outcome: string | undefined;
      if (row.op === 'preview' || row.op === 'swap') {
        const moved = simulation.moveLootItem(from.area, from.index, to.area, to.index);
        outcome = moved ? state.pendingLootAction ? 'previewed' : 'swapped' : 'unavailable';
      } else if (row.op === 'confirm' || row.op === 'cancel') {
        const confirm = row.op === 'confirm';
        outcome = (actions.resolve ?? ((_simulation, _confirm, run) => run()))(simulation, confirm, () => simulation.resolveLootModMount(confirm));
      }
      const pending = state.pendingLootAction;
      const actual = { inventory: state.inventory.map(rawSlot), offers: state.lootOffers.map(rawSlot),
        gold: state.gold, totalMoney: state.totalMoney, ap: state.town?.ap ?? 0,
        mode: state.postbattle, drawCount: draws, rngState: state.rng,
        pending: pending ? { kind: pending.kind, mod: pending.mod, gun: pending.gun } : null, outcome };
      const expected = { ...row, pending: row.dialog ? { kind: 'mod', mod: from, gun: to } : null, outcome: expectedOutcome(row) };
      const mismatch = differences(actual, expected);
      const afterInvariant = { phase: state.phase, stage: state.postbattle, result: state.result, town: state.town,
        hero: state.player, party: state.party, cache: state.partySkills, previousTown: state.previousTown,
        mission: state.activeMission, loot: state.loot, bossKilled: state.bossKilled, reference: state.upgradeReference };
      if (!isDeepStrictEqual(invariant, afterInvariant)) mismatch.push({ field: 'unrelatedState', actual: afterInvariant, expected: invariant });
      comparisons.push({ scenario, mode: row.mode, op: row.op, outcome, matched: mismatch.length === 0, differences: mismatch });
    }
  }
  return { status: comparisons.every(row => row.matched) ? 'passed' as const : 'failed' as const,
    cases: 18, observedSnapshots: 53, matchedSnapshots: comparisons.filter(row => row.matched).length, comparisons };
}
