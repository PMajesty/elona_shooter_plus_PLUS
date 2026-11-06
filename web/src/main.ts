import { localizedImage } from './localized-image.ts';
import { version as browserVersion } from '../package.json';
import { localizedText, fitLocalizedText } from './localized-text.ts';
import { getLanguage, setLanguage, onLanguageChanged, t } from './i18n.ts';
import { buttonInput, refreshMenuHover } from './button-input.ts';
import { createTitleSequence, playOpening } from './title-sequence.ts';
import { MAX_CAMPAIGN_DAY } from './missions.ts';
import { COMMUNITY_MOD_DETAILS, GAME_MODS, type GameMod } from './game-mods.ts';
import { SAVE_VERSION } from './save-version.ts';
import { RULESETS, type RulesetId } from './rulesets.ts';
import { parseAdventureSave, type PortSave } from './adventure-save.ts';
import { createEditionSelector } from './edition-selector-view.ts';
import Phaser from 'phaser';
import { HERO_CLASSES, heroClassUnlocked, type HeroClass } from './hero-classes.ts';
import { createGeneInfoView } from './gene-info-view.ts';
import { animateStandingPortraits } from './portrait-animation.ts';
import { configureDisplaySizing } from './display-sizing.ts';
import { BattleCursor, BATTLE_CURSOR } from './battle-cursor.ts';
import { ScreenShake } from './screen-shake.ts';
import { battleLightColor, battleCloudX } from './battle-lighting.ts';
import type { ItemPopupInfo } from './item-popup-values.ts';
import { traitHintValues, type OriginalHintInfo } from './trait-hint.ts';
import { sniperDamageLimit, duelistDamageLimit } from './class-limits.ts';
import { createProfile, mergeProfile, mergeProfiles, type GlobalProfile } from './profile.ts';
import { MEDALS } from './medals.ts';
import { MedalNotices, type MedalNotice } from './medal-notices.ts';
import { createMedalNoticeView, updateMedalNoticeView, type InfoPopupLayout } from './medal-notice-view.ts';
import { CombatNotices, type CombatNotice } from './combat-notices.ts';
import { createCombatNoticeView, updateCombatNoticeView, type CombatNoticeLayout } from './combat-notice-view.ts';
import { createTownEventView } from './town-event-view.ts';
import { TOWN_NOTICES, townEvent, type TownNotice } from './town-events.ts';
import { readFlashCollection } from './flash-profile.ts';
import { readFlashAdventure } from './flash-adventure.ts';
import { readFlashSharedObject } from './flash-shared-object.ts';
import { TITLES, nextTitle } from './titles.ts';
import { Simulation, type SimulationState, type EnemyState, type SimulationEvent } from './simulation.ts';
import { WORLD } from './content.ts';
import { RAT_DROP_BODY_X, RAT_DROP_SHADOW, ratDropLocalPoint } from './bird-drop.ts';
import { weaponPresentation } from './combat-stats.ts';
import { SAVE_SLOTS, readSelectedSlot, selectSaveSlot, readNewGameRuleset, storeNewGameRuleset, deleteSaveSlot, exportSave, readMute, readSave, readProfile, storeProfile, canSaveAdventure, clearSave, storeMute, storeSave } from './storage.ts';
import { saveSlotLabel } from './save-slots.ts';
import { createTitleSavesView, type TitleSavesLayout } from './title-saves-view.ts';
import { createHelpView, type HelpLayout } from './help-view.ts';
import { originalTextArea } from './original-text-area.ts';
import { dayReport } from './day-report.ts';
import { createPauseView, type PauseLayout } from './pause-view.ts';
import { AudioMixer } from './audio-mixer.ts';
import { readAudioSettings, storeAudioSettings } from './audio-settings.ts';
import { createAudioSettingsView } from './audio-settings-view.ts';
import { DEFAULT_GAME_OPTIONS, GAME_OPTIONS_VERSION, defaultGameOptions, savedGameOptions, showDamageNumber, pauseStatistics, type GameOptions } from './game-options.ts';
import { damageNumberStyle } from './damage-number-style.ts';
import { createFireworks } from './fireworks-view.ts';
import { FIREWORK_MEDAL_FRAMES } from './fireworks.ts';
import { createModConfirmation, type ModConfirmationLayout } from './mod-confirmation-view.ts';
import { OriginalAlly, type OriginalAllyMetadata } from './original-animation.ts';
import { createLootView } from './loot-view.ts';
import { createSkillView } from './skill-view.ts';
import { createTownView, type TownLayout, type TownTab, type TownDialog } from './town-view.ts';
import { createShopView, type ShopLayout } from './shop-view.ts';
import { createPartyView, type PartyLayout, type PartyViewMember, type PartyViewTrait, type PartyEquipmentSlot } from './party-view.ts';
import { ALL_TRAITS } from './party-progression.ts';
import { partyActorPosition } from './party-ai.ts';
import { castleDamageMultiplier, castleLootMultiplier, castleRepairAmount, castleStorageLevel, castleTrainerMultiplier, castleUpgradeCost, castleUpkeep } from './castle-upgrades.ts';
import { ITEM_TYPE, isOccupiedItem } from './items.ts';
import { STANDING_SISTER } from './castle-sister.ts';
import { alphaMaskHit, ordinaryEnemyHit, type CollisionGeometry } from './collision.ts';
import type { ProjectileKind } from './projectiles.ts';
import type { EnemyShotKind } from './enemy-arrows.ts';
import { titlePointerHit, titleStateHit, type TitleButtonState } from './title-hit.ts';
import './style.css';

interface ImageAsset { file: string; width: number; height: number; originX: number; originY: number; ruHitMask?: string }
interface ClipAsset { image: string; json: string; originX: number; originY: number; frameWidth: number; frameHeight: number; labels: Record<string, number>; count: number; frameAlpha?: number[] }
interface ProjectileVisual { clip: string; bodyX: number; hardLight?: { multiplyClip: string; addClip: string }; shadow?: { clip: string; x: number; scaleX: number; scaleY: number; aboveBody: boolean } }
interface Manifest { images: Record<string, ImageAsset>; clips: Record<string, ClipAsset>; sounds: Record<string, string>; fonts: Record<string, string>; projectileVisuals: Record<ProjectileKind, ProjectileVisual>; enemyArrowVisual: ProjectileVisual; enemyShotVisuals: Record<EnemyShotKind, ProjectileVisual> }
type Screen = 'intro' | 'title' | 'gene' | 'mods' | 'battle' | 'loot' | 'boss-loot' | 'skill' | 'result' | 'defeat' | 'town';

const container = document.querySelector<HTMLDivElement>('#game')!;
const playfield = document.querySelector<HTMLDivElement>('#playfield')!;
const stageViewport = document.querySelector<HTMLDivElement>('#stage-viewport')!;
const panMenu = document.querySelector<HTMLInputElement>('#touch-pan input')!;
function positionMenuView(): void {
  stageViewport.scrollLeft = (stageViewport.scrollWidth - stageViewport.clientWidth) * Number(panMenu.value) / 100;
  gameScene?.scale.updateBounds();
}
panMenu.addEventListener('input', positionMenuView);
const enlargeButton = document.querySelector<HTMLButtonElement>('#touch-enlarge')!;
enlargeButton.addEventListener('click', () => {
  const enlarged = container.dataset.menuZoom !== 'true';
  container.dataset.menuZoom = String(enlarged);
  enlargeButton.setAttribute('aria-pressed', String(enlarged));
  enlargeButton.textContent = t(enlarged ? 'Fit' : 'Enlarge');
  positionMenuView();
});
const muteButton = document.querySelector<HTMLButtonElement>('#mute')!;
function updateMuteControl(muted: boolean): void {
  muteButton.disabled = false;
  muteButton.setAttribute('aria-pressed', String(muted));
  muteButton.setAttribute('aria-label', t(muted ? 'Unmute' : 'Mute'));
}
const loadStatus = document.querySelector<HTMLDivElement>('#load-status')!;
const statusElement = document.querySelector<HTMLParagraphElement>('#save-status')!;
let statusSource: string | null = '';
const status = {
  get textContent(): string | null { return statusSource; },
  set textContent(message: string | null) {
    statusSource = message; statusElement.textContent = message === null ? null : t(message);
  },
  hide() { statusSource = ''; statusElement.textContent = ''; },
};
const assetUrl = (path: string) => `${import.meta.env.BASE_URL}assets/${path}`;
const MENU_X = -15.587619764971691;
const bootStarted = performance.now();

function showStartupFailure(message: string): void {
  const panel = document.createElement('div'); panel.className = 'startup-error';
  const explanation = document.createElement('p'); explanation.textContent = t(message);
  const retry = document.createElement('button'); retry.type = 'button'; retry.textContent = t('Retry');
  retry.addEventListener('click', () => window.location.reload());
  panel.append(explanation, retry); loadStatus.replaceChildren(panel); loadStatus.hidden = false;
  container.dataset.startupError = message;
}
function inspectItemPopup(info: ItemPopupInfo | null): void {
  if (info) container.dataset.itemPopup = JSON.stringify(info); else delete container.dataset.itemPopup;
}
function inspectTraitHint(info: OriginalHintInfo | null): void {
  if (info) container.dataset.traitHint = JSON.stringify(info); else delete container.dataset.traitHint;
}
const USED_SOUNDS = new Set(['soundSearch', 'soundEat1', 'soundParty', 'soundClick1', 'soundGun3', 'soundReloading2', 'soundReloaded2', 'soundThrow1', 'soundExp1', 'soundDead3', 'soundDead5', 'soundDead7', 'soundDeadChicken', 'soundDeadBoss1', 'soundDamage1', 'soundPop1', 'soundBattleBegin', 'soundBattleEnd', 'soundKilled', 'soundRampage', 'soundComplete', 'soundGold1', 'soundBgForest']);
for (let index = 0; index < 5; index++) USED_SOUNDS.add(`soundGoodshot${index}`);
USED_SOUNDS.add('soundGood');
USED_SOUNDS.add('soundMedal');
USED_SOUNDS.add('soundLaunch');
for (const key of ['soundChicken', 'soundChickenAttack', 'soundCrow', 'soundCata', 'soundTank', 'soundDeadBoss2']) USED_SOUNDS.add(key);
USED_SOUNDS.add('soundReloaded1');
for (const key of ['soundBgTown', 'soundRepair1', 'soundBeep', 'soundScroll1', 'soundPay1', 'soundMod']) USED_SOUNDS.add(key);
for (let index = 1; index <= 15; index++) USED_SOUNDS.add(`soundGun${index}`);
for (const key of ['soundReloading1', 'soundReloading3', 'soundReloaded3', 'soundPray1', 'soundDefend', 'soundNight', 'soundAward', 'soundCard1']) USED_SOUNDS.add(key);
for (const key of ['soundDead4', 'soundDead8', 'soundDead9']) USED_SOUNDS.add(key);
for (const key of ['soundBow1', 'soundBow2', 'soundDead1', 'soundDead2', 'soundDead6', 'soundFireball', 'soundRampageEnemy', 'soundPuls', 'soundLow']) USED_SOUNDS.add(key);
USED_SOUNDS.add('soundFirework');
USED_SOUNDS.add('soundImpact1');
for (const key of ['soundChain1', 'soundChain2', 'soundChain3', 'soundDrop']) USED_SOUNDS.add(key);
for (const key of ['soundTank2', 'soundLightning']) USED_SOUNDS.add(key);
let manifest: Manifest;
let russianAssets: { images: Record<string, string>; clips: Record<string, string>; hitMasks: Record<string, string> } = { images: {}, clips: {}, hitMasks: {} };
let localizationReady = false;
let gameScene: ElonaScene;

class ElonaScene extends Phaser.Scene {
  private ready = false;
  private graphicsLost = false;
  private failedRequiredAssets = new Set<string>();
  private combatNotices = new CombatNotices();
  private combatNoticeViews = new Map<CombatNotice, Phaser.GameObjects.Container>();
  screen: Screen = 'title';
  sim?: Simulation;
  saveSlot = readSelectedSlot();
  private newGameRuleset: RulesetId = readNewGameRuleset();
  private carryCheckpoint?: SimulationState;
  appearance = 0;
  paused = false;
  muted = readMute();
  private audioMixer!: AudioMixer;
  private audioSettingsView?: ReturnType<typeof createAudioSettingsView>;
  private titleAudioOpen = false;
  private options: GameOptions = { ...DEFAULT_GAME_OPTIONS };
  private accumulator = 0;
  private root!: Phaser.GameObjects.Container;
  private hud = new Map<string, Phaser.GameObjects.Text>();
  private enemySprites = new Map<number, Phaser.GameObjects.Image | OriginalAlly>();
  private ratShadows = new Map<number, Phaser.GameObjects.Image>();
  private enemyRageSprites = new Map<number, Phaser.GameObjects.Image>();
  private enemyHitSprites = new Map<number, Phaser.GameObjects.Image[]>();
  private bossFrames = new Map<number, number>();
  private bossBars = new Map<number, { container: Phaser.GameObjects.Container; fill: Phaser.GameObjects.Image }>();
  private projectileSprites = new Map<number, { container: Phaser.GameObjects.Container; body: Phaser.GameObjects.Container; images: Phaser.GameObjects.Image[]; shadow?: Phaser.GameObjects.Image }>();
  private enemyArrowSprites = new Map<number, { container: Phaser.GameObjects.Container; body: Phaser.GameObjects.Image; shadow?: Phaser.GameObjects.Image }>();
  private playerSprite?: OriginalAlly;
  private castleSisterSprite?: Phaser.GameObjects.Image;
  private heroAimCursor?: Phaser.GameObjects.Image;
  private companionSprites = new Map<number, OriginalAlly>();
  private companionCursors = new Map<number, Phaser.GameObjects.Image>();
  private companionBowSounds = new Map<number, Phaser.Sound.BaseSound>();
  private selectedCharacter = 0;
  private modsClassPage: 0 | 1 = 0;
  private modDetailsOpen = false;
  private castlePage: 0 | 1 = 0;
  private medalPage: 0 | 1 = 0;
  private medalNotices = new MedalNotices();
  private medalNoticeViews = new Map<MedalNotice, Phaser.GameObjects.Container>();
  private profileRead = readProfile();
  private profile = this.profileRead.profile;
  private ammoFill?: Phaser.GameObjects.Image;
  private bottomBarSprite?: Phaser.GameObjects.Image;
  private battleBackdropSprite?: Phaser.GameObjects.Image;
  private battleCloudSprite?: Phaser.GameObjects.Image;
  private screenShake = new ScreenShake();
  private bossReticles = new Map<number, { image: Phaser.GameObjects.Image; frame: number }>();
  private bossReticleSeen = new Set<number>();
  private enemyFrameAudio = new Map<number, { frame: number; crowPlayed: boolean }>();
  private frameSoundCues: { key: string; uid: number; frame: number }[] = [];
  private adrenalineFill?: Phaser.GameObjects.Image;
  private battleCursor!: BattleCursor;
  private townNavigation?: Phaser.GameObjects.Container;
  private pauseLayer?: Phaser.GameObjects.Container;
  private helpLayer?: Phaser.GameObjects.Container;
  private fireAtWillSprites?: { fire: Phaser.GameObjects.Image; rage: Phaser.GameObjects.Image };
  private volumeIcon?: Phaser.GameObjects.Image;
  private pauseDialog?: Phaser.GameObjects.Container;
  private collectionDialog?: Phaser.GameObjects.Container;
  private closeTownEvent?: () => void;
  private closeOpening?: () => void;
  private titleSequence?: ReturnType<typeof createTitleSequence>;
  private celebration?: ReturnType<typeof createFireworks>;
  private fireworkMedalChecked = false;
  private flash?: Phaser.GameObjects.Rectangle;
  private flashFrames = 0;
  private flashClock = 0;
  private firePressed = false;
  private fireReleased = false;
  private firingGesture = false;
  private firingReleaseOwned = false;
  private touchAimPointer?: Phaser.Input.Pointer;
  private touchAim = { x: 300, y: 240 };
  private touchInput = false;
  private touchAimSprite?: Phaser.GameObjects.Image;
  private touchGestureSim?: Simulation;
  private touchGestureState?: Simulation['state'];
  private touchControlsState = '';
  private touchControlEpoch = 0;
  private reloadRequested = false;
  private reloadAnimations = 0;
  private slotRequested?: number;
  private hotbar: { icon: Phaser.GameObjects.Image; count: Phaser.GameObjects.Text; cooldown: Phaser.GameObjects.Image }[] = [];
  private effects: { object: Phaser.GameObjects.GameObject; ticks: number; moveY?: number; clip?: string; frame?: number; trail?: true; enemyOffset?: { uid: number; x: number; y: number } }[] = [];
  private ambient?: Phaser.Sound.BaseSound;
  private bowSound?: Phaser.Sound.BaseSound;
  private chainSounds = new Map<number, { mode: number; sound: Phaser.Sound.BaseSound }>();
  private fpsSamples: number[] = [];
  private maskCache = new Map<string, { x: number; y: number; width: number; height: number; data: Uint8ClampedArray }>();

  constructor() { super('Elona'); }

