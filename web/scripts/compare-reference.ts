import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { compareReloadTrace } from '../tests/reference-support.ts';

const reportPath = resolve(process.argv[2] ?? '../.build/oracle/browser-report.json');
const report = JSON.parse(readFileSync(reportPath, 'utf8'));
assert.equal(report.format, 'elona-original-oracle');
assert.equal(report.status, 'passed');
assert.equal(report.repeatable, true);
assert.equal(report.build.status, 'passed');
assert.equal(report.build.all_non_doabc_tag_payloads_identical, true);
assert.equal(report.runs.length, 2);
assert.deepEqual(report.runs[0], report.runs[1], 'Reference runs differ');
const result = compareReloadTrace(report.runs[0]);
const output = {
  status: 'passed', referenceRuntime: report.runtime,
  originalSha256: report.build.original_sha256,
  instrumentedSwfSha256: report.build.output_sha256,
  traceSha256: createHash('sha256').update(JSON.stringify(report.runs[0])).digest('hex'),
  scenarios: result.scenarios, matchedSnapshots: result.matchedSnapshots,
  checks: ['ammo', 'reload timer', 'rampage counter', 'pause gate', 'sound intents', 'animation intents'],
  limits: ['Manually advanced logical timer methods; native frame/timer ordering untested', 'Simulation pause is a test-adapter gate; browser pause/input tested separately', 'Sound and animation intents, not audio samples or rendered frames', 'Reload scenarios do not establish combat RNG equivalence'],
};
writeFileSync(resolve('../.build/oracle/comparison-report.json'), JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify(output, null, 2));
