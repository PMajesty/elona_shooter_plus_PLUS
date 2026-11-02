import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { compareNinthTownTrace } from '../tests/ninth-town-reference-support.ts';

const report = JSON.parse(readFileSync(resolve(process.argv[2] ?? '../.build/oracle/ninth-town-browser-report.json'), 'utf8'));
assert.equal(report.format, 'elona-original-oracle'); assert.equal(report.status, 'passed'); assert.equal(report.repeatable, true);
assert.equal(report.build.status, 'passed'); assert.equal(report.build.all_non_doabc_tag_payloads_identical, true);
assert.equal(report.build.tag_types_and_order_identical, true); assert.equal(report.build.frame_header_identical, true);
assert.equal(report.build.preparation_block_extracted_from_frame71, true); assert.equal(report.build.save_io_replaced_by_observation, true);
assert.equal(report.build.controlled_recruit_prefix_advances_underlying_rng, true);
assert.equal(report.build.original_sha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
assert.equal(report.runs.length, 2); assert.deepEqual(report.runs[0], report.runs[1]);
const result = compareNinthTownTrace(report.runs[0]);
writeFileSync(resolve('../.build/oracle/ninth-town-comparison-report.json'), JSON.stringify({
  ...result, referenceRuntime: report.runtime, originalSha256: report.build.original_sha256,
  instrumentedSwfSha256: report.build.output_sha256,
  traceSha256: createHash('sha256').update(JSON.stringify(report.runs[0])).digest('hex'),
  checks: ['Day9 ordered town preparation and retained offer/Militia metadata', 'Ordered optional1038 then guaranteed1035/1110 calendar loot',
    'Recruit level2/3/4 boundaries at10/27 and20/27', 'Mk3 variation boundary at10/19 with prior day8 cap control', 'First bossDay mission9: six waves, bossWave5 and skipped normal boss-wave RNG, compared with mission8',
    'Exact RNG draw count and state', 'Day9 tax115/upkeep40, normal/perfect settlement with title0/1', 'Retained medal60/61/62 absorption.03'],
  limits: ['Default upgrades and solo Sheriff party', 'Day10 combat is outside this boundary',
    'Town generation, recruit, item variation and result cases have separate controlled RNG boundaries',
    'Source save IO is replaced by observation; whole-campaign scheduling and browser rendering are separate checks'],
}, null, 2) + '\n');
console.log(JSON.stringify({ status: result.status, matchedSnapshots: result.matchedSnapshots, failures: result.comparisons.filter(row => !row.matched) }, null, 2));
assert.equal(result.status, 'passed', 'Ninth-town preparation/economy differs; inspect its comparison report.');
