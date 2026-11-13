import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test, afterEach } from 'node:test';
import { BASE_ITEM_FIELDS, ITEM_TYPE, ItemFactory, type Item } from '../src/items.ts';
import { weaponBehavior, weaponPresentation, reloadSoundVariant, isChainGunId } from '../src/combat-stats.ts';
import { DATA_FIELDS, WEAPON_TEMPLATES, installModWeapons, parseDataJson, parseWeaponData, templateData, type WeaponTemplate } from '../src/mod-weapons.ts';
import { MISSING_MOD_ITEM_ID, MOD_WEAPON_FIRST_ID, drawRandomItemId, modWeaponByKey } from '../src/weapon-registry.ts';
import { remapModItems } from '../src/mod-save.ts';
import { Simulation } from '../src/simulation.ts';
import { translateText } from '../src/i18n.ts';
import { itemDetail } from '../src/item-details.ts';
import { itemPopupValues } from '../src/item-popup-values.ts';

afterEach(() => { installModWeapons([]); });

const parse = (key: string, data: Record<string, unknown>) => {
  const parsed = parseWeaponData(key, data);
  assert.deepEqual(parsed.errors, [], `${key} parses`);
  return parsed.weapon!;
};
const sequence = (values: number[]) => { let index = 0; return () => values[index++ % values.length]; };

const STORM = {
  name: 'Storm Crossbow', names: { ru: 'Грозовой арбалет' }, description: { en: 'Fast bolts.', ru: 'Быстрые болты.' },
  attack: 42, shootRate: 26, ammoMax: 1, reloadTimeMax: 0, baseAccuracy: 130, accuracyDec: 0.3, category: 'rifle', value: 900,
  range: 2, projectile: 'bolt', projectileSpeed: 26, pierce: 2, pose: 'bow', sound: 'gun14',
};

test('every template reproduces its vanilla weapon: item fields, behavior and presentation', () => {
  const factory = new ItemFactory(() => 0.5);
  for (const [template, id] of Object.entries(WEAPON_TEMPLATES)) {
    const weapon = parse(`copy-${id}`, { template, name: `Copy ${id}` });
    const [installed] = installModWeapons([weapon]);
    const vanilla = factory.generate(id), copy = new ItemFactory(() => 0.5).generate(installed.id);
    for (const field of ['attack', 'shootRate', 'ammoMax', 'reloadTimeMax', 'manualReload', 'automatic', 'baseAccuracy', 'accuracyDec', 'shell',
      'range', 'dmgAir', 'dmgArmor', 'reqTrait', 'reqLv', 'value', 'typeMinor', 'special', 'type'] as const) {
      assert.equal(copy[field], vanilla[field], `${template}.${field}`);
    }
    assert.deepEqual(weaponBehavior(copy), weaponBehavior(vanilla), `${template} behavior`);
    assert.deepEqual(weaponPresentation(installed.id), weaponPresentation(id), `${template} presentation`);
    assert.equal(reloadSoundVariant(installed.id, copy.manualReload), reloadSoundVariant(id, vanilla.manualReload), `${template} reload sound`);
    assert.equal(isChainGunId(installed.id), isChainGunId(id), `${template} chain gun`);
    assert.equal(copy.modWeapon, `copy-${id}`);
  }
});

test('templateData only uses documented data.json fields', () => {
  for (const template of Object.keys(WEAPON_TEMPLATES) as WeaponTemplate[]) {
    for (const field of Object.keys(templateData(template))) assert.ok(Object.hasOwn(DATA_FIELDS, field), `${template}: ${field}`);
  }
});

test('a weapon without a template must list its core stats, and every other field has a default', () => {
  const weapon = parse('storm-crossbow', STORM);
  assert.equal(weapon.fields.special, 3);
  assert.equal(weapon.fields.reqTrait, BASE_ITEM_FIELDS[23].reqTrait);
  assert.deepEqual(weapon.behavior, { projectile: 'bolt', speedBase: 26, extraPenetrations: 2, projectileCount: 1, bowDraw: false, chainSpinUp: false, immediateReload: false });
  assert.equal(weapon.presentation.sound, 'gun14');
  const { attack: _attack, category: _category, ...missing } = STORM;
  const errors = parseWeaponData('broken', missing).errors.join('\n');
  assert.match(errors, /“attack”/); assert.match(errors, /“category”/);
});

