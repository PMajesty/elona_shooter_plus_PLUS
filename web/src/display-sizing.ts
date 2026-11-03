import type Phaser from 'phaser';

/** Целый масштаб сохраняет пиксели исходного холста; маленькие окна продолжают уменьшаться. */
export function configureDisplaySizing(scene: Phaser.Scene, root: HTMLElement, lowQuality: () => boolean): () => void {
  const { scale } = scene;
  const sync = () => {
    const { width, height } = scale.displaySize;
    root.style.setProperty('--canvas-width', `${width}px`);
    root.style.setProperty('--canvas-height', `${height}px`);
    root.dataset.displayScale = String(width / 620);
  };
  const resize = () => {
    const bounds = root.getBoundingClientRect();
    const zoom = Math.max(1, Math.floor(Math.min(bounds.width / 620, bounds.height / 380) + 1e-7));
    scale.displaySize.setMax(620 * zoom, 380 * zoom);
    // При увеличении шрифты рисуются в реальных пикселях. Мир и зоны ввода остаются 620 × 380.
    const density = Math.min(zoom, bounds.width / 620, bounds.height / 380) * window.devicePixelRatio;
    const backing = !lowQuality() && density >= 1.5 ? 2 : 1;
    if (scale.gameSize.width !== 620 * backing) scale.setGameSize(620 * backing, 380 * backing);
    scene.cameras.main.setOrigin(0, 0).setZoom(backing);
    scale.setParentSize(bounds.width, bounds.height);
    sync();
  };
  scale.on('resize', sync);
  scene.events.on('display-quality', resize);
  window.addEventListener('resize', resize);
  const observer = new ResizeObserver(resize);
  observer.observe(root);
  resize();
  return () => {
    observer.disconnect(); scale.off('resize', sync);
    scene.events.off('display-quality', resize); window.removeEventListener('resize', resize);
  };
}
