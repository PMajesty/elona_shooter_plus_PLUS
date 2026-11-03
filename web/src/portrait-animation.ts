import type Phaser from 'phaser';

/** ally2/ally3/ally4: stand8–11 = pic*10+5, stand12–15 = pic*10+6. */
export function animateStandingPortraits(scene: Phaser.Scene, owner: Phaser.GameObjects.Container,
  bodies: readonly { image: Phaser.GameObjects.Image; appearance: number }[], changed?: (pose: number) => void): void {
  let pose = 5;
  changed?.(pose);
  const timer = scene.time.addEvent({ delay: 1000 * 4 / 30, loop: true, callback: () => {
    pose = pose === 5 ? 6 : 5;
    for (const body of bodies) body.image.setFrame(String(body.appearance * 10 + pose));
    changed?.(pose);
  } });
  owner.once('destroy', () => timer.remove());
}
