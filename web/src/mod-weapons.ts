import { BASE_ITEM_FIELDS, ITEM_TRAIT, type Item } from './items.ts';
import { weaponBehavior, weaponPresentation } from './combat-stats.ts';
import { registerModWeapons, type ModProjectileKind, type ModWeapon, type ModWeaponBehavior, type ModWeaponItemFields, type ModWeaponPresentation } from './weapon-registry.ts';
import { registerRuntimeTranslations } from './i18n.ts';

/**
 * Разбор data.json оружия из модов (только данные, без Phaser и браузера — удобно для тестов).
 * Имена полей совпадают с полями исходных предметов (attack, shootRate, ammoMax…), плюс параметры поведения и вида;
 * template позволяет взять исходное оружие и указать только изменения. Неизвестные поля, неверные типы и выход за пределы — ошибки с именем поля.
 * Ошибки пишутся по-английски и переводятся при показе (переводы в locales).
 */

/** Исходное оружие, доступное как шаблон (ключ → исходный номер предмета). */
export const WEAPON_TEMPLATES = {
  pistol: 1, subMachineGun: 2, shotgun: 3, huntersRifle: 4, assaultRifle: 5, sniperRifle: 13, sniperRevolver: 14,
  revolver: 15, chainGun: 16, machineGun: 17, laserPistol: 18, combatShotgun: 19, autoShotgun: 20,
  grenadeLauncher: 21, rocketLauncher: 22, crossbow: 23, longBow: 24, windBow: 25, repeatingCrossbow: 26,
  gravityGun: 27, cheapWornHmg: 36, hmg: 39, flameThrower: 40,
} as const;
export type WeaponTemplate = keyof typeof WEAPON_TEMPLATES;

/** Позы героя с оружием (кадры ally1: выстрел, ожидание, конец). */
export const WEAPON_POSES = {
  pistol: [10, 24, 10], shotgun: [95, 109, 95], rifle: [120, 134, 120],
  chainGun: [145, 159, 145], launcher: [170, 184, 184], bow: [70, 84, 86],
} as const;
export type WeaponPose = keyof typeof WEAPON_POSES;
/** Доступные звуки выстрела (все, что использует исходное оружие). */
export const WEAPON_SOUNDS = ['gun1', 'gun2', 'gun3', 'gun4', 'gun5', 'gun6', 'gun7', 'gun8', 'gun9', 'gun10', 'gun11', 'gun12',
  'gun13', 'gun14', 'gun15', 'fireball', 'rampageEnemy'] as const;
export const WEAPON_CATEGORIES = { smallGun: ITEM_TRAIT.smallGun, rifle: ITEM_TRAIT.rifle, shotgun: ITEM_TRAIT.shotgun, bigGun: ITEM_TRAIT.bigGun } as const;
export const WEAPON_CLASSES = { normal: 0, sniper: 1, shotgun: 2 } as const;
export const PROJECTILES = ['none', 'grenade', 'rocket', 'bolt', 'arrow', 'gravity', 'flame'] as const;
/** Исходный special задаёт снаряд (1 граната, 2 ракета, 3 болт/гравитация/огонь, 4 стрела); проверка сохранения отряда узнаёт лук по 4. */
const SPECIAL_BY_PROJECTILE: Readonly<Record<ModProjectileKind, number>> = { grenade: 1, rocket: 2, bolt: 3, gravity: 3, flame: 3, arrow: 4 };

export const REGISTRY_NAME = /^[a-z0-9][a-z0-9_-]{0,47}$/;
export const isValidRegistryName = (name: string): boolean => REGISTRY_NAME.test(name);

/**
 * Чтение data.json: разрешены комментарии // и /* *\/, а также лишняя запятая в конце объекта или массива (для пояснений авторов модов).
 * Комментарии заменяются пробелами той же длины с сохранением переводов строк, поэтому позиции ошибок JSON совпадают с файлом.
 */
