import type Phaser from 'phaser';

/** Переходы считаются в исходных кадрах 30 fps; время идёт по реальным часам с интерполяцией между кадрами, поэтому анимация плавна и на частых мониторах. */
export const REFERENCE_FRAME_MS = 1000 / 30;

/**
 * Въезд исходного окна (onEnterFrame_result 5214–5231, onEnterFrame_town 6478–6494, onEnterFrame_help 1079–1098):
 * в первом кадре после anime окно ставится в начальную точку, затем каждый кадр --animeTime и сдвиг влево на animeTime^1.7;
 * шаги: 15^1.7, 14^1.7 … 1^1.7, 0 — всего 16.
 */
const SLIDE_STEPS = Array.from({ length: 16 }, (_, index) => (15 - index) ** 1.7);
export const SLIDE_DISTANCE = SLIDE_STEPS.reduce((sum, step) => sum + step, 0);
/**
 * Окна событий и меню города ждут delay>3: первые 3 кадра стоят в начальной точке.
 * Справка в кадре открытия невидима и становится видимой после первого шага, поэтому первый видимый кадр уже сдвинут.
 */
export const WINDOW_SLIDE_DELAY = 3;
export const HELP_SLIDE_DELAY = -1;

/** Сколько пикселей остаётся до конечной точки в целом кадре frame. */
export function slideRemainingAtFrame(frame: number, delay: number): number {
  const moved = Math.max(0, Math.min(SLIDE_STEPS.length, Math.floor(frame) - delay));
  let remaining = SLIDE_DISTANCE;
  for (let step = 0; step < moved; step++) remaining -= SLIDE_STEPS[step];
  return Math.max(0, remaining);
}
/** Оставшееся смещение через elapsedMs; между кадрами — линейная интерполяция. */
export function slideOffset(elapsedMs: number, delay: number): number {
  const frames = Math.max(0, elapsedMs / REFERENCE_FRAME_MS);
  const whole = Math.floor(frames);
  const current = slideRemainingAtFrame(whole, delay), next = slideRemainingAtFrame(whole + 1, delay);
  return current + (next - current) * (frames - whole);
}
export const slideFinished = (elapsedMs: number, delay: number): boolean => elapsedMs >= (delay + SLIDE_STEPS.length) * REFERENCE_FRAME_MS;

/**
 * Угасание исходного окна события (fadeCount=9, 5193–5212): в кадре n alpha=(9-n)*0.1, на 9-м кадре окно исчезает и начинается следующее.
 * Выбор персонажа и Game MODs одновременно затемняют весь экран с той же яркостью (9-n)*0.1.
 */
export const FADE_FRAMES = 9;
export function fadeLevel(elapsedMs: number): number {
  const frames = Math.max(0, elapsedMs / REFERENCE_FRAME_MS);
  if (frames < 1) return 1 - 0.2 * frames;
  return Math.max(0, (FADE_FRAMES - frames) * 0.1);
}
export const fadeFinished = (elapsedMs: number): boolean => elapsedMs >= FADE_FRAMES * REFERENCE_FRAME_MS;

/** Выбор персонажа, Game MODs и экран перед боем выходят из черноты: первые 40 кадров яркость 0.025*delay (5153–5158, 5179–5184). */
export const BLACK_IN_FRAMES = 40;
export function blackInBrightness(elapsedMs: number): number {
  return Math.min(1, Math.max(0, elapsedMs / REFERENCE_FRAME_MS) * 0.025);
}

/** Кадры 1–10 menu_pause: бумага с кнопками справа едет от +214, панель настроек слева — от −353, линейно. */
export const PAUSE_SLIDE_FRAMES = 9;
export const PAUSE_RIGHT_DISTANCE = 214;
export const PAUSE_LEFT_DISTANCE = 353;
export function pauseSlideProgress(elapsedMs: number): number {
  return Math.min(1, Math.max(0, elapsedMs / REFERENCE_FRAME_MS / PAUSE_SLIDE_FRAMES));
}

