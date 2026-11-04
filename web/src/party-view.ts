import { CAREFUL_COST_HINT, CAREFUL_HINT, CAREFUL_ORDER } from './careful-consideration.ts';
import { buttonInput } from './button-input.ts';
import { createItemPopupView, type ItemPopupLayout } from './item-popup-view.ts';
import type { ItemPopupInfo } from './item-popup-values.ts';
import { createOriginalHintView } from './original-hint-view.ts';
import { animateStandingPortraits } from './portrait-animation.ts';
import { traitHintValues, type OriginalHintInfo } from './trait-hint.ts';
import type { TownLayout } from './town-view.ts';
import Phaser from 'phaser';
import { ITEM_TYPE, isOccupiedItem, type Item } from './items.ts';
import type { LootViewManifest } from './loot-view.ts';
import { GRAPHIC_WIDTH, GRAPHIC_HEIGHT } from './shop-view.ts';
import { EQUIPMENT_SERVICE_COST, equipmentServiceEligible, type EquipmentService } from './equipment.ts';

interface Placement {
  x: number; y: number; scaleX: number; scaleY: number; rotationDegrees: number;
  text?: { fontId: number; fontSize: number; bounds: number[]; align: number; color: string };
}
interface Panel { image: string; labelsImage: string; children: Record<string, Placement> }
interface Portrait { children: Record<string, Placement>; shadow: { clip: string; x: number; y: number; scaleX: number; scaleY: number } }
export interface PartyLayout {
  medals: TownLayout['medals'];
  itemPopup: ItemPopupLayout;
  menuPosition: { x: number; y: number };
  characters: Panel & { portraits: { x: number; y: number; stepX: number; candidateIndex: number; candidateExtraX: number } };
  equipment: Panel & {
    portraits: { x: number; y: number; stepX: number };
    slots: { inventory: { x: number; y: number; columns: number; stepX: number; stepY: number }; companions: { x: number; y: number; stepX: number } };
  };
  partyPortrait: Portrait;
  equipmentPortrait: Portrait;
  partyTrait: { children: Record<string, Placement>; x: number; y: number; rows: number; stepX: number; stepY: number };
  partyControls: { orderGrid: number[]; orderListGrid: number[]; componentBaseWidth: number; componentBaseHeight: number; checkIconX: number; checkIconY: number; checkLabelX: number };
  saleDialog: { image: string; children: Record<string, Placement> };
  inventorySlot: { children: Record<string, Placement> };
}
export interface PartyViewTrait { id: number; name: string; description: string; kind: 'class' | 'base' | 'party' | 'normal' }
export interface PartyViewMember {
  slot: number; name: string; appearance: number; level: number; exp: number; className: string;
  wageLabel: string; kill: number | null; earn: number | null; cost?: number; weapon: Item | null;
  traits: readonly PartyViewTrait[]; traitLevels: Readonly<Record<number, number>>;
  focusedTrait: number; order: number; prioritizeBoss: boolean; prioritizeWall: boolean;
}
export interface PartyEquipmentSlot { kind: 'inventory' | 'companion'; slot: number }
export interface PartyViewState {
  selectedSlot: number; members: readonly PartyViewMember[]; inventory: readonly (Item | null)[];
  gold: number; capacity: number; dialog: 'recruit' | 'dismiss' | 'mod' | null;
  ap: number;
  carefulAvailable?: boolean;
}
export interface PartyViewCallbacks {
  traitHint?(info: OriginalHintInfo | null): void;
  itemPopup?(info: ItemPopupInfo | null): void;
  selectCharacter(slot: number): void;
  recruit(): void; dismiss(): void; confirm(value: boolean): void; cancel(): void; close(): void;
  focus(trait: number): void; order(value: number): void; prioritizeBoss(value: boolean): void; prioritizeWall(value: boolean): void;
  swapEquipment(from: PartyEquipmentSlot, to: PartyEquipmentSlot): boolean;
  requestModMount?(from: PartyEquipmentSlot, to: PartyEquipmentSlot): void;
  refreshCandidate?(): void;
  serviceItem(service: EquipmentService, slot: number): string;
  message(value: string): void;
}