export function parseDataJson(text: string): unknown {
  let out = '';
  let index = 0;
  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  while (index < source.length) {
    const char = source[index], next = source[index + 1];
    if (char === '"') {
      let end = index + 1;
      while (end < source.length && source[end] !== '"') end += source[end] === '\\' ? 2 : 1;
      out += source.slice(index, end + 1); index = end + 1;
    } else if (char === '/' && next === '/') {
      while (index < source.length && source[index] !== '\n') { out += source[index] === '\r' ? '\r' : ' '; index++; }
    } else if (char === '/' && next === '*') {
      const end = source.indexOf('*/', index + 2);
      if (end < 0) throw new SyntaxError('A comment starting with /* is not closed with */');
      out += source.slice(index, end + 2).replace(/[^\r\n]/g, ' '); index = end + 2;
    } else { out += char; index++; }
  }
  // Убираем лишнюю запятую перед } или ] (только вне строк, содержимое строк не меняется).
  let cleaned = '', inString = false;
  for (let i = 0; i < out.length; i++) {
    const char = out[i];
    if (inString) { cleaned += char; if (char === '\\') { cleaned += out[++i] ?? ''; } else if (char === '"') inString = false; continue; }
    if (char === '"') { inString = true; cleaned += char; continue; }
    if (char === ',') {
      let j = i + 1;
      while (j < out.length && /\s/.test(out[j])) j++;
      if (out[j] === '}' || out[j] === ']') { cleaned += ' '; continue; }
    }
    cleaned += char;
  }
  return JSON.parse(cleaned);
}

/** Все допустимые поля data.json с описаниями (используется и для ошибки «неизвестное поле»). */
export const DATA_FIELDS = {
  format: 'Data format version; currently 1 (optional)',
  template: 'Optional original weapon to start from: ' + Object.keys(WEAPON_TEMPLATES).join(', '),
  name: 'English name (required; saves and translations use it)',
  names: 'Names in other languages, e.g. {"zh": "...", "ru": "..."}',
  description: 'Item description: text, or {"en": ..., "zh": ..., "ru": ...}',
  attack: 'Damage per shot', shootRate: 'Fire rate (original value, higher is faster)', ammoMax: 'Magazine size (at least 1)',
  reloadTimeMax: 'Reload time in frames (0 = no ammo needed, like the original bows)', manualReload: 'Reload one round at a time (true/false)',
  automatic: 'Keep firing while the button is held (true/false)',
  baseAccuracy: 'Base accuracy (higher means less spread)', accuracyDec: 'Recoil per shot (accuracy loss)', shell: 'Pellets per shot (shotguns use more than 1)',
  range: 'Best range: 0 near, 1 middle, 2 far', dmgAir: 'Damage against flying enemies, percent', dmgArmor: 'Damage against armored enemies, percent',
  category: 'Weapon skill: ' + Object.keys(WEAPON_CATEGORIES).join(', '), reqLv: 'Required skill level',
  weaponClass: 'normal, sniper (One hit kill applies) or shotgun (Dr Holliday adds pellets)',
  value: 'Price (also sets how rare the weapon is in random drops)',
  randomDrop: 'Appears in shops, loot and boss drops (default true)', weight: 'Weight in the random pool (default 1 = one original item number)',
  projectile: 'Projectile: ' + PROJECTILES.join(', ') + ' (none = instant bullets)', projectileSpeed: 'Projectile speed (original bow 10, crossbow 20)',
  pierce: 'Extra enemies a bolt or arrow passes through', volley: 'Projectiles per shot: 1, or 3 (a Wind Bow volley)',
  bowDraw: 'Hold to draw, release to shoot (needs projectile arrow)', spinUp: 'Chain Gun spin-up (needs projectile none)',
  reloadAfterShot: 'Reload after every shot, like the Gravity Gun (needs reloadTimeMax above 0)',
  pose: 'Hero pose: ' + Object.keys(WEAPON_POSES).join(', '), sound: 'Shot sound: ' + WEAPON_SOUNDS.join(', '),
  reloadSound: 'Reload sound: magazine, shell or revolver',
} as const;

export interface ParsedWeapon { weapon?: Omit<ModWeapon, 'id'>; errors: string[] }

