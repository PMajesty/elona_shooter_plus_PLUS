import { ItemFactory, PLAYER_INVENTORY_SLOTS, type Item } from './items.ts';
import { SHERIFF_TRAITS, TRAIT, type TraitLevels } from './progression.ts';
import { HERO_CLASSES, startingHeroTraits, type HeroClass } from './hero-classes.ts';

interface HeroRolls {
  sex: 0 | 1; name: 'You'; potentialAim: number; potentialTeam: number; nextTrait: number;
}
export interface OriginalHeroInitialization extends HeroRolls { provenance: 'original-generation' }
export interface ReconstructedHeroInitialization extends HeroRolls {
  provenance: 'legacy-reconstructed'; reconstructionSeed: number; reconstructedAtLevel: number;
}
export type KnownHeroInitialization = OriginalHeroInitialization | ReconstructedHeroInitialization;
export interface UnknownHeroInitialization {
  provenance: 'legacy-unknown'; sex: null; name: 'You'; potentialAim: null; potentialTeam: null; nextTrait: null;
}
export type HeroInitialization = KnownHeroInitialization | UnknownHeroInitialization;
export interface HeroProgress {
  level: number; exp: number; skillPoints: number; traits: TraitLevels;
}
export interface GeneratedSheriffHero extends HeroProgress {
  hero: OriginalHeroInitialization;
  inventory: (Item | null)[];
}
export interface HeroLevelResult extends HeroProgress { aimingGained: boolean; teamworkGained: boolean }

function positiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

/** Проверяет происхождение и исходные величины, не заменяя отсутствующие данные бросками. */
export function isKnownHeroInitialization(value: unknown): value is KnownHeroInitialization {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const hero = value as Record<string, unknown>;
  if (hero.name !== 'You' || (hero.sex !== 0 && hero.sex !== 1)) return false;
  if (![hero.potentialAim, hero.potentialTeam].every(v => typeof v === 'number' && Number.isFinite(v) && v >= 0.1 && v < 0.9)) return false;
  if (typeof hero.nextTrait !== 'number' || !Number.isInteger(hero.nextTrait) || hero.nextTrait < 0 || hero.nextTrait >= 100) return false;
  if (hero.provenance === 'original-generation') return hero.reconstructionSeed === undefined && hero.reconstructedAtLevel === undefined;
  return hero.provenance === 'legacy-reconstructed'
    && typeof hero.reconstructionSeed === 'number' && Number.isInteger(hero.reconstructionSeed)
    && hero.reconstructionSeed > 0 && hero.reconstructionSeed <= 0xffffffff
    && positiveInteger(hero.reconstructedAtLevel) && hero.reconstructedAtLevel <= SHERIFF_TRAITS[TRAIT.SHERIFF].maxLevel;
}

export function unknownHeroInitialization(): UnknownHeroInitialization {
  return { provenance: 'legacy-unknown', sex: null, name: 'You', potentialAim: null, potentialTeam: null, nextTrait: null };
}

/** Один исходный levelUp: проверка порогового опыта остаётся обязанностью вызывающего кода. */
export function levelUpHero(progress: Readonly<HeroProgress>, hero: HeroInitialization, random: () => number, classId: HeroClass = 'sheriff'): HeroLevelResult {
  if (!isKnownHeroInitialization(hero)) throw new Error('Hero growth requires known or explicitly reconstructed potentials.');
  if (!positiveInteger(progress.level) || !Number.isFinite(progress.exp) || progress.exp < 0
    || !Number.isSafeInteger(progress.skillPoints) || progress.skillPoints < 0
    || !positiveInteger(progress.traits[TRAIT.BASE_AIMING]) || !positiveInteger(progress.traits[TRAIT.BASE_TEAMWORK])) {
    throw new Error('Invalid hero progression state.');
  }
  // Оба броска обязательны и идут до RNG голоса/добычи в enemy.damage.
  const aimingGained = random() < hero.potentialAim;
  const teamworkGained = random() < hero.potentialTeam;
  const level = progress.level + 1;
  return {
    level, exp: progress.exp % 1000, skillPoints: progress.skillPoints + 1,
    traits: {
      ...progress.traits, [HERO_CLASSES[classId].id]: level,
      [TRAIT.BASE_AIMING]: progress.traits[TRAIT.BASE_AIMING] + Number(aimingGained),
      [TRAIT.BASE_TEAMWORK]: progress.traits[TRAIT.BASE_TEAMWORK] + Number(teamworkGained),
    },
    aimingGained, teamworkGained,
  };
}

