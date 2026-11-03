import Phaser from 'phaser';

/** Порог жеста в CSS-пикселях: размер буфера Phaser и DPR не меняют чувствительность тапа. */
function movedPastThreshold(scene: Phaser.Scene, dx: number, dy: number): boolean {
  const scale = scene.scale.displayScale;
  return Math.hypot(dx / scale.x, dy / scale.y) >= 6;
}

/** Палец двигает текст в мировых координатах камеры, без повторного умножения на DPR. */
export function bindTouchScroll(scene: Phaser.Scene, owner: Phaser.GameObjects.Container,
  area: Phaser.GameObjects.Zone, getScroll: () => number, setScroll: (value: number) => void): void {
  let active: number | null = null;
  let startX = 0, startY = 0, lastX = 0, lastY = 0, moving = false;
  const previous = new Phaser.Math.Vector2(), current = new Phaser.Math.Vector2();
  const cancel = () => { active = null; moving = false; };
  const down = (pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
    event.stopPropagation();
    if (!pointer.wasTouch || active !== null) return;
    active = pointer.id; startX = lastX = pointer.x; startY = lastY = pointer.y; moving = false;
  };
  const move = (pointer: Phaser.Input.Pointer) => {
    if (pointer.id !== active) return;
    if (!pointer.isDown) { cancel(); return; }
    if (!moving && !movedPastThreshold(scene, pointer.x - startX, pointer.y - startY)) return;
    moving = true;
    const camera = pointer.camera ?? scene.cameras.main;
    camera.getWorldPoint(lastX, lastY, previous);
    camera.getWorldPoint(pointer.x, pointer.y, current);
    lastX = pointer.x; lastY = pointer.y;
    setScroll(getScroll() + previous.y - current.y);
  };
  const up = (pointer: Phaser.Input.Pointer) => { if (pointer.id === active) cancel(); };
  area.on('pointerdown', down);
  scene.input.on('pointermove', move);
  scene.input.on('pointerup', up);
  scene.input.on('pointerupoutside', up);
  scene.input.on('gameout', cancel);
  scene.game.events.on('blur', cancel);
  const cleanup = () => {
    cancel(); area.off('pointerdown', down);
    scene.input.off('pointermove', move); scene.input.off('pointerup', up);
    scene.input.off('pointerupoutside', up); scene.input.off('gameout', cancel);
    scene.game.events.off('blur', cancel);
    scene.events.off('shutdown', cleanup); owner.off('destroy', cleanup);
  };
  owner.once('destroy', cleanup); scene.events.once('shutdown', cleanup);
}

/** Закрытие фона касанием — только после короткого тапа, не в начале свайпа. */
export function bindTouchSafeDismiss(scene: Phaser.Scene, owner: Phaser.GameObjects.Container,
  shade: Phaser.GameObjects.Rectangle, dismiss: () => void): void {
  let active: number | null = null;
  let x = 0, y = 0;
  const cancel = () => { active = null; };
  const move = (pointer: Phaser.Input.Pointer) => {
    if (pointer.id === active && movedPastThreshold(scene, pointer.x - x, pointer.y - y)) cancel();
  };
  const down = (pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
    event.stopPropagation();
    if (!pointer.wasTouch) { dismiss(); return; }
    if (active !== null) return;
    active = pointer.id; x = pointer.x; y = pointer.y;
  };
  const up = (pointer: Phaser.Input.Pointer) => {
    if (pointer.id !== active) return;
    move(pointer);
    const tapped = active !== null && !pointer.event?.type.includes('cancel');
    cancel();
    if (tapped) dismiss();
  };
  shade.on('pointerdown', down);
  scene.input.on('pointermove', move); scene.input.on('pointerup', up);
  scene.input.on('pointerupoutside', cancel); scene.input.on('gameout', cancel);
  scene.game.events.on('blur', cancel);
  const cleanup = () => {
    cancel(); shade.off('pointerdown', down);
    scene.input.off('pointermove', move); scene.input.off('pointerup', up);
    scene.input.off('pointerupoutside', cancel); scene.input.off('gameout', cancel);
    scene.game.events.off('blur', cancel);
    scene.events.off('shutdown', cleanup); owner.off('destroy', cleanup);
  };
  owner.once('destroy', cleanup); scene.events.once('shutdown', cleanup);
}
