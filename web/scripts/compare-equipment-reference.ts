import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { compareEquipmentTrace } from '../tests/equipment-reference-support.ts';

const report = JSON.parse(readFileSync(resolve(process.argv[2] ?? '../.build/oracle/equipment-browser-report.json'), 'utf8'));
assert.equal(report.format, 'elona-original-oracle'); assert.equal(report.status, 'passed'); assert.equal(report.repeatable, true);
assert.equal(report.build.status, 'passed'); assert.equal(report.build.all_non_doabc_tag_payloads_identical, true);
assert.equal(report.build.original_equipment_methods_preserved, true);
assert.equal(report.runs.length, 2); assert.deepEqual(report.runs[0], report.runs[1]);
const result = compareEquipmentTrace(report.runs[0]);
const output = {
  status: result.status, referenceRuntime: report.runtime,
  originalSha256: report.build.original_sha256, instrumentedSwfSha256: report.build.output_sha256,
  traceSha256: createHash('sha256').update(JSON.stringify(report.runs[0])).digest('hex'),
  boundary: 'Actual original KeyDown/mouse handlers then original onEnterFrame/onTick, versus production useSlot/requestReload/tick',
  checks: ['all 33 fields of every inventory item', 'selected slot and separate consumable cooldowns', 'pending shot, physical held input, shot cooldown, recoil and reload progression', 'weapon animation mapping from getWeaponInfo', 'RNG draw count and final state'],
  matchedSnapshots: result.matchedSnapshots, comparisons: result.comparisons,
  limits: ['Explicit input-before-frame ordering and imposed 20/30 timer accumulator do not establish native Flash scheduler equivalence', 'No enemy hits, projectile lifecycle, AI, audio or timeline child advancement', 'Initial generated inventory is captured input; item generation has a separate original comparison', 'Observed chain/burst/idle bookkeeping and actor current frame are not compared by this hitscan adapter'],
};
const outputPath = resolve('../.build/oracle/equipment-comparison-report.json');
writeFileSync(outputPath, JSON.stringify(output, null, 2) + '\n');
const beforePath = resolve('../.build/oracle/equipment-comparison-before.json');
if (result.status === 'failed' && !existsSync(beforePath)) writeFileSync(beforePath, JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({ status: result.status, matchedSnapshots: result.matchedSnapshots, comparisons: result.comparisons.map(({ differences, ...row }) => ({ ...row, differingFields: differences.map(difference => difference.field) })) }, null, 2));
assert.equal(result.status, 'passed', 'Equipment input comparison differs; inspect .build/oracle/equipment-comparison-report.json.');
