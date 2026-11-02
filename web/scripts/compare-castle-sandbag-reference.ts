import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { compareCastleSandbagTrace } from '../tests/castle-sandbag-reference-support.ts';

const reportPath = process.argv.slice(2).find(argument => !argument.startsWith('--')) ?? '../.build/oracle/castle-sandbag-browser-report.json';
const report = JSON.parse(readFileSync(resolve(reportPath), 'utf8'));
assert.equal(report.format, 'elona-original-oracle'); assert.equal(report.status, 'passed'); assert.equal(report.repeatable, true);
assert.equal(report.build.status, 'passed'); assert.equal(report.build.all_non_doabc_tag_payloads_identical, true);
assert.equal(report.build.tag_types_and_order_identical, true); assert.equal(report.build.frame_header_identical, true);
assert.equal(report.build.original_method_logic_preserved, true);
assert.equal(report.build.original_sha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
assert.equal(report.runs.length, 2); assert.deepEqual(report.runs[0], report.runs[1]);
const result = compareCastleSandbagTrace(report.runs[0]);
const evidence = { ...result, referenceRuntime: report.runtime, originalSha256: report.build.original_sha256,
  instrumentedSwfSha256: report.build.output_sha256,
  traceSha256: createHash('sha256').update(JSON.stringify(report.runs[0])).digest('hex'),
  checks: ['Actual Castle tile2 purchases, affordability, level10 cap, new prices and upkeep',
    'AP0, unchanged totalMoney/HP/prepared town/party cache/settled result and zero purchase RNG',
    'Sandbag0/1/10 and mission absorption0/.01/.02: typed integer input, post-multiply truncation and minimum1',
    'Original nonlethal Guardian retaliation, Insurance before Defender, LastHope and protection guard',
    'Exact shared RNG draws/state, guardian owner/damage and actor rampage state'],
  limits: ['Controlled method calls, explicit party inputs and declared RNG prefixes; not native battle scheduling or earning/acquiring every skill',
    'Guardian target is one original nonlethal Sheep; kill/progression and broader attacker classes have separate references',
    'Town mouse-position seam drives original shape-hit handler; fresh town generation and actual browser clicks are separate',
    'Source order observations and UI descriptions supplement state comparison; visual/audio rendering, save migration and connected battles require separate integration evidence'],
};
writeFileSync(resolve('../.build/oracle/castle-sandbag-comparison-report.json'), JSON.stringify(evidence, null, 2) + '\n');
console.log(JSON.stringify({ status: result.status, matchedSnapshots: result.matchedSnapshots, observedSnapshots: result.observedSnapshots,
  damageCases: result.damageCases, townStartingStates: result.townStartingStates, townTransactions: result.townTransactions,
  failures: result.comparisons.filter(row => !row.matched) }, null, 2));
assert.equal(result.status, 'passed', 'Sandbags differ from original transaction and damage trace.');
if (process.argv.includes('--accept')) writeFileSync(resolve('tests/fixtures/original-castle-sandbag-trace.json'), JSON.stringify({
  format: 'elona-original-castle-sandbag-trace', version: 1, originalSha256: evidence.originalSha256,
  instrumentedSwfSha256: evidence.instrumentedSwfSha256, traceSha256: evidence.traceSha256,
  runtime: report.runtime, capturedAt: report.capturedAt, boundary: report.build.boundary,
  limits: evidence.limits, records: report.runs[0],
}, null, 2) + '\n');
