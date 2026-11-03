import { buttonInput } from './button-input.ts';
import Phaser from 'phaser';
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
  statistics: string, callbacks: { close(): void; save(): void; title(): void; help(): void; option(key: keyof GameOptions): void; click(): void }): Phaser.GameObjects.Container {
  const root = scene.add.container(0, 0).setName('original-pause');
  const shade = scene.add.rectangle(0, 0, 620, 380, 0, 0.45).setOrigin(0).setInteractive(); root.add(shade);
  shade.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => { e.stopPropagation(); callbacks.close(); });
  root.add(scene.add.image(0, 0, layout.image).setOrigin(0));
  const parent = layout.children.options;
  const stats = layout.options.stats;
  const x = parent.x + stats.x, y = parent.y + stats.y, width = stats.scaleX * 100, height = stats.scaleY * 44;
  root.add(scene.add.nineslice(x, y, 'helpTextAreaSkin', '1', width, height, 2, 2, 2, 2).setOrigin(0));
  const field = scene.add.text(x + 4, y + 4, statistics, { fontFamily: 'Arial', fontSize: '12px', color: '#000000', wordWrap: { width: width - 22 } }).setCrop(0, 0, width - 8, height - 8); root.add(field);
  const area = scene.add.zone(x, y, width, height).setOrigin(0).setInteractive(); root.add(area);
  area.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => e.stopPropagation());
  let offset = 0;
  const wheel = (pointer: Phaser.Input.Pointer, _over: unknown, _dx: number, dy: number) => {
    if (pointer.worldX < x || pointer.worldX > x + width || pointer.worldY < y || pointer.worldY > y + height) return;
    offset = Phaser.Math.Clamp(offset + dy, 0, Math.max(0, field.height - height + 8)); field.y = y + 4 - offset;
    field.setCrop(0, offset, width - 8, height - 8);
  };
  scene.input.on('wheel', wheel); root.once('destroy', () => scene.input.off('wheel', wheel));
  const block = scene.add.zone(parent.x - 85, parent.y - 125, 350, 290).setOrigin(0).setInteractive(); root.addAt(block, 2);
  block.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => e.stopPropagation());
  for (const [part, key, action] of [['returnTitleButton', 'button_pauseTitle', callbacks.title], ['saveGameButton', 'button_pauseSave', callbacks.save], ['helpButton', 'button_pauseHelp', callbacks.help]] as const) {
    const p = layout.children[part], a = manifest.images[key];
    const button = scene.add.image(p.x, p.y, key).setOrigin(a.originX / a.width, a.originY / a.height).setScale(p.scaleX, p.scaleY).setInteractive(buttonInput(a)); root.add(button);
    button.on('pointerover', () => button.setTexture(`${key}_over`)); button.on('pointerout', () => button.setTexture(key));
    button.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => { e.stopPropagation(); callbacks.click(); action(); });
  }
  for (const [part, key] of Object.entries(OPTION_KEYS)) {
    const p = layout.options[part], px = parent.x + p.x, py = parent.y + p.y;
    const check = scene.add.image(px + 5, py + 4, options[key] ? 'partyCheckOn' : 'partyCheckOff', '1').setOrigin(0); root.add(check);
    root.add(scene.add.text(px + 24, py + 4, layout.labels[part], { fontFamily: 'Arial', fontSize: '11px', color: '#000000' }));
    const hit = scene.add.zone(px, py, 300, 19).setOrigin(0).setInteractive({ useHandCursor: true }).setName(`pause-${key}`); root.add(hit);
    hit.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
      e.stopPropagation(); callbacks.click(); callbacks.option(key); check.setTexture(options[key] ? 'partyCheckOn' : 'partyCheckOff', '1');
    });
  }
  return root;
}
