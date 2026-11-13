import { ITEM_TYPE, itemPrice, type Item } from './items.ts';
import { itemDetail } from './item-details.ts';
import { modWeaponById } from './weapon-registry.ts';
import { ALL_TRAITS } from './party-progression.ts';

export type ItemPopupValues = Record<'itemName' | 'priceText' | 'reqText' | 'modTxt' | 'detailText' | 'dmgText' |
  'rateText' | 'ammoText' | 'reloadText' | 'dmgAirText' | 'dmgArmorText' | 'accuracyText', string>;
export interface ItemPopupInfo { id: number; values: ItemPopupValues; requiresSkill: boolean }

/** invPopupUpdate: цена в исходном окне — полная стоимость, а не сумма продажи. */
export function itemPopupValues(item: Readonly<Item>): ItemPopupValues {
  const values: ItemPopupValues = { itemName: item.name, priceText: String(itemPrice(item, true)), reqText: '-', modTxt: '-',
    detailText: itemDetail(item), dmgText: '-', rateText: '-', ammoText: '-', reloadText: '-', dmgAirText: '-', dmgArmorText: '-', accuracyText: '-' };
  if (item.type !== ITEM_TYPE.gun) return values;
  const unlimited = item.ammoMax === 1 && item.id !== 27;
  let details = item.modText || 'No Modification';
  if (item.livingWeapon > 0) details += `\nIt's alive(Exp: ${Math.trunc((1 - item.livingWeapon / Math.trunc(25 * 2 ** item.modMax)) * 100)}%)`;
  // Оружие мода: описание из data.json над списком модификаций (у исходного оружия описания нет).
  const description = modWeaponById(item.id) ? itemDetail(item) : '';
  if (description) details = `${description}\n${details}`;
  return { ...values, modTxt: `${item.mod}/${item.modMax}`, detailText: details,
    dmgText: `${item.attack}${item.shell > 1 ? ` x${item.shell}` : ''}`, dmgAirText: `${item.dmgAir}%`, dmgArmorText: `${item.dmgArmor}%`,
    accuracyText: String(item.baseAccuracy), ammoText: unlimited ? '-' : String(item.ammoMax),
    reloadText: unlimited ? '-' : `${Math.trunc(item.reloadTimeMax * 1000 / 30)}ms${item.manualReload ? '(M)' : ''}`,
    rateText: `${Math.trunc(300 / (1000 / item.shootRate)) / 10}/sec`,
    reqText: `${ALL_TRAITS[item.reqTrait!]?.name ?? 'Weapon skill'} ${item.reqLv}` };
}
