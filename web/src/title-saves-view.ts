import { buttonInput } from './button-input.ts';
import Phaser from 'phaser';
import type { LootViewManifest } from './loot-view.ts';

interface Placement { x: number; y: number; scaleX: number; scaleY: number }
export interface TitleSavesLayout {
  titleSaves: { children: { saveBox: Placement; trash: Placement } };
  partyControls: { orderGrid: number[]; orderListGrid: number[]; componentBaseWidth: number; componentBaseHeight: number };
}

/** saveBox и приказы союзников используют один исходный ComboBox1740 и его скины. */
export function createTitleSavesView(scene: Phaser.Scene, manifest: LootViewManifest, layout: TitleSavesLayout,
  labels: readonly string[], selected: number, select: (slot: number) => void, remove: () => void): Phaser.GameObjects.Container {
  const root = scene.add.container(0, 0).setName('title-saves');
  const placement = layout.titleSaves.children, controls = layout.partyControls, p = placement.saveBox;
  const width = controls.componentBaseWidth * p.scaleX, height = controls.componentBaseHeight * p.scaleY;
  const skin = (key: string, grid: number[], x: number, y: number, w: number, h: number) => {
    const asset = manifest.clips[key];
    return scene.add.nineslice(x, y, key, '1', w, h, grid[0], asset.frameWidth - grid[2], grid[1], asset.frameHeight - grid[3]).setOrigin(0);
  };
  root.add(skin('partyOrderSkin', controls.orderGrid, p.x, p.y, width, height));
  root.add(scene.add.text(p.x + 3, p.y + 5, labels[selected], { fontFamily: 'Arial', fontSize: '11px', color: '#000000' }).setCrop(0, 0, width - 22, height));
  let list: Phaser.GameObjects.Container | undefined;
  let highlighted = selected;
  let optionLabels: Phaser.GameObjects.Text[] = [];
  const close = () => { list?.destroy(true); list = undefined; };
  const choose = scene.add.zone(p.x, p.y, width, height).setOrigin(0).setInteractive({ useHandCursor: true }).setName('save-slot-selector'); root.add(choose);
  choose.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
    event.stopPropagation(); if (list) { close(); return; }
    highlighted = selected; optionLabels = [];
    list = scene.add.container(0, 0); root.add(list);
    const outside = scene.add.zone(0, 0, 620, 380).setOrigin(0).setInteractive(); list.add(outside);
    outside.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => { e.stopPropagation(); close(); });
    const y = p.y + height;
    list.add(skin('partyOrderListSkin', controls.orderListGrid, p.x, y, width, labels.length * 20 + 2));
    labels.forEach((value, index) => {
      const label = scene.add.text(p.x + 3, y + index * 20 + 3, value, { fontFamily: 'Arial', fontSize: '11px', color: index === selected ? '#0000cc' : '#000000' }).setCrop(0, 0, width - 6, 20); list!.add(label);
      optionLabels.push(label);
      const hit = scene.add.zone(p.x, y + index * 20, width, 20).setOrigin(0).setInteractive({ useHandCursor: true }).setName(`save-slot-${index}`); list!.add(hit);
      hit.on('pointerover', () => label.setColor('#0000cc')); hit.on('pointerout', () => label.setColor(index === selected ? '#0000cc' : '#000000'));
      hit.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => { e.stopPropagation(); select(index); });
    });
  });
  const keyboard = (event: KeyboardEvent) => {
    if (!list || !['ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter', 'Escape'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Escape') { close(); return; }
    if (event.key === 'Enter') { select(highlighted); return; }
    highlighted = event.key === 'Home' ? 0 : event.key === 'End' ? labels.length - 1
      : Math.max(0, Math.min(labels.length - 1, highlighted + (event.key === 'ArrowDown' ? 1 : -1)));
    optionLabels.forEach((label, index) => label.setColor(index === highlighted ? '#0000cc' : '#000000'));
  };
  scene.input.keyboard?.on('keydown', keyboard);
  root.once('destroy', () => scene.input.keyboard?.off('keydown', keyboard));
  const asset = manifest.images.button_deleteSave, trash = scene.add.image(placement.trash.x, placement.trash.y, 'button_deleteSave').setOrigin(asset.originX / asset.width, asset.originY / asset.height)
    .setScale(placement.trash.scaleX, placement.trash.scaleY).setInteractive(buttonInput(asset)); root.add(trash);
  trash.on('pointerover', () => trash.setTexture('button_deleteSave_over')); trash.on('pointerout', () => trash.setTexture('button_deleteSave'));
  trash.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => { e.stopPropagation(); close(); remove(); });
  return root;
}