test('data.json mistakes are reported with the field name', () => {
  const errors = (data: Record<string, unknown>, key = 'test') => parseWeaponData(key, data).errors.join('\n');
  assert.match(errors({ ...STORM, atack: 5 }), /Unknown field “atack”/);
  assert.match(errors({ ...STORM, attack: '5' }), /Field “attack” must be a number/);
  assert.match(errors({ ...STORM, ammoMax: 0 }), /Field “ammoMax” must be between 1 and 9999, not 0/);
  assert.match(errors({ ...STORM, ammoMax: 2.5 }), /Field “ammoMax” must be a whole number/);
  assert.match(errors({ ...STORM, category: 'laser' }), /Field “category” must be one of/);
  assert.match(errors({ ...STORM, bowDraw: true }), /“bowDraw” needs projectile arrow/);
  assert.match(errors({ ...STORM, projectile: 'none', spinUp: true, pierce: 0, volley: 3 }), /A volley of 3 needs a projectile/);
  assert.match(errors({ ...STORM, projectile: 'rocket' }), /“pierce” only works with projectile arrow or bolt/);
  assert.match(errors({ ...STORM, reloadAfterShot: true }), /“reloadAfterShot” needs reloadTimeMax above 0/);
  assert.match(errors({ template: 'pistol' }), /Missing field “name”/);
  assert.match(errors({ template: 'laserRifle', name: 'X' }), /Template “laserRifle” does not exist/);
  assert.match(errors({ ...STORM, name: 'Gun {0}' }), /placeholders/);
  assert.match(errors(STORM, 'Bad Name'), /Registry name “Bad Name” is invalid/);
  assert.match(parseWeaponData('x', [1, 2]).errors.join(), /must contain a JSON object/);
});

test('every data.json error message is translated into Russian', () => {
  const cases: [string, unknown][] = [
    ['test', { ...STORM, atack: 5, attack: '5', ammoMax: 2.5, category: 'laser', bowDraw: true, reloadAfterShot: true, format: 2, volley: 2,
      names: { de: 'x', zh: '' }, description: { fr: 'x', en: 'y'.repeat(700) }, shell: 99 }],
    ['test', { ...STORM, projectile: 'none', spinUp: false, pierce: 0, volley: 3, name: 'Gun {0}', names: 5, description: 5 }],
    ['test', { ...STORM, projectile: 'rocket', spinUp: true, description: 'Desc {1}' }],
    ['Bad Name', { template: 'laserRifle' }],
    ['test', { template: 'pistol', automatic: 'yes', name: 'x'.repeat(90) }],
    ['test', {}],
    ['test', [1, 2]],
  ];
  const messages = [...new Set(cases.flatMap(([key, data]) => parseWeaponData(key, data).errors))];
  messages.push('Folder name “Bad Name” cannot be a registry name: use lowercase letters, digits, _ and -.', 'data.json is missing.',
    'data.json is not valid JSON: A comment starting with /* is not closed with */', 'Name “Pistol” is already used by an original weapon; choose another English name.',
    'Name “Gun” is already used by MOD “other”.', 'slot.png must be 192×128 pixels, not 100×100.', 'slot.png is fully transparent.',
    'slot.png could not be read: the file is missing or is not a valid PNG.');
  assert.ok(messages.length >= 30, `${messages.length} distinct messages`);
  for (const message of messages) {
    for (const language of ['ru'] as const) {
      const translated = translateText(message, language) as string;
      assert.notEqual(translated, message, `${language}: ${message}`);
      // Английские служебные слова не должны остаться в переводе (имена полей и значения — могут).
      assert.doesNotMatch(translated, /\b(must|needs|Field|Unknown|Missing|Template|already|pixels|transparent|could not)\b/, `${language}: ${translated}`);
    }
  }
});

test('without random-drop MODs the item pool draws exactly like the original', () => {
  for (const value of [0, 0.01, 0.4999, 0.975, 0.999999]) {
    let calls = 0;
    assert.equal(drawRandomItemId(() => { calls++; return value; }), 1 + Math.trunc(value * 40));
    assert.equal(calls, 1);
  }
  installModWeapons([{ ...parse('hidden', STORM), randomDrop: false }]);
  assert.equal(drawRandomItemId(() => 0.999), 40);
});

