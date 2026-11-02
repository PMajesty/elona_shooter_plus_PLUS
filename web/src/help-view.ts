import Phaser from 'phaser';
import type { LootViewManifest } from './loot-view.ts';

interface Placement { x: number; y: number; scaleX: number; scaleY: number }
export interface HelpLayout {
  position: { x: number; y: number };
  pages: { image: string; children: Record<string, Placement> }[];
  tips: string[]; links: Record<string, string>;
  textAreaBase: { width: number; height: number };
}

/** Четыре исходных кадра help1–4; динамический TextArea заменяется прокруткой на canvas. */
export function createHelpView(scene: Phaser.Scene, manifest: LootViewManifest, layout: HelpLayout,
  close: () => void, changed: (page: number, scroll: number) => void, click: () => void): Phaser.GameObjects.Container {
  const root = scene.add.container(0, 0).setName('original-help');
  const shade = scene.add.rectangle(0, 0, 620, 380, 0, 0.45).setOrigin(0).setInteractive(); root.add(shade);
  shade.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => { e.stopPropagation(); click(); close(); });
  const content = scene.add.container(0, 0); root.add(content);
  let page = 4, scroll = 0, maxScroll = 0;
  let setScroll = (_value: number) => {};
  let viewport = { x: 0, y: 0, width: 0, height: 0 };
  const image = (key: string, p: Placement) => {
    const a = manifest.images[key];
    const object = scene.add.image(layout.position.x + p.x, layout.position.y + p.y, key)
      .setOrigin(a.originX / a.width, a.originY / a.height).setScale(p.scaleX, p.scaleY);
    content.add(object); return object;
  };
  const button = (key: string, p: Placement, action: () => void) => {
    const object = image(key, p).setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 100 });
    object.on('pointerover', () => object.setTexture(`${key}_over`)); object.on('pointerout', () => object.setTexture(key));
    object.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
      e.stopPropagation(); click(); action();
    });
    return object;
  };
  const draw = (next: number) => {
    content.removeAll(true); page = next; scroll = maxScroll = 0; setScroll = () => {};
    const data = layout.pages[page - 1];
    image(data.image, { x: 0, y: 0, scaleX: 1, scaleY: 1 });
    for (const [part, key, number] of [['help1', 'button_helpBattle', 1], ['help2', 'button_helpTown', 2],
      ['help3', 'button_helpCredits', 3], ['help4', 'button_helpTips', 4]] as const) {
      button(key, data.children[part], () => draw(number)).setName(`help-page-${number}`);
    }
    if (page === 3) {
      for (const [index, url] of Object.entries(layout.links)) {
        const p = data.children[`link${index}`];
        if (p) button('button_helpLink', p, () => window.open(url, '_blank', 'noopener,noreferrer')).setName(`help-credit-${index}`);
      }
    }
    if (page === 4) {
      const p = data.children.help;
      const x = layout.position.x + p.x, y = layout.position.y + p.y;
      const width = layout.textAreaBase.width * p.scaleX, height = layout.textAreaBase.height * p.scaleY;
      viewport = { x, y, width, height };
      content.add(scene.add.nineslice(x, y, 'helpTextAreaSkin', '1', width, height, 2, 2, 2, 2).setOrigin(0));
      const field = scene.add.text(x + 4, y + 4, layout.tips.join(''), {
        fontFamily: 'Arial', fontSize: '12px', color: '#000000', wordWrap: { width: width - 25 },
      }).setName('help-tips-text').setCrop(0, 0, width - 22, height - 8); content.add(field);
      maxScroll = Math.max(0, field.height - height + 8);
      const zone = scene.add.zone(x, y, width, height).setOrigin(0).setInteractive(); content.add(zone);
      zone.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => e.stopPropagation());
      const scrollX = x + width - 15, trackTop = y + 15, trackHeight = height - 30;
      content.add(scene.add.rectangle(scrollX, trackTop, 15, trackHeight, 0xe6e6e6).setOrigin(0));
      const thumbHeight = Math.min(trackHeight, Math.max(18, trackHeight * height / (height + maxScroll)));
      const thumb = scene.add.nineslice(scrollX, trackTop, 'helpScrollThumb', '1', 15, thumbHeight, 2, 2, 2, 2).setOrigin(0).setInteractive({ useHandCursor: true }); content.add(thumb);
      const travel = trackHeight - thumbHeight;
      setScroll = value => {
        scroll = Phaser.Math.Clamp(value, 0, maxScroll); field.y = y + 4 - scroll;
        // GeometryMask в Phaser4 действует только в Canvas; crop работает и в WebGL.
        field.setCrop(0, scroll, width - 22, height - 8);
        thumb.y = trackTop + (maxScroll ? travel * scroll / maxScroll : 0); changed(page, scroll);
      };
      const track = scene.add.zone(scrollX, trackTop, 15, trackHeight).setOrigin(0).setInteractive(); content.addAt(track, content.getIndex(thumb));
      track.on('pointerdown', (pointer: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
        e.stopPropagation(); setScroll(scroll + (pointer.y < thumb.y ? -1 : 1) * (height - 12));
      });
      scene.input.setDraggable(thumb);
      thumb.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => e.stopPropagation());
      thumb.on('drag', (_p: Phaser.Input.Pointer, _dx: number, dy: number) => setScroll(travel ? (dy - trackTop) * maxScroll / travel : 0));
      for (const [key, arrowY, direction] of [['helpScrollUp', y, -1], ['helpScrollDown', y + height - 15, 1]] as const) {
        const arrow = scene.add.image(scrollX, arrowY, key, '1').setOrigin(0).setInteractive({ useHandCursor: true }); content.add(arrow);
        arrow.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => { e.stopPropagation(); setScroll(scroll + direction * 36); });
      }
    }
    changed(page, scroll);
  };
  const wheel = (pointer: Phaser.Input.Pointer, _over: Phaser.GameObjects.GameObject[], _dx: number, dy: number) => {
    if (page === 4 && Phaser.Geom.Rectangle.Contains(new Phaser.Geom.Rectangle(viewport.x, viewport.y, viewport.width, viewport.height), pointer.x, pointer.y)) setScroll(scroll + dy);
  };
  const keyboard = (event: KeyboardEvent) => {
    if (page !== 4 || !['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    setScroll(event.key === 'Home' ? 0 : event.key === 'End' ? maxScroll
      : scroll + (event.key === 'ArrowUp' ? -36 : event.key === 'ArrowDown' ? 36 : event.key === 'PageUp' ? -viewport.height : viewport.height));
  };
  scene.input.on('wheel', wheel); scene.input.keyboard?.on('keydown', keyboard);
  root.once('destroy', () => { scene.input.off('wheel', wheel); scene.input.keyboard?.off('keydown', keyboard); });
  draw(4); return root;
}
