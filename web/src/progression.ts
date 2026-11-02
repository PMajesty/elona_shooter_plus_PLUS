import { sniperDamageLimit, duelistDamageLimit } from './class-limits.ts';

export type TraitLevels = Record<number, number>;
export const TRAIT = {
  SHERIFF: 6, COOL: 100, ACCURACY: 101, CAPABLE: 102, SHOTGUN: 105,
  RELOADING: 107, DR_HOLLIDAY: 110, DEFENDER: 113, LEADERSHIP: 116,
  INSURANCE: 118, FURY: 121, TAUNT: 125, CRIPPLE_SHOT: 129,
  ANTI_ARMOR: 132, LAST_HOPE: 134, QUICK_EYED: 137,
  BASE_AIMING: 900, BASE_TEAMWORK: 901,
} as const;

export interface TraitDefinition {
  id: number; name: string; maxLevel: number; requiredLevel: number; party: boolean;
  description: string; effectPrefix: string; effectSuffix: string;
  calculate(level: number): number; displayLevel?: boolean;
}

// Порядок, ID, пределы и формулы взяты из init()/setTrait и devGroup[_devSheriff].
export const SHERIFF_CHOICE_ORDER: readonly number[] = [105, 100, 101, 107, 102, 110, 113, 116, 118, 121, 125, 134, 129, 137, 132];
export const SHERIFF_TRAITS: Readonly<Record<number, TraitDefinition>> = {
  6: { id: 6, name: 'Sheriff', maxLevel: 999, requiredLevel: 1, party: false,
    description: 'Enemies shot by a sheriff will be knocked back and slowed down, making them easy targets.',
    effectPrefix: '+', effectSuffix: ' knock back', calculate: level => 5 + Math.sqrt(level) },
  100: { id: 100, name: 'Cool', maxLevel: 999, requiredLevel: 1, party: false,
    description: 'Makes you calm and recover quicikly from gun recoil. For NPCs, it directly increases accuracy.',
    effectPrefix: '', effectSuffix: '% faster recovery', calculate: level => level + Math.sqrt(level) * 11 },
  101: { id: 101, name: 'Accuracy', maxLevel: 999, requiredLevel: 1, party: false,
    description: 'Decreases the bullet spread, making it fly to just where you aim at.',
    effectPrefix: '', effectSuffix: '% less bullet spread', calculate: level => level + Math.sqrt(level) * 10 },
  102: { id: 102, name: 'Capable', maxLevel: 2, requiredLevel: 1, party: false,
    description: 'You will be able to see more skill options when leveling up.',
    effectPrefix: '+', effectSuffix: ' option(s) availabe when leveled', calculate: level => level },
  103: { id: 103, name: 'Small Gun', maxLevel: 999, requiredLevel: 2, party: false,
    description: 'The skill is required to handle small weapons such as pistols and sub machine gun.',
    effectPrefix: 'You can equip Lv.', effectSuffix: ' small guns', calculate: level => level },
  104: { id: 104, name: 'Rifle', maxLevel: 999, requiredLevel: 2, party: false,
    description: 'The skill is required to handle rifles such as assault rifles and sniper rifles.',
    effectPrefix: 'You can equip Lv.', effectSuffix: ' rifles', calculate: level => level },
  105: { id: 105, name: 'Shotgun', maxLevel: 999, requiredLevel: 2, party: false,
    description: 'The skill is required to handle shotguns.',
    effectPrefix: 'You can equip Lv.', effectSuffix: ' shotguns', calculate: level => level },
  106: { id: 106, name: 'Big Gun', maxLevel: 999, requiredLevel: 2, party: false,
    description: 'The skill is required to handle big guns such as Rockets and Flame throwers.',
    effectPrefix: 'You can equip Lv.', effectSuffix: ' big guns', calculate: level => level },
  107: { id: 107, name: 'Reloading', maxLevel: 999, requiredLevel: 1, party: false,
    description: 'Reloading! Faster reloading is all you need!',
    effectPrefix: '', effectSuffix: '% faster reloading', calculate: level => level + Math.sqrt(level) * 10 },
  110: { id: 110, name: 'Dr Holliday', maxLevel: 5, requiredLevel: 1, party: false,
    description: 'When equipped with a shotgun, each level of the skill increases the number of shells shot but decreases accuracy.',
    effectPrefix: '+', effectSuffix: ' shot(s) fired', calculate: level => level * 7 + 3, displayLevel: true },
  113: { id: 113, name: 'Defender', maxLevel: 10, requiredLevel: 1, party: true,
    description: 'Occasionally, you will be able to completely nullify the damage done to the castle. ',
    effectPrefix: '', effectSuffix: '% nullify chance', calculate: level => level * 2 + 3 },
  116: { id: 116, name: 'Leadership', maxLevel: 10, requiredLevel: 1, party: true,
    description: 'Leadership raises the morale of the team, making your troops aim faster.',
    effectPrefix: '', effectSuffix: '% faster aiming', calculate: level => level * 5 + 2 },
  118: { id: 118, name: 'Insurance', maxLevel: 10, requiredLevel: 1, party: true,
    description: 'You receive the insurance EVERY TIME an enemy hits the castle!',
    effectPrefix: 'You get ', effectSuffix: ' gp', calculate: level => 1 + level },
  121: { id: 121, name: 'Fury', maxLevel: 10, requiredLevel: 1, party: false,
    description: "Everyone should just make sure not to piss you off. Your rampage duration lasts longer than normal. Stacks on the ranger's bonus.",
    effectPrefix: '', effectSuffix: '% more rampage duration', calculate: level => level + Math.sqrt(level) * 12 },
  125: { id: 125, name: 'Taunt', maxLevel: 5, requiredLevel: 1, party: true,
    description: 'Taunting enemies makes them angry and stronger. But it will increase the mission reward money somehow.',
    effectPrefix: '', effectSuffix: '% more reward', calculate: level => level * 10 + 10 },
  129: { id: 129, name: 'Cripple Shot', maxLevel: 10, requiredLevel: 1, party: false,
    description: 'Slows down the shot enemy so you can dish it anyway you want.',
    effectPrefix: '', effectSuffix: '% slow down per hit', calculate: level => 2 + level * 3 },
  132: { id: 132, name: 'Anti Armor', maxLevel: 10, requiredLevel: 1, party: false,
    description: 'You know weak spots of armored creatures.',
    effectPrefix: '', effectSuffix: '% more damage vs Armor', calculate: level => 2 + level * 7 },
  134: { id: 134, name: 'Last Hope', maxLevel: 10, requiredLevel: 1, party: false,
    description: 'When the castle is attacked while the wall is heavily damaged, you get a fair chance of going rampage.',
    effectPrefix: 'When the wall HP is less than', effectSuffix: '%', calculate: level => 15 + level * 4 },
  137: { id: 137, name: 'Quick Eyed', maxLevel: 10, requiredLevel: 1, party: true,
    description: 'The feat increases the chance you get good events while searching in the town.',
    effectPrefix: '', effectSuffix: '% more good events', calculate: level => 5 + level * 10 },
  900: { id: 900, name: 'Base Aiming', maxLevel: 999, requiredLevel: 999, party: false,
    description: "Indicates how fast he can aim at his target. Base skills can't be focused. He will gradually develop them depending on his potential.",
    effectPrefix: 'Aiming Speed +', effectSuffix: '', calculate: level => level },
  901: { id: 901, name: 'Base Teamwork', maxLevel: 999, requiredLevel: 999, party: false,
    description: "Indicates his workrate. Base skills can't be focused. He will gradually develop them depending on his potential.",
    effectPrefix: 'Work Rate +', effectSuffix: '', calculate: level => level },
};

