import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compareReloadTrace } from './reference-support.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-reload-trace.json', import.meta.url), 'utf8'));

test('reload transitions match 72 snapshots captured from two identical original SWF runs', () => {
  assert.equal(fixture.format, 'elona-original-reload-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  const comparison = compareReloadTrace(fixture.records);
  assert.equal(comparison.scenarios, 5);
  assert.equal(comparison.matchedSnapshots, 72);
});

test('original trace detects the previous missing per-shell feedback regression', () => {
  assert.throws(() => compareReloadTrace(fixture.records, true), /empty_reload\/timer\/7: sound intents differ/);
});
