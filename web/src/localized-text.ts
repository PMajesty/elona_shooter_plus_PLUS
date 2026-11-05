import Phaser from 'phaser';
import { getLanguage, localizedFont, onLanguageChanged, translateText, type TextContext } from './i18n.ts';

export interface LocalizedTextBounds {
  /** Размеры в локальных координатах текста, до scale родительского поля. */
  width: number; height: number; minFontSize?: number; lineSpacing?: number;
  /** Только короткие подписи: многоточие вместо нечитаемого дальнейшего сжатия. */
  ellipsis?: boolean;
}

/** Текст хранит исходную строку, поэтому EN/RU переключается без изменения игрового состояния. */
class LocalizedText extends Phaser.GameObjects.Text {
  declare private sourceText: string | string[];
  declare private sourceFamily: string;
  private localizationContext: TextContext = 'ui';
  declare private fitBounds: LocalizedTextBounds | undefined;
  declare private sourceFontSize: number | undefined;
  declare private fitting: boolean | undefined;
  declare private sourceWrapWidth: number | undefined;
  declare private sourceLineSpacing: number | undefined;
  declare private logicalCrop: { x: number; y: number; width: number; height: number } | undefined;
  constructor(scene: Phaser.Scene, x: number, y: number, value: string | string[], style: Phaser.Types.GameObjects.Text.TextStyle = {}) {
    super(scene, x, y, value, { ...style, fontFamily: localizedFont(style.fontFamily ?? 'Arial'), resolution: style.resolution ?? 2 });
    this.sourceText = value; this.sourceFamily = style.fontFamily ?? 'Arial';
    const unsubscribe = onLanguageChanged(() => {
      super.setFontFamily(localizedFont(this.sourceFamily));
      this.setText(this.sourceText);
    });
    this.once('destroy', unsubscribe);
  }
  override setText(value: string | string[]): this {
    this.sourceText = value; return super.setText(translateText(value, getLanguage(), this.localizationContext));
  }
  // Текстура хранится в увеличенных пикселях, а положение выреза задано в координатах игры.
  override setCrop(x?: number | Phaser.Geom.Rectangle, y?: number, width?: number, height?: number): this {
    if (x === undefined) { this.logicalCrop = undefined; return super.setCrop(); }
    this.logicalCrop = typeof x === 'number'
      ? { x, y: y ?? 0, width: width ?? 0, height: height ?? 0 }
      : { x: x.x, y: x.y, width: x.width, height: x.height };
    return this.applyLogicalCrop();
  }
  private applyLogicalCrop(): this {
    const rect = this.logicalCrop;
    if (!rect) return this;
    const r = this.frame.source.resolution;
    super.setCrop(rect.x * r, rect.y * r, rect.width * r, rect.height * r);
    // Phaser 4 делит размеры выреза на resolution, но прибавляет x/y без деления.
    // UV и размеры остаются в пикселях текстуры; смещение нормализуем отдельно.
    const crop = (this as unknown as { _crop: { x: number; y: number } })._crop;
    crop.x /= r; crop.y /= r;
    return this;
  }
  setContext(context: TextContext): this { this.localizationContext = context; return this.setText(this.sourceText); }
  setLocalizedBounds(bounds: LocalizedTextBounds): this {
    if (!(bounds.width > 0 && bounds.height > 0)) return this;
    this.sourceFontSize ??= parseFloat(String(this.style.fontSize));
    this.sourceWrapWidth ??= this.style.wordWrapWidth ?? 0;
    this.sourceLineSpacing ??= this.lineSpacing;
    this.fitBounds = { ...bounds }; this.fitTranslation(); return this;
  }
  override setFontSize(size: string | number): this {
    if (!this.fitting) this.sourceFontSize = parseFloat(String(size));
    return super.setFontSize(size);
  }
  override setWordWrapWidth(width: number, useAdvancedWrap?: boolean): this {
    if (!this.fitting) this.sourceWrapWidth = width;
    return super.setWordWrapWidth(width, useAdvancedWrap);
  }
  override setLineSpacing(value: number): this {
    if (!this.fitting) this.sourceLineSpacing = value;
    return super.setLineSpacing(value);
  }
  override updateText(): this {
    super.updateText();
    // updateText вызывается и при изменении переноса, отступов и гарнитуры.
    if (this.fitBounds && !this.fitting) this.fitTranslation();
    if (this.isCropped && !this.fitting) this.applyLogicalCrop();
    return this;
  }
  private fitTranslation(): void {
    if (!this.fitBounds || this.fitting || !this.sourceFontSize) return;
    this.fitting = true;
    try {
      const bounds = this.fitBounds, original = this.sourceFontSize;
      super.setText(translateText(this.sourceText, getLanguage(), this.localizationContext));
      super.setFontSize(original);
      const russian = getLanguage() === 'ru';
      if (this.sourceWrapWidth) super.setWordWrapWidth(russian
        ? Math.min(this.sourceWrapWidth, Math.max(1, bounds.width - (this.padding.left ?? 0) - (this.padding.right ?? 0))) : this.sourceWrapWidth);
      super.setLineSpacing(russian ? bounds.lineSpacing ?? this.sourceLineSpacing ?? 0 : this.sourceLineSpacing ?? 0);
      // EN всегда возвращается к исходному кеглю; строка sourceText не меняется.
      if (getLanguage() !== 'ru') return;
      const minimum = Math.min(original, bounds.minFontSize ?? 9);
      const fits = () => {
        // width/height у Text могут быть fixedSize: измеряем сами строки, не холст.
        const size = Phaser.GameObjects.GetTextSize(this, this.getTextMetrics(), this.getWrappedText());
        return size.width + (this.padding.left ?? 0) + (this.padding.right ?? 0) <= bounds.width
          && size.height + (this.padding.top ?? 0) + (this.padding.bottom ?? 0) <= bounds.height;
      };
      let size = original;
      while (!fits() && size > minimum) {
        size = Math.max(minimum, size - 0.5); super.setFontSize(size);
      }
      if (!fits() && bounds.ellipsis) {
        const full = this.text;
        // Обрезается лишь отображение; setText/переключение языка восстанавливает оригинал.
        const characters = Array.from(full);
        while (characters.length && !fits()) {
          characters.pop(); super.setText(characters.join('').trimEnd() + '…');
        }
      }
    } finally {
      this.fitting = false;
      if (this.isCropped) this.applyLogicalCrop();
    }
  }
  override setFontFamily(family: string): this {
    this.sourceFamily = family; return super.setFontFamily(localizedFont(family));
  }
}

export function contentText(label: Phaser.GameObjects.Text): Phaser.GameObjects.Text {
  return label instanceof LocalizedText ? label.setContext('content') : label;
}

export function localizedText(scene: Phaser.Scene, x: number, y: number, value: string | string[], style?: Phaser.Types.GameObjects.Text.TextStyle): Phaser.GameObjects.Text {
  const label = new LocalizedText(scene, x, y, value, style);
  scene.add.existing(label); return label;
}

/** Подгонка включается только для полей с известными границами; масштаб не искажается. */
export function fitLocalizedText(label: Phaser.GameObjects.Text, bounds: LocalizedTextBounds): Phaser.GameObjects.Text {
  return label instanceof LocalizedText ? label.setLocalizedBounds(bounds) : label;
}
