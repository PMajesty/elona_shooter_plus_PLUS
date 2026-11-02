import { ItemFactory, type Item, type ItemContext } from './items.ts';

export const RECRUIT_INDEX = 5;
export const RECRUIT_WEAPON_SLOT = 45;
export type RecruitClass = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

// Исходная nameBoy, включая повторяющиеся имена и порядок: MainTimeline, строка 9368.
export const RECRUIT_NAMES: readonly string[] = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'García',
  'Rodriguez', 'Wilson', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Martin',
  'Jackson', 'Thompson', 'White', 'Lee', 'Harris', 'Clark', 'Lewis', 'Robinson',
  'Walker', 'Hall', 'Young', 'Allen', 'Wright', 'Scott', 'Adams', 'Nelson', 'Hill',
  'Campbell', 'Mitchell', 'Roberts', 'Carter', 'Phillips', 'Evans', 'Turner', 'Torres',
  'Parker', 'Collins', 'Edwards', 'Stewart', 'Flores', 'Morris', 'Nguyen', 'Murphy',
  'Rivera', 'Rogers', 'Morgan', 'Peterson', 'Cooper', 'Reed', 'Bailey', 'Bell',
  'Kelly', 'Howard', 'Cox', 'Wood', 'Watson', 'Brooks', 'Bennett', 'Gray', 'James',
  'Reyes', 'Cruz', 'Hughes', 'Myers', 'Foster', 'Sanders', 'Ross', 'Powell',
  'Sullivan', 'Russell', 'Ortiz', 'Jenkins', 'Perry', 'Barnes', 'Silva', 'Santos',
  'Oliveira', 'Souza', 'Pereira', 'Costa', 'Carvalho', 'Almeida', 'Ferreira',
  'Ribeiro', 'Janssens', 'Maes', 'Svoboda', 'Jensen', 'Nielsen', 'Larsen', 'Olsen',
  'Tamm', 'Korhonen', 'Laine', 'Martin', 'Bernard', 'Dubois', 'Robert', 'Petit',
  'Durand', 'Leroy', 'Laurent', 'David', 'Roux', 'Vincent', 'Fournier', 'Girard',
  'Beridze', 'Schmidt', 'Fischer', 'Meyer', 'Weber', 'Schulz', 'Wagner', 'Koch', 'Varga',
  'Lakatos', 'Murphy', 'Lynch', 'Rossi', 'Russo', 'Ferrari', 'Bianchi', 'Rizzo',
  'Vella', 'Grech',
];

export interface FirstTownRecruit {
  exist: true; sex: number; name: string; devType: RecruitClass;
  potentialAim: number; potentialTeam: number; trait: Record<number, number>;
  lv: 1 | 2 | 3 | 4; sp: 0 | 1 | 2 | 3; trained: 0; optBoss: true; optWall: true;
  kill: 0; earn: 0; money: 200; nextTrait: number; ai: 0; forcus: -1;
  cost: 400 | 450 | 500 | 550; exp: 0; wexp: [0, 0, 0, 0, 0]; pic: number;
  items: Record<number, Item>;
}

export interface RecruitGenerationOptions {
  previousSlots?: Readonly<Record<number, Readonly<Item> | null>>;
  // Engineer передаётся после generatePlayer/initPartySkill, без включения самого кандидата5.
  itemContext?: Omit<Partial<ItemContext>, 'day'>;
}

/** Совместимая граница первого города; общий алгоритм также покрывает дни 2–9. */
export function generateFirstTownRecruit(random: () => number, options: RecruitGenerationOptions = {}): FirstTownRecruit {
  return generateEarlyTownRecruit(random, 1, options);
}

