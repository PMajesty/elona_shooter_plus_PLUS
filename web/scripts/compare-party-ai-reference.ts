import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { comparePartyAITrace } from '../tests/party-ai-reference-support.ts';

const report = JSON.parse(readFileSync(resolve(process.argv[2] ?? '../.build/oracle/party-ai-browser-report.json'), 'utf8'));
assert.equal(report.format, 'elona-original-oracle'); assert.equal(report.status, 'passed'); assert.equal(report.repeatable, true);
assert.equal(report.build.status, 'passed'); assert.equal(report.build.all_non_doabc_tag_payloads_identical, true);
assert.equal(report.build.original_ai_methods_preserved, true);
assert.equal(report.runs.length, 2); assert.deepEqual(report.runs[0], report.runs[1]);
const result = comparePartyAITrace(report.runs[0]);
const output = {
  status: result.status, referenceRuntime: report.runtime,
  originalSha256: report.build.original_sha256, instrumentedSwfSha256: report.build.output_sha256,
  traceSha256: createHash('sha256').update(JSON.stringify(report.runs[0])).digest('hex'),
  boundary: 'Original updateAlly/refreshPlayer, target selectors, manually called root frame/timer handlers and actual shoot, versus party-ai and Simulation.fireActorAt',
  checks: ['all nine original initialization profiles', 'target/cache consumption and tag mutation', 'cursor twips, aiming, skipped frame cooldown/rampage/frenzy', 'reload progression and Militia free-grenade inputs', 'all nine initial weapons: actual cooldown, recoil, ammo and launch lead', 'shared RNG count and state'],
  matchedSnapshots: result.matchedSnapshots, correctedSnapshots: result.correctedSnapshots, comparisons: result.comparisons,
  limits: ['Controller scenarios record shoot callbacks without executing weapon damage', 'Actual shoot scenarios have an empty enemy collision world; they do not prove companion kill/XP attribution', 'Generated traits/items are captured inputs; recruit generation is independently tested elsewhere', 'Manual root callbacks do not establish native listener scheduling or audio/timeline advancement', 'Observed current animation frame is retained but not compared by the AI adapter'],
};
writeFileSync(resolve('../.build/oracle/party-ai-comparison-report.json'), JSON.stringify(output, null, 2) + '\n');
const before = resolve('../.build/oracle/party-ai-comparison-before.json');
if (result.status === 'failed' && !existsSync(before)) writeFileSync(before, JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({ status: result.status, matchedSnapshots: result.matchedSnapshots, correctedSnapshots: result.correctedSnapshots, differences: result.comparisons.filter(row => !row.matched) }, null, 2));
assert.equal(result.status, 'passed', 'Party AI differs; inspect .build/oracle/party-ai-comparison-report.json.');
