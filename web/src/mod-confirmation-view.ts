import Phaser from 'phaser';
import type { LootViewManifest } from './loot-view.ts';

interface Placement {
  x: number; y: number; scaleX: number; scaleY: number; rotationDegrees: number;
  text?: { fontId: number; fontSize: number; bounds: number[]; align: number; color: string };
}
export interface ModConfirmationLayout { image: string; children: Record<string, Placement> }

/** Общий исходный dialogMod живёт на stage, а не в смещённом окне добычи. */
export function createModConfirmation(scene: Phaser.Scene, manifest: LootViewManifest, layout: ModConfirmationLayout,
  resolve: (confirm: boolean) => void, name: string, question = 'Do you really want to mount the mod on this gun?'): Phaser.GameObjects.Container {
  const root = scene.add.container(0, 0).setName(`${name}-dialog`);
  const image = (key: string, placement?: Placement) => {
    const asset = manifest.images[key];
    const object = scene.add.image(placement?.x ?? 0, placement?.y ?? 0, key)
      .setOrigin(asset.originX / asset.width, asset.originY / asset.height);
    if (placement) object.setScale(placement.scaleX, placement.scaleY).setAngle(placement.rotationDegrees);
    root.add(object); return object;
  };
  image(layout.image);
  const placement = layout.children.question, field = placement.text!;
  const width = field.bounds[2] - field.bounds[0];
  root.add(scene.add.text(placement.x, placement.y, question, {
    fontFamily: 'ElonaMenu', fontSize: `${field.fontSize}px`, color: field.color,
    wordWrap: { width }, align: field.align === 2 ? 'center' : 'left', padding: { x: 1, y: 1 },
  }).setFixedSize(width, 0).setScale(placement.scaleX, placement.scaleY).setAngle(placement.rotationDegrees).setName(`${name}-question`));

  // MouseLDownFunc_result: только попадание в Yes подтверждает; любой иной щелчок выбирает No.
  const dismiss = scene.add.zone(0, 0, 620, 380).setOrigin(0).setInteractive().setName(`${name}-cancel-background`);
  root.add(dismiss);
  dismiss.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
    event.stopPropagation(); resolve(false);
  });
  for (const [part, confirm] of [['no', false], ['yes', true]] as const) {
    const key = confirm ? 'button_dialogYes' : 'button_dialogNo';
    const button = image(key, layout.children[part]).setName(`${name}-${part}`)
      .setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 100 });
    button.on('pointerover', () => { if (manifest.images[`${key}_over`]) button.setTexture(`${key}_over`); });
    button.on('pointerout', () => button.setTexture(key));
    button.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation(); resolve(confirm);
    });
  }
  return root;
}
