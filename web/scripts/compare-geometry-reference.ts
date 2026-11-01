import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ordinaryEnemyHit, type OrdinaryEnemyKind, type CollisionGeometry } from '../src/collision.ts';

const reportPath = resolve(process.argv[2] ?? '../.build/oracle/geometry-browser-report.json');
const outputPath = resolve(process.argv[3] ?? '../.build/oracle/geometry-comparison-report.json');
const geometryPath = resolve(process.argv[4] ?? 'public/assets/collision-geometry.json');
const report = JSON.parse(readFileSync(reportPath, 'utf8'));
assert.equal(report.format, 'elona-original-oracle');
assert.equal(report.status, 'passed');
assert.equal(report.repeatable, true);
assert.equal(report.build.status, 'passed');
assert.equal(report.build.all_non_doabc_tag_payloads_identical, true);
assert.equal(report.runs.length, 2);
assert.deepEqual(report.runs[0], report.runs[1], 'Reference runs differ');
const geometry = JSON.parse(readFileSync(geometryPath, 'utf8')) as CollisionGeometry;
assert.equal(geometry.version, 1);
assert.equal(geometry.units, 'twips');
assert.equal(geometry.sourceSha256, report.build.original_sha256);
const kinds: Record<number, OrdinaryEnemyKind> = { 3: 'sheep', 17: 'rat', 19: 'chicken', 6: 'crow' };
const comparisons = [];
let total = 0, falsePositives = 0, falseNegatives = 0;
for (const snapshot of report.runs[0].filter((record: { type: string }) => record.type === 'snapshot')) {
  const kind = kinds[snapshot.enemyId]; assert.ok(kind, `Unsupported enemy ${snapshot.enemyId}`);
  const { grid } = snapshot;
  assert.equal(grid.step, 1);
  const count = grid.width * grid.height;
  for (const key of ['bodyBits', 'shadowBits', 'combinedBits']) {
    assert.equal(snapshot[key].length, count); assert.match(snapshot[key], /^[01]+$/);
  }
  // Берём действительную позицию Flash: отдельное округление координат здесь исказило бы опыт.
  const enemy = { kind, frame: snapshot.frame, x: snapshot.position.x, y: snapshot.position.y };
  assert.deepEqual(snapshot.rootPosition, { x: 0, y: 0 }, 'Oracle root transform must be identity');
  const mismatches = [];
  let expectedHits = 0, actualHits = 0, extra = 0, missing = 0;
  for (let i = 0; i < count; i++) {
    const x = grid.x + i % grid.width, y = grid.y + Math.floor(i / grid.width);
    const expected = snapshot.combinedBits[i] === '1';
    assert.equal(expected, snapshot.bodyBits[i] === '1' && !(snapshot.shadowHit === false && snapshot.shadowBits[i] === '1'));
    // Этот же помощник вызывается main.ts; эталонные биты не участвуют в расчёте порта.
    const actual = ordinaryEnemyHit(enemy, x, y, geometry);
    expectedHits += Number(expected); actualHits += Number(actual);
    if (expected !== actual) {
      extra += Number(actual); missing += Number(expected);
      mismatches.push({ x, y, expected, actual, originalBody: snapshot.bodyBits[i] === '1', originalShadow: snapshot.shadowBits[i] === '1' });
    }
  }
  total += count; falsePositives += extra; falseNegatives += missing;
  comparisons.push({ enemyId: snapshot.enemyId, kind, requestedFrame: snapshot.requestedFrame, frame: snapshot.frame,
    requestedPosition: snapshot.requestedPosition, position: snapshot.position, shadowHit: snapshot.shadowHit,
    grid, points: count, expectedHits, actualHits, falsePositives: extra, falseNegatives: missing, mismatches });
}
assert.ok(comparisons.length > 0, 'No geometry observations');
const output = {
  status: falsePositives + falseNegatives === 0 ? 'passed' : 'mismatch', referenceRuntime: report.runtime,
  originalSha256: report.build.original_sha256, instrumentedSwfSha256: report.build.output_sha256,
  traceSha256: createHash('sha256').update(JSON.stringify(report.runs[0])).digest('hex'),
  geometrySha256: createHash('sha256').update(readFileSync(geometryPath)).digest('hex'),
  productionHelperSha256: createHash('sha256').update(readFileSync(resolve('src/collision.ts'))).digest('hex'),
  cases: comparisons.length, comparedPoints: total, falsePositives, falseNegatives,
  limits: ['Exact sampled world points only; unsampled points and frames remain unproven', 'Ruffle original-SWF runtime, not a native Adobe Flash Player capture', 'Boss OriginalAlly and dropping-rat geometry are outside this comparison', 'Edge mismatches remain failures; no tolerance or oracle-derived geometry substitution'],
  comparisons,
};
writeFileSync(outputPath, JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({ ...output, comparisons: comparisons.map(({ mismatches, ...summary }) => summary) }, null, 2));
if (output.status !== 'passed') process.exitCode = 1;
