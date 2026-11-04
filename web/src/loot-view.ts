import { localizedImage } from './localized-image.ts';
import { localizedText, fitLocalizedText } from './localized-text.ts';
import { buttonInput } from './button-input.ts';
import { createItemPopupView, type ItemPopupLayout } from './item-popup-view.ts';
import type { ItemPopupInfo } from './item-popup-values.ts';
import Phaser from 'phaser';
import { ITEM_TYPE, isOccupiedItem, type Item } from './items.ts';
import { createModConfirmation, type ModConfirmationLayout } from './mod-confirmation-view.ts';

export type LootArea = 'offers' | 'inventory';
export interface LootViewState {
  player: { traits: Readonly<Record<number, number>> };
  inventory: (Item | null)[]; lootOffers: (Item | null)[]; bossKilled?: number;
  pendingLootAction: { kind: 'mod'; mod: { area: LootArea; index: number }; gun: { area: LootArea; index: number } } | null;
}
export interface LootViewManifest {
  images: Record<string, { originX: number; originY: number; width: number; height: number }>;
  clips: Record<string, { originX: number; originY: number; frameWidth: number; frameHeight: number }>;
}
export interface LootViewCallbacks {
  itemPopup?(info: ItemPopupInfo | null): void;
  move(fromArea: LootArea, from: number, toArea: LootArea, to: number): boolean;
  proceed(): void;
  resolveModMount(confirm: boolean): void;
  message?(text: string): void;
}

const MENU_X = -15.587619764971691;

