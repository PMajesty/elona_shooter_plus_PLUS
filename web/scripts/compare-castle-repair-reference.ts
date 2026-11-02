import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { compareCastleRepairTrace } from '../tests/castle-repair-reference-support.ts';

const reportPath = process.argv.slice(2).find(argument => !argument.startsWith('--')) ?? '../.build/oracle/castle-repair-browser-report.json';
const report = JSON.parse(readFileSync(resolve(reportPath), 'utf8'));
assert.equal(report.format, 'elona-original-oracle'); assert.equal(report.status, 'passed'); assert.equal(report.repeatable, true);
assert.equal(report.build.status, 'passed'); assert.equal(report.build.all_non_doabc_tag_payloads_identical, true);
assert.equal(report.build.tag_types_and_order_identical, true); assert.equal(report.build.frame_header_identical, true);
assert.equal(report.build.original_method_logic_preserved, true);
assert.equal(report.build.original_sha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
assert.equal(report.runs.length, 2); assert.deepEqual(report.runs[0], report.runs[1]);
const result = compareCastleRepairTrace(report.runs[0]);
const evidence = {
  ...result, referenceRuntime: report.runtime, originalSha256: report.build.original_sha256,
  instrumentedSwfSha256: report.build.output_sha256,
  traceSha256: createHash('sha256').update(JSON.stringify(report.runs[0])).digest('hex'),
  checks: ['Original Fix Wall/Repairman Castle tile shape hits, payment, repeat and affordability guards',
    'Paid repair counter, AP0, totalMoney, zero RNG, independent maximumHP, unchanged past-perfect flag',
    'Repairman700/950/1700 purchases do not heal immediately; upkeep adds60 per level',
    'Original onTick opening/ordinary wave healing before noDamage test, clamp and persistent false flag',
    'No continuous healing, no terminal-wave healing, and lethal guard before all healing',
    'Production purchases preserve prepared town, party records/cache and already-settled result'],
  limits: ['Explicit original timer calls with inactive actors; this does not prove full native scheduler or active companion/attack timing',
    'Terminal source observer stops at exitBattle2 entry after original wave/noDamage/pause/immune changes; cleanup/rewards/event transition are excluded',
    'Decorative fireworks disabled by the original option to isolate healing RNG',
    'Town uses actual continued frame71 and controlled inputs; fresh town generation and gameplay earnings are excluded',
    'UI descriptions and source pause/immune flags are captured, but their browser rendering/pause ownership are separate from the state comparison',
    'Save migration, actual clicks and connected battles require separate integration checks'],
};
writeFileSync(resolve('../.build/oracle/castle-repair-comparison-report.json'), JSON.stringify(evidence, null, 2) + '\n');
console.log(JSON.stringify({ status: result.status, observedSnapshots: result.observedSnapshots,
  inputSnapshots: result.inputSnapshots, timerOutcomes: result.timerOutcomes, transactionOutcomes: result.transactionOutcomes,
  matchedSnapshots: result.matchedSnapshots, failures: result.comparisons.filter(row => !row.matched) }, null, 2));
assert.equal(result.status, 'passed', 'Castle repairs differ from original town/timer trace.');
if (process.argv.includes('--accept')) writeFileSync(resolve('tests/fixtures/original-castle-repair-trace.json'), JSON.stringify({
  format: 'elona-original-castle-repair-trace', version: 1, originalSha256: evidence.originalSha256,
  instrumentedSwfSha256: evidence.instrumentedSwfSha256, traceSha256: evidence.traceSha256,
  runtime: report.runtime, capturedAt: report.capturedAt, boundary: report.build.boundary,
  limits: evidence.limits, records: report.runs[0],
}, null, 2) + '\n');
