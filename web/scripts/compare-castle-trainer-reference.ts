import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { compareCastleTrainerTrace } from '../tests/castle-trainer-reference-support.ts';

const reportPath = process.argv.slice(2).find(argument => !argument.startsWith('--')) ?? '../.build/oracle/castle-trainer-browser-report.json';
const report = JSON.parse(readFileSync(resolve(reportPath), 'utf8'));
assert.equal(report.format, 'elona-original-oracle'); assert.equal(report.status, 'passed'); assert.equal(report.repeatable, true);
assert.equal(report.build.status, 'passed'); assert.equal(report.build.all_non_doabc_tag_payloads_identical, true);
assert.equal(report.build.tag_types_and_order_identical, true); assert.equal(report.build.frame_header_identical, true);
assert.equal(report.build.original_method_logic_preserved, true);
assert.equal(report.build.original_sha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
assert.equal(report.runs.length, 2); assert.deepEqual(report.runs[0], report.runs[1]);
const result = compareCastleTrainerTrace(report.runs[0]);
const evidence = { ...result, referenceRuntime: report.runtime, originalSha256: report.build.original_sha256,
  instrumentedSwfSha256: report.build.output_sha256,
  traceSha256: createHash('sha256').update(JSON.stringify(report.runs[0])).digest('hex'),
  checks: ['Actual tile7 purchases at AP0, insufficient/exact payment, sequential levels and a level10→11 no-cap witness',
    'Exact costs, unchanged upkeep/items/prepared town/settled result and zero purchase RNG',
    'Original hero pc typo observation: undefined pc, declared _pc0, Trainer therefore applies to hero and companions',
    'Original procHit, kill XP integer stages, Noble/catchup/critical/mission multiplier and threshold growth before drop RNG',
    'Every sampled RNG draw and final state; inactive/candidate records excluded; weapon XP and daily250 unchanged',
    'Cached party effects remain unchanged after automatic companion skill growth'],
  limits: ['Controlled original procHit and eventAfterBattle calls; native complete combat/result scheduling is separate',
    'Original contour hit is an adapter input, not a new browser geometry parity claim',
    'Source hero SP moved into eventLevel7 queue is compared to equivalent persisted pending skillPoints',
    'Never-created empty slots use null in the port; their original updateAlly-only reloadTime0 is projected to absent metadata, while all generated item fields remain exact',
    'Normal gameplay options and current sister-alive context; casual/tight/search rewards are audited but not enabled by this slice',
    'Purchase levels0..11 are bounded witnesses, not an artificial cap or extreme signed-int overflow claim'],
};
writeFileSync(resolve('../.build/oracle/castle-trainer-comparison-report.json'), JSON.stringify(evidence, null, 2) + '\n');
console.log(JSON.stringify({ status: result.status, matchedSnapshots: result.matchedSnapshots, observedSnapshots: result.observedSnapshots,
  failures: result.comparisons.filter(row => !row.matched) }, null, 2));
assert.equal(result.status, 'passed', 'Trainer purchases or XP behavior differ from the original trace.');
if (process.argv.includes('--accept')) writeFileSync(resolve('tests/fixtures/original-castle-trainer-trace.json'), JSON.stringify({
  format: 'elona-original-castle-trainer-trace', version: 1, originalSha256: evidence.originalSha256,
  instrumentedSwfSha256: evidence.instrumentedSwfSha256, traceSha256: evidence.traceSha256,
  runtime: report.runtime, capturedAt: report.capturedAt, boundary: report.build.boundary,
  limits: evidence.limits, records: report.runs[0],
}, null, 2) + '\n');
