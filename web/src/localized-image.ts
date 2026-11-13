import type Phaser from 'phaser';
import { getLanguage, onLanguageChanged } from './i18n.ts';

/** Ключ текстуры с надписями текущего языка; если её нет — английский оригинал. */
export function localizedTextureKey(scene: Phaser.Scene, key: string): string {
  const language = getLanguage();
  if (language === 'en') return key;
  const translated = `${language}:${key}`;
  return scene.textures.exists(translated) ? translated : key;
}

/** Убирает языковой префикс и возвращает ключ английской текстуры. */
export function sourceTextureKey(texture: string): string {
  return texture.replace(/^(?:ru|zh):/, '');
}

/** Локализованные атласы сохраняют регистрацию и размеры каждого исходного кадра. */
export function localizedImage(scene: Phaser.Scene, x: number, y: number, key: string, frame?: string | number): Phaser.GameObjects.Image {
  const available = scene.textures.exists(`ru:${key}`) || scene.textures.exists(`zh:${key}`);
  const object = scene.add.image(x, y, localizedTextureKey(scene, key), frame);
  if (!available) return object;
  let sourceKey = key;
  const setTexture = object.setTexture.bind(object);
  object.setTexture = (texture: string, nextFrame?: string | number) => {
    sourceKey = sourceTextureKey(texture);
    return setTexture(localizedTextureKey(scene, sourceKey), nextFrame);
  };
  const unsubscribe = onLanguageChanged(() => object.setTexture(sourceKey, object.frame.name));
  object.once('destroy', unsubscribe); return object;
}
