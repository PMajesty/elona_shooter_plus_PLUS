import { SHERIFF_TRAITS, type TraitDefinition, type TraitLevels } from './progression.ts';
import type { RecruitClass } from './recruits.ts';

// Остальные определения init/setTrait сохраняют исходный порядок и формулы.
export const ALL_TRAITS: Readonly<Record<number, TraitDefinition>> = {
  ...SHERIFF_TRAITS,
  1: { id: 1, name: "Hunter", maxLevel: 999, requiredLevel: 1, party: false,
    description: "A hunter receives reduced range penalty and can fire a gun beyond its effective range.",
    effectPrefix: "-", effectSuffix: "% range penalty", calculate: level => 25 + level + Math.sqrt(level) * 5 },
  3: { id: 3, name: "Rogue", maxLevel: 999, requiredLevel: 1, party: false,
    description: "When a rogue scores a critical kill, the enemy drops money. Guaranteed! She even gets more than normal amount.",
    effectPrefix: "", effectSuffix: "% more money", calculate: level => 20 + level + Math.sqrt(level) * 15 },
  4: { id: 4, name: "Militia", maxLevel: 999, requiredLevel: 1, party: false,
    description: "A militia can occasionally throw a grenade at a random enemy. The throwing rate also increases as he levels.",
    effectPrefix: "", effectSuffix: " grenade damage", calculate: level => 25 + level * 2 },
  2: { id: 2, name: "Sniper", maxLevel: 999, requiredLevel: 1, party: false,
    description: "While a sniper is not firing or reloading, his adrenalin and the damage bonus go up. Adrenalin diminishes once he misses a shot.",
    effectPrefix: "sniper1", effectSuffix: "", calculate: level => Math.sqrt(level) * 3 + 4 },
  5: { id: 5, name: "Ranger", maxLevel: 999, requiredLevel: 1, party: false,
    description: "A ranger gains adrenalin every time he kills an enemy. When it's full, all the troops go rampage and his adrenalin diminishes.",
    effectPrefix: "", effectSuffix: "% more rampage duration", calculate: level => 7 + Math.sqrt(level) * 5 },
  7: { id: 7, name: "Duelist", maxLevel: 999, requiredLevel: 1, party: false,
    description: "When a Duelist shoots an enemy, her adrenalin and the damage bonus go up. Adrenalin diminishes quickly when not firing.",
    effectPrefix: "duelist1", effectSuffix: "", calculate: level => 7 },
  8: { id: 8, name: "Noble", maxLevel: 999, requiredLevel: 1, party: false,
    description: "A noble gains 40% more exp from killing enemies. Also rewarded slight bonuses to damage and accuracy per level.",
    effectPrefix: "", effectSuffix: "% more damage and accuracy", calculate: level => 5 + level / 2 + Math.sqrt(level) * 2 },
  9: { id: 9, name: "Guardian", maxLevel: 999, requiredLevel: 1, party: false,
    description: "When an enemy attacks the castle, a guardian can inflict certain damage back to the enemy.",
    effectPrefix: "", effectSuffix: " damage to the attacker", calculate: level => 4 + Math.trunc(level / 2) },
  108: { id: 108, name: "Luck", maxLevel: 10, requiredLevel: 1, party: false,
    description: "Increases the chance that the killed enemy drops gold pieces. When stacked on the rogue's critical kill bonus, she gets double the money.",
    effectPrefix: "", effectSuffix: "% more chance", calculate: level => level * 2 + Math.sqrt(level) * 12 },
  109: { id: 109, name: "Scavenger", maxLevel: 10, requiredLevel: 1, party: true,
    description: "Enemies killed by your troops drop items more often with the skill.",
    effectPrefix: "", effectSuffix: "% extra chance of item drop", calculate: level => level + Math.sqrt(level) * 8 },
  111: { id: 111, name: "Sense", maxLevel: 10, requiredLevel: 1, party: false,
    description: "It gives you a small chance of critical shot even when you don't hit the enemy's weak spot.",
    effectPrefix: "", effectSuffix: "% chance of critical hit", calculate: level => level + Math.sqrt(level) * 6 },
  112: { id: 112, name: "Threat", maxLevel: 10, requiredLevel: 1, party: true,
    description: "Threaten the enemies to reduce their speed.",
    effectPrefix: "Enemies move ", effectSuffix: "% slower", calculate: level => level * 2 + 1 },
  114: { id: 114, name: "One hit kill", maxLevel: 10, requiredLevel: 1, party: false,
    description: "When equipped with a sniper rifle, you can sometimes kill an enemy in 1 shot no matter how much HP it has. Doesn't work on bosses though.",
    effectPrefix: "", effectSuffix: "% chance of 1 hit kill", calculate: level => level * 3 + 2 },
  115: { id: 115, name: "Aimed shot", maxLevel: 10, requiredLevel: 1, party: false,
    description: "Each level invested in the skill increases the damage but decreases fire rate.",
    effectPrefix: "", effectSuffix: "% more damage", calculate: level => level * 7 },
  117: { id: 117, name: "Negotiator", maxLevel: 10, requiredLevel: 1, party: true,
    description: "Enables you to negotiate a better reward price.",
    effectPrefix: "", effectSuffix: "% better reward", calculate: level => level * 4 + 5 },
  119: { id: 119, name: "Killer", maxLevel: 10, requiredLevel: 1, party: false,
    description: "You are a real killer. When you score a critical kill, your shot cooldown is greatly reduced.",
    effectPrefix: "", effectSuffix: "% cooldown reduction", calculate: level => level + Math.sqrt(level) * 20 },
  120: { id: 120, name: "Engineer", maxLevel: 10, requiredLevel: 1, party: true,
    description: "You know how to build a good gun. When adding a modification to a gun, the effect increases.",
    effectPrefix: "", effectSuffix: "% bonus to the effect", calculate: level => 2 + level * 5 },
  122: { id: 122, name: "Robber", maxLevel: 10, requiredLevel: 1, party: true,
    description: "You can slaugher more people and get more money in the museum!",
    effectPrefix: "+", effectSuffix: " more people killed", calculate: level => level * 7 },
  123: { id: 123, name: "Active", maxLevel: 10, requiredLevel: 1, party: true,
    description: "You become a hyperactive person. You get a small chance of gaining extra AP after each battle.",
    effectPrefix: "+", effectSuffix: " AP (random)", calculate: level => level },
  124: { id: 124, name: "Breeder", maxLevel: 10, requiredLevel: 1, party: true,
    description: "You know how to encourage the egg production of chickens. Your lovely chickens will give you more eggs!",
    effectPrefix: "", effectSuffix: "% more eggs", calculate: level => level * 6 + 3 },
  126: { id: 126, name: "Cook", maxLevel: 5, requiredLevel: 1, party: true,
    description: "Increases the benefit of having dinner. In short, you get more exp after dinner.",
    effectPrefix: "+", effectSuffix: " base exp bonus", calculate: level => level * 5 + 2 },
  127: { id: 127, name: "Accountant", maxLevel: 10, requiredLevel: 1, party: true,
    description: "Think the wages you pay are too much? Have an accountant and hold down the wages!",
    effectPrefix: "-", effectSuffix: "% cheaper wages", calculate: level => level * 4 + 3 },
  128: { id: 128, name: "Bow master", maxLevel: 10, requiredLevel: 1, party: false,
    description: "You've mastered the art of the bow. Your arrows and bolts penetrate through enemies.",
    effectPrefix: "+", effectSuffix: " penetrations", calculate: level => level },
  130: { id: 130, name: "Disarm", maxLevel: 10, requiredLevel: 1, party: false,
    description: "Lowers the damage dealt by the shot enemy. Very effective against tough creatures.",
    effectPrefix: "", effectSuffix: "% reduced damage", calculate: level => level * 20 },
  131: { id: 131, name: "Anti air", maxLevel: 10, requiredLevel: 1, party: false,
    description: "You know weak spots of air creatures.",
    effectPrefix: "", effectSuffix: "% more damage vs Air", calculate: level => 2 + level * 7 },
  133: { id: 133, name: "Da bomb", maxLevel: 10, requiredLevel: 1, party: false,
    description: "Explosive weapons such as rockets, grenades, flame thrower and gravity gun have an additional explode radius.",
    effectPrefix: "", effectSuffix: "% extra radius", calculate: level => 3 + level * 3 },
  135: { id: 135, name: "Burst", maxLevel: 5, requiredLevel: 1, party: false,
    description: "When firing an automatic rifle or machine gun, bullets don't spread and do 25% more damage for a certain period.",
    effectPrefix: "Applied to first ", effectSuffix: " shots", calculate: level => Math.trunc(1 + level) },
  136: { id: 136, name: "One shot", maxLevel: 10, requiredLevel: 1, party: false,
    description: "When equipped with a pistol or a sniper rifle, the last bullet of the magazine will deal massive damage.",
    effectPrefix: "", effectSuffix: "% increased damage", calculate: level => 300 + level * 70 },
  138: { id: 138, name: "Love", maxLevel: 10, requiredLevel: 1, party: true,
    description: "With the feat, you are awarded compensation every time you explode your little sister!",
    effectPrefix: "", effectSuffix: " gold per sister", calculate: level => 5 + level * 5 },
  139: { id: 139, name: "Supplier", maxLevel: 10, requiredLevel: 1, party: true,
    description: "You are a respected supplier. Recharge time of all usable items are reduced.",
    effectPrefix: "", effectSuffix: "% faster recharge", calculate: level => level * 20 },
  140: { id: 140, name: "Power shot", maxLevel: 10, requiredLevel: 1, party: false,
    description: "When equipped with a non-autofire gun, you sometimes do 1.5x damage. Never ask why!",
    effectPrefix: "", effectSuffix: "% chance", calculate: level => level * 10 },
};

