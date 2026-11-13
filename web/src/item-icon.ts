import Phaser from 'phaser';
import { getLanguage } from './i18n.ts';
import { GRAPHIC_HEIGHT, GRAPHIC_WIDTH } from './shop-view.ts';
import { MISSING_MOD_ITEM_ID, modWeaponById } from './weapon-registry.ts';
import type { Item } from './items.ts';

/** Точка регистрации (исходные координаты Flash) и размер кадра атласа itemPicture. */
export interface ItemPictureAsset { originX: number; originY: number; frameWidth: number; frameHeight: number }

/** Формат значка мода: PNG 192×128, вдвое больше игровых 96×64. */
export const MOD_ICON_WIDTH = 192;
export const MOD_ICON_HEIGHT = 128;
/** Поля вокруг значка при загрузке — место для тени. */
export const MOD_ICON_PADDING = 16;
export const MISSING_ICON_TEXTURE = 'modicon:missing';

/** Размер значка в игровых координатах (для центрирования в ячейке, как исходные GRAPHIC_WIDTH/HEIGHT). */
export function itemIconSize(item: Readonly<Item>, asset: ItemPictureAsset): { width: number; height: number } {
  const icon = modWeaponById(item.id)?.icon;
  if (icon) return { width: icon.width, height: icon.height };
  if (item.id === MISSING_MOD_ITEM_ID) return { width: 48, height: 44 };
  return { width: GRAPHIC_WIDTH[item.graphic] ?? asset.frameWidth, height: GRAPHIC_HEIGHT[item.graphic] ?? asset.frameHeight };
}

/**
 * Делает изображение значком предмета с точкой регистрации в его позиции: исходные предметы — кадр itemPicture, оружие модов — текстура, созданная при загрузке (масштаб 0.5).
 * Вызывающему коду достаточно поставить изображение в прежнюю точку регистрации itemPicture.
 */
export function applyItemIcon(scene: Phaser.Scene, image: Phaser.GameObjects.Image, item: Readonly<Item>, asset: ItemPictureAsset): Phaser.GameObjects.Image {
  const icon = modWeaponById(item.id)?.icon;
  if (icon && scene.textures.exists(icon.texture)) {
    const source = scene.textures.get(icon.texture).getSourceImage() as { width: number; height: number };
    return image.setTexture(icon.texture).setOrigin(icon.originX / source.width, icon.originY / source.height).setScale(0.5);
  }
  if (item.id === MISSING_MOD_ITEM_ID && scene.textures.exists(MISSING_ICON_TEXTURE)) {
    // Квадрат 96×88 показывается как 48×44 с точкой регистрации в левом верхнем углу — как в itemIconSize.
    return image.setTexture(MISSING_ICON_TEXTURE).setOrigin(0, 0).setScale(0.5);
  }
  // Как localizedImage: русский атлас itemPicture, если он загружен.
  const texture = getLanguage() === 'ru' && scene.textures.exists('ru:itemPicture') ? 'ru:itemPicture' : 'itemPicture';
  const frame = scene.textures.get(texture).has(String(item.graphic)) ? String(item.graphic) : '1';
  return image.setTexture(texture, frame).setOrigin(asset.originX / asset.frameWidth, asset.originY / asset.frameHeight).setScale(1);
}

/** Создаёт значок предмета с точкой регистрации в (x, y). */
export function createItemIcon(scene: Phaser.Scene, x: number, y: number, item: Readonly<Item>, asset: ItemPictureAsset): Phaser.GameObjects.Image {
  return applyItemIcon(scene, scene.add.image(x, y, 'itemPicture', '1'), item, asset);
}

/**
 * Превращает значок мода (192×128, прозрачный фон) в текстуру: добавляет исходную тень, находит границы рисунка и точку регистрации.
 * Рисунок исходных значков начинается примерно в 5 px правее точки регистрации, а его центр на 23 px ниже; значки модов ставятся так же.
 */
export function prepareModIcon(image: CanvasImageSource): { canvas: HTMLCanvasElement; width: number; height: number; originX: number; originY: number } | null {
  const art = document.createElement('canvas');
  art.width = MOD_ICON_WIDTH; art.height = MOD_ICON_HEIGHT;
  const artContext = art.getContext('2d', { willReadFrequently: true })!;
  artContext.drawImage(image, 0, 0);
  const pixels = artContext.getImageData(0, 0, MOD_ICON_WIDTH, MOD_ICON_HEIGHT).data;
  let left = MOD_ICON_WIDTH, top = MOD_ICON_HEIGHT, right = -1, bottom = -1;
  for (let y = 0; y < MOD_ICON_HEIGHT; y++) for (let x = 0; x < MOD_ICON_WIDTH; x++) {
    if (pixels[(y * MOD_ICON_WIDTH + x) * 4 + 3] > 8) { left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y); }
  }
  if (right < 0) return null;
  const canvas = document.createElement('canvas');
  canvas.width = MOD_ICON_WIDTH + MOD_ICON_PADDING * 2; canvas.height = MOD_ICON_HEIGHT + MOD_ICON_PADDING * 2;
  const context = canvas.getContext('2d')!;
  // Та же тень вправо-вниз, что у исходных значков (при масштабе 1 смещение 3, размытие около 2 px).
  context.shadowColor = 'rgba(0, 0, 0, 0.85)'; context.shadowOffsetX = 6; context.shadowOffsetY = 6; context.shadowBlur = 6;
  context.drawImage(art, MOD_ICON_PADDING, MOD_ICON_PADDING);
  const width = (right - left + 1) / 2, height = (bottom - top + 1) / 2;
  return {
    canvas, width, height,
    originX: MOD_ICON_PADDING + left - 10,
    originY: MOD_ICON_PADDING + (top + bottom + 1) / 2 - 46,
  };
}

/** Значок заглушки отсутствующего мода: серый квадрат с вопросительным знаком. */
export function createMissingIcon(scene: Phaser.Scene): void {
  if (scene.textures.exists(MISSING_ICON_TEXTURE)) return;
  const canvas = document.createElement('canvas');
  canvas.width = 96; canvas.height = 88;
  const context = canvas.getContext('2d')!;
  // Квадрат около 32×32 в игровых координатах с центром в (24, 23) от точки регистрации, как у исходных значков.
  context.fillStyle = 'rgba(80, 70, 60, 0.85)'; context.fillRect(16, 14, 64, 64);
  context.strokeStyle = '#d8c8a0'; context.lineWidth = 3; context.strokeRect(16, 14, 64, 64);
  context.fillStyle = '#f0e6c8'; context.font = 'bold 48px serif'; context.textAlign = 'center'; context.textBaseline = 'middle';
  context.fillText('?', 48, 46);
  scene.textures.addCanvas(MISSING_ICON_TEXTURE, canvas);
}
