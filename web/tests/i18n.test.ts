import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { translateText as translate, setLanguage, getLanguage, readLanguage, onLanguageChanged } from '../src/i18n.ts';
import { ruContent } from '../src/locales/ru-content.ts';
import { ruUI } from '../src/locales/ru-ui.ts';
import { Simulation } from '../src/simulation.ts';
import { ItemFactory } from '../src/items.ts';
import { itemPopupValues } from '../src/item-popup-values.ts';
import { dayReport } from '../src/day-report.ts';
import { ALL_TRAITS } from '../src/party-progression.ts';
import { traitHintValues } from '../src/trait-hint.ts';

test('Russian catalogs preserve placeholders; English stays canonical', () => {
  for (const dictionary of [ruContent, ruUI]) for (const [source, value] of Object.entries(dictionary)) {
    assert.deepEqual(value.match(/\{\d+\}/g)?.sort() ?? [], source.match(/\{\d+\}/g)?.sort() ?? [], source);
    assert.equal(translate(source, 'en'), source);
    assert.ok(value.length, source);
  }
  assert.equal(translate('Smith', 'ru'), 'Кузнец');
  assert.equal(translate('Smith', 'ru', 'content'), 'Смит');
  assert.equal(translate('Prayer', 'ru'), 'Молитва');
  assert.equal(translate('Prayer', 'ru', 'content'), 'Богомолец');
  assert.equal(translate('unknown development string', 'en'), 'unknown development string');
});

test('actual generated modifier lists and living-weapon suffix translate independently', () => {
  const factory = new ItemFactory(() => 0.2), item = factory.generate(1); item.modMax = 3;
  factory.enchant(item, 4, 2); factory.enchant(item, 1, 1); factory.enchant(item, 11, 1);
  const source = itemPopupValues(item).detailText;
  const result = translate(source, 'ru') as string;
  assert.ok(result.includes('Урон(ур. 2)') && result.includes('Точность(ур. 1)'), result);
  assert.doesNotMatch(result, /Lv\.|It's alive/);
  assert.equal(translate(source, 'en'), source);
  assert.equal(translate('Damage Mod Lv.2', 'ru'), 'Модификатор «Урон» ур. 2');
});

test('numeric units never capture prose, and joined help translates whole paragraphs', () => {
  assert.equal(translate('items', 'ru'), 'items');
  assert.equal(translate('200ms', 'ru'), '200 мс');
  assert.equal(translate('200ms(M)', 'ru'), '200 мс(Р)');
  assert.equal(translate('2.5/sec', 'ru'), '2.5/с');
  const layout = JSON.parse(readFileSync(new URL('../public/assets/town-layout.json', import.meta.url), 'utf8'));
  const editions = Object.keys(ruUI).filter(key => key.startsWith('<b>Browser editions') || key.startsWith('Classic keeps') || key.startsWith('Expanded: companions')).join('');
  const help = translate(editions + layout.help.tips.join(''), 'ru') as string;
  assert.doesNotMatch(help.replace(/<[^>]+>/g, ''), /[A-Za-z][A-Za-z ]{4,}/);
});

test('day news keeps skill names and perfect-game sentences separate', () => {
  const sim = new Simulation(42, { heroClass: 'rogue' });
  sim['finishDay']();
  sim.state.battleNews = ['You have earned total of 100 weapon exp and gain Small Gun 2.',
    'Little Girl has earned total of 100 weapon exp and gains Anti Armor.',
    'Little Girl gains Anti Armor 2.'];
  const news = dayReport(sim.state).news, russian = translate(news, 'ru') as string;
  assert.ok(russian.includes('Безупречная победа!'), russian);
  assert.ok(russian.includes('получает Бронебойность'), russian);
  assert.doesNotMatch(russian, /[A-Za-z]{3}/);
  assert.equal(translate(news, 'en'), news);
  // Проверяем названия внутри уведомления, а не только отдельные ключи словаря.
  for (const trait of Object.values(ALL_TRAITS)) {
    const name = traitHintValues(trait.id, { [trait.id]: 2 }).name;
    assert.equal(translate(`Little Girl gains ${name}.`, 'ru'), `Девочка получает ${translate(name, 'ru')}.`);
    for (const [person, gain] of [['You', 'you gain'], ['Little Girl', 'Little Girl gains']]) {
      const training = translate(`The special trainer picks ${person}. After hours of training, ${gain} ${name}! ${person} reached maximum training limit.`, 'ru') as string;
      assert.ok(training.includes(`${translate(name, 'ru')}!`), training);
      assert.doesNotMatch(training, /[A-Za-z]{3}/, training);
    }
  }
  assert.equal(translate('2 AP\nSmart Mode', 'ru'), '2 AP\nУмный режим');
});

test('preference survives reload and unavailable storage; stale callbacks are skipped', () => {
  const old = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const values = new Map<string, string>([['unrelated-save', 'keep']]);
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (k: string) => values.get(k) ?? null, setItem: (k: string, v: string) => values.set(k, v) } });
  setLanguage('en'); let staleCalled = false;
  const removeParent = onLanguageChanged(() => removeChild());
  const removeChild = onLanguageChanged(() => { staleCalled = true; });
  setLanguage('ru'); assert.equal(readLanguage(), 'ru'); assert.equal(staleCalled, false);
  removeParent(); removeChild(); assert.equal(values.get('unrelated-save'), 'keep');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get: () => { throw Error('storage denied'); } });
  setLanguage('en'); assert.equal(getLanguage(), 'en'); assert.equal(readLanguage(), 'en');
  if (old) Object.defineProperty(globalThis, 'localStorage', old); else Reflect.deleteProperty(globalThis, 'localStorage');
});

test('switching language during a seeded battle does not affect saves or replay', () => {
  const english = new Simulation(42, { heroClass: 'rogue', ruleset: 'expanded' });
  const russian = Simulation.fromSave(english.toSave());
  for (let frame = 0; frame < 180; frame++) {
    setLanguage('en'); english.tick();
    setLanguage('ru'); russian.tick();
  }
  assert.deepEqual(russian.toSave(), english.toSave());
  assert.deepEqual(Simulation.fromSave(russian.toSave()).toSave(), english.toSave()); setLanguage('en');
});

test('localized artwork uses complete original image and atlas footprints', () => {
  const root = new URL('../public/assets/', import.meta.url);
  const source = JSON.parse(readFileSync(new URL('manifest.json', root), 'utf8'));
  const russian = JSON.parse(readFileSync(new URL('ru/manifest.json', root), 'utf8'));
  assert.ok(Object.keys(russian.images).length > 100);
  for (const [key, path] of Object.entries(russian.images) as [string,string][]) {
    assert.equal(path, source.images[key].file); assert.ok(existsSync(new URL('ru/' + path, root)), key);
    if (path.endsWith('.png')) assert.deepEqual(readFileSync(new URL('ru/' + path, root)).subarray(16,24), readFileSync(new URL(path, root)).subarray(16,24), key);
  }
  for (const [key, path] of Object.entries(russian.clips) as [string,string][]) {
    assert.equal(path, source.clips[key].image);
    assert.deepEqual(readFileSync(new URL('ru/' + path, root)).subarray(16,24), readFileSync(new URL(path, root)).subarray(16,24), key);
  }
  assert.equal(russian.hitMasks.button_proceed, source.images.button_proceed.hitMask, 'Russian button keeps the source hit registration');
  for (const [key, value] of Object.entries(russian.hitMasks) as [string,string][]) {
    const a = source.images[key]; assert.equal(Buffer.from(value, 'base64').length, Math.ceil(a.width / 8) * a.height, key);
  }
});
