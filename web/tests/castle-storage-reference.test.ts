import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { compareCastleStorageTrace } from './castle-storage-reference-support.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-castle-storage-trace.json', import.meta.url), 'utf8'));
const rows = fixture.records.filter((row: Record<string, any>) => row.type === 'snapshot') as Record<string, any>[];

test('Storage and expanded inventory match37 captured original observations', () => {
  assert.equal(fixture.format, 'elona-original-castle-storage-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  assert.equal(fixture.instrumentedSwfSha256, '4caf0485cac7eaa7c0d8df0a8255899d94dd06bee1efd6864c05998c9b598968');
  assert.equal(fixture.traceSha256, '7ef3c3b02c73d861c2432f91401f00e358d5fdb89cf8496ea2c61b006d3fe65b');
  assert.equal(createHash('sha256').update(JSON.stringify(fixture.records)).digest('hex'), fixture.traceSha256);
  const result = compareCastleStorageTrace(fixture.records);
  assert.equal(result.status, 'passed'); assert.equal(result.matchedSnapshots, 37);
  const purchase = rows.filter(row => row.boundary === 'purchase');
  assert.equal(purchase.length, 13);
  for (const row of purchase) {
    assert.equal(row.ap, 0); assert.equal(row.totalMoney, 1234); assert.equal(row.hp, 30);
    assert.equal(row.drawCount, 0); assert.equal(row.rngState, 42);
    assert.deepEqual(row.tile.hint, ['Buying this upgrade gives you +1 extra inventory slot.', `(Currently, you have ${row.capacity} inventory slots)`]);
  }
  assert.deepEqual(purchase.filter(row => row.scenario === 'storage-sequence').map(row => [row.capacity, row.gold, row.tile.cost, row.upkeep]),
    [[6, 890, 370, 40], [7, 520, 520, 80], [8, 0, 730, 120]]);
  assert.deepEqual(purchase.filter(row => row.scenario === 'storage-final').map(row => [row.capacity, row.gold, row.tile.cost, row.upkeep]),
    [[15, 3880, 3880, 400], [16, 0, 0, 440]]);
  for (const scenario of ['shop-buy', 'loot-collect', 'owned-move']) {
    const before = rows.find(row => row.scenario === scenario && row.op === 'before')!;
    const owned = before.slots.filter((slot: Record<string, number>) => slot.id >= 20 && slot.id <= 35);
    assert.deepEqual(owned, Array.from({ length: 16 }, (_, index) => ({ id: 20 + index, op: 1,
      x: 140 + index % 8 * 50, y: (scenario === 'loot-collect' ? 224 : 250) + Math.floor(index / 8) * 48,
      shortNum: index < 5 ? String(index + 1) : '' })));
  }
  const ammo = rows.filter(row => row.boundary === 'ammo');
  assert.deepEqual(ammo.map(row => [row.op, row.inventory[5].ammo, row.inventory[14].ammo, row.inventory[14].reloadTime, row.inventory[15].ammo]),
    [['before', 2, 1, 7, 1], ['key6', 2, 1, 7, 1], ['fillAmmo', 5, 1, 7, 10], ['updateAlly', 5, 1, 0, 10]]);
});

test('Storage reference detects losing inactive owned metadata during an extra-slot purchase', () => {
  const result = compareCastleStorageTrace(fixture.records, { transaction(simulation, scenario, _op, original) {
    original(); if (scenario === 'shop-buy') simulation.state.town!.shop[0] = null;
  } });
  assert.equal(result.status, 'failed');
  assert.deepEqual(result.comparisons.filter(row => !row.matched).map(row => [row.scenario, row.op, row.differences.map(value => value.field)]),
    [['shop-buy', 'transfer', ['shop']]]);
});

test('Storage reference detects the former premature consumable reload reset', () => {
  const result = compareCastleStorageTrace(fixture.records, { ammo(simulation, op, original) {
    original(); if (op === 'fillAmmo') simulation.state.inventory[14]!.reloadTime = 0;
  } });
  assert.equal(result.status, 'failed');
  assert.deepEqual(result.comparisons.filter(row => !row.matched).map(row => [row.scenario, row.op, row.differences.map(value => value.field)]),
    [['backpack-ammo-and-keys', 'fillAmmo', ['inventory']]]);
});

test('Storage reference detects refilling only the initial six owned slots', () => {
  const result = compareCastleStorageTrace(fixture.records, { ammo(simulation, op, original) {
    const extra = simulation.state.inventory[15] && structuredClone(simulation.state.inventory[15]);
    original(); if (op === 'fillAmmo') simulation.state.inventory[15] = extra;
  } });
  assert.equal(result.status, 'failed');
  assert.deepEqual(result.comparisons.filter(row => !row.matched).map(row => [row.op, row.differences.map(value => value.field)]),
    [['fillAmmo', ['inventory']]]);
});
