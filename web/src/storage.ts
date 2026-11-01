export const SAVE_KEY = 'elona-shooter-plus-plus.port.save.v1';
const OPTIONS_KEY = 'elona-shooter-plus-plus.port.options.v1';

export type SaveRead = { kind: 'empty' } | { kind: 'saved'; data: unknown } | { kind: 'error'; message: string };

export function readSave(): SaveRead {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw === null ? { kind: 'empty' } : { kind: 'saved', data: JSON.parse(raw) };
  } catch {
    return { kind: 'error', message: 'The saved game could not be read. Import a backup, or start a new game.' };
  }
}

export function storeSave(data: unknown): boolean {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
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
  try { return JSON.parse(localStorage.getItem(OPTIONS_KEY) ?? '{}').muted === true; }
  catch { return false; }
}

export function storeMute(muted: boolean): void {
  try { localStorage.setItem(OPTIONS_KEY, JSON.stringify({ muted })); }
  catch { /* В приватном режиме настройки звука остаются только в текущем сеансе. */ }
}
