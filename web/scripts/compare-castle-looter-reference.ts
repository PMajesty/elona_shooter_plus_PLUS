import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { compareCastleLooterTrace } from '../tests/castle-looter-reference-support.ts';

const reportPath = process.argv.slice(2).find(argument => !argument.startsWith('--')) ?? '../.build/oracle/castle-looter-browser-report.json';
const report = JSON.parse(readFileSync(resolve(reportPath), 'utf8'));
assert.equal(report.format, 'elona-original-oracle'); assert.equal(report.status, 'passed'); assert.equal(report.repeatable, true);
assert.equal(report.build.status, 'passed'); assert.equal(report.build.all_non_doabc_tag_payloads_identical, true);
assert.equal(report.build.tag_types_and_order_identical, true); assert.equal(report.build.frame_header_identical, true);
assert.equal(report.build.original_method_logic_preserved, true);
assert.equal(report.build.original_sha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
assert.equal(report.runs.length, 2); assert.deepEqual(report.runs[0], report.runs[1]);
const result = compareCastleLooterTrace(report.runs[0]);
const evidence = { ...result, referenceRuntime: report.runtime, originalSha256: report.build.original_sha256,
  instrumentedSwfSha256: report.build.output_sha256,
  traceSha256: createHash('sha256').update(JSON.stringify(report.runs[0])).digest('hex'),
  checks: ['Actual tile5 purchases at AP0, insufficient/exact payment, sequential levels and no cap at12',
    'Price, upkeep, live multiplier, unchanged owned items/prepared town/settled result and zero purchase RNG',
    'Actual ordinary/boss generation with exact pre-floor integer budgets, modes, every RNG draw and all33 item fields',
    'Guaranteed ordinary drops and shop generation controls unaffected; final buy/sale values use ordinary valuation',
    'Retained inactive item metadata and current live Looter level passed through both Simulation reward boundaries'],
  limits: ['Controlled generation and original town input; complete native battle/result scheduling and browser purchases are separate',
    'Shop comparison projects actual prepareEarlyTown through the third randomItem call; later cards/mission/recruit draws are outside original generateShop boundary',
    'Current default weapon-level and boss-drop options, Engineer0 and no modding medal; other options have separate existing generation references',
    'Looter raises a generator budget, not a guarantee that each item improves; integer rounding, minimum500 and random acceptance remain observable',
    'No artificial gameplay cap is asserted; source signed-int overflow at extreme unreachable prices is outside these level0..13 captures'],
};
writeFileSync(resolve('../.build/oracle/castle-looter-comparison-report.json'), JSON.stringify(evidence, null, 2) + '\n');
console.log(JSON.stringify({ status: result.status, matchedSnapshots: result.matchedSnapshots, observedSnapshots: result.observedSnapshots,
  failures: result.comparisons.filter(row => !row.matched) }, null, 2));
assert.equal(result.status, 'passed', 'Looter purchases or reward generation differ from the original trace.');
if (process.argv.includes('--accept')) writeFileSync(resolve('tests/fixtures/original-castle-looter-trace.json'), JSON.stringify({
  format: 'elona-original-castle-looter-trace', version: 1, originalSha256: evidence.originalSha256,
  instrumentedSwfSha256: evidence.instrumentedSwfSha256, traceSha256: evidence.traceSha256,
  runtime: report.runtime, capturedAt: report.capturedAt, boundary: report.build.boundary,
  limits: evidence.limits, records: report.runs[0],
}, null, 2) + '\n');
