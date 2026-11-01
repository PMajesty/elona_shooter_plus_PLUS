import { ITEM_TYPE, ItemFactory, isOccupiedItem, type Item, type ItemContext } from './items.ts';
import { TRAIT, SHERIFF_TRAITS, calcTrait, type TraitLevels } from './progression.ts';

export const COMBAT_TRAIT = {
  ...TRAIT, HUNTER: 1, SNIPER: 2, ROGUE: 3, MILITIA: 4, RANGER: 5, DUELIST: 7, NOBLE: 8, GUARDIAN: 9,
  SMALL_GUN: 103, RIFLE: 104, BIG_GUN: 106, LUCK: 108, SENSE: 111, THREAT: 112,
  ONE_HIT_KILL: 114, AIMED_SHOT: 115, KILLER: 119, BOW_MASTER: 128, DISARM: 130,
  ANTI_AIR: 131, DA_BOMB: 133, BURST: 135, ONE_SHOT: 136, POWER_SHOT: 140,
} as const;
export type CombatTraits = Readonly<TraitLevels>;
const int = Math.trunc;
const level = (traits: CombatTraits, id: number) => traits[id] ?? 0;

export function combatTrait(id: number, traits: CombatTraits): number {
  const value = level(traits, id);
  if (value <= 0) return 0;
  if (Object.hasOwn(SHERIFF_TRAITS, id)) return calcTrait(id, value);
  switch (id) {
    case 1: return 25 + value + Math.sqrt(value) * 5;
    case 2: return Math.sqrt(value) * 3 + 4;
    case 3: return 20 + value + Math.sqrt(value) * 15;
    case 4: return 25 + value * 2;
    case 5: return 7 + Math.sqrt(value) * 5;
    case 7: return 7;
    case 8: return 5 + value / 2 + Math.sqrt(value) * 2;
    case 9: return 4 + int(value / 2);
    case 103: case 104: case 106: case 128: return value;
    case 108: return value * 2 + Math.sqrt(value) * 12;
    case 111: return value + Math.sqrt(value) * 6;
    case 112: return value * 2 + 1;
    case 114: return value * 3 + 2;
    case 115: return value * 7;
    case 119: return value + Math.sqrt(value) * 20;
    case 130: return value * 20;
    case 131: return 2 + value * 7;
    case 133: return 3 + value * 3;
    case 135: return int(1 + value);
    case 136: return 300 + value * 70;
    case 140: return value * 10;
    default: throw new Error(`Unsupported combat trait ${id}.`);
  }
}

export interface WeaponContext { manualControl?: boolean; tight?: boolean; partyLeadership?: number }

/** refreshPlayer и shoot: неизвестные базовые навыки не заменяются вымышленными значениями. */
export function weaponStats(item: Readonly<Item>, traits: CombatTraits, context: WeaponContext = {}) {
  const manualControl = context.manualControl ?? true;
  const aiming = traits[TRAIT.BASE_AIMING], teamwork = traits[TRAIT.BASE_TEAMWORK];
  const accuracyDiv = item.baseAccuracy! * (100 + combatTrait(TRAIT.ACCURACY, traits) + combatTrait(COMBAT_TRAIT.NOBLE, traits) + (manualControl ? 0 : combatTrait(TRAIT.COOL, traits)) - combatTrait(TRAIT.DR_HOLLIDAY, traits)) / 100;
  const shootTimer = 1000 + level(traits, COMBAT_TRAIT.AIMED_SHOT) * 70;
  return {
    canFire: isOccupiedItem(item) && item.type === ITEM_TYPE.gun && level(traits, item.reqTrait!) >= item.reqLv!,
    shells: item.shell + (item.typeMinor === 2 ? level(traits, TRAIT.DR_HOLLIDAY) : 0),
    accuracyDiv, rangeFix: 1800 + combatTrait(COMBAT_TRAIT.HUNTER, traits) * 20,
    recoil: item.id === 24 || item.id === 25 ? item.accuracyDec! : item.accuracyDec! / (1 + Number(context.tight === true)),
    recovery: 0.02 * (100 + combatTrait(TRAIT.COOL, traits)) / 100,
    shootTimer, shootRate: item.shootRate, intervalFrames: Math.max(1, Math.ceil(shootTimer / item.shootRate)),
    reloadTime: reloadTimer(item, traits), consumesAmmo: item.reloadTimeMax !== 0,
    aimTime: aiming === undefined ? null : Math.max(2, (18 - Math.sqrt(aiming) * 1.4 - aiming * 0.05) * 100 / (100 + (context.partyLeadership ?? 0))),
    workRate: teamwork === undefined ? null : Math.min(0.3, 0.03 + Math.sqrt(teamwork) * 0.025),
  };
}

