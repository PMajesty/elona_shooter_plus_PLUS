import { buttonInput } from './button-input.ts';
import { TOWN_ACTIVITIES, museumIncome, type TownActivity, type TownEconomy } from './town-economy.ts';
import { MEDALS } from './medals.ts';
import { MAX_CAMPAIGN_DAY } from './missions.ts';
import { nextTitle, type Title } from './titles.ts';
import type { TownNotice } from './town-events.ts';
import Phaser from 'phaser';
import type { LootViewManifest } from './loot-view.ts';
import { ITEM_TYPE, isOccupiedItem, type Item } from './items.ts';
import { CASTLE_UPGRADES, castleDamageMultiplier, castleLootMultiplier, castleRepairAmount, castleStorageLevel, castleTrainerMultiplier, castleUpgradeCost, castleUpkeep, type CastleUpgradeKind } from './castle-upgrades.ts';

export type TownTab = 'mission' | 'castle' | 'shop' | 'characters' | 'equipment' | 'medals' | null;
export type TownDialog = 'repair' | 'rest' | 'title' | TownNotice | null;
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
  saleDialog: { image: string; children: Record<string, Placement> };
  medals: { image: string; labelsImage: string; children: Record<string, Placement>; rowChildren: Record<string, Placement>; hintImage: string; hintChildren: Record<string, Placement> };
  claimTitleAction: { x: number; y: number; cardClip: string; cardFrame: number; cardRotation: number; hoverScale: number; pinClip: string; text: string; children: Record<string, Placement> };
}
interface TownViewState {
  economy: TownEconomy; earnedMedals: number[];
  day: number; gold: number; castleHp: number; castleMaxHp: number; title: Title;
  wallLevel: number; wallFixCount: number; repairmanLevel: number; sandbagLevel: number; looterLevel: number; trainerLevel: number; party: { capacity: 1 | 2 | 3 };
  player: { level: number; exp: number; selectedSlot: number };
  town: { ap: number; preparation: string; mission?: { hire: boolean } } | null; inventory: (Item | null)[];
  pendingPartyAction: { kind: string } | null;
  ruleset?: { id: 'classic' | 'expanded'; revision: 1 };
  henchmanOrder?: 7;
}
interface Callbacks { henchmanCareful?(enabled: boolean): void; robVisitors(): void; medalPage(page: 0 | 1): void; visitKongregate(): void; medalHint(hint: { id: number; name: string; description: string; bonus: string } | null): void; hire(): void; confirmHire(answer: boolean): void; castlePage(page: 0 | 1): void; activity(action: TownActivity): void; activityAvailable(action: TownActivity): boolean; select(tab: TownTab): void; repair(): void; rest(): void; claimTitle(): void; castleUpgrade(kind: CastleUpgradeKind): void; actionHover(): void; message(value: string): void }

