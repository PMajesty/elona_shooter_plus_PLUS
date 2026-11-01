import test from 'node:test';
import assert from 'node:assert/strict';
import { generateSheriffHero, isKnownHeroInitialization, levelUpHero, reconstructSheriffHero, unknownHeroInitialization } from '../src/hero.ts';
import { ItemFactory } from '../src/items.ts';

test('Sheriff creation consumes source identity/base draws before grenade, bow and shotgun generation', () => {
  const prefix = [0.9, 0.23, 0.25, 0.75, 0, 0.999, 0.42];
  let draws = 0;
  const result = generateSheriffHero(() => prefix[draws++] ?? 0.5);
  assert.deepEqual(result.hero, { provenance: 'original-generation', sex: 1, name: 'You', potentialAim: 0.25 / 1.25 + 0.1, potentialTeam: 0.75 / 1.25 + 0.1, nextTrait: 42 });
  assert.deepEqual(result.traits, { 6: 1, 105: 2, 121: 1, 900: 1, 901: 10 });
  assert.equal(draws, 16);
  assert.equal(result.inventory.length, 6);
  assert.equal(result.inventory[0]!.id, 3);
  assert.equal(result.inventory[0]!.modMax, 2);
  assert.equal(result.inventory[0]!.value, 580);
  assert.equal(result.inventory[1]!.name, "Soldier's Grenade");
  assert.equal(result.inventory[1]!.ammo, 5);
  assert.equal(result.inventory[1]!.attack, 45);
  assert.equal(result.inventory[1]!.value, 100);
  assert.equal('pic' in result.hero, false);
  assert.ok(isKnownHeroInitialization(result.hero));
});

test('hero equipment generation preserves untouched slot history without mutating previous inventory', () => {
  const factory = new ItemFactory(() => 0.5);
  const inventory = [factory.generate(3), factory.generate(3), factory.generate(117), null, null, null];
  const before = structuredClone(inventory);
  const result = generateSheriffHero(() => 0.5, inventory);
  assert.deepEqual(inventory, before);
  assert.equal(result.inventory[1]!.baseAccuracy, before[1]!.baseAccuracy);
  assert.deepEqual(result.inventory[2], before[2]);
  assert.notEqual(result.inventory[2], inventory[2]);
});

test('levelUp uses strict potential comparisons, exactly two draws, modulo XP and one level per call', () => {
  const generated = generateSheriffHero(() => 0.5);
  const progress = { level: 4, exp: 2500, skillPoints: 2, traits: { ...generated.traits, 6: 4, 107: 3 } };
  const before = structuredClone(progress);
  const values = [0.5, 0.499999];
  let draws = 0;
  const next = levelUpHero(progress, generated.hero, () => values[draws++]);
  assert.equal(draws, 2);
  assert.equal(next.level, 5);
  assert.equal(next.exp, 500);
  assert.equal(next.skillPoints, 3);
  assert.equal(next.aimingGained, false);
  assert.equal(next.teamworkGained, true);
  assert.equal(next.traits[900], 6);
  assert.equal(next.traits[901], 7);
  assert.equal(next.traits[6], 5);
  assert.equal(next.traits[107], 3);
  assert.deepEqual(progress, before);
});

test('missing raw potentials or base traits are rejected before growth consumes RNG', () => {
  const generated = generateSheriffHero(() => 0.5);
  const unknown = unknownHeroInitialization();
  const progress = { level: 1, exp: 1000, skillPoints: 0, traits: generated.traits };
  let draws = 0;
  const random = () => { draws++; return 0; };
  assert.equal(isKnownHeroInitialization(unknown), false);
  assert.throws(() => levelUpHero(progress, unknown, random), /requires known/);
  const missingBase = { ...progress, traits: { 6: 1, 105: 2, 121: 1 } };
  assert.throws(() => levelUpHero(missingBase, generated.hero, random), /Invalid hero progression/);
  assert.equal(draws, 0);
  assert.equal(progress.exp, 1000);
  assert.equal(progress.level, 1);
});

test('legacy reconstruction is deterministic, bounded by saved level and explicitly not original history', () => {
  const first = reconstructSheriffHero(12, 12345);
  assert.deepEqual(first, reconstructSheriffHero(12, 12345));
  assert.equal(first.hero.provenance, 'legacy-reconstructed');
  assert.equal(first.hero.reconstructionSeed, 12345);
  assert.equal(first.hero.reconstructedAtLevel, 12);
  assert.ok(first.baseAiming >= 1 && first.baseAiming <= 21);
  assert.ok(first.baseTeamwork >= 1 && first.baseTeamwork <= 21);
  assert.ok(isKnownHeroInitialization(first.hero));
  assert.deepEqual(Object.keys(first).sort(), ['baseAiming', 'baseTeamwork', 'hero']);
  assert.equal(reconstructSheriffHero(1, 0).hero.reconstructionSeed, 1);
  assert.throws(() => reconstructSheriffHero(0, 42));
  assert.throws(() => reconstructSheriffHero(2, -1));
  assert.throws(() => reconstructSheriffHero(2, 1.5));
  assert.throws(() => reconstructSheriffHero(1e10, 42));
});

test('hero provenance validation rejects malformed potentials and disguised reconstruction', () => {
  const { hero } = generateSheriffHero(() => 0.5);
  for (const patch of [
    { potentialAim: null }, { potentialTeam: Number.NaN }, { potentialAim: 0.9 },
    { sex: 2 }, { nextTrait: 100 }, { nextTrait: 3.2 },
    { provenance: 'original-generation', reconstructionSeed: 42 },
    { provenance: 'legacy-reconstructed' },
  ]) assert.equal(isKnownHeroInitialization({ ...hero, ...patch }), false);
});
