import Phaser from 'phaser';
import { Simulation, type EnemyState, type SimulationEvent } from './simulation.ts';
import { WORLD } from './content.ts';
import { weaponPresentation } from './combat-stats.ts';
import { exportSave, readMute, readSave, storeMute, storeSave } from './storage.ts';
import { OriginalAlly, type OriginalAllyMetadata } from './original-animation.ts';
import { createLootView } from './loot-view.ts';
import { createSkillView } from './skill-view.ts';
import { createTownView, type TownLayout, type TownTab, type TownDialog } from './town-view.ts';
import { createShopView, type ShopLayout } from './shop-view.ts';
import { ITEM_TYPE, isOccupiedItem } from './items.ts';
import { alphaMaskHit, ordinaryEnemyHit, type CollisionGeometry } from './collision.ts';
import type { ProjectileKind } from './projectiles.ts';
import './style.css';

interface ImageAsset { file: string; width: number; height: number; originX: number; originY: number }
interface ClipAsset { image: string; json: string; originX: number; originY: number; frameWidth: number; frameHeight: number; labels: Record<string, number>; count: number }
interface ProjectileVisual { clip: string; bodyX: number; hardLight?: { multiplyClip: string; addClip: string }; shadow?: { clip: string; x: number; scaleX: number; scaleY: number; aboveBody: boolean } }
interface Manifest { images: Record<string, ImageAsset>; clips: Record<string, ClipAsset>; sounds: Record<string, string>; fonts: Record<string, string>; projectileVisuals: Record<ProjectileKind, ProjectileVisual>; enemyArrowVisual: ProjectileVisual }
interface PortSave { format: 'elona-shooter-browser'; version: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10; appearance: number; simulation: unknown }
type Screen = 'title' | 'gene' | 'battle' | 'loot' | 'boss-loot' | 'skill' | 'result' | 'defeat' | 'town';

const container = document.querySelector<HTMLDivElement>('#game')!;
const loadStatus = document.querySelector<HTMLDivElement>('#load-status')!;
const status = document.querySelector<HTMLParagraphElement>('#save-status')!;
const assetUrl = (path: string) => `${import.meta.env.BASE_URL}assets/${path}`;
const MENU_X = -15.587619764971691;
const bootStarted = performance.now();
const USED_SOUNDS = new Set(['soundClick1', 'soundGun3', 'soundReloading2', 'soundReloaded2', 'soundThrow1', 'soundExp1', 'soundDead3', 'soundDead5', 'soundDead7', 'soundDeadChicken', 'soundDeadBoss1', 'soundDamage1', 'soundPop1', 'soundBattleBegin', 'soundBattleEnd', 'soundKilled', 'soundRampage', 'soundComplete', 'soundGold1', 'soundBgForest']);
for (let index = 0; index < 5; index++) USED_SOUNDS.add(`soundGoodshot${index}`);
USED_SOUNDS.add('soundReloaded1');
for (const key of ['soundBgTown', 'soundRepair1', 'soundBeep', 'soundScroll1', 'soundPay1', 'soundMod']) USED_SOUNDS.add(key);
for (let index = 1; index <= 15; index++) USED_SOUNDS.add(`soundGun${index}`);
for (const key of ['soundReloading1', 'soundReloading3', 'soundReloaded3', 'soundPray1', 'soundDefend', 'soundNight']) USED_SOUNDS.add(key);
for (const key of ['soundBow1', 'soundBow2', 'soundDead2', 'soundFireball', 'soundRampageEnemy', 'soundPuls']) USED_SOUNDS.add(key);
let manifest: Manifest;
let gameScene: ElonaScene;

class ElonaScene extends Phaser.Scene {
  screen: Screen = 'title';
  sim?: Simulation;
  appearance = 0;
  paused = false;
  muted = readMute();
  private accumulator = 0;
  private root!: Phaser.GameObjects.Container;
  private hud = new Map<string, Phaser.GameObjects.Text>();
  private enemySprites = new Map<number, Phaser.GameObjects.Image | OriginalAlly>();
  private bossFrames = new Map<number, number>();
  private bossBars = new Map<number, { container: Phaser.GameObjects.Container; fill: Phaser.GameObjects.Image }>();
  private projectileSprites = new Map<number, { container: Phaser.GameObjects.Container; body: Phaser.GameObjects.Container; images: Phaser.GameObjects.Image[]; shadow?: Phaser.GameObjects.Image }>();
  private enemyArrowSprites = new Map<number, { container: Phaser.GameObjects.Container; body: Phaser.GameObjects.Image; shadow: Phaser.GameObjects.Image }>();
  private playerSprite?: OriginalAlly;
  private ammoFill?: Phaser.GameObjects.Image;
  private selection?: Phaser.GameObjects.Rectangle;
  private cursor?: Phaser.GameObjects.Graphics;
  private pauseLayer?: Phaser.GameObjects.Container;
  private firePressed = false;
  private fireReleased = false;
  private firingGesture = false;
  private firingReleaseOwned = false;
  private reloadRequested = false;
  private reloadAnimations = 0;
  private slotRequested?: number;
  private hotbar: { icon: Phaser.GameObjects.Image; count: Phaser.GameObjects.Text; cooldown: Phaser.GameObjects.Image }[] = [];
  private effects: { object: Phaser.GameObjects.GameObject; ticks: number; moveY?: number; clip?: string; frame?: number }[] = [];
  private ambient?: Phaser.Sound.BaseSound;
  private bowSound?: Phaser.Sound.BaseSound;
  private fpsSamples: number[] = [];
  private maskCache = new Map<string, { width: number; height: number; data: Uint8ClampedArray }>();

  constructor() { super('Elona'); }

  preload(): void {
    this.load.json('ally-animation', assetUrl('ally-animation.json'));
    this.load.json('collision-geometry', assetUrl('collision-geometry.json'));
    this.load.json('town-layout', assetUrl('town-layout.json'));
    for (const [key, asset] of Object.entries(manifest.images)) this.load.image(key, assetUrl(asset.file));
    for (const [key, asset] of Object.entries(manifest.clips)) this.load.atlas(key, assetUrl(asset.image), assetUrl(asset.json));
    for (const [key, file] of Object.entries(manifest.sounds)) if (USED_SOUNDS.has(key)) this.load.audio(key, assetUrl(file));
    this.load.on('progress', (progress: number) => { loadStatus.textContent = `Loading original game assets… ${Math.round(progress * 100)}%`; });
    this.load.on('loaderror', (file: Phaser.Loader.File) => { loadStatus.textContent = `Unable to load ${file.key}. Reload to try again.`; });
  }

