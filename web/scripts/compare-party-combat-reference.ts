import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { comparePartyCombatTrace } from '../tests/party-combat-reference-support.ts';

const report = JSON.parse(readFileSync(resolve(process.argv[2] ?? '../.build/oracle/party-combat-browser-report.json'), 'utf8'));
assert.equal(report.format, 'elona-original-oracle'); assert.equal(report.status, 'passed'); assert.equal(report.repeatable, true);
assert.equal(report.build.status, 'passed'); assert.equal(report.build.all_non_doabc_tag_payloads_identical, true);
assert.equal(report.build.original_party_combat_methods_preserved, true);
assert.equal(report.runs.length, 2); assert.deepEqual(report.runs[0], report.runs[1]);
const result = comparePartyCombatTrace(report.runs[0]);
const output = { status: result.status, referenceRuntime: report.runtime,
  originalSha256: report.build.original_sha256, instrumentedSwfSha256: report.build.output_sha256,
  traceSha256: createHash('sha256').update(JSON.stringify(report.runs[0])).digest('hex'),
  boundary: 'Actual original procHit/enemy.damage, three class-modified NPC shoot contacts, damageCastle retaliation and eventAfterBattle through companion progression, before loot generation',
  matchedSnapshots: result.matchedSnapshots, comparisons: result.comparisons,
  limits: ['Single original contour predicate is captured input; this does not revalidate renderer geometry',
    'Settlement adapter stops actual finishDay only at the following prepareOrdinaryLoot call; loot generation and result payment have separate fixtures',
    'Hero personal lifetime kills and earnedGold are observed but not yet represented separately from battle total in this adapter',
    'No native callback scheduling, projectile travel or whole-campaign balance claim'],
};
writeFileSync(resolve('../.build/oracle/party-combat-comparison-report.json'), JSON.stringify(output, null, 2) + '\n');
const before = resolve('../.build/oracle/party-combat-comparison-before.json');
if (result.status === 'failed' && !existsSync(before)) writeFileSync(before, JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({ status: result.status, matchedSnapshots: result.matchedSnapshots,
  differences: result.comparisons.filter(row => !row.matched).map(({ differences, ...row }) => ({ ...row, fields: differences.map(value => value.field) })) }, null, 2));
assert.equal(result.status, 'passed', 'Party combat differs; inspect .build/oracle/party-combat-comparison-report.json.');
