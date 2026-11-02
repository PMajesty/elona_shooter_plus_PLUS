import Phaser from 'phaser';
import type { LootViewManifest } from './loot-view.ts';
import type { TownNotice } from './town-events.ts';

interface Placement {
  x: number; y: number; scaleX: number; scaleY: number; rotationDegrees: number;
  text?: { fontId: number; fontSize: number; bounds: number[]; align: number; color: string };
}
export interface TownEventLayout { image: string; children: Record<string, Placement> }

/** Исходный eventWindow2437 с отдельной карточкой2336 и динамическим английским текстом. */
export function createTownEventView(scene: Phaser.Scene, manifest: LootViewManifest, layout: TownEventLayout,
  notice: TownNotice, close: () => void): Phaser.GameObjects.Container {
  const root = scene.add.container(0, 0).setName('town-event');
  const background = manifest.images[layout.image];
  root.add(scene.add.image(-background.originX, -background.originY, layout.image).setOrigin(0));
  const placement = layout.children.card, card = manifest.clips.townEventCards;
  root.add(scene.add.image(placement.x, placement.y, 'townEventCards', String(notice.cardFrame))
    .setOrigin(card.originX / card.frameWidth, card.originY / card.frameHeight)
    .setScale(placement.scaleX, placement.scaleY).setAngle(placement.rotationDegrees));
  for (const [name, value] of [['title', notice.title], ['text', notice.text]] as const) {
    const position = layout.children[name], field = position.text!, width = field.bounds[2] - field.bounds[0];
    root.add(scene.add.text(position.x, position.y, value, { fontFamily: field.fontId === 1608 ? 'ElonaMenuBold' : 'ElonaMenu',
      fontSize: `${field.fontSize}px`, color: field.color, wordWrap: { width },
      align: field.align === 2 ? 'center' : 'left', padding: { x: 1, y: 1 } })
      .setFixedSize(width, 0).setScale(position.scaleX, position.scaleY).setName(`town-event-${name}`));
  }
  const ok = layout.children.okButton, asset = manifest.images.button_eventOk;
  root.add(scene.add.image(ok.x, ok.y, 'button_eventOk').setOrigin(asset.originX / asset.width, asset.originY / asset.height)
    .setScale(ok.scaleX, ok.scaleY).setAngle(ok.rotationDegrees));
  const dismiss = scene.add.zone(0, 0, 620, 380).setOrigin(0).setInteractive({ useHandCursor: true });
  dismiss.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => { event.stopPropagation(); close(); });
  root.add(dismiss);
  return root;
}
