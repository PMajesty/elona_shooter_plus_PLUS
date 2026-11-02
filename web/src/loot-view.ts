import Phaser from 'phaser';
import { ITEM_TYPE, isOccupiedItem, itemPrice, type Item } from './items.ts';
import { createModConfirmation, type ModConfirmationLayout } from './mod-confirmation-view.ts';

export type LootArea = 'offers' | 'inventory';
export interface LootViewState {
  inventory: (Item | null)[]; lootOffers: (Item | null)[]; bossKilled?: number;
  pendingLootAction: { kind: 'mod'; mod: { area: LootArea; index: number }; gun: { area: LootArea; index: number } } | null;
}
export interface LootViewManifest {
  images: Record<string, { originX: number; originY: number; width: number; height: number }>;
  clips: Record<string, { originX: number; originY: number; frameWidth: number; frameHeight: number }>;
}
export interface LootViewCallbacks {
  move(fromArea: LootArea, from: number, toArea: LootArea, to: number): boolean;
  proceed(): void;
  resolveModMount(confirm: boolean): void;
  message?(text: string): void;
}

const MENU_X = -15.587619764971691;

function detail(item: Item): string {
  if (item.type === ITEM_TYPE.mod) return `A modification device that can be mounted on a weapon. ${MOD_DETAILS[item.mod] ?? ''}`;
  if (item.id === 11) return `[Usable] When thrown to the ground, it exlodes and deals ${item.attack} damage to all enemies surrounding it.`;
  if (item.id === 12) return `[Usable] Repairs ${item.attack} points of castle HP when used. It's a life saver but has long recharge time.`;
  if (item.id === 35) return `A special token. When dragged onto a shop item, the item get discounted by ${item.attack} gp. Use it wisely!`;
  return ITEM_DETAILS[item.id] ?? '';
}

function stats(item: Item): string {
  const lines = [`Sale value: ${itemPrice(item)} GP`];
  if (item.type === ITEM_TYPE.gun) {
    const trait: Record<number, string> = { 103: 'Small gun', 104: 'Rifle', 105: 'Shotgun', 106: 'Big gun' };
    const unlimited = item.ammoMax === 1 && item.id !== 27;
    // Подсказка сохраняет формулу оригинального интерфейса, а не заменяет таймер симуляции.
    const reload = unlimited ? '-' : `${Math.trunc(item.reloadTimeMax * 1000 / 30)}ms${item.manualReload ? '(M)' : ''}`;
    lines.push(`Damage: ${item.attack}${item.shell > 1 ? ` x${item.shell}` : ''}    Ammo: ${unlimited ? '-' : item.ammoMax}`);
    lines.push(`Air: ${item.dmgAir}%    Armor: ${item.dmgArmor}%`);
    lines.push(`Accuracy: ${item.baseAccuracy}    Rate: ${Math.trunc(300 / (1000 / item.shootRate)) / 10}/sec`);
    lines.push(`Reload: ${reload}    Mods: ${item.mod}/${item.modMax}`);
    lines.push(`Required: ${trait[item.reqTrait!] ?? 'Weapon skill'} ${item.reqLv}`);
    lines.push(item.modText || 'No Modification');
    if (item.livingWeapon > 0) lines.push(`It's alive(Exp: ${Math.trunc((1 - item.livingWeapon / (25 * 2 ** item.modMax)) * 100)}%)`);
  } else {
    if (item.type === ITEM_TYPE.use && item.ammoMax > 0) lines.push(`Uses remaining: ${item.ammo}`);
    if (detail(item)) lines.push(detail(item));
  }
  return lines.join('\n');
}

