import type Phaser from 'phaser';

export const BATTLE_CURSOR = 'var(--battle-cursor, crosshair)';
const NATIVE_LIMIT = 128;

interface CursorBitmap { url: string; x: number; y: number; width: number; height: number }

/** В SWF красное свечение наложено на размещённый customCursor, уже после масштабирования символа. */
function renderCursor(frame: Phaser.Textures.Frame, width: number, height: number, blur: number,
  alpha: number, originX: number, originY: number): CursorBitmap {
  const bitmap = document.createElement('canvas');
  bitmap.width = width + 2 * blur;
  bitmap.height = height + 2 * blur;
  const ctx = bitmap.getContext('2d')!;
  ctx.shadowColor = '#ff0000';
  ctx.shadowBlur = blur;
  ctx.globalAlpha = alpha;
  ctx.drawImage(frame.source.image as CanvasImageSource, frame.cutX, frame.cutY,
    frame.cutWidth, frame.cutHeight, blur, blur, width, height);
  return { url: bitmap.toDataURL(), x: blur + Math.round(originX * width / frame.cutWidth),
    y: blur + Math.round(originY * height / frame.cutHeight), width: bitmap.width, height: bitmap.height };
}

export class BattleCursor {
  private readonly variants = new Map<string, CursorBitmap>();
  private readonly overlay = document.createElement('div');
  private readonly image = new Image();
  private current = '';
  private oversized = false;
  private hotspot = { x: 0, y: 0 };

  constructor(private readonly scene: Phaser.Scene) {
    this.overlay.className = 'battle-reticle';
    this.overlay.setAttribute('aria-hidden', 'true');
    this.image.alt = '';
    this.overlay.append(this.image);
    this.hide();
    const canvas = scene.game.canvas;
    canvas.after(this.overlay);
    // Большой указатель не помещается в системный курсор. Его движение тоже не ждёт кадра боя.
    const move = (event: PointerEvent) => {
      if (this.oversized && canvas.style.cursor === BATTLE_CURSOR) this.position(event.offsetX, event.offsetY);
    };
    const leave = () => this.hide();
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerleave', leave);
    scene.events.once('shutdown', () => {
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerleave', leave);
      this.overlay.remove();
    });
  }

  hide(): void { this.overlay.hidden = true; }

  private position(x: number, y: number): void {
    this.image.style.transform = `translate(${x - this.hotspot.x}px, ${y - this.hotspot.y}px)`;
    this.overlay.hidden = false;
  }

  update(frameName: string, size: number, alpha: number, originX: number, originY: number, stageWidth: number): void {
    const { game, input, scale, cameras, textures } = this.scene;
    const frame = textures.getFrame('originalCrosshair', frameName);
    const zoom = scale.displaySize.width / stageWidth;
    if (zoom <= 0) return;
    const w = frame.cutWidth * size, h = frame.cutHeight * size;
    this.oversized = Math.round(Math.max(w, h) * zoom) + 2 * Math.ceil(2 * zoom) > NATIVE_LIMIT;
    const density = this.oversized ? Math.min(2, zoom) : zoom;
    const width = Math.max(1, Math.round(w * density)), height = Math.max(1, Math.round(h * density));
    const blur = Math.ceil(2 * density);
    const key = `${frameName}/${width}/${height}/${blur}/${alpha}`;
    const presentation = `${key}/${zoom}/${this.oversized}`;
    if (presentation !== this.current) {
      let art = this.variants.get(key);
      if (!art) {
        art = renderCursor(frame, width, height, blur, alpha, originX, originY);
        this.variants.set(key, art);
      }
      const factor = zoom / density;
      this.image.src = art.url;
      this.image.style.width = `${art.width * factor}px`;
      this.image.style.height = `${art.height * factor}px`;
      this.hotspot = { x: art.x * factor, y: art.y * factor };
      game.canvas.style.setProperty('--battle-cursor', this.oversized ? 'none' : `url("${art.url}") ${art.x} ${art.y}, crosshair`);
      this.current = presentation;
    }
    const p = input.activePointer;
    if ((this.oversized || p.wasTouch) && input.manager.isOver && game.canvas.style.cursor === BATTLE_CURSOR) {
      this.position(p.x * zoom / cameras.main.zoom, p.y * zoom / cameras.main.zoom);
    } else this.hide();
  }
}
