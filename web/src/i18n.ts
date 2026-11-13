import { ruContent } from './locales/ru-content.ts';
import { ruUI } from './locales/ru-ui.ts';
import { zhContent } from './locales/zh-content.ts';
import { zhUI } from './locales/zh-ui.ts';

export type Language = 'en' | 'ru' | 'zh';
/** Языки с каталогами переводов; английский — канонический текст без каталога. */
export type TranslatedLanguage = Exclude<Language, 'en'>;
/** Порядок переключения кнопкой языка. */
export const LANGUAGES: readonly Language[] = ['en', 'ru', 'zh'];
const LANGUAGE_KEY = 'elona-shooter-plus-plus.port.language.v1';
interface Catalog { ui: Readonly<Record<string, string>>; content: Readonly<Record<string, string>> }
const CATALOGS: Readonly<Record<TranslatedLanguage, Catalog>> = {
  ru: { ui: { ...ruContent, ...ruUI }, content: { ...ruUI, ...ruContent } },
  zh: { ui: { ...zhContent, ...zhUI }, content: { ...zhUI, ...zhContent } },
};
export const RUSSIAN: Readonly<Record<string, string>> = CATALOGS.ru.ui;
export const CHINESE: Readonly<Record<string, string>> = CATALOGS.zh.ui;
export type TextContext = 'ui' | 'content';
export const isLanguage = (value: unknown): value is Language => typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value);
/** В китайском нет пробелов между словами: перенос и подгонка размера идут по символам. */
export const isCjkLanguage = (value: Language): boolean => value === 'zh';
/** Следующий язык для кнопки; available пропускает языки, чья графика не загрузилась. */
export function nextLanguage(current: Language, available: readonly Language[] = LANGUAGES): Language {
  const cycle = LANGUAGES.filter(language => available.includes(language));
  return cycle[(cycle.indexOf(current) + 1) % cycle.length] ?? 'en';
}
/** При первом запуске (без сохранённого выбора) берётся язык браузера; в тестах Node без document — английский. */
function browserLanguage(): Language {
  if (typeof document === 'undefined' || typeof navigator === 'undefined') return 'en';
  for (const tag of navigator.languages ?? [navigator.language]) {
    const code = String(tag).toLowerCase();
    if (code.startsWith('zh')) return 'zh';
    if (code.startsWith('ru')) return 'ru';
    if (code.startsWith('en')) return 'en';
  }
  return 'en';
}
export function readLanguage(): Language {
  let stored: string | null;
  try { stored = localStorage.getItem(LANGUAGE_KEY); } catch { return 'en'; }
  return isLanguage(stored) ? stored : browserLanguage();
}
let language = readLanguage();
const listeners = new Set<() => void>();
export const getLanguage = (): Language => language;
export function setLanguage(next: Language): void {
  if (!isLanguage(next) || next === language) return;
  language = next;
  try { localStorage.setItem(LANGUAGE_KEY, next); } catch { /* Настройка работает до закрытия вкладки. */ }
  for (const update of [...listeners]) if (listeners.has(update)) update();
}
export function onLanguageChanged(update: () => void): () => void {
  listeners.add(update); return () => listeners.delete(update);
}

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
interface Pattern { match: RegExp; slots: number[]; source: string }
interface Engine {
  ui: Readonly<Record<string, string>>; content: Readonly<Record<string, string>>;
  patterns: Pattern[]; htmlPattern: RegExp; fragmentPattern: RegExp; cache: Map<string, string>;
}
const NEVER = /(?!)/g;
const engines = new Map<TranslatedLanguage, Engine>();
/** Правила сопоставления каждого языка компилируются один раз, при первом использовании. */
function engineFor(selected: TranslatedLanguage): Engine {
  const existing = engines.get(selected);
  if (existing) return existing;
  const { ui, content } = CATALOGS[selected];
  const patterns = Object.keys(ui).filter(key => /\{\d+\}/.test(key))
    .sort((a, b) => b.replace(/\{\d+\}/g, '').length - a.replace(/\{\d+\}/g, '').length)
    .map(source => {
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
      return { match: new RegExp(`^${pattern}$`), slots, source };
    });
  // Составные названия предметов и строки эффектов создаются оригинальными правилами.
  const htmlFragments = Object.keys(ui).filter(key => /<[^>]+>/.test(key) && !/\{\d+\}/.test(key)).sort((a, b) => b.length - a.length);
  const fragments = Object.keys(ui).filter(key => key.trim() && !/\{\d+\}/.test(key) && /[A-Za-z]/.test(key))
    .sort((a, b) => b.length - a.length);
  const engine: Engine = {
    ui, content, patterns,
    htmlPattern: htmlFragments.length ? new RegExp(htmlFragments.map(escape).join('|'), 'g') : NEVER,
    fragmentPattern: fragments.length ? new RegExp(`(?<![A-Za-z])(?:${fragments.map(escape).join('|')})(?![A-Za-z])`, 'g') : NEVER,
    cache: new Map(),
  };
  engines.set(selected, engine); return engine;
}
function localize(engine: Engine, source: string, depth = 0, context: TextContext = 'ui'): string {
  if (!source || !/[A-Za-z]/.test(source) || depth > 8) return source;
  const dictionary = context === 'content' ? engine.content : engine.ui;
  if (Object.hasOwn(dictionary, source)) return dictionary[source];
  const cacheKey = context + ':' + source;
  if (engine.cache.has(cacheKey)) return engine.cache.get(cacheKey)!;
  let translated: string | undefined;
  if (/<[^>]+>/.test(source)) {
    const html = source.replace(engine.htmlPattern, fragment => dictionary[fragment]);
    if (html !== source) translated = html;
  }
  // Список модификаторов состоит из отдельных подписей, а не одного аргумента Lv.
  const modifiers = source.split(/([A-Za-z][A-Za-z -]*\(Lv\.\d+\))/g);
  if (modifiers.length > 3 || modifiers.length === 3 && (modifiers[0] || modifiers[2])) {
    translated = modifiers.map(part => localize(engine, part, depth + 1, context)).join('');
  }
  for (const pattern of translated === undefined ? engine.patterns : []) {
    const match = pattern.match.exec(source);
    if (!match) continue;
    const values = new Map(pattern.slots.map((slot, index) => [slot, localize(engine, match[index + 1] ?? '', depth + 1, context)]));
    translated = dictionary[pattern.source].replace(/\{(\d+)\}/g, (token, index) => values.get(Number(index)) ?? token);
    break;
  }
  if (translated === undefined && /\n/.test(source)) translated = source.split('\n').map(line => localize(engine, line, depth + 1, context)).join('\n');
  translated ??= source.replace(engine.fragmentPattern, fragment => dictionary[fragment]);
  if (/<[^>]+>/.test(source)) translated = translated.replace(engine.fragmentPattern, fragment => dictionary[fragment]);
  if (engine.cache.size > 3000) engine.cache.clear();
  engine.cache.set(cacheKey, translated); return translated;
}
/** Локализация применяется только при показе; сохранения и формулы остаются английскими. */
export function translateText(value: string | string[], selected = language, context: TextContext = 'ui'): string | string[] {
  if (selected === 'en') return value;
  const engine = engineFor(selected);
  return Array.isArray(value) ? value.map(part => localize(engine, part, 0, context)) : localize(engine, value, 0, context);
}
export function t(value: string): string { return translateText(value) as string; }
/** Семейства шрифтов, заменяющие исходные; у китайского есть системные запасные шрифты для символов вне подмножества. */
const LOCALIZED_FONTS: Readonly<Record<TranslatedLanguage, { menu: string; bold: string; ui: string }>> = {
  ru: { menu: 'ElonaRussianMenu', bold: 'ElonaRussianBold', ui: 'ElonaRussianUI' },
  zh: {
    menu: 'ElonaChineseMenu, "Microsoft YaHei", "PingFang SC", sans-serif',
    bold: 'ElonaChineseBold, "Microsoft YaHei", "PingFang SC", sans-serif',
    ui: 'ElonaChineseUI, "Microsoft YaHei", "PingFang SC", sans-serif',
  },
};
export function localizedFont(family: string): string {
  if (language === 'en') return family;
  const fonts = LOCALIZED_FONTS[language];
  // MoolBoran окон Clear/Begin содержит только латинские глифы; используется рукописный шрифт меню языка.
  return /Menu|Banner/.test(family) ? fonts.menu : /Impact|Bold|Hud/.test(family) ? fonts.bold : fonts.ui;
}
