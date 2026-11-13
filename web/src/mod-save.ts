import { ITEM_TYPE, type Item } from './items.ts';
import { MISSING_MOD_ITEM_ID, modWeaponByKey } from './weapon-registry.ts';

/**
 * Подготовка оружия модов перед загрузкой сохранения (возвращает новый объект и не меняет входной; без предметов модов
 * возвращает вход как есть):
 * - мод включён: номер предмета берётся из этой сессии по регистрационному имени (modWeapon) — номера зависят от набора модов, имя нет;
 * - мод удалён или выключен: предмет становится заглушкой для продажи с номером 999, исходные данные целиком лежат в modItem;
 * - мод заглушки вернулся: исходное оружие восстанавливается из modItem.
 * Предмет может лежать где угодно (инвентарь, оружие спутников, магазин, добыча, предпросмотр улучшения, прошлый город),
 * поэтому обходится всё сохранение.
 */
export function remapModItems<T>(value: T): T {
  if (!containsModItem(value)) return value;
  return walk(value) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function isModItem(value: Record<string, unknown>): boolean {
  return typeof value.modWeapon === 'string' || (value.id === MISSING_MOD_ITEM_ID && isRecord(value.modItem));
}
function containsModItem(value: unknown, depth = 0): boolean {
  if (depth > 12) return false;
  if (Array.isArray(value)) return value.some(entry => containsModItem(entry, depth + 1));
  if (!isRecord(value)) return false;
  return isModItem(value) || Object.values(value).some(entry => containsModItem(entry, depth + 1));
}
function walk(value: unknown, depth = 0): unknown {
  if (depth > 12) return value;
  if (Array.isArray(value)) return value.map(entry => walk(entry, depth + 1));
  if (!isRecord(value)) return value;
  if (isModItem(value)) return remapItem(value);
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, walk(entry, depth + 1)]));
}

function remapItem(item: Record<string, unknown>): Record<string, unknown> {
  // Заглушка: если мод вернулся, восстанавливаем оружие, иначе оставляем заглушку.
  if (item.id === MISSING_MOD_ITEM_ID && isRecord(item.modItem)) {
    const original = item.modItem;
    const weapon = typeof original.modWeapon === 'string' ? modWeaponByKey(original.modWeapon) : undefined;
    return weapon ? { ...original, num: item.num, id: weapon.id, graphic: weapon.id + 10 } : item;
  }
  const weapon = modWeaponByKey(String(item.modWeapon));
  if (weapon) return { ...item, id: weapon.id, graphic: weapon.id + 10 };
  return missingPlaceholder(item);
}

/** Заглушка отсутствующего мода: предмет для продажи ценой 1, его нельзя экипировать или использовать; num сохраняется ради занятости ячейки. */
export function missingPlaceholder(original: Record<string, unknown>): Record<string, unknown> {
  const { modWeapon: _key, modItem: _stash, ...rest } = original;
  return {
    ...rest, id: MISSING_MOD_ITEM_ID, graphic: MISSING_MOD_ITEM_ID + 10, type: ITEM_TYPE.sell,
    name: 'Unknown MOD Weapon', value: 1, reloadTime: 0, mod: 0, modText: '', livingWeapon: 0, autoReload: 0,
    modItem: original as unknown as Item,
  };
}

/** Регистрационное имя мода, которого не хватает заглушке (для подсказки в интерфейсе). */
export function missingModKey(item: Readonly<Item>): string | undefined {
  return item.id === MISSING_MOD_ITEM_ID ? item.modItem?.modWeapon : undefined;
}