export function createSheriffTraits(baseAiming?: number, baseTeamwork?: number): TraitLevels {
  const traits = { [TRAIT.SHERIFF]: 1, [TRAIT.SHOTGUN]: 2, [TRAIT.FURY]: 1 };
  // У старого порта нет исходных бросков базовых навыков; отсутствие не подменяем единицей.
  if (baseAiming === undefined && baseTeamwork === undefined) return traits;
  if (![baseAiming, baseTeamwork].every(value => typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 10)) throw new Error('Starting base skills must be original rolls from 1 to 10.');
  return { ...traits, [TRAIT.BASE_AIMING]: baseAiming!, [TRAIT.BASE_TEAMWORK]: baseTeamwork! };
}

export function calcTrait(id: number, level: number): number {
  if (!Object.hasOwn(SHERIFF_TRAITS, id)) throw new Error(`Unknown Sheriff trait: ${id}`);
  // CALC возвращает ноль для невыученного навыка, даже если формула содержит константу.
  return level <= 0 ? 0 : SHERIFF_TRAITS[id].calculate(level);
}

export function availableSheriffTraits(characterLevel: number, traits: Readonly<TraitLevels>): number[] {
  return availableClassTraits(SHERIFF_CHOICE_ORDER, SHERIFF_TRAITS, characterLevel, traits);
}

