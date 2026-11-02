import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { compareCastleLooterTrace } from './castle-looter-reference-support.ts';
import { castleLootMultiplier } from '../src/castle-upgrades.ts';
import { isOccupiedItem } from '../src/items.ts';

type Row = Record<string, any>;
const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-castle-looter-trace.json', import.meta.url), 'utf8'));
const rows = fixture.records.filter((row: Row) => row.type === 'snapshot') as Row[];
const generation = (name: string) => rows.find(row => row.scenario === name)!;
const values = (row: Row) => row.offers.filter((item: Row) => item.num).map((item: Row) => [item.id, item.value]);

test('Looter transactions and reward generation match26 captured original observations', () => {
  assert.equal(fixture.format, 'elona-original-castle-looter-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  assert.equal(fixture.instrumentedSwfSha256, '5495bfdd046aaac92ce4a74b82aa6eaf0afc452a7f71d00c46b522f3c76ca6e0');
  assert.equal(fixture.traceSha256, 'c3e88707f82a6e5f148dbf782659568d1386765a66bb1dfc2f118b6276c61ce9');
  assert.equal(createHash('sha256').update(JSON.stringify(fixture.records)).digest('hex'), fixture.traceSha256);
  const result = compareCastleLooterTrace(fixture.records);
  assert.equal(result.status, 'passed'); assert.equal(result.matchedSnapshots, 26);
  for (const [left, right] of [['ordinary-floor-0', 'ordinary-floor-1'], ['guaranteed-0', 'guaranteed-12'], ['shop-control-0', 'shop-control-12']]) {
    const before = generation(left), after = generation(right);
    for (const field of ['offers', 'draws', 'drawCount', 'rngState', 'sellValues', 'buyValues']) assert.deepEqual(after[field], before[field]);
  }
  assert.deepEqual(generation('ordinary-floor-0').calls.map((call: Row) => call.targetValue), [290]);
  assert.deepEqual(generation('ordinary-floor-1').calls.map((call: Row) => call.targetValue), [327]);
  const ordinary0 = generation('ordinary-budget-0'), ordinary3 = generation('ordinary-budget-3');
  assert.deepEqual(values(ordinary0), [[12, 345], [28, 50], [30, 120], [33, 95]]);
  assert.deepEqual(values(ordinary3), [[3, 680], [28, 50], [30, 120], [33, 95]]);
  assert.deepEqual([ordinary0.drawCount, ordinary3.drawCount], [190, 75]);
  const boss0 = generation('boss-budget-0'), boss1 = generation('boss-budget-1');
  assert.deepEqual(values(boss0), [[2, 622], [8, 400]]); assert.deepEqual(values(boss1), [[23, 1778], [36, 599]]);
  assert.deepEqual([boss0.drawCount, boss1.drawCount], [312, 60]);
  assert.deepEqual(boss0.calls.map((call: Row) => call.mode), [2, 3]);
  assert.deepEqual(generation('boss-mod-3').calls.map((call: Row) => [call.targetValue, call.mode]), [[1186, 3]]);
  assert.deepEqual(generation('guaranteed-12').queue, [117, 106, 37]);
  assert.deepEqual(generation('guaranteed-12').calls, []); assert.equal(generation('guaranteed-12').drawCount, 10);
  const purchase = rows.filter(row => row.boundary === 'purchase');
  for (const row of purchase) {
    assert.equal(row.ap, 0); assert.equal(row.totalMoney, 1234); assert.equal(row.hp, 30);
    assert.equal(row.drawCount, 0); assert.equal(row.rngState, 42);
    assert.equal(row.tile.hint[0], 'The more looters you have the, the more valuable stuff you find will be.');
    assert.equal(row.tile.hint[1], row.looterLevel === 0 ? "[ You haven't acquired this upgrade yet ]"
      : `(Currently, looted items's value will be ${Math.trunc(row.multiplier * 100 - 100)}% higher)`);
  }
  assert.deepEqual(purchase.filter(row => row.scenario === 'looter-sequence').map(row => [row.looterLevel, row.gold, row.upkeep, row.tile.cost]),
    [[0, 725, 40, 300], [1, 425, 45, 425], [2, 0, 50, 800]]);
  const level12 = purchase.find(row => row.scenario === 'looter-float-hint' && row.op === 'click')!;
  assert.equal(level12.tile.hint[1], "(Currently, looted items's value will be 100% higher)");
  assert.equal(purchase.at(-1)!.looterLevel, 13); assert.equal(purchase.at(-1)!.tile.cost, 21425);
});

test('Looter reference detects omitting the live upgrade from either reward factory', () => {
  const result = compareCastleLooterTrace(fixture.records, { generate(simulation, _mode, original) {
    const level = simulation.state.looterLevel; simulation.state.looterLevel = 0;
    try { original(); } finally { simulation.state.looterLevel = level; }
  } });
  assert.equal(result.status, 'failed');
  assert.deepEqual(result.comparisons.filter(row => !row.matched).map(row => row.scenario),
    ['ordinary-floor-1', 'ordinary-budget-1', 'ordinary-budget-3', 'boss-budget-1', 'boss-budget-3', 'boss-alternate-3', 'boss-mod-3']);
});

test('Looter reference detects rounding reward budgets instead of source int truncation', () => {
  const result = compareCastleLooterTrace(fixture.records, { target(target, simulation, mode) {
    if (mode === 'shop') return target;
    const base = mode === 'ordinary' ? simulation.state.day * 40 + 250 : simulation.state.day * 60 + 500;
    return Math.round(base * castleLootMultiplier(simulation.state));
  } });
  assert.equal(result.status, 'failed');
  const failed = result.comparisons.filter(row => !row.matched);
  assert.deepEqual(failed.map(row => row.scenario),
    ['ordinary-floor-1', 'ordinary-budget-1', 'ordinary-budget-3', 'boss-budget-1', 'boss-budget-3', 'boss-alternate-3', 'boss-mod-3']);
  assert.equal(failed.every(row => row.differences.some(value => value.field === 'calls')), true);
});

test('Looter reference rejects multiplying final values of guaranteed drops', () => {
  const result = compareCastleLooterTrace(fixture.records, { generate(simulation, mode, original) {
    original();
    if (mode === 'ordinary' && simulation.state.looterLevel === 12)
      for (const item of simulation.state.lootOffers) if (isOccupiedItem(item)) item.value *= castleLootMultiplier(simulation.state);
  } });
  assert.equal(result.status, 'failed');
  const failed = result.comparisons.filter(row => !row.matched);
  assert.equal(failed.length, 1); assert.equal(failed[0].scenario, 'guaranteed-12');
  assert.deepEqual(failed[0].differences.map(value => value.field), ['offers', 'sellValues', 'buyValues']);
});
