import { ALL_TRAITS, CLASS_CHOICE_ORDER } from './party-progression.ts';
import { availableClassTraits, rollClassChoices, applyClassChoice, type TraitLevels } from './progression.ts';

export const HERO_CLASSES = {
  rogue: { id: 3, name: 'Rogue', traits: { 103: 2, 104: 1, 108: 1 }, hint: 'Starts with Little Girl.', description: 'Rogues are the best money winners and also learn many useful skills that benefit the entire party.' },
  hunter: { id: 1, name: 'Hunter', traits: { 103: 1, 104: 1, 105: 1, 109: 1 }, hint: 'Starts with Little Girl.', description: 'Hunters do not confine themselves to a single field. They aim at developing all around skills and receive many skills to choose from. ' },
  sheriff: { id: 6, name: 'Sheriff', traits: { 105: 2, 121: 1 }, hint: 'Starts with a shotgun.', description: 'Sheriffs are the experts of shotgun. Though they somewhat lack teamwork, they are deadly at close range combat.' },
  militia: { id: 4, name: 'Militia', traits: { 104: 2, 106: 1 }, hint: 'Starts with a rifle.', description: 'Militia can use both rifles and big guns well. A militia can learn a wide variety of combat skills and a few party skills.' },
  sniper: { id: 2, name: 'Sniper', traits: { 104: 2, 119: 1 }, hint: 'Starts with a rifle.', description: "Snipers are simply the best damage dealers. They don't get any party skill nor are they good at shooting at crowds, but they can take out the enemies one by one pretty quickly.", unlockMedal: 68 },
  ranger: { id: 5, name: 'Ranger', traits: { 103: 1, 106: 2 }, hint: 'Starts with cheap worn HMG.', description: 'Rangers use big guns effectively and are also good natural leaders. They can take out big crowds and raise the morale of the party with their party skills.', unlockMedal: 65 },
  duelist: { id: 7, name: 'Duelist', traits: { 103: 3 }, hint: 'Starts with a modified pistol.', description: 'Duelists are the specialists of small guns. They learn various tactics and skills to adapt to any combat situation.', unlockMedal: 66 },
  noble: { id: 8, name: 'Noble', traits: { 103: 1, 104: 1, 105: 1, 106: 1 }, hint: 'Starts with a modified smg.', description: 'Nobles start with only few basic skills and no unique skills. However, they have the biggest potentials and possibilities.', unlockMedal: 67 },
} as const;
export type HeroClass = keyof typeof HERO_CLASSES;
export function isHeroClass(value: unknown): value is HeroClass {
  return typeof value === 'string' && Object.hasOwn(HERO_CLASSES, value);
}
export function heroClassUnlocked(classId: HeroClass, medals: readonly number[]): boolean {
  const definition = HERO_CLASSES[classId];
  return !('unlockMedal' in definition) || medals.includes(definition.unlockMedal);
}

export function heroClassMedal(classId: HeroClass): number | undefined {
  return ({ hunter: 65, rogue: 66, sheriff: 67, militia: 68 } as Partial<Record<HeroClass, number>>)[classId];
}

export function startingHeroTraits(classId: HeroClass, aiming: number, teamwork: number): TraitLevels {
  const definition = HERO_CLASSES[classId];
  return { [definition.id]: 1, ...definition.traits, 900: aiming, 901: teamwork };
}

export function availableHeroTraits(classId: HeroClass, characterLevel: number, traits: Readonly<TraitLevels>): number[] {
  return availableClassTraits(CLASS_CHOICE_ORDER[HERO_CLASSES[classId].id], ALL_TRAITS, characterLevel, traits);
}

export function rollHeroChoices(classId: HeroClass, characterLevel: number, traits: Readonly<TraitLevels>, random: () => number, focus = -1): number[] {
  return rollClassChoices(CLASS_CHOICE_ORDER[HERO_CLASSES[classId].id], ALL_TRAITS, characterLevel, traits, random, focus);
}

export function applyHeroChoice(classId: HeroClass, traits: TraitLevels, choices: readonly number[], id: number): boolean {
  return applyClassChoice(CLASS_CHOICE_ORDER[HERO_CLASSES[classId].id], ALL_TRAITS, traits, choices, id);
}
