import { localizedText } from './localized-text.ts';
import Phaser from 'phaser';
import type { CombatNotice } from './combat-notices.ts';

export interface CombatNoticeLayout {
  frames: { x: number; y: number; scaleX: number; scaleY: number; alpha: number }[];
  field: { x: number; y: number; text: { fontSize: number; color: string; bounds: number[] } };
}

/** Динамическое поле textEffect.msg.msg с исходными размещениями и шрифтом682. */
export function createCombatNoticeView(scene: Phaser.Scene, layout: CombatNoticeLayout, notice: CombatNotice): Phaser.GameObjects.Container {
  const { field } = layout, text = field.text;
  const width = text.bounds[2] - text.bounds[0], height = text.bounds[3] - text.bounds[1];
  const view = scene.add.container(-180, 320).setDepth(900);
  view.add(localizedText(scene, field.x, field.y, notice.text, { fontFamily: 'ElonaMenu', fontSize: `${text.fontSize}px`,
    color: text.color, letterSpacing: 1, fixedWidth: width, align: 'right', padding: { x: 1, y: 1 } })
    .setShadow(1.414, 1.414, '#000000', 0).setCrop(0, 0, width, height));
  return view;
}

export function updateCombatNoticeView(view: Phaser.GameObjects.Container, layout: CombatNoticeLayout, notice: CombatNotice): void {
  const frame = layout.frames[notice.frame - 1];
  view.setPosition(-180 + frame.x, 320 + frame.y).setScale(frame.scaleX, frame.scaleY).setAlpha(frame.alpha);
}
