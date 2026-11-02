import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { compareSeventhTownTrace } from '../tests/seventh-town-reference-support.ts';

const report = JSON.parse(readFileSync(resolve(process.argv[2] ?? '../.build/oracle/seventh-town-browser-report.json'), 'utf8'));
assert.equal(report.format, 'elona-original-oracle'); assert.equal(report.status, 'passed'); assert.equal(report.repeatable, true);
assert.equal(report.build.status, 'passed'); assert.equal(report.build.all_non_doabc_tag_payloads_identical, true);
assert.equal(report.build.tag_types_and_order_identical, true); assert.equal(report.build.frame_header_identical, true);
assert.equal(report.build.preparation_block_extracted_from_frame71, true); assert.equal(report.build.save_io_replaced_by_observation, true);
assert.equal(report.build.controlled_recruit_prefix_advances_underlying_rng, true);
assert.equal(report.build.original_sha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
assert.equal(report.runs.length, 2); assert.deepEqual(report.runs[0], report.runs[1]);
const result = compareSeventhTownTrace(report.runs[0]);
writeFileSync(resolve('../.build/oracle/seventh-town-comparison-report.json'), JSON.stringify({
  ...result, referenceRuntime: report.runtime, originalSha256: report.build.original_sha256,
  instrumentedSwfSha256: report.build.output_sha256,
  traceSha256: createHash('sha256').update(JSON.stringify(report.runs[0])).digest('hex'),
  checks: ['Day7 ordered town preparation and retained offer/Militia metadata', 'No guaranteed calendar loot; optional1038 roll preserved', 'All nine classes at level4 and both sides of10/21,20/21 thresholds', 'Exact RNG draw count and state', 'Day7 tax45/upkeep40, normal/perfect settlement with title0/1', 'Claim Title4AP without immediate gold/RNG; inherited-title rejection', 'Medal60/61/62 absorption.03 in prepared mission7'],
  limits: ['Default upgrades and solo Sheriff party', 'Day8 combat and higher title tiers are outside this boundary', 'Original title dialog text/art are observed; their browser rendering is checked separately', 'Town generation and result/action cases have separate controlled RNG boundaries'],
}, null, 2) + '\n');
console.log(JSON.stringify({ status: result.status, matchedSnapshots: result.matchedSnapshots, failures: result.comparisons.filter(row => !row.matched) }, null, 2));
assert.equal(result.status, 'passed', 'Seventh-town preparation/economy differs; inspect its comparison report.');
