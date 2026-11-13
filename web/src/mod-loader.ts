import { BASE_ITEM_FIELDS, ITEM_TYPE } from './items.ts';
import { installModWeapons, isValidRegistryName, parseDataJson, parseWeaponData } from './mod-weapons.ts';
import { MOD_ICON_HEIGHT, MOD_ICON_WIDTH, prepareModIcon } from './item-icon.ts';
import type { ModWeapon } from './weapon-registry.ts';

/**
 * Загрузка модов в браузере: читает папки оружия из mods/index.json, загружает data.json и slot.png каждой папки,
 * проверяет их и регистрирует включённое оружие. Страница не может прочитать список папок, поэтому index.json создаёт сервер (или сборка).
 * Включение и выключение хранится в браузере и действует после перезагрузки (в сессии набор постоянен ради сохранений и RNG).
 */
export const MODS_FOLDER = 'mods';
const DISABLED_KEY = 'elona-shooter-plus-plus.mods.disabled.v1';

export interface WeaponModStatus {
  key: string;
  enabled: boolean;
  /** Зарегистрировано ли в этой сессии (включено и без ошибок). */
  active: boolean;
  errors: string[];
  name?: string;
  names?: Partial<Record<'zh' | 'ru', string>>;
  iconUrl?: string;
  weapon?: Omit<ModWeapon, 'id'>;
}
export interface PreparedIcon { key: string; canvas: HTMLCanvasElement; width: number; height: number; originX: number; originY: number }
export interface ModLoadResult {
  /** Доступен ли index.json (если нет — игра открыта без сервера, моды отключены). */
  available: boolean;
  weapons: WeaponModStatus[];
  icons: PreparedIcon[];
}

let lastResult: ModLoadResult = { available: false, weapons: [], icons: [] };
export const modLoadResult = (): ModLoadResult => lastResult;

export function disabledMods(): Set<string> {
  try {
    const value = JSON.parse(localStorage.getItem(DISABLED_KEY) ?? '[]');
    return new Set(Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : []);
  } catch { return new Set(); }
}
export function setModEnabled(key: string, enabled: boolean): void {
  const disabled = disabledMods();
  if (enabled) disabled.delete(key); else disabled.add(key);
  try { localStorage.setItem(DISABLED_KEY, JSON.stringify([...disabled].sort())); } catch { /* Без хранилища настройка действует до конца сессии. */ }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('slot.png could not be read: the file is missing or is not a valid PNG.'));
    image.src = url;
  });
}

const VANILLA_NAMES = new Set(Object.values(BASE_ITEM_FIELDS).filter(fields => (fields.type ?? ITEM_TYPE.gun) === ITEM_TYPE.gun && fields.name).map(fields => fields.name!.toLowerCase()));

export async function loadWeaponMods(base: string): Promise<ModLoadResult> {
  const result: ModLoadResult = { available: false, weapons: [], icons: [] };
  let folders: string[] = [];
  try {
    const response = await fetch(`${base}${MODS_FOLDER}/index.json`, { cache: 'no-store' });
    if (!response.ok) throw new Error(String(response.status));
    const index = await response.json() as { weapons?: unknown };
    folders = Array.isArray(index.weapons) ? index.weapons.filter((entry): entry is string => typeof entry === 'string') : [];
    result.available = true;
  } catch {
    lastResult = result;
    installModWeapons([]);
    return result;
  }
  const disabled = disabledMods();
  const seenNames = new Map<string, string>();
  for (const key of folders.sort()) {
    const status: WeaponModStatus = { key, enabled: !disabled.has(key), active: false, errors: [] };
    result.weapons.push(status);
    if (!isValidRegistryName(key)) {
      status.errors.push(`Folder name “${key}” cannot be a registry name: use lowercase letters, digits, _ and -.`);
      continue;
    }
    const folder = `${base}${MODS_FOLDER}/weapons/${encodeURIComponent(key)}`;
    status.iconUrl = `${folder}/slot.png`;
    let data: unknown;
    try {
      const response = await fetch(`${folder}/data.json`, { cache: 'no-store' });
      if (!response.ok) throw new Error('data.json is missing.');
      const text = await response.text();
      try { data = parseDataJson(text); } catch (error) { throw new Error(`data.json is not valid JSON: ${(error as Error).message}`); }
    } catch (error) {
      status.errors.push((error as Error).message);
      continue;
    }
    const parsed = parseWeaponData(key, data);
    status.errors.push(...parsed.errors);
    if (parsed.weapon) {
      status.weapon = parsed.weapon; status.name = parsed.weapon.fields.name; status.names = parsed.weapon.names;
      const lower = parsed.weapon.fields.name.toLowerCase();
      if (VANILLA_NAMES.has(lower)) status.errors.push(`Name “${parsed.weapon.fields.name}” is already used by an original weapon; choose another English name.`);
      else if (seenNames.has(lower)) status.errors.push(`Name “${parsed.weapon.fields.name}” is already used by MOD “${seenNames.get(lower)}”.`);
      else seenNames.set(lower, key);
    }
    try {
      const image = await loadImage(`${folder}/slot.png?v=${Date.now()}`);
      if (image.naturalWidth !== MOD_ICON_WIDTH || image.naturalHeight !== MOD_ICON_HEIGHT) {
        status.errors.push(`slot.png must be ${MOD_ICON_WIDTH}×${MOD_ICON_HEIGHT} pixels, not ${image.naturalWidth}×${image.naturalHeight}.`);
      } else {
        const icon = prepareModIcon(image);
        if (!icon) status.errors.push('slot.png is fully transparent.');
        else if (!status.errors.length && status.enabled) result.icons.push({ key, ...icon });
      }
    } catch (error) {
      status.errors.push((error as Error).message);
    }
    status.active = status.enabled && !status.errors.length && Boolean(status.weapon);
  }
  installModWeapons(result.weapons.filter(status => status.active).map(status => status.weapon!));
  lastResult = result;
  return result;
}