/**
 * Переход из итогов в город (onEnterFrame_result 5073–5127): 30 кадров навигация города сдвигается вправо на 3 за кадр (всего 90),
 * лист итогов — на 1.1 за кадр, фон города bgAlpha получает +0.04 за кадр; на 31-м кадре открывается город.
 */
export const TOWN_ENTRY_FRAMES = 30;
export const TOWN_ENTRY_NAVIGATION_STEP = 3;
export const TOWN_ENTRY_PANEL_STEP = 1.1;
export const TOWN_ENTRY_BACKDROP_STEP = 0.04;
export function townEntryFrames(elapsedMs: number): number {
  return Math.min(TOWN_ENTRY_FRAMES, Math.max(0, elapsedMs / REFERENCE_FRAME_MS));
}
export const townEntryFinished = (elapsedMs: number): boolean => elapsedMs >= (TOWN_ENTRY_FRAMES + 1) * REFERENCE_FRAME_MS;
/** При delay==30 window3_mc копирует позицию окна итогов, которое к этому моменту сдвинулось 29 раз; копия остаётся под меню города. */
export const RESULT_UNDERLAY_SHIFT = (TOWN_ENTRY_FRAMES - 1) * TOWN_ENTRY_PANEL_STEP;

/**
 * _eventBegin перед боем (fadeCount=80, 5179–5212): окно «Day N» въезжает как обычно,
 * в кадре n alpha=(80-n)*0.1, то есть кадры 71–80 гасят его; при delay>=90 начинается бой.
 */
export const BEGIN_FRAMES = 90;
export function beginWindowAlpha(elapsedMs: number): number {
  return Math.min(1, Math.max(0, (80 - elapsedMs / REFERENCE_FRAME_MS) * 0.1));
}
export const beginFinished = (elapsedMs: number): boolean => elapsedMs >= BEGIN_FRAMES * REFERENCE_FRAME_MS;

/** Стандартный переход Tweener easeOutExpo (исходное размытие снимка доходит до 3 за 1 секунду). */
export function easeOutExpo(progress: number): number {
  if (progress <= 0) return 0;
  return progress >= 1 ? 1 : 1.001 * (1 - 2 ** (-10 * progress));
}

interface Positioned { x: number; active?: boolean }

/** Въезд окна: перестройка того же окна продолжает прежний въезд, новое окно (или явный перезапуск) въезжает с начала. */
export class PanelSlide {
  private key?: string;
  private startedAt = 0;
  private delay = WINDOW_SLIDE_DELAY;
  private targets: { object: Positioned; baseX: number }[] = [];

  /** Начинает (или продолжает) въезд окна; возвращает true, если въезд начат заново. */
  begin(key: string, now: number, delay = WINDOW_SLIDE_DELAY, restart = false): boolean {
    this.targets = [];
    if (!restart && key === this.key) return false;
    this.key = key; this.startedAt = now; this.delay = delay;
    return true;
  }
  /** Добавляет контейнер, который едет вместе с окном, и сразу ставит его в текущую позицию. */
  track(object: Positioned, now: number): void {
    this.targets.push({ object, baseX: object.x });
    this.apply(now);
  }
  sliding(now: number): boolean { return this.key !== undefined && !slideFinished(now - this.startedAt, this.delay); }
  update(now: number): void {
    if (!this.targets.length) return;
    this.apply(now);
    if (!this.sliding(now)) this.targets = [];
  }
  /** Сбрасывается при уходе с экрана окна, чтобы следующее окно въехало с начала. */
  clear(): void { this.key = undefined; this.targets = []; }
  private apply(now: number): void {
    const offset = slideOffset(now - this.startedAt, this.delay);
    for (const target of this.targets) if (target.object.active !== false) target.object.x = target.baseX + offset;
  }
}

/** Слой на весь экран: во время въезда и угасания окон оригинал просто игнорирует щелчки. */
export function createInputBlocker(scene: Phaser.Scene, name: string): Phaser.GameObjects.Zone {
  const blocker = scene.add.zone(0, 0, 620, 380).setOrigin(0).setName(name).setDepth(9000).setInteractive();
  blocker.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => event.stopPropagation());
  return blocker;
}
