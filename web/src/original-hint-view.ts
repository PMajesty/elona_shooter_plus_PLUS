import Phaser from 'phaser';
import type { LootViewManifest } from './loot-view.ts';
import type { TownLayout } from './town-view.ts';
import type { OriginalHintInfo } from './trait-hint.ts';

/** Пять исходных полей hint1657, включая тип навыка и предельный уровень. */
export function createOriginalHintView(scene: Phaser.Scene, manifest: LootViewManifest, layout: TownLayout['medals'],
  changed?: (info: OriginalHintInfo | null) => void) {
  const root = scene.add.container(0, 0).setVisible(false).setName('original-hint');
  const asset = manifest.images[layout.hintImage];
  root.add(scene.add.image(-asset.originX, -asset.originY, layout.hintImage).setOrigin(0));
  const field = (key: string) => {
    const p = layout.hintChildren[key], spec = p.text!;
    const object = scene.add.text(p.x, p.y, '', { resolution: 2, fontFamily: spec.fontId === 1653 ? 'ElonaImpact' : 'ElonaMenu',
      fontSize: `${spec.fontSize}px`, color: spec.color, wordWrap: { width: spec.bounds[2] - spec.bounds[0] },
      padding: { x: 1, y: 1 } }).setScale(p.scaleX, p.scaleY);
    root.add(object); return object;
  };
  const name = field('itemName'), description = field('itemDesc'), effect = field('itemDesc2'), maximum = field('maxText'), kind = field('typeText');
  const hide = () => { root.setVisible(false); changed?.(null); };
  const show = (info: OriginalHintInfo) => {
    name.setText(info.name); description.setText(info.description); effect.setText(info.effect);
    effect.setY(Math.max(layout.hintChildren.itemDesc2.y, description.y + description.height + 3));
    maximum.setText(info.maximum ? `Maxed at ${info.maximum}` : '').setVisible(Boolean(info.maximum));
    kind.setText(info.kind ?? '').setVisible(Boolean(info.kind));
    root.setVisible(true); root.parentContainer?.bringToTop(root); changed?.(info);
  };
  root.once('destroy', () => changed?.(null));
  return { root, show, hide };
}
