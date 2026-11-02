import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { compareBossSpecialTrace } from '../tests/boss-special-reference-support.ts';

const report = JSON.parse(readFileSync(resolve(process.argv[2] ?? '../.build/oracle/boss-special-browser-report.json'), 'utf8'));
assert.equal(report.format, 'elona-original-oracle'); assert.equal(report.status, 'passed'); assert.equal(report.repeatable, true);
assert.equal(report.build.status, 'passed'); assert.equal(report.build.all_non_doabc_tag_payloads_identical, true);
assert.equal(report.build.tag_types_and_order_identical, true); assert.equal(report.build.frame_header_identical, true);
assert.equal(report.build.original_sha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
assert.equal(report.runs.length, 2); assert.deepEqual(report.runs[0], report.runs[1]);
const result = compareBossSpecialTrace(report.runs[0]);
writeFileSync(resolve('../.build/oracle/boss-special-comparison-report.json'), JSON.stringify({
  ...result, referenceRuntime: report.runtime, originalSha256: report.build.original_sha256,
  instrumentedSwfSha256: report.build.output_sha256,
  traceSha256: createHash('sha256').update(JSON.stringify(report.runs[0])).digest('hex'),
  checks: ['Exact source shield/special branch thresholds and level guard', 'Windup, release, repeat and interruption under original damage',
    'Production boss, projectile and castle-damage paths, including complete RNG accounting',
    'Original grenade transforms, lifetime and cosmetic landing after immediate castle damage'],
  limits: ['Explicit AI/child/previous-projectile clock; native full-battle scheduling is not asserted',
    'Controlled random prefixes advance the seeded stream normally and replace returned values only',
    'Direct source damage calls isolate interruption; they are not geometric hits or full shooting volleys',
    'Two releases are a controlled action re-entry, not a measured natural recurrence frequency',
    'All compared numeric fields, including projectile angles, compare exactly without a tolerance',
    'Level20 rocket special, level10 reactive shield and level15 boss rage are outside this Day7 slice'],
}, null, 2) + '\n');
console.log(JSON.stringify({ status: result.status, matchedSnapshots: result.matchedSnapshots,
  comparedSnapshots: result.comparedSnapshots, maximumRotationError: result.maximumRotationError,
  sourceErrors: result.sourceErrors, failures: result.comparisons.filter(row => !row.matched).slice(0, 8) }, null, 2));
assert.equal(result.status, 'passed', 'Boss special differs; inspect boss-special-comparison-report.json.');
