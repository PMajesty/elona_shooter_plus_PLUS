import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { compareWaveTrace } from '../tests/wave-reference-support.ts';

const reportPath = resolve(process.argv[2] ?? '../.build/oracle/waves-browser-report.json');
const report = JSON.parse(readFileSync(reportPath, 'utf8'));
assert.equal(report.format, 'elona-original-oracle');
assert.equal(report.status, 'passed'); assert.equal(report.repeatable, true);
assert.equal(report.build.status, 'passed');
assert.equal(report.build.all_non_doabc_tag_payloads_identical, true);
assert.equal(report.runs.length, 2);
assert.deepEqual(report.runs[0], report.runs[1], 'Original wave reference runs differ.');
const result = compareWaveTrace(report.runs[0]);
const output = {
  status: result.status, referenceRuntime: report.runtime,
  originalSha256: report.build.original_sha256,
  instrumentedSwfSha256: report.build.output_sha256,
  traceSha256: createHash('sha256').update(JSON.stringify(report.runs[0])).digest('hex'),
  boundary: 'Seed before original generateMission(0), followed by preGenerateWave()',
  checks: ['mission constants', 'boss wave', 'pending raw loot queue', 'ordered original enemy IDs', 'ordered delays', 'initial group sizes', 'RNG draw count', 'final RNG state'],
  matchedSnapshots: result.matchedSnapshots, comparisons: result.comparisons,
  limits: ['Three seeds for non-casual first-day Sheriff only', 'The same injected xorshift32 stream is used by both runtimes; this does not reproduce native Flash Math.random', 'Generation ends before spawning or combat; combat RNG and later days are untested', 'Raw loot queue parity does not establish postbattle inventory redemption'],
};
writeFileSync(resolve('../.build/oracle/waves-comparison-report.json'), JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({
  status: output.status, matchedSnapshots: output.matchedSnapshots,
  comparisons: result.comparisons.map(({ differences, ...comparison }) => ({ ...comparison, differingFields: differences.map(difference => difference.field) })),
}, null, 2));
assert.equal(result.status, 'passed', 'Port wave generation differs; inspect .build/oracle/waves-comparison-report.json.');
