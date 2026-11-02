import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { comparePartyHiringTrace } from '../tests/party-hiring-reference-support.ts';

const report = JSON.parse(readFileSync(resolve(process.argv[2] ?? '../.build/oracle/party-hiring-browser-report.json'), 'utf8'));
assert.equal(report.format, 'elona-original-oracle'); assert.equal(report.status, 'passed'); assert.equal(report.repeatable, true);
assert.equal(report.build.status, 'passed'); assert.equal(report.build.all_non_doabc_tag_payloads_identical, true);
assert.equal(report.build.tag_types_and_order_identical, true); assert.equal(report.build.frame_header_identical, true);
assert.equal(report.build.original_method_logic_preserved, true);
assert.equal(report.build.original_sha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
assert.equal(report.runs.length, 2); assert.deepEqual(report.runs[0], report.runs[1]);
const result = comparePartyHiringTrace(report.runs[0]);
writeFileSync(resolve('../.build/oracle/party-hiring-comparison-report.json'), JSON.stringify({
  ...result, referenceRuntime: report.runtime, originalSha256: report.build.original_sha256,
  instrumentedSwfSha256: report.build.output_sha256,
  traceSha256: createHash('sha256').update(JSON.stringify(report.runs[0])).digest('hex'),
  checks: ['Nine original generated classes: exact-cost/AP0 hire, cancel, dismissal',
    'Money, house capacity and three-companion guards through actual original town handler',
    'All recorded persistent character fields, five physical slots and all33 item fields including inactive metadata',
    'Candidate45 swap and retained Militia47/48; dismissal and rehire',
    'Ally MOD cancellation/confirmation and incompatible reverse swaps', 'Zero transaction RNG, unchanged totalMoney/AP'],
  limits: ['Original generation outputs are controlled transaction inputs; generation has separate accepted reference suites',
    'Transient companion AI columns, native scheduling, combat and automatic progression are outside this transaction reference',
    'Input seams supply mouse position and inventory objects-under-point; original guard/dialog/transaction bodies remain unchanged',
    'UI rendering and actual browser interaction require separate validation'],
}, null, 2) + '\n');
console.log(JSON.stringify({ status: result.status, observedSnapshots: result.observedSnapshots,
  comparedSnapshots: result.comparedSnapshots, matchedSnapshots: result.matchedSnapshots,
  failures: result.comparisons.filter(row => !row.matched) }, null, 2));
assert.equal(result.status, 'passed', 'Party hiring differs from original transaction trace.');
