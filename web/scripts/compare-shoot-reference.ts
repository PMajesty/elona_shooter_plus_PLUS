import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { compareShootTrace } from '../tests/shoot-reference-support.ts';

const report = JSON.parse(readFileSync(resolve(process.argv[2] ?? '../.build/oracle/shoot-browser-report.json'), 'utf8'));
assert.equal(report.format, 'elona-original-oracle'); assert.equal(report.status, 'passed'); assert.equal(report.repeatable, true);
assert.equal(report.build.status, 'passed'); assert.equal(report.build.all_non_doabc_tag_payloads_identical, true);
assert.equal(report.build.original_shoot_body_reversibly_preserved, true);
assert.equal(report.runs.length, 2); assert.deepEqual(report.runs[0], report.runs[1]);
const result = compareShootTrace(report.runs[0]);
const output = {
  status: result.status, referenceRuntime: report.runtime,
  originalSha256: report.build.original_sha256, instrumentedSwfSha256: report.build.output_sha256,
  traceSha256: createHash('sha256').update(JSON.stringify(report.runs[0])).digest('hex'),
  boundary: 'Actual original shoot(_pc) versus production Simulation.fireAt; captured pre-shot state and per-pellet original vector geometry are inputs',
  checks: ['refreshPlayer weapon quantities', 'all pellet coordinates and RNG position before each geometry query', 'damage/critical type/HP and RNG position at each live hit', 'all 33 weapon fields after shooting including living evolution', 'hero XP/level/base growth, ammo/reload, recoil, rampage, kills and loot', 'enemy HP/knockback/slow/death and boss accumulated damage', 'every random draw, total count and final state'],
  matchedSnapshots: result.matchedSnapshots, comparisons: result.comparisons,
  limits: ['Vector geometry is supplied from the original observer; production collision contours are independently tested elsewhere', 'Controlled weapon/traits and pre-shot enemy state; this fixture does not retest initialization or spawn generation', 'No frame/timer advancement, audio, rendered frames, full AI, sister collision, chain/bow/projectile lifecycle', 'IdleCount/burst/frenzy/earnedGold and display child bounds are observed in the trace but not compared by this Sheriff adapter'],
};
const outputPath = resolve('../.build/oracle/shoot-comparison-report.json');
writeFileSync(outputPath, JSON.stringify(output, null, 2) + '\n');
const beforePath = resolve('../.build/oracle/shoot-comparison-before.json');
if (result.status === 'failed' && !existsSync(beforePath)) writeFileSync(beforePath, JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({ status: result.status, matchedSnapshots: result.matchedSnapshots, comparisons: result.comparisons.map(({ differences, ...row }) => ({ ...row, differingFields: differences.map(difference => difference.field) })) }, null, 2));
assert.equal(result.status, 'passed', 'Actual shoot comparison differs; inspect .build/oracle/shoot-comparison-report.json.');
