import Phaser from 'phaser';
import { describeTrait, type TraitLevels } from './progression.ts';
import { ALL_TRAITS } from './party-progression.ts';
import type { LootViewManifest } from './loot-view.ts';

export interface SkillViewState { skillChoices: readonly number[]; player: { traits: TraitLevels } }
export interface SkillViewCallbacks { choose(id: number): boolean; select?(id: number): void }

/** Выбор сохраняется только кнопкой Proceed; просмотр описания не тратит очко навыка. */
export function createSkillView(scene: Phaser.Scene, state: SkillViewState, manifest: LootViewManifest, callbacks: SkillViewCallbacks): Phaser.GameObjects.Container {
  const root = scene.add.container(-15.587619764971691, 0);
  root.setName('skill-choice-view');
  const image = (key: string, x: number, y: number) => {
    const asset = manifest.images[key];
    const object = scene.add.image(x - asset.originX, y - asset.originY, key).setOrigin(0);
    root.add(object); return object;
  };
  const text = (x: number, y: number, value: string, width: number, color = '#000000') => {
    const object = scene.add.text(x, y, value, { fontFamily: 'ElonaMenu', fontSize: '12px', color, wordWrap: { width }, padding: { x: 1, y: 1 } }).setLineSpacing(2);
    root.add(object); return object;
  };
  image('level', 0, 0);
  const description = text(263, 170, 'Please choose a skill you want to learn or improve.', 247);
  const current = text(297, 213.1, '', 221);
  const next = text(297, 229, '', 218, '#000099');
  const radios: Phaser.GameObjects.Image[] = [];
  let selected: number | undefined;
  const proceed = image('button_proceed', 259, 252).setVisible(false);
  proceed.setName('skill-proceed').setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 100 });
  proceed.on('pointerover', () => { if (manifest.images.button_proceed_over) proceed.setTexture('button_proceed_over'); });
  proceed.on('pointerout', () => proceed.setTexture('button_proceed'));
  proceed.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
    event.stopPropagation();
    if (selected !== undefined) callbacks.choose(selected);
  });
  state.skillChoices.forEach((id, index) => {
    const info = describeTrait(id, state.player.traits, ALL_TRAITS);
    const y = 180 + index * 20;
    const asset = manifest.clips.radioButton;
    const radio = scene.add.image(158 - asset.originX, y - asset.originY, 'radioButton', '1').setOrigin(0);
    radios.push(radio); root.add(radio);
    const label = scene.add.text(172, y - 7, info.name, { fontFamily: 'ElonaMenu', fontSize: '13px', color: '#000000', padding: { x: 1, y: 1 } }).setFixedSize(89, 20);
    root.add(label);
    if (!info.canImprove) { radio.setAlpha(0.5); label.setAlpha(0.5); }
    const hit = scene.add.zone(148, y - 9, 113, 20).setOrigin(0).setInteractive({ useHandCursor: true });
    hit.setName(`skill-choice-${id}`); root.add(hit);
    hit.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      selected = id;
      radios.forEach((button, selectedIndex) => button.setFrame(selectedIndex === index ? '2' : '1'));
      description.setText(info.description); current.setText(info.currentEffect); next.setText(info.nextEffect);
      proceed.setVisible(info.canImprove); root.setData('selectedTrait', id);
      callbacks.select?.(id);
      if (scene.cache.audio.exists('soundClick1')) scene.sound.play('soundClick1', { volume: 0.7 });
    });
  });
  return root;
}
