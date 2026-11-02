import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { compareLootModTrace } from './loot-mod-reference-support.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-loot-mod-trace.json', import.meta.url), 'utf8'));
type Row = Record<string, any>;
const rows = fixture.records.filter((row: Row) => row.type === 'snapshot') as Row[];
const item = (row: Row, id: number) => id < 20 ? row.offers[id] : row.inventory[id - 20];

test('loot MOD operations match53 actual original observations in both reward modes', () => {
  assert.equal(fixture.format, 'elona-original-loot-mod-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  assert.equal(fixture.instrumentedSwfSha256, '4666992fd4f29c36801e87b5f8274c45e37880c51921f83b57f5c7f587525f08');
  assert.equal(fixture.traceSha256, '3be24c9b8398d261c1958d95fb202ab6a6eccaa8cac6ef4e84aa845697282751');
  assert.equal(createHash('sha256').update(JSON.stringify(fixture.records)).digest('hex'), fixture.traceSha256);
  const result = compareLootModTrace(fixture.records);
  assert.equal(result.status, 'passed'); assert.equal(result.matchedSnapshots, 53); assert.equal(result.cases, 18);
  for (const row of rows) {
    assert.equal(row.gold, 0); assert.equal(row.ap, 0); assert.equal(row.totalMoney, 1234);
    assert.equal(row.drawCount, 0); assert.equal(row.rngState, 42); assert.equal(row.fadeCount, 0); assert.equal(row.drag, false);
    assert.equal(row.slots.every((slot: Row) => slot.op === 1 && slot.alpha === 1), true);
    if (row.op === 'preview') {
      assert.deepEqual(row.dialog, { action: 5, question: 'Do you really want to mount the mod on this gun?', comparisonVisible: false });
      const before = rows.find(value => value.scenario === row.scenario && value.op === 'before')!;
      assert.deepEqual(row.inventory, before.inventory); assert.deepEqual(row.offers, before.offers);
    }
    if (row.op === 'cancel' || row.op === 'swap') {
      const before = rows.find(value => value.scenario === row.scenario && value.op === 'before')!;
      assert.deepEqual(item(row, row.config.from), item(before, row.config.to));
      assert.deepEqual(item(row, row.config.to), item(before, row.config.from));
    }
    if (row.op === 'confirm' && row.messages.length) {
      const before = rows.find(value => value.scenario === row.scenario && value.op === 'before')!;
      assert.deepEqual(row.inventory, before.inventory); assert.deepEqual(row.offers, before.offers);
    }
  }
  const confirms = rows.filter(row => row.op === 'confirm');
  assert.deepEqual(confirms.filter(row => row.messages.length).map(row => [row.scenario, row.messages.length]),
    [['full-capacity', 1], ['ammo-bow', 2], ['boss-reloading-bow', 2], ['auto-reload-magazine', 1], ['already-living', 1]]);
  const living = confirms.find(row => row.scenario === 'boss-living-new')!;
  assert.equal(living.inventory[0].livingWeapon, 800);
  const engineer = confirms.find(row => row.scenario === 'repeated-damage-engineer')!;
  assert.equal(engineer.inventory[0].attack, 72); assert.equal(engineer.inventory[0].mod, 2);
  const expanded = confirms.find(row => row.scenario === 'boss-offer-last-owned-yes')!;
  assert.equal(expanded.inventory.length, 16); assert.equal(expanded.inventory[15].attack, 21);
  assert.equal(expanded.offers[7].num, 0); assert.equal(expanded.offers[7].id, 9);
});

test('loot MOD reference rejects treating No as a no-op instead of swapping endpoints', () => {
  const result = compareLootModTrace(fixture.records, { resolve(simulation, confirm, original) {
    if (confirm) return original();
    simulation.state.pendingLootAction = null; return 'swapped';
  } });
  assert.equal(result.status, 'failed');
  assert.deepEqual(result.comparisons.filter(row => !row.matched).map(row => row.scenario),
    ['offer-owned-no', 'owned-offer-outside', 'owned-owned-no', 'offer-offer-no', 'boss-last-owned-offer-no']);
});

test('loot MOD reference rejects erasing consumed MOD metadata', () => {
  const result = compareLootModTrace(fixture.records, { resolve(simulation, _confirm, original) {
    const source = simulation.state.pendingLootAction!.mod;
    const outcome = original();
    if (outcome === 'mounted') (source.area === 'offers' ? simulation.state.lootOffers : simulation.state.inventory)[source.index] = null;
    return outcome;
  } });
  assert.equal(result.status, 'failed');
  assert.deepEqual(result.comparisons.filter(row => !row.matched).map(row => row.scenario),
    ['offer-owned-yes', 'owned-offer-yes', 'owned-owned-yes', 'offer-offer-yes', 'boss-offer-last-owned-yes', 'boss-living-new', 'repeated-damage-engineer']);
});

test('loot MOD reference detects omission of cached Engineer during repeated Damage mounting', () => {
  const result = compareLootModTrace(fixture.records, { resolve(simulation, _confirm, original) {
    const engineer = simulation.state.partySkills.effects[120];
    simulation.state.partySkills.effects[120] = 0;
    try { return original(); } finally { simulation.state.partySkills.effects[120] = engineer; }
  } });
  assert.equal(result.status, 'failed');
  const failed = result.comparisons.filter(row => !row.matched);
  assert.equal(failed.length, 1); assert.equal(failed[0].scenario, 'repeated-damage-engineer');
  assert.equal(failed[0].differences[0].actual[0].attack, 70);
  assert.equal(failed[0].differences[0].expected[0].attack, 72);
});
