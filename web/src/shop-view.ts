import { localizedImage } from './localized-image.ts';
import { localizedText, fitLocalizedText } from './localized-text.ts';
import { buttonInput } from './button-input.ts';
import { createItemPopupView, type ItemPopupLayout } from './item-popup-view.ts';
import type { ItemPopupInfo } from './item-popup-values.ts';
import Phaser from 'phaser';
import { ITEM_TYPE, isOccupiedItem, itemPrice, type Item } from './items.ts';
import type { LootViewManifest } from './loot-view.ts';
import { createTownNpc } from './town-npc.ts';
import { createModConfirmation } from './mod-confirmation-view.ts';

interface Placement {
  x: number; y: number; scaleX: number; scaleY: number; rotationDegrees: number;
  text?: { fontId: number; fontSize: number; bounds: number[]; align: number; color: string };
}
export interface ShopLayout {
  menuPosition: { x: number; y: number };
  shop: {
    image: string; refreshLabelsImage: string; upgradeLabelsImage: string; children: Record<string, Placement>;
    slots: {
      stock: { count: number; x: number; y: number; columns: number; stepX: number };
      inventory: { initialCount: number; x: number; y: number; columns: number; stepX: number; stepY: number };
    };
  };
  inventorySlot: { children: Record<string, Placement> };
  saleDialog: { image: string; children: Record<string, Placement> };
  itemPopup: ItemPopupLayout;
}
type EquipmentAction = { kind: 'upgrade'; slot: number; cost: number } | { kind: 'mod'; modSlot: number; gunSlot: number };
export interface ShopViewState {
  inventory: readonly (Item | null)[];
  shop: readonly (Item | null)[];
  gold: number;
  traits: Readonly<Record<number, number>>;
  ap: number;
  pendingTownAction: EquipmentAction | null;
  upgradeReference: Item | null;
}
export interface ShopViewCallbacks {
  itemPopup?(info: ItemPopupInfo | null): void;
  refreshStock?(): void;
  buy(stock: number, inventory: number): boolean;
  swap(from: number, to: number): boolean;
  requestSell(index: number): void;
  confirmSell(index: number): boolean;
  cancelSale(): void;
  message(text: string): void;
  close?(): void;
  applyToken?(inventory: number, stock: number): boolean;
  beginUpgradeSelection(): void;
  cancelUpgradeSelection(): void;
  requestUpgrade(slot: number): void;
  requestModMount(modSlot: number, gunSlot: number): void;
  resolveEquipment(confirm: boolean): void;
}
type Area = 'stock' | 'inventory';
const HINT = 'Drop an item on an empty space to sell the item.';
const SKILL_WARNING = "*You don't have the required skill to use the weapon.";

