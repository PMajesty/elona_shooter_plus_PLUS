import Phaser from 'phaser';
import { originalTextArea } from './original-text-area.ts';
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
  let page = 4;
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
    content.removeAll(true); page = next;
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
      content.add(originalTextArea(scene, 'help-tips-text', layout.tips.join(''), x, y, width, height, scroll => changed(page, scroll)));
    }
    changed(page, 0);
  };
  draw(4); return root;
}
