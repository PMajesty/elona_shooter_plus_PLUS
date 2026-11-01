import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { compareRestTrace } from '../tests/rest-reference-support.ts';

const report = JSON.parse(readFileSync(resolve(process.argv[2] ?? '../.build/oracle/rest-browser-report.json'), 'utf8'));
assert.equal(report.format, 'elona-original-oracle'); assert.equal(report.status, 'passed'); assert.equal(report.repeatable, true);
assert.equal(report.build.status, 'passed'); assert.equal(report.build.all_non_doabc_tag_payloads_identical, true);
assert.equal(report.build.tag_types_and_order_identical, true); assert.equal(report.build.frame_header_identical, true);
assert.equal(report.build.original_transition_methods_unmodified, true);
assert.equal(report.build.original_sha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
assert.equal(report.runs.length, 2); assert.deepEqual(report.runs[0], report.runs[1]);
const result = compareRestTrace(report.runs[0]);
writeFileSync(resolve('../.build/oracle/rest-comparison-report.json'), JSON.stringify({
  ...result, referenceRuntime: report.runtime, originalSha256: report.build.original_sha256,
  instrumentedSwfSha256: report.build.output_sha256, traceSha256: createHash('sha256').update(JSON.stringify(report.runs[0])).digest('hex'),
  checks: ['Actual production startNextDay from original controlled prepared-town inputs', 'HP/gold/AP retained and calendar/selected slot advanced', 'Item instance fields, gun refills and remaining consumable charges', 'Player shot/recoil/rampage resets, mission parameters, waves and exact RNG', 'Repeated Rest rejected without replaying the mission'],
  limits: ['Three transition outcomes compared against twelve original observations; original dialog and acknowledgment intermediate states are captured but port DOM timing needs browser validation', 'Unused null slots normalize original undefined metadata and the newly assigned reloadTime0; all initialized item metadata is compared', 'Source resultTaken, burst/frenzy/idleCount and non-modeled mission fields are recorded but absent from the current model comparison', 'Normal solo play without hired companions, Hardcore deletion or purchased sisters'],
}, null, 2) + '\n');
console.log(JSON.stringify({ status: result.status, sourceSnapshots: result.sourceSnapshots, matchedTransitions: result.matchedTransitions, failures: result.comparisons.filter(row => !row.matched) }, null, 2));
assert.equal(result.status, 'passed', 'Rest differs; inspect its comparison report.');