/** Полные параметры исходного оружия в формате data.json — шаблон или значения по умолчанию. */
export function templateData(template: WeaponTemplate): Record<string, unknown> {
  const id = WEAPON_TEMPLATES[template];
  const fields = BASE_ITEM_FIELDS[id] as Partial<Item>;
  const behavior = weaponBehavior({ ...fields, id, special: fields.special ?? 0 } as Item);
  const presentation = weaponPresentation(id);
  const pose = (Object.entries(WEAPON_POSES).find(([, frames]) => frames[0] === presentation.shootFrame && frames[1] === presentation.idleFrame)?.[0] ?? 'pistol');
  const category = Object.entries(WEAPON_CATEGORIES).find(([, trait]) => trait === fields.reqTrait)?.[0];
  const weaponClass = Object.entries(WEAPON_CLASSES).find(([, minor]) => minor === (fields.typeMinor ?? 0))?.[0];
  return {
    name: fields.name, attack: fields.attack, shootRate: fields.shootRate, ammoMax: fields.ammoMax, reloadTimeMax: fields.reloadTimeMax,
    manualReload: fields.manualReload ?? false, automatic: fields.automatic ?? true, baseAccuracy: fields.baseAccuracy, accuracyDec: fields.accuracyDec,
    shell: fields.shell ?? 1, range: fields.range, dmgAir: fields.dmgAir, dmgArmor: fields.dmgArmor, category, reqLv: fields.reqLv,
    weaponClass, value: fields.value, projectile: behavior.projectile ?? 'none', projectileSpeed: behavior.speedBase,
    pierce: behavior.extraPenetrations, volley: behavior.projectileCount, bowDraw: behavior.bowDraw, spinUp: behavior.chainSpinUp,
    reloadAfterShot: behavior.immediateReload, pose, sound: presentation.sound,
    reloadSound: id === 14 || id === 15 ? 'revolver' : fields.manualReload ? 'shell' : 'magazine',
  };
}

/** Значения по умолчанию без шаблона; остальные поля (название, урон, скорострельность, магазин, перезарядка, точность, отдача, навык, цена) обязательны. */
const DEFAULTS: Record<string, unknown> = {
  manualReload: false, automatic: false, shell: 1, range: 1, dmgAir: 100, dmgArmor: 100, reqLv: 1, weaponClass: 'normal',
  projectile: 'none', projectileSpeed: 10, pierce: 0, volley: 1, bowDraw: false, spinUp: false, reloadAfterShot: false, sound: 'gun1',
};
const REQUIRED_WITHOUT_TEMPLATE = ['name', 'attack', 'shootRate', 'ammoMax', 'reloadTimeMax', 'baseAccuracy', 'accuracyDec', 'category', 'value'] as const;

