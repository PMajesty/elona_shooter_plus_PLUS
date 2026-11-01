import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { compareEquipmentTrace, type EquipmentRecord } from './equipment-reference-support.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-equipment-trace.json', import.meta.url), 'utf8'));

test('equipment selection, held fire and reload inputs match 56 independently captured original snapshots', () => {
  assert.equal(fixture.format, 'elona-original-equipment-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  assert.equal(createHash('sha256').update(JSON.stringify(fixture.records)).digest('hex'), fixture.traceSha256);
  const records = fixture.records as EquipmentRecord[];
  const sample = (scenario: string, step: number) => records.find(row => row.scenario === scenario && row.step === step)!;
  // Проверяем достигнутые ветви в самом оригинале, а не только названия сценариев.
  assert.equal(sample('automatic_hold_release', 2).drawCount, 120);
  assert.equal(sample('automatic_hold_release', 3).drawCount, 120);
  assert.equal(sample('semi_hold_does_not_repeat', 2).drawCount, 24);
  assert.equal(sample('manual_cancel', 2).state!.shooting, false);
  assert.equal(sample('magazine_queues', 2).state!.shooting, true);
  assert.equal(sample('magazine_queues', 2).state!.inventory[0].reloadTime, 0);
  assert.equal(sample('auto_reload_while_firing', 2).state!.inventory[0].reloadTime, 3);
  assert.equal(sample('auto_reload_while_firing', 2).state!.inventory[0].ammo, 1);
  assert.equal(sample('auto_reload_idle_threshold', 2).state!.shootTimer, -120);
  assert.equal(sample('auto_reload_idle_threshold', 2).state!.inventory[0].reloadTime, 6);
  assert.equal(sample('consumable_preserves_selection', 2).state!.itemCooldowns[1], 101);
  const result = compareEquipmentTrace(records);
  assert.equal(result.status, 'passed'); assert.equal(result.matchedSnapshots, 56);
});