export function shotSpread(item: Readonly<Item>, traits: CombatTraits, accuracyFix: number, context: WeaponContext & { fireAtWill?: boolean } = {}): number {
  const stats = weaponStats(item, traits, context);
  if (context.manualControl !== false) return 13 * (100 + accuracyFix * accuracyFix * 1000) / stats.accuracyDiv * (context.tight ? 0.75 : 1);
  let spread = 13 * (100 + item.accuracyDec! * item.accuracyDec! * 500) / stats.accuracyDiv;
  if (context.fireAtWill) spread = spread * (100 + 50 * 100 / (100 + combatTrait(COMBAT_TRAIT.HUNTER, traits) * 2)) / 100;
  return spread;
}

export function recoverAccuracy(item: Readonly<Item>, traits: CombatTraits, accuracyFix: number, aimX: number, tight = false): number {
  const stats = weaponStats(item, traits);
  if (accuracyFix > 0) accuracyFix -= stats.recovery;
  let rangePenalty = tight ? 0 : Math.abs(500 - item.range! * 200 - aimX);
  rangePenalty = rangePenalty < 100 ? 0 : rangePenalty / stats.rangeFix;
  return Math.min(0.6, Math.max(accuracyFix, rangePenalty));
}

export function shotDamage(item: Readonly<Item>, traits: CombatTraits, context: { missionDamage?: number; frenzy?: number; idleCount?: number; rampage?: boolean } = {}): number {
  let damage = int(item.attack! * (context.missionDamage ?? 1) * (100 + combatTrait(COMBAT_TRAIT.AIMED_SHOT, traits) + combatTrait(COMBAT_TRAIT.NOBLE, traits)) / 100);
  if (level(traits, COMBAT_TRAIT.DUELIST) > 0) damage = int(damage * (100 + (context.frenzy ?? 0)) / 100);
  if (level(traits, COMBAT_TRAIT.SNIPER) > 0) damage = int(damage * Math.min(100 + combatTrait(COMBAT_TRAIT.SNIPER, traits) * (context.idleCount ?? 0), int(160 + Math.sqrt(level(traits, COMBAT_TRAIT.SNIPER)) * 2 + level(traits, COMBAT_TRAIT.SNIPER))) / 100);
  // baseDamage имеет тип int: каждое составное умножение тоже отбрасывает дробную часть.
  if (context.rampage) damage = int(damage * 1.5);
  return damage;
}

function roll(value: number | undefined, name: string): number {
  if (value === undefined || !Number.isFinite(value) || value < 0 || value >= 1) throw new Error(`Missing or invalid ${name} roll.`);
  return value;
}

/** Вызывается только для hitscan, после уменьшения ammo. POWER_SHOT расходует бросок лишь при выполненных условиях. */
export function hitscanShotModifiers(item: Readonly<Item>, traits: CombatTraits, damage: number, state: { burst: number; ammoAfterShot: number; accuracyFix: number; powerShotRoll?: number }) {
  let burst = state.burst, accuracyFix = state.accuracyFix, specialHitType = 0;
  if (level(traits, COMBAT_TRAIT.BURST) > 0 && item.automatic && item.reqTrait === COMBAT_TRAIT.RIFLE) {
    burst++;
    if (burst <= combatTrait(COMBAT_TRAIT.BURST, traits)) { accuracyFix -= item.accuracyDec!; damage = int(damage * 1.25); }
  }
  if (!item.automatic && level(traits, COMBAT_TRAIT.POWER_SHOT) > 0 && combatTrait(COMBAT_TRAIT.POWER_SHOT, traits) > roll(state.powerShotRoll, 'POWER_SHOT') * 100) {
    damage = int(damage * 1.5); specialHitType = 1;
  }
  if (!item.manualReload && state.ammoAfterShot === 0 && level(traits, COMBAT_TRAIT.ONE_SHOT) > 0 && (item.reqTrait === COMBAT_TRAIT.SMALL_GUN || item.id === 13)) {
    damage = int(damage * (100 + combatTrait(COMBAT_TRAIT.ONE_SHOT, traits)) / 100); specialHitType = 2;
  }
  return { damage, burst, accuracyFix, specialHitType };
}

export function criticalType(traits: CombatTraits, senseRoll: number, weakPoint: boolean, alive: boolean, shells = 1): 0 | 1 | 2 {
  let critical: 0 | 1 | 2 = roll(senseRoll, 'SENSE') * 100 * shells < combatTrait(COMBAT_TRAIT.SENSE, traits) ? 2 : 0;
  if (weakPoint && alive) critical = 1;
  return critical;
}