export function parseWeaponData(key: string, data: unknown): ParsedWeapon {
  const errors: string[] = [];
  if (!isValidRegistryName(key)) errors.push(`Registry name “${key}” is invalid: use lowercase letters, digits, _ and -, starting with a letter or digit (48 characters at most).`);
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return { errors: [...errors, 'data.json must contain a JSON object.'] };
  const input = data as Record<string, unknown>;
  for (const field of Object.keys(input)) if (!Object.hasOwn(DATA_FIELDS, field)) errors.push(`Unknown field “${field}”. Check the spelling; mods/README.md lists every field.`);
  if (input.format !== undefined && input.format !== 1) errors.push('Field “format” must be 1.');
  let base: Record<string, unknown> = { ...DEFAULTS };
  if (input.template !== undefined) {
    if (typeof input.template !== 'string' || !Object.hasOwn(WEAPON_TEMPLATES, input.template)) errors.push(`Template “${String(input.template)}” does not exist. Available: ${Object.keys(WEAPON_TEMPLATES).join(', ')}.`);
    else base = templateData(input.template as WeaponTemplate);
  } else {
    for (const field of REQUIRED_WITHOUT_TEMPLATE) if (input[field] === undefined) errors.push(`Missing field “${field}” (required without a template).`);
  }
  const merged: Record<string, unknown> = { ...base, ...input };
  if (input.template !== undefined && input.name === undefined) errors.push('Missing field “name”: a MOD weapon needs its own English name.');
  // Без шаблона и без pose/reloadSound берём привычные для оригинала значения по навыку и способу зарядки.
  merged.pose ??= merged.category === 'shotgun' ? 'shotgun' : merged.category === 'rifle' ? 'rifle' : merged.category === 'bigGun' ? 'rifle' : 'pistol';
  merged.reloadSound ??= merged.manualReload === true ? 'shell' : 'magazine';

  const number = (field: string, min: number, max: number, integer = false): number => {
    const value = merged[field];
    if (typeof value !== 'number' || !Number.isFinite(value)) { errors.push(`Field “${field}” must be a number.`); return min; }
    if (integer && !Number.isInteger(value)) { errors.push(`Field “${field}” must be a whole number.`); return min; }
    if (value < min || value > max) { errors.push(`Field “${field}” must be between ${min} and ${max}, not ${value}.`); return Math.min(max, Math.max(min, value)); }
    return value;
  };
  const bool = (field: string): boolean => {
    if (typeof merged[field] !== 'boolean') { errors.push(`Field “${field}” must be true or false.`); return false; }
    return merged[field] as boolean;
  };
  const choice = <T extends string>(field: string, options: readonly T[]): T => {
    const value = merged[field];
    if (typeof value !== 'string' || !options.includes(value as T)) { errors.push(`Field “${field}” must be one of: ${options.join(', ')}.`); return options[0]; }
    return value as T;
  };
  const text = (field: string): string => {
    const value = merged[field];
    if (typeof value !== 'string' || !value.trim()) { errors.push(`Field “${field}” must be non-empty text.`); return ''; }
    if (value.length > 80) errors.push(`Field “${field}” is too long (80 characters at most).`);
    return value.trim();
  };

  const name = text('name');
  const names: Partial<Record<'zh' | 'ru', string>> = {};
  if (merged.names !== undefined) {
    if (typeof merged.names !== 'object' || merged.names === null || Array.isArray(merged.names)) errors.push('Field “names” must be an object, for example {"ru": "..."}.');
    else for (const [lang, value] of Object.entries(merged.names)) {
      if (lang !== 'zh' && lang !== 'ru') errors.push(`Language “${lang}” in “names” is not supported (use zh or ru).`);
      else if (typeof value !== 'string' || !value.trim() || value.length > 80) errors.push(`Name “${lang}” must be text of 1 to 80 characters.`);
      else names[lang] = value.trim();
    }
  }
  const description: Partial<Record<'en' | 'zh' | 'ru', string>> = {};
  if (typeof merged.description === 'string') description.en = merged.description;
  else if (merged.description !== undefined) {
    if (typeof merged.description !== 'object' || merged.description === null || Array.isArray(merged.description)) errors.push('Field “description” must be text or an object, for example {"en": "...", "ru": "..."}.');
    else for (const [lang, value] of Object.entries(merged.description)) {
      if (lang !== 'en' && lang !== 'zh' && lang !== 'ru') errors.push(`Language “${lang}” in “description” is not supported (use en, zh or ru).`);
      else if (typeof value !== 'string' || value.length > 600) errors.push(`Description “${lang}” must be text of 600 characters at most.`);
      else description[lang] = value;
    }
  }
  for (const value of Object.values(description)) if (/\{\d+\}/.test(value!)) errors.push('Field “description” must not contain placeholders in braces.');
  if (/\{\d+\}/.test(name)) errors.push('Field “name” must not contain placeholders in braces.');

  const category = choice('category', Object.keys(WEAPON_CATEGORIES) as (keyof typeof WEAPON_CATEGORIES)[]);
  const weaponClass = choice('weaponClass', Object.keys(WEAPON_CLASSES) as (keyof typeof WEAPON_CLASSES)[]);
  const projectile = choice('projectile', PROJECTILES);
  const fields: ModWeaponItemFields = {
    name,
    attack: number('attack', 0, 100000),
    shootRate: number('shootRate', 1, 3000),
    ammoMax: number('ammoMax', 1, 9999, true),
    reloadTimeMax: number('reloadTimeMax', 0, 2000, true),
    manualReload: bool('manualReload'),
    automatic: bool('automatic'),
    baseAccuracy: number('baseAccuracy', 0, 1000),
    accuracyDec: number('accuracyDec', 0, 10),
    shell: number('shell', 1, 30, true),
    range: number('range', 0, 2, true),
    dmgAir: number('dmgAir', 0, 1000),
    dmgArmor: number('dmgArmor', 0, 1000),
    reqTrait: WEAPON_CATEGORIES[category],
    reqLv: number('reqLv', 0, 99, true),
    value: number('value', 1, 10000000),
    typeMinor: WEAPON_CLASSES[weaponClass],
    special: projectile === 'none' ? 0 : SPECIAL_BY_PROJECTILE[projectile],
    rare: 100,
  };
  const volley = number('volley', 1, 3, true);
  if (volley !== 1 && volley !== 3) errors.push('Field “volley” must be 1 or 3.');
  const behavior: ModWeaponBehavior = {
    projectile: projectile === 'none' ? null : projectile,
    speedBase: number('projectileSpeed', 1, 100),
    extraPenetrations: number('pierce', 0, 20, true),
    projectileCount: volley === 3 ? 3 : 1,
    bowDraw: bool('bowDraw'), chainSpinUp: bool('spinUp'), immediateReload: bool('reloadAfterShot'),
  };
  if (behavior.bowDraw && projectile !== 'arrow') errors.push('Field “bowDraw” needs projectile arrow.');
  if (behavior.chainSpinUp && projectile !== 'none') errors.push('Field “spinUp” needs projectile none.');
  if (behavior.immediateReload && fields.reloadTimeMax === 0) errors.push('Field “reloadAfterShot” needs reloadTimeMax above 0.');
  if (behavior.projectileCount === 3 && projectile === 'none') errors.push('A volley of 3 needs a projectile; guns use shell for extra pellets.');
  if (behavior.extraPenetrations > 0 && projectile !== 'arrow' && projectile !== 'bolt') errors.push('Field “pierce” only works with projectile arrow or bolt.');
  const pose = choice('pose', Object.keys(WEAPON_POSES) as WeaponPose[]);
  const presentation: ModWeaponPresentation = {
    sound: choice('sound', WEAPON_SOUNDS),
    shootFrame: WEAPON_POSES[pose][0], idleFrame: WEAPON_POSES[pose][1], endFrame: WEAPON_POSES[pose][2],
    reloadSound: choice('reloadSound', ['magazine', 'shell', 'revolver'] as const),
  };
  const randomDrop = merged.randomDrop === undefined ? true : bool('randomDrop');
  const weight = merged.weight === undefined ? 1 : number('weight', 0, 100);
  if (errors.length) return { errors };
  return { weapon: { key, fields, behavior, presentation, names, description, randomDrop, weight }, errors };
}

/** Каноническое описание: английское, если есть, иначе первое указанное (интерфейс переводит его при показе). */
export function canonicalDescription(weapon: Pick<ModWeapon, 'description'>): string {
  return weapon.description.en ?? weapon.description.zh ?? weapon.description.ru ?? '';
}

/** Регистрирует включённое оружие модов и добавляет названия (включая Mk-N) и описания в переводы. */
export function installModWeapons(list: readonly Omit<ModWeapon, 'id'>[]): readonly ModWeapon[] {
  const installed = registerModWeapons(list);
  for (const lang of ['zh', 'ru'] as const) {
    const entries: Record<string, string> = {};
    for (const weapon of installed) {
      const translated = weapon.names[lang];
      if (translated) { entries[weapon.fields.name] = translated; entries[`${weapon.fields.name} Mk-{0}`] = `${translated} Mk-{0}`; }
      const source = canonicalDescription(weapon), description = weapon.description[lang];
      if (source && description && description !== source) entries[source] = description;
    }
    registerRuntimeTranslations(lang, entries);
  }
  return installed;
}
