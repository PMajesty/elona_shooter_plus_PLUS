import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { compareBossAiTrace, type BossAiReferenceRecord } from './boss-ai-reference-support.ts';
import type { EnemyState } from '../src/simulation.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-boss-ai-trace.json', import.meta.url), 'utf8'));
const records = fixture.records as BossAiReferenceRecord[];

test('boss facing, shield, animation and guarded hits match 305 captured original observations', () => {
  assert.equal(fixture.format, 'elona-original-boss-ai-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  assert.equal(fixture.instrumentedSwfSha256, '4cc75bd86156ddec8a505c3a24336e2c38d4a68457df5336e30d87e389e0a750');
  assert.equal(createHash('sha256').update(JSON.stringify(records)).digest('hex'), fixture.traceSha256);
  const result = compareBossAiTrace(records);
  assert.equal(result.status, 'passed'); assert.equal(result.matchedObservations, 305);
  assert.equal(result.stateSnapshots, 301); assert.equal(result.guardedHitCases, 4);
  assert.deepEqual(result.sourceErrors, []);
});

test('source shield retains entry facing, stops at236 and applies guard before damage accounting', () => {
  const sample = (scenario: string, step: number) => records.find(row => row.scenario === scenario && row.step === step)!.enemy!;
  const entry = sample('shield_entry_exit', 1), turn = sample('shield_entry_exit', 2);
  assert.equal(entry.action, 6); assert.equal(entry.facing, 1); assert.equal(entry.frame, 222);
  assert.equal(turn.facing, -1); assert.equal(turn.speed, 0);
  const held = sample('shield_entry_exit', 15);
  assert.equal(held.frame, 236); assert.equal(held.bodyFrame, 514); assert.equal(held.playing, false);
  assert.equal(sample('shield_entry_exit', 102).action, 2);
  assert.equal(sample('shield_entry_exit', 103).frame, 24);
  for (const [name, damage, draws] of [['pellet_guard', 5, 1], ['pellet_open', 45, 3], ['explosion_guard', 5, 2], ['explosion_open', 45, 4]] as const) {
    const hit = records.find(row => row.scenario === name)!;
    assert.equal(hit.before!.hp - hit.after!.hp, damage);
    assert.equal(hit.after!.damage, damage);
    assert.equal(hit.drawCount, draws);
  }
});

test('the independent boss trace rejects the old always-right-facing renderer state', () => {
  const result = compareBossAiTrace(records, { step: (simulation, enemy) => {
    (simulation as unknown as { tickEnemy(value: EnemyState): void }).tickEnemy(enemy);
    enemy.bossFacing = -1;
  } });
  assert.equal(result.status, 'failed');
  assert.ok(result.comparisons.some(row => row.scenario === 'backward_walk' && !row.matched));
});