export function createLootView(scene: Phaser.Scene, state: LootViewState, manifest: LootViewManifest, callbacks: LootViewCallbacks,
  dialog: ModConfirmationLayout, popupLayout: ItemPopupLayout, mode: 'ordinary' | 'boss' = 'ordinary'): Phaser.GameObjects.Container {
  const root = scene.add.container(MENU_X, 0);
  const modal = state.pendingLootAction !== null;
  root.setName(mode === 'boss' ? 'boss-loot-view' : 'ordinary-loot-view').setData('pendingLootAction', state.pendingLootAction);
  const text = (x: number, y: number, value: string, size = 13, color = '#322316') => {
    const object = localizedText(scene, x, y, value, { resolution: 2, fontFamily: 'ElonaMenu', fontSize: `${size}px`, color, padding: { x: 1, y: 1 } });
    root.add(object); return object;
  };
  const image = (key: string, x: number, y: number) => {
    const asset = manifest.images[key];
    const object = localizedImage(scene, x - asset.originX, y - asset.originY, key).setOrigin(0);
    root.add(object); return object;
  };
  image(mode === 'boss' ? 'lootBoss' : 'loot', 0, 0);
  if (mode === 'boss') fitLocalizedText(text(295, 78, `You've successfully killed ${state.bossKilled ?? 0} boss(es) therefore received some prizes!`, 12).setWordWrapWidth(238), { width: 238, height: 48 });
  const background = scene.add.zone(-MENU_X, 0, 620, 380).setOrigin(0).setInteractive();
  root.add(background);
  // Второй исходный ряд занимает прежнюю полосу подсказки порта; сообщение остаётся под canvas.
  const status = text(140, 262, '', 12, '#8e2f20').setWordWrapWidth(390).setVisible(state.inventory.length <= 8);
  const message = (value: string) => { status.setText(value); callbacks.message?.(value); };

  const tooltip = createItemPopupView(scene, manifest, popupLayout, state.player.traits, callbacks.itemPopup);
  tooltip.root.setPosition(231, 10); root.add(tooltip.root);

  interface SlotView { area: LootArea; index: number; item: Item; icon: Phaser.GameObjects.Container; originalX: number; originalY: number; width: number; height: number }
  let carrying: SlotView | undefined;
  let pendingModIcon: SlotView | undefined;
  const slotPosition = (area: LootArea, index: number) => area === 'offers'
    ? { x: 140 + index * 50, y: 129 }
    : { x: 140 + index % 8 * 50, y: 198 + Math.floor(index / 8) * 48 };
  const point = new Phaser.Math.Vector2();
  const localPointer = (pointer: Phaser.Input.Pointer) => root.getWorldTransformMatrix().applyInverse(pointer.worldX, pointer.worldY, point);
  const showTooltip = (item: Item) => { if (!carrying && !modal) tooltip.show(item); };
  const clearCarry = () => {
    if (!carrying) return;
    carrying.icon.setPosition(carrying.originalX, carrying.originalY);
    carrying = undefined; root.setData('carrying', null);
    proceed.setAlpha(1); tooltip.hide(); scene.input.setDefaultCursor('default');
  };
  const moveCarried = (pointer: Phaser.Input.Pointer) => {
    if (!carrying) return;
    const p = localPointer(pointer);
    carrying.icon.setPosition(p.x - carrying.width / 2, p.y - carrying.height / 2);
  };

  background.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
    event.stopPropagation();
    if (modal) return;
    clearCarry(); tooltip.hide(); status.setText('');
  });

  const addSlot = (area: LootArea, index: number, item: Item | null, x: number, y: number) => {
    if (!isOccupiedItem(item)) item = null;
    const slotAsset = manifest.clips.inventorySlot;
    const slot = localizedImage(scene, x - slotAsset.originX, y - slotAsset.originY, 'inventorySlot', '1').setOrigin(0);
    root.add(slot);
    if (area === 'inventory' && index < 5) text(x + 6, y + 29.4, String(index + 1), 12, '#77664d');
    let slotView: SlotView | undefined;
    if (item) {
      const asset = manifest.clips.itemPicture;
      const width = GRAPHIC_WIDTH[item.graphic] ?? asset.frameWidth;
      const iconX = x - (width - 48) / 2 - 4;
      const icon = scene.add.container(iconX, y);
      const frame = scene.textures.get('itemPicture').has(String(item.graphic)) ? String(item.graphic) : '1';
      icon.add(localizedImage(scene, -asset.originX, -asset.originY, 'itemPicture', frame).setOrigin(0));
      if (item.type === ITEM_TYPE.use && item.ammoMax > 0) {
        icon.add(localizedText(scene, 30.95, 2, `x ${item.ammo}`, { resolution: 2, fontFamily: 'ElonaMenu', fontSize: '12px', color: '#ffffff', stroke: '#000000', strokeThickness: 2 }));
      }
      root.add(icon);
      slotView = { area, index, item, icon, originalX: iconX, originalY: y, width, height: GRAPHIC_HEIGHT[item.graphic] ?? asset.frameHeight };
      if (state.pendingLootAction?.mod.area === area && state.pendingLootAction.mod.index === index) pendingModIcon = slotView;
    }
    const zone = scene.add.zone(x, y, 50, 50).setOrigin(0).setInteractive({ useHandCursor: true });
    zone.setName(`loot-${area}-${index}`); zone.setData({ area, index, itemId: item?.id ?? null });
    root.add(zone);
    zone.on('pointerover', (pointer: Phaser.Input.Pointer) => { if (item) showTooltip(item); });
    zone.on('pointerout', () => { if (!carrying) tooltip.hide(); });
    zone.on('pointerdown', (pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      if (modal) return;
      tooltip.hide(); status.setText('');
      if (!carrying) {
        if (!slotView) return;
        carrying = slotView; root.setData('carrying', { area, index });
        root.bringToTop(carrying.icon); proceed.setAlpha(0.6); scene.input.setDefaultCursor('grabbing');
        moveCarried(pointer); tooltip.show(carrying.item);
        if (scene.cache.audio.exists('soundReloaded1')) scene.sound.play('soundReloaded1');
        return;
      }
      if (carrying.area === area && carrying.index === index) { clearCarry(); return; }
      // Успех синхронно уничтожает этот вид: после callback нельзя обращаться к его объектам.
      if (callbacks.move(carrying.area, carrying.index, area, index)) return;
      clearCarry(); message('This item could not be moved to that slot.');
    });
  };

  for (let index = 0; index < 8; index++) {
    const p = slotPosition('offers', index);
    addSlot('offers', index, state.lootOffers[index] ?? null, p.x, p.y);
  }
  // procLootMenu: (140 + column*50, 224 + row*48); сдвиг окна y=-26 уже запечён в панель.
  for (let index = 0; index < state.inventory.length; index++) {
    const p = slotPosition('inventory', index);
    addSlot('inventory', index, state.inventory[index] ?? null, p.x, p.y);
  }
  if (pendingModIcon && state.pendingLootAction) {
    const target = slotPosition(state.pendingLootAction.gun.area, state.pendingLootAction.gun.index);
    // invDrag переносит только иконку поверх оружия до showDialog; записи ещё не меняются.
    pendingModIcon.icon.setPosition(target.x - (pendingModIcon.width - 48) / 2 - 4, target.y).setName('loot-pending-mod-icon');
    root.bringToTop(pendingModIcon.icon);
  }

  const proceed = image('button_proceed', 271, 301).setInteractive(buttonInput(manifest.images.button_proceed));
  proceed.setName('loot-proceed');
  proceed.on('pointerover', () => { if (!modal && !carrying && manifest.images.button_proceed_over) proceed.setTexture('button_proceed_over'); });
  proceed.on('pointerout', () => proceed.setTexture('button_proceed'));
  proceed.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
    event.stopPropagation();
    if (modal) return;
    if (carrying) { clearCarry(); tooltip.hide(); return; }
    callbacks.proceed();
  });
  root.bringToTop(status); root.bringToTop(tooltip.root);
  if (modal) {
    // Компенсируем только сдвиг родителя: оригинальный диалог всегда находится в (0,0) stage.
    root.add(createModConfirmation(scene, manifest, dialog, callbacks.resolveModMount, 'loot-mod').setX(-MENU_X));
  }
  scene.input.on('pointermove', moveCarried);
  root.once(Phaser.GameObjects.Events.DESTROY, () => {
    scene.input.off('pointermove', moveCarried);
    scene.input.setDefaultCursor('default');
  });
  return root;
}

