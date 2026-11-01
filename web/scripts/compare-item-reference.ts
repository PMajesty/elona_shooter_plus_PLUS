import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { compareItemTrace } from '../tests/item-reference-support.ts';

const report = JSON.parse(readFileSync(resolve(process.argv[2] ?? '../.build/oracle/loot-browser-report.json'), 'utf8'));
assert.equal(report.format, 'elona-original-oracle'); assert.equal(report.status, 'passed'); assert.equal(report.repeatable, true);
assert.equal(report.build.status, 'passed'); assert.equal(report.build.all_non_doabc_tag_payloads_identical, true);
assert.equal(report.runs.length, 2); assert.deepEqual(report.runs[0], report.runs[1]);
const result = compareItemTrace(report.runs[0]);
const output = {
  status: result.status, referenceRuntime: report.runtime,
  originalSha256: report.build.original_sha256, instrumentedSwfSha256: report.build.output_sha256,
  traceSha256: createHash('sha256').update(JSON.stringify(report.runs[0])).digest('hex'),
  checks: ['all33 observed item fields', '58 base item IDs at two seeds', 'randomStuff modes0..4 at three seeds', 'ordinary-loot offers and consumed guarantee markers', 'original starting-item sequence and overrides', 'RNG draw count and final state'],
  matchedSnapshots: result.matchedSnapshots, comparisons: result.comparisons,
  limits: ['First day with default item-generation settings only', 'Starting-item boundary excludes preceding character-generation RNG', 'Item generation does not establish weapon behavior, modifier mounting, shop UI, boss rewards, skill progression or later-day parity', 'Inventory transfer/sale helpers are checked separately; this oracle does not operate original drag/drop UI'],
};
writeFileSync(resolve('../.build/oracle/loot-comparison-report.json'), JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({ status: result.status, matchedSnapshots: result.matchedSnapshots, failures: result.comparisons.filter(row => !row.matched).map(({ differences, ...row }) => ({ ...row, differingFields: differences.map(difference => difference.field) })) }, null, 2));
assert.equal(result.status, 'passed', 'Item generation differs; inspect .build/oracle/loot-comparison-report.json.');