/** Два нажатия выбирают источник и назначение; состояние предметов меняют только callbacks. */
export function createShopView(scene: Phaser.Scene, state: ShopViewState, manifest: LootViewManifest, layout: ShopLayout, callbacks: ShopViewCallbacks, saleIndex: number | null = null, upgradeSelecting = false): Phaser.GameObjects.Container {
  const root = scene.add.container(0, 0).setName('shop-view');
  const pending = state.pendingTownAction;
  const modal = pending !== null || saleIndex !== null;
  root.setData({ carrying: null, saleIndex, upgradeSelecting, pendingTownAction: pending });
  const menu = layout.menuPosition, panel = layout.shop;
  const image = (key: string, x = 0, y = 0, placement?: Placement) => {
    const asset = manifest.images[key];
    const object = localizedImage(scene, x, y, key).setOrigin(asset.originX / asset.width, asset.originY / asset.height);
    if (placement) object.setScale(placement.scaleX, placement.scaleY).setAngle(placement.rotationDegrees);
    else object.setDisplaySize(asset.width, asset.height);
    root.add(object); return object;
  };
  const text = (placement: Placement, value: string, x = 0, y = 0) => {
    const field = placement.text!;
    const fonts: Record<number, string> = { 682: 'ElonaMenu', 1608: 'ElonaMenuBold', 2681: 'ElonaHud', 1392: 'ElonaSmall', 1535: 'ui', 2116: 'Arial' };
    const width = field.bounds[2] - field.bounds[0];
    const object = localizedText(scene, x + placement.x, y + placement.y, value, {
      resolution: 2, fontFamily: fonts[field.fontId] ?? 'Arial', fontSize: `${field.fontSize}px`, color: field.color,
      wordWrap: { width }, align: field.align === 2 ? 'center' : 'left', padding: { x: 1, y: 1 },
    }).setFixedSize(width, 0).setScale(placement.scaleX, placement.scaleY).setAngle(placement.rotationDegrees);
    if (field.color === '#ffffff') object.setShadow(1, 1, '#000000', 2);
    fitLocalizedText(object, { width, height: field.bounds[3] - field.bounds[1] });
    root.add(object); return object;
  };
  const button = (key: string, placement: Placement, action: () => void, x = 0, y = 0, enabled = true) => {
    const object = image(key, x + placement.x, y + placement.y, placement).setName(key);
    object.setAlpha(enabled ? 1 : 0.35).setInteractive(buttonInput(manifest.images[key], enabled));
    if (enabled) {
      object.on('pointerover', () => { if (manifest.images[`${key}_over`]) object.setTexture(`${key}_over`); });
      object.on('pointerout', () => object.setTexture(key));
    }
    object.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => { event.stopPropagation(); action(); });
    return object;
  };
  // Сдвиг y уже запечён в исходную панель; отдельные элементы используют оба смещения.
  image(panel.image, menu.x, 0);
  const npc = createTownNpc(scene, manifest, 'shop', menu.x, menu.y); if (npc) root.add(npc);
  const status = text(panel.children.hint2, HINT, menu.x, menu.y).setName('shop-hint');
  const warning = text(panel.children.warning, '', menu.x, menu.y).setName('shop-skill-warning');
  const message = (value: string) => { status.setText(value); callbacks.message(value); };
  const needsSkill = (item: Item) => item.type === ITEM_TYPE.gun && (state.traits[item.reqTrait!] ?? 0) < (item.reqLv ?? 0);
  if (upgradeSelecting) text(panel.children.actHelp, 'Choose a weapon to upgrade. Click nowhere to cancel.', menu.x, menu.y).setName('shop-upgrade-help');

  const tooltip = createItemPopupView(scene, manifest, layout.itemPopup, state.traits, callbacks.itemPopup);
  tooltip.root.setPosition(menu.x + panel.children.popup.x, menu.y + panel.children.popup.y); root.add(tooltip.root);

  interface SlotView { area: Area; index: number; item: Item; icon: Phaser.GameObjects.Container; originalX: number; originalY: number; width: number; height: number }
  let carrying: SlotView | undefined;
  let pendingModIcon: SlotView | undefined;
  const ownedSlots: { item: Item | null; plate: Phaser.GameObjects.Image }[] = [];
  const point = new Phaser.Math.Vector2();
  const localPointer = (pointer: Phaser.Input.Pointer) => root.getWorldTransformMatrix().applyInverse(pointer.worldX, pointer.worldY, point);
  const showTooltip = (item: Item) => {
    if (carrying || modal) return;
    warning.setText(needsSkill(item) ? SKILL_WARNING : ''); tooltip.show(item);
  };
  const clearCarry = () => {
    if (carrying) carrying.icon.setPosition(carrying.originalX, carrying.originalY);
    carrying = undefined; root.setData('carrying', null);
    for (const slot of ownedSlots) slot.plate.setAlpha(1);
    warning.setText(''); tooltip.hide(); scene.input.setDefaultCursor('default');
  };
  const moveCarried = (pointer: Phaser.Input.Pointer) => {
    if (!carrying) return;
    const p = localPointer(pointer);
    carrying.icon.setPosition(p.x - carrying.width / 2, p.y - carrying.height / 2);
  };
  const dropOutside = (): boolean => {
    if (!carrying) { tooltip.hide(); warning.setText(''); return false; }
    const source = carrying; clearCarry();
    if (source.area === 'inventory') callbacks.requestSell(source.index);
    return true;
  };
  button('button_windowClose', panel.children.closeButton, () => { if (upgradeSelecting) callbacks.cancelUpgradeSelection(); else if (!dropOutside()) callbacks.close?.(); }, menu.x, menu.y);
  button('button_shopRefresh', panel.children.act1, () => { if (upgradeSelecting) callbacks.cancelUpgradeSelection(); else if (!dropOutside()) callbacks.refreshStock?.(); }, menu.x, menu.y, Boolean(callbacks.refreshStock) && state.ap >= 2);
  button('button_shopUpgrade', panel.children.act2, () => { if (!dropOutside()) callbacks.beginUpgradeSelection(); }, menu.x, menu.y, state.ap >= 4);
  image(panel.refreshLabelsImage, menu.x, 0).setAlpha(state.ap >= 2 ? 1 : 0.35);
  image(panel.upgradeLabelsImage, menu.x, 0).setAlpha(state.ap >= 4 ? 1 : 0.35);

  const addSlot = (area: Area, index: number, rawItem: Item | null, x: number, y: number) => {
    const item = isOccupiedItem(rawItem) ? rawItem : null;
    if (area === 'stock' && !item) return;
    const slotAsset = manifest.clips.inventorySlot;
    const plate = localizedImage(scene, x - slotAsset.originX, y - slotAsset.originY, 'inventorySlot', '1').setOrigin(0);
    root.add(plate);
    if (upgradeSelecting && (area === 'stock' || item?.type !== ITEM_TYPE.gun)) plate.setAlpha(0.5);
    if (area === 'inventory') {
      ownedSlots.push({ item, plate });
      if (index < 5) text(layout.inventorySlot.children.shortNum, String(index + 1), x, y);
    }
    if (area === 'stock' && item) {
      const coin = manifest.clips.shopCoin, p = layout.inventorySlot.children.coin;
      root.add(localizedImage(scene, x + p.x - coin.originX, y + p.y - coin.originY, 'shopCoin', '1').setOrigin(0));
      const price = itemPrice(item, true);
      text(layout.inventorySlot.children.cost, String(price), x, y).setColor(price <= state.gold ? '#0000cc' : '#cc0000').setName(`shop-price-${index}`);
    }
    let slotView: SlotView | undefined;
    if (item) {
      const asset = manifest.clips.itemPicture;
      const width = GRAPHIC_WIDTH[item.graphic] ?? asset.frameWidth;
      const iconX = x - (width - 48) / 2 - 4;
      const icon = scene.add.container(iconX, y);
      icon.add(localizedImage(scene, -asset.originX, -asset.originY, 'itemPicture', String(item.graphic)).setOrigin(0));
      if (item.type === ITEM_TYPE.use && item.ammoMax > 0) icon.add(localizedText(scene, 30.95, 2, `x ${item.ammo}`, { resolution: 2, fontFamily: 'ElonaMenu', fontSize: '12px', color: '#ffffff', stroke: '#000000', strokeThickness: 2 }));
      root.add(icon);
      slotView = { area, index, item, icon, originalX: iconX, originalY: y, width, height: GRAPHIC_HEIGHT[item.graphic] ?? asset.frameHeight };
      if (pending?.kind === 'mod' && area === 'inventory' && pending.modSlot === index) pendingModIcon = slotView;
    }
    const zone = scene.add.zone(x, y, 50, 50).setOrigin(0).setInteractive({ useHandCursor: true });
    zone.setName(`shop-${area}-${index}`).setData({ area, index, itemId: item?.id ?? null }); root.add(zone);
    zone.on('pointerover', (pointer: Phaser.Input.Pointer) => { if (item) showTooltip(item); });
    zone.on('pointerout', () => { if (!carrying) { tooltip.hide(); warning.setText(''); } });
    zone.on('pointerdown', (pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      if (modal) return;
      tooltip.hide(); status.setText(HINT);
      if (upgradeSelecting) {
        if (area === 'inventory' && item?.type === ITEM_TYPE.gun) callbacks.requestUpgrade(index);
        else callbacks.cancelUpgradeSelection();
        return;
      }
      if (!carrying) {
        if (!slotView) return;
        carrying = slotView; root.setData('carrying', { area, index });
        for (const slot of ownedSlots) slot.plate.setAlpha(area === 'stock' && slot.item ? 0.5 : 1);
        warning.setText(needsSkill(slotView.item) ? SKILL_WARNING : '');
        root.bringToTop(carrying.icon); scene.input.setDefaultCursor('grabbing'); moveCarried(pointer); tooltip.show(carrying.item);
        if (scene.cache.audio.exists('soundReloaded1')) scene.sound.play('soundReloaded1');
        return;
      }
      const source = carrying;
      if (source.area === area && source.index === index) { clearCarry(); return; }
      if (area === 'stock') {
        if (source.area === 'inventory' && source.item.type === ITEM_TYPE.token) {
          clearCarry();
          if (callbacks.applyToken) callbacks.applyToken(source.index, index);
          else message('Applying Shop Tokens is not available yet. The token has been kept.');
          return;
        }
        dropOutside(); return;
      }
      if (source.area === 'stock' && item) {
        clearCarry(); message('Choose an empty inventory slot to buy this item.'); return;
      }
      if (source.area === 'inventory' && source.item.type === ITEM_TYPE.mod && item?.type === ITEM_TYPE.gun) {
        clearCarry(); callbacks.requestModMount(source.index, index); return;
      }
      clearCarry();
      // Callback может синхронно уничтожить вид; после него не трогаем графические объекты.
      if (source.area === 'stock') callbacks.buy(source.index, index);
      else callbacks.swap(source.index, index);
    });
  };
  const stock = panel.slots.stock, inventory = panel.slots.inventory;
  for (let index = 0; index < stock.count; index++) addSlot('stock', index, state.shop[index] ?? null, menu.x + stock.x + index % stock.columns * stock.stepX, menu.y + stock.y);
  for (let index = 0; index < state.inventory.length; index++) addSlot('inventory', index, state.inventory[index], menu.x + inventory.x + index % inventory.columns * inventory.stepX, menu.y + inventory.y + Math.floor(index / inventory.columns) * inventory.stepY);
  if (pendingModIcon && pending?.kind === 'mod') {
    const x = menu.x + inventory.x + pending.gunSlot % inventory.columns * inventory.stepX;
    const y = menu.y + inventory.y + Math.floor(pending.gunSlot / inventory.columns) * inventory.stepY;
    // Исходная перетаскиваемая иконка остаётся над целью, а не в своей старой ячейке.
    pendingModIcon.icon.setPosition(x - (pendingModIcon.width - 48) / 2 - 4, y).setName('shop-pending-mod-icon');
    root.bringToTop(pendingModIcon.icon);
  }
  root.bringToTop(status); root.bringToTop(warning); root.bringToTop(tooltip.root);

  const itemComparison = (item: Item, placement: Placement, label: string) => {
    const comparison = createItemPopupView(scene, manifest, layout.itemPopup, state.traits, undefined, `shop-upgrade-${label}`);
    comparison.root.setPosition(placement.x, placement.y); root.add(comparison.root); comparison.show(item);
  };
  if (pending?.kind === 'mod') {
    root.add(createModConfirmation(scene, manifest, layout.saleDialog, callbacks.resolveEquipment, 'shop-equipment'));
  } else if (pending) {
    const dialog = layout.saleDialog;
    image(dialog.image);
    const question = `It costs you ${pending.cost} gp. Really upgrade the weapon?`;
    text(dialog.children.question, question).setName('shop-equipment-question');
    const before = state.inventory[pending.slot], after = state.upgradeReference;
    if (isOccupiedItem(before) && isOccupiedItem(after)) {
      itemComparison(before, dialog.children.pop1, 'before');
      itemComparison(after, dialog.children.pop2, 'after');
      const placement = dialog.children.poparrow, asset = manifest.clips.shopUpgradeArrow;
      root.add(localizedImage(scene, placement.x, placement.y, 'shopUpgradeArrow', '1')
        .setOrigin(asset.originX / asset.frameWidth, asset.originY / asset.frameHeight)
        .setScale(placement.scaleX, placement.scaleY).setAngle(placement.rotationDegrees));
    }
    // Отмена Upgrade сохраняет уже созданный вариант, не возвращая потраченные броски RNG.
    const dismiss = scene.add.zone(0, 0, 620, 380).setOrigin(0).setInteractive(); root.add(dismiss);
    dismiss.setName('shop-equipment-cancel-background');
    dismiss.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => { event.stopPropagation(); callbacks.resolveEquipment(false); });
    button('button_dialogNo', dialog.children.no, () => callbacks.resolveEquipment(false)).setName('shop-equipment-no');
    button('button_dialogYes', dialog.children.yes, () => callbacks.resolveEquipment(true)).setName('shop-equipment-yes');
  } else if (saleIndex !== null) {
    const item = state.inventory[saleIndex], dialog = layout.saleDialog;
    image(dialog.image);
    if (isOccupiedItem(item)) text(dialog.children.question, `Do you really want to sell it for ${itemPrice(item)} gold?`);
    // Подтверждает только Yes; вся остальная сцена, включая кнопку No, отменяет продажу.
    const dismiss = scene.add.zone(0, 0, 620, 380).setOrigin(0).setInteractive(); root.add(dismiss);
    dismiss.setName('shop-sale-cancel-background');
    dismiss.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => { event.stopPropagation(); callbacks.cancelSale(); });
    button('button_dialogNo', dialog.children.no, callbacks.cancelSale).setName('shop-sale-no');
    if (isOccupiedItem(item)) button('button_dialogYes', dialog.children.yes, () => { callbacks.confirmSell(saleIndex); }).setName('shop-sale-yes');
  }
  // Общий обработчик не перекрывает городскую навигацию невидимым прямоугольником.
  const outsideClick = () => {
    if (modal) return;
    if (upgradeSelecting) callbacks.cancelUpgradeSelection();
    else dropOutside();
  };
  scene.input.on('pointerdown', outsideClick);
  scene.input.on('pointermove', moveCarried);
  root.once(Phaser.GameObjects.Events.DESTROY, () => {
    scene.input.off('pointerdown', outsideClick); scene.input.off('pointermove', moveCarried);
    if (carrying) scene.input.setDefaultCursor('default');
  });
  return root;
}

