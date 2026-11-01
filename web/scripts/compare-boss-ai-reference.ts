import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { compareBossAiTrace } from '../tests/boss-ai-reference-support.ts';

const report = JSON.parse(readFileSync(resolve(process.argv[2] ?? '../.build/oracle/boss-ai-browser-report.json'), 'utf8'));
assert.equal(report.format, 'elona-original-oracle'); assert.equal(report.status, 'passed'); assert.equal(report.repeatable, true);
assert.equal(report.build.status, 'passed'); assert.equal(report.build.all_non_doabc_tag_payloads_identical, true);
assert.equal(report.build.tag_types_and_order_identical, true); assert.equal(report.build.frame_header_identical, true);
assert.equal(report.build.original_sha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
assert.equal(report.runs.length, 2); assert.deepEqual(report.runs[0], report.runs[1]);
const result = compareBossAiTrace(report.runs[0]);
writeFileSync(resolve('../.build/oracle/boss-ai-comparison-report.json'), JSON.stringify({
  ...result, referenceRuntime: report.runtime, originalSha256: report.build.original_sha256,
  instrumentedSwfSha256: report.build.output_sha256,
  traceSha256: createHash('sha256').update(JSON.stringify(report.runs[0])).digest('hex'),
  checks: ['Original spawn and production boss AI', 'Facing, movement, shield, idle/fire animation and extracted body poses',
    'Castle HP and exact RNG accounting', 'Original single-pellet procHit and explode versus guarded/open boss'],
  limits: ['Explicit AI then child-frame order; native timeline scheduling is not asserted',
    'Boss pellet collision supplies original shapeHit; this does not prove boss raster collision parity',
    'Single-pellet cases provide raw damage45; the full shooting volley has its own reference fixture',
    'Source play/stop observations control diagnostic stepping; renderer pixels and audio need separate browser checks'],
}, null, 2) + '\n');
console.log(JSON.stringify({ status: result.status, matchedObservations: result.matchedObservations, comparedObservations: result.comparedObservations,
  sourceErrors: result.sourceErrors, failures: result.comparisons.filter(row => !row.matched).slice(0, 8) }, null, 2));
assert.equal(result.status, 'passed', 'Boss AI differs; inspect boss-ai-comparison-report.json.');
