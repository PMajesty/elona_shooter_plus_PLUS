import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { compareLootModTrace } from '../tests/loot-mod-reference-support.ts';

const reportPath = process.argv.slice(2).find(argument => !argument.startsWith('--')) ?? '../.build/oracle/loot-mod-browser-report.json';
const report = JSON.parse(readFileSync(resolve(reportPath), 'utf8'));
assert.equal(report.format, 'elona-original-oracle'); assert.equal(report.status, 'passed'); assert.equal(report.repeatable, true);
assert.equal(report.build.status, 'passed'); assert.equal(report.build.all_non_doabc_tag_payloads_identical, true);
assert.equal(report.build.tag_types_and_order_identical, true); assert.equal(report.build.frame_header_identical, true);
assert.equal(report.build.original_method_logic_preserved, true);
assert.equal(report.build.original_sha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
assert.equal(report.runs.length, 2); assert.deepEqual(report.runs[0], report.runs[1]);
const result = compareLootModTrace(report.runs[0]);
const evidence = { ...result, referenceRuntime: report.runtime, originalSha256: report.build.original_sha256,
  instrumentedSwfSha256: report.build.output_sha256,
  traceSha256: createHash('sha256').update(JSON.stringify(report.runs[0])).digest('hex'),
  checks: ['Actual ordinary/boss loot inventory drag and result Yes/No/outside shape clicks',
    'All four offered/owned directions, original owned slot35, reverse gun-to-MOD plain swap',
    'All33 fields: preview unchanged, confirmation enchant and retained consumed MOD, No complete-record swap',
    'Full-capacity, ammo/reloading, automatic-reload and duplicate-Living guards; new Living and cached Engineer repeated Damage',
    'Unchanged gold/AP/totalMoney, exact shared RNG, reward stage and party/result invariants'],
  limits: ['Controlled item setup and synchronous original methods; loot generation, native result scheduling and actual browser drag are separate',
    'Popup warning text/count is recorded from the original; production outcomes compare its meaning, not every duplicated popup/audio cue',
    'Cached Engineer25 is an explicit method input; acquiring that party skill is outside this capture',
    'Save persistence, modal lock integration and connected reward collection require separate runtime/browser checks'],
};
writeFileSync(resolve('../.build/oracle/loot-mod-comparison-report.json'), JSON.stringify(evidence, null, 2) + '\n');
console.log(JSON.stringify({ status: result.status, matchedSnapshots: result.matchedSnapshots, observedSnapshots: result.observedSnapshots,
  failures: result.comparisons.filter(row => !row.matched) }, null, 2));
assert.equal(result.status, 'passed', 'Loot MOD transactions differ from the original trace.');
if (process.argv.includes('--accept')) writeFileSync(resolve('tests/fixtures/original-loot-mod-trace.json'), JSON.stringify({
  format: 'elona-original-loot-mod-trace', version: 1, originalSha256: evidence.originalSha256,
  instrumentedSwfSha256: evidence.instrumentedSwfSha256, traceSha256: evidence.traceSha256,
  runtime: report.runtime, capturedAt: report.capturedAt, boundary: report.build.boundary,
  limits: evidence.limits, records: report.runs[0],
}, null, 2) + '\n');
