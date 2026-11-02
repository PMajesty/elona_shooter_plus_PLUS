import Phaser from 'phaser';
import { ITEM_TYPE, type Item } from './items.ts';
import { itemPopupValues, type ItemPopupInfo, type ItemPopupValues } from './item-popup-values.ts';
import type { LootViewManifest } from './loot-view.ts';

interface Placement {
  x: number; y: number; scaleX: number; scaleY: number; rotationDegrees: number;
  text?: { fontId: number; fontSize: number; bounds: number[]; align: number; color: string };
}
export interface ItemPopupLayout { clip: string; children: Record<string, Placement> }

/** Один исходный itemPop1791 для магазина, добычи, снаряжения и сравнения улучшений. */
export function createItemPopupView(scene: Phaser.Scene, manifest: LootViewManifest, layout: ItemPopupLayout,
  traits: Readonly<Record<number, number>>, changed?: (info: ItemPopupInfo | null) => void, name = 'original-item-popup') {
  const root = scene.add.container(0, 0).setVisible(false).setName(name);
  const asset = manifest.clips[layout.clip];
  const background = scene.add.nineslice(-asset.originX, -asset.originY, layout.clip, '1', asset.frameWidth, asset.frameHeight, 28, 28, 94, 12).setOrigin(0);
  root.add(background);
  const fields = {} as Record<keyof ItemPopupValues, Phaser.GameObjects.Text>;
  for (const [key, p] of Object.entries(layout.children)) {
    if (!p.text) continue;
    const spec = p.text, width = spec.bounds[2] - spec.bounds[0];
    const object = scene.add.text(p.x, p.y, '', { fontFamily: 'ElonaMenu', fontSize: `${spec.fontSize}px`, color: spec.color,
      wordWrap: { width }, align: spec.align === 1 ? 'right' : spec.align === 2 ? 'center' : 'left', padding: { x: 1, y: 1 } })
      .setFixedSize(width, key === 'detailText' ? 0 : spec.bounds[3] - spec.bounds[1]).setScale(p.scaleX, p.scaleY)
      .setAngle(p.rotationDegrees).setName(`${name}-${key}`);
    fields[key as keyof ItemPopupValues] = object; root.add(object);
  }
  const hide = () => { root.setVisible(false); changed?.(null); };
  const show = (item: Item) => {
    const values = itemPopupValues(item), gun = item.type === ITEM_TYPE.gun;
    const requiresSkill = gun && (traits[item.reqTrait!] ?? 0) < (item.reqLv ?? 0);
    for (const [key, value] of Object.entries(values)) fields[key as keyof ItemPopupValues].setText(value);
    fields.itemName.setColor(item.lv > 1 ? '#0000cc' : '#000000');
    fields.detailText.setColor(gun && item.modText ? '#0000cc' : '#000000');
    fields.reqText.setColor(gun ? requiresSkill ? '#cc0000' : '#0000cc' : '#000000');
    // Длинный список модификаций помещается целиком; верхняя часть исходного рисунка не растягивается.
    background.setSize(asset.frameWidth, Math.max(asset.frameHeight, fields.detailText.y + fields.detailText.height + asset.originY + 10));
    root.setVisible(true); root.parentContainer?.bringToTop(root);
    changed?.({ id: item.id, values, requiresSkill });
  };
  root.once('destroy', () => changed?.(null));
  return { root, show, hide };
}
