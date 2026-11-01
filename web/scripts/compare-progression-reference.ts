import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { compareProgressionTrace } from '../tests/progression-reference-support.ts';

const report = JSON.parse(readFileSync(resolve(process.argv[2] ?? '../.build/oracle/progression-browser-report.json'), 'utf8'));
assert.equal(report.format, 'elona-original-oracle'); assert.equal(report.status, 'passed'); assert.equal(report.repeatable, true);
assert.equal(report.build.status, 'passed'); assert.equal(report.build.all_non_doabc_tag_payloads_identical, true);
assert.equal(report.build.original_sha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
assert.equal(report.runs.length, 2); assert.deepEqual(report.runs[0], report.runs[1]);
const result = compareProgressionTrace(report.runs[0]);
const output = {
  status: result.status, referenceRuntime: report.runtime,
  originalSha256: report.build.original_sha256, instrumentedSwfSha256: report.build.output_sha256,
  traceSha256: createHash('sha256').update(JSON.stringify(report.runs[0])).digest('hex'),
  checks: ['Original Sheriff class choice order and eligible pool', 'Level2 listTrait2 choices at three seeds and Capable0/1/2', 'All15 current/next effect descriptions and preview labels', 'Trait requirements, maximum levels and raw CALC values', 'RNG draw count and final state'],
  matchedSnapshots: result.matchedSnapshots, comparisons: result.comparisons,
  limits: ['Controlled Sheriff level2 trait state; prior character growth and RNG are outside this boundary', 'Focus is disabled; other classes and the 2000-retry fallback are not exercised', 'Original current REF labels and category/max-label metadata are captured but are not compared by the current screen adapter', 'This comparison does not operate original radio buttons or apply a choice'],
};
writeFileSync(resolve('../.build/oracle/progression-comparison-report.json'), JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({ status: result.status, matchedSnapshots: result.matchedSnapshots, failures: result.comparisons.filter(row => !row.matched).map(({ differences, ...row }) => ({ ...row, differingFields: differences.map(difference => difference.field) })) }, null, 2));
assert.equal(result.status, 'passed', 'Progression differs; inspect .build/oracle/progression-comparison-report.json.');
