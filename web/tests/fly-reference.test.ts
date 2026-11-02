import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { compareFlyTrace, type FlyReferenceRecord } from './fly-reference-support.ts';
import type { EnemyState } from '../src/simulation.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-fly-trace.json', import.meta.url), 'utf8'));
const records = fixture.records as FlyReferenceRecord[];
const sample = (scenario: string, step: number) => records.find(row => row.scenario === scenario && row.step === step)!;

test('Fly AI and full body/shadow contours match captured fresh and explicitly reset original cases', () => {
  assert.equal(fixture.format, 'elona-original-fly-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  assert.equal(fixture.instrumentedSwfSha256, '89246db4326950b6b55f5614c31b23b6b1ca5ee4b16c560d572a718e3c5041b9');
  assert.equal(createHash('sha256').update(JSON.stringify(records)).digest('hex'), fixture.traceSha256);
  const result = compareFlyTrace(records);
  assert.equal(result.status, 'passed');
  assert.equal(result.matchedSnapshots, 503); assert.equal(result.comparedSnapshots, 503);
  assert.equal(result.originalSnapshots, 576); assert.equal(result.rawReuseSnapshots, 73);
  assert.equal(result.matchedGeometryGrids, 8); assert.equal(result.comparedGeometryPoints, 81920);
  assert.deepEqual(result.sourceErrors, []);
});

test('raw pooled Fly observations retain counter/resistance leaks separately from explicit original resets', () => {
  for (const [kind, rawCounter, rawResistance] of [
    ['fly', 45, 1], ['sheep', 0, 0.9], ['rat', 0, 1.1], ['boss', 0, 0],
  ] as const) {
    const raw = sample(`reuse_${kind}_raw`, 0), corrected = sample(`reuse_${kind}_corrected`, 0);
    assert.equal(raw.enemy!.counter, rawCounter); assert.equal(raw.enemy!.resKnock, rawResistance);
    assert.equal(corrected.enemy!.counter, 0); assert.equal(corrected.enemy!.resKnock, 1);
    assert.deepEqual(raw.prior, corrected.prior);
    assert.equal(raw.rngState, corrected.rngState); assert.equal(raw.drawCount, corrected.drawCount);
    // В ожидаемых данных остаются оба оригинальных запуска; исправление не подменяет сырой дефект.
    assert.notDeepEqual(raw.enemy, corrected.enemy);
  }
});

test('original Fly stops at counter40, makes its death shadow hittable at23, and removes at the recorded boundary', () => {
  const stopped = sample('counter_boundary', 1).enemy!;
  assert.equal(stopped.counter, 40); assert.equal(stopped.speed, 0); assert.equal(stopped.x, 300);
  const falling = sample('death_fall', 10).enemy!, landed = sample('death_fall', 11).enemy!;
  assert.equal(falling.frame, 22); assert.equal(falling.shadowHit, false);
  assert.equal(landed.frame, 23); assert.equal(landed.shadowHit, true);
  assert.equal(sample('death_fall', 29).enemy!.frame, 41);
  const lastPresent = sample('death_fall', 199).enemy!, removed = sample('death_fall', 200).enemy!;
  assert.equal(lastPresent.frame, 41); assert.equal(lastPresent.deathTicks, 199); assert.equal(lastPresent.removed, false);
  assert.equal(removed.frame, 126); assert.equal(removed.hp, -1); assert.equal(removed.deathTicks, 201); assert.equal(removed.removed, true);
  assert.deepEqual(sample('death_fall', 210).enemy, removed);
  const exit = sample('castle_exit', 1);
  assert.equal(exit.castleHp, 38); assert.equal(exit.enemy!.removed, true);
});

test('the independent Fly trace detects a counter reset that breaks the hovering cycle', () => {
  const result = compareFlyTrace(records, { step: (simulation, enemy) => {
    (simulation as unknown as { tickEnemy(value: EnemyState): void }).tickEnemy(enemy);
    enemy.flyCounter = 0;
  } });
  assert.equal(result.status, 'failed');
  assert.ok(result.comparisons.some(row => row.scenario === 'counter_boundary' && row.step === 1 &&
    row.differences.some(difference => difference.field === 'enemy.counter')));
});
