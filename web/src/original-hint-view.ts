import { localizedImage } from './localized-image.ts';
import { localizedText, fitLocalizedText } from './localized-text.ts';
import Phaser from 'phaser';
import type { LootViewManifest } from './loot-view.ts';
import type { TownLayout } from './town-view.ts';
import type { OriginalHintInfo } from './trait-hint.ts';

/** Пять исходных полей hint1657, включая тип навыка и предельный уровень. */
export function createOriginalHintView(scene: Phaser.Scene, manifest: LootViewManifest, layout: TownLayout['medals'],
  changed?: (info: OriginalHintInfo | null) => void) {
  const root = scene.add.container(0, 0).setVisible(false).setName('original-hint');
  const asset = manifest.images[layout.hintImage];
  root.add(localizedImage(scene, -asset.originX, -asset.originY, layout.hintImage).setOrigin(0));
  const field = (key: string) => {
    const p = layout.hintChildren[key], spec = p.text!;
    const object = localizedText(scene, p.x, p.y, '', { resolution: 2, fontFamily: spec.fontId === 1653 ? 'ElonaImpact' : 'ElonaMenu',
      fontSize: `${spec.fontSize}px`, color: spec.color, wordWrap: { width: spec.bounds[2] - spec.bounds[0] },
      padding: { x: 1, y: 1 } }).setScale(p.scaleX, p.scaleY);
    fitLocalizedText(object, { width: spec.bounds[2] - spec.bounds[0], height: spec.bounds[3] - spec.bounds[1] });
    root.add(object); return object;
  };
  const name = field('itemName'), description = field('itemDesc'), effect = field('itemDesc2'), maximum = field('maxText'), kind = field('typeText');
  const hide = () => { root.setVisible(false); changed?.(null); };
  const show = (info: OriginalHintInfo) => {
    const children = layout.hintChildren, title = children.itemName.text!, body = children.itemDesc.text!;
    // Тип навыка занимает правую часть заголовка; эффект не должен наезжать на описание.
    fitLocalizedText(name, { width: info.kind ? children.typeText.x - name.x - 4 : title.bounds[2] - title.bounds[0],
      height: title.bounds[3] - title.bounds[1], ellipsis: true });
    fitLocalizedText(description, { width: body.bounds[2] - body.bounds[0],
      height: info.effect ? children.itemDesc2.y - description.y - 3 : body.bounds[3] - body.bounds[1] });
    name.setText(info.name); description.setText(info.description); effect.setText(info.effect);
    effect.setY(Math.max(layout.hintChildren.itemDesc2.y, description.y + description.height + 3));
    maximum.setText(info.maximum ? `Maxed at ${info.maximum}` : '').setVisible(Boolean(info.maximum));
    kind.setText(info.kind ?? '').setVisible(Boolean(info.kind));
    root.setVisible(true); root.parentContainer?.bringToTop(root); changed?.(info);
  };
  root.once('destroy', () => changed?.(null));
  return { root, show, hide };
}