export const CLASS_CHOICE_ORDER: Readonly<Record<RecruitClass, readonly number[]>> = {
  1: [104, 103, 105, 100, 101, 107, 102, 140, 109, 115, 120, 124, 126, 128, 129, 131, 135],
  3: [103, 104, 100, 101, 107, 102, 140, 108, 112, 115, 117, 111, 119, 122, 123, 135, 136, 137],
  6: [105, 100, 101, 107, 102, 110, 113, 116, 118, 121, 125, 134, 129, 137, 132],
  4: [106, 104, 100, 101, 107, 102, 119, 121, 125, 129, 132, 133, 135, 138, 139],
  2: [104, 100, 101, 107, 102, 140, 111, 114, 115, 119, 130, 131, 136],
  5: [106, 103, 100, 101, 107, 102, 109, 116, 124, 132, 133, 134, 128, 123, 139],
  7: [103, 100, 101, 107, 102, 140, 111, 115, 117, 108, 119, 120, 121, 136],
  8: [103, 104, 105, 106, 100, 101, 107, 102, 108, 118, 123, 125, 126, 127, 128, 135, 131, 132],
  9: [105, 103, 100, 101, 107, 102, 110, 112, 113, 116, 118, 127, 130, 134, 138, 139],
};

export const PARTY_TRAITS = [109, 112, 113, 116, 117, 118, 120, 122, 123, 124, 125, 126, 127, 137, 138, 139] as const;