/** Городские координаты и повороты берутся из исходного кадра 71 и его окон. */
export function createTownView(scene: Phaser.Scene, state: TownViewState, manifest: LootViewManifest, layout: TownLayout, callbacks: Callbacks, tab: TownTab, navigation: Phaser.GameObjects.Container, castlePage: 0 | 1 = 0, medalPage: 0 | 1 = 0): Phaser.GameObjects.Container {
  const root = scene.add.container(0, 0).setName('town-view');
  const image = (key: string, x = 0, y = 0, placement?: Placement) => {
    const asset = manifest.images[key];
    const object = scene.add.image(x, y, key).setOrigin(asset.originX / asset.width, asset.originY / asset.height);
    if (placement) object.setScale(placement.scaleX, placement.scaleY).setAngle(placement.rotationDegrees);
    else object.setDisplaySize(asset.width, asset.height);
    root.add(object); return object;
  };
  const text = (placement: Placement, value: string, x = 0, y = 0) => {
    const field = placement.text!;
    const fonts: Record<number, string> = { 682: 'ElonaMenu', 1608: 'ElonaMenuBold', 2681: 'ElonaHud', 1392: 'ElonaSmall', 1535: 'ui' };
    const indent = field.indent ?? 0;
    const width = field.bounds[2] - field.bounds[0] - indent;
    const object = scene.add.text(x + placement.x + indent, y + placement.y, value, {
      resolution: 2, fontFamily: fonts[field.fontId] ?? 'Arial', fontSize: `${field.fontSize}px`, color: field.color,
      wordWrap: { width }, align: field.align === 2 ? 'center' : 'left', padding: { x: 1, y: 1 },
    }).setFixedSize(width, 0).setScale(placement.scaleX, placement.scaleY);
    if (field.color === '#ffffff') object.setShadow(1, 1, '#000000', 2);
    root.add(object); return object;
  };
  const button = (key: string, placement: Placement, action: () => void, x = 0, y = 0, enabled = true, parent = root) => {
    const shadow = manifest.images[`${key}_shadow`] ? image(`${key}_shadow`, x + placement.x, y + placement.y, placement) : undefined;
    const object = image(key, x + placement.x, y + placement.y, placement).setName(key);
    if (parent !== root) { if (shadow) parent.add(shadow); parent.add(object); }
    object.setAlpha(enabled ? 1 : 0.35).setInteractive(buttonInput(manifest.images[key], enabled));
    if (enabled) {
      object.on('pointerover', () => { object.setTexture(`${key}_over`); shadow?.setTexture(`${key}_over_shadow`); });
      object.on('pointerout', () => { object.setTexture(key); shadow?.setTexture(`${key}_shadow`); });
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
  root.add(navigation);
  if (!navigation.length) for (const [name, placement] of Object.entries(layout.navigation)) {
    const enabled = ['mission', 'castle', 'shop', 'chara', 'equip', 'medal'].includes(name);
    const tab = name === 'chara' ? 'characters' : name === 'equip' ? 'equipment' : name === 'medal' ? 'medals' : name as TownTab;
    button(placement.image, placement, () => enabled ? callbacks.select(tab) : callbacks.message('This town menu is not available in the current port yet.'), 0, 0, enabled, navigation);
  }
  if (tab === 'mission' || tab === 'castle') {
    const panel = layout[tab], { x, y } = layout.menuPosition;
    const canRest = state.day < MAX_CAMPAIGN_DAY && state.town?.preparation === 'ready';
    // Вертикальный сдвиг уже запечён в статическую панель; её кнопкам он нужен отдельно.
    image(panel.image, x, 0);
    button('button_windowClose', panel.children.closeButton, () => callbacks.select(null), x, y);
    if (tab === 'castle') {
      text(panel.children.unkeep, String(castleUpkeep(state)), x, y);
      button('button_freeRepair', panel.children.act1, callbacks.repair, x, y);
      const tile = layout.castleUpgrades, asset = manifest.clips[tile.clip];
      const notice = castlePage ? 'Castle improvements and daily activities.' : 'Improve your castle and equipment.';
      const hint = text(panel.children.hint2, notice, x, y);
      button(tile.pageButtons[0], panel.children.page1, () => callbacks.castlePage(0), x, y);
      button(tile.pageButtons[1], panel.children.page2, () => callbacks.castlePage(1), x, y);
      // Восемь плиток выбранной страницы используют общие проверки покупки.
      const e = state.economy;
      const levels = [state.wallFixCount, state.wallLevel, state.sandbagLevel, castleStorageLevel(state), state.party.capacity, state.looterLevel, state.repairmanLevel, state.trainerLevel,
        e.smith, e.museum, e.chickens, e.sisters, e.villa, e.specialTrainer, 0, 0];
      const costs = [...CASTLE_UPGRADES.map(kind => castleUpgradeCost(kind, state)), 0, 0];
      tile.names.slice(castlePage * 8, castlePage * 8 + 8).forEach((name, slotIndex) => {
        const index = slotIndex + castlePage * 8, kind = CASTLE_UPGRADES[index];
        const possible = Boolean(kind && costs[index] > 0 && state.gold >= costs[index]);
        const tileX = x + tile.x + slotIndex % tile.columns * tile.stepX;
        const tileY = y + tile.y + Math.floor(slotIndex / tile.columns) * tile.stepY;
        const group = scene.add.container(tileX, tileY).setName(`castle-upgrade-${index}`).setAlpha(possible ? 1 : tile.disabledAlpha);
        root.add(group);
        const upFrame = index * 2 + 1;
        const art = scene.add.image(0, 0, tile.clip, String(upFrame))
          .setOrigin(asset.originX / asset.frameWidth, asset.originY / asset.frameHeight);
        // Счётчик Fix Wall сохраняется, но исходный индекс0 никогда не показывает суффикс уровня.
        const label = text(tile.children.upgradeName, name + (index !== 0 && levels[index] > 0 ? ` Lv ${levels[index]}` : ''));
        const cost = text(tile.children.upgradeCost, String(costs[index])).setColor(possible ? tile.affordableColor : tile.unavailableColor);
        group.add([art, label, cost]);
        const description = kind === 'smith' ? `The shop produces ${2 + e.smith} items. Upgrading Smith immediately supplies new stock.`
          : kind === 'museum' ? `Your medals generate ${museumIncome(e.museum, state.earnedMedals)} GP per day. Museum upkeep is ${e.museum * 15} GP.`
          : kind === 'chicken' ? `You have ${e.chickens} chickens. From the next town, collect eggs once a day in Mission for 1 AP.`
          : kind === 'sister' ? `You have ${e.sisters} sisters to launch each battle. Shoot the flying or landed bombs to explode them among enemies.`
          : kind === 'villa' ? `Unlocks Party in Mission for 3 AP: +${e.villa * 10}% troop damage in the next battle.`
          : kind === 'special-trainer' ? `Unlocks Train in Mission for 4 AP. Each troop can take ${e.specialTrainer} total training sessions.`
          : kind === 'fix-wall' ? 'This will completely fix the castle wall.'
          // Сохраняем порядок Number-арифметики и int исходного текста, не заменяем его на level*5.
          : kind === 'sandbag' ? 'Stronger sandbags will absorb more damage done to the wall. '
            + (state.sandbagLevel > 0 ? `(Currently, sandbag will absorb ${Math.trunc(100 - castleDamageMultiplier(state) * 100)}% damage)` : "[ You haven't acquired this upgrade yet ]")
          : kind === 'storage' ? `Buying this upgrade gives you +1 extra inventory slot. (Currently, you have ${state.inventory.length} inventory slots)`
          // Сохраняем исходный текст и int(Number*100-100): упрощённый процент может округлиться иначе.
          : kind === 'looter' ? 'The more looters you have the, the more valuable stuff you find will be. '
            + (state.looterLevel > 0 ? `(Currently, looted items's value will be ${Math.trunc(castleLootMultiplier(state) * 100 - 100)}% higher)` : "[ You haven't acquired this upgrade yet ]")
          : kind === 'trainer' ? 'With more trainers, your troops will gain experience a lot faster. '
            + (state.trainerLevel > 0 ? `(Currently, your troops get ${Math.trunc(castleTrainerMultiplier(state) * 100 - 100)}% more EXP)` : "[ You haven't acquired this upgrade yet ]")
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
      button('button_townRest', panel.children.act1, () => canRest ? callbacks.rest() : callbacks.message('The next campaign cycle is not available yet.'), x, y, canRest);
      button('button_townHire', panel.children.act2, callbacks.hire, x, y, state.town?.preparation === 'ready' && !state.town.mission?.hire);
    }
    image(panel.labelsImage, x, 0).setAlpha(tab === 'mission' && !canRest ? 0.35 : 1);
    if (tab === 'mission') {
      const template = layout.claimTitleAction;
      for (const [key, info] of Object.entries(TOWN_ACTIVITIES)) {
        const activity = key as TownActivity, enabled = callbacks.activityAvailable(activity);
        const ax = x + 145 + info.index % 5 * 80, ay = y + 150 + Math.floor(info.index / 5) * 105;
        const cardAsset = manifest.clips[template.cardClip], pinAsset = manifest.clips[template.pinClip];
        const card = scene.add.image(ax + template.children.card.x, ay + template.children.card.y, template.cardClip, String(info.frame))
          .setOrigin(cardAsset.originX / cardAsset.frameWidth, cardAsset.originY / cardAsset.frameHeight).setAlpha(enabled ? 1 : 0.35)
          .setInteractive({ useHandCursor: enabled, pixelPerfect: true, alphaTolerance: 100 }).setName(`town-activity-${key}`);
        root.add(card);
        root.add(scene.add.image(ax + template.children.pin.x, ay + template.children.pin.y, template.pinClip, '1')
          .setOrigin(pinAsset.originX / pinAsset.frameWidth, pinAsset.originY / pinAsset.frameHeight).setAlpha(enabled ? 1 : 0.35));
        text({ ...template.children.text }, `${info.cost} AP\n${info.name}`, ax, ay).setAlpha(enabled ? 1 : 0.35);
        card.on('pointerdown', (_pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
          event.stopPropagation(); if (enabled) callbacks.activity(activity);
        });
      }
      const action = layout.claimTitleAction;
      if (state.ruleset?.id === 'expanded' && state.town?.preparation === 'ready' && state.town.mission?.hire && callbacks.henchmanCareful) {
        const selected = state.henchmanOrder === 7;
        // Свободный промежуток между Train и Claim Title; вся область доступна для касания.
        const control = scene.add.container(330, 235).setName('henchman-order');
        control.setData({ selected, order: selected ? 7 : 6 }); root.add(control);
        const label = (x: number, y: number, value: string, size = 11, color = '#000000') => {
          const field = scene.add.text(x, y, value, { resolution: 2, fontFamily: 'ElonaMenu', fontSize: `${size}px`, color,
            wordWrap: { width: 110 - x }, padding: { x: 0, y: 1 } });
          control.add(field); return field;
        };
        label(0, 0, 'Henchman order', 11, '#4c4031');
        control.add(scene.add.image(1, 20, selected ? 'partyCheckOn' : 'partyCheckOff', '1').setOrigin(0));
        const name = label(20, 16, 'Careful\nConsideration', 12);
        label(0, 48, '-15% damage', 11, '#703b22');
        label(0, 63, selected ? 'Careful' : 'Fire at will', 11, '#4c4031');
        const hit = scene.add.zone(0, 0, 110, 78).setOrigin(0).setInteractive({ useHandCursor: true }).setName('henchman-careful');
        control.add(hit);
        hit.on('pointerover', () => name.setColor('#000099'));
        hit.on('pointerout', () => name.setColor('#000000'));
        hit.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
          event.stopPropagation();
          if (!state.pendingPartyAction) callbacks.henchmanCareful?.(!selected);
        });
      }
      const available = nextTitle(state.title, state.day) !== undefined;
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
  if (tab === 'medals') {
    const panel = layout.medals, { x, y } = layout.menuPosition;
    image(panel.image, x, 0);
    button('button_windowClose', panel.children.closeButton, () => callbacks.select(null), x, y);
    button('button_castlePage1', panel.children.page1, () => callbacks.medalPage(0), x, y);
    button('button_castlePage2', panel.children.page2, () => callbacks.medalPage(1), x, y);
    button('button_robVisitors', panel.children.act1, callbacks.robVisitors, x, y, (state.town?.ap ?? 0) >= 2);
    image(panel.labelsImage, x, 0);
    text(panel.children.lootText, `${state.earnedMedals.length} medals won`, x, y);
    text(panel.children.hint2, 'Medals you won give you various bonuses.\nThey are carried over to the next games.', x, y);
    const hint = scene.add.container(0, 0).setVisible(false).setName('original-medal-hint'); root.add(hint);
    const hx = x + panel.children.hint.x, hy = y + panel.children.hint.y;
    hint.add(image(panel.hintImage, hx, hy));
    const hintName = text(panel.hintChildren.itemName, '', hx, hy);
    const hintDescription = text(panel.hintChildren.itemDesc, '', hx, hy);
    const hintBonus = text(panel.hintChildren.itemDesc2, '', hx, hy);
    hint.add([hintName, hintDescription, hintBonus]);
    const kong = panel.children.kongMc, asset = manifest.clips.museumKongregate;
    const link = scene.add.image(x + kong.x, y + kong.y, 'museumKongregate', '1')
      .setOrigin(asset.originX / asset.frameWidth, asset.originY / asset.frameHeight).setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 100 }); root.add(link);
    link.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => { event.stopPropagation(); callbacks.visitKongregate(); });
    const entries = Object.entries(MEDALS).filter(([id]) => Number(id) < 85 ? medalPage === 0 : medalPage === 1);
    entries.forEach(([key, info], index) => {
      const id = Number(key), earned = state.earnedMedals.includes(id);
      const rowX = x + 145 + Math.trunc(index / 10) * 130;
      const rowY = y + 130 + index % 10 * 20 + (index >= 20 ? 20 : 0);
      image('medalRow', rowX, rowY).setAlpha(earned ? 1 : 0.3);
      text(panel.rowChildren.medalName, info.name, rowX, rowY).setAlpha(earned ? 1 : 0.3);
      const hit = scene.add.zone(rowX, rowY, 140, 20).setOrigin(0).setInteractive({ useHandCursor: true }).setName(`medal-row-${id}`);
      root.add(hit);
      const describe = () => {
        const description = earned ? info.earned : info.condition, bonus = earned ? info.bonus : '????';
        hintName.setText(info.name); hintDescription.setText(description); hintBonus.setText(bonus);
        hint.setVisible(true); root.bringToTop(hint); callbacks.medalHint({ id, name: info.name, description, bonus });
      };
      hit.on('pointerover', describe);
      hit.on('pointerout', () => { hint.setVisible(false); callbacks.medalHint(null); });
      hit.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => { event.stopPropagation(); describe(); });
    });
  }
  if (state.pendingPartyAction?.kind === 'henchman') {
    const outside = scene.add.zone(0, 0, 620, 380).setOrigin(0).setInteractive(); root.add(outside);
    outside.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => { event.stopPropagation(); callbacks.confirmHire(false); });
    const modal = layout.saleDialog;
    image(modal.image);
    text(modal.children.question, 'The henchman demands half the mission reward. Accept?');
    for (const [name, answer] of [['yes', true], ['no', false]] as const) {
      button(name === 'yes' ? 'button_dialogYes' : 'button_dialogNo', modal.children[name], () => callbacks.confirmHire(answer));
    }
  }
  return root;
}
