import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { compareNinthDaySpawnTrace } from '../tests/ninth-day-spawn-reference-support.ts';

const path = process.argv.slice(2).find(argument => !argument.startsWith('--')) ?? '../.build/oracle/ninth-day-spawn-browser-report.json';
const report = JSON.parse(readFileSync(resolve(path), 'utf8'));
assert.equal(report.format, 'elona-original-oracle'); assert.equal(report.status, 'passed'); assert.equal(report.repeatable, true);
assert.equal(report.build.status, 'passed'); assert.equal(report.build.original_method_logic_preserved, true);
assert.equal(report.build.all_non_doabc_tag_payloads_identical, true); assert.equal(report.build.tag_types_and_order_identical, true);
assert.equal(report.build.frame_header_identical, true);
assert.equal(report.runs.length, 2); assert.deepEqual(report.runs[0], report.runs[1]);
const result = compareNinthDaySpawnTrace(report.runs[0]);
const output = { ...result, referenceRuntime: report.runtime, originalSha256: report.build.original_sha256,
  instrumentedSwfSha256: report.build.output_sha256,
  traceSha256: createHash('sha256').update(JSON.stringify(report.runs[0])).digest('hex'),
  boundary: report.build.boundary,
  limits: ['Actual original onTick and enemy.init methods under explicit deterministic inputs; native Timer/ENTER_FRAME scheduling is excluded',
    'Actor AI/reload controls disabled in the source; production uses a full idle Sheriff with no active companion and no pending reload',
    'Enemy numerical initialization, frames, queues, RNG and break order compared; raw original geometry retained but not asserted as new contour parity',
    'Undefined original shadowHit means shadow is eligible under the original ==false check and is normalized to true for the canonical boolean'],
};
writeFileSync(resolve('../.build/oracle/ninth-day-spawn-comparison-report.json'), JSON.stringify(output, null, 2) + '\n');
const before = resolve('../.build/oracle/ninth-day-spawn-comparison-before.json');
if (result.status === 'failed' && !existsSync(before)) writeFileSync(before, JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({ status: result.status, matchedSnapshots: result.matchedSnapshots,
  failures: result.comparisons.filter(row => !row.matched) }, null, 2));
assert.equal(result.status, 'passed');
if (process.argv.includes('--accept')) writeFileSync(resolve('tests/fixtures/original-ninth-day-spawn-trace.json'), JSON.stringify({
  format: 'elona-original-ninth-day-spawn-trace', version: 1, originalSha256: output.originalSha256,
  instrumentedSwfSha256: output.instrumentedSwfSha256, traceSha256: output.traceSha256,
  runtime: report.runtime, capturedAt: report.capturedAt, boundary: output.boundary, limits: output.limits, records: report.runs[0],
}, null, 2) + '\n');
