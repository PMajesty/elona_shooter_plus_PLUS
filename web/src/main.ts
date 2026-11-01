import Phaser from 'phaser';
import { Simulation, type EnemyState, type SimulationEvent } from './simulation.ts';
import { SHOTGUN, WORLD, type EnemyKind } from './content.ts';
import { exportSave, readMute, readSave, storeMute, storeSave } from './storage.ts';
import { OriginalAlly, type OriginalAllyMetadata } from './original-animation.ts';
import { createLootView } from './loot-view.ts';
import { createSkillView } from './skill-view.ts';
import { createTownView, type TownLayout, type TownTab } from './town-view.ts';
import { createShopView, type ShopLayout } from './shop-view.ts';
import { isOccupiedItem } from './items.ts';
import { alphaMaskHit, ordinaryEnemyHit, type CollisionGeometry } from './collision.ts';
import './style.css';

interface ImageAsset { file: string; width: number; height: number; originX: number; originY: number }
interface ClipAsset { image: string; json: string; originX: number; originY: number; frameWidth: number; frameHeight: number; labels: Record<string, number>; count: number }
interface Manifest { images: Record<string, ImageAsset>; clips: Record<string, ClipAsset>; sounds: Record<string, string>; fonts: Record<string, string> }
interface PortSave { format: 'elona-shooter-browser'; version: 1 | 2 | 3 | 4 | 5 | 6; appearance: number; simulation: unknown }
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
for (const key of ['soundBgTown', 'soundRepair1', 'soundBeep', 'soundScroll1', 'soundPay1']) USED_SOUNDS.add(key);
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
  private grenadeSprites = new Map<number, { body: Phaser.GameObjects.Image; shadow: Phaser.GameObjects.Image }>();
  private playerSprite?: OriginalAlly;
  private ammoFill?: Phaser.GameObjects.Image;
  private selection?: Phaser.GameObjects.Rectangle;
  private cursor?: Phaser.GameObjects.Graphics;
  private pauseLayer?: Phaser.GameObjects.Container;
  private firePressed = false;
  private firingGesture = false;
  private reloadRequested = false;
  private reloadAnimations = 0;
  private grenadeRequested = false;
  private effects: { object: Phaser.GameObjects.GameObject; ticks: number; moveY?: number; clip?: string; frame?: number }[] = [];
  private ambient?: Phaser.Sound.BaseSound;
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
      if (pointer.leftButtonDown()) { this.firePressed = true; this.firingGesture = true; }
    });
    this.input.on('pointerup', () => { this.firingGesture = false; });
    this.input.on('gameout', () => { this.firingGesture = false; });
    this.input.keyboard?.on('keydown-SPACE', (event: KeyboardEvent) => {
      event.preventDefault();
      if (this.screen !== 'battle') return;
      if (this.paused) this.togglePause();
      else this.reloadRequested = true;
    });
    this.input.keyboard?.on('keydown-ESC', () => { if (this.screen === 'battle') this.togglePause(); else if (this.screen === 'gene') this.showTitle(); });
    this.input.keyboard?.on('keydown-TWO', () => { if (this.screen === 'battle' && !this.paused) this.grenadeRequested = true; });
    this.game.events.on(Phaser.Core.Events.BLUR, () => { if (this.screen === 'battle' && !this.paused) this.togglePause(); });
    this.showTitle();
    document.querySelector('#scope-note')!.textContent = 'Sheriff opening battle, rewards, first-town shop and Free Repair are playable. Other town actions, equipment effects, later days and other classes are still being ported. Original game and artwork by Noa; original credits retained.';
    this.updateSoundButton();
  }

  private reset(screen: Screen): void {
    const keepTownAmbience = this.screen === 'town' && screen === 'town';
    this.screen = screen;
    this.paused = false;
    this.accumulator = 0;
    this.firePressed = this.reloadRequested = this.grenadeRequested = false;
    this.firingGesture = false;
    this.input.setDefaultCursor('default');
    this.root.removeAll(true);
    this.enemySprites.clear(); this.bossFrames.clear(); this.bossBars.clear(); this.grenadeSprites.clear(); this.hud.clear(); this.effects = [];
    this.reloadAnimations = 0;
    this.pauseLayer = undefined; this.playerSprite = undefined; this.cursor = undefined; this.selection = undefined; this.ammoFill = undefined;
    if (!keepTownAmbience) { this.ambient?.destroy(); this.ambient = undefined; }
    container.dataset.screen = screen;
    container.dataset.paused = 'false';
    container.dataset.bossBars = '0'; container.dataset.bossHealth = '[]';
    container.dataset.playerFrame = ''; container.dataset.reloadTicks = '0'; container.dataset.reloadAnimations = '0';
    delete container.dataset.lootOffers; delete container.dataset.inventory;
    delete container.dataset.skillChoices; delete container.dataset.selectedTrait; delete container.dataset.traits; delete container.dataset.skillPoints;
    delete container.dataset.actionPoints; delete container.dataset.townTab; delete container.dataset.repairDialog;
    delete container.dataset.shopStock; delete container.dataset.saleSlot;
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
    this.text(469, 32, saved.kind === 'saved' ? 'Sheriff · Day 1' : 'Empty Save', 12, '#151515', 'Arial').setBackgroundColor('#ede9de').setFixedSize(137, 20);
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
    this.text(123, 121, 'Aim with the mouse. Click to fire.\nSpace reloads your weapon.\nClick during reload to interrupt it.\n2 throws a grenade at the cursor.\nEsc pauses and opens the game menu.\n\nProtect the castle until the day is over.\nAim for weak points and allow recoil to settle.', 16).setLineSpacing(4);
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
    if (this.sim?.state.player.reloadTicks) this.playerSprite.playOriginal('reload');
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
      ['grenades', 147, 366, 'x5', 11, 'Arial'],
    ];
    for (const [key, x, y, value, size, font] of values) {
      const text = this.text(x, y, value, size, '#ffffff', font).setShadow(1, 1, '#000000', 2);
      this.hud.set(key, text);
    }
    this.zone(580, 344, 40, 36, () => { if (this.screen === 'battle') this.togglePause(); else this.showTitle(); });
    this.zone(546, 350, 31, 30, () => this.toggleMute());
    this.zone(110, 348, 84, 32, () => { status.textContent = 'Press 2 while pointing at the battlefield to throw a grenade.'; });
    this.clip('itemPicture', 13, 28, 344);
    this.clip('itemPicture', 21, 120, 354);
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
      this.sim.tick({ aimX: pointer.x, aimY: pointer.y, firePressed: this.firePressed, fireHeld: this.firingGesture && pointer.isDown && pointer.leftButtonDown(), reload: this.reloadRequested, grenade: this.grenadeRequested });
      this.firePressed = this.reloadRequested = this.grenadeRequested = false;
      this.accumulator -= 1000 / 30;
      this.playerSprite?.stepOriginal();
      for (const actor of this.enemySprites.values()) if (actor instanceof OriginalAlly) actor.stepOriginal();
      if (this.sim.state.player.reloadTicks === 0 && this.playerSprite && this.playerSprite.currentOriginalFrame >= 30 && this.playerSprite.currentOriginalFrame <= 41) this.playerSprite.stopOriginal(109);
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
    const names: Record<EnemyKind, string> = { sheep: 'enemy_sheep', rat: 'enemy_rat', chicken: 'enemy_chicken', crow: 'enemy_crow', boss: 'enemy_boss' };
    return enemy.kind === 'boss' ? 'charaPic' : names[enemy.kind];
  }

  private enemyFrame(enemy: Readonly<EnemyState>, key: string): string {
    const texture = this.textures.get(key);
    if (enemy.kind === 'boss') return String(51 * 10 + (enemy.bossAction === 2 ? 5 + Math.floor(enemy.frame / 4) % 2 : 1));
    return texture?.has(String(enemy.frame)) ? String(enemy.frame) : '1';
  }

  private syncBossActor(enemy: Readonly<EnemyState>): OriginalAlly {
    let actor = this.enemySprites.get(enemy.uid);
    if (!(actor instanceof OriginalAlly)) {
      actor = new OriginalAlly(this, this.cache.json.get('ally-animation') as OriginalAllyMetadata, manifest.clips, 51, enemy.x, enemy.y).setScale(-1, 1);
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
    const grenadeIds = new Set<number>();
    for (const grenade of state.grenades) {
      grenadeIds.add(grenade.uid);
      let sprite = this.grenadeSprites.get(grenade.uid);
      if (!sprite) {
        const shadow = this.clip('grenadeShadow', 1, grenade.x - 6.45, grenade.startY)!;
        const body = this.add.image(grenade.x - 0.45, grenade.y, 'grenadeBody', '1').setOrigin(0.5);
        this.root.add(body); sprite = { body, shadow }; this.grenadeSprites.set(grenade.uid, sprite);
      }
      sprite.body.setPosition(grenade.x - 0.45, grenade.y).setAngle(-4 * Math.abs((grenade.x - grenade.startX) / grenade.speed));
      let shadowY = (grenade.targetY - grenade.startY) * (grenade.x - grenade.startX) / (grenade.targetX - grenade.startX);
      if (grenade.targetY < 135) shadowY /= 3;
      const shadow = manifest.clips.grenadeShadow;
      sprite.shadow.setPosition(grenade.x - 6.45 - shadow.originX, shadowY + grenade.startY - shadow.originY);
    }
    for (const [uid, sprite] of this.grenadeSprites) if (!grenadeIds.has(uid)) { sprite.body.destroy(); sprite.shadow.destroy(); this.grenadeSprites.delete(uid); }
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
    container.dataset.reloadTicks = String(state.player.reloadTicks);
    container.dataset.reloadAnimations = String(this.reloadAnimations);
    container.dataset.frameMs = (this.fpsSamples.reduce((a, b) => a + b, 0) / Math.max(1, this.fpsSamples.length)).toFixed(2);
    container.dataset.slowFrames = String(this.fpsSamples.filter(ms => ms > 50).length);
    container.dataset.maxFrameMs = Math.max(0, ...this.fpsSamples).toFixed(2);
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
    if (event.type === 'kill') {
      const enemy = this.sim?.state.enemies.find(candidate => candidate.uid === event.enemyUid);
      if (enemy) sound.kill = { sheep: 'soundDead3', rat: 'soundDead7', chicken: 'soundDeadChicken', crow: 'soundDead5', boss: 'soundDeadBoss1' }[enemy.kind];
      // Выбор реплики уже сделан симуляцией в исходном порядке случайных вызовов.
      if (event.goodShotIndex !== undefined) this.playSound(`soundGoodshot${event.goodShotIndex}`, 0.65);
    }
    if (sound[event.type]) this.playSound(sound[event.type]!, event.type === 'kill' ? 0.4 : 0.65);
    if (event.type === 'shot') {
      this.playerSprite?.playOriginal(95);
    }
    if (event.type === 'reload') {
      // Каждый следующий патрон заново запускает исходную анимацию перезарядки.
      this.playerSprite?.playOriginal('reload'); this.reloadAnimations++;
    }
    if (event.type === 'hit') {
      const damage = this.text(event.x ?? 0, (event.y ?? 0) - 25, `${event.amount}${event.critical ? '!' : ''}`, 13, event.critical ? '#ffef62' : '#ffffff', 'ElonaHud').setShadow(1, 1, '#000000', 2);
      this.effects.push({ object: damage, ticks: 24, moveY: -0.6 });
    }
    if (event.type === 'explosion') {
      const explosion = this.clip('explosion', 1, event.x ?? 0, event.y ?? 0);
      if (explosion) this.effects.push({ object: explosion, ticks: manifest.clips.explosion.count, clip: 'explosion', frame: 1 });
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
      const values = [200, state.gold - 200 - state.result.netReward, state.result.reward + state.result.perfectBonus, 0, 0, 0, -state.result.upkeep, state.gold];
      values.forEach((value, index) => this.text(252, 128 + index * 20 + (index === 7 ? 10 : 0), String(value), 12, value < 0 ? '#b02020' : '#14248d', 'Arial'));
      this.text(335, 145, `Day 1 completed.\n\nEnemies defeated: ${state.kills}\nCritical kills: ${state.criticalKills}\nCastle: ${state.castleHp}/${state.castleMaxHp}`, 13).setWordWrapWidth(185);
      this.originalButton('button_proceed', 160, 301, () => {
        if (this.sim!.enterTown()) { this.saveGame(false); this.showTown(); }
      });
      const menu = this.root.list.filter(object => !background.has(object));
      this.root.add(this.add.container(MENU_X, 0, menu));
      status.textContent = 'Opening battle complete and saved. Proceed to town.';
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
    this.hud.get('day')?.setText(`1/${state.waveIndex}`);
    this.hud.get('ammo')?.setText(`${state.player.ammo}/${SHOTGUN.magazine}`);
    this.hud.get('gold')?.setText(String(state.gold));
    this.hud.get('hp')?.setText(`${state.castleHp}/${state.castleMaxHp}`);
    this.hud.get('level')?.setText(String(state.player.level)); this.hud.get('exp')?.setText(String(state.player.exp / 10));
    this.hud.get('grenades')?.setText(`x${state.player.grenades}`);
    this.ammoFill?.setScale(state.player.ammo / SHOTGUN.magazine, 1);
    container.dataset.gold = String(state.gold); container.dataset.hp = String(state.castleHp);
    container.dataset.ammo = String(state.player.ammo); container.dataset.grenades = String(state.player.grenades);
    container.dataset.phase = state.phase; container.dataset.tick = String(state.tick);
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

  private showTown(tab: TownTab = 'mission', repairDialog = false, saleSlot: number | null = null): void {
    if (!this.sim || this.sim.state.phase !== 'town' || !this.sim.state.town) return;
    this.reset('town');
    this.root.add(createTownView(this, this.sim.state, manifest, this.cache.json.get('town-layout') as TownLayout, {
      select: next => { this.playSound('soundScroll1'); this.showTown(next); },
      message: value => { status.textContent = value; },
      repair: () => {
        const outcome = this.sim!.freeRepair();
        if (outcome === 'repaired') {
          this.playSound('soundRepair1'); this.saveGame(false); this.showTown('castle', true);
        } else {
          this.playSound('soundBeep');
          status.textContent = outcome === 'not-damaged' ? 'The castle is not damaged!' : outcome === 'not-enough-ap' ? "You don't have enough action points!" : 'Free Repair is available in town.';
        }
      },
      dismiss: () => { this.playSound('soundClick1'); this.showTown('castle'); },
    }, tab, repairDialog));
    if (tab === 'shop' && this.sim.state.town.preparation === 'ready') {
      const changed = (sound = 'soundPay1') => { this.playSound(sound); this.saveGame(false); this.showTown('shop'); };
      this.root.add(createShopView(this, { inventory: this.sim.state.inventory, shop: this.sim.state.town.shop, gold: this.sim.state.gold, traits: this.sim.state.player.traits }, manifest, this.cache.json.get('town-layout') as ShopLayout, {
        buy: (stock, slot) => {
          const outcome = this.sim!.buyStock(stock, slot);
          if (outcome === 'purchased') { changed(); return true; }
          this.playSound('soundBeep');
          status.textContent = outcome === 'not-enough-gold' ? "You don't have enough money!" : outcome === 'occupied' ? 'Choose an empty inventory slot.' : 'This item is no longer available.';
          return false;
        },
        swap: (from, to) => { if (!this.sim!.moveTownItem(from, to)) return false; changed('soundClick1'); return true; },
        requestSell: slot => this.showTown('shop', false, slot),
        confirmSell: slot => { if (this.sim!.sellTownItem(slot) === null) return false; changed(); return true; },
        cancelSale: () => this.showTown('shop'),
        applyToken: (slot, stock) => { if (!this.sim!.applyShopToken(slot, stock)) return false; changed(); return true; },
        message: value => { status.textContent = value; },
        close: () => this.showTown(null),
      }, saleSlot));
      container.dataset.shopStock = JSON.stringify(this.sim.state.town.shop.map(item => isOccupiedItem(item) ? { id: item.id, value: Math.trunc(item.value) } : null));
      container.dataset.saleSlot = saleSlot === null ? '' : String(saleSlot);
    }
    this.updateHud();
    container.dataset.actionPoints = String(this.sim.state.town.ap);
    container.dataset.townTab = tab ?? 'none';
    container.dataset.repairDialog = String(repairDialog);
    container.dataset.inventory = JSON.stringify(this.sim.state.inventory.map(item => isOccupiedItem(item) ? item.id : null));
    if (!this.ambient && this.cache.audio.exists('soundBgTown')) {
      this.ambient = this.sound.add('soundBgTown', { volume: 0.3, loop: true }); this.ambient.play();
    }
    status.textContent = repairDialog ? 'The castle walls are repaired. Click to continue.' : tab === 'shop' ? (saleSlot === null ? 'Click stock, then an empty owned slot to buy. Drop an owned item outside its slots to sell; confirmation is required.' : 'Confirm the sale with Yes, or click elsewhere to keep the item.') : 'Shop buys and sells items. Castle → Free Repair restores the walls for 2 AP. The next day is not available yet.';
  }

  togglePause(): void {
    if (this.screen !== 'battle') return;
    this.paused = !this.paused; this.accumulator = 0; this.firePressed = false; this.firingGesture = false;
    container.dataset.paused = String(this.paused);
    if (!this.paused) { this.pauseLayer?.destroy(true); this.pauseLayer = undefined; this.ambient?.resume(); return; }
    this.ambient?.pause(); this.saveGame(false);
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
    return this.sim && this.screen !== 'title' && this.screen !== 'gene' ? { format: 'elona-shooter-browser', version: 6, appearance: this.appearance, simulation: this.sim.toSave() } : undefined;
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
    if (!save || save.format !== 'elona-shooter-browser' || ![1, 2, 3, 4, 5, 6].includes(save.version!) || !Number.isInteger(save.appearance) || save.appearance! < 0 || save.appearance! > 21) throw new Error('This is not a supported browser-port save. Original Flash saves require a separate converter.');
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