const ORDERS = [
  { value: -1, label: 'Hero Mode' },
  { value: 0, label: 'Attack mobs in weapon range' },
  { value: 1, label: "  +don't attack air mobs" },
  { value: 2, label: "  +don't attack armored mobs" },
  { value: 3, label: "  +don't attack either" },
  { value: 4, label: 'Attack air mobs' },
  { value: 5, label: 'Attack armored mobs' },
  { value: 6, label: 'Always fire at will' },
];
const EQUIP_HINT = 'Drag & drop to move items or change equipment.';
const SKILL_WARNING = "*You don't have the required skill to use the weapon.";

/** Окна используют исходные координаты; только callbacks меняют сохранённую партию. */
export function createPartyView(scene: Phaser.Scene, state: PartyViewState, manifest: LootViewManifest, layout: PartyLayout,
  callbacks: PartyViewCallbacks, tab: 'characters' | 'equipment'): Phaser.GameObjects.Container {
  const root = scene.add.container(0, 0).setName('party-view');
  const menu = layout.menuPosition, panel = layout[tab], modal = state.dialog !== null;
  root.setData({ tab, selectedSlot: state.selectedSlot, dialog: state.dialog, carrying: null });
  const image = (key: string, x = 0, y = 0, placement?: Placement) => {
    const asset = manifest.images[key];
    const object = scene.add.image(x, y, key).setOrigin(asset.originX / asset.width, asset.originY / asset.height);
    if (placement) object.setScale(placement.scaleX, placement.scaleY).setAngle(placement.rotationDegrees);
    else object.setDisplaySize(asset.width, asset.height);
    root.add(object); return object;
  };
  const clip = (key: string, frame: number, x: number, y: number) => {
    const asset = manifest.clips[key];
    const object = scene.add.image(x, y, key, String(frame)).setOrigin(asset.originX / asset.frameWidth, asset.originY / asset.frameHeight);
    root.add(object); return object;
  };
  const skin = (key: string, grid: number[], x: number, y: number, width: number, height: number) => {
    const asset = manifest.clips[key];
    const object = scene.add.nineslice(x, y, key, '1', width, height, grid[0], asset.frameWidth - grid[2], grid[1], asset.frameHeight - grid[3]).setOrigin(0);
    root.add(object); return object;
  };
  const text = (placement: Placement, value: string, x = menu.x, y = menu.y) => {
    const field = placement.text!;
    const width = field.bounds[2] - field.bounds[0];
    const fonts: Record<number, string> = { 682: 'ElonaMenu', 1608: 'ElonaMenuBold', 1653: 'ElonaImpact', 1535: 'ui', 2681: 'ElonaHud', 1392: 'ElonaSmall' };
    const object = scene.add.text(x + placement.x, y + placement.y, value, {
      resolution: 2, fontFamily: fonts[field.fontId] ?? 'Arial', fontSize: `${field.fontSize}px`, color: field.color,
      wordWrap: { width }, align: field.align === 1 ? 'right' : field.align === 2 ? 'center' : 'left', padding: { x: 1, y: 1 },
    }).setFixedSize(width, 0).setScale(placement.scaleX, placement.scaleY).setAngle(placement.rotationDegrees);
    root.add(object); return object;
  };
  const button = (key: string, p: Placement, action: () => void, enabled = true, x = menu.x, y = menu.y) => {
    const object = image(key, x + p.x, y + p.y, p).setAlpha(enabled ? 1 : 0.35)
      .setName(key).setInteractive(buttonInput(manifest.images[key], enabled));
    object.on('pointerover', () => { if (enabled && !modal && manifest.images[`${key}_over`]) object.setTexture(`${key}_over`); });
    object.on('pointerout', () => object.setTexture(key));
    object.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation(); if (!modal) action();
    });
    return object;
  };
  // y уже включён в статические панели; динамические элементы используют оба смещения.
  image(panel.image, menu.x, 0);
  const hint = text(panel.children.hint2, tab === 'equipment' ? EQUIP_HINT : '').setName('party-hint');
  const message = (value: string) => { hint.setText(value); callbacks.message(value); };
  button('button_windowClose', panel.children.closeButton, callbacks.close);

  const portraitBodies: { image: Phaser.GameObjects.Image; appearance: number }[] = [];
  const portrait = (member: PartyViewMember, x: number, y: number, equipment = false) => {
    const spec = equipment ? layout.equipmentPortrait : layout.partyPortrait;
    const before = new Set(root.list);
    let selection: Phaser.GameObjects.Zone | undefined;
    if (!equipment) {
      const p = spec.children.bg;
      // Альфа/размытие исходного bg запечены вместе с его размещением в ally3.
      clip('partyPortraitBackground', 1, x, y);
      const hit = manifest.images.button_partyPortrait;
      selection = scene.add.zone(x + p.x - hit.originX * p.scaleX, y + p.y - hit.originY * p.scaleY, hit.width * p.scaleX, hit.height * p.scaleY)
        .setOrigin(0).setName(`party-member-${member.slot}`).setInteractive({ useHandCursor: true });
      selection.setData('slot', member.slot); root.add(selection);
      selection.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation(); if (!modal) callbacks.selectCharacter(member.slot);
      });
    }
    const shadow = spec.shadow;
    clip(shadow.clip, 1, x + shadow.x, y + shadow.y).setScale(shadow.scaleX, shadow.scaleY);
    const p = spec.children.chara1;
    const body = clip('charaPic', member.appearance * 10 + 5, x + p.x, y + p.y).setScale(p.scaleX, p.scaleY);
    portraitBodies.push({ image: body, appearance: member.appearance });
    text(spec.children.pname, member.name, x, y);
    if (!equipment) text(spec.children.lv, `L:${member.level}\nE:${member.exp / 10}`, x, y);
    const group = scene.add.container(0, 0, root.list.filter(child => !before.has(child)));
    root.add(group);
    if (!equipment) {
      group.setAlpha(member.slot === state.selectedSlot ? 1 : 0.6);
      selection!.on('pointerover', () => group.setAlpha(1));
      selection!.on('pointerout', () => group.setAlpha(member.slot === state.selectedSlot ? 1 : 0.6));
    }
  };
  animateStandingPortraits(scene, root, portraitBodies);

  if (tab === 'characters') {
    const traitHint = createOriginalHintView(scene, manifest, layout.medals, callbacks.traitHint);
    traitHint.root.setPosition(menu.x + panel.children.hint.x, menu.y + panel.children.hint.y); root.add(traitHint.root);
    const positions = layout.characters.portraits;
    for (const member of state.members) portrait(member, menu.x + positions.x + member.slot * positions.stepX + (member.slot === positions.candidateIndex ? positions.candidateExtraX : 0), menu.y + positions.y);
    const member = state.members.find(value => value.slot === state.selectedSlot) ?? state.members[0];
    button('button_townHire', panel.children.act1, () => callbacks.refreshCandidate ? callbacks.refreshCandidate() : message('Searching for another recruit is not available yet.'), Boolean(callbacks.refreshCandidate));
    image(panel.labelsImage, menu.x, 0).setAlpha(callbacks.refreshCandidate ? 1 : 0.35);
    if (member) {
      const candidate = member.slot === 5, hero = member.slot === 0;
      text(panel.children.classText, member.className);
      text(hero ? panel.children.titleText : panel.children.wage, hero ? 'TITLE.' : 'WAGE.');
      text(panel.children.wageText, member.wageLabel);
      text(panel.children.killText, member.kill === null ? '—' : String(member.kill));
      text(panel.children.earnText, member.earn === null ? '—' : String(member.earn));
      text(panel.children.orderText, candidate ? 'COST.' : 'ORDER.');
      if (candidate) text(panel.children.costText, String(member.cost ?? 0)).setColor((member.cost ?? 0) > state.gold ? '#cc0000' : '#0000cc');
      if (!hero) {
        button('button_partyDismiss', panel.children.dismissButton, candidate ? callbacks.recruit : callbacks.dismiss);
        text(panel.children.dismissText, candidate ? 'RECRUIT' : 'DISMISS');
      }
      const carefulAllowed = state.carefulAvailable === true && member.slot >= 1 && member.slot <= 4;
      const carefulSelected = carefulAllowed && member.order === CAREFUL_ORDER;
      const memberHint = carefulSelected ? CAREFUL_HINT : candidate ? '\nClick "Recruit" to hire this person.' : `Click a skill to set it as a focused skill.\n${hero ? 'It will appear on the list more frequently when leveling.' : 'Your ally will likely gain the skill when leveling.'}`;
      hint.setText(memberHint);
      const sort = (trait: PartyViewTrait) => trait.kind === 'class' ? 100000 + trait.id : trait.kind === 'base' ? 70000 + trait.id : trait.kind === 'party' ? 10000 + trait.id : 50000 - trait.id;
      const traits = [...member.traits].filter(value => !(hero && member.order === -1 && [900, 901].includes(value.id))).sort((a, b) => sort(b) - sort(a));
      traits.forEach((trait, index) => {
        const spec = layout.partyTrait;
        const x = menu.x + spec.x + Math.floor(index / spec.rows) * spec.stepX, y = menu.y + spec.y + index % spec.rows * spec.stepY;
        const base = trait.kind === 'base' || trait.kind === 'class';
        const icon = spec.children.icon;
        clip('partyTraitIcon', base ? 2 : trait.kind === 'party' ? 3 : 1, x + icon.x, y + icon.y).setScale(icon.scaleX, icon.scaleY);
        const label = text(spec.children.traitName, trait.name, x, y).setColor(base ? '#044010' : '#000000');
        const area = scene.add.zone(x, y, 130, 18).setOrigin(0).setName(`party-trait-${trait.id}`).setInteractive({ useHandCursor: !candidate && !base });
        area.on('pointerover', () => { if (!modal) traitHint.show(traitHintValues(trait.id, member.traitLevels)); });
        area.on('pointerout', traitHint.hide);
        area.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
          event.stopPropagation(); if (modal || candidate) return;
          if (base) message("Base skills can't be focused."); else callbacks.focus(member.focusedTrait === trait.id ? -1 : trait.id);
        });
        root.add(area); label.setData('trait', trait.id);
        if (!candidate && member.focusedTrait === trait.id) text({ ...panel.children.fo, x: x - menu.x - 22, y: y - menu.y + 2 }, 'Fo');
      });
      if (!candidate) {
        const p = panel.children.order;
        const controls = layout.partyControls;
        const width = controls.componentBaseWidth * p.scaleX, height = controls.componentBaseHeight * p.scaleY;
        skin('partyOrderSkin', controls.orderGrid, menu.x + p.x, menu.y + p.y, width, height);
        const orders = carefulAllowed ? [...ORDERS, { value: CAREFUL_ORDER, label: 'Careful Consideration' }] : ORDERS;
        const value = scene.add.text(menu.x + p.x + 3, menu.y + p.y + 5, orders.find(order => order.value === member.order)?.label ?? '', { fontFamily: 'Arial', fontSize: '11px', color: '#000000' });
        // Подгоняем только новый длинный приказ, не обрезая его последние буквы.
        if (carefulSelected && value.width > width - 22) value.setScale((width - 22) / value.width, 1);
        else value.setCrop(0, 0, width - 22, height);
        root.add(value);
        let list: Phaser.GameObjects.Container | null = null;
        const choose = scene.add.zone(menu.x + p.x, menu.y + p.y, width, height).setOrigin(0).setInteractive({ useHandCursor: true }).setName('party-order'); root.add(choose);
        choose.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
          event.stopPropagation(); if (modal) return;
          traitHint.hide();
          if (list) { list.destroy(); list = null; hint.setText(memberHint); return; }
          if (carefulAllowed) hint.setText(CAREFUL_HINT);
          list = scene.add.container(0, 0); root.add(list);
          const options = orders.filter(order => hero || order.value !== -1);
          // Раскрытый список остаётся внутри игрового кадра, в том числе на touch.
          const listX = carefulAllowed ? Math.max(0, Math.min(430, menu.x + p.x)) : menu.x + p.x;
          const listY = carefulAllowed ? Math.max(0, Math.min(menu.y + p.y + height, 380 - (options.length * 18 + 2))) : menu.y + p.y + height;
          const background = skin('partyOrderListSkin', controls.orderListGrid, listX, listY, 190, options.length * 18 + 2); list.add(background);
          const outside = scene.add.zone(0, 0, 620, 380).setOrigin(0).setInteractive(); list.addAt(outside, 0);
          outside.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => { e.stopPropagation(); list?.destroy(); list = null; hint.setText(memberHint); });
          options.forEach((order, index) => {
            const label = scene.add.text(listX + 3, listY + 2 + index * 18, order.label, { fontFamily: 'Arial', fontSize: '11px', color: '#000000' }); list!.add(label);
            const option = scene.add.zone(listX, listY + index * 18, 190, 18).setOrigin(0).setInteractive({ useHandCursor: true }); list!.add(option);
            option.on('pointerover', () => { label.setColor('#0000cc'); if (order.value === CAREFUL_ORDER) hint.setText(CAREFUL_HINT); }); option.on('pointerout', () => label.setColor('#000000'));
            option.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => { e.stopPropagation(); callbacks.order(order.value); });
          });
        });
        if (!hero || member.order !== -1) {
          const check = (name: 'optBoss' | 'optWall', label: string, selected: boolean, action: () => void) => {
            const p = panel.children[name], x = menu.x + p.x, y = menu.y + p.y;
            // Flash UIComponent поглощает scaleX в ширину; иконка остаётся 14×14.
            clip(selected ? 'partyCheckOn' : 'partyCheckOff', 1, x + controls.checkIconX, y + controls.checkIconY);
            root.add(scene.add.text(x + controls.checkLabelX, y + 5, label, { fontFamily: 'Arial', fontSize: '11px', color: '#000000' }));
            const area = scene.add.zone(x, y, 70, 22).setOrigin(0).setInteractive({ useHandCursor: true }); root.add(area);
            const checkHint = carefulSelected ? `Boss and Defend guide your choice of foes.\n${CAREFUL_COST_HINT}` : 'When "Boss" is checked, the character will go for the boss when a boss appears.\nWhen "Defend" is checked, the character will go for the enemies attacking your wall.';
            area.on('pointerover', () => hint.setText(checkHint));
            area.on('pointerout', () => hint.setText(memberHint));
            area.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => { e.stopPropagation(); if (!modal) action(); });
          };
          check('optBoss', 'Boss', member.prioritizeBoss, () => callbacks.prioritizeBoss(!member.prioritizeBoss));
          check('optWall', 'Defend', member.prioritizeWall, () => callbacks.prioritizeWall(!member.prioritizeWall));
        }
      }
    }
  } else {
    const spec = layout.equipment;
    const warning = text(panel.children.warning, '');
    const tooltip = createItemPopupView(scene, manifest, layout.itemPopup, state.members.find(member => member.slot === 0)?.traitLevels ?? {}, callbacks.itemPopup);
    tooltip.root.setPosition(menu.x + panel.children.popup.x, menu.y + panel.children.popup.y); root.add(tooltip.root);
    let service: EquipmentService | null = null;
    const help = text(panel.children.actHelp, 'Choose an item to apply. Click nowhere to cancel.').setVisible(false);
    const canService = (slot: Slot) => slot.address.kind === 'inventory' && service !== null && equipmentServiceEligible(service, slot.item);
    const startService = (action: EquipmentService) => {
      if (modal || carrying) return;
      if (state.ap < EQUIPMENT_SERVICE_COST[action]) { message("You don't have enough action points!"); return; }
      tooltip.hide(); service = action; root.setData('equipmentService', action); help.setVisible(true);
      hint.setText('Click an item to apply.');
      slots.forEach(slot => slot.plate.setAlpha(canService(slot) ? 1 : 0.5));
    };
    button('button_partyRecycle', panel.children.act1, () => startService('recycle'), state.ap >= 5)
      .on('pointerover', () => { if (!service) hint.setText('You can turn a weapon into a random Mod.'); });
    button('button_partyRestock', panel.children.act2, () => startService('restock'), state.ap >= 3)
      .on('pointerover', () => { if (!service) hint.setText('You can recharge item like grenades and repair kits.'); });
    image(panel.labelsImage, menu.x, 0);
    interface Slot { address: PartyEquipmentSlot; item: Item | null; plate: Phaser.GameObjects.Image; icon?: Phaser.GameObjects.Container; x: number; y: number; width: number; height: number }
    const slots: Slot[] = [];
    let carrying: Slot | null = null;
    const canUse = (member: PartyViewMember | undefined, item: Item | null) => isOccupiedItem(item) && item.type === ITEM_TYPE.gun && (member?.traitLevels[item.reqTrait!] ?? 0) >= (item.reqLv ?? 0);
    const eligible = (from: Slot, to: Slot) => {
      if (from === to) return true;
      if (to.address.kind === 'companion') {
        const target = state.members.find(member => member.slot === to.address.slot);
        if (!(canUse(target, from.item) || from.item?.type === ITEM_TYPE.mod && isOccupiedItem(to.item) && to.item.type === ITEM_TYPE.gun)) return false;
      }
      if (from.address.kind === 'companion' && isOccupiedItem(to.item)) {
        const source = state.members.find(member => member.slot === from.address.slot);
        if (!canUse(source, to.item)) return false;
      }
      return true;
    };
    const clear = () => {
      if (carrying?.icon) carrying.icon.setPosition(carrying.x, carrying.y);
      carrying = null; root.setData('carrying', null); warning.setText('');
      slots.forEach(slot => slot.plate.setAlpha(1)); scene.input.setDefaultCursor('default');
      tooltip.hide(); service = null; root.setData('equipmentService', null); help.setVisible(false); hint.setText(EQUIP_HINT);
    };
    const move = (pointer: Phaser.Input.Pointer) => { if (carrying?.icon) carrying.icon.setPosition(pointer.worldX - carrying.width / 2, pointer.worldY - carrying.height / 2); };
    const slot = (address: PartyEquipmentSlot, item: Item | null, x: number, y: number) => {
      const plate = clip('inventorySlot', 1, x, y);
      const asset = manifest.clips.itemPicture;
      const width = item ? GRAPHIC_WIDTH[item.graphic] ?? asset.frameWidth : 48, height = item ? GRAPHIC_HEIGHT[item.graphic] ?? asset.frameHeight : 44;
      const record: Slot = { address, item, plate, x: x - (width - 48) / 2 - 4, y, width, height }; slots.push(record);
      if (address.kind === 'inventory' && address.slot < 5) text(layout.inventorySlot.children.shortNum, String(address.slot + 1), x, y);
      if (isOccupiedItem(item)) {
        record.icon = scene.add.container(record.x, y); root.add(record.icon);
        record.icon.add(scene.add.image(-asset.originX, -asset.originY, 'itemPicture', String(item.graphic)).setOrigin(0));
        if (item.type === ITEM_TYPE.use && item.ammoMax > 0) record.icon.add(scene.add.text(30.95, 2, `x ${item.ammo}`, { resolution: 2, fontFamily: 'ElonaMenu', fontSize: '12px', color: '#ffffff', stroke: '#000000', strokeThickness: 2 }));
      }
      const area = scene.add.zone(x, y, 48, 44).setOrigin(0).setInteractive({ useHandCursor: true }).setName(`equipment-${address.kind}-${address.slot}`);
      area.setData({ ...address, itemId: item?.id ?? null }); root.add(area);
      area.on('pointerover', () => {
        if (service || modal) return;
        if (isOccupiedItem(item) && !carrying) {
          tooltip.show(item);
          warning.setText(address.kind === 'inventory' && item.type === ITEM_TYPE.gun && !canUse(state.members.find(member => member.slot === 0), item) ? SKILL_WARNING : '');
        }
      });
      area.on('pointerout', () => { if (!carrying && !service) { tooltip.hide(); hint.setText(EQUIP_HINT); warning.setText(''); } });
      area.on('pointerdown', (pointer: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
        e.stopPropagation(); if (modal) return;
        if (service) {
          const action = service, valid = canService(record); clear();
          if (valid) {
            const outcome = callbacks.serviceItem(action, address.slot);
            if (outcome === 'not-enough-ap') message("You don't have enough action points!");
          }
          return;
        }
        if (!carrying) {
          if (!isOccupiedItem(item)) return;
          carrying = record; root.setData('carrying', address); slots.forEach(other => other.plate.setAlpha(eligible(record, other) ? 1 : 0.5));
          if (record.icon) root.bringToTop(record.icon); scene.input.setDefaultCursor('grabbing'); move(pointer); tooltip.show(item);
          return;
        }
        const from = carrying;
        if (from === record) { clear(); return; }
        if (!eligible(from, record)) { clear(); message(SKILL_WARNING); return; }
        clear();
        if (from.item?.type === ITEM_TYPE.mod && isOccupiedItem(item) && item.type === ITEM_TYPE.gun) {
          if (callbacks.requestModMount) callbacks.requestModMount(from.address, address);
          else message('Mount this MOD through the shop. The item has been kept.');
        } else callbacks.swapEquipment(from.address, address);
      });
    };
    for (const member of state.members.filter(member => member.slot < 5)) {
      portrait(member, menu.x + spec.portraits.x + member.slot * spec.portraits.stepX, menu.y + spec.portraits.y, true);
      const p = spec.slots.companions, x = menu.x + p.x + member.slot * p.stepX, y = menu.y + p.y;
      if (member.slot === 0) clip('inventorySlot', 1, x, y).setAlpha(0.5);
      else slot({ kind: 'companion', slot: member.slot }, member.weapon, x, y);
    }
    state.inventory.forEach((item, index) => {
      const p = spec.slots.inventory;
      slot({ kind: 'inventory', slot: index }, item, menu.x + p.x + index % p.columns * p.stepX, menu.y + p.y + Math.floor(index / p.columns) * p.stepY);
    });
    // В Equipment бросок вне слота отменяет перенос; продажа есть только в Shop.
    const outside = () => { if ((carrying || service) && !modal) { clear(); callbacks.cancel(); } };
    scene.input.on('pointerdown', outside);
    scene.input.on('pointermove', move);
    root.once('destroy', () => { scene.input.off('pointerdown', outside); scene.input.off('pointermove', move); if (carrying) scene.input.setDefaultCursor('default'); });
  }
  if (state.dialog) {
    const member = state.members.find(value => value.slot === state.selectedSlot);
    const question = state.dialog === 'recruit' ? `Do you really want to recruit ${member?.name ?? ''} for ${member?.cost ?? 0} gp?`
      : state.dialog === 'dismiss' ? `Do you really want to dismiss ${member?.name ?? ''}?` : 'Do you really want to mount the mod on this gun?';
    // Только исходная кнопка Yes подтверждает; любое другое нажатие отменяет диалог.
    const outside = scene.add.zone(0, 0, 620, 380).setOrigin(0).setInteractive(); root.add(outside);
    outside.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => { e.stopPropagation(); callbacks.confirm(false); });
    image(layout.saleDialog.image);
    text(layout.saleDialog.children.question, question, 0, 0);
    for (const [name, key, answer] of [['yes', 'button_dialogYes', true], ['no', 'button_dialogNo', false]] as const) {
      const p = layout.saleDialog.children[name];
      const object = image(key, p.x, p.y, p).setInteractive(buttonInput(manifest.images[key]));
      object.on('pointerover', () => object.setTexture(`${key}_over`)); object.on('pointerout', () => object.setTexture(key));
      object.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => { e.stopPropagation(); callbacks.confirm(answer); });
    }
  }
  return root;
}
