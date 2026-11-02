import test from 'node:test';
import assert from 'node:assert/strict';
import { traitHintValues } from '../src/trait-hint.ts';
import { describeTrait } from '../src/progression.ts';
import { ALL_TRAITS } from '../src/party-progression.ts';

test('source Sniper and Duelist hint markers become their actual maximum damage bonuses', () => {
  const sniper = traitHintValues(2, { 2: 1 });
  assert.equal(sniper.name, 'Sniper'); assert.equal(sniper.effect, '63% damage bonus(max)');
  assert.equal(sniper.kind, 'Base Skill'); assert.equal(sniper.maximum, '');
  assert.equal(traitHintValues(2, { 2: 25 }).effect, '95% damage bonus(max)');
  assert.equal(traitHintValues(7, { 7: 25 }).effect, '73% damage bonus(max)');
  assert.equal(describeTrait(2, {}, ALL_TRAITS).nextEffect, '63% damage bonus(max)');
});

test('owned-skill hints retain source caps, maxed wording and None without proposing an improvement', () => {
  const levels = { 108: 10 }, before = structuredClone(levels), luck = traitHintValues(108, levels);
  assert.equal(luck.name, 'Luck 10'); assert.equal(luck.maximum, '10');
  assert.equal(luck.effect, '57% more chance [Maxed]'); assert.equal(luck.kind, '');
  assert.equal(traitHintValues(108, {}).effect, 'None'); assert.deepEqual(levels, before);
});

test('weapon skills remain normal and focusable while party/base hints retain their original labels', () => {
  const shotgun = traitHintValues(105, { 105: 2 });
  assert.equal(shotgun.name, 'Shotgun 2'); assert.equal(shotgun.kind, '');
  assert.equal(traitHintValues(900, { 900: 5 }).kind, 'Base Skill');
  const scavenger = traitHintValues(109, { 109: 1 });
  assert.equal(scavenger.kind, 'Party Skill'); assert.match(scavenger.description, / Party Skill\.$/);
  assert.throws(() => traitHintValues(9999, {}), /Unknown trait/);
});
