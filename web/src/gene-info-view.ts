import Phaser from 'phaser';
import { HERO_CLASSES, type HeroClass } from './hero-classes.ts';
import { ALL_TRAITS } from './party-progression.ts';
import { describeTrait, type TraitLevels } from './progression.ts';
import type { LootViewManifest } from './loot-view.ts';
import type { TownLayout } from './town-view.ts';
import type { PartyLayout } from './party-view.ts';

export interface GeneHint { name: string; description: string; effect: string }

/** Исходные строки updateGene и окно hint1657; просмотр не меняет героя или RNG. */
export function createGeneInfoView(scene: Phaser.Scene, manifest: LootViewManifest, layout: TownLayout & PartyLayout,
  changed: (hint: GeneHint | null) => void) {
  const root = scene.add.container(0, 0).setName('gene-info');
  const rows = scene.add.container(0, 0); root.add(rows);
  const hint = scene.add.container(231, 36).setVisible(false); root.add(hint);
  const panel = layout.medals, asset = manifest.images[panel.hintImage];
  hint.add(scene.add.image(-asset.originX, -asset.originY, panel.hintImage).setOrigin(0));
  const field = (key: string) => {
    const p = panel.hintChildren[key], spec = p.text!;
    const object = scene.add.text(p.x, p.y, '', { fontFamily: 'ElonaMenu', fontSize: `${spec.fontSize}px`, color: spec.color,
      wordWrap: { width: spec.bounds[2] - spec.bounds[0] }, padding: { x: 1, y: 1 } }).setScale(p.scaleX, p.scaleY);
    hint.add(object); return object;
  };
  const name = field('itemName'), description = field('itemDesc'), effect = field('itemDesc2');
  const hide = () => { hint.setVisible(false); changed(null); };
  const show = (info: GeneHint) => {
    name.setText(info.name); description.setText(info.description); effect.setText(info.effect);
    effect.setY(Math.max(panel.hintChildren.itemDesc2.y, description.y + description.height + 3));
    hint.setVisible(true); root.bringToTop(hint); root.parentContainer?.bringToTop(root); changed(info);
  };
  const update = (traits: Readonly<TraitLevels>) => {
    hide(); rows.removeAll(true);
    const ids = Object.keys(traits).map(Number).filter(id => traits[id] > 0 && id !== 900 && id !== 901 && ALL_TRAITS[id]);
    const baseSkill = (id: number) => id >= 102 && id <= 106;
    const priority = (id: number) => id < 100 ? 100000 + id : baseSkill(id) ? 70000 + id : ALL_TRAITS[id].party ? 10000 + id : 50000 - id;
    ids.sort((a, b) => priority(b) - priority(a));
    ids.forEach((id, index) => {
      const definition = ALL_TRAITS[id], level = traits[id], x = 271 + Math.trunc(index / 4) * 130, y = 218 + index % 4 * 18;
      const base = id < 100 || baseSkill(id), part = layout.partyTrait.children, icon = part.icon, atlas = manifest.clips.partyTraitIcon;
      rows.add(scene.add.image(x + icon.x, y + icon.y, 'partyTraitIcon', base ? '2' : definition.party ? '3' : '1')
        .setOrigin(atlas.originX / atlas.frameWidth, atlas.originY / atlas.frameHeight).setScale(icon.scaleX, icon.scaleY));
      rows.add(scene.add.text(x + part.traitName.x, y + part.traitName.y, `${definition.name}${level > 1 ? ` ${level}` : ''}`,
        { fontFamily: 'ElonaMenu', fontSize: '13px', color: base ? '#044010' : '#000000', padding: { x: 1, y: 1 } }));
      const hit = scene.add.zone(x, y, 130, 18).setOrigin(0).setInteractive().setName(`gene-trait-${id}`); rows.add(hit);
      hit.on('pointerover', () => show({ name: `${definition.name} ${level}`, description: definition.description,
        effect: id < 100 ? '' : describeTrait(id, traits, ALL_TRAITS).currentEffect }));
      hit.on('pointerout', hide);
    });
    return ids;
  };
  const showClass = (id: HeroClass, unlocked: boolean) => show({ name: unlocked ? HERO_CLASSES[id].name : '??????',
    description: unlocked ? HERO_CLASSES[id].description : 'You need to win a medal to play this class.', effect: '' });
  return { root, update, showClass, hide };
}
