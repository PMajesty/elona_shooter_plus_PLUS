import test from 'node:test';
import assert from 'node:assert/strict';
import { ItemFactory, ITEM_TYPE, itemPrice } from '../src/items.ts';
import { itemPopupValues } from '../src/item-popup-values.ts';

test('original item panel keeps shell damage, manual reload, full value and skill requirement distinct from sale proceeds', () => {
  const item = new ItemFactory(() => 0.1).generate(3); item.value = 501;
  const before = structuredClone(item), info = itemPopupValues(item);
  assert.equal(info.dmgText, '16 x6'); assert.equal(info.reloadText, '200ms(M)');
  assert.equal(info.rateText, '1.2/sec'); assert.equal(info.reqText, 'Shotgun 1');
  assert.equal(info.priceText, '501'); assert.equal(itemPrice(item), 100);
  assert.deepEqual(item, before);
});

test('single-shot bows retain original dash fields while Gravity Gun shows ammo and reload; living progress is readable', () => {
  const factory = new ItemFactory(() => 0.1), bow = itemPopupValues(factory.generate(23));
  assert.equal(bow.ammoText, '-'); assert.equal(bow.reloadText, '-');
  const gravity = factory.generate(27); Object.assign(gravity, { livingWeapon: 25, modMax: 2, modText: '+10% Damage' });
  const info = itemPopupValues(gravity);
  assert.equal(info.ammoText, '1'); assert.equal(info.reloadText, '6000ms');
  assert.equal(info.reqText, 'Big Gun 11'); assert.equal(info.detailText, "+10% Damage\nIt's alive(Exp: 75%)");
});

test('consumables and MODs clear weapon fields and retain their original English effect descriptions', () => {
  const item = new ItemFactory(() => 0.1).generate(11); item.attack = 123;
  const grenade = itemPopupValues(item);
  for (const key of ['ammoText', 'dmgText', 'reqText', 'reloadText', 'rateText', 'modTxt'] as const) assert.equal(grenade[key], '-');
  assert.match(grenade.detailText, /exlodes and deals 123 damage/);
  Object.assign(item, { type: ITEM_TYPE.mod, mod: 8 });
  assert.match(itemPopupValues(item).detailText, /ability to knock back enemies/);
});
