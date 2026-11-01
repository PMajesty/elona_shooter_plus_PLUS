import Phaser from 'phaser';
import type { LootViewManifest } from './loot-view.ts';
import { ITEM_TYPE, isOccupiedItem, type Item } from './items.ts';

export type TownTab = 'mission' | 'castle' | 'shop' | null;
interface Placement {
  x: number; y: number; scaleX: number; scaleY: number; rotationDegrees: number;
  text?: { fontId: number; fontSize: number; bounds: number[]; align: number; color: string };
}
export interface TownLayout {
  menuPosition: { x: number; y: number };
  rootChildren: Record<string, Placement>;
  navigation: Record<string, Placement & { image: string }>;
  mission: { image: string; labelsImage: string; children: Record<string, Placement> };
  castle: { image: string; labelsImage: string; children: Record<string, Placement> };
  repairDialog: { image: string; children: Record<string, Placement> };
}
interface TownViewState {
  day: number; gold: number; castleHp: number; castleMaxHp: number;
  player: { level: number; exp: number; ammo: number };
  town: { ap: number } | null; inventory: (Item | null)[];
}
interface Callbacks { select(tab: TownTab): void; repair(): void; dismiss(): void; message(value: string): void }

/** Городские координаты и повороты берутся из исходного кадра 71 и его окон. */
export function createTownView(scene: Phaser.Scene, state: TownViewState, manifest: LootViewManifest, layout: TownLayout, callbacks: Callbacks, tab: TownTab, repairDialog: boolean): Phaser.GameObjects.Container {
  const root = scene.add.container(0, 0).setName('town-view');
  const image = (key: string, x = 0, y = 0, placement?: Placement) => {
    const asset = manifest.images[key];
    const object = scene.add.image(x, y, key).setOrigin(asset.originX / asset.width, asset.originY / asset.height);
    if (placement) object.setScale(placement.scaleX, placement.scaleY).setAngle(placement.rotationDegrees);
    root.add(object); return object;
  };
  const text = (placement: Placement, value: string, x = 0, y = 0) => {
    const field = placement.text!;
    const fonts: Record<number, string> = { 682: 'ElonaMenu', 1608: 'ElonaMenuBold', 2681: 'ElonaHud', 1392: 'ElonaSmall' };
    const width = field.bounds[2] - field.bounds[0];
    const object = scene.add.text(x + placement.x, y + placement.y, value, {
      fontFamily: fonts[field.fontId] ?? 'Arial', fontSize: `${field.fontSize}px`, color: field.color,
      wordWrap: { width }, align: field.align === 2 ? 'center' : 'left', padding: { x: 1, y: 1 },
    }).setFixedSize(width, 0).setScale(placement.scaleX, placement.scaleY);
    if (field.color === '#ffffff') object.setShadow(1, 1, '#000000', 2);
    root.add(object); return object;
  };
  const button = (key: string, placement: Placement, action: () => void, x = 0, y = 0, enabled = true) => {
    const object = image(key, x + placement.x, y + placement.y, placement).setName(key);
    object.setAlpha(enabled ? 1 : 0.35).setInteractive({ useHandCursor: enabled, pixelPerfect: true, alphaTolerance: 100 });
    if (enabled) {
      object.on('pointerover', () => object.setTexture(`${key}_over`));
      object.on('pointerout', () => object.setTexture(key));
    }
    object.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => { event.stopPropagation(); action(); });
    return object;
  };
  image('townScene');
  const selected = state.inventory[0];
  const occupied = isOccupiedItem(selected);
  image('ammo_fill', 290.9, 11).setScale(occupied && selected.ammoMax > 0 ? selected.ammo / selected.ammoMax : 0, 1);
  const hud = { dayText: String(state.day), moneyText: String(state.gold), castleHPText: `${state.castleHp}/${state.castleMaxHp}`,
    ammoText: occupied ? `${selected.ammo}/${selected.ammoMax}` : '', lvText: String(state.player.level), expText: String(state.player.exp / 10), apText: `AP: ${state.town?.ap ?? 0}` };
  for (const [name, value] of Object.entries(hud)) text(layout.rootChildren[name], value);
  const icon = manifest.clips.itemPicture;
  state.inventory.slice(0, 5).forEach((item, index) => {
    if (!isOccupiedItem(item)) return;
    root.add(scene.add.image(25 + index * 90 - icon.originX, 343 - icon.originY, 'itemPicture', String(item.graphic)).setOrigin(0));
    if (item.type === ITEM_TYPE.use) root.add(scene.add.text(50 + index * 90, 366, `x${item.ammo}`, { fontFamily: 'Arial', fontSize: '11px', color: '#ffffff' }));
  });
  for (const [name, placement] of Object.entries(layout.navigation)) {
    const enabled = name === 'mission' || name === 'castle' || name === 'shop';
    button(placement.image, placement, () => enabled ? callbacks.select(name as TownTab) : callbacks.message('This town menu is not available in the current port yet.'), 0, 0, enabled);
  }
  if (tab && tab !== 'shop') {
    const panel = layout[tab], { x, y } = layout.menuPosition;
    // Вертикальный сдвиг уже запечён в статическую панель; её кнопкам он нужен отдельно.
    image(panel.image, x, 0);
    button('button_windowClose', panel.children.closeButton, () => callbacks.select(null), x, y);
    if (tab === 'castle') {
      text(panel.children.unkeep, '40', x, y);
      button('button_freeRepair', panel.children.act1, callbacks.repair, x, y);
    } else {
      button('button_townRest', panel.children.act1, () => callbacks.message('The next day is not available yet. Equipment and learned skills are still being integrated into combat.'), x, y, false);
      button('button_townHire', panel.children.act2, () => callbacks.message('Hiring companions is not available yet.'), x, y, false);
    }
    image(panel.labelsImage, x, 0).setAlpha(tab === 'mission' ? 0.35 : 1);
  }
  if (repairDialog) {
    const dialog = layout.repairDialog;
    image(dialog.image);
    text(dialog.children.title, 'Free Repair!');
    text(dialog.children.text, 'Citizens acknowledge your hard work and decided to rebuild the castle walls for free!');
    image('button_eventOk', dialog.children.okButton.x, dialog.children.okButton.y, dialog.children.okButton);
    // Исходный procEventDialog закрывает подтверждение любым нажатием, не повторяя ремонт.
    const dismiss = scene.add.zone(0, 0, 620, 380).setOrigin(0).setInteractive({ useHandCursor: true });
    dismiss.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => { event.stopPropagation(); callbacks.dismiss(); });
    root.add(dismiss);
  }
  return root;
}
