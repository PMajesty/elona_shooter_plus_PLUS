import type Phaser from 'phaser';

export const BATTLE_CURSOR = 'var(--battle-cursor, crosshair)';

/** Координаты указателя ведёт браузер. Игра меняет лишь рисунок, размер и прозрачность. */
export class BattleCursor {
  private readonly variants = new Map<string, string>();
  private current = '';

  update(scene: Phaser.Scene, frameName: string, scale: number, alpha: number, originX: number, originY: number): void {
    const frame = scene.textures.getFrame('originalCrosshair', frameName);
    const width = Math.max(1, Math.min(128, Math.round(frame.cutWidth * scale)));
    const key = `${frameName}/${width}/${alpha}`;
    if (key === this.current) return;
    let cursor = this.variants.get(key);
    if (!cursor) {
      const bitmap = document.createElement('canvas');
      bitmap.width = width;
      bitmap.height = Math.max(1, Math.round(width * frame.cutHeight / frame.cutWidth));
      const ctx = bitmap.getContext('2d');
      if (!ctx) return;
      ctx.globalAlpha = alpha;
      ctx.drawImage(frame.source.image as CanvasImageSource, frame.cutX, frame.cutY,
        frame.cutWidth, frame.cutHeight, 0, 0, width, bitmap.height);
      const x = Math.round(originX * width / frame.cutWidth);
      const y = Math.round(originY * bitmap.height / frame.cutHeight);
      cursor = `url("${bitmap.toDataURL()}") ${x} ${y}, crosshair`;
      this.variants.set(key, cursor);
    }
    scene.game.canvas.style.setProperty('--battle-cursor', cursor);
    this.current = key;
  }
}
