import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { comparePreparedWaveTrace } from '../tests/prepared-wave-reference-support.ts';

const report = JSON.parse(readFileSync(resolve(process.argv[2] ?? '../.build/oracle/prepared-waves-browser-report.json'), 'utf8'));
assert.equal(report.format, 'elona-original-oracle'); assert.equal(report.status, 'passed'); assert.equal(report.repeatable, true);
assert.equal(report.build.status, 'passed'); assert.equal(report.build.all_non_doabc_tag_payloads_identical, true);
assert.equal(report.build.tag_types_and_order_identical, true); assert.equal(report.build.frame_header_identical, true);
assert.equal(report.build.source_generation_methods_unmodified, true); assert.equal(report.build.rest_dialog_excluded, true);
assert.equal(report.build.original_sha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
assert.equal(report.runs.length, 2); assert.deepEqual(report.runs[0], report.runs[1]);
const result = comparePreparedWaveTrace(report.runs[0]);
const output = {
  status: result.status, referenceRuntime: report.runtime,
  originalSha256: report.build.original_sha256, instrumentedSwfSha256: report.build.output_sha256,
  traceSha256: createHash('sha256').update(JSON.stringify(report.runs[0])).digest('hex'),
  checks: ['Mission level1 prepared on calendar day1 and waves generated on calendar day2', 'Full mission state before/after waves, including retained special loot', 'Original enemy ID arrays, initial counts and fractional spawn delays', 'Preparation and final RNG draw count/state'],
  matchedSnapshots: result.matchedSnapshots, comparisons: result.comparisons,
  limits: ['Normal default low-level mission with no medals or party bonuses', 'Synchronous source generation only; Rest dialog, live spawning, enemy scaling and combat need separate integration checks', 'No regeneration on Rest: the existing prepared mission is consumed'],
};
writeFileSync(resolve('../.build/oracle/prepared-waves-comparison-report.json'), JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({ status: result.status, matchedSnapshots: result.matchedSnapshots, failures: result.comparisons.filter(row => !row.matched).map(({ differences, ...row }) => ({ ...row, differingFields: differences.map(difference => difference.field) })) }, null, 2));
assert.equal(result.status, 'passed', 'Prepared waves differ; inspect .build/oracle/prepared-waves-comparison-report.json.');
