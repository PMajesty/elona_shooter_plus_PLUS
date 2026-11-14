import { localizedImage } from './localized-image.ts';
import { localizedText, fitLocalizedText } from './localized-text.ts';
import { buttonInput } from './button-input.ts';
import Phaser from 'phaser';
import { originalTextArea } from './original-text-area.ts';
import { bindTouchSafeDismiss } from './touch-scroll.ts';
import type { LootViewManifest } from './loot-view.ts';
import type { GameOptions } from './game-options.ts';

interface Placement { x: number; y: number; scaleX: number; scaleY: number }
export interface PauseLayout {
  image: string; children: Record<string, Placement>; options: Record<string, Placement>; labels: Record<string, string>;
  controls: { menuButton: Placement; vol: Placement };
}
const OPTION_KEYS = { optShowDamage: 'showDamage', optShowAllyDamage: 'showAllyDamage', optLowQuality: 'lowQuality',
  optFirework: 'disableFireworks', optColor: 'colorBlind', optFlashShot: 'disableFlash' } as const;

/** Исходная menu_pause, конечный кадр10; все действия остаются внутри игрового окна. */
export function createPauseView(scene: Phaser.Scene, manifest: LootViewManifest, layout: PauseLayout, options: GameOptions,
  statistics: string, callbacks: { close(): void; save(): void; title(): void; help(): void; option(key: keyof GameOptions): void; click(): void }, expanded = false): Phaser.GameObjects.Container {
  const root = scene.add.container(0, 0).setName('original-pause');
  // В оригинале нет затемнения: фон заменяет размытый снимок; прозрачный слой только закрывает меню щелчком мимо.
  const shade = scene.add.rectangle(0, 0, 620, 380, 0, 0).setOrigin(0).setInteractive(); root.add(shade);
  bindTouchSafeDismiss(scene, root, shade, callbacks.close);
  // В кадрах 1–10 menu_pause панель настроек и бумага въезжают с разных сторон, поэтому картинка делится по x=340 на две группы.
  const left = scene.add.container(0, 0).setName('pause-left'), right = scene.add.container(0, 0).setName('pause-right');
  root.add([left, right]);
  const split = 340;
  left.add(localizedImage(scene, 0, 0, layout.image).setOrigin(0).setCrop(0, 0, split, 380));
  right.add(localizedImage(scene, 0, 0, layout.image).setOrigin(0).setCrop(split, 0, 620 - split, 380));
  const parent = layout.children.options;
  const stats = layout.options.stats;
  const x = parent.x + stats.x, y = parent.y + stats.y, width = stats.scaleX * 100, height = stats.scaleY * 44;
  const block = scene.add.zone(parent.x - 85, parent.y - 125, 350, 290).setOrigin(0).setInteractive(); left.add(block);
  block.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => e.stopPropagation());
  left.add(originalTextArea(scene, 'pause-statistics-text', statistics, x, y, width, height));
  for (const [part, key, action] of [['returnTitleButton', 'button_pauseTitle', callbacks.title], ['saveGameButton', 'button_pauseSave', callbacks.save], ['helpButton', 'button_pauseHelp', callbacks.help]] as const) {
    const p = layout.children[part], a = manifest.images[key];
    const button = localizedImage(scene, p.x, p.y, key).setOrigin(a.originX / a.width, a.originY / a.height).setScale(p.scaleX, p.scaleY).setInteractive(buttonInput(a)); right.add(button);
    button.on('pointerover', () => button.setTexture(`${key}_over`)); button.on('pointerout', () => button.setTexture(key));
    button.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => { e.stopPropagation(); callbacks.click(); action(); });
  }
  for (const [part, key] of Object.entries(OPTION_KEYS)) {
    const p = layout.options[part], px = parent.x + p.x, py = parent.y + p.y;
    const check = localizedImage(scene, px + 5, py + 4, options[key] ? 'partyCheckOn' : 'partyCheckOff', '1').setOrigin(0); left.add(check);
    left.add(fitLocalizedText(localizedText(scene, px + 24, py + 4, expanded && key === 'showAllyDamage' ? 'Show companion damage' : layout.labels[part], { fontFamily: 'Arial', fontSize: '11px', color: '#000000' }), { width: 276, height: 15 }));
    const hit = scene.add.zone(px, py, 300, 19).setOrigin(0).setInteractive({ useHandCursor: true }).setName(`pause-${key}`); left.add(hit);
    hit.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
      e.stopPropagation(); callbacks.click(); callbacks.option(key); check.setTexture(options[key] ? 'partyCheckOn' : 'partyCheckOff', '1');
    });
  }
  return root;
}
