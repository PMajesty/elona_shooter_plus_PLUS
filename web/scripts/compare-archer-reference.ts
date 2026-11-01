import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { compareArcherTrace } from '../tests/archer-reference-support.ts';

const report = JSON.parse(readFileSync(resolve(process.argv[2] ?? '../.build/oracle/archer-browser-report.json'), 'utf8'));
assert.equal(report.format, 'elona-original-oracle'); assert.equal(report.status, 'passed'); assert.equal(report.repeatable, true);
assert.equal(report.build.status, 'passed'); assert.equal(report.build.all_non_doabc_tag_payloads_identical, true);
assert.equal(report.build.tag_types_and_order_identical, true); assert.equal(report.build.frame_header_identical, true);
assert.equal(report.build.original_sha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
assert.equal(report.runs.length, 2); assert.deepEqual(report.runs[0], report.runs[1]);
const result = compareArcherTrace(report.runs[0]);
writeFileSync(resolve('../.build/oracle/archer-comparison-report.json'), JSON.stringify({
  ...result, referenceRuntime: report.runtime, originalSha256: report.build.original_sha256,
  instrumentedSwfSha256: report.build.output_sha256,
  traceSha256: createHash('sha256').update(JSON.stringify(report.runs[0])).digest('hex'),
  checks: ['Production spawn and enemy stepping', 'Movement/attack/knockback/death frames and flags', 'Source-derived display widths and left-edge knockback clamp', 'Castle HP and exact RNG accounting', 'Production arrow motion and removal', 'Six original vector-hit grids'],
  limits: ['Explicit manual AI/child-frame/prior-arrow order; native timeline scheduling is not asserted', 'No intentional differences or exception exemptions; original missing stand label resolves to frame1 without an exception in the captured runtime', 'Six contour grids sample collision geometry; they do not establish late-game hitbox or rendering equivalence'],
}, null, 2) + '\n');
console.log(JSON.stringify({ status: result.status, matchedSnapshots: result.matchedSnapshots, matchedGeometryGrids: result.matchedGeometryGrids, sourceErrors: result.sourceErrors,
  failures: result.comparisons.filter(row => !row.matched).slice(0, 8), geometryFailures: result.geometryComparisons.filter(row => !row.matched).map(row => ({ ...row, mismatches: row.mismatches.slice(0, 5) })) }, null, 2));
assert.equal(result.status, 'passed', 'Archer behavior differs; inspect archer-comparison-report.json.');
