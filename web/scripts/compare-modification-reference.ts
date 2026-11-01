import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { compareModificationTrace } from '../tests/modification-reference-support.ts';

const report = JSON.parse(readFileSync(resolve(process.argv[2] ?? '../.build/oracle/modifications-browser-report.json'), 'utf8'));
assert.equal(report.format, 'elona-original-oracle'); assert.equal(report.status, 'passed'); assert.equal(report.repeatable, true);
assert.equal(report.build.status, 'passed'); assert.equal(report.build.all_non_doabc_tag_payloads_identical, true);
assert.equal(report.build.original_method_logic_preserved, true);
assert.equal(report.runs.length, 2); assert.deepEqual(report.runs[0], report.runs[1]);
const result = compareModificationTrace(report.runs[0]);
const output = {
  ...result, referenceRuntime: report.runtime, originalSha256: report.build.original_sha256,
  instrumentedSwfSha256: report.build.output_sha256,
  traceSha256: createHash('sha256').update(JSON.stringify(report.runs[0])).digest('hex'),
  boundary: 'Original shop action entry, invDrag, showDialog/endDialog, upgradeWeapon and enchant; production Simulation equipment transactions',
  intentionalCorrection: 'Raw original drops the final MOD. Corrected previews compare against separately captured original enchant intervention; original loss records are retained.',
  limits: ['No full frame71 generation, pointer geometry parity, animated dialogs, sounds or ally equipment', 'UI pickup/equipMode state remains source evidence; production transactions begin at selected-item confirmation', 'Two bonus-context cases override only the production ItemFactory context, without claiming ordinary engineer or medal acquisition', 'One explicitly controlled nonzero-reload metadata case observes the method boundary; ordinary town cases start with full ammo and reloadTime0', 'Four retained-mod raw preview rows compare all transaction state except reference; the next intervention row supplies the independent corrected reference'],
};
writeFileSync(resolve('../.build/oracle/modifications-comparison-report.json'), JSON.stringify(output, null, 2) + '\n');
const before = resolve('../.build/oracle/modifications-comparison-before.json');
if (result.status === 'failed' && !existsSync(before)) writeFileSync(before, JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({ status: result.status, observedSnapshots: result.observedSnapshots, comparedSnapshots: result.comparedSnapshots, fullyComparedSnapshots: result.fullyComparedSnapshots, matchedSnapshots: result.matchedSnapshots, rawOriginalBugCases: result.rawOriginalBugCases, failures: result.comparisons.filter(row => !row.matched).map(({ differences, ...row }) => ({ ...row, fields: differences.map(difference => difference.field) })) }, null, 2));
assert.equal(result.status, 'passed', 'Modification comparison differs; inspect .build/oracle/modifications-comparison-report.json.');
