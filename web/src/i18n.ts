import { ruContent } from './locales/ru-content.ts';
import { ruUI } from './locales/ru-ui.ts';

export type Language = 'en' | 'ru';
const LANGUAGE_KEY = 'elona-shooter-plus-plus.port.language.v1';
export const RUSSIAN: Readonly<Record<string, string>> = { ...ruContent, ...ruUI };
const CONTENT_RUSSIAN: Readonly<Record<string, string>> = { ...ruUI, ...ruContent };
export type TextContext = 'ui' | 'content';
export function readLanguage(): Language {
  try { return localStorage.getItem(LANGUAGE_KEY) === 'ru' ? 'ru' : 'en'; } catch { return 'en'; }
}
let language = readLanguage();
const listeners = new Set<() => void>();
export const getLanguage = (): Language => language;
export function setLanguage(next: Language): void {
  if (next !== 'en' && next !== 'ru' || next === language) return;
  language = next;
  try { localStorage.setItem(LANGUAGE_KEY, next); } catch { /* Настройка работает до закрытия вкладки. */ }
  for (const update of [...listeners]) if (listeners.has(update)) update();
}
export function onLanguageChanged(update: () => void): () => void {
  listeners.add(update); return () => listeners.delete(update);
}

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const patterns = Object.entries(RUSSIAN).filter(([key]) => /\{\d+\}/.test(key))
  .sort((a, b) => b[0].replace(/\{\d+\}/g, '').length - a[0].replace(/\{\d+\}/g, '').length)
  .map(([source, translated]) => {
    const slots: number[] = [];
    const numericUnit = source === '{0}ms{1}' || source === '{0}/sec';
    // Обычное сообщение не захватывает соседнюю строку новостей вместе с её точкой.
    const capture = /[\r\n]/.test(source) ? '([\\s\\S]*?)' : '([^\\r\\n]*?)';
    const pattern = source.split(/(\{\d+\})/).map(part => {
      if (!/^\{\d+\}$/.test(part)) return escape(part);
      const slot = Number(part.slice(1, -1)); slots.push(slot);
      if (numericUnit) return slot === 0 ? '([0-9]+(?:\\.[0-9]+)?)' : '(\\(M\\))?';
      return capture;
    }).join('');
    return { match: new RegExp(`^${pattern}$`), slots, translated, source };
  });
// Составные названия предметов и строки эффектов создаются оригинальными правилами.
const htmlFragments = Object.keys(RUSSIAN).filter(key => /<[^>]+>/.test(key) && !/\{\d+\}/.test(key)).sort((a, b) => b.length - a.length);
const htmlPattern = new RegExp(htmlFragments.map(escape).join('|'), 'g');
const fragments = Object.keys(RUSSIAN).filter(key => key.trim() && !/\{\d+\}/.test(key) && /[A-Za-z]/.test(key))
  .sort((a, b) => b.length - a.length);
const fragmentPattern = new RegExp(`(?<![A-Za-z])(?:${fragments.map(escape).join('|')})(?![A-Za-z])`, 'g');
const cache = new Map<string, string>();
function russian(source: string, depth = 0, context: TextContext = 'ui'): string {
  if (!source || !/[A-Za-z]/.test(source) || depth > 8) return source;
  const dictionary = context === 'content' ? CONTENT_RUSSIAN : RUSSIAN;
  if (Object.hasOwn(dictionary, source)) return dictionary[source];
  const cacheKey = context + ':' + source;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;
  let translated: string | undefined;
  if (/<[^>]+>/.test(source)) {
    const html = source.replace(htmlPattern, fragment => dictionary[fragment]);
    if (html !== source) translated = html;
  }
  // Список модификаторов состоит из отдельных подписей, а не одного аргумента Lv.
  const modifiers = source.split(/([A-Za-z][A-Za-z -]*\(Lv\.\d+\))/g);
  if (modifiers.length > 3 || modifiers.length === 3 && (modifiers[0] || modifiers[2])) {
    translated = modifiers.map(part => russian(part, depth + 1, context)).join('');
  }
  for (const pattern of translated === undefined ? patterns : []) {
    const match = pattern.match.exec(source);
    if (!match) continue;
    const values = new Map(pattern.slots.map((slot, index) => [slot, russian(match[index + 1] ?? '', depth + 1, context)]));
    translated = dictionary[pattern.source].replace(/\{(\d+)\}/g, (token, index) => values.get(Number(index)) ?? token);
    break;
  }
  if (translated === undefined && /\n/.test(source)) translated = source.split('\n').map(line => russian(line, depth + 1, context)).join('\n');
  translated ??= source.replace(fragmentPattern, fragment => dictionary[fragment]);
  if (/<[^>]+>/.test(source)) translated = translated.replace(fragmentPattern, fragment => dictionary[fragment]);
  if (cache.size > 3000) cache.clear();
  cache.set(cacheKey, translated); return translated;
}
/** Локализация применяется только при показе; сохранения и формулы остаются английскими. */
export function translateText(value: string | string[], selected = language, context: TextContext = 'ui'): string | string[] {
  if (selected === 'en') return value;
  return Array.isArray(value) ? value.map(part => russian(part, 0, context)) : russian(value, 0, context);
}
export function t(value: string): string { return translateText(value) as string; }
export function localizedFont(family: string): string {
  if (language === 'en') return family;
  // MoolBoran окон Clear/Begin содержит только латинские глифы; используется рукописный шрифт меню.
  return /Menu|Banner/.test(family) ? 'ElonaRussianMenu' : /Impact|Bold|Hud/.test(family) ? 'ElonaRussianBold' : 'ElonaRussianUI';
}