/** shoot тратит оба броска на каждое геометрическое попадание, включая труп; procHit использует только criticalType(..., 1). */
export function hitscanHit(item: Readonly<Item>, traits: CombatTraits, damage: number, context: { senseRoll: number; oneHitRoll: number; weakPoint: boolean; alive: boolean; boss: boolean; shells: number; specialHitType?: number }) {
  let critical: number = criticalType(traits, context.senseRoll, context.weakPoint, context.alive, context.shells);
  let specialHitType = context.specialHitType ?? 0;
  if (roll(context.oneHitRoll, 'ONE_HIT_KILL') * 100 < combatTrait(COMBAT_TRAIT.ONE_HIT_KILL, traits) && item.typeMinor === 1 && !context.boss) {
    damage = 999999; specialHitType = 3; critical = 3;
  }
  // Изменённые damage/specialHitType остаются у всего выстрела, а не только у данной цели.
  return { damage, critical, specialHitType };
}

export function weaponHitDamage(item: Readonly<Item> | null, traits: CombatTraits, damage: number, context: { critical: number | boolean; target: 'normal' | 'air' | 'armor'; bossGuard?: boolean }) {
  damage = int(damage);
  if (context.critical) damage = int(damage * 2);
  let lowDamage = false;
  if (item && context.target === 'air') { damage = int(damage * item.dmgAir! * (100 + combatTrait(COMBAT_TRAIT.ANTI_AIR, traits)) / 10000); lowDamage = item.dmgAir! < 60; }
  if (item && context.target === 'armor') { damage = int(damage * item.dmgArmor! * (100 + combatTrait(TRAIT.ANTI_ARMOR, traits)) / 10000); lowDamage = item.dmgArmor! < 60; }
  const beforeGuard = damage;
  if (context.bossGuard) { damage = int(damage / 10 + 1); lowDamage = true; }
  return { damage, beforeGuard, lowDamage };
}

export interface HitTarget { speed: number; speedOrg: number; attack: number; disarmed: number; knockBack: number; resKnock: number; dinosaur?: boolean; attacking?: boolean }
/** enemy.damage применяет вампиризм до защиты босса, затем статусы; источники случайности передаёт вызывающий код. */
export function weaponHitEffects(item: Readonly<Item>, traits: CombatTraits, target: Readonly<HitTarget>, context: { damageBeforeGuard: number; castleHp: number; castleMaxHp: number; leechRoll?: number; dinosaurRoll?: number }) {
  const result = { ...target, castleHp: context.castleHp };
  if (item.leech && result.castleHp > 0 && roll(context.leechRoll, 'LEECH') * (item.shootRate + 50) < 10) result.castleHp = Math.min(context.castleMaxHp, result.castleHp + int(context.damageBeforeGuard * item.leech / 100) + 1);
  if (level(traits, COMBAT_TRAIT.DISARM) && result.disarmed === 0) {
    result.disarmed = combatTrait(COMBAT_TRAIT.DISARM, traits); result.attack = result.attack * 100 / (100 + result.disarmed);
  }
  if (level(traits, TRAIT.CRIPPLE_SHOT)) {
    result.speedOrg = Math.max(0.4, result.speedOrg * 100 / (100 + combatTrait(TRAIT.CRIPPLE_SHOT, traits)));
    if (result.speed !== 0) result.speed = result.speedOrg;
  }
  if (result.resKnock !== 0) {
    result.knockBack = int((combatTrait(TRAIT.SHERIFF, traits) + item.impact) * result.resKnock);
    if (result.knockBack) {
      result.knockBack += 3;
      if (result.dinosaur && result.attacking && roll(context.dinosaurRoll, 'DINO_KNOCKBACK') > 0.05) result.knockBack = 0;
    }
  }
  return result;
}

export function reloadTimer(item: Readonly<Item>, traits: CombatTraits): number { return int(item.reloadTimeMax * 100 / (100 + combatTrait(TRAIT.RELOADING, traits))) + 1; }
export function autoReloadReady(item: Readonly<Item>, shootTimer: number): boolean { return item.autoReload > 0 && item.reloadTime === 0 && item.ammo < item.ammoMax && shootTimer <= item.shootRate * -3; }

/** Один исходный вызов reloading; manual завершает через cancelReload, магазин — через sound_reloaded1. */
export function advanceReload(item: Readonly<Item>, traits: CombatTraits, rampage = false) {
  let ammo = item.ammo, reloadTime = item.reloadTime;
  let completion: 'manual' | 'magazine' | null = null, restarted = false;
  if (reloadTime <= 0) return { ammo, reloadTime, completion, restarted };
  reloadTime--;
  if (rampage && reloadTime % 3 === 2) reloadTime--;
  if (reloadTime <= 0) {
    if (item.manualReload) {
      ammo++;
      if (ammo === item.ammoMax) { reloadTime = 0; completion = 'manual'; }
      else { reloadTime = reloadTimer(item, traits); restarted = true; }
    } else { ammo = item.ammoMax; completion = 'magazine'; }
  }
  return { ammo, reloadTime, completion, restarted };
}

