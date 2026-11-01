import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { compareCastleTrace } from '../tests/castle-reference-support.ts';

const report = JSON.parse(readFileSync(resolve(process.argv[2] ?? '../.build/oracle/castle-browser-report.json'), 'utf8'));
assert.equal(report.format, 'elona-original-oracle'); assert.equal(report.status, 'passed'); assert.equal(report.repeatable, true);
assert.equal(report.build.status, 'passed'); assert.equal(report.build.all_non_doabc_tag_payloads_identical, true);
assert.equal(report.build.original_castle_methods_preserved, true);
assert.equal(report.runs.length, 2); assert.deepEqual(report.runs[0], report.runs[1]);
const result = compareCastleTrace(report.runs[0]);
const output = {
  status: result.status, referenceRuntime: report.runtime,
  originalSha256: report.build.original_sha256, instrumentedSwfSha256: report.build.output_sha256,
  traceSha256: createHash('sha256').update(JSON.stringify(report.runs[0])).digest('hex'),
  boundary: 'Actual original damageCastle(undefined,damage), with optional original frame before hit, versus production Simulation.damageCastle/tick',
  checks: ['castle HP with integer absorption and minimum damage', 'insurance money and totalMoney before Defender', 'Defender cancellation and Last Hope chance/ally/threshold/rampage rules', 'protection counter and blue fade before damage', 'defend events and every random draw, count and final state'],
  matchedSnapshots: result.matchedSnapshots, comparisons: result.comparisons,
  limits: ['Solo Sheriff with five ally positions and only hero existing; Guardian and attacker callbacks excluded', 'Sandbags absent; source castleAbsorb is1 and medal absorbFix is0/.01/.04', 'Explicit frame-before-hit order does not establish native Flash scheduler order', 'No actor rendering, sounds, subsequent shake-frame RNG, enemy attack timeline, or defeat/town transition claims'],
};
const outputPath = resolve('../.build/oracle/castle-comparison-report.json');
writeFileSync(outputPath, JSON.stringify(output, null, 2) + '\n');
const beforePath = resolve('../.build/oracle/castle-comparison-before.json');
if (result.status === 'failed' && !existsSync(beforePath)) writeFileSync(beforePath, JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({ status: result.status, matchedSnapshots: result.matchedSnapshots, comparisons: result.comparisons.map(({ differences, ...row }) => ({ ...row, differingFields: differences.map(difference => difference.field) })) }, null, 2));
assert.equal(result.status, 'passed', 'Castle damage comparison differs; inspect .build/oracle/castle-comparison-report.json.');
