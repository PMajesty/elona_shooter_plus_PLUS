import type Phaser from 'phaser';

/** FIT вписывает всю сцену в окно. Буфер рисования выбирается отдельно от размера на странице. */
export function configureDisplaySizing(scene: Phaser.Scene, root: HTMLElement, playfield: HTMLElement, lowQuality: () => boolean, positionMenuView: () => void): () => void {
  const { scale } = scene;
  const sync = () => {
    const { width, height } = scale.displaySize;
    root.style.setProperty('--canvas-width', `${width}px`);
    root.style.setProperty('--canvas-height', `${height}px`);
    root.dataset.displayScale = String(width / 620);
    root.style.setProperty('--display-scale', String(width / 620));
    // Крупная перезарядка занимает место в колонке, не задевая Auto и нижний пояс предметов.
    // Считаем место для полного боевого набора, даже если сейчас открыто меню.
    const controls = root.querySelector<HTMLElement>('#game-controls')!;
    const optionHeight = root.querySelector<HTMLElement>('#mute')!.getBoundingClientRect().height;
    const optionCount = root.querySelector<HTMLButtonElement>('#fullscreen')!.disabled ? 4 : 5;
    const gap = parseFloat(getComputedStyle(controls).rowGap) || 0;
    const available = height * 0.88 - 8 - optionCount * (optionHeight + gap);
    root.dataset.largeReloadSize = String(available >= 88 ? 88 : available >= 64 ? 64 : 0);
  };
  const resize = () => {
    // Ширина монитора не уменьшается при Ctrl+. Окно и iframe всё равно ограничивают сцену.
    root.style.setProperty('--preferred-width', `${Math.max(1240, window.screen.availWidth * 0.625)}px`);
    const bounds = playfield.getBoundingClientRect();
    // При увеличении шрифты рисуются в реальных пикселях. Мир и зоны ввода остаются 620 × 380.
    const density = Math.min(bounds.width / 620, bounds.height / 380) * window.devicePixelRatio;
    const backing = !lowQuality() && density >= 1.5 ? 2 : 1;
    if (scale.gameSize.width !== 620 * backing) scale.setGameSize(620 * backing, 380 * backing);
    scene.cameras.main.setOrigin(0, 0).setZoom(backing);
    scale.setParentSize(bounds.width, bounds.height);
    sync();
    positionMenuView();
  };
  // WebKit не разрешает менять размеры canvas в том же цикле ResizeObserver.
  let pending = 0;
  const schedule = () => {
    if (!pending) pending = requestAnimationFrame(() => { pending = 0; resize(); });
  };
  scale.on('resize', sync);
  scene.events.on('display-quality', resize);
  window.addEventListener('resize', schedule);
  const observer = new ResizeObserver(schedule);
  observer.observe(playfield);
  resize();
  return () => {
    observer.disconnect(); cancelAnimationFrame(pending); scale.off('resize', sync);
    scene.events.off('display-quality', resize); window.removeEventListener('resize', schedule);
  };
}