export function rampageDuration(traits: CombatTraits, baseFrames = 300): number { return int(int(baseFrames) * (100 + combatTrait(TRAIT.FURY, traits)) / 100); }
export function criticalKillCooldown(shootTimer: number, traits: CombatTraits): number { return int(shootTimer * (100 - combatTrait(COMBAT_TRAIT.KILLER, traits)) / 100); }
export function duelistHitFrenzy(item: Readonly<Item>, traits: CombatTraits, frenzy: number, path: 'hitscan' | 'projectile'): number {
  const skill = level(traits, COMBAT_TRAIT.DUELIST);
  if (!skill) return frenzy;
  return Math.min(int(40 + Math.sqrt(skill) * 1.6 + skill), frenzy + combatTrait(COMBAT_TRAIT.DUELIST, traits) / (item.shootRate * (path === 'hitscan' ? 0.02 : 0.03)) + (path === 'hitscan' ? 0.05 : 0.1));
}

export type ProjectileKind = 'grenade' | 'rocket' | 'bolt' | 'arrow' | 'gravity' | 'flame';

export interface WeaponPresentation { sound: string; shootFrame: number; idleFrame: number; endFrame: number }
const WEAPON_PRESENTATION: Readonly<Record<number, readonly [string, number, number, number]>> = {
    1: ['gun6', 10, 24, 10], 2: ['gun2', 10, 24, 10],
    3: ['gun3', 95, 109, 95], 4: ['gun4', 95, 109, 95],
    5: ['gun7', 120, 134, 120], 13: ['gun5', 120, 134, 120],
    16: ['gun2', 145, 159, 145], 17: ['gun8', 120, 134, 120],
    18: ['gun9', 10, 24, 10], 19: ['gun10', 95, 109, 95],
    20: ['gun12', 95, 109, 95], 21: ['gun11', 170, 184, 184],
    22: ['gun13', 170, 184, 184], 23: ['gun14', 70, 84, 86],
    24: ['gun15', 70, 84, 86], 25: ['gun15', 70, 84, 86],
    26: ['gun14', 70, 84, 86], 27: ['fireball', 70, 84, 86],
    36: ['gun1', 120, 134, 120], 40: ['rampageEnemy', 70, 84, 86],
};
/** Четыре используемых поля исходного getWeaponInfo; неизвестные ID сохраняют исходную запасную позу. */
export function weaponPresentation(id: number): WeaponPresentation {
  const [sound, shootFrame, idleFrame, endFrame] = WEAPON_PRESENTATION[id] ?? ['gun1', 10, 24, 10];
  return { sound, shootFrame, idleFrame, endFrame };
}

const PROJECTILES: Readonly<Partial<Record<number, ProjectileKind>>> = { 21: 'grenade', 22: 'rocket', 23: 'bolt', 26: 'bolt', 24: 'arrow', 25: 'arrow', 27: 'gravity', 40: 'flame' };
export function weaponBehavior(item: Readonly<Item>) {
  const projectile = item.special ? PROJECTILES[item.id] ?? null : null;
  return {
    projectile, chainSpinUp: item.id === 16, bowDraw: item.id === 24 || item.id === 25,
    speedBase: item.id === 21 ? 12 : item.id === 23 || item.id === 26 ? 20 : 10,
    projectileCount: item.id === 25 ? 3 : 1, extraPenetrations: item.id === 23 ? 1 : 0,
    immediateReload: item.id === 27,
  };
}

export function explosionStats(traits: CombatTraits, damage: number, type: 'grenade' | 'launcher' | 'gravity' | 'flame' = 'grenade') {
  const multiplier = (100 + combatTrait(COMBAT_TRAIT.DA_BOMB, traits)) / 100;
  const radiusMultiplier = multiplier * (type === 'launcher' ? 1.1 : type === 'flame' ? 0.9 : 1);
  return { damage: damage === -1 ? -1 : int(damage * multiplier), radiusX: 60 * radiusMultiplier, radiusY: 50 * radiusMultiplier };
}

/** enchant выполняется над копией и только при достижении порога; тело генератора предметов общее с лавкой. */
export function livingWeaponKill(item: Readonly<Item>, random: () => number, context: Partial<ItemContext> = {}): Item {
  const result = { ...item };
  if (result.livingWeapon > 0 && --result.livingWeapon <= 0) {
    if (result.modMax < 6) result.modMax++;
    if (result.mod < result.modMax) new ItemFactory(random, context).enchant(result);
    result.livingWeapon = int(25 * 2 ** result.modMax);
  }
  return result;
}
