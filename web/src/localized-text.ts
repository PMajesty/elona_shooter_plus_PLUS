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
  // Text хранит текстуру в resolution-раз большем размере, а поля заданы в координатах игры.
  override setCrop(x?: number | Phaser.Geom.Rectangle, y?: number, width?: number, height?: number): this {
    if (x === undefined) return super.setCrop();
    const r = this.style.resolution;
    if (typeof x !== 'number') return super.setCrop(x.x * r, x.y * r, x.width * r, x.height * r);
    return super.setCrop(x * r, (y ?? 0) * r, (width ?? 0) * r, (height ?? 0) * r);
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
    } finally { this.fitting = false; }
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
