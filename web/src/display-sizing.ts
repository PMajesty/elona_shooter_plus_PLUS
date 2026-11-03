import type Phaser from 'phaser';

/** FIT вписывает всю сцену в окно. Буфер рисования выбирается отдельно от размера на странице. */
export function configureDisplaySizing(scene: Phaser.Scene, root: HTMLElement, lowQuality: () => boolean): () => void {
  const { scale } = scene;
  const sync = () => {
    const { width, height } = scale.displaySize;
    root.style.setProperty('--canvas-width', `${width}px`);
    root.style.setProperty('--canvas-height', `${height}px`);
    root.dataset.displayScale = String(width / 620);
  };
  const resize = () => {
    // Ширина монитора не уменьшается при Ctrl+. Окно и iframe всё равно ограничивают сцену.
    root.style.setProperty('--preferred-width', `${Math.max(1240, window.screen.availWidth * 0.625)}px`);
    const bounds = root.getBoundingClientRect();
    // При увеличении шрифты рисуются в реальных пикселях. Мир и зоны ввода остаются 620 × 380.
    const density = Math.min(bounds.width / 620, bounds.height / 380) * window.devicePixelRatio;
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
