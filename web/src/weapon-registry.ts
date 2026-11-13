/**
 * Реестр оружия из модов: хранит только моды, включённые в этой игровой сессии, и не импортирует другие модули игры
 * (чтобы не было циклических зависимостей). Разбор data.json — в mod-weapons.ts; генерация предметов, бой, сохранения
 * и отрисовка обращаются сюда через функции-запросы.
 * Пока не зарегистрировано ни одного оружия, все запросы пусты и поведение игры (включая расход RNG) совпадает с исходным.
 */
export type ModProjectileKind = 'grenade' | 'rocket' | 'bolt' | 'arrow' | 'gravity' | 'flame';

/** Числовые поля предмета; имена совпадают с исходным generateStuff и полями Item в items.ts. */
export interface ModWeaponItemFields {
  name: string; reloadTimeMax: number; ammoMax: number; shootRate: number; automatic: boolean; manualReload: boolean;
  baseAccuracy: number; accuracyDec: number; attack: number; dmgAir: number; dmgArmor: number;
  reqTrait: number; reqLv: number; range: number; shell: number; value: number; typeMinor: number; special: number; rare: number;
}
export interface ModWeaponBehavior {
  projectile: ModProjectileKind | null; speedBase: number; extraPenetrations: number;
  projectileCount: 1 | 3; bowDraw: boolean; chainSpinUp: boolean; immediateReload: boolean;
}
export interface ModWeaponPresentation {
  sound: string; shootFrame: number; idleFrame: number; endFrame: number; reloadSound: 'magazine' | 'shell' | 'revolver';
}
export interface ModWeaponIcon {
  /** Ключ текстуры (создаётся сценой при загрузке). */
  texture: string;
  /** Видимые ширина и высота значка в игровых координатах (после обрезки прозрачных полей, масштаб 1). */
  width: number; height: number;
  /** Точка регистрации внутри текстуры в пикселях: совмещает значок с исходными значками. */
  originX: number; originY: number;
}
export interface ModWeapon {
  /** Регистрационное имя = имя папки; оно записывается в сохранение. */
  key: string;
  /** Номер предмета в этой сессии (с 1000); сохранение хранит ещё и имя, поэтому смена номеров не мешает загрузке. */
  id: number;
  fields: ModWeaponItemFields;
  behavior: ModWeaponBehavior;
  presentation: ModWeaponPresentation;
  /** Названия и описания на других языках; английское название — fields.name. */
  names: Partial<Record<'zh' | 'ru', string>>;
  description: Partial<Record<'en' | 'zh' | 'ru', string>>;
  /** Случайная генерация: участвует ли оружие в пуле магазина, добычи и наград босса, и его вес (1 = как один исходный номер). */
  randomDrop: boolean; weight: number;
  icon?: ModWeaponIcon;
}

export const MOD_WEAPON_FIRST_ID = 1000;
/** Если мод удалён, его оружие в сохранении временно становится этим предметом для продажи (данные хранятся в modItem и восстанавливаются, когда мод вернётся). */
export const MISSING_MOD_ITEM_ID = 999;

let weapons: ModWeapon[] = [];
let byId = new Map<number, ModWeapon>();
let byKey = new Map<string, ModWeapon>();
let pool: { weapon: ModWeapon; weight: number }[] = [];
let poolTotal = 0;

/** Заменяет оружие модов этой сессии (вызывается один раз при запуске; в середине сессии набор не меняется ради сохранений и RNG). */
export function registerModWeapons(list: readonly Omit<ModWeapon, 'id'>[]): ModWeapon[] {
  weapons = [...list].sort((a, b) => a.key.localeCompare(b.key)).map((weapon, index) => ({ ...weapon, id: MOD_WEAPON_FIRST_ID + index }));
  byId = new Map(weapons.map(weapon => [weapon.id, weapon]));
  byKey = new Map(weapons.map(weapon => [weapon.key, weapon]));
  pool = weapons.filter(weapon => weapon.randomDrop && weapon.weight > 0).map(weapon => ({ weapon, weight: weapon.weight }));
  poolTotal = pool.reduce((sum, entry) => sum + entry.weight, 0);
  return weapons;
}
export const modWeapons = (): readonly ModWeapon[] => weapons;
export const modWeaponById = (id: number): ModWeapon | undefined => byId.get(id);
export const modWeaponByKey = (key: string): ModWeapon | undefined => byKey.get(key);
export const isModWeaponId = (id: number): boolean => byId.has(id);
/** Геометрия значка (вызывается после того, как сцена создала текстуру). */
export function setModWeaponIcon(key: string, icon: ModWeaponIcon): void {
  const weapon = byKey.get(key);
  if (weapon) weapon.icon = icon;
}

/**
 * Выбор номера в случайном пуле (исходный randomStuff: `1 + int(rand*40)`).
 * Без оружия модов — ровно один вызов random, как в оригинале; с ним диапазон расширяется до 40 + сумма весов:
 * первые 40 по-прежнему равномерно дают исходные номера, остаток распределяется по весам модов.
 */
export function drawRandomItemId(random: () => number): number {
  if (poolTotal <= 0) return 1 + Math.trunc(random() * 40);
  const x = random() * (40 + poolTotal);
  if (x < 40) return 1 + Math.trunc(x);
  let rest = x - 40;
  for (const entry of pool) {
    if (rest < entry.weight) return entry.weapon.id;
    rest -= entry.weight;
  }
  return pool[pool.length - 1].weapon.id;
}