/** В дни 1–3 уровень равен 1, в день 4 — 1–2, в дни 5–6 — 2–3, в дни 7–9 — 2–4. */
export function generateEarlyTownRecruit(random: () => number, day: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9, options: RecruitGenerationOptions = {}): FirstTownRecruit {
  if (![1, 2, 3, 4, 5, 6, 7, 8, 9].includes(day)) throw new RangeError('Recruit generation is limited to the first nine towns.');
  const level = (Math.trunc(random() * day * 0.3) + Math.trunc(day / 5) + 1) as 1 | 2 | 3 | 4;
  const sex = Math.trunc(random() * 2);
  const name = RECRUIT_NAMES[Math.trunc(random() * RECRUIT_NAMES.length)];
  const devType = (Math.trunc(random() * 9) + 1) as RecruitClass;
  const potentialAim = random() / 1.25 + 0.1;
  const potentialTeam = random() / 1.25 + 0.1;
  const trait: Record<number, number> = { [devType]: 1, 900: 1 + Math.trunc(random() * 10), 901: 1 + Math.trunc(random() * 10) };
  // generatePlayer вызывает levelUp(false) до nextTrait, портрета и экипировки; очки не расходуются.
  for (let currentLevel = 1; currentLevel < level; currentLevel++) {
    trait[devType] = currentLevel + 1;
    if (random() < potentialAim) trait[900]++;
    if (random() < potentialTeam) trait[901]++;
  }
  const nextTrait = Math.trunc(random() * 100);
  const pic = Math.trunc(random() * 22);
  const factory = new ItemFactory(random, { ...options.itemContext, day });
  const items: Record<number, Item> = {};
  const generate = (slot: number, id: number) => {
    items[slot] = factory.generate(id, items[slot] ?? options.previousSlots?.[slot] ?? undefined);
    return items[slot];
  };
  // Сначала создаётся временный лук, затем оружие класса; у Guardian остаётся этот лук.
  generate(RECRUIT_WEAPON_SLOT, 24);
  let weapon: Item;
  switch (devType) {
    case 1:
      Object.assign(trait, { 103: 1, 104: 1, 105: 1, 109: 1 });
      weapon = generate(45, 23);
      Object.assign(weapon, { name: "Hunter's Crossbow", shootRate: 32, baseAccuracy: 160, attack: 30, reqLv: 1 });
      break;
    case 2:
      Object.assign(trait, { 104: 2, 119: 1 });
      generate(45, 4);
      break;
    case 3:
      generate(45, 1);
      Object.assign(trait, { 103: 2, 104: 1, 108: 1 });
      break;
    case 4:
      Object.assign(trait, { 104: 2, 106: 1 });
      generate(45, 4);
      weapon = generate(47, 40);
      Object.assign(weapon, { name: 'Simple Flame Thrower', attack: 10, reqLv: 1, modMax: 1 });
      factory.enchant(weapon, 11, 1);
      weapon = generate(48, 16);
      Object.assign(weapon, { name: 'Simple Chain Gun', reqLv: 1 });
      break;
    case 5:
      Object.assign(trait, { 103: 1, 106: 2 });
      generate(45, 36);
      break;
    case 6:
      Object.assign(trait, { 105: 2, 121: 1 });
      generate(45, 3);
      break;
    case 7:
      weapon = generate(45, 1);
      weapon.modMax = 4;
      trait[103] = 3;
      factory.enchant(weapon, 7, 3);
      break;
    case 8:
      weapon = generate(45, 2);
      Object.assign(weapon, { name: 'PDW', modMax: 2, reqLv: 1 });
      factory.enchant(weapon, 1, 3);
      Object.assign(trait, { 103: 1, 104: 1, 105: 1, 106: 1 });
      break;
    case 9:
      Object.assign(trait, { 103: 1, 105: 1, 113: 2 });
      break;
  }
  return {
    exist: true, sex, name, devType, potentialAim, potentialTeam, trait,
    lv: level, sp: (level - 1) as 0 | 1 | 2 | 3, trained: 0, optBoss: true, optWall: true,
    kill: 0, earn: 0, money: 200, nextTrait, ai: 0, forcus: -1,
    cost: (level * 50 + 350) as 400 | 450 | 500 | 550, exp: 0, wexp: [0, 0, 0, 0, 0], pic, items,
  };
}
