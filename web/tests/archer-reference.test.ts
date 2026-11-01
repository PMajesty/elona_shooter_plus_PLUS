import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { compareArcherTrace, type ArcherReferenceRecord } from './archer-reference-support.ts';
import { advanceEnemyArrow } from '../src/enemy-arrows.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-archer-trace.json', import.meta.url), 'utf8'));
const records = fixture.records as ArcherReferenceRecord[];

test('Archer spawn, 512 manual steps, display widths and six collision grids match the captured original', () => {
  assert.equal(fixture.format, 'elona-original-archer-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  assert.equal(fixture.instrumentedSwfSha256, '5b7907f3529e19970a9a12e7e80998089c248dda93ee4d57d3d0656450b3054a');
  assert.equal(createHash('sha256').update(JSON.stringify(records)).digest('hex'), fixture.traceSha256);
  const result = compareArcherTrace(records);
  assert.equal(result.status, 'passed');
  assert.equal(result.matchedSnapshots, 517);
  assert.equal(result.matchedGeometryGrids, 6);
  assert.equal(result.comparedGeometryPoints, 24576);
  assert.deepEqual(result.sourceErrors, []);
});

test('the source trace preserves release-time damage, missing-label fallback and the changing left clamp', () => {
  const sample = (scenario: string, step: number) => records.find(record => record.scenario === scenario && record.step === step)!;
  const release = sample('opening_counter', 151), next = sample('opening_counter', 152);
  assert.equal(release.enemy!.frame, 59);
  assert.equal(release.castleHp, 37);
  assert.equal(release.arrows![0].age, 0);
  assert.equal(next.enemy!.frame, 2);
  assert.equal(next.error, '');
  assert.equal(next.enemy!.speed, next.enemy!.speedOrg);
  assert.equal(next.arrows![0].age, 1);
  const edge = sample('left_edge_knockback', 1), changed = sample('left_edge_knockback', 5);
  assert.equal(edge.enemy!.x, -20.7);
  assert.equal(changed.enemy!.width, 21.95);
  assert.equal(changed.enemy!.x, -20.7);
  assert.equal(sample('left_edge_knockback', 7).enemy!.x, -21.95);
  const dead = sample('death_stop', 40);
  assert.equal(dead.enemy!.frame, 125);
  assert.equal(dead.enemy!.deathTicks, 40);
  assert.equal(dead.arrows!.length, 0);
});

test('the independent Archer trace detects an arrow movement regression without changing expected data', () => {
  const result = compareArcherTrace(records, { advanceArrow: arrow => {
    advanceEnemyArrow(arrow);
    arrow.x -= 1;
  } });
  assert.equal(result.status, 'failed');
  assert.ok(result.comparisons.some(row => row.differences.some(diff => diff.field === 'arrows')));
  assert.equal(result.matchedGeometryGrids, 6);
});
