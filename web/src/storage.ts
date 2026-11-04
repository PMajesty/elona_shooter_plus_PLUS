export const SAVE_KEY = 'elona-shooter-plus-plus.port.save.v1';
export const SAVE_SLOTS = 8;
import { createProfile, validProfile, profileRuleset, type GlobalProfile } from './profile.ts';
import type { RulesetId } from './rulesets.ts';
const SLOT_KEY = 'elona-shooter-plus-plus.port.slot.v1';
const DELETED_FORMAT = 'elona-shooter-browser-deleted';
function validSlot(slot: number): boolean { return Number.isInteger(slot) && slot >= 0 && slot < SAVE_SLOTS; }
function slotKey(slot: number): string {
  if (!validSlot(slot)) throw new RangeError('Invalid save slot.');
  // Первый слот сохраняет прежний ключ: существующее приключение не копируется и не теряется.
  return slot === 0 ? SAVE_KEY : `${SAVE_KEY}.slot.${slot}`;
}
export function readSelectedSlot(): number {
  try { const slot = Number(localStorage.getItem(SLOT_KEY) ?? 0); return validSlot(slot) ? slot : 0; } catch { return 0; }
}
export function selectSaveSlot(slot: number): boolean {
  if (!validSlot(slot)) return false;
  try { localStorage.setItem(SLOT_KEY, String(slot)); return true; } catch { return false; }
}
const PROFILE_KEY = 'elona-shooter-plus-plus.port.profile.v1';
const OPTIONS_KEY = 'elona-shooter-plus-plus.port.options.v1';
const EDITION_PREFERENCE_KEY = 'elona-shooter-plus-plus.port.new-game-edition.v1';

// Выбор следующей новой игры независим от издания загружаемого приключения.
export function readNewGameRuleset(): RulesetId {
  try { return localStorage.getItem(EDITION_PREFERENCE_KEY) === 'expanded' ? 'expanded' : 'classic'; }
  catch { return 'classic'; }
}
export function storeNewGameRuleset(ruleset: RulesetId): boolean {
  if (ruleset !== 'classic' && ruleset !== 'expanded') return false;
  try { localStorage.setItem(EDITION_PREFERENCE_KEY, ruleset); return true; }
  catch { return false; }
}

export function canSaveAdventure(state: { mode?: string; phase: string }): boolean {
  return state.mode !== 'hardcore' || state.phase === 'town';
}
export function clearSave(slot = readSelectedSlot()): boolean {
  try { localStorage.removeItem(slotKey(slot)); return true; } catch { return false; }
}

export type SaveRead = { kind: 'empty' } | { kind: 'saved'; data: unknown } | { kind: 'error'; message: string };

export function readSave(slot = readSelectedSlot()): SaveRead {
  try {
    const raw = localStorage.getItem(slotKey(slot));
    if (raw === null) return { kind: 'empty' };
    const data = JSON.parse(raw);
    return data?.format === DELETED_FORMAT ? { kind: 'empty' } : { kind: 'saved', data };
  } catch {
    return { kind: 'error', message: 'The saved game could not be read. Import a backup, or start a new game.' };
  }
}

export function storeSave(data: unknown, slot = readSelectedSlot()): boolean {
  try {
    localStorage.setItem(slotKey(slot), JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function deleteSaveSlot(slot: number): boolean {
  try {
    const key = slotKey(slot), raw = localStorage.getItem(key);
    if (raw === null) return true;
    try { if (JSON.parse(raw)?.format === DELETED_FORMAT) return true; } catch { /* Повреждённый слот тоже можно убрать из списка. */ }
    // SharedObject оригинала помечает слот удалённым, сохраняя его данные.
    localStorage.setItem(key, JSON.stringify({ format: DELETED_FORMAT, raw })); return true;
  } catch { return false; }
}

export function readProfile(ruleset: RulesetId = 'classic'): { profile: GlobalProfile; warning?: string } {
  try {
    const raw = localStorage.getItem(ruleset === 'classic' ? PROFILE_KEY : `${PROFILE_KEY}.expanded`);
    if (raw === null) return { profile: createProfile(ruleset) };
    const profile = JSON.parse(raw);
    if (validProfile(profile) && profileRuleset(profile) === ruleset) return { profile };
  } catch { /* Повреждённая коллекция не должна блокировать загрузку самой игры. */ }
  return { profile: createProfile(ruleset), warning: 'The medal collection could not be read. Import a backup to restore it.' };
}
export function storeProfile(profile: GlobalProfile): boolean {
  if (!validProfile(profile)) return false;
  try { localStorage.setItem(profileRuleset(profile) === 'classic' ? PROFILE_KEY : `${PROFILE_KEY}.expanded`, JSON.stringify(profile)); return true; }
  catch { return false; }
}

export function exportSave(data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'elona-shooter-save.json';
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function readMute(): boolean {
  try { return JSON.parse(localStorage.getItem(OPTIONS_KEY) ?? '{}').muted !== false; }
  catch { return true; }
}

export function storeMute(muted: boolean): void {
  try { localStorage.setItem(OPTIONS_KEY, JSON.stringify({ muted })); }
  catch { /* В приватном режиме настройки звука остаются только в текущем сеансе. */ }
}
