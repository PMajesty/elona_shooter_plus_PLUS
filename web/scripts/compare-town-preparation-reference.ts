import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { compareTownPreparationTrace } from '../tests/town-preparation-reference-support.ts';

const report = JSON.parse(readFileSync(resolve(process.argv[2] ?? '../.build/oracle/town-preparation-browser-report.json'), 'utf8'));
assert.equal(report.format, 'elona-original-oracle'); assert.equal(report.status, 'passed'); assert.equal(report.repeatable, true);
assert.equal(report.build.status, 'passed'); assert.equal(report.build.all_non_doabc_tag_payloads_identical, true);
assert.equal(report.build.preparation_block_extracted_from_frame71, true); assert.equal(report.build.save_io_replaced_by_observation, true);
assert.equal(report.build.original_sha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
assert.equal(report.runs.length, 2); assert.deepEqual(report.runs[0], report.runs[1]);
const result = compareTownPreparationTrace(report.runs[0]);
const output = {
  status: result.status, referenceRuntime: report.runtime,
  originalSha256: report.build.original_sha256, instrumentedSwfSha256: report.build.output_sha256,
  traceSha256: createHash('sha256').update(JSON.stringify(report.runs[0])).digest('hex'),
  checks: ['Original ordered shop/card/next-mission/recruit preparation', 'All33 shop-item fields including inactive num0 slot metadata and collected cells', 'Recruit fields/nonzero traits and every generated weapon field', 'Five unrevealed cards and complete generated mission configuration before waves', 'No-medal first-town flags, searched initialization and original pre-search save RNG boundary', 'Exact RNG draw count and final state'],
  matchedSnapshots: result.matchedSnapshots, recruitClasses: result.recruitClasses, comparisons: result.comparisons,
  limits: ['First town at day1 only, normal mode and default upgrades/no medals; result/AP settlement is a separate oracle', 'Original preparation block is extracted from frame71; full timeline/layout/input events are not exercised', 'saveGame external I/O is replaced by an observation; production persists the complete state after searched initialization', 'Shop transactions, recruiting/hiring, card actions, upgrades, Rest, wave generation and day2 combat are outside this generator comparison', 'Legacy saves cannot recover slot metadata already discarded by older port versions'],
};
writeFileSync(resolve('../.build/oracle/town-preparation-comparison-report.json'), JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({ status: result.status, matchedSnapshots: result.matchedSnapshots, recruitClasses: result.recruitClasses, failures: result.comparisons.filter(row => !row.matched).map(({ differences, ...row }) => ({ ...row, differingFields: differences.map(difference => difference.field) })) }, null, 2));
assert.equal(result.status, 'passed', 'Town preparation differs; inspect .build/oracle/town-preparation-comparison-report.json.');