function rollHeroBase(random: () => number, level = 1) {
  const sex = Math.trunc(random() * 2) as 0 | 1;
  // generatePlayer выбирает nameBoy даже для героя, затем заменяет имя на You.
  random();
  const potentialAim = random() / 1.25 + 0.1;
  const potentialTeam = random() / 1.25 + 0.1;
  let baseAiming = 1 + Math.trunc(random() * 10);
  let baseTeamwork = 1 + Math.trunc(random() * 10);
  // При генерации высокого уровня исходный цикл роста предшествует nextTrait и экипировке.
  for (let current = 1; current < level; current++) {
    if (random() < potentialAim) baseAiming++;
    if (random() < potentialTeam) baseTeamwork++;
  }
  const nextTrait = Math.trunc(random() * 100);
  return { sex, name: 'You' as const, potentialAim, potentialTeam, baseAiming, baseTeamwork, nextTrait };
}

/** Граница generatePlayer(0, 1, Sheriff); портрет и подготовка миссии принадлежат вызывающему коду. */
export function generateSheriffHero(random: () => number, previousInventory: readonly (Readonly<Item> | null)[] = []): GeneratedSheriffHero {
  return generateHero(random, 'sheriff', previousInventory);
}

export function generateHero(random: () => number, classId: HeroClass, previousInventory: readonly (Readonly<Item> | null)[] = []): GeneratedSheriffHero {
  const { baseAiming, baseTeamwork, ...rolls } = rollHeroBase(random);
  const traits = startingHeroTraits(classId, baseAiming, baseTeamwork);
  const inventory = Array.from({ length: PLAYER_INVENTORY_SLOTS }, (_, index) => previousInventory[index] ? { ...previousInventory[index] } as Item : null);
  const factory = new ItemFactory(random, { day: 1 });
  // Исходные поля слота сохраняются; сначала граната, затем временный лук и дробовик.
  const grenade = factory.generate(11, inventory[1] ?? undefined);
  Object.assign(grenade, { lv: 1, name: "Soldier's Grenade", attack: 45, ammoMax: 5, ammo: 5, value: 100 });
  inventory[1] = grenade;
  const bow = factory.generate(24, inventory[0] ?? undefined);
  switch (classId) {
    case 'sheriff': inventory[0] = factory.generate(3, bow); break;
    case 'rogue': inventory[0] = factory.generate(1, bow); break;
    case 'sniper': inventory[0] = factory.generate(4, bow); break;
    case 'ranger': inventory[0] = factory.generate(36, bow); break;
    case 'duelist':
      inventory[0] = factory.generate(1, bow); inventory[0].modMax = 4;
      factory.enchant(inventory[0], 7, 3); break;
    case 'noble':
      inventory[0] = factory.generate(2, bow);
      Object.assign(inventory[0], { name: 'PDW', modMax: 2, reqLv: 1 });
      factory.enchant(inventory[0], 1, 3); break;
    case 'hunter':
      inventory[0] = factory.generate(23, bow);
      Object.assign(inventory[0], { name: "Hunter's Crossbow", shootRate: 32, baseAccuracy: 160, attack: 30, reqLv: 1 });
      break;
    case 'militia':
      inventory[0] = factory.generate(4, bow);
      inventory[2] = factory.generate(40, inventory[2] ?? undefined);
      Object.assign(inventory[2], { name: 'Simple Flame Thrower', attack: 10, reqLv: 1, modMax: 1 });
      factory.enchant(inventory[2], 11, 1);
      inventory[3] = factory.generate(16, inventory[3] ?? undefined);
      Object.assign(inventory[3], { name: 'Simple Chain Gun', reqLv: 1 });
      break;
  }
  return { hero: { provenance: 'original-generation', ...rolls }, level: 1, exp: 0, skillPoints: 0, traits, inventory };
}

/** Отдельный поток миграции даёт исходное распределение, но не восстанавливает утраченную историю. */
export function reconstructSheriffHero(level: number, seed: number): {
  hero: ReconstructedHeroInitialization; baseAiming: number; baseTeamwork: number;
} {
  // Проверяем предел текущей схемы до цикла: повреждённый импорт не должен зависнуть на миллиардах уровней.
  if (!positiveInteger(level) || level > SHERIFF_TRAITS[TRAIT.SHERIFF].maxLevel || !Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new Error('Invalid hero reconstruction boundary.');
  const reconstructionSeed = seed >>> 0 || 1;
  let state = reconstructionSeed;
  const random = () => {
    state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
  const { baseAiming, baseTeamwork, ...rolls } = rollHeroBase(random, level);
  return {
    hero: { provenance: 'legacy-reconstructed', reconstructionSeed, reconstructedAtLevel: level, ...rolls },
    baseAiming, baseTeamwork,
  };
}
