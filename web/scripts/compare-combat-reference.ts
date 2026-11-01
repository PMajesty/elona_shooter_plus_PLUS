import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { compareCombatTrace } from '../tests/combat-reference-support.ts';

const report = JSON.parse(readFileSync(resolve(process.argv[2] ?? '../.build/oracle/combat-browser-report.json'), 'utf8'));
assert.equal(report.format, 'elona-original-oracle');
assert.equal(report.status, 'passed'); assert.equal(report.repeatable, true);
assert.equal(report.build.status, 'passed'); assert.equal(report.build.all_non_doabc_tag_payloads_identical, true);
assert.equal(report.runs.length, 2); assert.deepEqual(report.runs[0], report.runs[1]);
const result = compareCombatTrace(report.runs[0]);
const output = {
  status: result.status, referenceRuntime: report.runtime,
  originalSha256: report.build.original_sha256, instrumentedSwfSha256: report.build.output_sha256,
  traceSha256: createHash('sha256').update(JSON.stringify(report.runs[0])).digest('hex'),
  boundary: 'Original spawnEnemy; original procHit versus the processPellet production path used by fireAt',
  checks: ['spawn stats and logical animation frame', 'critical classification at tested points, damage/critical multiplier/air reduction/knockback', 'death, XP, kills, weapon XP, rampage and pending loot', 'RNG draw count and final state'],
  matchedSnapshots: result.matchedSnapshots, completePointCoverage: result.completePointCoverage, comparisons: result.comparisons,
  limits: [
    'Original vector body/shadow classification is supplied to the port as input; exported-alpha-mask collision geometry is NOT compared',
    'Critical rectangle decisions are tested only where the original vector body/shadow predicate permits a hit',
    'No six-pellet shooting, spread, cooldown, input, movement, timer/frame scheduling, rendered frames or audio output comparison',
    'Only first-day unmodified Sheriff/shotgun and listed enemy probes; no corpse hits, other skills or later levels',
    'Critical-kill sound selection assumes the initial living sister; sister damage is not implemented',
    'Original display bounds/scales, boss idle/fireNum defaults and earnedGold attribution counter are observed but not compared',
  ],
};
writeFileSync(resolve('../.build/oracle/combat-comparison-report.json'), JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({ status: result.status, matchedSnapshots: result.matchedSnapshots, completePointCoverage: result.completePointCoverage,
  comparisons: result.comparisons.map(({ differences, ...row }) => ({ ...row, differingFields: differences.map(difference => difference.field) })),
}, null, 2));
assert.equal(result.status, 'passed', 'Port combat differs; inspect .build/oracle/combat-comparison-report.json.');