/** Исходный выбор двумя нажатиями: взять предмет, затем указать ячейку назначения. */
export function createLootView(scene: Phaser.Scene, state: LootViewState, manifest: LootViewManifest, callbacks: LootViewCallbacks,
  dialog: ModConfirmationLayout, mode: 'ordinary' | 'boss' = 'ordinary'): Phaser.GameObjects.Container {
  const root = scene.add.container(MENU_X, 0);
  const modal = state.pendingLootAction !== null;
  root.setName(mode === 'boss' ? 'boss-loot-view' : 'ordinary-loot-view').setData('pendingLootAction', state.pendingLootAction);
  const text = (x: number, y: number, value: string, size = 13, color = '#322316') => {
    const object = scene.add.text(x, y, value, { fontFamily: 'ElonaMenu', fontSize: `${size}px`, color, padding: { x: 1, y: 1 } });
    root.add(object); return object;
  };
  const image = (key: string, x: number, y: number) => {
    const asset = manifest.images[key];
    const object = scene.add.image(x - asset.originX, y - asset.originY, key).setOrigin(0);
    root.add(object); return object;
  };
  image(mode === 'boss' ? 'lootBoss' : 'loot', 0, 0);
  if (mode === 'boss') text(295, 78, `You've successfully killed ${state.bossKilled ?? 0} boss(es) therefore received some prizes!`, 12).setWordWrapWidth(238);
  const background = scene.add.zone(-MENU_X, 0, 620, 380).setOrigin(0).setInteractive();
  root.add(background);
  // Второй исходный ряд занимает прежнюю полосу подсказки порта; сообщение остаётся под canvas.
  const status = text(140, 262, '', 12, '#8e2f20').setWordWrapWidth(390).setVisible(state.inventory.length <= 8);
  const message = (value: string) => { status.setText(value); callbacks.message?.(value); };

  const tooltip = scene.add.container(0, 0).setVisible(false);
  const tooltipPlate = scene.add.rectangle(0, 0, 292, 40, 0xeee0bb, 0.98).setOrigin(0).setStrokeStyle(1, 0x6b5638);
  const tooltipName = scene.add.text(9, 6, '', { fontFamily: 'ElonaMenu', fontSize: '16px', color: '#20170e', wordWrap: { width: 274 } });
  const tooltipStats = scene.add.text(9, 28, '', { fontFamily: 'ElonaMenu', fontSize: '12px', color: '#322316', wordWrap: { width: 274 } }).setLineSpacing(2);
  tooltip.add([tooltipPlate, tooltipName, tooltipStats]); root.add(tooltip);

  interface SlotView { area: LootArea; index: number; item: Item; icon: Phaser.GameObjects.Container; originalX: number; originalY: number; width: number; height: number }
  let carrying: SlotView | undefined;
  let pendingModIcon: SlotView | undefined;
  const slotPosition = (area: LootArea, index: number) => area === 'offers'
    ? { x: 140 + index * 50, y: 129 }
    : { x: 140 + index % 8 * 50, y: 198 + Math.floor(index / 8) * 48 };
  const point = new Phaser.Math.Vector2();
  const localPointer = (pointer: Phaser.Input.Pointer) => root.getWorldTransformMatrix().applyInverse(pointer.worldX, pointer.worldY, point);
  const showTooltip = (item: Item, pointer: Phaser.Input.Pointer) => {
    if (carrying || modal) return;
    tooltipName.setText(item.name).setColor(item.lv > 1 ? '#0000cc' : '#20170e');
    tooltipStats.setText(stats(item)).setY(tooltipName.y + tooltipName.height + 4);
    const height = tooltipStats.y + tooltipStats.height + 8;
    tooltipPlate.setSize(292, height);
    const p = localPointer(pointer);
    const x = Math.max(-MENU_X + 4, Math.min(p.x + 14, 620 - MENU_X - 296));
    const y = Math.max(4, Math.min(p.y + 16, 376 - height));
    tooltip.setPosition(x, y).setVisible(true); root.bringToTop(tooltip);
  };
  const clearCarry = () => {
    if (!carrying) return;
    carrying.icon.setPosition(carrying.originalX, carrying.originalY);
    carrying = undefined; root.setData('carrying', null);
    proceed.setAlpha(1); scene.input.setDefaultCursor('default');
  };
  const moveCarried = (pointer: Phaser.Input.Pointer) => {
    if (!carrying) return;
    const p = localPointer(pointer);
    carrying.icon.setPosition(p.x - carrying.width / 2, p.y - carrying.height / 2);
  };

  background.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
    event.stopPropagation();
    if (modal) return;
    clearCarry(); tooltip.setVisible(false); status.setText('');
  });

  const addSlot = (area: LootArea, index: number, item: Item | null, x: number, y: number) => {
    if (!isOccupiedItem(item)) item = null;
    const slotAsset = manifest.clips.inventorySlot;
    const slot = scene.add.image(x - slotAsset.originX, y - slotAsset.originY, 'inventorySlot', '1').setOrigin(0);
    root.add(slot);
    if (area === 'inventory' && index < 5) text(x + 6, y + 29.4, String(index + 1), 12, '#77664d');
    let slotView: SlotView | undefined;
    if (item) {
      const asset = manifest.clips.itemPicture;
      const width = GRAPHIC_WIDTH[item.graphic] ?? asset.frameWidth;
      const iconX = x - (width - 48) / 2 - 4;
      const icon = scene.add.container(iconX, y);
      const frame = scene.textures.get('itemPicture').has(String(item.graphic)) ? String(item.graphic) : '1';
      icon.add(scene.add.image(-asset.originX, -asset.originY, 'itemPicture', frame).setOrigin(0));
      if (item.type === ITEM_TYPE.use && item.ammoMax > 0) {
        icon.add(scene.add.text(30.95, 2, `x ${item.ammo}`, { fontFamily: 'ElonaMenu', fontSize: '12px', color: '#ffffff', stroke: '#000000', strokeThickness: 2 }));
      }
      root.add(icon);
      slotView = { area, index, item, icon, originalX: iconX, originalY: y, width, height: GRAPHIC_HEIGHT[item.graphic] ?? asset.frameHeight };
      if (state.pendingLootAction?.mod.area === area && state.pendingLootAction.mod.index === index) pendingModIcon = slotView;
    }
    const zone = scene.add.zone(x, y, 50, 50).setOrigin(0).setInteractive({ useHandCursor: true });
    zone.setName(`loot-${area}-${index}`); zone.setData({ area, index, itemId: item?.id ?? null });
    root.add(zone);
    zone.on('pointerover', (pointer: Phaser.Input.Pointer) => { if (item) showTooltip(item, pointer); });
    zone.on('pointerout', () => { if (!carrying) tooltip.setVisible(false); });
    zone.on('pointerdown', (pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      if (modal) return;
      tooltip.setVisible(false); status.setText('');
      if (!carrying) {
        if (!slotView) return;
        carrying = slotView; root.setData('carrying', { area, index });
        root.bringToTop(carrying.icon); proceed.setAlpha(0.6); scene.input.setDefaultCursor('grabbing');
        moveCarried(pointer);
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

  const proceed = image('button_proceed', 271, 301).setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 100 });
  proceed.setName('loot-proceed');
  proceed.on('pointerover', () => { if (!modal && !carrying && manifest.images.button_proceed_over) proceed.setTexture('button_proceed_over'); });
  proceed.on('pointerout', () => proceed.setTexture('button_proceed'));
  proceed.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
    event.stopPropagation();
    if (modal) return;
    if (carrying) { clearCarry(); tooltip.setVisible(false); return; }
    callbacks.proceed();
  });
  root.bringToTop(status); root.bringToTop(tooltip);
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