  create(): void {
    gameScene = this;
    // Все 273 изображения charaPic в SWF используют несглаживаемую заливку 0x43.
    // Сохраняем дробные исходные координаты, но исключаем размытие соседних пикселей тела.
    this.textures.get('charaPic').setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.game.canvas.tabIndex = 0;
    this.game.canvas.setAttribute('aria-label', 'Elona Shooter battlefield');
    loadStatus.hidden = true;
    container.dataset.loadMs = (performance.now() - bootStarted).toFixed(0);
    this.sound.mute = this.muted;
    this.root = this.add.container(0, 0);
    this.input.mouse?.disableContextMenu();
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.screen !== 'battle' || this.paused || pointer.y < 30 || pointer.y > 345) return;
      if (pointer.button === 0 && pointer.leftButtonDown()) { this.firePressed = true; this.firingGesture = this.firingReleaseOwned = true; }
    });
    const releaseFire = (pointer: Phaser.Input.Pointer) => {
      // Отпускание другой кнопки не выпускает стрелу при удерживаемой левой.
      if (pointer.button !== 0) return;
      if (this.firingReleaseOwned) this.fireReleased = true;
      this.firingGesture = this.firingReleaseOwned = false;
    };
    this.input.on('pointerup', releaseFire);
    this.input.on('pointerupoutside', releaseFire);
    // За пределами поля удерживаемый огонь прекращается, но MouseUp ещё принадлежит этому нажатию.
    this.input.on('gameout', () => { this.firingGesture = false; });
    this.input.on('gameover', (_time: number, event: MouseEvent | TouchEvent) => {
      if (this.firingReleaseOwned && 'buttons' in event && (event.buttons & 1) !== 0) this.firingGesture = true;
    });
    this.input.keyboard?.on('keydown-SPACE', (event: KeyboardEvent) => {
      event.preventDefault();
      if (this.screen !== 'battle') return;
      if (this.paused) this.togglePause();
      else this.reloadRequested = true;
    });
    this.input.keyboard?.on('keydown-ESC', () => { if (this.screen === 'battle') this.togglePause(); else if (this.screen === 'gene') this.showTitle(); });
    ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'].forEach((key, slot) => {
      this.input.keyboard?.on(`keydown-${key}`, () => { if (this.screen === 'battle' && !this.paused) this.slotRequested = slot; });
    });
    this.game.events.on(Phaser.Core.Events.BLUR, () => { if (this.screen === 'battle' && !this.paused) this.togglePause(); });
    this.showTitle();
    document.querySelector('#scope-note')!.textContent = 'Sheriff Days 1–3, rewards, the shop, weapon upgrades, MOD mounting, Free Repair and Rest are playable. Number keys 1–5 use owned equipment and consumables; hold and release the mouse to draw and fire a bow. Ragnarok, other town actions, Day 4 onward and other classes are still being ported. Original game and artwork by Noa; original credits retained.';
    this.updateSoundButton();
  }

  private reset(screen: Screen): void {
    const keepTownAmbience = this.screen === 'town' && screen === 'town';
    this.screen = screen;
    this.paused = false;
    this.accumulator = 0;
    this.firePressed = this.fireReleased = this.reloadRequested = false; this.slotRequested = undefined;
    this.firingGesture = this.firingReleaseOwned = false;
    this.input.setDefaultCursor('default');
    this.root.removeAll(true);
    for (const arrow of this.enemyArrowSprites.values()) arrow.container.destroy(true);
    this.enemyArrowSprites.clear();
    this.enemySprites.clear(); this.bossFrames.clear(); this.bossBars.clear(); this.projectileSprites.clear(); this.hud.clear(); this.effects = []; this.hotbar = [];
    this.bowSound?.destroy(); this.bowSound = undefined;
    this.reloadAnimations = 0;
    this.pauseLayer = undefined; this.playerSprite = undefined; this.cursor = undefined; this.selection = undefined; this.ammoFill = undefined;
    if (!keepTownAmbience) { this.ambient?.destroy(); this.ambient = undefined; }
    container.dataset.screen = screen;
    container.dataset.paused = 'false';
    container.dataset.bossBars = '0'; container.dataset.bossHealth = '[]';
    container.dataset.playerFrame = ''; container.dataset.reloadTicks = '0'; container.dataset.reloadAnimations = '0';
    container.dataset.projectiles = '[]'; container.dataset.enemyArrows = '[]'; container.dataset.bowDrawing = 'false';
    delete container.dataset.lootOffers; delete container.dataset.inventory;
    delete container.dataset.skillChoices; delete container.dataset.selectedTrait; delete container.dataset.traits; delete container.dataset.skillPoints;
    delete container.dataset.actionPoints; delete container.dataset.townTab; delete container.dataset.repairDialog; delete container.dataset.townDialog;
    delete container.dataset.shopStock; delete container.dataset.saleSlot; delete container.dataset.upgradeSelecting;
    delete container.dataset.pendingTownAction; delete container.dataset.upgradePreview;
  }

  private image(key: string, x = 0, y = 0): Phaser.GameObjects.Image | undefined {
    const asset = manifest.images[key];
    if (!asset) return;
    const object = this.add.image(x - (asset.originX ?? 0), y - (asset.originY ?? 0), key).setOrigin(0);
    this.root.add(object);
    return object;
  }

  private clip(key: string, frame: number, x: number, y: number): Phaser.GameObjects.Image | undefined {
    const asset = manifest.clips[key];
    if (!asset) return;
    const actual = this.textures.get(key).has(String(frame)) ? String(frame) : '1';
    const object = this.add.image(x - asset.originX, y - asset.originY, key, actual).setOrigin(0);
    this.root.add(object);
    return object;
  }

  private text(x: number, y: number, content: string, size = 13, color = '#322316', font = 'ElonaMenu'): Phaser.GameObjects.Text {
    const object = this.add.text(x, y, content, { fontFamily: font, fontSize: `${size}px`, color, padding: { x: 1, y: 1 } });
    this.root.add(object);
    return object;
  }

  private zone(x: number, y: number, width: number, height: number, action: () => void): Phaser.GameObjects.Zone {
    const zone = this.add.zone(x, y, width, height).setOrigin(0).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => { event.stopPropagation(); this.playSound('soundClick1'); action(); });
    this.root.add(zone);
    return zone;
  }

  private labelButton(x: number, y: number, label: string, action: () => void, width = 130): void {
    const plate = this.add.rectangle(x, y, width, 27, 0xcdb98f).setOrigin(0).setStrokeStyle(1, 0x796a4f);
    this.root.add(plate);
    this.text(x + 12, y + 4, label, 17);
    const zone = this.zone(x, y, width, 27, action);
    zone.on('pointerover', () => plate.setFillStyle(0xe9d6ad));
    zone.on('pointerout', () => plate.setFillStyle(0xcdb98f));
  }

  private originalButton(key: string, x: number, y: number, action: () => void): void {
    const button = this.image(key, x, y);
    if (!button) return;
    button.setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 100 });
    button.on('pointerover', () => { if (manifest.images[`${key}_over`]) button.setTexture(`${key}_over`); });
    button.on('pointerout', () => button.setTexture(key));
    button.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => { event.stopPropagation(); this.playSound('soundClick1'); action(); });
  }

  showTitle(): void {
    this.reset('title');
    this.image('title');
    for (const [key, x, y, action] of [
      ['button_newGame', 185, 195.7, () => this.showGene()],
      ['button_continue', 187.9, 249, () => this.continueGame()],
      ['button_help', 207.9, 301, () => this.showHelp()],
    ] as const) {
      const button = this.image(key, x, y);
      if (button) {
        button.setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 100 }).on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => { event.stopPropagation(); this.playSound('soundClick1'); action(); });
        button.on('pointerover', () => button.setTint(0xffedaf)).on('pointerout', () => button.clearTint());
      } else this.labelButton(x + 45, y - 15, key.replace('button_', ''), action);
    }
    const saved = readSave();
    const savedDay = saved.kind === 'saved' ? (saved.data as { simulation?: { day?: unknown } } | null)?.simulation?.day : undefined;
    this.text(469, 32, saved.kind === 'saved' ? (typeof savedDay === 'number' && [1, 2, 3].includes(savedDay) ? `Sheriff · Day ${savedDay}` : 'Saved Sheriff') : 'Empty Save', 12, '#151515', 'Arial').setBackgroundColor('#ede9de').setFixedSize(137, 20);
    this.text(334, 11, 'Most Days Survived: 0 / 0 (HC) / 0 (Casual)', 12, '#ffffff').setShadow(1, 1, '#000000', 2);
    if (saved.kind === 'error') status.textContent = saved.message;
  }

  private showHelp(): void {
    this.showGene();
    this.root.removeAll(true);
    this.image(manifest.images.townHud ? 'townHud' : 'town', -5, -15);
    this.root.add(this.add.rectangle(0, 0, 620, 380, 0x000000, 0.45).setOrigin(0));
    this.root.add(this.add.rectangle(90, 50, 440, 280, 0xe0d1ae).setOrigin(0).setStrokeStyle(2, 0x9e8c61));
    this.text(123, 73, 'How to Play', 26);
    this.text(123, 121, 'Mouse: aim and fire; bows hold/release.\n1–5 select or use an inventory slot.\nSpace reloads; click cancels manual reload.\nEsc pauses; Space also resumes.\n\nDefend the castle until the day ends.\nMission → Rest starts the next day (up to\nDay 3) without repairing the castle.', 16).setLineSpacing(3);
    this.labelButton(245, 288, 'Return to Title', () => this.showTitle(), 145);
  }

  showGene(): void {
    this.reset('gene');
    this.sim = new Simulation(Date.now(), { ...this.simulationOptions(), deferOpeningWaves: true });
    this.image(manifest.images.townHud ? 'townHud' : 'town');
    this.drawHud();
    const background = new Set(this.root.list);
    this.image('gene');
    this.appearance = Math.max(0, Math.min(21, this.appearance));
    for (let index = 0; index < 22; index++) {
      const x = 176 + index % 11 * 32;
      const y = 131 + Math.floor(index / 11) * 30;
      this.clip('charaPic', index * 10 + 5, x - 11.95, y - 14.7)?.setScale(1, 0.9530487);
      this.zone(x - 14, y - 17, 30, 31, () => { this.appearance = index; this.sim?.rerollOpeningHero(); this.moveSelection(); });
    }
    this.selection = this.add.rectangle(0, 0, 28, 29).setStrokeStyle(1, 0x8c3420).setOrigin(0);
    this.root.add(this.selection); this.moveSelection();
    ['Rogue', 'Hunter', 'Sheriff', 'Militia'].forEach((name, index) => {
      const y = 214 + index * 20;
      if (manifest.clips.radioButton) this.clip('radioButton', index === 2 ? 2 : 1, 180, y);
      else this.root.add(this.add.circle(180, y, 6, index === 2 ? 0xa24b28 : 0x8f8d7e).setStrokeStyle(1, 0x514b36));
      this.text(194, y - 7, name, 14, index === 2 ? '#22170e' : '#7e7765');
      this.zone(171, y - 8, 90, 18, () => {
        if (index === 2) this.sim?.rerollOpeningHero();
        else status.textContent = `${name} has not been ported yet. Sheriff is available in this first playable slice.`;
      });
    });
    this.text(280, 205, 'Starts with a shotgun.', 13, '#2d315b');
    this.text(294, 224, 'Sheriff\nShotgun 2\nFury', 13).setLineSpacing(4);
    this.originalButton('button_proceed', 267, 301, () => this.startGame());
    this.originalButton('button_gameMods', 408, 301, () => { status.textContent = 'Game MODs will return as their underlying systems are ported.'; });
    this.text(159, 302, 'Next Page', 13, '#8e8470');
    this.text(432, 252, 'Casual Mode\nHardcore Mode', 12, '#8e8470', 'Arial').setLineSpacing(10);
    this.zone(145, 294, 103, 37, () => { status.textContent = 'Additional classes and their unlocks are still being ported.'; });
    this.zone(405, 244, 140, 55, () => { status.textContent = 'This comparison build uses the original normal difficulty.'; });
    const menu = this.root.list.filter(object => !background.has(object));
    this.root.add(this.add.container(MENU_X, 0, menu));
  }

  private moveSelection(): void {
    this.selection?.setPosition(162 + this.appearance % 11 * 32, 114 + Math.floor(this.appearance / 11) * 30);
  }

  private simulationOptions() { return { hitTest: (enemy: Readonly<EnemyState>, x: number, y: number) => this.hitTest(enemy, x, y) }; }

  startGame(): void {
    if (!this.sim?.startOpeningBattle()) this.sim = new Simulation(Date.now(), this.simulationOptions());
    this.enterBattle();
    this.saveGame(false);
    this.playSound('soundBattleBegin');
  }

  private enterBattle(): void {
    this.reset('battle');
    this.image('battle');
    this.playerSprite = new OriginalAlly(this, this.cache.json.get('ally-animation') as OriginalAllyMetadata, manifest.clips, this.appearance, WORLD.playerX, WORLD.playerY);
    this.root.add(this.playerSprite);
    this.playerSprite.setOriginalFrame(weaponPresentation(this.sim?.selectedItem?.id ?? 0).idleFrame);
    if (this.sim?.state.player.bowDrawing) this.playerSprite.playOriginal(86);
    if (this.sim?.weapon?.reloadTime && !this.sim.weapon.autoReload) this.playerSprite.playOriginal('reload');
    this.drawHud();
    this.cursor = this.add.graphics(); this.root.add(this.cursor);
    this.input.setDefaultCursor('crosshair');
    if (this.cache.audio.exists('soundBgForest')) this.ambient = this.sound.add('soundBgForest', { volume: 0.3, loop: true });
    this.ambient?.play();
    this.paintBattle();
  }

  private drawHud(): void {
    this.ammoFill = this.image('ammo_fill', 290.9, 11);
    const values: [string, number, number, string, number, string][] = [
      ['day', 47, 9, '1/5', 16, 'ElonaHud'], ['ammo', 292, 10, '5/5', 16, 'ElonaHud'],
      ['gold', 427, 9, '200', 16, 'ElonaHud'], ['hp', 531, 9, '40/40', 16, 'ElonaHud'],
      ['level', 518, 355, '1', 10, 'ElonaSmall'], ['exp', 518, 367, '0', 10, 'ElonaSmall'],
    ];
    for (const [key, x, y, value, size, font] of values) {
      const text = this.text(x, y, value, size, '#ffffff', font).setShadow(1, 1, '#000000', 2);
      this.hud.set(key, text);
    }
    this.zone(580, 344, 40, 36, () => { if (this.screen === 'battle') this.togglePause(); else this.showTitle(); });
    this.zone(546, 350, 31, 30, () => this.toggleMute());
    for (let slot = 0; slot < 5; slot++) {
      const icon = this.clip('itemPicture', 1, 25 + slot * 90, 343)!;
      const count = this.text(50 + slot * 90, 363, '', 11, '#ffffff', 'Arial').setShadow(1, 1, '#000000', 2);
      const timer = manifest.clips.itemTimer;
      // Исходный itemTimer.bar расположен внутри контейнера в (38.95, 6.5).
      const cooldown = this.add.image(slot * 90 - 20 + 38.95, 350 + 6.5, 'itemTimer', '1')
        .setOrigin((timer.originX + 38.95) / timer.frameWidth, (timer.originY + 6.5) / timer.frameHeight);
      this.root.add(cooldown);
      this.hotbar.push({ icon, count, cooldown });
    }
    this.updateHud();
  }

  update(_time: number, delta: number): void {
    if (this.screen !== 'battle' || !this.sim || this.paused) return;
    const pointer = this.input.activePointer;
    this.accumulator += Math.min(delta, 250);
    this.fpsSamples.push(delta);
    if (this.fpsSamples.length > 300) this.fpsSamples.shift();
    // Кадр Flash и Timer(50) рассчитываются отдельно внутри симуляции; частота монитора не меняет баланс.
    while (this.accumulator >= 1000 / 30 && this.sim.state.phase === 'battle') {
      // Коллизия босса использует текущую симуляцию даже между кадрами отрисовки.
      for (const enemy of this.sim.state.enemies) if (enemy.kind === 'boss') this.syncBossActor(enemy);
      this.sim.tick({ aimX: pointer.x, aimY: pointer.y, firePressed: this.firePressed, fireReleased: this.fireReleased, fireHeld: this.firingGesture && pointer.isDown && pointer.leftButtonDown(), reload: this.reloadRequested, slot: this.slotRequested });
      this.firePressed = this.fireReleased = this.reloadRequested = false; this.slotRequested = undefined;
      if (!this.sim.state.player.bowDrawing && this.bowSound) { this.bowSound.destroy(); this.bowSound = undefined; }
      this.accumulator -= 1000 / 30;
      this.playerSprite?.stepOriginal();
      for (const actor of this.enemySprites.values()) if (actor instanceof OriginalAlly) actor.stepOriginal();
      if (!this.sim.weapon?.reloadTime && this.playerSprite && this.playerSprite.currentOriginalFrame >= 30 && this.playerSprite.currentOriginalFrame <= 41) this.playerSprite.stopOriginal(weaponPresentation(this.sim.selectedItem?.id ?? 0).idleFrame);
      this.animateEffects();
      for (const event of this.sim.events) this.renderEvent(event);
      if (this.sim.state.tick % 150 === 0) this.saveGame(false);
    }
    this.paintBattle();
    if (this.sim.state.phase !== 'battle') {
      this.saveGame(false);
      this.showOutcome();
    }
  }

  private enemyClip(enemy: Readonly<EnemyState>): string {
    return enemy.kind === 'boss' ? 'charaPic' : `enemy_${enemy.kind}`;
  }

  private enemyFrame(enemy: Readonly<EnemyState>, key: string): string {
    const texture = this.textures.get(key);
    if (enemy.kind === 'boss') return String(enemy.appearance * 10 + (enemy.bossAction === 2 ? 5 + Math.floor(enemy.frame / 4) % 2 : 1));
    return texture?.has(String(enemy.frame)) ? String(enemy.frame) : '1';
  }

  private syncBossActor(enemy: Readonly<EnemyState>): OriginalAlly {
    let actor = this.enemySprites.get(enemy.uid);
    if (!(actor instanceof OriginalAlly)) {
      actor = new OriginalAlly(this, this.cache.json.get('ally-animation') as OriginalAllyMetadata, manifest.clips, enemy.appearance, enemy.x, enemy.y).setScale(-1, 1);
      this.root.add(actor);
      this.enemySprites.set(enemy.uid, actor);
    }
    actor.setPosition(enemy.x, enemy.y);
    if (this.bossFrames.get(enemy.uid) !== enemy.frame) {
      actor.playOriginal(enemy.frame);
      this.bossFrames.set(enemy.uid, enemy.frame);
    }
    return actor;
  }

  private paintBattle(): void {
    if (!this.sim) return;
    const state = this.sim.state;
    const present = new Set<number>();
    for (const enemy of [...state.enemies].sort((a, b) => a.y - b.y)) {
      const key = this.enemyClip(enemy);
      if (!manifest.clips[key]) continue;
      present.add(enemy.uid);
      let sprite = enemy.kind === 'boss' ? this.syncBossActor(enemy) : this.enemySprites.get(enemy.uid);
      if (!sprite) {
        sprite = this.clip(key, enemy.frame, enemy.x, enemy.y);
        if (sprite) this.enemySprites.set(enemy.uid, sprite);
      }
      if (!sprite) continue;
      const asset = manifest.clips[key];
      if (!(sprite instanceof OriginalAlly)) {
        sprite.setFrame(this.enemyFrame(enemy, key));
        sprite.setPosition(enemy.x - asset.originX, enemy.y - asset.originY);
      }
      sprite.setAlpha(enemy.hp <= 0 && enemy.deathTicks > 99 ? Math.pow(0.96, enemy.deathTicks - 99) : 1);
      this.root.bringToTop(sprite);
    }
    for (const [uid, sprite] of this.enemySprites) if (!present.has(uid)) { sprite.destroy(); this.enemySprites.delete(uid); }
    this.paintBossBars();
    if (this.playerSprite) {
      this.root.bringToTop(this.playerSprite);
    }
    this.paintProjectiles();
    this.updateHud();
    for (const text of this.hud.values()) this.root.bringToTop(text);
    const pointer = this.input.activePointer;
    this.cursor?.clear();
    if (pointer.x >= 0 && pointer.x < 620 && pointer.y > 30 && pointer.y < 345) {
      const radius = 5 + state.player.accuracyFix * 20;
      this.cursor?.lineStyle(1, 0xffffff, 0.8).strokeCircle(pointer.x, pointer.y, radius);
      this.cursor?.lineBetween(pointer.x - radius - 4, pointer.y, pointer.x - radius + 1, pointer.y);
      this.cursor?.lineBetween(pointer.x + radius - 1, pointer.y, pointer.x + radius + 4, pointer.y);
      if (this.cursor) this.root.bringToTop(this.cursor);
    }
    container.dataset.playerFrame = String(this.playerSprite?.currentOriginalFrame ?? '');
    container.dataset.reloadTicks = String(this.sim.weapon?.reloadTime ?? 0);
    container.dataset.reloadAnimations = String(this.reloadAnimations);
    container.dataset.frameMs = (this.fpsSamples.reduce((a, b) => a + b, 0) / Math.max(1, this.fpsSamples.length)).toFixed(2);
    container.dataset.slowFrames = String(this.fpsSamples.filter(ms => ms > 50).length);
    container.dataset.maxFrameMs = Math.max(0, ...this.fpsSamples).toFixed(2);
    this.paintEnemyArrows();
  }

  private paintEnemyArrows(): void {
    const arrows = this.sim?.state.enemyArrows ?? [];
    const present = new Set<number>();
    const visual = manifest.enemyArrowVisual;
    for (const arrow of arrows) {
      if (arrow.removed) continue;
      present.add(arrow.uid);
      let sprite = this.enemyArrowSprites.get(arrow.uid);
      if (!sprite) {
        const asset = manifest.clips[visual.clip], shadowAsset = manifest.clips[visual.shadow!.clip];
        const body = this.add.image(visual.bodyX, arrow.y, visual.clip, '1')
          .setOrigin(asset.originX / asset.frameWidth, asset.originY / asset.frameHeight);
        const shadow = this.add.image(visual.shadow!.x, arrow.shadowY, visual.shadow!.clip, '1')
          .setOrigin(shadowAsset.originX / shadowAsset.frameWidth, shadowAsset.originY / shadowAsset.frameHeight)
          .setScale(visual.shadow!.scaleX, visual.shadow!.scaleY);
        // stage.addChild в SWF помещает стрелу и её тень над всем корнем игры, включая HUD.
        const group = this.add.container(arrow.x, 0, visual.shadow!.aboveBody ? [body, shadow] : [shadow, body]).setDepth(1);
        sprite = { container: group, body, shadow };
        this.enemyArrowSprites.set(arrow.uid, sprite);
      }
      sprite.container.setX(arrow.x);
      sprite.body.setY(arrow.y).setAngle(arrow.rotation);
      sprite.shadow.setY(arrow.shadowY);
    }
    for (const [uid, sprite] of this.enemyArrowSprites) if (!present.has(uid)) { sprite.container.destroy(true); this.enemyArrowSprites.delete(uid); }
    container.dataset.enemyArrows = JSON.stringify(arrows.filter(arrow => !arrow.removed).map(({ uid, x, y, rotation, shadowY, age }) => ({ uid, x, y, rotation, shadowY, age })));
  }

  private paintProjectiles(): void {
    const present = new Set<number>();
    for (const projectile of this.sim?.state.projectiles ?? []) {
      present.add(projectile.uid);
      const visual = manifest.projectileVisuals[projectile.kind];
      let sprite = this.projectileSprites.get(projectile.uid);
      if (!sprite) {
        // Поворот и масштаб применяются к регистрации Flash, а не к центру PNG.
        const keys = visual.hardLight ? [visual.hardLight.multiplyClip, visual.hardLight.addClip] : [visual.clip];
        const images = keys.map((key, index) => {
          const asset = manifest.clips[key];
          const image = this.add.image(0, 0, key, '1').setOrigin(asset.originX / asset.frameWidth, asset.originY / asset.frameHeight);
          // Flash hard-light разложен на умножение и прибавление с исходной альфой.
          if (visual.hardLight) image.setBlendMode(index === 0 ? Phaser.BlendModes.MULTIPLY : Phaser.BlendModes.ADD);
          return image;
        });
        const body = this.add.container(0, 0, images);
        const group = this.add.container(0, 0);
        let shadow: Phaser.GameObjects.Image | undefined;
        if (visual.shadow) {
          const asset = manifest.clips[visual.shadow.clip];
          shadow = this.add.image(visual.shadow.x, 0, visual.shadow.clip, '1')
            .setOrigin(asset.originX / asset.frameWidth, asset.originY / asset.frameHeight)
            .setScale(visual.shadow.scaleX, visual.shadow.scaleY);
        }
        if (shadow && !visual.shadow!.aboveBody) group.add(shadow);
        group.add(body);
        if (shadow && visual.shadow!.aboveBody) group.add(shadow);
        this.root.add(group);
        sprite = { container: group, body, images, shadow };
        this.projectileSprites.set(projectile.uid, sprite);
      }
      sprite.container.setPosition(projectile.x, 0).setAlpha(Math.max(0, projectile.alpha));
      sprite.body.setPosition(visual.bodyX, projectile.y).setAngle(projectile.rotation).setScale(projectile.scale);
      const frame = projectile.kind === 'gravity' ? Math.min(13, projectile.pulseFrame) : projectile.kind === 'rocket' ? projectile.frame % 2 + 1 : 1;
      for (const image of sprite.images) image.setFrame(String(frame));
      sprite.shadow?.setY(projectile.shadowY).setAlpha(Math.max(0, projectile.shadowAlpha)).setVisible(projectile.shadowVisible);
      this.root.bringToTop(sprite.container);
    }
    for (const [uid, sprite] of this.projectileSprites) if (!present.has(uid)) { sprite.container.destroy(true); this.projectileSprites.delete(uid); }
    container.dataset.bowDrawing = String(this.sim?.state.player.bowDrawing ?? false);
    container.dataset.projectiles = JSON.stringify((this.sim?.state.projectiles ?? []).map(({ uid, kind, x, y, frame, pulseFrame, scale, alpha }) => ({ uid, kind, x, y, frame, pulseFrame, scale, alpha })));
  }

  private paintBossBars(): void {
    const bosses = this.sim?.state.enemies.filter(enemy => enemy.kind === 'boss' && enemy.hp > 0 && !enemy.removed) ?? [];
    const present = new Set(bosses.map(enemy => enemy.uid));
    for (const [uid, bar] of this.bossBars) if (!present.has(uid)) { bar.container.destroy(true); this.bossBars.delete(uid); }
    for (const enemy of bosses) {
      let bar = this.bossBars.get(enemy.uid);
      if (!bar) {
        const asset = manifest.clips.bossHealthFill;
        // В hpbar исходный дочерний bar сжимается относительно центра, а не левого края.
        const fill = this.add.image(11.95, 1.45, 'bossHealthFill', '1').setOrigin(asset.originX / asset.frameWidth, asset.originY / asset.frameHeight);
        bar = { container: this.add.container(enemy.x - 11, enemy.y + 22, [fill]), fill };
        this.root.add(bar.container); this.bossBars.set(enemy.uid, bar);
      }
      bar.container.setPosition(enemy.x - 11, enemy.y + 22);
      bar.fill.setScale(Phaser.Math.Clamp(enemy.hp / enemy.maxHp, 0, 1), 1);
      this.root.bringToTop(bar.container);
    }
    container.dataset.bossBars = String(this.bossBars.size);
    container.dataset.bossHealth = JSON.stringify(bosses.map(enemy => ({ uid: enemy.uid, fraction: enemy.hp / enemy.maxHp, x: enemy.x - 11, y: enemy.y + 22 })));
  }

  private hitTest(enemy: Readonly<EnemyState>, x: number, y: number): boolean {
    if (enemy.kind === 'boss') {
      const actor = this.enemySprites.get(enemy.uid);
      return actor instanceof OriginalAlly && actor.hitTestWorld(x, y, (key, frame, localX, localY) => this.texturePixelHit(key, frame, localX, localY));
    }
    return ordinaryEnemyHit({ kind: enemy.kind, x: enemy.x, y: enemy.y, frame: enemy.frame, shadowHit: enemy.shadowHit }, x, y, this.cache.json.get('collision-geometry') as CollisionGeometry);
  }

  private texturePixelHit(key: string, frameName: string, x: number, y: number): boolean {
    const cacheKey = `${key}:${frameName}`;
    let mask = this.maskCache.get(cacheKey);
    if (!mask) {
      const frame = this.textures.getFrame(key, frameName);
      const canvas = document.createElement('canvas'); canvas.width = frame.cutWidth; canvas.height = frame.cutHeight;
      const context = canvas.getContext('2d', { willReadFrequently: true })!;
      context.drawImage(frame.source.image as CanvasImageSource, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight, 0, 0, frame.cutWidth, frame.cutHeight);
      mask = { width: canvas.width, height: canvas.height, data: context.getImageData(0, 0, canvas.width, canvas.height).data };
      this.maskCache.set(cacheKey, mask);
    }
    return alphaMaskHit(mask, x, y);
  }

  private renderEvent(event: SimulationEvent): void {
    const sound: Partial<Record<SimulationEvent['type'], string>> = { shot: 'soundGun3', reload: 'soundReloading2', reloaded: 'soundReloaded2', grenade: 'soundThrow1', explosion: 'soundExp1', kill: 'soundDead1', 'castle-hit': 'soundDamage1', wave: 'soundPop1', victory: 'soundBattleEnd', defeat: 'soundKilled', rampage: 'soundRampage', 'level-up': 'soundComplete', gold: 'soundGold1' };
    if (event.weaponId !== undefined) {
      const presentation = weaponPresentation(event.weaponId);
      sound.shot = `sound${presentation.sound[0].toUpperCase()}${presentation.sound.slice(1)}`;
      const manual = this.sim?.weapon?.manualReload;
      const reloadVariant = event.weaponId === 14 || event.weaponId === 15 ? 3 : 2;
      sound.reload = manual ? `soundReloading${reloadVariant}` : 'soundReloading1';
      sound.reloaded = manual ? `soundReloaded${reloadVariant}` : 'soundReloaded1';
      // Автоперезарядка скрывает анимацию, но звук каждого нового патрона остаётся.
      // cancelReload после последнего автоматического патрона получает уже нулевой таймер.
      if (event.automaticReload && manual) delete sound.reloaded;
    }
    Object.assign(sound, { select: 'soundReloaded1', beep: 'soundBeep', repair: 'soundRepair1', protection: 'soundPray1', defend: 'soundDefend', pulse: 'soundPuls', 'enemy-arrow': 'soundBow1' });
    if (event.message) status.textContent = event.message;
    if (event.type === 'kill') {
      const enemy = this.sim?.state.enemies.find(candidate => candidate.uid === event.enemyUid);
      if (enemy) sound.kill = { sheep: 'soundDead3', rat: 'soundDead7', chicken: 'soundDeadChicken', crow: 'soundDead5', archer: 'soundDead2', boss: 'soundDeadBoss1' }[enemy.kind];
      // Выбор реплики уже сделан симуляцией в исходном порядке случайных вызовов.
      if (event.goodShotIndex !== undefined) this.playSound(`soundGoodshot${event.goodShotIndex}`, 0.65);
    }
    if (sound[event.type]) this.playSound(sound[event.type]!, event.type === 'kill' ? 0.4 : 0.65);
    if (event.type === 'shot') {
      this.playerSprite?.playOriginal(weaponPresentation(event.weaponId ?? 0).shootFrame);
    }
    if (event.type === 'bow-draw') {
      this.playerSprite?.playOriginal(86);
      this.bowSound?.destroy();
      if (this.cache.audio.exists('soundBow2')) { this.bowSound = this.sound.add('soundBow2', { volume: 0.65 }); this.bowSound.play(); }
    }
    if (event.type === 'select' || event.type === 'shot') { this.bowSound?.destroy(); this.bowSound = undefined; }
    if (event.type === 'select' || (event.type === 'reloaded' && (!event.automaticReload || !this.sim?.weapon?.manualReload))) {
      this.playerSprite?.stopOriginal(weaponPresentation(event.weaponId ?? 0).idleFrame);
    }
    if (event.type === 'reload' && !event.automaticReload) {
      // Каждый следующий патрон заново запускает исходную анимацию перезарядки.
      this.playerSprite?.playOriginal('reload'); this.reloadAnimations++;
    }
    if (event.type === 'hit') {
      const damage = this.text(event.x ?? 0, (event.y ?? 0) - 25, `${event.amount}${event.critical ? '!' : ''}`, 13, event.critical ? '#ffef62' : '#ffffff', 'ElonaHud').setShadow(1, 1, '#000000', 2);
      this.effects.push({ object: damage, ticks: 24, moveY: -0.6 });
    }
    if (event.type === 'explosion') {
      const key = event.explosionKind === 'rocket' ? 'explosionLarge' : 'explosion';
      const asset = manifest.clips[key];
      const explosion = this.add.image(event.x ?? 0, event.y ?? 0, key, '1')
        .setOrigin(asset.originX / asset.frameWidth, asset.originY / asset.frameHeight).setScale(event.scale ?? 1).setAlpha(0.85);
      this.root.add(explosion);
      // Кадровые скрипты удаляют исходные эффекты на 23-м и 13-м кадрах.
      this.effects.push({ object: explosion, ticks: key === 'explosion' ? 22 : 12, clip: key, frame: 1 });
    }
    if (event.type === 'protection') {
      const effect = this.clip('layhand', 1, event.x ?? 550, event.y ?? 270);
      if (effect) this.effects.push({ object: effect, ticks: manifest.clips.layhand.count, clip: 'layhand', frame: 1 });
    }
    if (event.type === 'wave' || event.type === 'rampage' || event.type === 'level-up') {
      const message = this.text(310, 90, event.type === 'wave' ? `Wave ${event.amount}` : event.type === 'rampage' ? 'RAMPAGE!' : 'Level Up!', 27, '#ffefb0').setOrigin(0.5).setShadow(2, 2, '#000000', 3);
      this.effects.push({ object: message, ticks: 45 });
    }
  }

  private animateEffects(): void {
    this.effects = this.effects.filter(effect => {
      effect.ticks--;
      if (effect.ticks <= 0) { effect.object.destroy(); return false; }
      if (effect.moveY && effect.object instanceof Phaser.GameObjects.Text) effect.object.y += effect.moveY;
      if (effect.clip && effect.object instanceof Phaser.GameObjects.Image) effect.object.setFrame(String(++effect.frame!));
      this.root.bringToTop(effect.object);
      return true;
    });
  }

  private showOutcome(): void {
    if (!this.sim) return;
    if (this.sim.state.phase === 'town') { this.showTown(); return; }
    if (this.sim.state.phase === 'victory') {
      if (['loot', 'boss-loot'].includes(this.sim.state.postbattle)) { this.showLoot(); return; }
      if (this.sim.state.postbattle === 'skill') { this.showSkillChoice(); return; }
    }
    const state = this.sim.state;
    this.reset(state.phase === 'victory' ? 'result' : 'defeat');
    this.image('battle'); this.drawHud();
    this.playerSprite = new OriginalAlly(this, this.cache.json.get('ally-animation') as OriginalAllyMetadata, manifest.clips, this.appearance, WORLD.playerX, WORLD.playerY);
    this.root.add(this.playerSprite);
    this.paintBattle();
    if (state.phase === 'victory') {
      const background = new Set(this.root.list);
      this.image('result');
      const values = [state.resultBefore, state.gold - state.resultBefore - state.result.netReward, state.result.reward + state.result.perfectBonus, 0, 0, 0, -state.result.upkeep, state.gold];
      values.forEach((value, index) => this.text(252, 128 + index * 20 + (index === 7 ? 10 : 0), String(value), 12, value < 0 ? '#b02020' : '#14248d', 'Arial'));
      this.text(335, 145, `Day ${state.day} completed.\n\nEnemies defeated: ${state.kills}\nCritical kills: ${state.criticalKills}\nCastle: ${state.castleHp}/${state.castleMaxHp}`, 13).setWordWrapWidth(185);
      this.originalButton('button_proceed', 160, 301, () => {
        if (this.sim!.enterTown()) { this.saveGame(false); this.showTown(); }
      });
      const menu = this.root.list.filter(object => !background.has(object));
      this.root.add(this.add.container(MENU_X, 0, menu));
      status.textContent = `Day ${state.day} complete and saved. Proceed to town.`;
    } else {
      this.image('gameOver', 300, 205);
      this.zone(120, 175, 400, 70, () => this.showTitle());
      status.textContent = 'The castle fell. Start a new game to try again.';
    }
    this.hud.get('gold')?.setText(String(state.gold)); this.hud.get('hp')?.setText(`${state.castleHp}/${state.castleMaxHp}`);
    container.dataset.phase = state.phase;
  }

  private updateHud(): void {
    if (!this.sim) return;
    const state = this.sim.state;
    const selected = this.sim.selectedItem;
    this.hud.get('day')?.setText(`${state.day}/${state.waveIndex}`);
    this.hud.get('ammo')?.setText(selected ? `${selected.ammo}/${selected.ammoMax}` : '');
    this.hud.get('gold')?.setText(String(state.gold));
    this.hud.get('hp')?.setText(`${state.castleHp}/${state.castleMaxHp}`);
    this.hud.get('level')?.setText(String(state.player.level)); this.hud.get('exp')?.setText(String(state.player.exp / 10));
    this.hotbar.forEach(({ icon, count, cooldown }, slot) => {
      const item = state.inventory[slot], occupied = isOccupiedItem(item);
      icon.setVisible(occupied);
      if (occupied) icon.setFrame(String(item.graphic)).setAlpha(slot === state.player.selectedSlot ? 1 : 0.6);
      count.setText(occupied && item.type === ITEM_TYPE.use && item.ammo > 0 ? `x ${item.ammo}` : '');
      const remaining = state.itemCooldowns[slot];
      const timerMax = item?.id === 12 ? 2000 : 100;
      // Сохранённый счётчик включает последнее обновление, при котором Flash удаляет таймер.
      cooldown.setVisible(remaining > 0).setScale(Math.max(0, remaining - 1) / timerMax, 1);
    });
    this.ammoFill?.setScale(selected && selected.ammoMax > 0 ? selected.ammo / selected.ammoMax : 0, 1);
    container.dataset.gold = String(state.gold); container.dataset.hp = String(state.castleHp);
    container.dataset.ammo = String(selected?.ammo ?? 0); container.dataset.grenades = String(state.inventory.filter(item => isOccupiedItem(item) && item.id === 11).reduce((total, item) => total + item!.ammo, 0));
    container.dataset.selectedSlot = String(state.player.selectedSlot);
    container.dataset.inventory = JSON.stringify(state.inventory.map(item => isOccupiedItem(item) ? item.id : null));
    container.dataset.itemCooldowns = JSON.stringify(state.itemCooldowns);
    container.dataset.phase = state.phase; container.dataset.tick = String(state.tick); container.dataset.day = String(state.day);
    container.dataset.enemies = String(state.enemies.filter(enemy => enemy.hp > 0).length);
    container.dataset.kills = String(state.kills); container.dataset.appearance = String(this.appearance);
  }

  private showLoot(): void {
    if (!this.sim || !['loot', 'boss-loot'].includes(this.sim.state.postbattle)) return;
    const bossReward = this.sim.state.postbattle === 'boss-loot';
    this.reset(bossReward ? 'boss-loot' : 'loot');
    this.image('battle'); this.drawHud();
    this.updateHud();
    this.root.add(createLootView(this, this.sim.state, manifest, {
      move: (fromArea, from, toArea, to) => {
        const moved = this.sim!.moveLootItem(fromArea, from, toArea, to);
        if (moved) { this.playSound('soundClick1'); this.saveGame(false); this.showLoot(); }
        return moved;
      },
      proceed: () => {
        if (this.sim!.finishLoot()) { this.playSound('soundClick1'); this.saveGame(false); this.showOutcome(); }
      },
    }, bossReward ? 'boss' : 'ordinary'));
    container.dataset.phase = 'victory';
    container.dataset.lootOffers = JSON.stringify(this.sim.state.lootOffers.map(item => isOccupiedItem(item) ? item.id : null));
    container.dataset.inventory = JSON.stringify(this.sim.state.inventory.map(item => isOccupiedItem(item) ? item.id : null));
    status.textContent = 'Click an item, then click a destination slot. Items left in the loot row will be wasted when you proceed.';
  }

  private showSkillChoice(): void {
    if (!this.sim || this.sim.state.postbattle !== 'skill') return;
    this.reset('skill');
    this.image('battle'); this.drawHud(); this.updateHud();
    this.root.add(createSkillView(this, this.sim.state, manifest, {
      select: id => { container.dataset.selectedTrait = String(id); },
      choose: id => {
        if (!this.sim!.chooseSkill(id)) return false;
        this.playSound('soundClick1'); this.saveGame(false); this.showOutcome();
        return true;
      },
    }));
    container.dataset.skillChoices = JSON.stringify(this.sim.state.skillChoices);
    container.dataset.traits = JSON.stringify(this.sim.state.player.traits);
    container.dataset.skillPoints = String(this.sim.state.player.skillPoints);
    status.textContent = 'Choose a skill, review its improvement, then press Proceed to learn it.';
  }

  private showTown(tab: TownTab = 'mission', dialog: TownDialog = null, saleSlot: number | null = null, upgradeSelecting = false): void {
    if (!this.sim || this.sim.state.phase !== 'town' || !this.sim.state.town) return;
    const pending = this.sim.state.pendingTownAction;
    // Восстановление открывает то же подтверждение, не вызывая генерацию повторно.
    if (pending) { tab = 'shop'; dialog = null; saleSlot = null; upgradeSelecting = false; }
    this.reset('town');
    this.root.add(createTownView(this, this.sim.state, manifest, this.cache.json.get('town-layout') as TownLayout, {
      select: next => { this.playSound('soundScroll1'); this.showTown(next); },
      message: value => { status.textContent = value; },
      repair: () => {
        const outcome = this.sim!.freeRepair();
        if (outcome === 'repaired') {
          this.playSound('soundRepair1'); this.saveGame(false); this.showTown('castle', 'repair');
        } else {
          this.playSound('soundBeep');
          status.textContent = outcome === 'not-damaged' ? 'The castle is not damaged!' : outcome === 'not-enough-ap' ? "You don't have enough action points!" : 'Free Repair is available in town.';
        }
      },
      rest: () => { this.playSound('soundNight'); this.showTown('mission', 'rest'); },
      dismiss: () => {
        this.playSound('soundClick1');
        if (dialog === 'rest') {
          if (this.sim!.startNextDay()) {
            // procEventDialog воспроизводит второй щелчок внутри ветки сна.
            this.playSound('soundClick1'); this.enterBattle(); this.saveGame(false); this.playSound('soundBattleBegin');
            status.textContent = `Day ${this.sim!.state.day} begins.`;
          } else { this.showTown('mission'); status.textContent = 'The next day is not available yet.'; }
        } else this.showTown('castle');
      },
    }, tab, dialog));
    if (tab === 'shop' && this.sim.state.town.preparation === 'ready') {
      const changed = (sound = 'soundPay1') => { this.playSound(sound); this.saveGame(false); this.showTown('shop'); };
      this.root.add(createShopView(this, { inventory: this.sim.state.inventory, shop: this.sim.state.town.shop, gold: this.sim.state.gold, traits: this.sim.state.player.traits,
        ap: this.sim.state.town.ap, pendingTownAction: pending, upgradeReference: this.sim.state.upgradeReference }, manifest, this.cache.json.get('town-layout') as ShopLayout, {
        buy: (stock, slot) => {
          const outcome = this.sim!.buyStock(stock, slot);
          if (outcome === 'purchased') { changed(); return true; }
          this.playSound('soundBeep');
          status.textContent = outcome === 'not-enough-gold' ? "You don't have enough money!" : outcome === 'occupied' ? 'Choose an empty inventory slot.' : 'This item is no longer available.';
          return false;
        },
        swap: (from, to) => { if (!this.sim!.moveTownItem(from, to)) return false; changed('soundClick1'); return true; },
        requestSell: slot => this.showTown('shop', null, slot),
        confirmSell: slot => { if (this.sim!.sellTownItem(slot) === null) return false; changed(); return true; },
        cancelSale: () => this.showTown('shop'),
        applyToken: (slot, stock) => { if (!this.sim!.applyShopToken(slot, stock)) return false; changed(); return true; },
        beginUpgradeSelection: () => {
          if (this.sim!.state.town!.ap < 4) { this.playSound('soundBeep'); status.textContent = "You don't have enough action points!"; return; }
          this.playSound('soundClick1'); this.showTown('shop', null, null, true);
        },
        cancelUpgradeSelection: () => this.showTown('shop'),
        requestUpgrade: slot => {
          const outcome = this.sim!.beginWeaponUpgrade(slot);
          if (outcome === 'previewed') { changed('soundScroll1'); return; }
          this.playSound('soundBeep'); this.showTown('shop');
          status.textContent = outcome === 'not-enough-ap' ? "You don't have enough action points!" : 'Choose an owned weapon to upgrade.';
        },
        requestModMount: (modSlot, gunSlot) => {
          if (this.sim!.beginModMount(modSlot, gunSlot) === 'previewed') changed('soundScroll1');
          else { this.playSound('soundBeep'); status.textContent = 'These items are no longer available.'; }
        },
        resolveEquipment: confirm => {
          const outcome = this.sim!.resolveTownEquipment(confirm);
          this.playSound('soundClick1'); this.saveGame(false); this.showTown('shop');
          if (outcome === 'upgraded' || outcome === 'mounted') { this.playSound('soundMod'); return; }
          const errors: Record<string, string> = {
            'not-enough-gold': "You don't have enough money!", 'not-enough-ap': "You don't have enough action points!", 'no-mod-slot': "There's no available mod slot on this weapon!",
            'incompatible-ammo-mod': "This weapon can't use ammo/reloading mods.", 'incompatible-auto-reload': "This weapon can't use Auto Reload mod.",
            'already-living': 'This weapon is already alive.', unavailable: 'These items are no longer available.',
          };
          if (errors[outcome]) { this.playSound('soundBeep'); status.textContent = errors[outcome]; }
        },
        message: value => { status.textContent = value; },
        close: () => this.showTown(null),
      }, saleSlot, upgradeSelecting));
      container.dataset.shopStock = JSON.stringify(this.sim.state.town.shop.map(item => isOccupiedItem(item) ? { id: item.id, value: Math.trunc(item.value) } : null));
      container.dataset.saleSlot = saleSlot === null ? '' : String(saleSlot);
      container.dataset.upgradeSelecting = String(upgradeSelecting);
      container.dataset.pendingTownAction = JSON.stringify(pending);
      container.dataset.upgradePreview = JSON.stringify(pending?.kind === 'upgrade' ? this.sim.state.upgradeReference : null);
    }
    this.updateHud();
    container.dataset.actionPoints = String(this.sim.state.town.ap);
    container.dataset.townTab = tab ?? 'none';
    container.dataset.repairDialog = String(dialog === 'repair');
    container.dataset.townDialog = dialog ?? 'none';
    container.dataset.inventory = JSON.stringify(this.sim.state.inventory.map(item => isOccupiedItem(item) ? item.id : null));
    if (!this.ambient && this.cache.audio.exists('soundBgTown')) {
      this.ambient = this.sound.add('soundBgTown', { volume: 0.3, loop: true }); this.ambient.play();
    }
    status.textContent = pending?.kind === 'upgrade' ? 'Compare the weapon before and after upgrading. Upgrade keeps mounted mods. Yes spends the shown gold and 4 AP.'
      : pending?.kind === 'mod' ? 'Yes mounts the MOD. No or clicking elsewhere swaps these two inventory items.'
      : upgradeSelecting ? 'Choose an owned weapon to upgrade. Click elsewhere to cancel. Upgrade keeps mounted mods.'
      : dialog === 'repair' ? 'The castle walls are repaired. Click to continue.'
      : dialog === 'rest' ? `Click to finish resting and begin Day ${this.sim.state.day + 1}.`
      : tab === 'shop' ? (saleSlot === null ? 'Click stock, then an empty owned slot to buy. Drop an owned item outside its slots to sell; confirmation is required.' : 'Confirm the sale with Yes, or click elsewhere to keep the item.')
      : `Shop buys and sells items. Castle → Free Repair restores the walls for 2 AP. ${this.sim.state.day < 3 ? `Mission → Rest begins Day ${this.sim.state.day + 1}.` : 'Day 4 is not available yet.'}`;
  }

  togglePause(): void {
    if (this.screen !== 'battle') return;
    this.paused = !this.paused; this.accumulator = 0; this.firePressed = this.fireReleased = false; this.firingGesture = this.firingReleaseOwned = false;
    container.dataset.paused = String(this.paused);
    if (!this.paused) { this.pauseLayer?.destroy(true); this.pauseLayer = undefined; this.ambient?.resume(); this.bowSound?.resume(); return; }
    this.ambient?.pause(); this.bowSound?.pause(); this.saveGame(false);
    const existing = new Set(this.root.list);
    this.root.add(this.add.rectangle(0, 0, 620, 380, 0x000000, 0.45).setOrigin(0));
    this.root.add(this.add.rectangle(199, 105, 222, 180, 0xdfcfac).setOrigin(0).setStrokeStyle(2, 0x8c7b53));
    this.text(310, 123, 'Paused', 26).setOrigin(0.5, 0);
    this.labelButton(245, 163, 'Resume', () => this.togglePause());
    this.labelButton(245, 199, 'Save Game', () => this.saveGame());
    this.labelButton(233, 235, 'Return to Title', () => { this.saveGame(false); this.showTitle(); }, 154);
    const members = this.root.list.filter(object => !existing.has(object));
    this.pauseLayer = this.add.container(0, 0, members); this.root.add(this.pauseLayer);
  }

  makeSave(): PortSave | undefined {
    return this.sim && this.screen !== 'title' && this.screen !== 'gene' ? { format: 'elona-shooter-browser', version: 10, appearance: this.appearance, simulation: this.sim.toSave() } : undefined;
  }

  saveGame(notify = true): boolean {
    const save = this.makeSave();
    if (!save) { if (notify) status.textContent = 'Start a game before saving.'; return false; }
    const stored = storeSave(save);
    if (!stored || notify) status.textContent = stored ? 'Game saved in this browser. Export a save to keep a separate backup.' : 'Browser storage is unavailable. Export your save to keep your progress.';
    return stored;
  }

  private parseSave(raw: unknown): { simulation: Simulation; appearance: number } {
    const save = raw as Partial<PortSave> | null;
    if (!save || save.format !== 'elona-shooter-browser' || ![1, 2, 3, 4, 5, 6, 7, 8, 9, 10].includes(save.version!) || !Number.isInteger(save.appearance) || save.appearance! < 0 || save.appearance! > 21) throw new Error('This is not a supported browser-port save. Original Flash saves require a separate converter.');
    return { simulation: Simulation.fromSave(save.simulation, this.simulationOptions()), appearance: save.appearance! };
  }

  continueGame(): void {
    const saved = readSave();
    if (saved.kind !== 'saved') { status.textContent = saved.kind === 'error' ? saved.message : 'Save Game not found.'; return; }
    try { this.loadGame(saved.data); } catch (error) { status.textContent = error instanceof Error ? error.message : 'Unable to read save.'; }
  }

  loadGame(raw: unknown): void {
    const validated = this.parseSave(raw);
    this.sim = validated.simulation; this.appearance = validated.appearance;
    if (this.sim.state.phase === 'battle') this.enterBattle(); else this.showOutcome();
    status.textContent = 'Saved game restored.';
  }

  importSave(raw: unknown): void { this.parseSave(raw); this.loadGame(raw); this.saveGame(false); status.textContent = 'Save imported and restored.'; }

  playSound(key: string, volume = 0.7): void { if (this.cache.audio.exists(key)) this.sound.play(key, { volume }); }
  toggleMute(): void { this.muted = !this.muted; this.sound.mute = this.muted; storeMute(this.muted); this.updateSoundButton(); }
  private updateSoundButton(): void { document.querySelector('#sound')!.textContent = this.muted ? 'Sound off' : 'Sound on'; }
}

