import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { compareSeventhDayWaveTrace } from '../tests/seventh-day-wave-reference-support.ts';

const report = JSON.parse(readFileSync(resolve(process.argv[2] ?? '../.build/oracle/seventh-day-waves-browser-report.json'), 'utf8'));
assert.equal(report.format, 'elona-original-oracle'); assert.equal(report.status, 'passed'); assert.equal(report.repeatable, true);
assert.equal(report.build.status, 'passed'); assert.equal(report.build.all_non_doabc_tag_payloads_identical, true);
assert.equal(report.build.source_generation_methods_unmodified, true);
assert.equal(report.runs.length, 2); assert.deepEqual(report.runs[0], report.runs[1]);
const result = compareSeventhDayWaveTrace(report.runs[0]);
const output = {
  ...result, referenceRuntime: report.runtime, originalSha256: report.build.original_sha256,
  instrumentedSwfSha256: report.build.output_sha256,
  traceSha256: createHash('sha256').update(JSON.stringify(report.runs[0])).digest('hex'),
  boundary: 'Original generateMission(6) on calendar day6 then preGenerateWave on calendar day7 versus the production mission and wave generators',
  limits: ['Synchronous original methods; Rest interaction, enemy behavior and whole battle scheduling are separate checks', 'Constants and the explicit prefix are legal RNG boundary inputs, not claims that a seeded production stream reaches those sequences', 'Original observations establish AIR/BATCH1/RANGED/ordinary selection coverage; final waves, delays, mission state and RNG accounting are compared independently'],
};
writeFileSync(resolve('../.build/oracle/seventh-day-waves-comparison-report.json'), JSON.stringify(output, null, 2) + '\n');
const before = resolve('../.build/oracle/seventh-day-waves-comparison-before.json');
if (result.status === 'failed' && !existsSync(before)) writeFileSync(before, JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
assert.equal(result.status, 'passed', 'Day7 wave comparison differs; inspect seventh-day-waves-comparison-report.json.');
