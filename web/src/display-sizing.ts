import type Phaser from 'phaser';

/** Целый масштаб сохраняет пиксели исходного холста; маленькие окна продолжают уменьшаться. */
export function configureDisplaySizing(scale: Phaser.Scale.ScaleManager, root: HTMLElement): () => void {
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
    scale.setParentSize(bounds.width, bounds.height);
    sync();
  };
  scale.on('resize', sync);
  const observer = new ResizeObserver(resize);
  observer.observe(root);
  resize();
  return () => { observer.disconnect(); scale.off('resize', sync); };
}
