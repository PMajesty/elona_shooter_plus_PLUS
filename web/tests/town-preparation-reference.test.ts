import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { prepareFirstTown } from '../src/town-preparation.ts';
import { compareTownPreparationTrace } from './town-preparation-reference-support.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-town-preparation-trace.json', import.meta.url), 'utf8'));

test('ordered first-town preparation matches 16 independent original snapshots including all nine recruit classes', () => {
  assert.equal(fixture.format, 'elona-original-town-preparation-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  const result = compareTownPreparationTrace(fixture.records);
  assert.equal(result.status, 'passed');
  assert.equal(result.matchedSnapshots, 16);
  assert.deepEqual(result.recruitClasses, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
});

test('the independent town reference detects an extra random draw before preparation', () => {
  const result = compareTownPreparationTrace(fixture.records, (random, input) => {
    random();
    return prepareFirstTown(random, input);
  });
  assert.equal(result.status, 'failed');
  assert.ok(result.comparisons.some(row => row.differences.some(difference => ['drawCount', 'rngState', 'saveBoundary'].includes(difference.field))));
});
