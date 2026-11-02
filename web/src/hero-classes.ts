import { ALL_TRAITS, CLASS_CHOICE_ORDER } from './party-progression.ts';
import { availableClassTraits, rollClassChoices, applyClassChoice, type TraitLevels } from './progression.ts';

export const HERO_CLASSES = {
  rogue: { id: 3, name: 'Rogue', traits: { 103: 2, 104: 1, 108: 1 }, hint: 'Starts with Little Girl.' },
  hunter: { id: 1, name: 'Hunter', traits: { 103: 1, 104: 1, 105: 1, 109: 1 }, hint: 'Starts with Little Girl.' },
  sheriff: { id: 6, name: 'Sheriff', traits: { 105: 2, 121: 1 }, hint: 'Starts with a shotgun.' },
  militia: { id: 4, name: 'Militia', traits: { 104: 2, 106: 1 }, hint: 'Starts with a rifle.' },
} as const;
export type HeroClass = keyof typeof HERO_CLASSES;
export function isHeroClass(value: unknown): value is HeroClass {
  return typeof value === 'string' && Object.hasOwn(HERO_CLASSES, value);
}

export function startingHeroTraits(classId: HeroClass, aiming: number, teamwork: number): TraitLevels {
  const definition = HERO_CLASSES[classId];
  return { [definition.id]: 1, ...definition.traits, 900: aiming, 901: teamwork };
}

export function availableHeroTraits(classId: HeroClass, characterLevel: number, traits: Readonly<TraitLevels>): number[] {
  return availableClassTraits(CLASS_CHOICE_ORDER[HERO_CLASSES[classId].id], ALL_TRAITS, characterLevel, traits);
}

export function rollHeroChoices(classId: HeroClass, characterLevel: number, traits: Readonly<TraitLevels>, random: () => number): number[] {
  return rollClassChoices(CLASS_CHOICE_ORDER[HERO_CLASSES[classId].id], ALL_TRAITS, characterLevel, traits, random);
}

export function applyHeroChoice(classId: HeroClass, traits: TraitLevels, choices: readonly number[], id: number): boolean {
  return applyClassChoice(CLASS_CHOICE_ORDER[HERO_CLASSES[classId].id], ALL_TRAITS, traits, choices, id);
}
