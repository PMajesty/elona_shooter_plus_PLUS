import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { compareCastleStorageTrace } from '../tests/castle-storage-reference-support.ts';

const reportPath = process.argv.slice(2).find(argument => !argument.startsWith('--')) ?? '../.build/oracle/castle-storage-browser-report.json';
const report = JSON.parse(readFileSync(resolve(reportPath), 'utf8'));
assert.equal(report.format, 'elona-original-oracle'); assert.equal(report.status, 'passed'); assert.equal(report.repeatable, true);
assert.equal(report.build.status, 'passed'); assert.equal(report.build.all_non_doabc_tag_payloads_identical, true);
assert.equal(report.build.tag_types_and_order_identical, true); assert.equal(report.build.frame_header_identical, true);
assert.equal(report.build.original_method_logic_preserved, true);
assert.equal(report.build.original_sha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
assert.equal(report.runs.length, 2); assert.deepEqual(report.runs[0], report.runs[1]);
const result = compareCastleStorageTrace(report.runs[0]);
const evidence = { ...result, referenceRuntime: report.runtime, originalSha256: report.build.original_sha256,
  instrumentedSwfSha256: report.build.output_sha256,
  traceSha256: createHash('sha256').update(JSON.stringify(report.runs[0])).digest('hex'),
  checks: ['Actual Storage tile3 purchases, affordability, capacity6 through16, prices and upkeep',
    'AP0, unchanged totalMoney/HP/prepared town/party cache/settled result and zero purchase RNG',
    'All33 item fields through slot35: stock purchase, loot collection, owned swap, MOD confirm/cancel, Upgrade preview/confirm, sale and Shop Token',
    'Original sixth-key rejection and all-owned-slot gun/consumable refill boundaries'],
  limits: ['Controlled original methods and input seams; fresh town generation, real browser clicks and native scheduling are separate',
    'Ammo comparison projects occupied owned slots and inactive ally weapon; uninitialized empty-cell reload metadata is not represented by port null slots',
    'Port finishDay is stopped before reward generation; startNextDay item projection excludes wave RNG outside original updateAlly boundary',
    'Sale preview is observed without mutation; production confirmation UI is independent of the immediate sale domain operation',
    'Loot MOD confirmation remains a known port gap; this fixture compares town MOD transactions only',
    'Source UI slot positions/hotkey labels are recorded; actual port rendering and save/resume have separate browser checks'],
};
writeFileSync(resolve('../.build/oracle/castle-storage-comparison-report.json'), JSON.stringify(evidence, null, 2) + '\n');
console.log(JSON.stringify({ status: result.status, matchedSnapshots: result.matchedSnapshots, observedSnapshots: result.observedSnapshots,
  failures: result.comparisons.filter(row => !row.matched) }, null, 2));
assert.equal(result.status, 'passed', 'Storage differs from original inventory and transaction trace.');
if (process.argv.includes('--accept')) writeFileSync(resolve('tests/fixtures/original-castle-storage-trace.json'), JSON.stringify({
  format: 'elona-original-castle-storage-trace', version: 1, originalSha256: evidence.originalSha256,
  instrumentedSwfSha256: evidence.instrumentedSwfSha256, traceSha256: evidence.traceSha256,
  runtime: report.runtime, capturedAt: report.capturedAt, boundary: report.build.boundary,
  limits: evidence.limits, records: report.runs[0],
}, null, 2) + '\n');
