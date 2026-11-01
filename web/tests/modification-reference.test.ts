import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { compareModificationTrace, type ModificationRecord } from './modification-reference-support.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-modification-trace.json', import.meta.url), 'utf8'));
const records = fixture.records as ModificationRecord[];
const scenario = (name: string) => records.filter(row => row.scenario === name);
const sample = (name: string, op: string) => scenario(name).find(row => row.op === op)!;

test('Upgrade and MOD transactions match 88 original observations, retaining separate evidence of the corrected last-mod bug', () => {
  assert.equal(fixture.format, 'elona-original-modification-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  assert.equal(createHash('sha256').update(JSON.stringify(records)).digest('hex'), fixture.traceSha256);
  const result = compareModificationTrace(records);
  assert.equal(result.status, 'passed');
  assert.equal(result.observedSnapshots, 104); assert.equal(result.comparedSnapshots, 88);
  assert.equal(result.matchedSnapshots, 88); assert.equal(result.fullyComparedSnapshots, 84);
  assert.equal(result.rawOriginalBugCases.length, 4); assert.equal(result.interventionCases, 4);
  // Исправленное ожидание вычислено отдельным исходным enchant, а не кодом порта.
  for (const name of ['upgrade_one_mod', 'upgrade_repeated_mods', 'upgrade_living_first', 'upgrade_living_last']) {
    const rows = scenario(`${name}_retained`);
    const before = rows[0], raw = rows.find(row => row.op === 'previewOriginal')!, fixed = rows.find(row => row.op === 'retainFinalIntervention')!;
    assert.equal(raw.reference!.mod, Number(before.inventory![0].mod) - 1);
    assert.equal(fixed.reference!.mod, before.inventory![0].mod);
    assert.equal(fixed.reference!.modText, before.inventory![0].modText);
    assert.equal(fixed.drawCount, raw.drawCount); assert.equal(fixed.rngState, raw.rngState);
  }
  assert.equal(sample('upgrade_living_last', 'previewOriginal').reference!.livingWeapon, 0);
  assert.equal(sample('upgrade_living_last_retained', 'retainFinalIntervention').reference!.livingWeapon, 17);
  assert.equal(sample('upgrade_living_first', 'previewOriginal').reference!.livingWeapon, 17);
});

test('original coverage proves preview RNG, cancellation, slot gating, mounting guards and retained metadata', () => {
  const repeatedPreview = scenario('upgrade_plain_cancel_reopen');
  assert.deepEqual(repeatedPreview.map(row => row.drawCount), [0, 0, 2, 2, 2, 4, 4]);
  const initial = repeatedPreview[0], cancelled = repeatedPreview.find(row => row.op === 'cancel')!;
  assert.deepEqual(cancelled.inventory, initial.inventory); assert.equal(cancelled.ap, initial.ap); assert.equal(cancelled.gold, initial.gold);
  assert.deepEqual(cancelled.reference, repeatedPreview.find(row => row.op === 'previewOriginal')!.reference);
  assert.equal(sample('upgrade_plain_three_draws', 'previewOriginal').drawCount, 3);
  const eligible = sample('upgrade_plain_three_draws', 'enterUpgrade').slots!.filter(slot => slot.alpha === 1).map(slot => slot.id);
  assert.deepEqual(eligible, [20, 25]);
  assert.equal(sample('upgrade_low_ap', 'enterUpgrade').drawCount, 0);
  assert.equal(sample('upgrade_no_money', 'confirm').ap, 4);
  assert.deepEqual(sample('upgrade_no_money', 'confirm').inventory, sample('upgrade_no_money', 'before').inventory);
  const mountBefore = sample('mount_cancel_swaps', 'before'), mountCancel = sample('mount_cancel_swaps', 'cancel');
  assert.deepEqual(mountCancel.inventory![0], mountBefore.inventory![1]);
  assert.deepEqual(mountCancel.inventory![1], mountBefore.inventory![0]);
  const stockBefore = sample('stock_mod_occupied_blocked', 'before'), stockDrop = sample('stock_mod_occupied_blocked', 'drop');
  assert.equal(sample('stock_mod_occupied_blocked', 'pickup').slots!.find(slot => slot.id === 20)!.alpha, 0.5);
  assert.deepEqual(stockDrop.inventory, stockBefore.inventory); assert.deepEqual(stockDrop.shop, stockBefore.shop);
  assert.equal(stockDrop.gold, stockBefore.gold); assert.equal(stockDrop.dialog, null);
  assert.equal(sample('mount_ammo_bow', 'confirm').messages!.length, 2);
  assert.equal(sample('mount_reloading_bow', 'confirm').messages!.length, 2);
  for (const name of ['mount_full', 'mount_ammo_gravity', 'mount_ammo_bow', 'mount_reloading_bow', 'mount_auto_reload_magazine', 'mount_living_duplicate']) {
    assert.deepEqual(sample(name, 'confirm').inventory, sample(name, 'before').inventory);
    assert.equal(sample(name, 'confirm').drawCount, 0);
  }
  const metadata = sample('mount_damage_reload_metadata', 'confirm');
  assert.equal(metadata.inventory![0].ammo, metadata.inventory![0].ammoMax);
  assert.equal(metadata.inventory![0].reloadTime, 3);
  assert.equal(metadata.inventory![1].num, 0);
  assert.equal(sample('mount_repeat_auto_reload', 'before').inventory![0].autoReload, 3);
  assert.equal(sample('mount_repeat_auto_reload', 'confirm').inventory![0].autoReload, 1);
  for (const row of records.filter(row => row.type === 'snapshot' && row.scenario!.startsWith('mount'))) assert.equal(row.drawCount, 0);
});

test('comparison rejects changed corrected previews, source cancellation behavior and preview random draws', () => {
  const corrupted = structuredClone(records);
  const fixed = corrupted.find(row => row.scenario === 'upgrade_one_mod_retained' && row.op === 'retainFinalIntervention')!;
  fixed.reference!.attack = Number(fixed.reference!.attack) + 1;
  const cancelled = corrupted.find(row => row.scenario === 'mount_cancel_swaps' && row.op === 'cancel')!;
  cancelled.inventory = structuredClone(corrupted.find(row => row.scenario === 'mount_cancel_swaps' && row.op === 'before')!.inventory);
  const preview = corrupted.find(row => row.scenario === 'upgrade_plain_three_draws' && row.op === 'previewOriginal')!;
  preview.draws![0].value += 0.01;
  const result = compareModificationTrace(corrupted);
  assert.equal(result.status, 'failed');
  const failed = result.comparisons.filter(row => !row.matched);
  assert.ok(failed.some(row => row.scenario === 'upgrade_one_mod_retained' && row.differences.some(difference => difference.field === 'reference')));
  assert.ok(failed.some(row => row.scenario === 'mount_cancel_swaps' && row.differences.some(difference => difference.field === 'inventory')));
  assert.ok(failed.some(row => row.scenario === 'upgrade_plain_three_draws' && row.differences.some(difference => difference.field === 'draws')));
});
