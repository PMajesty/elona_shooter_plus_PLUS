import { localizedImage } from './localized-image.ts';
import { localizedText, fitLocalizedText } from './localized-text.ts';
import { buttonInput, refreshMenuHover } from './button-input.ts';
import Phaser from 'phaser';
import { bindTouchSafeDismiss } from './touch-scroll.ts';
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
  // Справка в оригинале не затемняет фон, а размывает снимок (makeBlurScreen, его подкладывает сцена); прозрачный слой только закрывает справку щелчком мимо.
  const shade = scene.add.rectangle(0, 0, 620, 380, 0, 0).setOrigin(0).setInteractive(); root.add(shade);
  bindTouchSafeDismiss(scene, root, shade, () => { click(); close(); });
  // window4_mc (страница и четыре вкладки) въезжает справа целиком; слой и размытый снимок остаются на месте.
  const panel = scene.add.container(0, 0).setName('help-window'); root.add(panel);
  const content = scene.add.container(0, 0); panel.add(content);
  let page = 4;
  const image = (key: string, p: Placement) => {
    const a = manifest.images[key];
    const object = localizedImage(scene, layout.position.x + p.x, layout.position.y + p.y, key)
      .setOrigin(a.originX / a.width, a.originY / a.height).setScale(p.scaleX, p.scaleY);
    content.add(object); return object;
  };
  const button = (key: string, p: Placement, action: () => void) => {
    const object = image(key, p).setInteractive(buttonInput(manifest.images[key]));
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
    if (page === 3) {
      const source = fitLocalizedText(localizedText(scene, layout.position.x + 146, layout.position.y + 308,
        'Game: Noa · Plus contributors · Free AI vibe-port · Source on GitHub',
        { resolution: 2, fontFamily: 'Arial', fontSize: '12px', color: '#352317' }), { width: 398, height: 18 });
      source.setName('help-port-source').setInteractive({ useHandCursor: true });
      source.on('pointerover', () => source.setColor('#0000cc'));
      source.on('pointerout', () => source.setColor('#352317'));
      source.on('pointerdown', () => window.open('https://github.com/PMajesty/elona_shooter_plus_PLUS', '_blank', 'noopener,noreferrer'));
      content.add(source);
      for (const [index, url] of Object.entries(layout.links)) {
        const p = data.children[`link${index}`];
        if (p) button('button_helpLink', p, () => window.open(url, '_blank', 'noopener,noreferrer')).setName(`help-credit-${index}`);
      }
    }
    if (page === 4) {
      const p = data.children.help;
      const x = layout.position.x + p.x, y = layout.position.y + p.y;
      const width = layout.textAreaBase.width * p.scaleX, height = layout.textAreaBase.height * p.scaleY;
      const editions = '<b>Browser editions (fan additions)</b><br>'
        + 'Classic keeps the original game with port bug fixes. Expanded enables optional new features. Choose an edition before New Game; Continue uses the saved edition. Each edition has its own medals. Use an empty save slot to keep another adventure.<br><br>'
        + 'Expanded: companions start in Smart Mode. They protect the wall, seek ranged foes and spread their fire. Switching aim farther takes longer, and damage is reduced by 25%. Bosses and the last enemy can draw shared fire. Change companion orders in Barrack, or the hired gun order at the Inn. Saved order choices are kept.<br><br>';
      content.add(originalTextArea(scene, 'help-tips-text', editions + layout.tips.join(''), x, y, width, height, scroll => changed(page, scroll)));
    }
    changed(page, 0);
    refreshMenuHover(scene);
  };
  draw(4);
  for (const [part, key, number] of [['help1', 'button_helpBattle', 1], ['help2', 'button_helpTown', 2],
    ['help3', 'button_helpCredits', 3], ['help4', 'button_helpTips', 4]] as const) {
    panel.add(button(key, layout.pages[0].children[part], () => draw(number)).setName(`help-page-${number}`));
  }
  return root;
}