test('random-drop MODs extend the pool by their weight', () => {
  const [heavy, light] = installModWeapons([
    { ...parse('a-heavy', { ...STORM, name: 'Heavy' }), weight: 3 },
    { ...parse('b-light', { ...STORM, name: 'Light' }), weight: 1 },
  ]);
  assert.equal(heavy.id, MOD_WEAPON_FIRST_ID); assert.equal(light.id, MOD_WEAPON_FIRST_ID + 1);
  // Диапазон 40 + 4: первые 40 — исходные номера, следующие 3 доли — heavy, последняя — light.
  assert.equal(drawRandomItemId(() => 39.5 / 44), 40);
  assert.equal(drawRandomItemId(() => 40.5 / 44), heavy.id);
  assert.equal(drawRandomItemId(() => 42.9 / 44), heavy.id);
  assert.equal(drawRandomItemId(() => 43.5 / 44), light.id);
  const counts = new Map<number, number>();
  for (let i = 0; i < 4400; i++) { const id = drawRandomItemId(() => (i + 0.5) / 4400); counts.set(id, (counts.get(id) ?? 0) + 1); }
  assert.equal(counts.get(1), 100); assert.equal(counts.get(heavy.id), 300); assert.equal(counts.get(light.id), 100);
});

test('shops and loot can roll a MOD weapon, judged by its price like vanilla weapons', () => {
  const [storm] = installModWeapons([{ ...parse('storm-crossbow', STORM), weight: 1000 }]);
  const factory = new ItemFactory(sequence([0.9999, 0.1, 0.2, 0.05, 0.3, 0.6, 0.7]), { day: 10 });
  let found: Item | undefined;
  for (let i = 0; i < 20 && !found; i++) { const item = factory.randomItem(2000, 4); if (item.id === storm.id) found = item; }
  assert.ok(found, 'a MOD weapon was rolled');
  assert.equal(found!.modWeapon, 'storm-crossbow');
  assert.equal(found!.type, ITEM_TYPE.gun);
});

test('MOD names and descriptions are translated at runtime, including upgraded Mk names', () => {
  installModWeapons([parse('storm-crossbow', STORM)]);
  assert.equal(translateText('Storm Crossbow', 'ru'), 'Грозовой арбалет');
  assert.equal(translateText('Storm Crossbow Mk-3', 'ru'), 'Грозовой арбалет Mk-3');
  assert.equal(translateText('Fast bolts.', 'ru', 'content'), 'Быстрые болты.');
  const item = new ItemFactory(() => 0.5).generate(modWeaponByKey('storm-crossbow')!.id);
  assert.equal(itemDetail(item), 'Fast bolts.');
  assert.equal(itemPopupValues(item).detailText, 'Fast bolts.\nNo Modification');
  assert.equal(translateText(itemPopupValues(item).detailText, 'ru'), `Быстрые болты.\n${translateText('No Modification', 'ru')}`);
});

test('a MOD crossbow fires its own bolts through the simulation', () => {
  const [storm] = installModWeapons([parse('storm-crossbow', STORM)]);
  const sim = new Simulation(7, { heroClass: 'rogue', ruleset: 'classic' });
  const weapon = new ItemFactory(() => 0.5).generate(storm.id);
  sim.state.inventory[0] = weapon; sim.state.player.selectedSlot = 0; sim.state.player.traits[weapon.reqTrait!] = 20;
  sim.state.enemies = [];
  sim.tick({ aimX: 300, aimY: 240, firePressed: true, fireReleased: false, fireHeld: false });
  const bolts = sim.state.projectiles.filter(p => p.kind === 'bolt' && p.weaponSlot === 0);
  assert.equal(bolts.length, 1);
});

/** Сохранение с оружием мода в инвентаре; при загрузке оно находится по регистрационному имени. */
function saveWith(weaponKey: string) {
  const sim = new Simulation(11, { heroClass: 'rogue', ruleset: 'classic' });
  const item = new ItemFactory(() => 0.5).generate(modWeaponByKey(weaponKey)!.id);
  item.attack = 77; item.lv = 2; item.name = 'Storm Crossbow Mk-2';
  sim.state.inventory[3] = item;
  return { save: sim.toSave(), item };
}

test('saves keep MOD weapons by registry name even when other MODs change the numbering', () => {
  installModWeapons([parse('storm-crossbow', STORM)]);
  const { save, item } = saveWith('storm-crossbow');
  const frozen = JSON.stringify(save);
  installModWeapons([parse('aaa-first', { ...STORM, name: 'First' }), parse('storm-crossbow', STORM)]);
  const loaded = Simulation.fromSave(save).state.inventory[3];
  assert.equal(JSON.stringify(save), frozen, 'fromSave does not change its input');
  assert.equal(loaded.modWeapon, 'storm-crossbow');
  assert.equal(loaded.id, modWeaponByKey('storm-crossbow')!.id);
  assert.notEqual(loaded.id, item.id);
  assert.equal(loaded.graphic, loaded.id + 10);
  assert.equal(loaded.attack, 77);
});

