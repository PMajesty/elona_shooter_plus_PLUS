import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { compareProjectileTrace } from '../tests/projectile-reference-support.ts';

const report = JSON.parse(readFileSync(resolve(process.argv[2] ?? '../.build/oracle/projectiles-browser-report.json'), 'utf8'));
assert.equal(report.format, 'elona-original-oracle'); assert.equal(report.status, 'passed'); assert.equal(report.repeatable, true);
assert.equal(report.build.status, 'passed'); assert.equal(report.build.all_non_doabc_tag_payloads_identical, true);
assert.equal(report.build.original_projectile_methods_preserved, true);
assert.equal(report.runs.length, 2); assert.deepEqual(report.runs[0], report.runs[1]);
const result = compareProjectileTrace(report.runs[0]);
const output = {
  ...result, referenceRuntime: report.runtime,
  originalSha256: report.build.original_sha256, instrumentedSwfSha256: report.build.output_sha256,
  traceSha256: createHash('sha256').update(JSON.stringify(report.runs[0])).digest('hex'),
  boundary: 'Original shoot/useItem and registered projectile frame methods versus production Simulation launch, advanceProjectile and Simulation hit/explosion callbacks',
  checks: ['launch inputs/ammo/reload/bow drawing and four-draw spread', 'every manual actor step, coordinates, count/penetration/removal and callback ordering', 'original vector membership as input to real production damage', 'weapon slot retained across switching, current weapon experience category, enemy state and all item fields', 'every random value/count/state including explosion shake and corpse SENSE', 'intentional vertical correction retains x, stays finite and explodes once at the requested target'],
  tolerances: { gameplayNumbers: 1e-9, visualNumbers: 1e-7, rotation: 'modulo 360' },
  limits: ['Original vector membership is supplied to the damage comparator; this is not another collision-contour proof', 'Original child frame1 bodies are invoked once if native initialization has not run; the separate native probe measures birth ordering', 'No enemy AI, native interleaving after birth, child timeline animation/audio, repeated manual shooting, or whole battle scheduling parity', 'Two original vertical launches produce NaN trajectory arithmetic and child y=0; corrected port flight to the requested point is intentional and excluded from equality', 'Observed child timeline frame indices and local mcX are outside numerical projectile state comparisons; frame in the port is actor age'],
};
writeFileSync(resolve('../.build/oracle/projectiles-comparison-report.json'), JSON.stringify(output, null, 2) + '\n');
const beforePath = resolve('../.build/oracle/projectiles-comparison-before.json');
if (result.status === 'failed' && !existsSync(beforePath)) writeFileSync(beforePath, JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({
  status: result.status, observedSnapshots: result.observedSnapshots, comparedSnapshots: result.comparedSnapshots,
  matchedSnapshots: result.matchedSnapshots, nativeFirstAdvanceFrame: result.nativeFirstAdvanceFrame, verticalFixChecks: result.verticalFixChecks,
  comparisons: result.comparisons.map(({ differences, visualDifferences, ...row }) => ({ ...row, differences: differences.slice(0, 8).map(difference => difference.field), visualDifferences: visualDifferences.slice(0, 8).map(difference => difference.field) })),
}, null, 2));
assert.equal(result.status, 'passed', 'Projectile comparison differs; inspect .build/oracle/projectiles-comparison-report.json.');