async function boot(): Promise<void> {
  const response = await fetch(assetUrl('manifest.json'));
  if (!response.ok) throw new Error('Original assets are missing. Run python tools/extract_web_assets.py from the project folder.');
  manifest = await response.json() as Manifest;
  const families: Record<string, string> = { menu: 'ElonaMenu', menuBold: 'ElonaMenuBold', hud: 'ElonaHud', small: 'ElonaSmall' };
  await Promise.all(Object.entries(manifest.fonts).map(async ([key, file]) => {
    const font = new FontFace(families[key] ?? key, `url("${assetUrl(file)}")`);
    await font.load(); document.fonts.add(font);
  }));
  new Phaser.Game({ type: Phaser.WEBGL, parent: 'game', width: 620, height: 380, backgroundColor: '#000000', scene: ElonaScene,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, roundPixels: false }, audio: { disableWebAudio: false }, fps: { target: 60 },
  });
}

document.querySelector('#fullscreen')!.addEventListener('click', () => { void container.requestFullscreen().catch(() => { status.textContent = 'Full screen is unavailable in this browser view.'; }); });
document.querySelector('#sound')!.addEventListener('click', () => gameScene?.toggleMute());
document.querySelector('#export-save')!.addEventListener('click', () => {
  const current = gameScene?.makeSave(), saved = readSave();
  const data = current ?? (saved.kind === 'saved' ? saved.data : undefined);
  if (data) { exportSave(data); status.textContent = 'Save exported.'; } else status.textContent = 'Start a game before exporting a save.';
});
const fileInput = document.querySelector<HTMLInputElement>('#save-file')!;
document.querySelector('#import-save')!.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0]; if (!file) return;
  try { if (file.size > 1_000_000) throw new Error('The save file is too large.'); gameScene.importSave(JSON.parse(await file.text())); }
  catch (error) { status.textContent = error instanceof Error ? error.message : 'The save file could not be imported.'; }
  finally { fileInput.value = ''; }
});
window.addEventListener('pagehide', () => { if (gameScene?.screen === 'battle') gameScene.saveGame(false); });
void boot().catch(error => { loadStatus.hidden = false; loadStatus.textContent = `Unable to start: ${error.message}`; console.error(error); });