test('a missing MOD turns its weapons into a placeholder that restores the original when the MOD returns', () => {
  installModWeapons([parse('storm-crossbow', STORM)]);
  const { save, item } = saveWith('storm-crossbow');
  installModWeapons([]);
  const missing = Simulation.fromSave(save);
  const placeholder = missing.state.inventory[3];
  assert.equal(placeholder.id, MISSING_MOD_ITEM_ID);
  assert.equal(placeholder.type, ITEM_TYPE.sell);
  assert.equal(placeholder.name, 'Unknown MOD Weapon');
  assert.equal(placeholder.modItem?.modWeapon, 'storm-crossbow');
  assert.match(itemDetail(placeholder), /\(storm-crossbow\)/);
  assert.equal(translateText(itemDetail(placeholder), 'ru', 'content'), 'Это оружие из мода, который не установлен или отключён (storm-crossbow). Включите мод снова, чтобы вернуть его.');
  // Заглушку можно сохранить и загрузить.
  const stillMissing = missing.toSave();
  assert.equal(Simulation.fromSave(stillMissing).state.inventory[3].id, MISSING_MOD_ITEM_ID);
  installModWeapons([parse('storm-crossbow', STORM)]);
  const restored = Simulation.fromSave(stillMissing).state.inventory[3];
  assert.equal(restored.modWeapon, 'storm-crossbow');
  assert.equal(restored.id, modWeaponByKey('storm-crossbow')!.id);
  assert.equal(restored.attack, 77); assert.equal(restored.lv, 2); assert.equal(restored.name, item.name);
  assert.equal(restored.modItem, undefined);
});

test('saves without MOD items are passed through untouched', () => {
  const save = new Simulation(3).toSave();
  assert.equal(remapModItems(save), save);
});

test('the example MODs shipped in public/mods/examples are valid', () => {
  const folder = new URL('../public/mods/examples/weapons/', import.meta.url);
  const keys = readdirSync(folder, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name);
  assert.ok(keys.length >= 2);
  for (const key of keys) {
    parse(key, parseDataJson(readFileSync(new URL(`${key}/data.json`, folder), 'utf8')) as Record<string, unknown>);
    const png = readFileSync(new URL(`${key}/slot.png`, folder));
    assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [192, 128], `${key}/slot.png is 192×128`);
  }
});

test('data.json may contain comments and trailing commas; strings are left alone', () => {
  const text = ['﻿// header comment', '{', '  /* block', 'comment */ "name": "A // not a comment", // end of line',
    '  "names": { "ru": "/* not a comment either */", },', '  "list": [1, 2,],', '}', ''].join('\n');
  assert.deepEqual(parseDataJson(text), { name: 'A // not a comment', names: { ru: '/* not a comment either */' }, list: [1, 2] });
  assert.deepEqual(parseDataJson('{"a": "x\\"//"}'), { a: 'x"//' });
  assert.throws(() => parseDataJson('{ /* unclosed '), /not closed/);
  // Комментарии заменяются пробелами, следующая ошибка JSON сообщается как обычно.
  assert.throws(() => parseDataJson(['// 1', '// 2', '{ "a": }'].join('\n')), SyntaxError);
});

test('a MOD bow is drawn while held, fires on release, and can be saved mid-draw', () => {
  const [bow] = installModWeapons([parse('storm-bow', { template: 'windBow', name: 'Storm Bow', attack: 99 })]);
  const sim = new Simulation(7, { heroClass: 'rogue', ruleset: 'classic' });
  const weapon = new ItemFactory(() => 0.5).generate(bow.id);
  sim.state.inventory[0] = weapon; sim.state.player.selectedSlot = 0; sim.state.player.traits[weapon.reqTrait!] = 20;
  const input = { aimX: 300, aimY: 240, firePressed: false, fireReleased: false, fireHeld: false };
  sim.state.enemies = [];
  sim.tick({ ...input, firePressed: true, fireHeld: true });
  assert.equal(sim.state.player.bowDrawing, true);
  assert.equal(sim.state.projectiles.filter(p => p.kind === 'arrow').length, 0, 'nothing is fired while drawing');
  const restored = Simulation.fromSave(sim.toSave());
  assert.equal(restored.state.player.bowDrawing, true);
  restored.state.enemies = [];
  restored.tick({ ...input, fireReleased: true });
  assert.equal(restored.state.player.bowDrawing, false);
  assert.equal(restored.state.projectiles.filter(p => p.kind === 'arrow' && p.weaponSlot === 0).length, 3, 'wind bow volley of three');
});
