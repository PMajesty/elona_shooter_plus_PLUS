import Phaser from 'phaser';
import type { LootViewManifest } from './loot-view.ts';
import { ITEM_TYPE, isOccupiedItem, type Item } from './items.ts';
import { castleDamageMultiplier, castleLootMultiplier, castleRepairAmount, castleStorageLevel, castleUpgradeCost, castleUpkeep, type CastleUpgradeKind } from './castle-upgrades.ts';

export type TownTab = 'mission' | 'castle' | 'shop' | 'characters' | 'equipment' | null;
export type TownDialog = 'repair' | 'rest' | 'title' | null;
interface Placement {
  x: number; y: number; scaleX: number; scaleY: number; rotationDegrees: number;
  text?: { fontId: number; fontSize: number; bounds: number[]; align: number; color: string; indent?: number };
}
export interface TownLayout {
  menuPosition: { x: number; y: number };
  rootChildren: Record<string, Placement>;
  navigation: Record<string, Placement & { image: string }>;
  mission: { image: string; labelsImage: string; children: Record<string, Placement> };
  castle: { image: string; labelsImage: string; children: Record<string, Placement> };
  castleUpgrades: { clip: string; children: Record<string, Placement>; x: number; y: number; columns: number; stepX: number; stepY: number;
    names: string[]; disabledAlpha: number; affordableColor: string; unavailableColor: string; pageButtons: string[]; hitRect: number[] };
  repairDialog: { image: string; children: Record<string, Placement> };
  claimTitleAction: { x: number; y: number; cardClip: string; cardFrame: number; cardRotation: number; hoverScale: number; pinClip: string; text: string; children: Record<string, Placement> };
}
interface TownViewState {
  day: number; gold: number; castleHp: number; castleMaxHp: number; title: 0 | 1;
  wallLevel: number; wallFixCount: number; repairmanLevel: number; sandbagLevel: number; looterLevel: number; party: { capacity: 1 | 2 | 3 };
  player: { level: number; exp: number; selectedSlot: number };
  town: { ap: number; preparation: string } | null; inventory: (Item | null)[];
}
interface Callbacks { select(tab: TownTab): void; repair(): void; rest(): void; claimTitle(): void; castleUpgrade(kind: CastleUpgradeKind): void; actionHover(): void; dismiss(): void; message(value: string): void }

