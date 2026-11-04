import { localizedImage } from './localized-image.ts';
import { localizedText, fitLocalizedText } from './localized-text.ts';
import Phaser from 'phaser';
import { HERO_CLASSES, type HeroClass } from './hero-classes.ts';
import { ALL_TRAITS } from './party-progression.ts';
import type { TraitLevels } from './progression.ts';
import { traitHintValues, type OriginalHintInfo } from './trait-hint.ts';
import { createOriginalHintView } from './original-hint-view.ts';
import type { LootViewManifest } from './loot-view.ts';
import type { TownLayout } from './town-view.ts';
import type { PartyLayout } from './party-view.ts';

export type GeneHint = OriginalHintInfo;

/** Исходные строки updateGene и окно hint1657; просмотр не меняет героя или RNG. */
export function createGeneInfoView(scene: Phaser.Scene, manifest: LootViewManifest, layout: TownLayout & PartyLayout,
  changed: (hint: GeneHint | null) => void) {
  const root = scene.add.container(0, 0).setName('gene-info');
  const rows = scene.add.container(0, 0); root.add(rows);
  const hint = createOriginalHintView(scene, manifest, layout.medals, changed);
  hint.root.setPosition(231, 36); root.add(hint.root);
  const hide = hint.hide;
  const show = (info: GeneHint) => { root.parentContainer?.bringToTop(root); hint.show(info); };
  const update = (traits: Readonly<TraitLevels>) => {
    hide(); rows.removeAll(true);
    const ids = Object.keys(traits).map(Number).filter(id => traits[id] > 0 && id !== 900 && id !== 901 && ALL_TRAITS[id]);
    const priority = (id: number) => id < 100 ? 100000 + id : id >= 900 ? 70000 + id : ALL_TRAITS[id].party ? 10000 + id : 50000 - id;
    ids.sort((a, b) => priority(b) - priority(a));
    ids.forEach((id, index) => {
      const definition = ALL_TRAITS[id], level = traits[id], x = 271 + Math.trunc(index / 4) * 130, y = 218 + index % 4 * 18;
      const base = id < 100 || id >= 900, part = layout.partyTrait.children, icon = part.icon, atlas = manifest.clips.partyTraitIcon;
      rows.add(localizedImage(scene, x + icon.x, y + icon.y, 'partyTraitIcon', base ? '2' : definition.party ? '3' : '1')
        .setOrigin(atlas.originX / atlas.frameWidth, atlas.originY / atlas.frameHeight).setScale(icon.scaleX, icon.scaleY));
      rows.add(fitLocalizedText(localizedText(scene, x + part.traitName.x, y + part.traitName.y, `${definition.name}${level > 1 ? ` ${level}` : ''}`,
        { resolution: 2, fontFamily: 'ElonaMenu', fontSize: '13px', color: base ? '#044010' : '#000000', padding: { x: 1, y: 1 } }), { width: 130 - part.traitName.x, height: 18, ellipsis: true }));
      const hit = scene.add.zone(x, y, 130, 18).setOrigin(0).setInteractive().setName(`gene-trait-${id}`); rows.add(hit);
      hit.on('pointerover', () => show(traitHintValues(id, traits)));
      hit.on('pointerout', hide);
    });
    return ids;
  };
  const showClass = (id: HeroClass, unlocked: boolean) => show({ name: unlocked ? HERO_CLASSES[id].name : '??????',
    description: unlocked ? HERO_CLASSES[id].description : 'You need to win a medal to play this class.', effect: '' });
  return { root, update, showClass, hide };
}
