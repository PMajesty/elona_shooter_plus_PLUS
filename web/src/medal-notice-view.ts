import { localizedImage } from './localized-image.ts';
import { localizedText, contentText, fitLocalizedText } from './localized-text.ts';
import Phaser from 'phaser';
import type { LootViewManifest } from './loot-view.ts';
import type { MedalNotice } from './medal-notices.ts';

export interface InfoPopupLayout {
  children: { infoText: { x: number; y: number; text: { fontSize: number; color: string; bounds: number[] } } };
  frames: ({ y: number; alpha: number } | null)[];
}

/** Исходная плашка infoPop2291. Она не принимает ввод и переживает перерисовку городского меню. */
export function createMedalNoticeView(scene: Phaser.Scene, manifest: LootViewManifest, layout: InfoPopupLayout,
  notice: MedalNotice): Phaser.GameObjects.Container {
  const root = scene.add.container(0, 0).setDepth(1000).setName(notice.id === undefined ? 'info' : `medal-${notice.id}`);
  const asset = manifest.clips.infoPopup;
  root.add(localizedImage(scene, -asset.originX, -asset.originY, 'infoPopup', '1').setOrigin(0));
  const p = layout.children.infoText, field = p.text, width = field.bounds[2] - field.bounds[0];
  root.add(fitLocalizedText(contentText(localizedText(scene, p.x, p.y, notice.text, { fontFamily: 'ElonaMenuBold', fontSize: `${field.fontSize}px`,
    color: field.color, letterSpacing: 1, padding: { x: 1, y: 1 } }).setCrop(0, 0, width, field.bounds[3] - field.bounds[1])), { width, height: field.bounds[3] - field.bounds[1] }));
  return root;
}

export function updateMedalNoticeView(view: Phaser.GameObjects.Container, layout: InfoPopupLayout, notice: MedalNotice): void {
  const frame = layout.frames[notice.frame - 1];
  view.setPosition(notice.battle ? 40 : 200, (notice.battle ? 40 : 0) + notice.slot * 30 + (frame?.y ?? 0));
  view.setAlpha(frame?.alpha ?? 0);
}
