import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { compareTownTrace } from '../tests/town-reference-support.ts';

const report = JSON.parse(readFileSync(resolve(process.argv[2] ?? '../.build/oracle/town-browser-report.json'), 'utf8'));
assert.equal(report.format, 'elona-original-oracle'); assert.equal(report.status, 'passed'); assert.equal(report.repeatable, true);
assert.equal(report.build.status, 'passed'); assert.equal(report.build.all_non_doabc_tag_payloads_identical, true);
assert.equal(report.build.frame71_excluded, true);
assert.equal(report.build.original_sha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
assert.equal(report.runs.length, 2); assert.deepEqual(report.runs[0], report.runs[1]);
const result = compareTownTrace(report.runs[0]);
const output = {
  status: result.status, referenceRuntime: report.runtime,
  originalSha256: report.build.original_sha256, instrumentedSwfSha256: report.build.output_sha256,
  traceSha256: createHash('sha256').update(JSON.stringify(report.runs[0])).digest('hex'),
  checks: ['First-day normal and perfect result settlement at three seeds', 'Result gold/reward/upkeep, earned-money total and source townEvent AP', 'Free Repair cost/full healing, repeat and insufficient-AP guards, including guard priority', 'HP/AP/gold/day/RNG unchanged by original repair acknowledgment', 'RNG draw count and final state'],
  matchedSnapshots: result.matchedSnapshots, comparisons: result.comparisons,
  observedOriginalDialog: report.runs[0].find((record: { scenario?: string; op?: string; step?: number }) => record.scenario === 'repair_sequence' && record.op === 'freeRepair' && record.step === 0)?.dialog,
  limits: ['Full frame71 shop/card/mission/recruit preparation is explicitly excluded; this is not whole-town parity', 'First-day default income/upgrades with no companions or medals, ACTIVE0 and normal mode only', 'Original dialog text/card art and rejection messages are captured; DOM presentation and acknowledgment interaction require browser validation', 'Simulation has no modal state: acknowledgment comparison checks unchanged game values, not dialog dismissal', 'Separate wage/income fields are captured but absent from the current production result model; the earned-money total is compared', 'Rest and day2 are outside this boundary'],
};
writeFileSync(resolve('../.build/oracle/town-comparison-report.json'), JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({ status: result.status, matchedSnapshots: result.matchedSnapshots, failures: result.comparisons.filter(row => !row.matched).map(({ differences, ...row }) => ({ ...row, differingFields: differences.map(difference => difference.field) })) }, null, 2));
assert.equal(result.status, 'passed', 'Town actions differ; inspect .build/oracle/town-comparison-report.json.');
