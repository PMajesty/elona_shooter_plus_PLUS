import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { comparePartyProgressionTrace } from './party-progression-reference-support.ts';
import { gainCompanionTrait } from '../src/party-progression.ts';

const trace = JSON.parse(readFileSync(new URL('./fixtures/original-party-progression-trace.json', import.meta.url), 'utf8'));

test('all nine companion classes match 45 original skill, focus, party, growth and wage checkpoints', () => {
  const result = comparePartyProgressionTrace(trace);
  assert.equal(result.status, 'passed'); assert.equal(result.matchedSnapshots, 45);
});

test('original companion progression detects an extra random draw even when choices remain reproducible', () => {
  const result = comparePartyProgressionTrace(trace, (member, party, random, slot) => {
    const chosen = gainCompanionTrait(member, party, random, slot);
    random(); return chosen;
  });
  assert.equal(result.status, 'failed');
  assert.ok(result.comparisons.every(row => row.differences.some(difference => difference.field === 'traitState')));
});