// Оригинальные английские описания getItemDetail и encRef.
const ITEM_DETAILS: Readonly<Record<number, string>> = {
  "6": "Fur skinned from a dead animal. You can sell it for money.",
  "7": "An armor looted from a dead soldier. You can sell it for some money.",
  "28": "Yummy rat roast. You can sell it for money.",
  "29": "A helmet looted from a dead soldier. You can sell it for some money.",
  "30": "A beautiful feather of some bird. You can sell it for some money.",
  "31": "A piece of meat of some animal or whatever. You can sell it for some money.",
  "32": "Taken from a destroyed machine. Contains some rare metals. You can sell it for some money.",
  "33": "A bottle of insect blood. You can sell it for some money.",
  "34": "Carefully taken from a dead dragon. You can sell it for some money.",
  "37": "[Usable] A special artifact of Jure, Goddess of Healing. Her blessing protects your castle from enemies for a short period.",
  "38": "[Usable] A special artifact. The ancient sword is called Ragnarok for a reason.",
  "101": "\"These guy's do two thing's well, feasting on food bought with their hard earned gold... And earning their gold.\"",
  "102": "\"One day these guy's just showed up shooting... That make's them party crashers and they must be treated accordingly!\"",
  "103": "\"Something seems to have scared the sheep all in your direction, they are not damaging \"Your castle\" intentionally but... You don't care you kill them anyway.\"",
  "104": "\"One night you saw one trip on a rock and then blow up... Now there's a whole army of them!\"",
  "105": "\"Unfortunately you do not carry insurance against damage from these weapons, also unfortunate is the fact that during your recent tax audit they were mistaken as yours and your taxes have been raised accordingly.\"",
  "106": "\"They eat Dragonflies, Dragonflies have taken up residence in your castle...\"",
  "107": "\"Apparently the rat's came over in ships... From the stench you can guess why they left.\"",
  "108": "\"Oddly enough these zealots just showed up and attacked you, you just assume they want to meet their maker sooner.\"",
  "109": "\"An underground spider known to like peace and quiet, how sad for it because you produce neither.\"",
  "110": "\"These insects are in brooding season and are looking for a place to nest... Apparently they've taken a liking to your younger sister.\"",
  "112": "\"You don't know where these came from but by the look's of them it's probably safe to say you've ticked off Mani of Machine.\"",
  "113": "\"Some guy from Vernis showed up the other night and killed a Bard...\"",
  "114": "\"Well with as much killing as you have been doing lately Someone was bound to hold a grudge.\"",
  "115": "\"Some guy from Vernis showed up the other night and killed a Bard...\"",
  "116": "\"Apparently this is just a Juere prototype related to a bigger project, the fact that it's causing you nuisance is purely coincidental.\"",
  "117": "\"These monster's chew through anything. Seems they've eaten everything on the way and the castle food supplies are kinda low...\""
};
const MOD_DETAILS: Readonly<Record<number, string>> = {
  "0": "This mod increases the base accuracy of a weapon.",
  "1": "This mod increases the base accuracy of a weapon.",
  "2": "This mod speeds up the reloading time of a weapon.",
  "3": "This mod improves the firing rate of a weapon. For weapons with a very high firing rate, its effect may be less than satisfactory.",
  "4": "This mod enchances the damage output of a weapon.",
  "5": "This mod adds anti-air capability to a weapon.",
  "6": "This mod adds anti-armor capability to a weapon.",
  "7": "This mod inreases the ammo capacity of a weapon.",
  "8": "This mod grants a weapon an ability to knock back enemies.",
  "9": "This mod grants a weapon an ability to convert inflicted damage to the castle HP.",
  "10": "This handy mod automatically refills your ammo when you're not shooting. Only works on manual reloading guns.",
  "11": "Once mounted, your weapon will be parasitized by this rare creature and slowly develop unique powers.",
  "12": "This handy mod gives auto-fire function to a weapon when mounted. It also boosts the firing rate. For weapons with a very high firing rate, its effect may be less than satisfactory.",
  "13": "This mod reduces the impact of weapon recoil on accuracy."
};
