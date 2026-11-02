import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { compareCastleUpgradesTrace } from '../tests/castle-upgrades-reference-support.ts';

const reportPath = process.argv.slice(2).find(argument => !argument.startsWith('--')) ?? '../.build/oracle/castle-upgrades-browser-report.json';
const report = JSON.parse(readFileSync(resolve(reportPath), 'utf8'));
assert.equal(report.format, 'elona-original-oracle'); assert.equal(report.status, 'passed'); assert.equal(report.repeatable, true);
assert.equal(report.build.status, 'passed'); assert.equal(report.build.all_non_doabc_tag_payloads_identical, true);
assert.equal(report.build.tag_types_and_order_identical, true); assert.equal(report.build.frame_header_identical, true);
assert.equal(report.build.original_method_logic_preserved, true);
assert.equal(report.build.original_sha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
assert.equal(report.runs.length, 2); assert.deepEqual(report.runs[0], report.runs[1]);
const result = compareCastleUpgradesTrace(report.runs[0]);
const evidence = {
  ...result, referenceRuntime: report.runtime, originalSha256: report.build.original_sha256,
  instrumentedSwfSha256: report.build.output_sha256,
  traceSha256: createHash('sha256').update(JSON.stringify(report.runs[0])).digest('hex'),
  checks: ['Actual original Castle tile shape hits and MouseLDownFunc_town guards',
    'House exact-price buys, insufficient gold, level3 cap and repeated purchase',
    'Wall exact-price buys, insufficient gold, preserved damage deficit and repeated prices',
    'Independent Wall level and maximumHP with source-compatible41MHP price truncation',
    'Gold, AP0, totalMoney, zero transaction RNG, upkeep and tile names/costs/availability',
    'Production transaction leaves prepared town, party members, cached party bonuses and settled result unchanged'],
  limits: ['Ten controlled town inputs follow actual continued-town71 initialization; fresh town generation and gameplay earnings are excluded',
    'The41MHP input models the original Search reward effect, but does not implement or test the Search action',
    'House and Wall purchases only; Fix Wall, other castle upgrades and expanded-party live combat are separate',
    'Mouse coordinates are a test seam; browser clicks, rendering and save migration require separate validation'],
};
writeFileSync(resolve('../.build/oracle/castle-upgrades-comparison-report.json'), JSON.stringify(evidence, null, 2) + '\n');
console.log(JSON.stringify({ status: result.status, observedSnapshots: result.observedSnapshots,
  inputSnapshots: result.inputSnapshots, transactionSnapshots: result.transactionSnapshots, matchedSnapshots: result.matchedSnapshots,
  failures: result.comparisons.filter(row => !row.matched) }, null, 2));
assert.equal(result.status, 'passed', 'Castle upgrades differ from original tile transaction trace.');
if (process.argv.includes('--accept')) {
  writeFileSync(resolve('tests/fixtures/original-castle-upgrades-trace.json'), JSON.stringify({
    format: 'elona-original-castle-upgrades-trace', version: 1, originalSha256: evidence.originalSha256,
    instrumentedSwfSha256: evidence.instrumentedSwfSha256, traceSha256: evidence.traceSha256,
    runtime: report.runtime, capturedAt: report.capturedAt, boundary: report.build.boundary,
    limits: evidence.limits, records: report.runs[0],
  }, null, 2) + '\n');
}
