import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { comparePartyProgressionTrace } from '../tests/party-progression-reference-support.ts';

const report = JSON.parse(readFileSync(process.argv[2] ?? '../.build/oracle/party-progression-browser-report.json', 'utf8'));
assert.equal(report.status, 'passed'); assert.equal(report.repeatable, true);
assert.equal(report.build.status, 'passed'); assert.equal(report.build.original_method_logic_preserved, true);
assert.equal(report.build.all_non_doabc_tag_payloads_identical, true); assert.equal(report.build.tag_types_and_order_identical, true);
assert.equal(report.build.frame_header_identical, true);
assert.equal(report.build.original_sha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
assert.equal(report.runs.length, 2); assert.deepEqual(report.runs[0], report.runs[1]);
const result = comparePartyProgressionTrace(report.runs[0]);
writeFileSync('../.build/oracle/party-progression-comparison-report.json', JSON.stringify({ ...result,
  instrumentedSwfSha256: report.build.output_sha256,
  traceSha256: createHash('sha256').update(JSON.stringify(report.runs[0])).digest('hex'),
  limits: ['Controlled original method calls do not establish live battle scheduling or complete class behavior.', 'Party effects are captured at the original explicit initialization boundary and remain cached during skill selection.'],
}, null, 2) + '\n');
console.log(JSON.stringify({ status: result.status, matchedSnapshots: result.matchedSnapshots, failures: result.comparisons.filter(row => !row.matched) }, null, 2));
assert.equal(result.status, 'passed');
