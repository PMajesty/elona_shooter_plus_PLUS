import Phaser from 'phaser';
import { bindTouchScroll } from './touch-scroll.ts';

/** Исходное поле Flash с прокруткой в координатах игрового окна. */
export function originalTextArea(scene: Phaser.Scene, name: string, text: string, x: number, y: number, width: number, height: number,
  changed?: (value: number) => void): Phaser.GameObjects.Container {
  const content = scene.add.container(0, 0);
  let scroll = 0;
  content.add(scene.add.nineslice(x, y, 'helpTextAreaSkin', '1', width, height, 2, 2, 2, 2).setOrigin(0));
  const field = scene.add.text(x + 4, y + 4, text, {
    fontFamily: 'Arial', fontSize: '12px', color: '#000000', wordWrap: { width: width - 25 },
  }).setName(name).setCrop(0, 0, width - 22, height - 8); content.add(field);
  const maxScroll = Math.max(0, field.height - height + 8);
  const zone = scene.add.zone(x, y, width, height).setOrigin(0).setInteractive(); content.add(zone);
  zone.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => e.stopPropagation());
  if (!maxScroll) return content;
  const scrollX = x + width - 15, trackTop = y + 15, trackHeight = height - 30;
  content.add(scene.add.rectangle(scrollX, trackTop, 15, trackHeight, 0xe6e6e6).setOrigin(0));
  const thumbHeight = Math.min(trackHeight, Math.max(18, trackHeight * height / (height + maxScroll)));
  const thumb = scene.add.nineslice(scrollX, trackTop, 'helpScrollThumb', '1', 15, thumbHeight, 2, 2, 2, 2).setOrigin(0).setInteractive({ useHandCursor: true }); content.add(thumb);
  const travel = trackHeight - thumbHeight;
  const setScroll = (value: number) => {
    scroll = Phaser.Math.Clamp(value, 0, maxScroll); field.y = y + 4 - scroll;
    // GeometryMask в Phaser4 действует только в Canvas; crop работает и в WebGL.
    field.setCrop(0, scroll, width - 22, height - 8);
    thumb.y = trackTop + (maxScroll ? travel * scroll / maxScroll : 0); changed?.(scroll);
  };
  bindTouchScroll(scene, content, zone, () => scroll, setScroll);
  const track = scene.add.zone(scrollX, trackTop, 15, trackHeight).setOrigin(0).setInteractive(); content.addAt(track, content.getIndex(thumb));
  track.on('pointerdown', (pointer: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
    e.stopPropagation(); setScroll(scroll + (pointer.worldY < thumb.y ? -1 : 1) * (height - 12));
  });
  scene.input.setDraggable(thumb);
  thumb.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => e.stopPropagation());
  thumb.on('drag', (_p: Phaser.Input.Pointer, _dx: number, dy: number) => setScroll(travel ? (dy - trackTop) * maxScroll / travel : 0));
  for (const [key, arrowY, direction] of [['helpScrollUp', y, -1], ['helpScrollDown', y + height - 15, 1]] as const) {
    const arrow = scene.add.image(scrollX, arrowY, key, '1').setOrigin(0).setInteractive({ useHandCursor: true }); content.add(arrow);
    arrow.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => { e.stopPropagation(); setScroll(scroll + direction * 36); });
  }
  const wheel = (pointer: Phaser.Input.Pointer, _over: Phaser.GameObjects.GameObject[], _dx: number, dy: number) => {
    const point = (pointer.camera ?? scene.cameras.main).getWorldPoint(pointer.x, pointer.y);
    if (zone.getBounds().contains(point.x, point.y)) setScroll(scroll + dy);
  };
  const keyboard = (event: KeyboardEvent) => {
    if (!['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    setScroll(event.key === 'Home' ? 0 : event.key === 'End' ? maxScroll
      : scroll + (event.key === 'ArrowUp' ? -36 : event.key === 'ArrowDown' ? 36 : event.key === 'PageUp' ? -height : height));
  };
  scene.input.on('wheel', wheel); scene.input.keyboard?.on('keydown', keyboard);
  const cleanup = () => {
    scene.input.off('wheel', wheel); scene.input.keyboard?.off('keydown', keyboard);
    scene.events.off('shutdown', cleanup); content.off('destroy', cleanup);
  };
  content.once('destroy', cleanup); scene.events.once('shutdown', cleanup);
  return content;
}
