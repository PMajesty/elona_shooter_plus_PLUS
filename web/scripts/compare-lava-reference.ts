import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { compareLavaTrace } from '../tests/lava-reference-support.ts';

const report = JSON.parse(readFileSync(resolve(process.argv[2] ?? '../.build/oracle/lava-browser-report.json'), 'utf8'));
assert.equal(report.format, 'elona-original-oracle'); assert.equal(report.status, 'passed'); assert.equal(report.repeatable, true);
assert.equal(report.build.status, 'passed'); assert.equal(report.build.all_non_doabc_tag_payloads_identical, true);
assert.equal(report.build.tag_types_and_order_identical, true); assert.equal(report.build.frame_header_identical, true);
assert.equal(report.build.original_sha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
assert.equal(report.runs.length, 2); assert.deepEqual(report.runs[0], report.runs[1]);
const result = compareLavaTrace(report.runs[0]);
writeFileSync(resolve('../.build/oracle/lava-comparison-report.json'), JSON.stringify({
  ...result, referenceRuntime: report.runtime, originalSha256: report.build.original_sha256,
  instrumentedSwfSha256: report.build.output_sha256,
  traceSha256: createHash('sha256').update(JSON.stringify(report.runs[0])).digest('hex'),
  collisionSourceSha256: createHash('sha256').update(readFileSync(new URL('../src/collision.ts', import.meta.url))).digest('hex'),
  coordinateReference: 'Full global f32 inverse; inverse translation and point multiplication round separately to nearest twip, ties to even. Independently inspected Ruffle source commit bad2f8fbc6e7c1ae741b664034ad19e4ad8af9d0; captured runtime @ruffle-rs/ruffle 0.7.1.',
  checks: ['Production spawn, alert, moving suicide attack, knockback cancellation and ordinary death',
    'Exact state, damage and RNG after direct original damage inputs', 'Production source-contour collision including attack/death shadow history'],
  limits: ['Explicit AI then child then existing effect order; native scheduling and browser pixels are not asserted',
    'Parent hit-particle bounds, frame/offset/alpha and clamp consequences are compared; they remain outside mc collision geometry',
    'Direct damage fixtures are controlled method inputs, not complete firing volleys or acquisition scenarios',
    'Integer geometry grids do not establish every fractional transform or the reported late-game hitbox defect'],
}, null, 2) + '\n');
console.log(JSON.stringify({ status: result.status, matchedSnapshots: result.matchedSnapshots, comparedSnapshots: result.comparedSnapshots,
  matchedGeometryGrids: result.matchedGeometryGrids, comparedGeometryPoints: result.comparedGeometryPoints,
  transientBounds: result.transientBounds.length, sourceErrors: result.sourceErrors,
  failures: result.comparisons.filter(row => !row.matched).slice(0, 12),
  geometryFailures: result.geometryComparisons.filter(row => !row.matched).map(row => ({ ...row, mismatches: row.mismatches.slice(0, 6) })) }, null, 2));
assert.equal(result.status, 'passed', 'Lava differs; inspect lava-comparison-report.json.');