export interface PartySkillState {
  effects: Record<number, number>; levels: Record<number, number>;
  guardian: number; guardianSlots: number[];
}
export interface CompanionProgress {
  level: number; exp: number; skillPoints: number; traits: TraitLevels;
  devType: RecruitClass; potentialAim: number; potentialTeam: number;
  nextTrait: number; focus: number;
}

export function calculateAnyTrait(id: number, level: number): number {
  if (!Object.hasOwn(ALL_TRAITS, id)) throw new Error(`Unknown trait ${id}.`);
  return level <= 0 ? 0 : ALL_TRAITS[id].calculate(level);
}

/** getBestSkill хранит целый лучший эффект; равные эффекты оставляют прежний уровень. */
export function partySkills(actors: readonly ({ exist?: boolean; traits: Readonly<TraitLevels> } | null)[]): PartySkillState {
  const effects: Record<number, number> = {}, levels: Record<number, number> = {};
  for (const id of PARTY_TRAITS) {
    let best = 0, bestLevel = 0;
    for (const actor of actors.slice(0, 5)) if (actor && actor.exist !== false) {
      const level = actor.traits[id] ?? 0, value = calculateAnyTrait(id, level);
      if (value > best) { best = Math.trunc(value); bestLevel = level; }
    }
    effects[id] = best; levels[id] = bestLevel;
  }
  let guardian = 0;
  const guardianSlots: number[] = [];
  actors.slice(0, 5).forEach((actor, index) => {
    if (!actor || actor.exist === false) return;
    guardian += calculateAnyTrait(9, actor.traits[9] ?? 0);
    // Исходный список содержит всех существующих союзников, даже без класса Guardian.
    guardianSlots.push(index);
  });
  return { effects, levels, guardian, guardianSlots };
}

