import type Phaser from 'phaser';

interface ButtonAsset { width: number; height: number; hitMask?: string }
const shapes = new WeakMap<ButtonAsset, string>();

/** У Flash отдельный HitTest-кадр: смена рисунка под мышью не меняет область нажатия. */
export function buttonInput(asset: ButtonAsset, useHandCursor = true): Phaser.Types.Input.InputConfiguration {
  if (!asset.hitMask) return { useHandCursor, pixelPerfect: true, alphaTolerance: 100 };
  let bits = shapes.get(asset);
  if (bits === undefined) { bits = atob(asset.hitMask); shapes.set(asset, bits); }
  const mask = bits, stride = Math.ceil(asset.width / 8);
  return { useHandCursor, hitArea: asset, hitAreaCallback: (_area, x, y) => {
    if (x < 0 || y < 0 || x >= asset.width || y >= asset.height) return false;
    const px = Math.floor(x);
    return (mask.charCodeAt(Math.floor(y) * stride + (px >> 3)) & (128 >> (px & 7))) !== 0;
  } };
}

/** После смены панели Phaser уже знает порядок слоёв. Пересчитываем наведение даже без движения мыши. */
export function refreshMenuHover(scene: Phaser.Scene): void {
  scene.events.once('render', () => {
    const input = scene.input, pointer = input.activePointer;
    if (!input.manager.isOver || pointer.wasTouch) return;
    const rate = input.pollRate;
    input.setPollAlways();
    input.updatePoll(scene.time.now, 0);
    input.setPollRate(rate);
    // Phaser сбрасывает системный курсор при уничтожении даже соседней кнопки.
    const top = input.sortGameObjects(input.hitTestPointer(pointer), pointer)[0];
    if (top?.input?.cursor) input.setCursor(top.input);
  });
}
