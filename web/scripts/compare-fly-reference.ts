import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { compareFlyTrace } from '../tests/fly-reference-support.ts';

const report = JSON.parse(readFileSync(resolve(process.argv[2] ?? '../.build/oracle/fly-browser-report.json'), 'utf8'));
assert.equal(report.format, 'elona-original-oracle'); assert.equal(report.status, 'passed'); assert.equal(report.repeatable, true);
assert.equal(report.build.status, 'passed'); assert.equal(report.build.all_non_doabc_tag_payloads_identical, true);
assert.equal(report.build.tag_types_and_order_identical, true); assert.equal(report.build.frame_header_identical, true);
assert.equal(report.build.original_sha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
assert.equal(report.runs.length, 2); assert.deepEqual(report.runs[0], report.runs[1]);
const result = compareFlyTrace(report.runs[0]);
writeFileSync(resolve('../.build/oracle/fly-comparison-report.json'), JSON.stringify({
  ...result, referenceRuntime: report.runtime, originalSha256: report.build.original_sha256,
  instrumentedSwfSha256: report.build.output_sha256,
  traceSha256: createHash('sha256').update(JSON.stringify(report.runs[0])).digest('hex'),
  checks: ['Production Fly spawn, movement, pause counter, left clamp, castle exit and death/removal',
    'Exact fresh and explicit source field-reset states/RNG', 'Raw reused counter/resistance retained separately',
    'Production filled-contour body and combined shadow-exclusion predicates over full body/shadow grids'],
  limits: ['Explicit AI then child-frame order; native scheduling and browser pixels are not asserted',
    'Port intentionally initializes Fly counter0/resistance1; raw pooled state is not claimed as parity',
    'Corrected expected observations come from original methods after two named input-field resets, never from port output',
    'Eight integer-position geometry grids do not establish all fractional transforms or late-game hitbox equivalence'],
}, null, 2) + '\n');
console.log(JSON.stringify({ status: result.status, matchedSnapshots: result.matchedSnapshots, comparedSnapshots: result.comparedSnapshots,
  rawReuseSnapshots: result.rawReuseSnapshots, matchedGeometryGrids: result.matchedGeometryGrids, comparedGeometryPoints: result.comparedGeometryPoints,
  sourceErrors: result.sourceErrors, failures: result.comparisons.filter(row => !row.matched).slice(0, 8),
  geometryFailures: result.geometryComparisons.filter(row => !row.matched).map(row => ({ ...row, mismatches: row.mismatches.slice(0, 6) })) }, null, 2));
assert.equal(result.status, 'passed', 'Fly differs; inspect fly-comparison-report.json.');
