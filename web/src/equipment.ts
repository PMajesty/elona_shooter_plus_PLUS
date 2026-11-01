import { ITEM_TYPE, MODS, ItemFactory, isOccupiedItem, type Item } from './items.ts';

export type TownEquipmentAction = { kind: 'upgrade'; slot: number; cost: number }
  | { kind: 'mod'; modSlot: number; gunSlot: number };
export type TownEquipmentOutcome = 'previewed' | 'upgraded' | 'mounted' | 'swapped' | 'cancelled'
  | 'not-enough-ap' | 'not-enough-gold' | 'no-mod-slot' | 'incompatible-ammo-mod'
  | 'incompatible-auto-reload' | 'already-living' | 'unavailable';

export function upgradeCost(item: Readonly<Item>): number { return Math.trunc(item.value * 1.2) + 500; }

/** Исходный Upgrade создаёт предмет до подтверждения; слот сравнения живёт и после отмены. */
export function createUpgradePreview(factory: ItemFactory, source: Readonly<Item>, reference?: Readonly<Item>): Item {
  const preview = factory.generate(source.id, reference);
  factory.varyWeapon(preview, source.lv + 1);
  preview.modMax = source.modMax;
  // Исправление исходного пропуска последней записи: сохраняем каждый установленный MOD.
  for (const segment of source.modText.split(') ')) {
    const [name, levelText] = segment.split('(Lv.');
    if (levelText === undefined) continue;
    for (let id = 0; id < MODS.length; id++) if (name.includes(MODS[id].name)) {
      factory.enchant(preview, id, Number(levelText) | 0);
      if (id === 11) preview.livingWeapon = source.livingWeapon;
    }
  }
  return preview;
}

/** Ограничения диалога проверяются при Yes, а не при выборе пары предметов. */
export function modMountFailure(mod: Item | null | undefined, gun: Item | null | undefined): TownEquipmentOutcome | null {
  if (!isOccupiedItem(mod) || mod.type !== ITEM_TYPE.mod || !isOccupiedItem(gun) || gun.type !== ITEM_TYPE.gun) return 'unavailable';
  if (!Number.isInteger(mod.mod) || mod.mod < 0 || mod.mod >= MODS.length || !Number.isInteger(mod.modMax) || mod.modMax < 1 || mod.modMax > 3) return 'unavailable';
  if (gun.mod >= gun.modMax) return 'no-mod-slot';
  if ((gun.ammoMax === 1 || gun.reloadTimeMax === 0) && (mod.mod === 2 || mod.mod === 7)) return 'incompatible-ammo-mod';
  if (mod.mod === 10 && !gun.manualReload) return 'incompatible-auto-reload';
  if (mod.mod === 11 && gun.livingWeapon > 0) return 'already-living';
  return null;
}
