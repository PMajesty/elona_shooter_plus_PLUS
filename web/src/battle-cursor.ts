import type Phaser from 'phaser';

export const BATTLE_CURSOR = 'none';

/** В SWF красное свечение наложено на размещённый customCursor, уже после масштабирования символа. */
function renderCursor(bitmap: HTMLCanvasElement, frame: Phaser.Textures.Frame, width: number, height: number,
  blur: number, alpha: number): void {
  bitmap.width = Math.ceil(width + 2 * blur);
  bitmap.height = Math.ceil(height + 2 * blur);
  const ctx = bitmap.getContext('2d')!;
  ctx.shadowColor = '#ff0000';
  ctx.shadowBlur = blur;
  ctx.globalAlpha = alpha;
  ctx.drawImage(frame.source.image as CanvasImageSource, frame.cutX, frame.cutY,
    frame.cutWidth, frame.cutHeight, blur, blur, width, height);
}

export class BattleCursor {
  private readonly overlay = document.createElement('div');
  private readonly image = document.createElement('canvas');
  private current = '';
  private hotspot = { x: 0, y: 0 };
  private pointer: { x: number; y: number; density: number } | null = null;

  constructor(private readonly scene: Phaser.Scene) {
    this.overlay.className = 'battle-reticle';
    this.overlay.setAttribute('aria-hidden', 'true');
    this.overlay.append(this.image);
    this.hide();
    const canvas = scene.game.canvas;
    canvas.after(this.overlay);
    // Движение мыши не ждёт следующего кадра боя.
    const move = (event: PointerEvent) => {
      this.pointer = { x: event.clientX, y: event.clientY, density: window.devicePixelRatio };
      this.position();
    };
    const leave = () => { this.pointer = null; this.hide(); };
    // При Ctrl+колесе мышь может остаться на месте, а её координаты в CSS уже другие.
    const resize = () => {
      const p = this.pointer;
      if (!p) return;
      const ratio = p.density / window.devicePixelRatio;
      p.x *= ratio;
      p.y *= ratio;
      p.density = window.devicePixelRatio;
      const { manager, activePointer } = this.scene.input;
      manager.transformPointer(activePointer, p.x + window.scrollX, p.y + window.scrollY, false);
      this.position();
    };
    canvas.addEventListener('pointerenter', move);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerdown', move);
    canvas.addEventListener('pointerup', move);
    canvas.addEventListener('pointerleave', leave);
    canvas.addEventListener('pointercancel', leave);
    window.addEventListener('blur', leave);
    scene.scale.on('resize', resize);
    scene.events.once('shutdown', () => {
      canvas.removeEventListener('pointerenter', move);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerdown', move);
      canvas.removeEventListener('pointerup', move);
      canvas.removeEventListener('pointerleave', leave);
      canvas.removeEventListener('pointercancel', leave);
      window.removeEventListener('blur', leave);
      scene.scale.off('resize', resize);
      this.overlay.remove();
    });
  }

  hide(): void {
    this.overlay.hidden = true;
  }

  private position(): void {
    const canvas = this.scene.game.canvas;
    const p = this.pointer;
    const rect = canvas.getBoundingClientRect();
    // Над кнопками HUD Phaser показывает обычную руку.
    if (!p || !this.current || canvas.style.cursor !== BATTLE_CURSOR ||
      rect.width <= 0 || rect.height <= 0 ||
      p.x < rect.left || p.x >= rect.right || p.y < rect.top || p.y >= rect.bottom) {
      this.overlay.hidden = true;
      return;
    }
    const x = (p.x - rect.left) * canvas.clientWidth / rect.width;
    const y = (p.y - rect.top) * canvas.clientHeight / rect.height;
    this.image.style.transform = `translate(${x - this.hotspot.x}px, ${y - this.hotspot.y}px)`;
    this.overlay.hidden = false;
  }

  update(frameName: string, size: number, alpha: number, originX: number, originY: number, stageWidth: number): void {
    const { game, textures } = this.scene;
    const frame = textures.getFrame('originalCrosshair', frameName);
    // Размер задаёт сцена. Плотность экрана влияет только на разрешение рисунка.
    const zoom = game.canvas.clientWidth / stageWidth;
    if (!Number.isFinite(zoom) || zoom <= 0) {
      this.overlay.hidden = true;
      return;
    }
    const pixelRatio = Math.max(1, window.devicePixelRatio || 1);
    const density = zoom * pixelRatio;
    const width = frame.cutWidth * size * density, height = frame.cutHeight * size * density;
    const blur = 2 * density;
    const presentation = `${frameName}/${size}/${alpha}/${zoom}/${pixelRatio}/${originX}/${originY}`;
    if (presentation !== this.current) {
      renderCursor(this.image, frame, width, height, blur, alpha);
      this.image.style.width = `${this.image.width / pixelRatio}px`;
      this.image.style.height = `${this.image.height / pixelRatio}px`;
      this.hotspot = { x: (2 + originX * size) * zoom, y: (2 + originY * size) * zoom };
      this.current = presentation;
    }
    this.position();
  }
}