export function availableClassTraits(order: readonly number[], definitions: Readonly<Record<number, TraitDefinition>>, characterLevel: number, traits: Readonly<TraitLevels>): number[] {
  // Оба базовых навыка заведомо существуют; неизвестны только их неперенесённые значения.
  const owned = Object.values(traits).filter(level => level !== undefined && level !== 0).length + (traits[TRAIT.BASE_AIMING] === undefined ? 1 : 0) + (traits[TRAIT.BASE_TEAMWORK] === undefined ? 1 : 0);
  return order.filter(id => {
    const level = traits[id] ?? 0, definition = definitions[id];
    return definition.maxLevel >= level + 1 && definition.requiredLevel <= characterLevel && !(owned > 17 && level === 0);
  });
}

export function rollSheriffChoices(characterLevel: number, traits: Readonly<TraitLevels>, random: () => number, focus = -1): number[] {
  return rollClassChoices(SHERIFF_CHOICE_ORDER, SHERIFF_TRAITS, characterLevel, traits, random, focus);
}

export function rollClassChoices(order: readonly number[], definitions: Readonly<Record<number, TraitDefinition>>, characterLevel: number, traits: Readonly<TraitLevels>, random: () => number, focus = -1): number[] {
  const pool = availableClassTraits(order, definitions, characterLevel, traits);
  if (pool.length === 0) throw new Error('No hero skills are available for this level.');
  const choices: number[] = [];
  let attempts = 0;
  const count = 3 + calcTrait(TRAIT.CAPABLE, traits[TRAIT.CAPABLE] ?? 0);
  while (choices.length < count) {
    let index = -1;
    if (choices.length === 0 && focus !== -1) {
      for (let candidate = 0; candidate < pool.length; candidate++) {
        if (pool[candidate] !== focus) continue;
        if (random() > 0.5) break;
        index = candidate;
      }
    }
    if (index === -1) index = Math.trunc(random() * pool.length);
    attempts++;
    // listTrait2 после 2000 попыток выдаёт начало списка класса, даже с предельными навыками.
    if (attempts > 2000) choices.push(order[choices.length]);
    else if (pool[index] !== -1 && definitions[pool[index]].maxLevel >= (traits[pool[index]] ?? 0) + 1) {
      choices.push(pool[index]); pool[index] = -1;
    }
  }
  return choices;
}

export function applySheriffChoice(traits: TraitLevels, choices: readonly number[], id: number): boolean {
  return applyClassChoice(SHERIFF_CHOICE_ORDER, SHERIFF_TRAITS, traits, choices, id);
}

export function applyClassChoice(order: readonly number[], definitions: Readonly<Record<number, TraitDefinition>>, traits: TraitLevels, choices: readonly number[], id: number): boolean {
  if (!Number.isInteger(id) || !order.includes(id) || !choices.includes(id)) return false;
  const level = traits[id] ?? 0;
  if (level >= definitions[id].maxLevel) return false;
  traits[id] = level + 1;
  return true;
}

export interface TraitDescription {
  id: number; name: string; description: string; currentLevel: number; nextLevel: number;
  maxLevel: number; currentEffect: string; nextEffect: string; canImprove: boolean;
}

export function describeTrait(id: number, traits: Readonly<TraitLevels>, definitions: Readonly<Record<number, TraitDefinition>> = SHERIFF_TRAITS): TraitDescription {
  if (!Object.hasOwn(definitions, id)) throw new Error(`Unknown trait: ${id}`);
  const definition = definitions[id], current = traits[id] ?? 0, next = current + 1;
  const effect = (level: number) => {
    if (level === 0) return 'None';
    const value = definition.effectPrefix === 'sniper1' ? `${sniperDamageLimit(level) - 100}% damage bonus(max)`
      : definition.effectPrefix === 'duelist1' ? `${duelistDamageLimit(level)}% damage bonus(max)`
      : `${definition.effectPrefix}${definition.displayLevel ? level : Math.trunc(definition.calculate(level))}${definition.effectSuffix}`;
    return value + (level === definition.maxLevel ? ' [Maxed]' : '');
  };
  return {
    id, name: `${definition.name}${next > 1 ? ` ${next}` : '(New!)'}`,
    description: definition.description + (definition.party ? ' Party Skill.' : ''),
    currentLevel: current, nextLevel: next, maxLevel: definition.maxLevel,
    currentEffect: effect(current), nextEffect: effect(next), canImprove: next <= definition.maxLevel,
  };
}
