import test from 'node:test';
import assert from 'node:assert/strict';
import { TRAIT, SHERIFF_CHOICE_ORDER, applySheriffChoice, availableSheriffTraits, calcTrait, createSheriffTraits, describeTrait, rollSheriffChoices } from '../src/progression.ts';

test('Sheriff starts with the original known skills and leaves missing hidden rolls unknown', () => {
  assert.deepEqual(createSheriffTraits(), { 6: 1, 105: 2, 121: 1 });
  assert.deepEqual(createSheriffTraits(3, 8), { 6: 1, 105: 2, 121: 1, 900: 3, 901: 8 });
  assert.throws(() => createSheriffTraits(0, 3));
  assert.throws(() => createSheriffTraits(2));
  assert.deepEqual(availableSheriffTraits(2, createSheriffTraits()), [105, 100, 101, 107, 102, 110, 113, 116, 118, 121, 125, 134, 129, 137, 132]);
  assert.equal(availableSheriffTraits(1, createSheriffTraits()).includes(TRAIT.SHOTGUN), false);
});

test('duplicate skill draws retry with original list positions; choices do not reorder the source list', () => {
  const values = [0, 0.01, 0.07, 0.99];
  let calls = 0;
  assert.deepEqual(rollSheriffChoices(2, createSheriffTraits(), () => values[calls++]), [105, 100, 132]);
  assert.equal(calls, 4);
});

test('Capable adds options, maxed traits are excluded, and successful focus uses its own draw', () => {
  const traits = { ...createSheriffTraits(), [TRAIT.CAPABLE]: 2 };
  const values = [0, 0.08, 0.15, 0.22, 0.3];
  let calls = 0;
  assert.deepEqual(rollSheriffChoices(2, traits, () => values[calls++]), [105, 100, 101, 107, 110]);
  assert.equal(calls, 5);
  assert.equal(availableSheriffTraits(2, traits).includes(TRAIT.CAPABLE), false);
  let focusedCalls = 0;
  const focusedValues = [0.5, 0, 0.07];
  assert.deepEqual(rollSheriffChoices(2, createSheriffTraits(), () => focusedValues[focusedCalls++], TRAIT.FURY), [121, 105, 100]);
  assert.equal(focusedCalls, 3);
});

test('choosing a displayed skill increments its original ID only and rejects missing or maxed choices', () => {
  const traits = createSheriffTraits();
  assert.equal(applySheriffChoice(traits, [TRAIT.FURY, TRAIT.RELOADING, TRAIT.CAPABLE], TRAIT.SHOTGUN), false);
  assert.equal(applySheriffChoice(traits, [TRAIT.FURY, TRAIT.RELOADING, TRAIT.CAPABLE], TRAIT.FURY), true);
  assert.equal(traits[121], 2);
  traits[TRAIT.CAPABLE] = 2;
  assert.equal(applySheriffChoice(traits, [TRAIT.CAPABLE], TRAIT.CAPABLE), false);
  assert.equal(applySheriffChoice(traits, [6], 6), false);
});

test('skill descriptions preserve original preview labels, truncation, new/maxed flags and party suffix', () => {
  const traits = createSheriffTraits();
  assert.equal(describeTrait(TRAIT.SHOTGUN, traits).name, 'Shotgun 3');
  assert.equal(describeTrait(TRAIT.RELOADING, traits).name, 'Reloading(New!)');
  assert.equal(describeTrait(TRAIT.FURY, traits).currentEffect, '13% more rampage duration');
  assert.equal(describeTrait(TRAIT.FURY, traits).nextEffect, '18% more rampage duration');
  assert.equal(describeTrait(TRAIT.DR_HOLLIDAY, traits).nextEffect, '+1 shot(s) fired');
  assert.equal(calcTrait(TRAIT.DR_HOLLIDAY, 1), 10);
  assert.equal(calcTrait(TRAIT.DR_HOLLIDAY, 0), 0);
  assert.equal(describeTrait(TRAIT.DEFENDER, traits).currentEffect, 'None');
  assert.ok(describeTrait(TRAIT.DEFENDER, traits).description.endsWith(' Party Skill.'));
  assert.equal(describeTrait(TRAIT.CAPABLE, { ...traits, [TRAIT.CAPABLE]: 1 }).nextEffect, '+2 option(s) availabe when leveled [Maxed]');
  assert.ok(SHERIFF_CHOICE_ORDER.every(id => Number.isFinite(calcTrait(id, 1))));
});
