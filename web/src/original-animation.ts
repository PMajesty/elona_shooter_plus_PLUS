import Phaser from 'phaser';

export interface OriginalBody {
  name: 'chara1' | 'chara2';
  depth: number;
  pose: number;
  matrix: [number, number, number, number, number, number];
}

export interface OriginalFrame {
  bodies: OriginalBody[];
  action?: { chara1?: number; chara2?: number; goto?: number | string; stop?: boolean };
}

export interface OriginalAllyMetadata {
  version: 1;
  symbol: 838;
  count: number;
  frameRate: 30;
  labels: Record<string, number>;
  frames: Record<string, OriginalFrame>;
}

export interface OriginalClipOrigin { originX: number; originY: number }
export type OriginalAllyClips = Record<string, OriginalClipOrigin>;
export type OriginalPixelTest = (texture: string, frame: string, x: number, y: number) => boolean;

export const EVENT_WINDOW_X = 590 - Array.from({ length: 16 }, (_, index) => index ** 1.7).reduce((sum, value) => sum + value, 0);
export const EVENT_WINDOW_Y = -26;

export function resolveOriginalFrame(metadata: OriginalAllyMetadata, target: number | string): number {
  const number = typeof target === 'string' ? metadata.labels[target] : target;
  if (!Number.isFinite(number)) throw new Error(`Unknown original ally1 frame: ${target}`);
  let frame = Phaser.Math.Clamp(Math.trunc(number), 1, metadata.count);
  // Переходы frame42/53/212 исполняются в том же кадре, а не показывают лишнюю позу.
  for (let limit = 0; limit < 8; limit++) {
    const jump = metadata.frames[String(frame)]?.action?.goto;
    if (jump === undefined) return frame;
    frame = typeof jump === 'string' ? metadata.labels[jump] : jump;
    if (!Number.isFinite(frame)) throw new Error(`Invalid original ally1 jump: ${jump}`);
  }
  throw new Error('Original ally1 frame transition loop.');
}

/** Восстанавливает выбор лица и позы, отсутствующий в статическом FFDec-экспорте ally1. */
export class OriginalAlly extends Phaser.GameObjects.Container {
  private readonly body1: Phaser.GameObjects.Image;
  private readonly body2: Phaser.GameObjects.Image;
  private readonly back?: Phaser.GameObjects.Image;
  private readonly front?: Phaser.GameObjects.Image;
  private rampage?: Phaser.GameObjects.Image;
  private appearance: number;
  private frame = 109;
  private playing = false;

  constructor(
    scene: Phaser.Scene,
    private readonly metadata: OriginalAllyMetadata,
    private readonly clips: OriginalAllyClips,
    appearance: number,
    x = 0,
    y = 0,
  ) {
    super(scene, x, y);
    this.appearance = Math.max(0, Math.min(65, Math.trunc(appearance)));
    this.back = this.makeLayer('allyBack');
    this.body1 = new Phaser.GameObjects.Image(scene, 0, 0, 'charaPic', '1').setOrigin(0);
    this.add(this.body1);
    this.front = this.makeLayer('allyFront');
    this.body2 = new Phaser.GameObjects.Image(scene, 0, 0, 'charaPic', '1').setOrigin(0);
    this.add(this.body2);
    this.setOriginalFrame(109);
  }

  get currentOriginalFrame(): number { return this.frame; }
  get isOriginalPlaying(): boolean { return this.playing; }

  setRampageFrame(frame: number): this {
    if (!frame) { this.rampage?.destroy(); this.rampage = undefined; return this; }
    const asset = this.clips.allyRampage;
    if (!this.rampage) {
      this.rampage = new Phaser.GameObjects.Image(this.scene, -asset.originX, 18 - asset.originY, 'allyRampage', String(frame)).setOrigin(0);
      this.add(this.rampage);
    }
    this.rampage.setFrame(String(frame)); this.bringToTop(this.rampage);
    return this;
  }

  private makeLayer(key: string): Phaser.GameObjects.Image | undefined {
    const origin = this.clips[key];
    if (!origin || !this.scene.textures.exists(key)) return undefined;
    const layer = new Phaser.GameObjects.Image(this.scene, -origin.originX, -origin.originY, key, '1').setOrigin(0);
    this.add(layer);
    return layer;
  }

  setAppearance(appearance: number): this {
    this.appearance = Math.max(0, Math.min(65, Math.trunc(appearance)));
    return this.paint();
  }

  setOriginalFrame(target: number | string): this {
    this.frame = resolveOriginalFrame(this.metadata, target);
    return this.paint();
  }

  playOriginal(target: number | string): this {
    this.playing = true;
    this.setOriginalFrame(target);
    if (this.metadata.frames[String(this.frame)]?.action?.stop) this.playing = false;
    return this;
  }

  stopOriginal(target?: number | string): this {
    this.playing = false;
    if (target !== undefined) this.setOriginalFrame(target);
    return this;
  }

  stepOriginal(): this {
    if (!this.playing) return this;
    this.setOriginalFrame(this.frame === this.metadata.count ? 1 : this.frame + 1);
    if (this.metadata.frames[String(this.frame)]?.action?.stop) this.playing = false;
    return this;
  }

  hitTestWorld(x: number, y: number, pixelTest: OriginalPixelTest): boolean {
    const point = this.getWorldTransformMatrix().applyInverse(x, y);
    const frame = String(this.frame);
    // Flash проверял весь отображаемый ally1: тело, оружие и тени с их исходными матрицами.
    for (const key of ['allyBack', 'allyFront']) {
      const origin = this.clips[key];
      if (origin && pixelTest(key, frame, point.x + origin.originX, point.y + origin.originY)) return true;
    }
    for (const body of this.metadata.frames[frame].bodies) {
      const [a, b, c, d, tx, ty] = body.matrix;
      const determinant = a * d - b * c;
      if (!determinant) continue;
      const dx = point.x - tx, dy = point.y - ty;
      const origin = this.clips.charaPic ?? { originX: 0, originY: 0 };
      const bodyX = (d * dx - c * dy) / determinant + origin.originX;
      const bodyY = (a * dy - b * dx) / determinant + origin.originY;
      if (pixelTest('charaPic', String(this.appearance * 10 + body.pose), bodyX, bodyY)) return true;
    }
    return false;
  }

  private paint(): this {
    const data = this.metadata.frames[String(this.frame)];
    if (!data) throw new Error(`Missing original ally1 frame ${this.frame}`);
    this.body1.setVisible(false); this.body2.setVisible(false);
    for (const layer of [this.back, this.front]) {
      if (layer) layer.setFrame(String(this.frame));
    }
    for (const body of data.bodies) {
      const image = body.name === 'chara1' ? this.body1 : this.body2;
      const [a, b, c, d, tx, ty] = body.matrix;
      const scaleX = Math.hypot(a, b);
      const scaleY = scaleX ? (a * d - b * c) / scaleX : Math.hypot(c, d);
      const origin = this.clips.charaPic ?? { originX: 0, originY: 0 };
      image.setFrame(String(this.appearance * 10 + body.pose));
      image.setPosition(tx - a * origin.originX - c * origin.originY, ty - b * origin.originX - d * origin.originY);
      image.setRotation(Math.atan2(b, a)).setScale(scaleX, scaleY).setVisible(true);
    }
    return this;
  }
}
