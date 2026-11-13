import Phaser from 'phaser';
import { localizedImage } from './localized-image.ts';
import type { LootViewManifest } from './loot-view.ts';

/**
 * Персонажи в левом верхнем углу городских окон — циклические клипы окна 1995 (глубина 11).
 * Координаты взяты из кадров соответствующих меню и заданы внутри окна; окно смещено на (menuX, −22),
 * как и статические панели, из которых эти клипы теперь исключены.
 */
const TOWN_NPCS = {
  mission: { clip: 'townNpcInn', x: 144, y: 84.4, scaleX: 0.998, scaleY: 0.998 },
  castle: { clip: 'townNpcCastle', x: 147, y: 85, scaleX: 0.998, scaleY: 0.998 },
  characters: { clip: 'townNpcBarrack', x: 146, y: 85, scaleX: 1.001, scaleY: 0.998 },
  // Окно снаряжения (кадр 71) использует того же персонажа, что и казарма.
  equipment: { clip: 'townNpcBarrack', x: 146, y: 85, scaleX: 1.001, scaleY: 0.998 },
  shop: { clip: 'townNpcSmithy', x: 144, y: 88, scaleX: 1.001, scaleY: 0.998 },
  medals: { clip: 'townNpcMuseum', x: 156, y: 84, scaleX: 1.001, scaleY: 0.998 },
} as const;
export type TownNpcTab = keyof typeof TOWN_NPCS;

/** Клип проигрывается по кругу с исходной частотой 30 кадров/с; таймер снимается вместе с окном. */
export function createTownNpc(scene: Phaser.Scene, manifest: LootViewManifest, tab: TownNpcTab, menuX: number, menuY: number): Phaser.GameObjects.Image | undefined {
  const placement = TOWN_NPCS[tab], asset = (manifest.clips as Record<string, LootViewManifest['clips'][string] & { count?: number }>)[placement.clip];
  if (!asset) return undefined;
  const npc = localizedImage(scene, menuX + placement.x, menuY + placement.y, placement.clip, '1')
    .setOrigin(asset.originX / asset.frameWidth, asset.originY / asset.frameHeight)
    .setScale(placement.scaleX, placement.scaleY).setName(`town-npc-${tab}`);
  const startedAt = scene.time.now;
  const timer = scene.time.addEvent({ delay: 1000 / 30, loop: true, callback: () => {
    if (!npc.active) return;
    npc.setFrame(String(Math.floor((scene.time.now - startedAt) / (1000 / 30)) % (asset.count ?? 1) + 1));
  } });
  npc.once(Phaser.GameObjects.Events.DESTROY, () => timer.remove());
  return npc;
}