  preload(): void {
    this.load.json('ally-animation', assetUrl('ally-animation.json'));
    this.load.json('collision-geometry', assetUrl('collision-geometry.json'));
    this.load.json('town-layout', assetUrl('town-layout.json'));
    for (const [key, asset] of Object.entries(manifest.images)) this.load.image(key, assetUrl(asset.file));
    for (const [key, asset] of Object.entries(manifest.clips)) this.load.atlas(key, assetUrl(asset.image), assetUrl(asset.json));
    for (const [key, file] of Object.entries(russianAssets.images)) this.load.image(`ru:${key}`, assetUrl(`ru/${file}`));
    for (const [key, file] of Object.entries(russianAssets.clips)) this.load.atlas(`ru:${key}`, assetUrl(`ru/${file}`), assetUrl(manifest.clips[key].json));
    for (const [key, file] of Object.entries(manifest.sounds)) if (USED_SOUNDS.has(key)) this.load.audio(key, assetUrl(file));
    this.load.on('progress', (progress: number) => { loadStatus.textContent = t(`Loading original game assets… ${Math.round(progress * 100)}%`); });
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      if (file.type === 'audio') console.warn(`Sound ${file.key} is unavailable; continuing without it.`);
      else if (file.key.startsWith('ru:')) localizationReady = false;
      else this.failedRequiredAssets.add(file.key);
    });
  }

  create(): void {
    // Ошибка разбора JSON не всегда вызывает loaderror; проверяем готовые кэши до создания интерфейса.
    const missing = new Set(this.failedRequiredAssets);
    for (const key of ['ally-animation', 'collision-geometry', 'town-layout']) if (!this.cache.json.exists(key)) missing.add(key);
    for (const key of [...Object.keys(manifest.images), ...Object.keys(manifest.clips)]) if (!this.textures.exists(key)) missing.add(key);
    if (missing.size) {
      showStartupFailure(`Some game files could not be loaded (${[...missing].slice(0, 3).join(', ')}${missing.size > 3 ? ', …' : ''}). Please retry.`);
      return;
    }
    gameScene = this;
    if (!localizationReady) setLanguage('en');
    document.querySelector<HTMLButtonElement>('#language')!.disabled = !localizationReady;
    this.battleCursor = new BattleCursor(this, (x, y) => this.sim?.manualAim(x, y) ?? { x, y });
    // Все 273 изображения charaPic в SWF используют несглаживаемую заливку 0x43.
    // Сохраняем дробные исходные координаты, но исключаем размытие соседних пикселей тела.
    this.textures.get('charaPic').setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.textures.get('itemPicture').setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.game.canvas.tabIndex = 0;
    this.game.canvas.setAttribute('aria-label', t('Elona Shooter battlefield'));
    loadStatus.hidden = true;
    container.dataset.loadMs = (performance.now() - bootStarted).toFixed(0);
    this.audioMixer = new AudioMixer(this.sound, readAudioSettings());
    this.sound.mute = this.muted;
    updateMuteControl(this.muted);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, configureDisplaySizing(this, container, playfield, () => this.options.lowQuality, positionMenuView));
    container.dataset.loadedSounds = JSON.stringify([...USED_SOUNDS].filter(key => this.cache.audio.exists(key)));
    container.dataset.muted = String(this.muted);
    this.root = this.add.container(0, 0);
    this.input.mouse?.disableContextMenu();
    // Phaser слушает mousedown родительского окна iframe с координатами чужого документа.
    // Новое нажатие принадлежит только canvas; глобальный mouseup сохраняет отпускание за его пределами.
    const mouse = this.input.mouse;
    const mouseWindow = mouse?.isTop ? window.top : window;
    if (mouse) mouseWindow?.removeEventListener('mousedown', mouse.onMouseDownWindow as EventListener);
    // Указатели HUD независимы: цель принадлежит первому пальцу, нажавшему на поле.
    this.input.addPointer(2);
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.screen !== 'battle' || this.paused || this.helpLayer || pointer.event.target !== this.game.canvas) return;
      if (this.firingReleaseOwned || this.touchAimPointer || this.fireReleased) return;
      if (pointer.wasTouch) {
        this.touchAimPointer = pointer;
        this.touchGestureSim = this.sim;
        this.touchGestureState = this.sim?.state;
        this.touchInput = true;
        this.touchAim = { x: pointer.x / this.cameras.main.zoom, y: pointer.y / this.cameras.main.zoom };
        this.battleCursor.hide();
      } else {
        if (pointer.button !== 0 || !pointer.leftButtonDown()) return;
        this.touchInput = false;
      }
      this.firePressed = true;
      this.firingGesture = this.firingReleaseOwned = true;
    });
    const releaseFire = (pointer: Phaser.Input.Pointer) => {
      if (pointer.wasTouch) {
        if (pointer !== this.touchAimPointer) return;
        if (pointer.event.type.includes('cancel')) { this.cancelBattleGesture(); return; }
        this.touchAim = { x: pointer.x / this.cameras.main.zoom, y: pointer.y / this.cameras.main.zoom };
        this.touchAimPointer = undefined;
      } else if (this.touchInput || pointer.button !== 0) return;
      if (this.firingReleaseOwned) this.fireReleased = true;
      this.firingGesture = this.firingReleaseOwned = false;
      this.touchAimSprite?.setVisible(false);
    };
    this.input.on('pointerup', releaseFire);
    this.input.on('pointerupoutside', releaseFire);
    // DOM сохраняет последнюю точку и различает отмену даже вне canvas.
    const trackTouch = (event: TouchEvent) => {
      const owner = this.touchAimPointer;
      if (!owner) return;
      const touch = Array.from(event.changedTouches).find(t => t.identifier === owner.identifier);
      if (!touch) return;
      if (event.type === 'touchcancel') { this.cancelBattleGesture(); return; }
      const rect = this.game.canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) { this.cancelBattleGesture(); return; }
      this.touchAim = {
        x: (touch.clientX - rect.left) * this.scale.width / rect.width / this.cameras.main.zoom,
        y: (touch.clientY - rect.top) * this.scale.height / rect.height / this.cameras.main.zoom,
      };
      if (event.type === 'touchend') {
        this.touchAimPointer = undefined;
        if (this.firingReleaseOwned) this.fireReleased = true;
        this.firingGesture = this.firingReleaseOwned = false;
        this.touchAimSprite?.setVisible(false);
      }
    };
    for (const type of ['touchmove', 'touchend', 'touchcancel']) window.addEventListener(type, trackTouch as EventListener, true);
    const outsideRelease = (event: MouseEvent) => {
      if (this.touchInput || event.button !== 0) return;
      if (this.firingReleaseOwned) this.fireReleased = true;
      this.firingGesture = this.firingReleaseOwned = false;
    };
    const releaseWindows = new Set([window, ...(mouseWindow ? [mouseWindow] : [])]);
    for (const releaseWindow of releaseWindows) releaseWindow.addEventListener('mouseup', outsideRelease, true);
    const cursorInput = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && !this.touchAimPointer && !this.firingReleaseOwned && !this.fireReleased) this.touchInput = false;
      else this.battleCursor.hide();
    };
    for (const type of ['pointerdown', 'pointermove', 'pointerup']) this.game.canvas.addEventListener(type, cursorInput as EventListener);
    const suspend = () => {
      this.cancelBattleGesture();
      if (this.screen === 'battle' && !this.paused) this.togglePause();
    };
    const visibility = () => { if (document.hidden) suspend(); };
    window.addEventListener('blur', suspend);
    window.addEventListener('pagehide', suspend);
    document.addEventListener('visibilitychange', visibility);
    // Touch не полагается на synthetic click: второй палец не всегда получает его от браузера.
    const controlSelector = '#touch-reload, #touch-fire-at-will';
    const controlFrom = (target: EventTarget | null) => target instanceof Element ? target.closest<HTMLButtonElement>(controlSelector) : null;
    const controlTouches = new Map<number, { button: HTMLButtonElement; epoch: number }>();
    const recentTouchControls = new WeakMap<HTMLButtonElement, number>();
    const activateControl = (button: HTMLButtonElement) => {
      if (button.disabled || this.screen !== 'battle' || this.paused || this.helpLayer || this.pauseDialog || this.graphicsLost) return;
      if (button.id === 'touch-reload') this.sim?.queueReload();
      else this.toggleBattleFireAtWill();
      this.syncTouchBattleControls();
    };
    const controlTouchStart = (event: TouchEvent) => {
      const button = controlFrom(event.target);
      if (!button || button.disabled) return;
      // Отмена стандартного действия убирает совместимый mouse/click, но не мешает первому пальцу.
      event.preventDefault();
      for (const touch of Array.from(event.changedTouches)) controlTouches.set(touch.identifier, { button, epoch: this.touchControlEpoch });
    };
    const controlTouchEnd = (event: TouchEvent) => {
      for (const touch of Array.from(event.changedTouches)) {
        const contact = controlTouches.get(touch.identifier);
        if (!contact) continue;
        const { button, epoch } = contact;
        controlTouches.delete(touch.identifier);
        event.preventDefault();
        recentTouchControls.set(button, performance.now());
        const rect = button.getBoundingClientRect();
        if (epoch === this.touchControlEpoch && event.type !== 'touchcancel' && button.isConnected && touch.clientX >= rect.left && touch.clientX < rect.right && touch.clientY >= rect.top && touch.clientY < rect.bottom) activateControl(button);
      }
    };
    const controlMouseDown = (event: PointerEvent) => {
      // Настоящая мышь после touch не должна попасть под защиту от совместимого click.
      const button = controlFrom(event.target);
      if (button && event.pointerType === 'mouse') recentTouchControls.delete(button);
    };
    const touchControl = (event: MouseEvent) => {
      const button = controlFrom(event.target);
      if (!button) return;
      event.preventDefault();
      // Запасная защита от отложенного совместимого click; клавиатурный click (detail=0) сохраняем.
      if (event.detail !== 0 && performance.now() - (recentTouchControls.get(button) ?? -Infinity) < 1000) return;
      activateControl(button);
    };
    document.addEventListener('touchstart', controlTouchStart, { capture: true, passive: false });
    document.addEventListener('touchend', controlTouchEnd, { capture: true, passive: false });
    document.addEventListener('touchcancel', controlTouchEnd, { capture: true, passive: false });
    document.addEventListener('pointerdown', controlMouseDown, true);
    document.addEventListener('click', touchControl);
    // Новые HTML-кнопки получают текущее состояние один раз при добавлении, не каждый кадр.
    const controlsObserver = new MutationObserver(records => {
      const changed = records.some(record => [...Array.from(record.addedNodes), ...Array.from(record.removedNodes)]
        .some(node => node instanceof Element && (node.matches(controlSelector) || node.querySelector(controlSelector))));
      if (changed) { this.touchControlsState = ''; this.syncTouchBattleControls(); }
    });
    controlsObserver.observe(document.body, { childList: true, subtree: true });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.cancelBattleGesture();
      for (const releaseWindow of releaseWindows) releaseWindow.removeEventListener('mouseup', outsideRelease, true);
      for (const type of ['touchmove', 'touchend', 'touchcancel']) window.removeEventListener(type, trackTouch as EventListener, true);
      for (const type of ['pointerdown', 'pointermove', 'pointerup']) this.game.canvas.removeEventListener(type, cursorInput as EventListener);
      window.removeEventListener('blur', suspend);
      window.removeEventListener('pagehide', suspend);
      document.removeEventListener('visibilitychange', visibility);
      document.removeEventListener('pointerdown', controlMouseDown, true);
      document.removeEventListener('click', touchControl);
      document.removeEventListener('touchstart', controlTouchStart, true);
      document.removeEventListener('touchend', controlTouchEnd, true);
      document.removeEventListener('touchcancel', controlTouchEnd, true);
      controlsObserver.disconnect();
      controlTouches.clear();
    });
    this.input.on('gameout', () => { if (!this.touchInput) this.firingGesture = false; });
    this.input.on('gameover', (_time: number, event: MouseEvent | TouchEvent) => {
      if (!this.touchInput && this.firingReleaseOwned && 'buttons' in event && (event.buttons & 1) !== 0) this.firingGesture = true;
    });
    // В фоновой вкладке очередь Phaser повторно доставляла Escape/F после следующего кадра.
    // Прямое событие DOM выполняет переключение один раз и не зависит от частоты рендеринга.
    const combatKey = (event: KeyboardEvent) => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      if (this.titleAudioOpen) {
        if (event.code === 'Escape') { event.preventDefault(); this.closeTitleAudio(); }
        return;
      }
      if (event.code !== 'Escape' && event.target instanceof Element && event.target.closest('#audio-settings')) return;
      // Space/Enter на HTML-кнопке выполняет её нативный click, а не боевую перезарядку.
      if (['Space', 'Enter'].includes(event.code) && controlFrom(event.target)) return;
      if (this.collectionDialog) {
        if (event.code === 'Escape') this.closeCollectionImport();
        if (event.code === 'Space') event.preventDefault();
        return;
      }
      if (this.closeTownEvent) {
        if (['Escape', 'Space', 'Enter'].includes(event.code)) { event.preventDefault(); this.closeTownEvent(); }
        return;
      }
      if (event.code === 'Escape') {
        if (this.pauseDialog) { this.pauseDialog.destroy(true); this.pauseDialog = undefined; }
        else if (this.helpLayer) this.closeHelp();
        else if (['battle', 'town', 'result'].includes(this.screen)) this.togglePause();
        else if (this.screen === 'gene') this.showTitle();
        else if (this.screen === 'mods') {
          if (this.modDetailsOpen) this.showGameMods(this.modsClassPage); else this.leaveGameMods();
        }
      } else if (event.code === 'Space') {
        event.preventDefault();
        if (this.helpLayer || this.pauseDialog) return;
        if (this.paused) this.togglePause(); else if (this.screen === 'battle') this.reloadRequested = true;
      } else if (this.screen === 'battle' && !this.paused && !this.helpLayer) {
        if (event.code === 'KeyF') this.toggleBattleFireAtWill();
        else if (/^Digit[1-5]$/.test(event.code)) this.slotRequested = Number(event.code.slice(-1)) - 1;
      }
    };
    window.addEventListener('keydown', combatKey);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => window.removeEventListener('keydown', combatKey));
    this.game.events.on(Phaser.Core.Events.BLUR, () => { if (this.screen === 'battle' && !this.paused) this.togglePause(); });
    const contextLost = () => {
      this.graphicsLost = true; container.dataset.webglContext = 'lost';
      if (this.screen === 'battle' && !this.paused) this.togglePause();
    };
    const contextRestored = () => { this.graphicsLost = false; container.dataset.webglContext = 'ready'; };
    this.game.canvas.addEventListener('webglcontextlost', contextLost);
    this.game.canvas.addEventListener('webglcontextrestored', contextRestored);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.canvas.removeEventListener('webglcontextlost', contextLost);
      this.game.canvas.removeEventListener('webglcontextrestored', contextRestored);
    });
    container.dataset.webglContext = 'ready';
    this.reset('intro');
    const cleanup = playOpening(playfield, assetUrl('screens/opening.webp'), () => this.showTitle());
    this.closeOpening = cleanup;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
    this.ready = true;
  }

  private cancelBattleGesture(): void {
    this.sim?.cancelQueuedReload();
    // Незавершённое касание HTML-кнопки тоже не переживает паузу или смену экрана.
    this.touchControlEpoch++;
    // Локальные флаги сбрасываются всегда; симуляция — только у незавершённого touch-жеста.
    this.touchAimPointer = undefined;
    this.firePressed = this.fireReleased = false;
    this.firingGesture = this.firingReleaseOwned = false;
    this.touchAimSprite?.setVisible(false);
    this.battleCursor.hide();
    const owner = this.touchGestureSim;
    const ownedState = this.touchGestureState;
    this.touchGestureSim = this.touchGestureState = undefined;
    // Импорт мог уже заменить sim или state: чужое сохранение и мышиный заряд не трогаем.
    if (!owner || owner !== this.sim || owner.state !== ownedState) return;
    this.reloadRequested = false;
    this.slotRequested = undefined;
    const state = owner.state;
    state.fireHeld = state.pendingShot = false;
    if (state.player.bowDrawing) {
      state.player.bowDrawing = false;
      this.playerSprite?.stopOriginal(weaponPresentation(this.sim.selectedItem?.id ?? 0).idleFrame);
      this.bowSound?.destroy(); this.bowSound = undefined;
    }
    if (state.heroAI && this.sim.heroSettings.order === -1) {
      state.heroAI.state.shooting = false;
      state.heroAI.state.burst = 0;
    }
  }

  private toggleBattleFireAtWill(): void {
    if (!this.sim?.toggleFireAtWill()) return;
    this.playSound('soundReloaded2');
    if (this.sim.fireAtWill) this.flashFrames = 8;
    this.paintBattle();
    this.syncTouchBattleControls();
  }

  private syncTouchBattleControls(): void {
    const active = this.screen === 'battle' && !this.paused && !this.helpLayer && !this.pauseDialog && !this.graphicsLost && this.sim?.state.phase === 'battle';
    const pressed = Boolean(this.sim?.fireAtWill);
    const readyToReload = active && this.sim!.canQueueReload();
    const queued = Boolean(active && this.sim!.reloadQueued);
    const reloading = Boolean(active && this.sim!.weapon?.reloadTime);
    const state = `${Boolean(active)}/${pressed}/${Boolean(readyToReload)}/${queued}/${reloading}/${getLanguage()}`;
    // Проверка состояния дешева; поиск DOM и запись атрибутов нужны лишь при изменении.
    if (this.touchControlsState === state) return;
    this.touchControlsState = state;
    const reload = document.querySelector<HTMLButtonElement>('#touch-reload');
    const fire = document.querySelector<HTMLButtonElement>('#touch-fire-at-will');
    if (reload) {
      reload.disabled = !readyToReload;
      reload.dataset.reloadState = reloading ? 'reloading' : queued ? 'queued' : 'ready';
      reload.setAttribute('aria-busy', String(queued || reloading));
      reload.setAttribute('aria-label', t(reloading ? 'Reloading' : queued ? 'Reload queued' : 'Reload'));
    }
    if (fire) {
      fire.disabled = !active;
      fire.setAttribute('aria-label', t('Fire at will'));
      fire.setAttribute('aria-pressed', String(pressed));
    }
  }

  private reset(screen: Screen): void {
    this.titleAudioOpen = false;
    this.audioSettingsView = undefined;
    this.cancelBattleGesture();
    this.touchAimSprite = undefined;
    this.combatNotices.reset();
    for (const view of this.combatNoticeViews.values()) view.destroy(true);
    this.combatNoticeViews.clear(); delete container.dataset.combatNotices;
    delete container.dataset.rampageEffects;
    const keepTownAmbience = this.screen === 'town' && screen === 'town';
    if (keepTownAmbience && this.townNavigation) this.townNavigation.parentContainer?.remove(this.townNavigation);
    else this.townNavigation = undefined;
    this.screen = screen;
    this.titleSequence = undefined; delete container.dataset.titleButtonsReady;
    this.closeOpening?.(); this.closeOpening = undefined;
    this.screenShake.reset(); this.cameras.main.setScroll(0, 0);
    this.bottomBarSprite = undefined;
    this.battleBackdropSprite = this.battleCloudSprite = undefined;
    delete container.dataset.battleBackdrop;
    this.bossReticles.clear(); this.bossReticleSeen.clear(); this.enemyFrameAudio.clear(); this.frameSoundCues = [];
    delete container.dataset.screenShake; delete container.dataset.bossReticles; delete container.dataset.frameSounds;
    delete container.dataset.rampageBar;
    delete container.dataset.specialTrails; delete container.dataset.flashFrames;
    this.paused = false;
    this.accumulator = 0;
    this.firePressed = this.fireReleased = this.reloadRequested = false; this.slotRequested = undefined;
    this.firingGesture = this.firingReleaseOwned = false;
    if (!keepTownAmbience || this.input.manager.defaultCursor !== 'default') this.input.setDefaultCursor('default');
    // Эффекты, добавленные в stage над HUD, тоже принадлежат текущему экрану.
    for (const effect of this.effects) effect.object.destroy();
    this.root.removeAll(true);
    if (!['loot', 'boss-loot', 'skill', 'result'].includes(screen)) { this.celebration?.destroy(); this.celebration = undefined; this.fireworkMedalChecked = false; }
    this.volumeIcon = undefined; this.pauseDialog = undefined; this.flash = undefined; this.flashFrames = 0; this.flashClock = 0;
    this.collectionDialog = undefined; this.closeTownEvent = undefined; delete container.dataset.townNotice; delete container.dataset.flashCollection; delete container.dataset.flashAdventure;
    if (!this.celebration) delete container.dataset.fireworkFrames;
    this.helpLayer = undefined; delete container.dataset.helpPage; delete container.dataset.helpScroll;
    this.fireAtWillSprites = undefined; this.castleSisterSprite = undefined; delete container.dataset.fireAtWill; delete container.dataset.castleSister;
    this.heroAimCursor = undefined; delete container.dataset.heroSettings; delete container.dataset.heroAutomatic;
    for (const arrow of this.enemyArrowSprites.values()) arrow.container.destroy(true);
    this.enemyArrowSprites.clear();
    for (const shadow of this.ratShadows.values()) shadow.destroy(); this.ratShadows.clear();
    this.enemySprites.clear(); this.enemyRageSprites.clear(); this.enemyHitSprites.clear(); this.bossFrames.clear(); this.bossBars.clear(); this.projectileSprites.clear(); this.hud.clear(); this.effects = []; this.hotbar = [];
    this.bowSound?.destroy(); this.bowSound = undefined;
    for (const entry of this.chainSounds.values()) entry.sound.destroy();
    this.chainSounds.clear();
    for (const sound of this.companionBowSounds.values()) sound.destroy();
    this.companionBowSounds.clear(); this.companionSprites.clear(); this.companionCursors.clear();
    this.reloadAnimations = 0;
    this.pauseLayer = undefined; this.playerSprite = undefined; this.battleCursor.hide(); this.ammoFill = undefined;
    if (!keepTownAmbience) { this.ambient?.destroy(); this.ambient = undefined; }
    container.dataset.screen = screen;
    container.dataset.saveSlot = String(this.saveSlot);
    delete container.dataset.deleteSaveSlot;
    status.hide();
    container.dataset.paused = 'false';
    container.dataset.ruleset = this.sim?.state.ruleset.id ?? this.newGameRuleset;
    container.dataset.bossBars = '0'; container.dataset.bossHealth = '[]';
    container.dataset.bossVisuals = '[]';
    container.dataset.playerFrame = ''; container.dataset.reloadTicks = '0'; container.dataset.reloadAnimations = '0';
    container.dataset.projectiles = '[]'; container.dataset.enemyArrows = '[]'; container.dataset.bowDrawing = 'false';
    delete container.dataset.lootOffers; delete container.dataset.inventory; delete container.dataset.inventorySlots;
    delete container.dataset.skillChoices; delete container.dataset.selectedTrait; delete container.dataset.traits; delete container.dataset.skillPoints;
    delete container.dataset.actionPoints; delete container.dataset.townTab; delete container.dataset.repairDialog; delete container.dataset.townDialog;
    delete container.dataset.shopStock; delete container.dataset.saleSlot; delete container.dataset.upgradeSelecting;
    delete container.dataset.pendingTownAction; delete container.dataset.pendingLootAction; delete container.dataset.upgradePreview;
    delete container.dataset.party; delete container.dataset.partySelection; delete container.dataset.pendingPartyAction; delete container.dataset.companionVisuals;
    delete container.dataset.castleUpgrades;
    delete container.dataset.titleName; delete container.dataset.titleSalary; delete container.dataset.claimTitleAvailable;
    delete container.dataset.medalHint;
    delete container.dataset.geneHint; delete container.dataset.geneTraits; delete container.dataset.geneClassLabels;
    delete container.dataset.genePose; delete container.dataset.geneAppearance;
    delete container.dataset.itemPopup;
    delete container.dataset.traitHint;
    delete container.dataset.carryOverAvailable; delete container.dataset.carryOverConfirmation;
    container.dataset.carryOver = String(Boolean(this.sim?.state.carryOver));
  }

  private image(key: string, x = 0, y = 0): Phaser.GameObjects.Image | undefined {
    const asset = manifest.images[key];
    if (!asset) return;
    const object = localizedImage(this, x - (asset.originX ?? 0), y - (asset.originY ?? 0), key).setOrigin(0);
    this.root.add(object);
    return object;
  }

  private clip(key: string, frame: number, x: number, y: number): Phaser.GameObjects.Image | undefined {
    const asset = manifest.clips[key];
    if (!asset) return;
    const actual = this.textures.get(key).has(String(frame)) ? String(frame) : '1';
    const object = localizedImage(this, x - asset.originX, y - asset.originY, key, actual).setOrigin(0);
    this.root.add(object);
    return object;
  }

  private text(x: number, y: number, content: string, size = 13, color = '#322316', font = 'ElonaMenu'): Phaser.GameObjects.Text {
    const object = localizedText(this, x, y, content, { resolution: 2, fontFamily: font, fontSize: `${size}px`, color, padding: { x: 1, y: 1 } });
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

  private originalButton(key: string, x: number, y: number, action: () => void, sound = 'soundClick1', pixelPerfect = true): void {
    const button = this.image(key, x, y);
    if (!button) return;
    button.setInteractive(pixelPerfect ? buttonInput(manifest.images[key]) : { useHandCursor: true });
    button.on('pointerover', () => { if (manifest.images[`${key}_over`]) button.setTexture(`${key}_over`); });
    button.on('pointerout', () => button.setTexture(key));
    button.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => { event.stopPropagation(); this.playSound(sound); action(); });
  }

  showTitle(): void {
    this.profileRead = readProfile(this.newGameRuleset); this.profile = this.profileRead.profile;
    const frame = this.titleSequence?.frame ?? 0;
    this.reset('title');
    this.clip('battleBackdrop', 1, -5, -15);
    const cloud = this.clip('battleCloud', 1, 175, -23)!;
    this.image('title');
    // Исходный логотип сохранён; дополнительный плюс обозначает браузерное продолжение.
    const plusShape = [{ x: -3, y: -10 }, { x: 3, y: -10 }, { x: 3, y: -3 }, { x: 10, y: -3 },
      { x: 10, y: 3 }, { x: 3, y: 3 }, { x: 3, y: 10 }, { x: -3, y: 10 },
      { x: -3, y: 3 }, { x: -10, y: 3 }, { x: -10, y: -3 }, { x: -3, y: -3 }]
      .map(p => new Phaser.Math.Vector2(p.x, p.y));
    const plus = this.add.graphics({ x: 535, y: 65 }).setName('title-plus');
    plus.lineStyle(5, 0x101a1e).strokePoints(plusShape.map(p => p.clone().add(new Phaser.Math.Vector2(1, 2))), true);
    plus.fillStyle(0x030507).fillPoints(plusShape, true);
    plus.lineStyle(1.5, 0xb6d2e0).strokePoints(plusShape, true);
    this.root.add(plus);
    const version = this.text(545, 96, `Browser version ${browserVersion}`, 13, '#eee0b5')
      .setOrigin(1, 0).setName('title-version').setShadow(1, 1, '#000000', 2);
    fitLocalizedText(version, { width: 300, height: 22 });
    const credits = this.text(310, 362, 'Original game: Noa · Plus: its creators and contributors', 11, '#e3dfc6')
      .setOrigin(0.5, 0).setName('title-credits').setShadow(1, 1, '#000000', 2);
    fitLocalizedText(credits, { width: 590, height: 17, minFontSize: 10 });
    const actors = this.add.container(0, 0); this.root.add(actors);
    const buttons: Phaser.GameObjects.Image[] = [];
    for (const [key, x, y, action] of [
      ['button_newGame', 185, 195.7, () => this.requestNewGame()],
      ['button_continue', 187.9, 249, () => this.continueGame()],
      ['button_help', 207.9, 301, () => this.showHelp()],
    ] as const) {
      const button = this.image(key, x, y);
      if (button) {
        buttons.push(button);
        const asset = manifest.images[key];
        let state: TitleButtonState = 'up';
        const showState = (next: TitleButtonState) => { state = next; button.setTexture(next === 'up' ? key : `${key}_${next}`); };
        // У исходного TextField кликаются и прозрачные промежутки; Up имеет отдельное смещение.
        button.setInteractive({ useHandCursor: true, hitArea: {}, hitAreaCallback: (_area: unknown, px: number, py: number) => titlePointerHit(key, state, px - asset.originX, py - asset.originY) })
          .on('pointerdown', (pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
            if (pointer.button !== 0) return;
            showState('down');
            // MouseLDownFunc_title сначала преобразует stage.mouseX/Y в int.
            if (!titleStateHit(key, state, Math.trunc(pointer.worldX) - button.x - asset.originX, Math.trunc(pointer.worldY) - button.y - asset.originY)) return;
            event.stopPropagation(); this.playSound('soundClick1'); action();
          });
        button.on('pointerover', () => showState('over')).on('pointerout', () => showState('up')).on('pointerup', () => showState('over'));
      } else this.labelButton(x + 45, y - 15, key.replace('button_', ''), action);
    }
    const art = this.add.container(0, 0); this.root.add(art);
    this.titleSequence = createTitleSequence((key, frame, x, y) => {
      const image = this.clip(key, frame, x, y)!; art.add(image); return image;
    }, actors, cloud, buttons, frame, (x, y) => this.cameras.main.setScroll(this.titleAudioOpen ? 0 : -x, this.titleAudioOpen ? 0 : -y), key => {
      if (key === 'soundImpact1') this.playSound(key);
      else if (!this.sound.locked && this.cache.audio.exists(key)) {
        if (key === 'soundReloaded1') this.playSound(key, 1, 0.42);
        else if (!this.sound.isPlaying(key)) {
          // DefineSound 87: пропустить задержку MP3 и ограничить выстрел длиной из SWF.
          this.audioMixer.play(key, { volume: 0.74, pan: 0.42 },
            { name: 'title-shot', start: 1633 / 22050, duration: 1607 / 22050 });
        }
      }
    });
    const saved = readSave(this.saveSlot);
    container.dataset.newGameRuleset = this.newGameRuleset;
    this.root.add(createEditionSelector(this, this.newGameRuleset, edition => {
      if (this.collectionDialog || this.helpLayer) return;
      this.newGameRuleset = edition; storeNewGameRuleset(edition); this.playSound('soundClick1'); this.showTitle();
    }));
    const labels = Array.from({ length: SAVE_SLOTS }, (_, slot) => saveSlotLabel(readSave(slot)));
    container.dataset.saveSlots = JSON.stringify(labels);
    this.root.add(createTitleSavesView(this, manifest, this.cache.json.get('town-layout') as TitleSavesLayout, labels, this.saveSlot, slot => {
      this.playSound('soundClick1');
      if (slot !== this.saveSlot && !selectSaveSlot(slot)) { status.textContent = 'The selected save slot could not be stored.'; return; }
      this.saveSlot = slot; this.showTitle();
    }, () => this.confirmDeleteSave()));
    this.text(119, 21, 'Unofficial browser port', 12, '#ffffff').setShadow(1, 1, '#000000', 2);
    this.text(334, 11, `Most Days Survived: ${this.profile.bestDay} / ${this.profile.bestHardcoreDay ?? 0} (HC) / ${this.profile.bestCasualDay ?? 0} (Casual)`, 12, '#ffffff').setShadow(1, 1, '#000000', 2);
    const soundLabel = this.text(285, 337, 'Sound', 16, '#eee0b5', 'ElonaMenuBold')
      .setOrigin(0.5, 0).setShadow(1, 1, '#000000', 2).setName('title-sound-label');
    const soundButton = this.zone(235, 334, 100, 25, () => this.showTitleAudio()).setName('title-sound');
    soundButton.on('pointerover', () => soundLabel.setColor('#ffffff'));
    soundButton.on('pointerout', () => soundLabel.setColor('#eee0b5'));
    if (saved.kind === 'error') status.textContent = saved.message;
    else if (this.profileRead.warning) status.textContent = this.profileRead.warning;
  }

  private showTitleAudio(): void {
    if (this.screen !== 'title' || this.titleAudioOpen || this.helpLayer || this.collectionDialog) return;
    this.titleAudioOpen = true; this.cameras.main.setScroll(0, 0);
    this.audioSettingsView = this.createAudioControls(() => this.closeTitleAudio());
    this.root.add(this.audioSettingsView.root);
  }

  private closeTitleAudio(): void {
    this.titleAudioOpen = false; this.audioSettingsView?.root.destroy(true); this.audioSettingsView = undefined;
  }

  private createAudioControls(close?: () => void): ReturnType<typeof createAudioSettingsView> {
    return createAudioSettingsView(this, playfield, this.audioMixer.settings, this.muted, settings => {
      this.audioMixer.setSettings(settings); storeAudioSettings(settings);
    }, () => this.toggleMute(), close);
  }

  private confirmDeleteSave(): void {
    const slot = this.saveSlot, name = saveSlotLabel(readSave(slot));
    const layout = (this.cache.json.get('town-layout') as { saleDialog: ModConfirmationLayout }).saleDialog;
    const dialog = createModConfirmation(this, manifest, layout, answer => {
      this.playSound('soundClick1');
      if (!answer || deleteSaveSlot(slot)) { this.showTitle(); return; }
      this.playSound('soundBeep');
      (dialog.getByName('delete-save-question') as Phaser.GameObjects.Text).setText('The save could not be deleted.');
    }, 'delete-save', `Really delete\n${name}?`);
    container.dataset.deleteSaveSlot = String(slot); this.root.add(dialog);
  }

  private requestNewGame(): void {
    if (this.collectionDialog || this.helpLayer) return;
    if (readSave(this.saveSlot).kind === 'empty') { this.showGene(); return; }
    const layout = (this.cache.json.get('town-layout') as { saleDialog: ModConfirmationLayout }).saleDialog;
    this.collectionDialog = createModConfirmation(this, manifest, layout, confirmed => {
      this.closeCollectionImport(); if (confirmed) this.showGene();
    }, 'replace-adventure', `Start ${RULESETS[this.newGameRuleset].name} in slot ${this.saveSlot + 1}?\nReplace the saved game?`);
    container.dataset.replaceAdventure = 'new';
    this.root.add(this.collectionDialog);
  }

  private showHelp(): void {
    if (this.helpLayer || (this.screen !== 'title' && !this.paused)) return;
    const layout = this.cache.json.get('town-layout') as { help: HelpLayout };
    this.helpLayer = createHelpView(this, manifest, layout.help, () => this.closeHelp(), (page, scroll) => {
      container.dataset.helpPage = String(page); container.dataset.helpScroll = String(Math.round(scroll));
    }, () => this.playSound('soundClick1'));
    this.root.add(this.helpLayer);
    if (this.volumeIcon) this.root.bringToTop(this.volumeIcon);
  }

  private closeHelp(): void {
    this.helpLayer?.destroy(true); this.helpLayer = undefined;
    delete container.dataset.helpPage; delete container.dataset.helpScroll;
  }

  showGene(page: 0 | 1 = 0, keepHero = false): void {
    this.reset('gene');
    if (!keepHero) { this.options = defaultGameOptions(this.newGameRuleset); this.applyRenderingOptions(); }
    if (!keepHero || !this.sim) {
      this.profileRead = readProfile(this.newGameRuleset); this.profile = this.profileRead.profile;
      this.clearMedalNotices(this.profile.medals);
      this.sim = new Simulation(Date.now(), { ...this.simulationOptions(), ruleset: this.newGameRuleset, medals: this.profile.medals, deferOpeningWaves: true });
    }
    this.image(manifest.images.townHud ? 'townHud' : 'town');
    this.drawHud();
    const background = new Set(this.root.list);
    this.image('gene');
    this.appearance = Math.max(0, Math.min(21, this.appearance));
    const portraits = this.add.container(0, 0); this.root.add(portraits);
    const bodies: { image: Phaser.GameObjects.Image; shadow: Phaser.GameObjects.Image; appearance: number }[] = [];
    let hovered = -1;
    const updatePortraits = () => {
      for (const body of bodies) {
        const alpha = body.appearance === this.appearance ? 1 : body.appearance === hovered ? 0.8 : 0.5;
        body.image.setAlpha(alpha); body.shadow.setAlpha(alpha);
      }
      container.dataset.geneAppearance = String(this.appearance);
    };
    for (let index = 0; index < 22; index++) {
      const x = 176 + index % 11 * 32;
      const y = 131 + Math.floor(index / 11) * 30;
      const shadow = this.clip('partyShadow', 1, x - 9.25, y + 7)!.setScale(0.9024353, 1);
      const body = this.clip('charaPic', index * 10 + 5, x - 12.45, y - 15.45)!.setScale(1, 0.9530487);
      portraits.add([shadow, body]); bodies.push({ image: body, shadow, appearance: index });
      this.zone(x - 14, y - 17, 30, 31, () => { this.appearance = index; this.sim?.rerollOpeningHero(); updatePortraits(); refreshClass(); })
        .on('pointerover', () => { hovered = index; updatePortraits(); })
        .on('pointerout', () => { hovered = -1; updatePortraits(); });
    }
    updatePortraits();
    animateStandingPortraits(this, portraits, bodies, pose => { container.dataset.genePose = String(pose); });
    const classes = (Object.keys(this.sim!.rules.content.classes) as HeroClass[]).slice(page * 4, page * 4 + 4);
    const radios: (Phaser.GameObjects.Image | undefined)[] = [];
    const labels: Phaser.GameObjects.Text[] = [];
    const hint = fitLocalizedText(this.text(280, 205, '', 13, '#2d315b').setWordWrapWidth(255), { width: 255, height: 27 });
    const info = createGeneInfoView(this, manifest, this.cache.json.get('town-layout') as TownLayout & PartyLayout,
      hint => { if (hint) container.dataset.geneHint = JSON.stringify(hint); else delete container.dataset.geneHint; });
    this.root.add(info.root);
    const refreshClass = () => {
      const selected = this.sim!.state.player.classId, definition = HERO_CLASSES[selected];
      classes.forEach((id, index) => {
        radios[index]?.setFrame(id === selected ? '2' : '1');
        labels[index].setColor(id === selected ? '#22170e' : '#514b36');
        const unlocked = heroClassUnlocked(id, this.profile.medals);
        labels[index].setText(unlocked ? HERO_CLASSES[id].name : '??????').setAlpha(unlocked ? 1 : 0.5);
        radios[index]?.setAlpha(unlocked ? 1 : 0.5);
      });
      hint.setText(definition.hint);
      container.dataset.geneTraits = JSON.stringify(info.update(this.sim!.state.player.traits));
      container.dataset.geneClassLabels = JSON.stringify(labels.map(label => label.text));
      this.updateHud();
      container.dataset.heroClass = selected;
      container.dataset.classPage = String(page);
      container.dataset.unlockedClasses = JSON.stringify((Object.keys(HERO_CLASSES) as HeroClass[]).filter(id => heroClassUnlocked(id, this.profile.medals)));
      status.textContent = ALL_TRAITS[definition.id].description;
    };
    classes.forEach((id, index) => {
      const y = 214 + index * 20;
      radios.push(this.clip('radioButton', id === 'sheriff' ? 2 : 1, 180, y));
      labels.push(this.text(194, y - 7, HERO_CLASSES[id].name, 14));
      this.zone(171, y - 8, 90, 18, () => {
        if (!heroClassUnlocked(id, this.profile.medals)) {
          const definition = HERO_CLASSES[id];
          status.textContent = 'unlockMedal' in definition ? `${definition.name} is locked. Earn ${MEDALS[definition.unlockMedal].name} by reaching level 10 with that starting class.` : 'This class is locked.';
          this.playSound('soundBeep'); return;
        }
        this.sim?.rerollOpeningHero(id); refreshClass();
      }).setName(`hero-class-${id}`).on('pointerover', () => info.showClass(id, heroClassUnlocked(id, this.profile.medals))).on('pointerout', info.hide);
    });
    refreshClass();
    this.originalButton('button_proceed', 267, 301, () => this.startGame());
    this.originalButton('button_gameMods', 408, 301, () => this.showGameMods(page));
    fitLocalizedText(this.text(159, 302, page === 0 ? 'Next Page' : 'Previous Page', 13, '#2d315b'), { width: 101, height: 23 });
    const modeNames = [['casual', 'Casual Mode'], ['hardcore', 'Hardcore Mode']] as const;
    const modeMarkers = modeNames.map(([mode, name], index) => fitLocalizedText(this.text(413, 252 + index * 22, '', 12, '#2d315b', 'Arial'), { width: 133, height: 21 }));
    const refreshMode = () => modeNames.forEach(([mode, name], index) => modeMarkers[index].setText(`${this.sim!.state.mode === mode ? '[x]' : '[ ]'} ${name}`));
    refreshMode();
    modeNames.forEach(([mode], index) => this.zone(405, 244 + index * 22, 142, 21, () => {
      this.sim!.setOpeningMode(this.sim!.state.mode === mode ? 'normal' : mode); refreshMode();
      status.textContent = this.sim!.state.mode === 'hardcore' ? 'In Hardcore Mode, your save file is deleted at the start of each battle. You can save and export only in town.'
        : this.sim!.state.mode === 'casual' ? 'Casual Mode: fewer enemies, 35% more kill experience and lower taxes.' : 'Normal Mode.';
      container.dataset.gameMode = this.sim!.state.mode ?? 'normal';
    }));
    this.zone(145, 294, 103, 37, () => { this.playSound('soundClick1'); this.showGene(page === 0 ? 1 : 0, true); });
    const menu = this.root.list.filter(object => !background.has(object));
    this.root.add(this.add.container(MENU_X, 0, menu));
  }

  private leaveGameMods(): void {
    this.sim?.setOpeningMods({}); this.showGene(this.modsClassPage, true);
    status.textContent = 'Game MODs have been reset.';
  }

  private showGameMods(page: 0 | 1, details = false): void {
    this.modsClassPage = page;
    this.modDetailsOpen = details;
    this.reset('mods'); this.image('townHud'); this.drawHud();
    const background = new Set(this.root.list);
    this.image('gameMods');
    this.text(176, 263, 'Controls', 12, '#542d20', 'Arial').setFontStyle('bold');
    const rows: [GameMod, number][] = [['bossMods', 104], ['intense', 123], ['tight', 142], ['laptop', 161], ['community', 181], ['skipHard', 220], ['weaponLevel', 239], ['aimAssist', 282]];
    const checks = rows.map(([key, y]) => {
      fitLocalizedText(this.text(168, y, GAME_MODS[key].label, 12, '#24221a', 'Arial'), { width: key === 'community' ? 180 : 350, height: 19 });
      return this.clip('partyCheckOff', 1, 150, y + 2)!;
    });
    const refresh = () => {
      rows.forEach(([key], index) => checks[index].setTexture(this.sim!.state.mods?.[key] ? 'partyCheckOn' : 'partyCheckOff', '1'));
      container.dataset.gameMods = JSON.stringify(this.sim!.state.mods ?? {});
    };
    rows.forEach(([key, y]) => this.zone(150, y, key === 'community' ? 190 : 390, 19, () => {
      const mods = { ...this.sim!.state.mods };
      if (mods[key]) delete mods[key]; else mods[key] = true;
      this.sim!.setOpeningMods(mods); refresh();
      status.textContent = key === 'community' ? 'Community Compilation: Active grants fixed bonus AP; MOD sales remain active for shop refreshes on sale days.' : GAME_MODS[key].label;
    }));
    this.originalButton('button_proceed', 269.05, 310, () => this.startGame());
    this.originalButton('button_modDetails', 341.8, 182.95, () => this.showGameMods(page, true), 'soundScroll1', false);
    if (details) {
      for (const object of this.root.list) if (!background.has(object) && object.input) object.disableInteractive();
    }
    this.originalButton('button_modBack', 132.35, 310, () => this.leaveGameMods());
    if (details) {
      this.image('modDetails');
      this.root.add(originalTextArea(this, 'community-mod-details', COMMUNITY_MOD_DETAILS, 160.05, 166.1, 358, 154));
      this.originalButton('button_windowClose', 503.9, 135, () => this.showGameMods(page));
    }
    refresh();
    const menu = this.root.list.filter(object => !background.has(object));
    this.root.add(this.add.container(MENU_X, 0, menu));
    status.textContent = 'Choose optional Game MODs. Proceed starts this adventure; Back resets MODs.';
    status.hide();
  }

  private simulationOptions() { return { hitTest: (enemy: Readonly<EnemyState>, x: number, y: number) => this.hitTest(enemy, x, y) }; }

  startGame(): void {
    this.carryCheckpoint = undefined;
    if (!this.sim?.startOpeningBattle()) this.sim = new Simulation(Date.now(), { ...this.simulationOptions(), ruleset: this.newGameRuleset, medals: this.profile.medals });
    this.enterBattle(true);
    this.saveGame(false);
    this.playSound('soundBattleBegin');
  }

  private enterBattle(announce = false): void {
    this.reset('battle');
    if (!announce) for (const enemy of this.sim!.state.enemies) if (enemy.kind === 'boss' && enemy.x > 20) this.bossReticleSeen.add(enemy.uid);
    this.drawBattleBackground();
    this.playerSprite = new OriginalAlly(this, this.cache.json.get('ally-animation') as OriginalAllyMetadata, manifest.clips, this.appearance, WORLD.playerX, WORLD.playerY);
    this.root.add(this.playerSprite);
    this.playerSprite.setOriginalFrame(weaponPresentation(this.sim?.selectedItem?.id ?? 0).idleFrame);
    if (this.sim?.state.player.bowDrawing) this.playerSprite.playOriginal(86);
    if (this.sim?.weapon?.reloadTime && !this.sim.weapon.autoReload) this.playerSprite.playOriginal('reload');
    this.syncCompanionActors();
    this.drawHud();
    this.input.setDefaultCursor(BATTLE_CURSOR);
    if (this.cache.audio.exists('soundBgForest')) this.ambient = this.audioMixer.add('soundBgForest', { volume: 0.3, loop: true });
    this.ambient?.play();
    this.syncEnemyFrameAudio(announce);
    this.paintBattle();
    if (announce && this.sim?.state.activeMission.bossDay) this.announceCombat('Boss Day!');
  }

  private drawBattleBackground(): void {
    this.battleBackdropSprite = this.clip('battleBackdrop', 1, -5, -15);
    this.battleCloudSprite = this.clip('battleCloud', 1, 160, -35)?.setScale(1.0000305, 1.000412);
    this.paintBattleBackdrop();
    this.image('battle');
    this.paintCastleSister();
  }

  private paintBattleBackdrop(): void {
    const color = battleLightColor(this.sim?.state.battleLighting);
    const x = battleCloudX(this.sim?.state.tick ?? 0);
    this.battleBackdropSprite?.setTint(color);
    this.battleCloudSprite?.setTint(color).setX(x);
    container.dataset.battleBackdrop = JSON.stringify({ color, cloudX: x, lighting: this.sim?.state.battleLighting ?? null });
  }

  private paintCastleSister(): void {
    const sister = this.sim?.state.castleSister ?? STANDING_SISTER;
    if (!this.castleSisterSprite) {
      const { sister: position } = (this.cache.json.get('town-layout') as { fireAtWill: { sister: { x: number; y: number; scaleX: number; scaleY: number } } }).fireAtWill;
      const asset = manifest.clips.castleSister;
      this.castleSisterSprite = this.clip('castleSister', sister.frame, position.x, position.y)!
        .setOrigin(asset.originX / asset.frameWidth, asset.originY / asset.frameHeight)
        .setPosition(position.x, position.y).setScale(position.scaleX, position.scaleY);
    }
    this.castleSisterSprite.setFrame(String(sister.frame));
    container.dataset.castleSister = JSON.stringify(sister);
  }

  private drawHud(): void {
    this.bottomBarSprite = this.clip('hotbarBackground', 1, 315, 370)?.setAlpha(143 / 256);
    this.ammoFill = this.image('ammo_fill', 290.9, 11);
    this.adrenalineFill = undefined;
    if (this.sim && ['sniper', 'ranger', 'duelist'].includes(this.sim.state.player.classId)) {
      this.clip('heroAdrenalineFrame', 1, 207.25, 19.45)?.setScale(1, 1.000473);
      this.adrenalineFill = this.clip('heroAdrenalineFill', 1, 148, 9.9);
      this.text(154, 11.85, 'Adrenaline', 12, '#ffffff', 'ElonaHud').setScale(1.0004883, 0.97636414);
    }
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
      const cooldown = localizedImage(this, slot * 90 - 20 + 38.95, 350 + 6.5, 'itemTimer', '1')
        .setOrigin((timer.originX + 38.95) / timer.frameWidth, (timer.originY + 6.5) / timer.frameHeight);
      this.root.add(cooldown);
      this.hotbar.push({ icon, count, cooldown });
      if (this.screen === 'battle') {
        const hit = this.add.zone(slot * 90, 343, 90, 37).setOrigin(0).setInteractive();
        this.root.add(hit);
        hit.on('pointerdown', (pointer: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
          if (!pointer.wasTouch || this.paused) return;
          e.stopPropagation();
          this.slotRequested = slot;
        });
      }
    }
    this.updateHud();
    this.drawGameControls();
  }

  private drawGameControls(): void {
    if (!['battle', 'town', 'result'].includes(this.screen)) return;
    const { menuButton, vol } = (this.cache.json.get('town-layout') as { pause: PauseLayout }).pause.controls;
    this.originalButton('button_gameMenu', menuButton.x, menuButton.y, () => { if (!this.paused) this.togglePause(); });
    const a = manifest.clips.gameVolume;
    this.volumeIcon = localizedImage(this, vol.x, vol.y, 'gameVolume', this.muted ? '2' : '1').setOrigin(a.originX / a.frameWidth, a.originY / a.frameHeight).setInteractive({ useHandCursor: true }); this.root.add(this.volumeIcon);
    this.volumeIcon.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => { e.stopPropagation(); this.toggleMute(); });
  }

  private applyRenderingOptions(): void {
    for (const key of [...Object.keys(manifest.images), ...Object.keys(manifest.clips)]) {
      if (this.textures.exists(key)) this.textures.get(key).setFilter(this.options.lowQuality || key === 'charaPic' || key === 'itemPicture' ? Phaser.Textures.FilterMode.NEAREST : Phaser.Textures.FilterMode.LINEAR);
    }
    this.cameras.main.roundPixels = this.options.lowQuality;
    this.events.emit('display-quality');
    container.dataset.options = JSON.stringify(this.options);
    if (this.options.disableFireworks) { this.celebration?.destroy(); this.celebration = undefined; delete container.dataset.fireworkFrames; }
    if (this.options.disableFlash) { this.flashFrames = 0; this.flash?.setVisible(false); }
  }

  private clearMedalNotices(known: readonly number[]): void {
    this.medalNotices.reset(known);
    for (const view of this.medalNoticeViews.values()) view.destroy(true);
    this.medalNoticeViews.clear(); delete container.dataset.medalNotices;
  }

  private updateMedalNotices(delta: number): void {
    this.medalNotices.advance(Math.min(delta, 250));
    const layout = (this.cache.json.get('town-layout') as { infoPopup: InfoPopupLayout }).infoPopup;
    if (this.sim && !['title', 'gene', 'mods'].includes(this.screen)) {
      this.medalNotices.observe(this.sim.state.earnedMedals, this.screen === 'battle');
    }
    for (const notice of this.medalNotices.active) {
      if (this.medalNoticeViews.has(notice)) continue;
      if (notice.id !== undefined) this.playSound('soundMedal');
      this.medalNoticeViews.set(notice, createMedalNoticeView(this, manifest, layout, notice));
    }
    for (const [notice, view] of this.medalNoticeViews) {
      if (!this.medalNotices.active.includes(notice)) { view.destroy(true); this.medalNoticeViews.delete(notice); }
      else updateMedalNoticeView(view, layout, notice);
    }
    const notices = JSON.stringify(this.medalNotices.active.map(({ id, slot, frame, battle, text }) => ({ id, slot, frame, battle, text })));
    if (container.dataset.medalNotices !== notices) container.dataset.medalNotices = notices;
  }

  private updatePresentation(delta: number): void {
    if (this.titleSequence) {
      this.titleSequence.advance(delta);
      if (this.titleSequence.frame >= 48 && !container.dataset.titleButtonsReady) container.dataset.titleButtonsReady = 'true';
    }
    this.updateMedalNotices(delta);
    this.combatNotices.advance(Math.min(delta, 250));
    const layout = (this.cache.json.get('town-layout') as { combatNotices: CombatNoticeLayout }).combatNotices;
    for (const [notice, view] of this.combatNoticeViews) {
      if (!this.combatNotices.active.includes(notice)) { view.destroy(true); this.combatNoticeViews.delete(notice); }
      else updateCombatNoticeView(view, layout, notice);
    }
    container.dataset.combatNotices = JSON.stringify(this.combatNotices.active);
    if (this.paused) return;
    if (this.screen === 'battle') {
      this.screenShake.advance(delta);
      // Камера меняет только показ: мировые матрицы hitTest и состояние симуляции остаются прежними.
      this.cameras.main.setScroll(-this.screenShake.x, -this.screenShake.y);
      container.dataset.screenShake = JSON.stringify({ x: this.screenShake.x, y: this.screenShake.y, frames: this.screenShake.remaining });
    }
    this.celebration?.advance(delta);
    if (this.celebration) {
      container.dataset.fireworkFrames = String(this.celebration.frame);
      if (!this.fireworkMedalChecked && this.celebration.frame >= FIREWORK_MEDAL_FRAMES) {
        this.fireworkMedalChecked = true;
        if (this.sim?.watchFireworks()) {
          this.celebration.grantBonus();
          this.saveGame(false);
        }
      }
      if (this.celebration.finished) { this.celebration.destroy(); this.celebration = undefined; }
    }
    if (this.screen === 'battle' && this.flashFrames > 0 && !this.options.disableFlash) {
      this.flashClock += Math.min(delta, 250);
      while (this.flashClock >= 1000 / 30 && this.flashFrames > 0) { this.flashClock -= 1000 / 30; this.flashFrames--; }
      if (!this.flash) { this.flash = this.add.rectangle(0, 0, 620, 345, 0xffffff).setOrigin(0); this.root.add(this.flash); }
      this.flash.setAlpha(Math.min(0.5, this.flashFrames * 8 / 255)).setVisible(this.flashFrames > 0); this.root.bringToTop(this.flash);
    }
  }

  private startCelebration(): void {
    if (this.options.disableFireworks || this.celebration || this.screen !== 'result' || !this.sim) return;
    const state = this.sim.state;
    this.celebration = createFireworks(this, manifest, state.rng ^ state.day, state.earnedMedals);
    this.fireworkMedalChecked = false; this.playSound('soundFirework', 0.25);
  }

  private paintFireAtWill(): void {
    if (this.sim?.fireAtWill && !this.fireAtWillSprites) {
      const data = this.cache.json.get('town-layout') as { fireAtWill: {
        sister: { x: number; y: number; scaleX: number; scaleY: number };
        fire: { x: number; y: number; scaleX: number; scaleY: number; rotationDegrees: number }; rageOffsetY: number;
      } };
      const { sister, fire, rageOffsetY } = data.fireAtWill;
      const flame = this.clip('sisterFireAtWill', 1, sister.x + fire.x * sister.scaleX, sister.y + fire.y * sister.scaleY)!;
      flame.setScale(sister.scaleX * fire.scaleX, sister.scaleY * fire.scaleY).setAngle(fire.rotationDegrees);
      const rage = this.clip('fireAtWillRage', 1, sister.x, sister.y + rageOffsetY * sister.scaleY)!;
      rage.setScale(sister.scaleX, sister.scaleY);
      this.fireAtWillSprites = { fire: flame, rage };
    }
    if (this.fireAtWillSprites) {
      this.fireAtWillSprites.fire.setVisible(this.sim?.fireAtWill ?? false);
      this.fireAtWillSprites.rage.setVisible(this.sim?.fireAtWill ?? false)
        .setFrame(String((this.sim?.state.tick ?? 0) % manifest.clips.fireAtWillRage.count + 1));
    }
  }

  update(_time: number, delta: number): void {
    this.audioSettingsView?.sync((this.paused || this.titleAudioOpen) && !this.helpLayer && !this.pauseDialog && !this.collectionDialog, this.muted);
    this.syncTouchBattleControls();
    if (!this.ready || this.graphicsLost) return;
    this.updatePresentation(delta);
    if (this.screen !== 'battle' || !this.sim || this.paused) return;
    const pointer = this.input.mousePointer;
    this.accumulator += Math.min(delta, 250);
    this.fpsSamples.push(delta);
    if (this.fpsSamples.length > 300) this.fpsSamples.shift();
    // Кадр Flash и Timer(50) рассчитываются отдельно внутри симуляции; частота монитора не меняет баланс.
    while (this.accumulator >= 1000 / 30 && this.sim.state.phase === 'battle') {
      // Короткое касание лука между тиками: сначала натягиваем, затем отпускаем.
      const deferBowRelease = this.touchInput && this.firePressed && this.fireReleased && [24, 25].includes(this.sim.weapon?.id ?? 0);
      // PointerEvent сохраняет дробные CSS-координаты; прицел и выстрел используют один источник.
      const aim = this.touchInput ? this.touchAim : this.battleCursor.rawAim() ?? { x: pointer.x / this.cameras.main.zoom, y: pointer.y / this.cameras.main.zoom };
      const held = this.touchInput ? Boolean(this.touchAimPointer && this.firingGesture) : this.firingGesture && pointer.isDown && pointer.leftButtonDown();
      this.sim.tick({ aimX: aim.x, aimY: aim.y, firePressed: this.firePressed, fireReleased: this.fireReleased && !deferBowRelease, fireHeld: held || deferBowRelease, reload: this.reloadRequested, slot: this.slotRequested });
      this.firePressed = this.reloadRequested = false; this.fireReleased = deferBowRelease; this.slotRequested = undefined;
      if (!this.touchAimPointer && !this.fireReleased) this.touchGestureSim = this.touchGestureState = undefined;
      if (!this.sim.state.player.bowDrawing && this.bowSound) { this.bowSound.destroy(); this.bowSound = undefined; }
      this.accumulator -= 1000 / 30;
      this.playerSprite?.stepOriginal();
      if (!this.sim.weapon?.reloadTime && this.playerSprite && this.playerSprite.currentOriginalFrame >= 30 && this.playerSprite.currentOriginalFrame <= 41) this.playerSprite.stopOriginal(weaponPresentation(this.sim.selectedItem?.id ?? 0).idleFrame);
      for (const [slot, actor] of this.companionSprites) {
        actor.stepOriginal();
        const weapon = this.sim.actorWeapon(slot);
        if (!weapon?.reloadTime && actor.currentOriginalFrame >= 30 && actor.currentOriginalFrame <= 41) actor.stopOriginal(weaponPresentation(weapon?.id ?? 0).idleFrame);
      }
      this.animateEffects();
      for (const event of this.sim.events) this.renderEvent(event);
      this.syncEnemyFrameAudio();
      if (this.sim.state.tick % 150 === 0) this.saveGame(false);
    }
    // Последний выстрел может выдать медаль и закончить бой в одном кадре.
    this.updateMedalNotices(0);
    this.paintBattle();
    if (this.sim.state.phase !== 'battle') {
      this.saveGame(false);
      this.showOutcome();
    }
  }

  private enemyClip(enemy: Readonly<EnemyState>): string {
    if (enemy.dropping) return 'droppedRatBody';
    return enemy.kind === 'boss' ? 'charaPic' : enemy.kind === 'dropped-rat' ? 'enemy_rat' : `enemy_${enemy.kind}`;
  }

  private enemyFrame(enemy: Readonly<EnemyState>, key: string): string {
    if (enemy.dropping) return String(enemy.dropFrame ?? 1);
    const texture = this.textures.get(key);
    if (enemy.kind === 'boss') return String(enemy.appearance * 10 + (enemy.bossAction === 2 ? 5 + Math.floor(enemy.frame / 4) % 2 : 1));
    return texture?.has(String(enemy.frame)) ? String(enemy.frame) : '1';
  }

  private syncBossActor(enemy: Readonly<EnemyState>): OriginalAlly {
    let actor = this.enemySprites.get(enemy.uid);
    if (!(actor instanceof OriginalAlly)) {
      actor = new OriginalAlly(this, this.cache.json.get('ally-animation') as OriginalAllyMetadata, manifest.clips, enemy.appearance, enemy.x, enemy.y);
      this.root.add(actor);
      this.enemySprites.set(enemy.uid, actor);
    }
    actor.setPosition(enemy.x, enemy.y).setScale(enemy.bossFacing ?? -1, 1);
    if (enemy.hp > 0 && enemy.x > 20 && !this.bossReticleSeen.has(enemy.uid)) {
      this.bossReticleSeen.add(enemy.uid);
      const asset = manifest.clips.bossReticle;
      const marker = localizedImage(this, 13, -20, 'bossReticle', '1').setOrigin(asset.originX / asset.frameWidth, asset.originY / asset.frameHeight);
      actor.add(marker); this.bossReticles.set(enemy.uid, { image: marker, frame: 1 });
    }
    if (this.bossFrames.get(enemy.uid) !== enemy.frame) {
      // Симуляция уже исполняет кадры и остановку щита; отдельные часы здесь удвоили бы шаг.
      actor.stopOriginal(enemy.frame);
      this.bossFrames.set(enemy.uid, enemy.frame);
    }
    return actor;
  }

  private syncCompanionActors(): void {
    if (!this.sim) return;
    const active = this.sim.state.party.slots.filter(slot => slot.slot < 5 && slot.exists && slot.member);
    const present = new Set<number>(active.map(slot => slot.slot));
    for (const [slot, actor] of this.companionSprites) if (!present.has(slot)) {
      actor.destroy(); this.companionSprites.delete(slot);
      this.companionCursors.get(slot)?.destroy(); this.companionCursors.delete(slot);
      this.companionBowSounds.get(slot)?.destroy(); this.companionBowSounds.delete(slot);
    }
    for (const slot of active) {
      const member = slot.member!, position = partyActorPosition(slot.slot);
      let actor = this.companionSprites.get(slot.slot), cursor = this.companionCursors.get(slot.slot);
      if (!actor) {
        const asset = manifest.clips.partyAimCursor;
        cursor = localizedImage(this, 480 + slot.slot * 2, position.y, 'partyAimCursor', '1').setOrigin(asset.originX / asset.frameWidth, asset.originY / asset.frameHeight);
        this.root.add(cursor); this.companionCursors.set(slot.slot, cursor);
        actor = new OriginalAlly(this, this.cache.json.get('ally-animation') as OriginalAllyMetadata, manifest.clips, member.appearance, position.x, position.y);
        actor.stopOriginal(weaponPresentation(slot.weapon?.id ?? 0).idleFrame);
        if (member.bowDrawing) actor.playOriginal(86);
        else if (slot.weapon?.reloadTime && !slot.weapon.autoReload) actor.playOriginal('reload');
        this.root.add(actor); this.companionSprites.set(slot.slot, actor);
      }
      actor.setPosition(position.x, position.y);
      actor.setRampageFrame(member.rampageTicks > 0 ? this.sim.state.tick % 12 + 1 : 0);
      if (cursor && member.aiState) cursor.setPosition(member.aiState.cursorX, member.aiState.cursorY).setVisible(this.screen === 'battle');
      else cursor?.setVisible(false);
      if (!member.bowDrawing) { this.companionBowSounds.get(slot.slot)?.destroy(); this.companionBowSounds.delete(slot.slot); }
      // updateAlly добавляет курсор перед телом каждого союзника, в порядке индексов.
      if (cursor) this.root.bringToTop(cursor);
      this.root.bringToTop(actor);
    }
    container.dataset.companionVisuals = JSON.stringify(active.map(slot => ({ slot: slot.slot, name: slot.member!.name, appearance: slot.member!.appearance,
      frame: this.companionSprites.get(slot.slot)?.currentOriginalFrame, ...partyActorPosition(slot.slot), ammo: slot.weapon?.ammo ?? null,
      reloadTime: slot.weapon?.reloadTime ?? 0, bowDrawing: slot.member!.bowDrawing, cursorX: slot.member!.aiState?.cursorX, cursorY: slot.member!.aiState?.cursorY })));
  }

  private syncChainSounds(): void {
    if (!this.sim) return;
    for (let slot = 0; slot <= 4; slot++) {
      const member = slot ? this.sim.state.party.slots[slot - 1] : null;
      const state = slot ? member?.exists ? member.member?.aiState : undefined : this.sim.heroChainState;
      const mode = this.sim.actorWeapon(slot)?.id === 16 ? state?.chainMode ?? 0 : 0;
      const previous = this.chainSounds.get(slot);
      if (previous?.mode === mode) continue;
      previous?.sound.destroy(); this.chainSounds.delete(slot);
      if (!mode) continue;
      const key = `soundChain${mode === 1 ? 2 : mode === 2 ? 1 : 3}`;
      if (!this.cache.audio.exists(key)) continue;
      const sound = this.audioMixer.add(key, { volume: slot ? 0.2 : 0.65, pan: slot ? 0.8 : 0, loop: mode === 3 });
      this.chainSounds.set(slot, { mode, sound });
      // Позиция клипа следует сохранённым часам; сам звук не управляет симуляцией.
      const seek = mode === 3 ? 0 : (state?.chainTime ?? 0) / 1000;
      if (mode === 3 || seek < sound.duration) sound.play({ seek });
      if (this.paused) sound.pause();
    }
  }

  private paintBattle(): void {
    if (!this.sim) return;
    const state = this.sim.state;
    this.paintBattleBackdrop();
    container.dataset.specialTrails = JSON.stringify(this.effects.filter(effect => effect.trail).map(effect => ({ key: (effect.object as Phaser.GameObjects.Image).texture.key, ticks: effect.ticks, alpha: (effect.object as Phaser.GameObjects.Image).alpha })));
    container.dataset.flashFrames = String(this.options.disableFlash ? 0 : this.flashFrames);
    this.bottomBarSprite?.setFrame(state.player.rampageTicks > 0 ? '2' : '1');
    container.dataset.rampageBar = String(state.player.rampageTicks > 0);
    this.syncChainSounds();
    this.paintCastleSister();
    container.dataset.heroSettings = JSON.stringify(this.sim.heroSettings);
    container.dataset.heroAutomatic = String(this.sim.heroAutomatic);
    if (this.sim.heroSettings.order !== -1 && state.heroAI) {
      const { cursorX, cursorY } = state.heroAI.state, asset = manifest.clips.partyAimCursor;
      this.heroAimCursor ??= this.clip('partyAimCursor', 1, cursorX, cursorY);
      this.heroAimCursor?.setPosition(cursorX - asset.originX, cursorY - asset.originY).setVisible(this.screen === 'battle');
    } else this.heroAimCursor?.setVisible(false);
    const attached = new Map<number, typeof this.effects>();
    for (const effect of this.effects) {
      if (!effect.enemyOffset) continue;
      const uid = effect.enemyOffset.uid, group = attached.get(uid);
      if (group) group.push(effect); else attached.set(uid, [effect]);
    }
    const present = new Set<number>();
    for (const enemy of [...state.enemies].sort((a, b) => a.y - b.y)) {
      const key = this.enemyClip(enemy);
      if (!manifest.clips[key]) continue;
      present.add(enemy.uid);
      let sprite = enemy.kind === 'boss' ? this.syncBossActor(enemy) : this.enemySprites.get(enemy.uid);
      if (sprite instanceof Phaser.GameObjects.Image && sprite.texture.key !== key) { sprite.destroy(); this.enemySprites.delete(enemy.uid); sprite = undefined; }
      if (!sprite) {
        sprite = this.clip(key, enemy.frame, enemy.x, enemy.y);
        if (sprite) this.enemySprites.set(enemy.uid, sprite);
      }
      if (!sprite) continue;
      const asset = manifest.clips[key];
      if (!(sprite instanceof OriginalAlly)) {
        sprite.setFrame(this.enemyFrame(enemy, key));
        const scale = enemy.large ? 1.25 : 1;
        sprite.setScale(scale);
        if (enemy.dropping) sprite.setOrigin(asset.originX / asset.frameWidth, asset.originY / asset.frameHeight).setPosition(enemy.x + RAT_DROP_BODY_X, enemy.y + enemy.dropY!).setAngle(enemy.dropRotation!);
        else if (enemy.bomb) sprite.setOrigin(asset.originX / asset.frameWidth, asset.originY / asset.frameHeight).setPosition(enemy.x, enemy.y).setAngle(enemy.bomb.rotation);
        else sprite.setPosition(enemy.x - asset.originX * scale, enemy.y - asset.originY * scale);
      }
      sprite.setAlpha(enemy.hp <= 0 && enemy.deathTicks > 99 ? Math.pow(0.96, enemy.deathTicks - 99) : 1);
      if (enemy.dropping) {
        const shadowAsset = manifest.clips.partyShadow;
        let shadow = this.ratShadows.get(enemy.uid);
        if (!shadow) { shadow = this.clip('partyShadow', 1, 0, 0)!; this.ratShadows.set(enemy.uid, shadow); }
        shadow.setOrigin(shadowAsset.originX / shadowAsset.frameWidth, shadowAsset.originY / shadowAsset.frameHeight)
          .setPosition(enemy.x + RAT_DROP_SHADOW.x, enemy.y + RAT_DROP_SHADOW.y)
          .setScale(RAT_DROP_SHADOW.scaleX, RAT_DROP_SHADOW.scaleY).setAlpha(sprite.alpha);
        this.root.bringToTop(shadow);
      } else { this.ratShadows.get(enemy.uid)?.destroy(); this.ratShadows.delete(enemy.uid); }
      this.root.bringToTop(sprite);
      if (enemy.rageEffectFrame) {
        const rageAsset = manifest.clips.enemyRage;
        let rage = this.enemyRageSprites.get(enemy.uid);
        if (!rage) { rage = this.clip('enemyRage', enemy.rageEffectFrame, enemy.x, enemy.y + 20)!; this.enemyRageSprites.set(enemy.uid, rage); }
        const scale = enemy.large ? 1.25 : 1;
        rage.setFrame(String(enemy.rageEffectFrame)).setScale(scale).setPosition(enemy.x - rageAsset.originX * scale, enemy.y + (20 - rageAsset.originY) * scale).setAlpha(sprite.alpha);
        this.root.bringToTop(rage);
      } else { this.enemyRageSprites.get(enemy.uid)?.destroy(); this.enemyRageSprites.delete(enemy.uid); }
      if (enemy.kind === 'barbarian' || enemy.kind === 'lava') {
        const hits = enemy.hitEffects!;
        const sprites = this.enemyHitSprites.get(enemy.uid) ?? [];
        while (sprites.length > hits.length) sprites.pop()!.destroy();
        for (const [index, hit] of hits.entries()) {
          const key = hit.frame >= 70 ? 'criticalHit' : 'bloodHit';
          const frame = hit.frame - (hit.frame >= 70 ? 70 : 50) + 1, asset = manifest.clips[key];
          const effect = sprites[index] ?? this.clip(key, frame, enemy.x + hit.x, enemy.y + hit.y)!;
          sprites[index] = effect;
          effect.setTexture(key, String(frame)).setPosition(enemy.x + hit.x - asset.originX, enemy.y + hit.y - asset.originY)
            .setAlpha((asset.frameAlpha?.[frame - 1] ?? 1) * sprite.alpha);
          this.root.bringToTop(effect);
        }
        this.enemyHitSprites.set(enemy.uid, sprites);
      }
      // Эффект попадания — ребёнок исходного enemy, но не отражённого mc.
      for (const effect of attached.get(enemy.uid) ?? []) {
        const image = effect.object as Phaser.GameObjects.Image, offset = effect.enemyOffset!;
        image.setPosition(enemy.x + offset.x, enemy.y + offset.y);
        image.setAlpha(sprite.alpha * (manifest.clips[effect.clip!].frameAlpha?.[effect.frame! - 1] ?? 1));
        this.root.bringToTop(effect.object);
      }
    }
    for (const [uid, sprite] of this.enemySprites) if (!present.has(uid)) { sprite.destroy(); this.enemySprites.delete(uid); }
    for (const [uid, shadow] of this.ratShadows) if (!present.has(uid)) { shadow.destroy(); this.ratShadows.delete(uid); }
    for (const [uid, sprite] of this.enemyRageSprites) if (!present.has(uid)) { sprite.destroy(); this.enemyRageSprites.delete(uid); }
    for (const [uid, sprites] of this.enemyHitSprites) if (!present.has(uid)) { for (const sprite of sprites) sprite.destroy(); this.enemyHitSprites.delete(uid); }
    this.paintBossBars();
    if (this.playerSprite) {
      this.playerSprite.setRampageFrame(state.player.rampageTicks > 0 ? state.tick % 12 + 1 : 0);
      this.root.bringToTop(this.playerSprite);
    }
    this.syncCompanionActors();
    container.dataset.rampageEffects = JSON.stringify([state.player, ...state.party.slots.slice(0, 4).map(slot => slot.exists ? slot.member : null)]
      .flatMap((actor, slot) => actor && actor.rampageTicks > 0 ? [{ slot, ticks: actor.rampageTicks, frame: state.tick % 12 + 1 }] : []));
    this.paintProjectiles();
    this.updateHud();
    for (const text of this.hud.values()) this.root.bringToTop(text);
    const frame = this.options.colorBlind ? '3' : state.waveIndex < 3 ? '2' : '1';
    const size = 0.3 + Math.min(0.6, state.player.accuracyFix);
    const alpha = state.player.shootTimer > 0 && !this.sim.weapon?.automatic ? 0.7 : 1;
    const crosshair = manifest.clips.originalCrosshair;
    if (this.screen === 'battle' && !this.paused && !this.touchInput) this.battleCursor.update(frame, size, alpha, crosshair.originX, crosshair.originY, WORLD.width);
    else this.battleCursor.hide();
    if (this.touchAimPointer && this.touchInput && !this.paused) {
      const aim = this.sim.manualAim(this.touchAim.x, this.touchAim.y);
      // Тот же кадр, регистрационная точка и отдача, что у мышиного originalCrosshair.
      this.touchAimSprite ??= localizedImage(this, 0, 0, 'originalCrosshair', frame);
      if (!this.touchAimSprite.parentContainer) this.root.add(this.touchAimSprite);
      this.touchAimSprite.setFrame(frame).setOrigin(crosshair.originX / crosshair.frameWidth, crosshair.originY / crosshair.frameHeight)
        .setPosition(aim.x, aim.y).setScale(size).setAlpha(alpha).setVisible(true);
      this.root.bringToTop(this.touchAimSprite);
    } else this.touchAimSprite?.setVisible(false);
    container.dataset.crosshairFrame = frame;
    container.dataset.playerFrame = String(this.playerSprite?.currentOriginalFrame ?? '');
    container.dataset.reloadTicks = String(this.sim.weapon?.reloadTime ?? 0);
    container.dataset.reloadAnimations = String(this.reloadAnimations);
    container.dataset.frameMs = (this.fpsSamples.reduce((a, b) => a + b, 0) / Math.max(1, this.fpsSamples.length)).toFixed(2);
    container.dataset.slowFrames = String(this.fpsSamples.filter(ms => ms > 50).length);
    container.dataset.maxFrameMs = Math.max(0, ...this.fpsSamples).toFixed(2);
    container.dataset.barbarians = JSON.stringify(state.enemies.filter(enemy => enemy.kind === 'barbarian').map(({ uid, x, y, hp, frame, rampage, rageEffectFrame }) => ({ uid, x, y, hp, frame, rampage, rageEffectFrame })));
    container.dataset.lava = JSON.stringify(state.enemies.filter(enemy => enemy.kind === 'lava').map(({ uid, x, y, hp, frame, attacking, alerted, shadowHit }) => ({ uid, x, y, hp, frame, attacking, alerted, shadowHit })));
    this.paintEnemyArrows();
    this.paintFireAtWill();
  }

  private paintEnemyArrows(): void {
    const arrows = this.sim?.state.enemyArrows ?? [];
    const present = new Set<number>();
    for (const arrow of arrows) {
      if (arrow.removed) continue;
      const visual = arrow.kind ? manifest.enemyShotVisuals[arrow.kind] : manifest.enemyArrowVisual;
      present.add(arrow.uid);
      let sprite = this.enemyArrowSprites.get(arrow.uid);
      if (!sprite) {
        const asset = manifest.clips[visual.clip];
        const body = localizedImage(this, visual.bodyX, arrow.y, visual.clip, '1')
          .setOrigin(asset.originX / asset.frameWidth, asset.originY / asset.frameHeight);
        let shadow: Phaser.GameObjects.Image | undefined;
        if (visual.shadow) {
          const shadowAsset = manifest.clips[visual.shadow.clip];
          shadow = localizedImage(this, visual.shadow.x, arrow.shadowY, visual.shadow.clip, '1')
            .setOrigin(shadowAsset.originX / shadowAsset.frameWidth, shadowAsset.originY / shadowAsset.frameHeight)
            .setScale(visual.shadow.scaleX, visual.shadow.scaleY);
        }
        // stage.addChild в SWF помещает вражеские снаряды над корнем игры, включая HUD.
        const images = shadow ? visual.shadow!.aboveBody ? [body, shadow] : [shadow, body] : [body];
        const group = this.add.container(arrow.x, 0, images).setDepth(1);
        sprite = { container: group, body, shadow };
        this.enemyArrowSprites.set(arrow.uid, sprite);
      }
      sprite.container.setX(arrow.x);
      sprite.body.setY(arrow.y).setAngle(arrow.rotation);
      sprite.shadow?.setY(arrow.shadowY);
    }
    for (const [uid, sprite] of this.enemyArrowSprites) if (!present.has(uid)) { sprite.container.destroy(true); this.enemyArrowSprites.delete(uid); }
    container.dataset.enemyArrows = JSON.stringify(arrows.filter(arrow => !arrow.removed).map(({ uid, kind, x, y, rotation, shadowY, age }) => ({ uid, kind, x, y, rotation, shadowY, age })));
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
          const image = localizedImage(this, 0, 0, key, '1').setOrigin(asset.originX / asset.frameWidth, asset.originY / asset.frameHeight);
          // Flash hard-light разложен на умножение и прибавление с исходной альфой.
          if (visual.hardLight) image.setBlendMode(index === 0 ? Phaser.BlendModes.MULTIPLY : Phaser.BlendModes.ADD);
          return image;
        });
        const body = this.add.container(0, 0, images);
        const group = this.add.container(0, 0);
        let shadow: Phaser.GameObjects.Image | undefined;
        if (visual.shadow) {
          const asset = manifest.clips[visual.shadow.clip];
          shadow = localizedImage(this, visual.shadow.x, 0, visual.shadow.clip, '1')
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
        const fill = localizedImage(this, 11.95, 1.45, 'bossHealthFill', '1').setOrigin(asset.originX / asset.frameWidth, asset.originY / asset.frameHeight);
        bar = { container: this.add.container(enemy.x - 11, enemy.y + 22, [fill]), fill };
        this.root.add(bar.container); this.bossBars.set(enemy.uid, bar);
      }
      bar.container.setPosition(enemy.x - 11, enemy.y + 22);
      bar.fill.setScale(Phaser.Math.Clamp(enemy.hp / enemy.maxHp, 0, 1), 1);
      this.root.bringToTop(bar.container);
    }
    container.dataset.bossBars = String(this.bossBars.size);
    container.dataset.bossHealth = JSON.stringify(bosses.map(enemy => ({ uid: enemy.uid, fraction: enemy.hp / enemy.maxHp, x: enemy.x - 11, y: enemy.y + 22 })));
    container.dataset.bossVisuals = JSON.stringify(bosses.map(enemy => ({ uid: enemy.uid, action: enemy.bossAction, frame: enemy.frame, facing: enemy.bossFacing ?? -1 })));
    container.dataset.bossReticles = JSON.stringify([...this.bossReticles].map(([uid, marker]) => ({ uid, frame: marker.frame })));
  }

  private hitTest(enemy: Readonly<EnemyState>, x: number, y: number): boolean {
    if (enemy.dropping) {
      const point = ratDropLocalPoint(enemy, x, y), asset = manifest.clips.droppedRatBody;
      return this.texturePixelHit('droppedRatBody', String(enemy.dropFrame ?? 1), point.x + asset.originX, point.y + asset.originY);
    }
    if (enemy.kind === 'boss') {
      // Снаряды проверяют цель после её шага AI; поза и поворот должны быть уже текущими.
      const actor = this.syncBossActor(enemy);
      return actor.hitTestWorld(x, y, (key, frame, localX, localY) => this.texturePixelHit(key, frame, localX, localY));
    }
    const geometry = this.cache.json.get('collision-geometry') as CollisionGeometry;
    if (enemy.large) { x = enemy.x + (x - enemy.x) / 1.25; y = enemy.y + (y - enemy.y) / 1.25; }
    if (!geometry.enemies[enemy.kind]) {
      const key = this.enemyClip(enemy), asset = manifest.clips[key];
      const dx = x - enemy.x, dy = y - enemy.y, angle = -(enemy.bomb?.rotation ?? 0) * Math.PI / 180;
      return this.texturePixelHit(key, this.enemyFrame(enemy, key), dx * Math.cos(angle) - dy * Math.sin(angle) + asset.originX,
        dx * Math.sin(angle) + dy * Math.cos(angle) + asset.originY);
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
      mask = { x: frame.x, y: frame.y, width: canvas.width, height: canvas.height, data: context.getImageData(0, 0, canvas.width, canvas.height).data };
      this.maskCache.set(cacheKey, mask);
    }
    return alphaMaskHit(mask, x - mask.x, y - mask.y);
  }

  private renderEvent(event: SimulationEvent): void {
    if (event.type === 'sister-launch') this.playSound('soundLaunch', 0.9, 0.72);
    if (event.type === 'explosion') this.screenShake.start(10, 5, 0.9);
    if (event.type === 'ragnarok') this.screenShake.start(150, 1.5, 1);
    if (event.type === 'rampage' && !event.actorSlot) this.screenShake.start(40, 1.5, 1);
    if (event.type === 'shot' && event.oneShot) { this.screenShake.start(5, 1.5, 1); this.flashFrames += 15; }
    if (event.type === 'enemy-attack') {
      const key = { cata: 'soundBow1', tank: 'soundTank2', dino: 'soundLightning', dragon: 'soundFireball' }[event.enemyKind as 'cata' | 'tank' | 'dino' | 'dragon'];
      const pan = Phaser.Math.Clamp(Math.trunc(Math.trunc(event.x ?? 0) / 25), 0, 19) * 0.08 - 0.8;
      if (key) this.playSound(key, 0.9, pan);
      if (event.enemyKind === 'tank') {
        const asset = manifest.clips.explosion;
        const muzzle = localizedImage(this, (event.x ?? 0) + 45, (event.y ?? 0) - 23, 'explosion', '1')
          .setOrigin(asset.originX / asset.frameWidth, asset.originY / asset.frameHeight).setScale(0.4).setAlpha(0.75).setDepth(1);
        this.effects.push({ object: muzzle, ticks: 22, clip: 'explosion', frame: 1 });
      }
      return;
    }
    if (event.type === 'boss-shot' || event.type === 'boss-special') {
      // getWeaponInfo использует gun6/gun2, а soundPos делит поле на 20 звуковых позиций.
      const pan = Phaser.Math.Clamp(Math.trunc(Math.trunc(event.x ?? 0) / 25), 0, 19) * 0.08 - 0.8;
      this.playSound(event.type === 'boss-special' ? (event.weaponId === 36 ? 'soundGun13' : 'soundGun11') : event.weaponId === 1 ? 'soundGun6' : 'soundGun2', 0.9, pan);
      return;
    }
    const actorSlot = event.actorSlot ?? 0;
    const actor = actorSlot === 0 ? this.playerSprite : this.companionSprites.get(actorSlot);
    const actorWeapon = this.sim?.actorWeapon(actorSlot);
    // Исходный trans задаёт союзникам разные громкость и панораму, независимо от цели.
    const actorAudio = [{ volume: 0.65, pan: 0 }, { volume: 0.2, pan: 0.8 }, { volume: 0.3, pan: 0.7 }, { volume: 0.1, pan: 0.9 }, { volume: 0.2, pan: 0.85 }][actorSlot] ?? { volume: 0.65, pan: 0 };
    const actorSound = ['shot', 'bow-draw', 'reload', 'reloaded', 'level-up', 'rampage'].includes(event.type);
    const sound: Partial<Record<SimulationEvent['type'], string>> = { shot: 'soundGun3', reload: 'soundReloading2', reloaded: 'soundReloaded2', grenade: 'soundThrow1', explosion: 'soundExp1', kill: 'soundDead1', 'castle-hit': 'soundDamage1', wave: 'soundPop1', victory: 'soundBattleEnd', defeat: 'soundKilled', rampage: 'soundRampage', 'level-up': 'soundComplete', gold: 'soundGold1' };
    if (event.weaponId !== undefined) {
      const presentation = weaponPresentation(event.weaponId);
      sound.shot = `sound${presentation.sound[0].toUpperCase()}${presentation.sound.slice(1)}`;
      if (event.weaponId === 16) delete sound.shot;
      const manual = actorWeapon?.manualReload;
      const reloadVariant = event.weaponId === 14 || event.weaponId === 15 ? 3 : 2;
      sound.reload = manual ? `soundReloading${reloadVariant}` : 'soundReloading1';
      sound.reloaded = manual ? `soundReloaded${reloadVariant}` : 'soundReloaded1';
      // Автоперезарядка скрывает анимацию, но звук каждого нового патрона остаётся.
      // cancelReload после последнего автоматического патрона получает уже нулевой таймер.
      if (event.automaticReload && manual) delete sound.reloaded;
    }
    Object.assign(sound, { 'enemy-drop': 'soundDrop', 'sister-killed': 'soundKilled', select: 'soundReloaded1', beep: 'soundBeep', repair: 'soundRepair1', protection: 'soundPray1', defend: 'soundDefend', pulse: 'soundPuls', 'enemy-arrow': 'soundBow1', 'enemy-rage': 'soundRampageEnemy', 'lava-explode': 'soundExp1' });
    if (event.message) status.textContent = event.message;
    if ((event.type === 'info' || event.type === 'beep') && event.message) this.medalNotices.add(event.message, true);
    if (event.type === 'kill') {
      const enemy = this.sim?.state.enemies.find(candidate => candidate.uid === event.enemyUid);
      if (enemy) sound.kill = { sheep: 'soundDead3', rat: 'soundDead7', chicken: 'soundDeadChicken', crow: 'soundDead5', archer: 'soundDead2', fly: 'soundDead6', barbarian: 'soundDead2', lava: 'soundDead1', boss: 'soundDeadBoss1', cata: 'soundDead4', spider: 'soundDead2', ghost: 'soundDead2', ogre: 'soundDead1', knight: 'soundDead2', bird: 'soundDead8', tank: 'soundDead4', dino: 'soundDead9', dragon: 'soundDead9', 'dropped-rat': 'soundDead7', 'sister-bomb': 'soundExp1' }[enemy.kind];
      // Выбор реплики уже сделан симуляцией в исходном порядке случайных вызовов.
      if (event.goodShotIndex !== undefined) this.playSound(`soundGoodshot${event.goodShotIndex}`, 0.65);
    }
    if (sound[event.type]) this.playSound(sound[event.type]!, event.type === 'kill' ? 0.4 : actorSound ? actorAudio.volume : 0.65, actorSound ? actorAudio.pan : 0);
    if (event.type === 'shot') {
      actor?.playOriginal(weaponPresentation(event.weaponId ?? 0).shootFrame);
      for (const pellet of event.pellets ?? []) {
        if (pellet.groundImpact) this.playImpact('groundImpact', pellet.x, pellet.y + 4);
        const key = ['', 'powerShotTrail', 'oneShotTrail', 'lethalShotTrail'][pellet.specialHitType ?? 0];
        if (!key) continue;
        const asset = manifest.clips[key], x = (event.x ?? 0) - 10, y = event.y ?? 0;
        const trail = localizedImage(this, x, y, key, '1').setOrigin(asset.originX / asset.frameWidth, asset.originY / asset.frameHeight)
          .setScale(Math.hypot(pellet.x - x, pellet.y - y) / asset.frameWidth, 1)
          .setRotation(Math.atan2(pellet.y - y, pellet.x - x)).setAlpha(0);
        this.root.add(trail); this.effects.push({ object: trail, ticks: 16, trail: true });
      }
    }
    if (event.type === 'bow-draw') {
      actor?.playOriginal(86);
      if (actorSlot === 0) { this.bowSound?.destroy(); this.bowSound = undefined; }
      else { this.companionBowSounds.get(actorSlot)?.destroy(); this.companionBowSounds.delete(actorSlot); }
      if (this.cache.audio.exists('soundBow2')) {
        const sound = this.audioMixer.add('soundBow2', actorAudio); sound.play();
        if (actorSlot === 0) this.bowSound = sound; else this.companionBowSounds.set(actorSlot, sound);
      }
    }
    if (event.type === 'select' || event.type === 'shot') {
      if (actorSlot === 0) { this.bowSound?.destroy(); this.bowSound = undefined; }
      else { this.companionBowSounds.get(actorSlot)?.destroy(); this.companionBowSounds.delete(actorSlot); }
    }
    if (event.type === 'select' || (event.type === 'reloaded' && (!event.automaticReload || !actorWeapon?.manualReload))) {
      actor?.stopOriginal(weaponPresentation(event.weaponId ?? 0).idleFrame);
    }
    if (event.type === 'reload' && !event.automaticReload) {
      // Каждый следующий патрон заново запускает исходную анимацию перезарядки.
      actor?.playOriginal('reload'); if (actorSlot === 0) this.reloadAnimations++;
    }
    if (event.type === 'hit') {
      const enemy = this.sim?.state.enemies.find(candidate => candidate.uid === event.enemyUid);
      if (enemy && enemy.kind !== 'barbarian' && enemy.kind !== 'lava') {
        const key = event.resisted ? 'shieldHit' : enemy.kind === 'cata' || enemy.kind === 'tank' ? 'machineHit' : 'bloodHit';
        this.playImpact(key, event.x!, event.y!, enemy);
        if (event.critical) this.playImpact('criticalHit', event.x!, event.y!, enemy);
      }
      if (event.critical && actorSlot === 0 && !this.flashFrames) this.flashFrames = 7;
      if (event.resisted) {
        const pan = Phaser.Math.Clamp(Math.trunc(Math.trunc(enemy?.x ?? event.x ?? 0) / 25), 0, 19) * 0.08 - 0.8;
        this.playSound('soundLow', 0.9, pan);
      }
      if (showDamageNumber(this.options, actorSlot, event.criticalType)) {
        const style = damageNumberStyle(this.sim?.state.ruleset.id === 'expanded', actorSlot, Boolean(event.critical));
        const damage = this.text(event.x ?? 0, (event.y ?? 0) + style.offsetY, `${event.amount}${event.critical ? '!' : ''}`, style.fontSize, style.color, 'ElonaHud')
          .setShadow(1, 1, '#000000', style.shadowBlur).setAlpha(style.alpha)
          .setName(actorSlot === 0 ? 'player-damage' : 'companion-damage');
        this.effects.push({ object: damage, ticks: style.ticks, moveY: style.moveY });
      }
    }
    if (event.type === 'explosion') {
      const key = event.explosionKind === 'rocket' ? 'explosionLarge' : 'explosion';
      const asset = manifest.clips[key];
      const explosion = localizedImage(this, event.x ?? 0, event.y ?? 0, key, '1')
        .setOrigin(asset.originX / asset.frameWidth, asset.originY / asset.frameHeight).setScale(event.scale ?? 1).setAlpha(0.85);
      this.root.add(explosion);
      // Кадровые скрипты удаляют исходные эффекты на 23-м и 13-м кадрах.
      this.effects.push({ object: explosion, ticks: key === 'explosion' ? 22 : 12, clip: key, frame: 1 });
    }
    if (event.type === 'protection') {
      const effect = this.clip('layhand', 1, event.x ?? 550, event.y ?? 270);
      if (effect) this.effects.push({ object: effect, ticks: manifest.clips.layhand.count, clip: 'layhand', frame: 1 });
    }
    if (event.type === 'level-up') {
      const position = actorSlot === 0 ? { x: WORLD.playerX, y: WORLD.playerY } : partyActorPosition(actorSlot);
      const asset = manifest.clips.levelUp;
      const effect = localizedImage(this, position.x, position.y, 'levelUp', '1')
        .setOrigin(asset.originX / asset.frameWidth, asset.originY / asset.frameHeight).setDepth(1);
      this.effects.push({ object: effect, ticks: asset.count, clip: 'levelUp', frame: 1 });
    }
    if (event.type === 'rampage' && actorSlot === 0) { this.flashFrames += 15; this.announceCombat('Rampage!!'); }
    if (event.type === 'ragnarok') { this.flashFrames += 15; this.announceCombat(event.message!); }
    if ((event.type === 'wave' || event.type === 'combat-notice') && event.message) this.announceCombat(event.message);
  }

  private announceCombat(text: string): void {
    const notice = this.combatNotices.add(text);
    const layout = (this.cache.json.get('town-layout') as { combatNotices: CombatNoticeLayout }).combatNotices;
    const view = createCombatNoticeView(this, layout, notice);
    updateCombatNoticeView(view, layout, notice);
    this.combatNoticeViews.set(notice, view);
    container.dataset.combatNotices = JSON.stringify(this.combatNotices.active);
  }

  private playImpact(key: string, x: number, y: number, enemy?: EnemyState): void {
    const asset = manifest.clips[key];
    const image = this.clip(key, 1, x, y);
    if (!image) return;
    image.setAlpha(asset.frameAlpha?.[0] ?? 1);
    this.effects.push({ object: image, ticks: asset.count, clip: key, frame: 1,
      ...(enemy ? { enemyOffset: { uid: enemy.uid, x: image.x - enemy.x, y: image.y - enemy.y } } : {}) });
  }

  private animateEffects(): void {
    for (const [uid, marker] of this.bossReticles) {
      if (!marker.image.scene || ++marker.frame >= manifest.clips.bossReticle.count) { marker.image.destroy(); this.bossReticles.delete(uid); }
      else marker.image.setFrame(String(marker.frame));
    }
    this.effects = this.effects.filter(effect => {
      effect.ticks--;
      if (effect.ticks <= 0) { effect.object.destroy(); return false; }
      if (effect.moveY && effect.object instanceof Phaser.GameObjects.Text) effect.object.y += effect.moveY;
      if (effect.trail && effect.object instanceof Phaser.GameObjects.Image) {
        const age = 16 - effect.ticks;
        effect.object.setAlpha(age < 3 ? age * 0.4 : Math.max(0, 0.8 - (age - 2) * 0.06));
      }
      if (effect.clip && effect.object instanceof Phaser.GameObjects.Image) {
        effect.object.setFrame(String(++effect.frame!));
        const alpha = manifest.clips[effect.clip].frameAlpha?.[effect.frame! - 1];
        if (alpha !== undefined) effect.object.setAlpha(alpha);
      }
      if (!effect.enemyOffset) this.root.bringToTop(effect.object);
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
    this.drawBattleBackground(); this.drawHud();
    this.playerSprite = new OriginalAlly(this, this.cache.json.get('ally-animation') as OriginalAllyMetadata, manifest.clips, this.appearance, WORLD.playerX, WORLD.playerY);
    this.root.add(this.playerSprite);
    this.paintBattle();
    if (state.phase === 'victory') {
      const background = new Set(this.root.list);
      this.image('result');
      const report = dayReport(state);
      report.rows.forEach((value, index) => this.text(252, 128 + index * 20 + (index === 7 ? 10 : 0), String(value), 12, value < 0 ? '#b02020' : '#14248d', 'Arial'));
      this.root.add(originalTextArea(this, 'result-news', report.news, 326, 132, 200, 155));
      this.originalButton('button_proceed', 160, 301, () => {
        if (this.sim!.enterTown()) { this.saveGame(false); this.showTown(); }
      });
      const menu = this.root.list.filter(object => !background.has(object));
      this.root.add(this.add.container(MENU_X, 0, menu));
      status.textContent = `Day ${state.day} complete and saved. Proceed to town.`;
      this.startCelebration();
    } else {
      this.image('gameOver', 300, 205);
      this.zone(120, 175, 400, 70, () => this.showTitle());
      const available = this.sim.canCarryOver(this.carryCheckpoint);
      container.dataset.carryOverAvailable = String(available);
      if (available) {
        this.image(state.carryOver ? 'carryOverAgainNote' : 'carryOverNote');
        this.originalButton(state.carryOver ? 'button_carryOverAgain' : 'button_carryOver',
          state.carryOver ? 301.5 : 310.5, 257, () => {
            if (state.carryOver) this.useCarryOver(); else this.showCarryConfirmation();
          });
      }
      status.textContent = available ? 'Carry Over restores the last town, adds earned battle money (at least 200 GP) and 1 AP. Most new medals become unavailable.'
        : 'The castle fell. Start a new game to try again.';
    }
    this.hud.get('gold')?.setText(String(state.gold)); this.hud.get('hp')?.setText(`${state.castleHp}/${state.castleMaxHp}`);
    container.dataset.phase = state.phase;
  }

  private showCarryConfirmation(): void {
    this.showOutcome();
    container.dataset.carryOverConfirmation = 'true';
    const layout = (this.cache.json.get('town-layout') as { saleDialog: ModConfirmationLayout }).saleDialog;
    this.root.add(createModConfirmation(this, manifest, layout, confirmed => {
      this.playSound('soundClick1');
      if (confirmed) this.useCarryOver(); else this.showOutcome();
    }, 'carry-over', 'Do you really want to use Carry Over option?'));
  }

  private useCarryOver(): void {
    if (!this.sim?.carryOver(this.carryCheckpoint)) return;
    this.carryCheckpoint = this.sim.toSave();
    this.showTown(); this.saveGame(false);
    status.textContent = 'Carry Over Mode: town restored, battle earnings (at least 200 GP) and 1 AP added. Most new medals are unavailable.';
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
    const meter = this.sim!.heroClassState;
    if (meter && this.adrenalineFill) {
      const level = state.player.traits[HERO_CLASSES[state.player.classId].id];
      const ratio = state.player.classId === 'ranger' ? meter.frenzy / 1000
        : state.player.classId === 'duelist' ? meter.frenzy / duelistDamageLimit(level)
        : ALL_TRAITS[2].calculate(level) * meter.idleCount / (sniperDamageLimit(level) - 100);
      this.adrenalineFill.setScale(Math.max(0, Math.min(1, ratio)), 1.000473);
    }
    container.dataset.gameMode = state.mode ?? 'normal';
    container.dataset.gameMods = JSON.stringify(state.mods ?? {});
    container.dataset.heroClass = state.player.classId;
    container.dataset.classState = JSON.stringify(meter ?? null);
    container.dataset.chainGun = JSON.stringify(this.sim.heroChainState ?? null);
    container.dataset.fireAtWill = String(this.sim!.fireAtWill);
    container.dataset.gold = String(state.gold); container.dataset.hp = String(state.castleHp);
    container.dataset.ammo = String(selected?.ammo ?? 0); container.dataset.grenades = String(state.inventory.filter(item => isOccupiedItem(item) && item.id === 11).reduce((total, item) => total + item!.ammo, 0));
    container.dataset.selectedSlot = String(state.player.selectedSlot);
    container.dataset.inventory = JSON.stringify(state.inventory.map(item => isOccupiedItem(item) ? item.id : null));
    container.dataset.inventorySlots = String(state.inventory.length);
    container.dataset.itemCooldowns = JSON.stringify(state.itemCooldowns);
    container.dataset.phase = state.phase; container.dataset.tick = String(state.tick); container.dataset.day = String(state.day);
    container.dataset.enemies = String(state.enemies.filter(enemy => enemy.hp > 0).length);
    container.dataset.kills = String(state.kills); container.dataset.appearance = String(this.appearance);
  }

  private showLoot(): void {
    if (!this.sim || !['loot', 'boss-loot'].includes(this.sim.state.postbattle)) return;
    const bossReward = this.sim.state.postbattle === 'boss-loot';
    this.reset(bossReward ? 'boss-loot' : 'loot');
    this.drawBattleBackground(); this.drawHud();
    this.updateHud();
    this.root.add(createLootView(this, this.sim.state, manifest, {
      itemPopup: inspectItemPopup,
      move: (fromArea, from, toArea, to) => {
        const moved = this.sim!.moveLootItem(fromArea, from, toArea, to);
        if (moved) { this.playSound(this.sim!.state.pendingLootAction ? 'soundScroll1' : 'soundClick1'); this.saveGame(false); this.showLoot(); }
        return moved;
      },
      proceed: () => {
        if (this.sim!.finishLoot()) { this.playSound('soundClick1'); this.saveGame(false); this.showOutcome(); }
      },
      resolveModMount: confirm => {
        const outcome = this.sim!.resolveLootModMount(confirm);
        this.playSound('soundClick1'); this.saveGame(false); this.showLoot();
        if (outcome === 'mounted') { this.playSound('soundMod'); return; }
        const errors: Record<string, string> = {
          'no-mod-slot': "There's no available mod slot on this weapon!",
          'incompatible-ammo-mod': "This weapon can't use ammo/reloading mods.",
          'incompatible-auto-reload': "This weapon can't use Auto Reload mod.",
          'already-living': 'This weapon is already alive.', unavailable: 'These items are no longer available.',
        };
        if (errors[outcome]) { this.playSound('soundBeep'); status.textContent = errors[outcome]; }
      },
      message: value => { status.textContent = value; },
    }, (this.cache.json.get('town-layout') as ShopLayout).saleDialog, (this.cache.json.get('town-layout') as ShopLayout).itemPopup, bossReward ? 'boss' : 'ordinary'));
    container.dataset.phase = 'victory';
    container.dataset.lootOffers = JSON.stringify(this.sim.state.lootOffers.map(item => isOccupiedItem(item) ? item.id : null));
    container.dataset.inventory = JSON.stringify(this.sim.state.inventory.map(item => isOccupiedItem(item) ? item.id : null));
    container.dataset.pendingLootAction = JSON.stringify(this.sim.state.pendingLootAction);
    status.textContent = this.sim.state.pendingLootAction
      ? 'Confirm mounting the MOD. No or a click outside the dialog swaps the two items.'
      : 'Click an item, then click a destination slot. Place a MOD onto a gun to mount it. Items left in the loot row will be wasted when you proceed.';
  }

  private showSkillChoice(): void {
    if (!this.sim || this.sim.state.postbattle !== 'skill') return;
    this.reset('skill');
    this.drawBattleBackground(); this.drawHud(); this.updateHud();
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
    status.hide();
  }

  private showTown(tab: TownTab = 'mission', dialog: TownDialog = null, saleSlot: number | null = null, upgradeSelecting = false): void {
    if (!this.sim || this.sim.state.phase !== 'town' || !this.sim.state.town) return;
    const pending = this.sim.state.pendingTownAction;
    const pendingParty = this.sim.state.pendingPartyAction;
    // Восстановление открывает то же подтверждение, не вызывая генерацию повторно.
    if (pending) { tab = 'shop'; dialog = null; saleSlot = null; upgradeSelecting = false; }
    if (pendingParty) {
      tab = pendingParty.kind === 'henchman' ? 'mission' : pendingParty.kind === 'party-mod' ? 'equipment' : 'characters'; dialog = null; saleSlot = null; upgradeSelecting = false;
      if (pendingParty.kind === 'hire') this.selectedCharacter = 5;
      else if (pendingParty.kind === 'dismiss') this.selectedCharacter = pendingParty.slot;
    }
    if (this.screen !== 'town' && this.sim.state.day === 1) this.medalNotices.add('Make sure to repair your walls!', false);
    this.reset('town');
    this.townNavigation ??= this.add.container(0, 0);
    this.root.add(createTownView(this, this.sim.state, manifest, this.cache.json.get('town-layout') as TownLayout, {
      medalPage: page => { this.medalPage = page; this.playSound('soundClick1'); this.showTown('medals'); },
      medalHint: hint => { if (hint) container.dataset.medalHint = JSON.stringify(hint); else delete container.dataset.medalHint; },
      visitKongregate: () => {
        this.sim!.visitKongregate(); this.saveGame(false); this.showTown('medals');
        window.open('http://www.kongregate.com/?gamereferral=elonashooter', '_blank', 'noopener,noreferrer');
      },
      robVisitors: () => {
        const result = this.sim!.robMuseumVisitors();
        if (result.outcome === 'done') { this.playSound(result.notice.sound!); this.saveGame(false); this.showTown('medals', result.notice); }
        else this.playSound('soundBeep');
        status.textContent = result.message;
      },
      hire: () => {
        if (this.sim!.requestMissionHire() === 'previewed') { this.playSound('soundScroll1'); this.saveGame(false); this.showTown('mission'); }
        else { this.playSound('soundBeep'); status.textContent = 'A henchman is already contracted for this mission.'; }
      },
      henchmanSmart: enabled => {
        if (this.sim!.setHenchmanSmart(enabled)) { this.playSound('soundClick1'); this.saveGame(false); this.showTown('mission'); }
      },
      confirmHire: answer => {
        const outcome = this.sim!.resolvePartyAction(answer);
        this.playSound(outcome === 'contracted' ? 'soundGood' : 'soundClick1'); this.saveGame(false); this.showTown('mission', outcome === 'contracted' ? TOWN_NOTICES.hiredGun : null);
        status.textContent = outcome === 'contracted' ? "Hired Gun: You've hired a henchman for this mission. He will join when you rest." : 'Henchman contract cancelled.';
      },
      select: next => { if (next === 'medals' && this.sim!.visitMuseum(this.profile.bestHardcoreDay ?? 0)) this.saveGame(false); this.playSound('soundScroll1'); this.showTown(next); },
      actionHover: () => this.playSound('soundCard1'),
      message: value => { status.textContent = value; },
      castlePage: page => { this.castlePage = page; this.showTown('castle'); },
      activityAvailable: action => this.sim!.townActivityAvailable(action),
      activity: action => {
        const result = this.sim!.performTownActivity(action);
        if (result.outcome === 'done') { this.playSound(result.notice.sound!); this.saveGame(false); this.showTown('mission', result.notice); }
        else this.playSound('soundBeep');
        status.textContent = result.message;
      },
      castleUpgrade: kind => {
        const outcome = this.sim!.buyCastleUpgrade(kind);
        const upgradeName = { house: 'House', wall: 'Wall', 'fix-wall': 'Fix Wall', repairman: 'Repairman', sandbag: 'Sandbag', storage: 'Storage', looter: 'Looter', trainer: 'Trainer', smith: 'Smith', museum: 'Museum', chicken: 'Chicken', sister: 'Sister', villa: 'Villa', 'special-trainer': 'Sp.Trainer' }[kind];
        if (outcome === 'purchased') {
          this.playSound('soundPay1'); this.saveGame(false); this.showTown('castle');
          status.textContent = kind === 'fix-wall' ? 'The castle walls are repaired.'
            : `${upgradeName} upgraded.`;
        } else {
          this.playSound('soundBeep');
          // Исходный Castle только пищит; пояснение использует обычную строку статуса порта.
          status.textContent = outcome === 'not-enough-gold' ? 'Not enough gold.'
            : outcome === 'capped' ? (kind === 'fix-wall' ? 'The castle is not damaged!' : `The ${upgradeName} is already at its maximum level.`)
            : 'This Castle upgrade is unavailable.';
        }
      },
      repair: () => {
        const outcome = this.sim!.freeRepair();
        if (outcome === 'repaired') {
          this.playSound('soundRepair1'); this.saveGame(false); this.showTown('castle', 'repair');
        } else {
          this.playSound('soundBeep');
          status.textContent = outcome === 'not-damaged' ? 'The castle is not damaged!' : outcome === 'not-enough-ap' ? "You don't have enough action points!" : 'Free Repair is available in town.';
        }
      },
      claimTitle: () => {
        const outcome = this.sim!.claimTitle();
        if (outcome === 'claimed') {
          this.playSound('soundAward'); this.saveGame(false); this.showTown('mission', 'title');
        } else {
          this.playSound('soundBeep');
          status.textContent = outcome === 'not-enough-ap' ? "You don't have enough action points!" : 'No new title is available.';
        }
      },
      rest: () => { this.playSound('soundNight'); this.showTown('mission', 'rest'); },
    }, tab, this.townNavigation, this.castlePage, this.medalPage));
    refreshMenuHover(this);
    if (tab === 'characters' || tab === 'equipment') this.showPartyPanel(tab);
    if (tab === 'shop' && this.sim.state.town.preparation === 'ready') {
      const changed = (sound = 'soundPay1') => { this.playSound(sound); this.saveGame(false); this.showTown('shop'); };
      this.root.add(createShopView(this, { inventory: this.sim.state.inventory, shop: this.sim.state.town.shop, gold: this.sim.state.gold, traits: this.sim.state.player.traits,
        ap: this.sim.state.town.ap, pendingTownAction: pending, upgradeReference: this.sim.state.upgradeReference }, manifest, this.cache.json.get('town-layout') as ShopLayout, {
        itemPopup: inspectItemPopup,
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
        refreshStock: () => {
          const outcome = this.sim!.refreshTownStock();
          if (outcome === 'refreshed') { this.playSound('soundGood'); this.playSound('soundScroll1'); this.saveGame(false); this.showTown('shop', TOWN_NOTICES.newGoods); }
          else status.textContent = outcome === 'not-enough-ap' ? "You don't have enough action points!" : 'Stock refresh is unavailable.';
        },
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
    let eventView: Phaser.GameObjects.Container | undefined;
    if (dialog) {
      this.closeTownEvent = () => {
        this.playSound('soundClick1');
        if (dialog === 'rest') {
          const checkpoint = this.sim!.toSave();
          if (this.sim!.startNextDay()) {
            this.carryCheckpoint = this.sim!.state.mode === 'hardcore' ? undefined : checkpoint;
            // procEventDialog воспроизводит второй щелчок внутри ветки сна.
            this.playSound('soundClick1'); this.enterBattle(true); this.saveGame(false); this.playSound('soundBattleBegin');
            status.textContent = `Day ${this.sim!.state.day} begins.`;
          } else { this.showTown('mission'); status.textContent = 'The next day is not available yet.'; }
        } else this.showTown(typeof dialog === 'object' ? tab : dialog === 'title' ? 'mission' : 'castle');
      };
      const notice: TownNotice = typeof dialog === 'object' ? dialog : dialog === 'rest'
        ? TOWN_NOTICES.rest
        : dialog === 'title' ? townEvent(3, 'New Title!', `Your remarkable achievements have been acknowledged and you are granted a new title, ${TITLES[this.sim.state.title].name}! You will receive ${TITLES[this.sim.state.title].salary} gold pieces every day as a salary.`).notice
        : TOWN_NOTICES.repair;
      eventView = createTownEventView(this, manifest, (this.cache.json.get('town-layout') as TownLayout).repairDialog, notice, this.closeTownEvent);
      this.root.add(eventView);
      container.dataset.townNotice = JSON.stringify(notice);
    }
    this.updateHud(); this.drawGameControls();
    if (eventView) { this.root.bringToTop(eventView); if (this.volumeIcon) this.root.bringToTop(this.volumeIcon); }
    container.dataset.actionPoints = String(this.sim.state.town.ap);
    container.dataset.castleUpgrades = JSON.stringify({ house: this.sim.state.party.capacity, wall: this.sim.state.wallLevel,
      maxHp: this.sim.state.castleMaxHp, upkeep: castleUpkeep(this.sim.state),
      houseCost: castleUpgradeCost('house', this.sim.state), wallCost: castleUpgradeCost('wall', this.sim.state),
      wallFixCount: this.sim.state.wallFixCount, repairman: this.sim.state.repairmanLevel, repairPerWave: castleRepairAmount(this.sim.state),
      fixWallCost: castleUpgradeCost('fix-wall', this.sim.state), repairmanCost: castleUpgradeCost('repairman', this.sim.state),
      sandbag: this.sim.state.sandbagLevel, sandbagCost: castleUpgradeCost('sandbag', this.sim.state),
      damageMultiplier: castleDamageMultiplier(this.sim.state), sandbagAbsorptionPercent: Math.trunc(100 - castleDamageMultiplier(this.sim.state) * 100),
      storage: castleStorageLevel(this.sim.state), inventorySlots: this.sim.state.inventory.length, storageCost: castleUpgradeCost('storage', this.sim.state),
      looter: this.sim.state.looterLevel, looterCost: castleUpgradeCost('looter', this.sim.state),
      lootMultiplier: castleLootMultiplier(this.sim.state), lootValueIncreasePercent: Math.trunc(castleLootMultiplier(this.sim.state) * 100 - 100),
      trainer: this.sim.state.trainerLevel, trainerCost: castleUpgradeCost('trainer', this.sim.state),
      trainerMultiplier: castleTrainerMultiplier(this.sim.state), trainerExperienceIncreasePercent: Math.trunc(castleTrainerMultiplier(this.sim.state) * 100 - 100) });
    container.dataset.title = String(this.sim.state.title);
    container.dataset.titleName = TITLES[this.sim.state.title].name;
    container.dataset.titleSalary = String(TITLES[this.sim.state.title].salary);
    container.dataset.claimTitleAvailable = String(nextTitle(this.sim.state.title, this.sim.state.day) !== undefined);
    container.dataset.townTab = tab ?? 'none';
    container.dataset.medalPage = String(this.medalPage);
    container.dataset.earnedMedals = JSON.stringify(this.sim.state.earnedMedals);
    container.dataset.repairDialog = String(dialog === 'repair');
    container.dataset.townDialog = typeof dialog === 'object' && dialog ? 'event' : dialog ?? 'none';
    container.dataset.inventory = JSON.stringify(this.sim.state.inventory.map(item => isOccupiedItem(item) ? item.id : null));
    container.dataset.party = JSON.stringify(this.sim.state.party.slots.map(slot => ({ slot: slot.slot, exists: slot.exists,
      name: slot.member?.name ?? null, appearance: slot.member?.appearance ?? null, weapon: isOccupiedItem(slot.weapon) ? slot.weapon.id : null,
      ai: slot.member?.ai ?? null, focus: slot.member?.focus ?? null, boss: slot.member?.optBoss, wall: slot.member?.optWall })));
    container.dataset.pendingPartyAction = JSON.stringify(pendingParty);
    if (!this.ambient && this.cache.audio.exists('soundBgTown')) {
      this.ambient = this.audioMixer.add('soundBgTown', { volume: 0.3, loop: true }); this.ambient.play();
    }
    status.textContent = pending?.kind === 'upgrade' ? 'Compare the weapon before and after upgrading. Upgrade keeps mounted mods. Yes spends the shown gold and 4 AP.'
      : tab === 'medals' ? 'Museum: select a medal to read its requirements. Rob visitors costs 2 AP; repeated attempts pay less today.'
      : pending?.kind === 'mod' ? 'Yes mounts the MOD. No or clicking elsewhere swaps these two inventory items.'
      : upgradeSelecting ? 'Choose an owned weapon to upgrade. Click elsewhere to cancel. Upgrade keeps mounted mods.'
      : dialog === 'repair' ? 'The castle walls are repaired. Click to continue.'
      : dialog === 'title' ? `${TITLES[this.sim.state.title].name}: daily salary: ${TITLES[this.sim.state.title].salary} GP, beginning with the next completed day. Click to continue.`
      : dialog === 'rest' ? `Click to finish resting and begin Day ${this.sim.state.day + 1}.`
      : pendingParty?.kind === 'henchman' ? 'The henchman demands half the mission reward. Accept?'
      : pendingParty?.kind === 'hire' ? 'Yes pays the displayed cost and recruits this character. Any other click cancels.'
      : pendingParty?.kind === 'dismiss' ? 'Yes dismisses this companion. Any other click keeps them.'
      : pendingParty?.kind === 'party-mod' ? 'Yes mounts the MOD on the companion’s weapon. No or clicking elsewhere keeps both items unchanged.'
      : tab === 'characters' ? 'Select a portrait to inspect skills, wages and orders. Select the available candidate, then Recruit, to hire a companion.'
      : tab === 'equipment' ? 'Click an item, then a destination slot. Companions need the weapon’s required skill. Dropping outside cancels the move.'
      : tab === 'shop' ? (saleSlot === null ? 'Click stock, then an empty owned slot to buy. Drop an owned item outside its slots to sell; confirmation is required.' : 'Confirm the sale with Yes, or click elsewhere to keep the item.')
      : `Castle has two upgrade pages. Mission activities prepare bonuses for the next battle; shop and recruit refresh each cost 2 AP. ${this.sim.state.day < MAX_CAMPAIGN_DAY ? `Mission → Rest begins Day ${this.sim.state.day + 1}.` : 'The browser save safety limit has been reached.'}`;
    if (this.sim.state.carryOver) status.textContent = `Carry Over Mode: most new medals are unavailable. ${status.textContent}`;
    status.hide();
  }

  private showPartyPanel(tab: 'characters' | 'equipment'): void {
    if (!this.sim) return;
    const state = this.sim.state;
    container.dataset.heroSettings = JSON.stringify(this.sim.heroSettings);
    const traits = (levels: Readonly<Record<number, number>>): PartyViewTrait[] => Object.entries(levels).filter(([, level]) => level > 0).map(([key, level]) => {
      const id = Number(key), definition = ALL_TRAITS[id], info = traitHintValues(id, levels);
      return { id, name: info.name, description: info.description,
        kind: id < 100 ? 'class' : id >= 900 ? 'base' : definition?.party ? 'party' : 'normal' };
    });
    const members: PartyViewMember[] = [{ slot: 0, name: 'You', appearance: this.appearance, level: state.player.level, exp: state.player.exp,
      className: HERO_CLASSES[state.player.classId].name, wageLabel: TITLES[state.title].name, kill: null, earn: null, weapon: this.sim.weapon,
      traits: traits(state.player.traits), traitLevels: state.player.traits, focusedTrait: this.sim.heroSettings.focus, order: this.sim.heroSettings.order, prioritizeBoss: this.sim.heroSettings.boss, prioritizeWall: this.sim.heroSettings.wall }];
    for (const slot of state.party.slots) {
      if (!slot.exists || !slot.member) continue;
      const member = slot.member;
      const wage = this.sim.wageFor(member);
      members.push({ slot: slot.slot, name: member.name, appearance: member.appearance, level: member.level, exp: member.exp,
        className: ALL_TRAITS[member.devType].name, wageLabel: wage === 0 ? 'Free' : `${wage} GP`, kill: member.kills, earn: member.earnedGold,
        cost: member.cost, weapon: slot.weapon, traits: traits(member.traits), traitLevels: member.traits, focusedTrait: member.focus,
        order: member.ai, prioritizeBoss: member.optBoss, prioritizeWall: member.optWall });
    }
    if (!members.some(member => member.slot === this.selectedCharacter)) this.selectedCharacter = 0;
    const pending = state.pendingPartyAction;
    const changed = (sound = 'soundClick1') => { this.playSound(sound); this.saveGame(false); this.showTown(tab); };
    const failure = (outcome: string) => {
      const errors: Record<string, string> = { 'party-full': 'You have reached the limit of recruits.', 'house-full': 'You need to upgrade the house!',
        'not-enough-gold': "You don't have enough money!", 'no-candidate': 'No recruit is available.', 'no-mod-slot': "There's no available mod slot on this weapon!",
        'incompatible-ammo-mod': "This weapon can't use ammo/reloading mods.", 'incompatible-auto-reload': "This weapon can't use Auto Reload mod.",
        'already-living': 'This weapon is already alive.', unavailable: 'This action is unavailable for the selected character or equipment.' };
      this.playSound('soundBeep'); status.textContent = errors[outcome] ?? 'This action is unavailable.';
    };
    const address = (value: PartyEquipmentSlot) => ({ area: value.kind === 'inventory' ? 'inventory' as const : 'party' as const, slot: value.slot });
    const move = (from: PartyEquipmentSlot, to: PartyEquipmentSlot): boolean => {
      if (from.kind === 'inventory' && to.kind === 'inventory') {
        if (!this.sim!.moveTownItem(from.slot, to.slot)) { failure('unavailable'); return false; }
        changed(); return true;
      }
      const result = this.sim!.movePartyEquipment(address(from), address(to));
      if (result === 'moved' || result === 'previewed') { changed(result === 'previewed' ? 'soundScroll1' : 'soundClick1'); return true; }
      failure(result); return false;
    };
    this.root.add(createPartyView(this, { selectedSlot: this.selectedCharacter, members, inventory: state.inventory, gold: state.gold, capacity: state.party.capacity,
      ap: state.town!.ap, smartAvailable: this.sim.rules.smartMode, dialog: pending?.kind === 'hire' ? 'recruit' : pending?.kind === 'dismiss' ? 'dismiss' : pending ? 'mod' : null }, manifest, this.cache.json.get('town-layout') as PartyLayout, {
      itemPopup: inspectItemPopup,
      traitHint: inspectTraitHint,
      serviceItem: (service, slot) => {
        const outcome = this.sim!.serviceTownItem(service, slot);
        if (outcome === 'recycled' || outcome === 'restocked') changed('soundMod');
        else failure(outcome);
        return outcome;
      },
      selectCharacter: slot => { this.selectedCharacter = slot; this.playSound('soundClick1'); this.showTown('characters'); },
      refreshCandidate: () => {
        const result = this.sim!.refreshTownRecruit();
        if (result === 'refreshed') { this.selectedCharacter = 5; this.playSound('soundGood'); this.playSound('soundScroll1'); this.saveGame(false); this.showTown('characters', TOWN_NOTICES.newRecruit); }
        else { this.playSound('soundBeep'); status.textContent = result === 'not-enough-ap' ? "You don't have enough action points!" : 'Recruit refresh is unavailable.'; }
      },
      recruit: () => { const result = this.sim!.requestRecruit(); if (result === 'previewed') changed('soundScroll1'); else failure(result); },
      dismiss: () => { if (this.sim!.requestDismiss(this.selectedCharacter)) changed('soundScroll1'); else failure('unavailable'); },
      confirm: answer => {
        const result = this.sim!.resolvePartyAction(answer);
        if (result === 'hired') this.selectedCharacter = state.party.slots.find(slot => slot.exists && slot.slot < 4)?.slot ?? 0;
        if (result === 'dismissed') this.selectedCharacter = Math.max(0, this.selectedCharacter - 1);
        changed(result === 'hired' ? 'soundPay1' : result === 'mounted' ? 'soundMod' : 'soundClick1');
        if (!['hired', 'dismissed', 'mounted', 'cancelled'].includes(result)) failure(result);
      },
      cancel: () => {}, close: () => this.showTown(null),
      focus: id => { if (this.sim!.setCompanionFocus(this.selectedCharacter, id)) changed(); else failure('unavailable'); },
      order: order => { if (this.sim!.setCompanionOrder(this.selectedCharacter, order)) changed(); else failure('unavailable'); },
      prioritizeBoss: boss => { if (this.sim!.setCompanionPriorities(this.selectedCharacter, { boss })) changed(); else failure('unavailable'); },
      prioritizeWall: wall => { if (this.sim!.setCompanionPriorities(this.selectedCharacter, { wall })) changed(); else failure('unavailable'); },
      swapEquipment: move,
      requestModMount: (from, to) => {
        if (from.kind === 'inventory' && to.kind === 'inventory') {
          if (this.sim!.beginModMount(from.slot, to.slot) === 'previewed') changed('soundScroll1'); else failure('unavailable');
        } else move(from, to);
      },
      message: value => { status.textContent = value; },
    }, tab));
    container.dataset.partySelection = String(this.selectedCharacter);
  }

  toggleTouchPause(): void {
    if (!this.pauseDialog && !this.helpLayer && !this.collectionDialog && !this.closeTownEvent) this.togglePause();
  }

  togglePause(): void {
    if (!['battle', 'town', 'result'].includes(this.screen)) return;
    // Пока графический контекст потерян, игрок не должен возобновить невидимый бой.
    if (this.paused && this.graphicsLost) return;
    this.cancelBattleGesture();
    this.paused = !this.paused; this.accumulator = 0;
    this.syncTouchBattleControls();
    if (this.screen === 'battle') this.input.setDefaultCursor(this.paused ? 'default' : BATTLE_CURSOR);
    container.dataset.paused = String(this.paused);
    this.celebration?.root.setVisible(!this.paused);
    if (!this.paused) { status.hide(); this.pauseLayer?.destroy(true); this.pauseLayer = undefined; this.audioSettingsView = undefined; this.saveGame(false); this.ambient?.resume(); this.bowSound?.resume(); for (const sound of this.companionBowSounds.values()) sound.resume(); for (const entry of this.chainSounds.values()) entry.sound.resume(); return; }
    for (const sound of this.companionBowSounds.values()) sound.pause();
    for (const entry of this.chainSounds.values()) entry.sound.pause();
    this.ambient?.pause(); this.bowSound?.pause(); this.saveGame(false);
    this.battleCursor.hide();
    const data = this.cache.json.get('town-layout') as { pause: PauseLayout };
    this.pauseLayer = createPauseView(this, manifest, data.pause, this.options, pauseStatistics(this.sim!.state), {
      close: () => this.togglePause(), save: () => this.saveGame(), help: () => this.showHelp(),
      title: () => {
        if (this.screen === 'town') { this.saveGame(false); this.showTitle(); return; }
        this.pauseDialog = createModConfirmation(this, manifest, (this.cache.json.get('town-layout') as { saleDialog: ModConfirmationLayout }).saleDialog, confirm => {
          this.pauseDialog?.destroy(true); this.pauseDialog = undefined;
          if (confirm) this.showTitle();
        }, 'quit', 'Current game will not be saved. Really quit?');
        this.root.add(this.pauseDialog);
      },
      option: key => {
        this.options[key] = !this.options[key]; this.applyRenderingOptions();
        if (key === 'disableFireworks' && !this.options.disableFireworks) { this.startCelebration(); this.celebration?.root.setVisible(false); }
        this.saveGame(false);
      }, click: () => this.playSound('soundClick1'),
    }, this.sim!.state.ruleset.id === 'expanded'); this.root.add(this.pauseLayer);
    this.audioSettingsView = this.createAudioControls();
    this.pauseLayer.add(this.audioSettingsView.root);
    if (this.volumeIcon) this.root.bringToTop(this.volumeIcon);
  }

  makeSave(): PortSave | undefined {
    if (!this.sim || ['title', 'gene', 'mods'].includes(this.screen)) return undefined;
    this.profile = mergeProfile(this.profile, this.sim.state);
    if (!canSaveAdventure(this.sim.state)) return undefined;
    // Город хранится рядом с приключением, поэтому повторные переносы не вкладывают снимки друг в друга.
    const checkpoint = this.sim.state.phase === 'town' ? undefined : this.carryCheckpoint;
    const options = savedGameOptions(this.options, this.sim.state.ruleset.id);
    return { format: 'elona-shooter-browser', version: SAVE_VERSION, appearance: this.appearance, simulation: this.sim.toSave(), profile: structuredClone(this.profile), optionsVersion: GAME_OPTIONS_VERSION,
      ...(checkpoint && this.sim.state.mode !== 'hardcore' ? { carryCheckpoint: structuredClone(checkpoint) } : {}), ...(options ? { options } : {}) };
  }

  private showSaveProblem(message: string, offerBackup: boolean): void {
    if (!this.paused) this.togglePause();
    this.pauseDialog?.destroy(true);
    const layout = (this.cache.json.get('town-layout') as { saleDialog: ModConfirmationLayout }).saleDialog;
    // Ошибка браузерного хранилища видна в игре; обычное сохранение не открывает новых окон.
    this.pauseDialog = createModConfirmation(this, manifest, layout, confirm => {
      this.pauseDialog?.destroy(true); this.pauseDialog = undefined;
      if (confirm && offerBackup) exportAdventure();
    }, 'save-problem', message, !offerBackup);
    this.pauseDialog.once('destroy', () => { delete container.dataset.saveProblem; });
    this.root.add(this.pauseDialog);
    container.dataset.saveProblem = JSON.stringify({ message, offerBackup });
  }

  saveGame(notify = true): boolean {
    const save = this.makeSave();
    if (!save) {
      if (this.sim && !['title', 'gene', 'mods'].includes(this.screen) && !canSaveAdventure(this.sim.state)) {
        const cleared = clearSave(this.saveSlot); storeProfile(this.profile);
        if (notify || !cleared) status.textContent = cleared ? 'Hardcore Mode: you can only save or export the game in town.' : 'The Hardcore save could not be cleared from browser storage.';
        if (notify) this.showSaveProblem('Hardcore Mode:\nSave or export in town.', false);
      } else if (notify) status.textContent = 'Start a game before saving.';
      return false;
    }
    const stored = storeSave(save, this.saveSlot);
    const profileStored = storeProfile(this.profile);
    if (!profileStored && stored) {
      status.textContent = 'The game was saved, but the medal collection could not be stored. Export a backup.';
      if (notify) this.showSaveProblem('Medals could not be saved.\nExport a backup now?', true);
      return true;
    }
    if (!stored || notify) status.textContent = stored ? 'Game saved in this browser. Export a save to keep a separate backup.' : 'Browser storage is unavailable. Export your save to keep your progress.';
    if (!stored && notify) this.showSaveProblem('Browser save failed.\nExport a backup now?', true);
    return stored;
  }

  private parseSave(raw: unknown, ignoreProfileError = false): { simulation: Simulation; appearance: number; profile?: GlobalProfile; carryCheckpoint?: SimulationState; options: GameOptions } {
    return parseAdventureSave(raw, this.simulationOptions(), ignoreProfileError);
  }

  continueGame(): void {
    if (this.collectionDialog || this.helpLayer) return;
    const saved = readSave(this.saveSlot);
    if (saved.kind !== 'saved') { this.playSound('soundBeep'); this.importFailure(new Error(saved.kind === 'error' ? saved.message : 'Save Game not found.')); return; }
    try { this.loadGame(saved.data); } catch (error) { this.playSound('soundBeep'); this.importFailure(error); }
  }

  loadGame(raw: unknown, restoreCollection = false): void {
    const validated = this.parseSave(raw, !restoreCollection);
    this.celebration?.destroy(); this.celebration = undefined; this.fireworkMedalChecked = false;
    const edition = validated.simulation.state.ruleset.id;
    this.profileRead = readProfile(edition);
    this.profile = this.profileRead.profile;
    if (validated.profile) this.profile = mergeProfiles(this.profile, validated.profile);
    this.profile = mergeProfile(this.profile, validated.simulation.state); if (storeProfile(this.profile)) delete this.profileRead.warning;
    this.clearMedalNotices([...this.profile.medals, ...validated.simulation.state.earnedMedals]);
    this.sim = validated.simulation; this.appearance = validated.appearance;
    this.options = validated.options; this.applyRenderingOptions();
    this.carryCheckpoint = validated.carryCheckpoint;
    if (this.sim.state.phase === 'battle') { this.enterBattle(); this.togglePause(); }
    else this.showOutcome();
    status.textContent = 'Saved game restored.';
  }

  importSave(raw: unknown, confirmed = false): void {
    if (!confirmed && readSave(this.saveSlot).kind !== 'empty') {
      const validated = this.parseSave(raw);
      const layout = (this.cache.json.get('town-layout') as { saleDialog: ModConfirmationLayout }).saleDialog;
      this.collectionDialog = createModConfirmation(this, manifest, layout, accept => {
        this.closeCollectionImport(); if (accept) this.importSave(raw, true);
      }, 'replace-adventure', `Import ${validated.simulation.rules.name}, Day ${validated.simulation.state.day}?\nReplace the adventure in slot ${this.saveSlot + 1}?`);
      container.dataset.replaceAdventure = 'import';
      this.root.add(this.collectionDialog); return;
    }
    this.loadGame(raw, true);
    // Импорт тоже сообщает об ошибке записи и предлагает резервную копию текущего приключения.
    if (this.saveGame() && !this.pauseDialog) status.textContent = 'Save imported and restored.';
  }

  prepareImport(): boolean {
    if (this.collectionDialog || this.pauseDialog || this.helpLayer) return false;
    if (['battle', 'result'].includes(this.screen) && !this.paused) this.togglePause();
    return true;
  }

  private closeCollectionImport(): void {
    this.collectionDialog?.destroy(true); this.collectionDialog = undefined;
    delete container.dataset.flashCollection; delete container.dataset.flashAdventure; delete container.dataset.importError;
    delete container.dataset.replaceAdventure;
  }

  importFlashSave(bytes: Uint8Array): void {
    const decoded = readFlashSharedObject(bytes);
    if (/^elonas[0-7]$/.test(decoded.name)) {
      const imported = readFlashAdventure(bytes, readProfile('classic').profile, decoded);
      this.closeCollectionImport();
      const layout = (this.cache.json.get('town-layout') as { saleDialog: ModConfirmationLayout }).saleDialog;
      this.collectionDialog = createModConfirmation(this, manifest, layout, confirm => {
        this.closeCollectionImport();
        if (confirm) this.importSave(imported.save, true);
      }, 'flash-adventure', `Import ${imported.className}, Day ${imported.day}?\nReplace save slot ${this.saveSlot + 1}.\nFuture rolls differ.`);
      this.root.add(this.collectionDialog);
      container.dataset.flashAdventure = JSON.stringify({ day: imported.day, className: imported.className, originalSlot: imported.originalSlot, originalVersion: imported.originalVersion });
      return;
    }
    const imported = readFlashCollection(bytes);
    this.closeCollectionImport();
    const layout = (this.cache.json.get('town-layout') as { saleDialog: ModConfirmationLayout }).saleDialog;
    this.collectionDialog = createModConfirmation(this, manifest, layout, confirm => {
      if (!confirm) { this.closeCollectionImport(); return; }
      const merged = mergeProfiles(readProfile('classic').profile, imported.profile);
      if (!storeProfile(merged)) {
        (this.collectionDialog!.getByName('flash-collection-question') as Phaser.GameObjects.Text).setText('The collection could not be stored. Please try again.');
        return;
      }
      this.profile = merged; delete this.profileRead.warning;
      this.closeCollectionImport(); this.showTitle();
      status.textContent = `Imported ${imported.profile.medals.length} Flash medals and survival records for future games.${imported.ignoredMedals.length ? ` ${imported.ignoredMedals.length} unsupported medal flags were ignored.` : ''}`;
    }, 'flash-collection', `Import ${imported.profile.medals.length} medals and records?\nAdventures will be kept.`);
    this.root.add(this.collectionDialog);
    container.dataset.flashCollection = JSON.stringify(imported);
  }

  importFailure(error: unknown): void {
    this.closeCollectionImport();
    const message = error instanceof SyntaxError ? 'This is not a valid browser save file.'
      : error instanceof Error ? error.message : 'The save file could not be imported.';
    status.textContent = message; container.dataset.importError = message;
    const layout = (this.cache.json.get('town-layout') as { saleDialog: ModConfirmationLayout }).saleDialog;
    this.collectionDialog = createModConfirmation(this, manifest, layout, () => this.closeCollectionImport(), 'import-error', message, true);
    this.root.add(this.collectionDialog);
  }

  private syncEnemyFrameAudio(allowSpawn = true): void {
    const present = new Set<number>();
    for (const enemy of this.sim?.state.enemies ?? []) {
      if (enemy.removed) continue;
      present.add(enemy.uid);
      const previous = this.enemyFrameAudio.get(enemy.uid);
      const audio = previous ?? { frame: enemy.frame, crowPlayed: !allowSpawn };
      const play = (key: string) => {
        const pan = Phaser.Math.Clamp(Math.trunc(Math.trunc(enemy.x) / 25), 0, 19) * 0.08 - 0.8;
        this.playSound(key, 0.9, pan);
        this.frameSoundCues.push({ key, uid: enemy.uid, frame: enemy.frame });
        if (this.frameSoundCues.length > 12) this.frameSoundCues.shift();
        container.dataset.frameSounds = JSON.stringify(this.frameSoundCues);
      };
      if (!previous && allowSpawn && enemy.hp > 0) {
        const key = { chicken: 'soundChicken', cata: 'soundCata', tank: 'soundTank' }[enemy.kind as 'chicken' | 'cata' | 'tank'];
        if (key) play(key);
      }
      if (previous && previous.frame !== enemy.frame) {
        if (enemy.kind === 'chicken' && enemy.frame === 136) play('soundChickenAttack');
        if (enemy.kind === 'boss' && enemy.frame === 291) play('soundDeadBoss2');
        if (enemy.kind === 'crow' && enemy.frame === 24 && !audio.crowPlayed) { play('soundCrow'); audio.crowPlayed = true; }
      }
      audio.frame = enemy.frame; this.enemyFrameAudio.set(enemy.uid, audio);
    }
    for (const uid of this.enemyFrameAudio.keys()) if (!present.has(uid)) this.enemyFrameAudio.delete(uid);
  }

  playSound(key: string, volume = 0.7, pan = 0): void { if (this.cache.audio.exists(key)) this.audioMixer.play(key, { volume, pan }); }
  toggleMute(): void { this.muted = !this.muted; this.sound.mute = this.muted; this.volumeIcon?.setFrame(this.muted ? '2' : '1'); container.dataset.muted = String(this.muted); updateMuteControl(this.muted); storeMute(this.muted); }
}

async function boot(): Promise<void> {
  const response = await fetch(assetUrl('manifest.json'));
  if (!response.ok) throw new Error('Original assets are missing. Run python tools/extract_web_assets.py from the project folder.');
  manifest = await response.json() as Manifest;
  try {
    const localizedResponse = await fetch(assetUrl('ru/manifest.json'));
    if (!localizedResponse.ok) throw new Error('Russian artwork is unavailable.');
    russianAssets = await localizedResponse.json(); localizationReady = true;
  } catch {
    status.textContent = 'Russian artwork is unavailable. Reload to retry.';
  }
  for (const [key, mask] of Object.entries(russianAssets.hitMasks)) manifest.images[key].ruHitMask = mask;
  const families: Record<string, string> = { menu: 'ElonaMenu', menuBold: 'ElonaMenuBold', hud: 'ElonaHud', small: 'ElonaSmall', impact: 'ElonaImpact', ruMenu: 'ElonaRussianMenu', ruUI: 'ElonaRussianUI', ruBold: 'ElonaRussianBold' };
  const fontFallbacks: string[] = [];
  const fontFiles = { ...manifest.fonts, ruMenu: 'fonts/ru/Neucha.ttf', ruUI: 'fonts/ru/PT_Sans-Web-Regular.ttf', ruBold: 'fonts/ru/PT_Sans-Web-Bold.ttf' };
  await Promise.all(Object.entries(fontFiles).map(async ([key, file]) => {
    try {
      const font = new FontFace(families[key] ?? key, `url("${assetUrl(file)}")`);
      await font.load(); document.fonts.add(font);
    } catch (error) {
      // Шрифт влияет на оформление, но его сбой не должен блокировать всю игру.
      fontFallbacks.push(key);
      console.warn(`Original font ${key} is unavailable; using the browser fallback.`, error);
    }
  }));
  container.dataset.fontFallbacks = JSON.stringify(fontFallbacks.sort());
  new Phaser.Game({ type: Phaser.WEBGL, parent: 'playfield', width: 620, height: 380, backgroundColor: '#000000', scene: ElonaScene,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, roundPixels: false }, audio: { disableWebAudio: false }, fps: { target: 60 },
  });
}

const fullscreenButton = document.querySelector<HTMLButtonElement>('#fullscreen')!;
const languageButton = document.querySelector<HTMLButtonElement>('#language')!;
const staticText = new Map<Text, string>();
for (const selector of ['#touch-guide-dialog', '#touch-pause', '#touch-reload', '#touch-fire-at-will', '#touch-guide', '#touch-enlarge', '#touch-pan']) {
  const walker = document.createTreeWalker(document.querySelector(selector)!, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) if (node.textContent?.trim()) staticText.set(node as Text, node.textContent);
}
function updateLanguageControl(): void {
  const lang = getLanguage(); document.documentElement.lang = lang; container.dataset.language = lang;
  statusElement.textContent = statusSource === null ? null : t(statusSource);
  document.querySelector('#playfield > canvas')?.setAttribute('aria-label', t('Elona Shooter battlefield'));
  languageButton.textContent = lang.toUpperCase(); languageButton.setAttribute('aria-pressed', String(lang === 'ru'));
  languageButton.setAttribute('aria-label', t(lang === 'en' ? 'Switch to Russian' : 'Switch to English'));
  for (const [node, source] of staticText) node.textContent = source.replace(source.trim(), t(source.trim()));
  enlargeButton.textContent = t(container.dataset.menuZoom === 'true' ? 'Fit' : 'Enlarge');
  updateMuteControl(container.dataset.muted !== 'false');
  fullscreenButton.setAttribute('aria-label', t(document.fullscreenElement === container ? 'Exit fullscreen' : 'Enter fullscreen'));
  container.setAttribute('aria-label', t('Elona Shooter game'));
  document.querySelector('#game-controls')!.setAttribute('aria-label', t('Game controls'));
  panMenu.setAttribute('aria-label', t('Pan enlarged menu horizontally'));
}
languageButton.addEventListener('click', () => setLanguage(getLanguage() === 'en' ? 'ru' : 'en'));
onLanguageChanged(updateLanguageControl); updateLanguageControl();
muteButton.addEventListener('click', () => gameScene?.toggleMute());
fullscreenButton.disabled = !document.fullscreenEnabled || typeof container.requestFullscreen !== 'function';
fullscreenButton.addEventListener('click', () => {
  const change = document.fullscreenElement === container ? document.exitFullscreen() : container.requestFullscreen();
  void change.catch(() => { status.textContent = 'Full screen is unavailable in this browser view.'; });
});
document.addEventListener('fullscreenchange', () => {
  const active = document.fullscreenElement === container;
  container.classList.toggle('game-expanded', active);
  fullscreenButton.setAttribute('aria-pressed', String(active));
  fullscreenButton.setAttribute('aria-label', t(active ? 'Exit fullscreen' : 'Enter fullscreen'));
});
function exportAdventure(): void {
  if (gameScene?.sim && !['title', 'gene', 'mods'].includes(gameScene.screen) && !canSaveAdventure(gameScene.sim.state)) {
    status.textContent = 'Hardcore Mode: you can only save or export the game in town.'; return;
  }
  const current = gameScene?.makeSave(), saved = readSave(gameScene?.saveSlot);
  const data = current ?? (saved.kind === 'saved' ? saved.data : undefined);
  if (data) { exportSave(data); status.textContent = 'Save exported.'; } else status.textContent = 'Start a game before exporting a save.';
}
const fileInput = document.querySelector<HTMLInputElement>('#save-file')!;
const touchGuide = document.querySelector<HTMLDialogElement>('#touch-guide-dialog')!;
touchGuide.addEventListener('keydown', event => event.stopPropagation());
document.querySelector('#touch-pause')!.addEventListener('click', () => {
  gameScene?.toggleTouchPause();
});
document.querySelector('#touch-guide')!.addEventListener('click', () => {
  if (!gameScene || !['title', 'battle', 'town', 'result'].includes(gameScene.screen)) return;
  const canExport = gameScene.screen === 'title' ? readSave(gameScene.saveSlot).kind === 'saved'
    : !!gameScene.sim && canSaveAdventure(gameScene.sim.state);
  document.querySelector<HTMLButtonElement>('#touch-export')!.disabled = !canExport;
  touchGuide.showModal();
});
document.querySelector('#touch-import')!.addEventListener('click', () => {
  if (!gameScene?.prepareImport()) return;
  touchGuide.close();
  fileInput.click();
});
document.querySelector('#touch-export')!.addEventListener('click', () => { touchGuide.close(); exportAdventure(); });
window.addEventListener('keydown', event => {
  if (!(event.ctrlKey || event.metaKey) || !gameScene || event.altKey) return;
  if (event.code === 'KeyS') {
    event.preventDefault();
    if (event.shiftKey) exportAdventure(); else gameScene.saveGame();
  } else if (event.code === 'KeyO' && event.shiftKey) { event.preventDefault(); if (gameScene.prepareImport()) fileInput.click(); }
  else if (event.code === 'KeyM' && event.shiftKey) { event.preventDefault(); gameScene.toggleMute(); }
});
fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0]; if (!file) return;
  try {
    if (file.size > 1_000_000) throw new Error('The save file is too large.');
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes[0] === 0 && bytes[1] === 0xbf || file.name.toLowerCase().endsWith('.sol')) gameScene.importFlashSave(bytes);
    else gameScene.importSave(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)));
  }
  catch (error) { gameScene.importFailure(error); }
  finally { fileInput.value = ''; }
});
window.addEventListener('pagehide', () => { if (gameScene?.screen === 'battle') gameScene.saveGame(false); });
void boot().catch(error => { showStartupFailure('The game could not start. Please check your connection and retry.'); console.error(error); });
