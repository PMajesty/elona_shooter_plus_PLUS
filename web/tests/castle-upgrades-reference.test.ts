import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { compareCastleUpgradesTrace } from './castle-upgrades-reference-support.ts';
import { castleUpgradeCost } from '../src/castle-upgrades.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-castle-upgrades-trace.json', import.meta.url), 'utf8'));
const snapshots = fixture.records.filter((row: Record<string, any>) => row.type === 'snapshot') as Record<string, any>[];

test('Castle quotes and 13 actual purchase/guard outcomes match the 23 original observations', () => {
  assert.equal(fixture.format, 'elona-original-castle-upgrades-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  assert.equal(fixture.instrumentedSwfSha256, '3566209d7273bb4486dad99e8a886e963477bc2a9e0a9c2cf462a047b5b1cc90');
  assert.equal(fixture.traceSha256, '6ee6e1ba7fba046fc069b36a8516da1450b5a72465c8a2bc64491fe41edda4fc');
  assert.equal(createHash('sha256').update(JSON.stringify(fixture.records)).digest('hex'), fixture.traceSha256);
  const result = compareCastleUpgradesTrace(fixture.records);
  assert.equal(result.status, 'passed'); assert.equal(result.matchedSnapshots, 23);
  assert.equal(result.inputSnapshots, 10); assert.equal(result.transactionSnapshots, 13);
  for (const row of snapshots) {
    assert.equal(row.ap, 0); assert.equal(row.drawCount, 0); assert.equal(row.rngState, 42);
    assert.equal(row.totalMoney, 1234); assert.equal(row.dialog, false); assert.equal(row.eventDialog, false);
  }
  const house = snapshots.filter(row => row.scenario === 'house-sequence');
  assert.deepEqual(house.map(row => [row.capacity, row.gold, row.house.cost, row.upkeep]),
    [[1, 7000, 2000, 40], [2, 5000, 5000, 90], [3, 0, 0, 140]]);
  const wall = snapshots.filter(row => row.scenario === 'wall-sequence');
  assert.deepEqual(wall.map(row => [row.wallLevel, row.maxHp, row.gold, row.wall.cost, row.upkeep]),
    [[1, 40, 1250, 240, 40], [2, 45, 1010, 410, 50], [3, 50, 600, 600, 60], [4, 55, 0, 810, 70]]);
  const damaged = snapshots.find(row => row.scenario === 'wall-damaged' && row.op === 'click')!;
  assert.deepEqual([damaged.hp, damaged.maxHp], [35, 45]);
  const offset = snapshots.filter(row => row.scenario === 'wall-search-offset');
  assert.deepEqual(offset.map(row => [row.wallLevel, row.hp, row.maxHp, row.wall.cost, row.gold]),
    [[1, 31, 41, 272, 272], [2, 36, 46, 446, 0]]);
  for (const scenario of ['house-insufficient', 'house-cap', 'wall-insufficient']) {
    const [before, after] = snapshots.filter(row => row.scenario === scenario);
    for (const field of ['capacity', 'wallLevel', 'hp', 'maxHp', 'gold', 'upkeep', 'house', 'wall'])
      assert.deepEqual(after[field], before[field]);
  }
});

test('Castle reference rejects a Wall purchase that heals the prior damage deficit', () => {
  const result = compareCastleUpgradesTrace(fixture.records, (simulation, kind) => {
    const outcome = simulation.buyCastleUpgrade(kind);
    if (outcome === 'purchased' && kind === 'wall') simulation.state.castleHp = simulation.state.castleMaxHp;
    return outcome;
  });
  assert.equal(result.status, 'failed');
  assert.deepEqual(result.comparisons.filter(row => !row.matched).map(row => [row.scenario, row.differences.map(value => value.field)]),
    [['wall-damaged', ['hp']], ['wall-search-offset', ['hp']]]);
});

test('Castle reference rejects a Wall price derived from Wall level instead of maximum HP', () => {
  const result = compareCastleUpgradesTrace(fixture.records, (simulation, kind) => {
    const cost = castleUpgradeCost(kind, simulation.state);
    const inferredMaxHp = 35 + simulation.state.wallLevel * 5;
    const wrongCost = Math.trunc(inferredMaxHp * inferredMaxHp / 2.5 - 400);
    const outcome = simulation.buyCastleUpgrade(kind);
    if (outcome === 'purchased' && kind === 'wall') simulation.state.gold += cost - wrongCost;
    return outcome;
  });
  assert.equal(result.status, 'failed');
  const failures = result.comparisons.filter(row => !row.matched);
  assert.equal(failures.length, 1); assert.equal(failures[0].scenario, 'wall-search-offset');
  assert.deepEqual(failures[0].differences.map(value => value.field), ['gold']);
});