/** Городские координаты и повороты берутся из исходного кадра 71 и его окон. */
export function createTownView(scene: Phaser.Scene, state: TownViewState, manifest: LootViewManifest, layout: TownLayout, callbacks: Callbacks, tab: TownTab, dialog: TownDialog): Phaser.GameObjects.Container {
  const root = scene.add.container(0, 0).setName('town-view');
  const image = (key: string, x = 0, y = 0, placement?: Placement) => {
    const asset = manifest.images[key];
    const object = scene.add.image(x, y, key).setOrigin(asset.originX / asset.width, asset.originY / asset.height);
    if (placement) object.setScale(placement.scaleX, placement.scaleY).setAngle(placement.rotationDegrees);
    root.add(object); return object;
  };
  const text = (placement: Placement, value: string, x = 0, y = 0) => {
    const field = placement.text!;
    const fonts: Record<number, string> = { 682: 'ElonaMenu', 1608: 'ElonaMenuBold', 2681: 'ElonaHud', 1392: 'ElonaSmall', 1535: 'ui' };
    const indent = field.indent ?? 0;
    const width = field.bounds[2] - field.bounds[0] - indent;
    const object = scene.add.text(x + placement.x + indent, y + placement.y, value, {
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
  const selected = state.inventory[state.player.selectedSlot];
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
    const enabled = ['mission', 'castle', 'shop', 'chara', 'equip'].includes(name);
    const tab = name === 'chara' ? 'characters' : name === 'equip' ? 'equipment' : name as TownTab;
    button(placement.image, placement, () => enabled ? callbacks.select(tab) : callbacks.message('This town menu is not available in the current port yet.'), 0, 0, enabled);
  }
  if (tab === 'mission' || tab === 'castle') {
    const panel = layout[tab], { x, y } = layout.menuPosition;
    const canRest = state.day < 7 && state.town?.preparation === 'ready';
    // Вертикальный сдвиг уже запечён в статическую панель; её кнопкам он нужен отдельно.
    image(panel.image, x, 0);
    button('button_windowClose', panel.children.closeButton, () => callbacks.select(null), x, y);
    if (tab === 'castle') {
      text(panel.children.unkeep, String(castleUpkeep(state)), x, y);
      button('button_freeRepair', panel.children.act1, callbacks.repair, x, y);
      const tile = layout.castleUpgrades, asset = manifest.clips[tile.clip];
      const notice = 'Trainer and page 2 purchases are not available yet.';
      const hint = text(panel.children.hint2, notice, x, y);
      button(tile.pageButtons[0], panel.children.page1, () => {}, x, y);
      button(tile.pageButtons[1], panel.children.page2, () => callbacks.message('These Castle upgrades are not available yet.'), x, y, false).setAlpha(tile.disabledAlpha);
      // Остальные цены/уровни исходные, но их плитки явно отключены до реализации покупки.
      const levels = [state.wallFixCount, state.wallLevel, state.sandbagLevel, castleStorageLevel(state), state.party.capacity, state.looterLevel, state.repairmanLevel, 0];
      const costs = [castleUpgradeCost('fix-wall', state), castleUpgradeCost('wall', state), castleUpgradeCost('sandbag', state),
        castleUpgradeCost('storage', state), castleUpgradeCost('house', state), castleUpgradeCost('looter', state), castleUpgradeCost('repairman', state), 250];
      tile.names.forEach((name, index) => {
        const kind: CastleUpgradeKind | undefined = index === 0 ? 'fix-wall' : index === 1 ? 'wall' : index === 2 ? 'sandbag' : index === 3 ? 'storage' : index === 4 ? 'house' : index === 5 ? 'looter' : index === 6 ? 'repairman' : undefined;
        const possible = Boolean(kind && costs[index] > 0 && state.gold >= costs[index]);
        const tileX = x + tile.x + index % tile.columns * tile.stepX;
        const tileY = y + tile.y + Math.floor(index / tile.columns) * tile.stepY;
        const group = scene.add.container(tileX, tileY).setName(`castle-upgrade-${index}`).setAlpha(possible ? 1 : tile.disabledAlpha);
        root.add(group);
        const upFrame = index * 2 + 1;
        const art = scene.add.image(0, 0, tile.clip, String(upFrame))
          .setOrigin(asset.originX / asset.frameWidth, asset.originY / asset.frameHeight);
        // Счётчик Fix Wall сохраняется, но исходный индекс0 никогда не показывает суффикс уровня.
        const label = text(tile.children.upgradeName, name + (index !== 0 && levels[index] > 0 ? ` Lv ${levels[index]}` : ''));
        const cost = text(tile.children.upgradeCost, String(costs[index])).setColor(possible ? tile.affordableColor : tile.unavailableColor);
        group.add([art, label, cost]);
        const description = kind === 'fix-wall' ? 'This will completely fix the castle wall.'
          // Сохраняем порядок Number-арифметики и int исходного текста, не заменяем его на level*5.
          : kind === 'sandbag' ? 'Stronger sandbags will absorb more damage done to the wall. '
            + (state.sandbagLevel > 0 ? `(Currently, sandbag will absorb ${Math.trunc(100 - castleDamageMultiplier(state) * 100)}% damage)` : "[ You haven't acquired this upgrade yet ]")
          : kind === 'storage' ? `Buying this upgrade gives you +1 extra inventory slot. (Currently, you have ${state.inventory.length} inventory slots)`
          // Сохраняем исходный текст и int(Number*100-100): упрощённый процент может округлиться иначе.
          : kind === 'looter' ? 'The more looters you have the, the more valuable stuff you find will be. '
            + (state.looterLevel > 0 ? `(Currently, looted items's value will be ${Math.trunc(castleLootMultiplier(state) * 100 - 100)}% higher)` : "[ You haven't acquired this upgrade yet ]")
          : kind === 'repairman' ? 'Repairers will slowly fix the castle wall during a battle between waves. '
            + (state.repairmanLevel > 0 ? `(Currently, they can fix ${castleRepairAmount(state)} HP per wave)` : "[ You haven't acquired this upgrade yet ]")
          : kind === 'house'
          ? `For each house built, you can hire +1 more troop. (Currently, you can hire ${state.party.capacity} people)`
          : kind === 'wall' ? `Each level of the wall upgrade gives you +5 more max hit points. (Currently, ${state.castleMaxHp} MHP)`
          : `${name} is not available in the current port yet.`;
        // HitTest-кадр содержит заполненный прямоугольник: alpha3 после фильтра теряется в PNG.
        // Геометрия исходной кнопки сохраняет кликабельность, не включая размытую тень.
        const [hitX, hitY, hitWidth, hitHeight] = tile.hitRect;
        art.setInteractive({ useHandCursor: possible,
          hitArea: new Phaser.Geom.Rectangle(hitX + asset.originX, hitY + asset.originY, hitWidth, hitHeight),
          hitAreaCallback: Phaser.Geom.Rectangle.Contains });
        label.setInteractive({ useHandCursor: possible }); cost.setInteractive({ useHandCursor: possible });
        for (const object of [art, label, cost]) {
          object.on('pointerover', () => { if (possible) art.setFrame(String(upFrame + 1)); hint.setText(description); });
          object.on('pointerout', () => { art.setFrame(String(upFrame)); hint.setText(notice); });
          object.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
            event.stopPropagation();
            if (kind) callbacks.castleUpgrade(kind); else callbacks.message(description);
          });
        }
      });
    } else {
      button('button_townRest', panel.children.act1, () => canRest ? callbacks.rest() : callbacks.message('Day 8 is not available yet.'), x, y, canRest);
      button('button_townHire', panel.children.act2, () => callbacks.message('Temporary henchmen are not available yet. Recruit permanent companions in Characters.'), x, y, false);
    }
    image(panel.labelsImage, x, 0).setAlpha(tab === 'mission' && !canRest ? 0.35 : 1);
    if (tab === 'mission') {
      const action = layout.claimTitleAction;
      const available = state.day >= 6 && state.title === 0;
      const actionX = x + action.x, actionY = y + action.y;
      const cardAsset = manifest.clips[action.cardClip], pinAsset = manifest.clips[action.pinClip];
      const card = scene.add.image(actionX + action.children.card.x, actionY + action.children.card.y, action.cardClip, String(action.cardFrame))
        .setOrigin(cardAsset.originX / cardAsset.frameWidth, cardAsset.originY / cardAsset.frameHeight)
        .setAngle(action.cardRotation).setAlpha(available ? 1 : 0.5)
        .setInteractive({ useHandCursor: available, pixelPerfect: true, alphaTolerance: 100 });
      const pin = scene.add.image(actionX + action.children.pin.x, actionY + action.children.pin.y, action.pinClip, '1')
        .setOrigin(pinAsset.originX / pinAsset.frameWidth, pinAsset.originY / pinAsset.frameHeight).setAlpha(available ? 1 : 0.5);
      root.add([card, pin]);
      text(action.children.text, action.text, actionX, actionY).setAlpha(available ? 1 : 0.5);
      card.on('pointerover', () => { if (available) { card.setScale(action.hoverScale); callbacks.actionHover(); } callbacks.message('You will receive a new title and salary.'); });
      card.on('pointerout', () => card.setScale(1));
      card.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => { event.stopPropagation(); if (available) callbacks.claimTitle(); });
    }
  }
  if (dialog) {
    const placement = layout.repairDialog;
    image(dialog === 'rest' ? 'eventRest' : dialog === 'title' ? 'eventNewTitle' : placement.image);
    text(placement.children.title, dialog === 'rest' ? 'Resting' : dialog === 'title' ? 'New Title!' : 'Free Repair!');
    text(placement.children.text, dialog === 'rest'
      ? 'The day is finally over! You relax for the first time today and settle down to enjoy the warm, cozy bed.'
      : dialog === 'title' ? 'Your remarkable achievements have been acknowledged and you are granted a new title, Honorary Citizen! You will receive 100 gold pieces every day as a salary.'
      : 'Citizens acknowledge your hard work and decided to rebuild the castle walls for free!');
    image('button_eventOk', placement.children.okButton.x, placement.children.okButton.y, placement.children.okButton);
    // Исходный procEventDialog принимает любое нажатие; отдых начинается только после него.
    const dismiss = scene.add.zone(0, 0, 620, 380).setOrigin(0).setInteractive({ useHandCursor: true });
    dismiss.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => { event.stopPropagation(); callbacks.dismiss(); });
    root.add(dismiss);
  }
  return root;
}
