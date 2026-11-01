import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { compareHeroTrace } from '../tests/hero-reference-support.ts';

const report = JSON.parse(readFileSync(resolve(process.argv[2] ?? '../.build/oracle/hero-browser-report.json'), 'utf8'));
assert.equal(report.format, 'elona-original-oracle'); assert.equal(report.status, 'passed'); assert.equal(report.repeatable, true);
assert.equal(report.build.status, 'passed'); assert.equal(report.build.all_non_doabc_tag_payloads_identical, true);
assert.equal(report.build.original_method_logic_preserved, true);
assert.equal(report.build.original_sha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
assert.equal(report.runs.length, 2); assert.deepEqual(report.runs[0], report.runs[1]);
const result = compareHeroTrace(report.runs[0]);
const output = {
  status: result.status, referenceRuntime: report.runtime,
  originalSha256: report.build.original_sha256, instrumentedSwfSha256: report.build.output_sha256,
  traceSha256: createHash('sha256').update(JSON.stringify(report.runs[0])).digest('hex'),
  checks: ['Original Sheriff identity/potential/base-trait/nextTrait RNG order', 'Original grenade/bow/shotgun generation and all item fields including reused inactive slots', 'Two consecutive original levelUp calls continuing production helper state', 'Strictly source modulo XP, level, pending points and class/base trait changes', 'Exact RNG draw counts and final state; unchanged externally selected portrait'],
  matchedSnapshots: result.matchedSnapshots, comparisons: result.comparisons,
  limits: ['Controlled generatePlayer(0,1,Sheriff) and levelUp calls, not complete title/menu interaction or campaign timing', 'Three seeds and fresh/reused inventory contexts; normal first-day Sheriff only', 'Portrait selection remains outside the helper; original updateGene can reroll initialization during UI changes', 'Legacy reconstruction cannot recover lost original history and is not validated as historical data by this fixture', 'New Game mission/wave ordering and equipment/trait combat effects require separate integration checks'],
};
writeFileSync(resolve('../.build/oracle/hero-comparison-report.json'), JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({ status: result.status, matchedSnapshots: result.matchedSnapshots, failures: result.comparisons.filter(row => !row.matched).map(({ differences, ...row }) => ({ ...row, differingFields: differences.map(difference => difference.field) })) }, null, 2));
assert.equal(result.status, 'passed', 'Hero initialization/growth differs; inspect .build/oracle/hero-comparison-report.json.');
