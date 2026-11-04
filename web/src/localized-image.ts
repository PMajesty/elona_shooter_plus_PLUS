import type Phaser from 'phaser';
import { getLanguage, onLanguageChanged } from './i18n.ts';

/** Локализованные атласы сохраняют регистрацию и размеры каждого исходного кадра. */
export function localizedImage(scene: Phaser.Scene, x: number, y: number, key: string, frame?: string | number): Phaser.GameObjects.Image {
  const translated = `ru:${key}`;
  const available = scene.textures.exists(translated);
  const object = scene.add.image(x, y, available && getLanguage() === 'ru' ? translated : key, frame);
  if (!available) return object;
  let sourceKey = key;
  const setTexture = object.setTexture.bind(object);
  object.setTexture = (texture: string, nextFrame?: string | number) => {
    sourceKey = texture.startsWith('ru:') ? texture.slice(3) : texture;
    return setTexture(getLanguage() === 'ru' && scene.textures.exists(`ru:${sourceKey}`) ? `ru:${sourceKey}` : sourceKey, nextFrame);
  };
  const unsubscribe = onLanguageChanged(() => object.setTexture(sourceKey, object.frame.name));
  object.once('destroy', unsubscribe); return object;
}