// Исходные границы itemPicture и num, без фильтров; общий размер атласа здесь непригоден.
export const GRAPHIC_WIDTH: Readonly<Record<number, number>> = {"11": 58.85, "12": 59.85, "13": 79.95, "14": 79.95, "15": 83.95, "16": 51.85, "17": 52.85, "18": 55.85, "19": 60.85, "20": 57.85, "21": 51.85, "22": 56.85, "23": 95.95, "24": 59.85, "25": 62.85, "26": 79.95, "27": 89.95, "28": 67.85, "29": 69.95, "30": 79.95, "31": 69.95, "32": 84.95, "33": 63.85, "34": 63.85, "35": 52.8, "36": 62.35, "37": 75.95, "38": 60.3, "39": 52.85, "40": 48.85, "41": 57.85, "42": 59.85, "43": 49.85, "44": 69.95, "45": 54.4, "46": 79.95, "47": 53.8, "48": 79.95, "49": 79.95, "50": 60.0, "111": 55.35, "112": 50.85, "113": 52.3, "114": 50.85, "115": 56.85, "116": 54.85, "117": 50.85, "118": 50.85, "119": 53.85, "120": 51.3, "122": 58.35, "123": 64.95, "124": 52.35, "125": 67.95, "126": 62.8, "127": 51.3, "130": 61.85, "131": 60.85};
export const GRAPHIC_HEIGHT: Readonly<Record<number, number>> = {"11": 32.95, "12": 42.0, "13": 50.95, "14": 42.95, "15": 41.95, "16": 44.95, "17": 51.95, "18": 36.95, "19": 36.95, "20": 39.95, "21": 36.6, "22": 34.95, "23": 40.95, "24": 39.95, "25": 34.95, "26": 52.95, "27": 53.95, "28": 35.95, "29": 43.95, "30": 35.95, "31": 52.95, "32": 44.95, "33": 43.95, "34": 42.95, "35": 63.95, "36": 45.45, "37": 47.95, "38": 38.5, "39": 42.95, "40": 50.95, "41": 35.95, "42": 43.95, "43": 38.95, "44": 39.95, "45": 36.95, "46": 50.95, "47": 47.95, "48": 50.95, "49": 51.0, "50": 54.0, "111": 52.95, "112": 41.95, "113": 38.0, "114": 43.95, "115": 40.95, "116": 38.0, "117": 46.95, "118": 46.95, "119": 44.95, "120": 38.0, "122": 41.95, "123": 65.95, "124": 40.95, "125": 63.95, "126": 58.95, "127": 37.95, "130": 36.95, "131": 45.95};