// Исходные границы рисунка и поля num, без фильтров; для высоты учтено num.y = 2.
const GRAPHIC_WIDTH: Readonly<Record<number, number>> = {"11": 58.85, "12": 59.85, "13": 79.95, "14": 79.95, "15": 83.95, "16": 51.85, "17": 52.85, "18": 55.85, "19": 60.85, "20": 57.85, "21": 51.85, "22": 56.85, "23": 95.95, "24": 59.85, "25": 62.85, "26": 79.95, "27": 89.95, "28": 67.85, "29": 69.95, "30": 79.95, "31": 69.95, "32": 84.95, "33": 63.85, "34": 63.85, "35": 52.8, "36": 62.35, "37": 75.95, "38": 60.3, "39": 52.85, "40": 48.85, "41": 57.85, "42": 59.85, "43": 49.85, "44": 69.95, "45": 54.4, "46": 79.95, "47": 53.8, "48": 79.95, "49": 79.95, "50": 60.0, "111": 55.35, "112": 50.85, "113": 52.3, "114": 50.85, "115": 56.85, "116": 54.85, "117": 50.85, "118": 50.85, "119": 53.85, "120": 51.3, "122": 58.35, "123": 64.95, "124": 52.35, "125": 67.95, "126": 62.8, "127": 51.3, "130": 61.85, "131": 60.85};
const GRAPHIC_HEIGHT: Readonly<Record<number, number>> = {"11": 32.95, "12": 42.0, "13": 50.95, "14": 42.95, "15": 41.95, "16": 44.95, "17": 51.95, "18": 36.95, "19": 36.95, "20": 39.95, "21": 36.6, "22": 34.95, "23": 40.95, "24": 39.95, "25": 34.95, "26": 52.95, "27": 53.95, "28": 35.95, "29": 43.95, "30": 35.95, "31": 52.95, "32": 44.95, "33": 43.95, "34": 42.95, "35": 63.95, "36": 45.45, "37": 47.95, "38": 38.5, "39": 42.95, "40": 50.95, "41": 35.95, "42": 43.95, "43": 38.95, "44": 39.95, "45": 36.95, "46": 50.95, "47": 47.95, "48": 50.95, "49": 51.0, "50": 54.0, "111": 52.95, "112": 41.95, "113": 38.0, "114": 43.95, "115": 40.95, "116": 38.0, "117": 46.95, "118": 46.95, "119": 44.95, "120": 38.0, "122": 41.95, "123": 65.95, "124": 40.95, "125": 63.95, "126": 58.95, "127": 37.95, "130": 36.95, "131": 45.95};