export function availableCompanionTraits(member: Pick<CompanionProgress, 'level' | 'traits' | 'devType'>): number[] {
  const owned = Object.values(member.traits).filter(value => value !== 0).length;
  return CLASS_CHOICE_ORDER[member.devType].filter(id => {
    const level = member.traits[id] ?? 0, definition = ALL_TRAITS[id];
    return definition.maxLevel >= level + 1 && definition.requiredLevel <= member.level && !(owned > 17 && level === 0);
  });
}

/** gainTrait: currentWeight не обнуляется между кандидатами; умножение присваивается int. */
export function gainCompanionTrait(member: CompanionProgress, party: Readonly<PartySkillState>, random: () => number, slot = 1): number {
  const available = availableCompanionTraits(member);
  if (!available.length) throw new Error('No companion skills are available.');
  let selected = 101, bestWeight = 0, currentWeight = 0, hasForcedFocus = false;
  for (let loop = 0; loop < 10; loop++) {
    const id = available[Math.trunc(random() * available.length)], definition = ALL_TRAITS[id];
    const level = member.traits[id] ?? 0;
    if (definition.maxLevel !== 999) currentWeight = level === 0 ? 250 : 100 + level * 50;
    else {
      if (definition.requiredLevel === 2) currentWeight = 0;
      if (random() > 0.75) currentWeight += 500;
    }
    if (slot < 4 && Object.hasOwn(party.effects, id)) currentWeight = party.levels[id] - 1 <= level ? 110 + level * 50 : 10;
    if (id === 102) currentWeight = 0;
    currentWeight = Math.trunc(currentWeight * random());
    if (currentWeight > bestWeight) { selected = id; bestWeight = currentWeight; }
  }
  if (member.focus !== -1 && available.includes(member.focus)) {
    hasForcedFocus = true;
    if (Math.trunc(random() * 3) !== 0) selected = member.focus;
  }
  if ([3, 5, 8].includes(member.devType) && party.effects[123] < 2 && (member.traits[123] ?? 0) === 0) selected = 123;
  if (!hasForcedFocus) member.focus = -1;
  member.traits[selected] = (member.traits[selected] ?? 0) + 1;
  member.nextTrait = Math.trunc(random() * 100);
  return selected;
}

export function levelUpCompanion(member: CompanionProgress, random: () => number): void {
  member.exp %= 1000;
  member.level++; member.skillPoints++;
  member.traits[member.devType] = member.level;
  if (random() < member.potentialAim) member.traits[900]++;
  if (random() < member.potentialTeam) member.traits[901]++;
}

export function companionWage(member: { level: number; appearance: number; potentialAim: number; potentialTeam: number }, accountant = 0, kongregateMedal = false): number {
  let wage = Math.max(0, member.level * 6 + 50 - Number(member.appearance === 50) * 50);
  wage = wage * (75 + member.potentialAim * member.potentialTeam * 100) / 100;
  return Math.trunc(wage * 100 / (100 + accountant + Number(kongregateMedal) * 3));
}
