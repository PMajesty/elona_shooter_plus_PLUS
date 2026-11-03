export type ProjectileKind = 'hand-grenade' | 'grenade' | 'rocket' | 'bolt' | 'arrow' | 'gravity' | 'flame';
export type ExplosionKind = 'grenade' | 'rocket' | 'gravity' | 'flame';

// Предыдущий проверенный кончик (x - 4, y); кривизна сегмента, 0 для вертикали.
export interface ArrowSweep { x: number; y: number; curve: number; }

export interface ProjectileState {
  actorSlot?: number;
  uid: number; kind: ProjectileKind; weaponSlot: number | null; damage: number;
  x: number; y: number; startX: number; startY: number; targetX: number; targetY: number;
  speed: number; count: number; curve: number; penetrations: number;
  rotation: number; rotationStep: number; scale: number; alpha: number;
  shadowY: number; shadowAlpha: number; shadowVisible: boolean;
  frame: number; pulseFrame: number; acceleration: number; direction: number; removed: boolean;
  verticalProgress: number | null;
  previousArrowPoint?: { x: number; y: number };
}

export interface ProjectileLaunch {
  actorSlot?: number; targetSpeed?: number;
  uid: number; kind: ProjectileKind; weaponSlot: number | null; damage: number;
  startX: number; startY: number; targetX: number; targetY: number; speedBase: number;
  penetrations?: number; scale?: number;
}

export interface ProjectileCallbacks {
  hit(x: number, y: number, damage: number, weaponSlot: number, sweep?: ArrowSweep): boolean;
  explode(x: number, y: number, damage: number, weaponSlot: number | null, kind: ExplosionKind): void;
}

// DisplayObject хранит координаты в твипах; каждое присваивание отбрасывает дробь к нулю.
function position(value: number): number { return Math.trunc(value * 20) / 20; }
function opacity(value: number): number { return Math.trunc(value * 256) / 256; }
function rotation(value: number): number { return ((value + 180) % 360 + 360) % 360 - 180; }

/** Исходные throwGrenade/throwRocket и первый кадр соответствующего bullet_*.
 * x — координата корневого MovieClip, y — локальная координата его mc.
 */
export function createProjectile(input: ProjectileLaunch): ProjectileState {
  const { kind, startX, startY } = input;
  let { targetX, targetY } = input;
  // Отдельный вертикальный путь исправляет исходное деление на ноль без смещения цели.
  const vertical = Math.abs(targetX - startX) < 0.01;
  if (vertical) targetX = startX;
  // Сохраняем порядок умножений источника: перегруппировка меняет младший бит скорости.
  let speed = (vertical ? input.speedBase : input.speedBase * Math.atan2(Math.abs(targetX - startX) * 2, Math.abs(targetY - startY)) * 2 / Math.PI) + (kind === 'rocket' ? 1.5 : 0.1);
  if (kind === 'arrow') { if (targetY < 150) speed *= 1.5; targetY += 6; }
  if (kind === 'bolt') targetY += 4;
  if (kind === 'gravity') speed /= 4;
  if (kind === 'flame') speed *= 0.75;
  // Упреждение союзника применяется после вычисления скорости и до создания траектории.
  if (input.targetSpeed !== undefined && kind !== 'gravity') targetX += input.targetSpeed * ((startX - targetX) / (speed * (kind === 'rocket' ? 0.9 : 1.1)));
  const state: ProjectileState = {
    ...(input.actorSlot ? { actorSlot: input.actorSlot } : {}),
    uid: input.uid, kind, weaponSlot: input.weaponSlot, damage: Math.trunc(input.damage),
    x: startX, y: { 'hand-grenade': -96.75, grenade: -79.85, rocket: -114.25, arrow: -45, bolt: -45, gravity: -47.95, flame: -34.5 }[kind], startX, startY, targetX, targetY,
    speed, count: Math.trunc(Math.abs(vertical ? targetY - startY : targetX - startX) / speed) + 1, curve: 0.003, penetrations: input.penetrations ?? 0,
    rotation: 0, rotationStep: 0, scale: input.scale ?? 1, alpha: 1,
    shadowY: { 'hand-grenade': -30.2, grenade: -21.7, rocket: -24.55, arrow: -11.9, bolt: -11.9, gravity: 0, flame: 0 }[kind], shadowAlpha: 1, shadowVisible: !['gravity', 'flame'].includes(kind),
    frame: 0, pulseFrame: 1, acceleration: 0, direction: targetX > startX ? -1 : 1, removed: false,
    verticalProgress: vertical ? 0 : null,
  };
  const angle = Math.atan2(targetX - startX, targetY - startY) * -180 / Math.PI + 180;
  if (kind === 'rocket') {
    state.curve = 0;
    state.rotation = angle - 270;
    state.count = 0;
  } else {
    if (kind === 'arrow') {
      state.rotationStep = 2.5;
      state.rotation = -90 + state.rotationStep * state.count / 2;
      if (Math.abs(targetX - startX) < 200) { state.rotation = angle; state.rotationStep = Math.abs(targetX - startX) / 150; }
      if (targetY < 150) {
        state.rotationStep = 1.25 - Math.abs(state.count / 100);
        state.curve = 0.001; state.count = state.count * 2 + 20; state.rotation = angle;
      }
    } else if (kind === 'bolt') {
      state.rotationStep = 0.2; state.count = 0; state.curve = 0.00002; state.rotation = angle;
    } else if (kind === 'gravity') {
      state.count = 15; state.curve = 0;
    } else if (kind === 'flame') {
      state.count = 2; state.curve = -0.003;
    }
    if (targetX > startX) {
      state.speed *= -1;
      if (kind === 'arrow' || kind === 'bolt') { state.rotation = angle; state.rotationStep *= -1; }
    }
  }
  state.rotation = rotation(state.rotation);
  if (vertical) { state.y = startY; state.shadowY = startY; }
  return state;
}

function move(state: ProjectileState, distance: number): void {
  if (state.verticalProgress !== null) state.verticalProgress += Math.abs(distance);
  else state.x = position(state.x - distance);
}

function outside(state: ProjectileState, left: number): boolean {
  return state.verticalProgress === null ? state.x < left || state.x > 640 : state.y < -10 || state.y > 400;
}

function trajectory(state: ProjectileState): number {
  const { targetY, startY, targetX, startX, curve, x } = state;
  if (state.verticalProgress !== null) return startY + (Math.sign(targetY - startY) || -1) * state.verticalProgress;
  const b = (targetY - startY - curve * targetX * targetX + curve * startX * startX) / (targetX - startX);
  const c = targetY - curve * targetX * targetX - b * targetX;
  return curve * x * x + b * x + c;
}

function shadow(state: ProjectileState, offset: number): void {
  if (state.verticalProgress !== null) {
    state.shadowY = position(state.startY + (state.y - state.startY) / (state.targetY < 135 ? 3 : 1) + offset);
    return;
  }
  state.shadowY = position((state.targetY - state.startY) * (state.x - state.startX) / (state.targetX - state.startX));
  if (state.targetY < 135) state.shadowY = position(state.shadowY / 3);
  state.shadowY = position(state.shadowY + state.startY + offset);
}

function hit(state: ProjectileState, callbacks: ProjectileCallbacks, sweep?: ArrowSweep): boolean {
  if (state.weaponSlot === null) return false;
  const didHit = sweep
    ? callbacks.hit(state.x - 4, state.y, state.damage, state.weaponSlot, sweep)
    : callbacks.hit(state.x - 4, state.y, state.damage, state.weaponSlot);
  if (!didHit) return false;
  if (state.penetrations <= 0) { state.removed = true; return true; }
  state.penetrations--;
  return false;
}

function arrowHit(state: ProjectileState, callbacks: ProjectileCallbacks, eligible: boolean): boolean {
  // Первый кадр ещё проверяет стартовую позу, а не точку реальной траектории.
  eligible = eligible && state.frame > 1 && state.weaponSlot !== null;
  const previous = eligible ? state.previousArrowPoint : undefined;
  const stopped = hit(state, callbacks, previous
    ? { ...previous, curve: state.verticalProgress === null ? state.curve : 0 }
    : undefined);
  if (eligible && !state.removed) state.previousArrowPoint = { x: state.x - 4, y: state.y };
  else delete state.previousArrowPoint;
  return stopped;
}

/** Один вызов оригинального onEnterFrame_bullet. Попадания выполняются в исходном порядке. */
export function advanceProjectile(state: ProjectileState, callbacks: ProjectileCallbacks): void {
  if (state.removed) { delete state.previousArrowPoint; return; }
  state.frame++;
  state.pulseFrame++;
  if (state.kind === 'hand-grenade' || state.kind === 'grenade') {
    state.count--;
    move(state, state.speed);
    state.rotation = rotation(state.rotation - (state.kind === 'grenade' ? 24 : 4));
    state.y = position(trajectory(state));
    shadow(state, 0);
    if (state.count <= 0) {
      if (state.verticalProgress !== null) state.y = position(state.targetY);
      callbacks.explode(state.x, state.y, state.damage, state.weaponSlot, 'grenade');
      state.removed = true;
    }
    return;
  }
  if (state.kind === 'rocket') {
    move(state, state.direction * state.acceleration * state.acceleration);
    state.acceleration += state.speed * 0.01;
    state.y = position(trajectory(state));
    state.shadowY = position(state.verticalProgress !== null ? state.y + 15 * (1 - state.verticalProgress / Math.max(1, Math.abs(state.targetY - state.startY))) : state.targetY < 135
      ? state.startY + (state.targetY - state.startY) * (state.x - state.startX) / (state.targetX - state.startX) / 3
      : state.y + 15 - 15 * (state.x - state.startX) / (state.targetX - state.startX));
    if (state.shadowY < 135) state.shadowVisible = false;
    if (state.verticalProgress !== null ? state.verticalProgress > Math.abs(state.targetY - state.startY) + 5 : state.direction === 1 && state.x < state.targetX - 5 || state.direction === -1 && state.x > state.targetX + 5) {
      if (state.verticalProgress !== null) state.y = position(state.targetY);
      callbacks.explode(state.x, state.y, state.damage, state.weaponSlot, 'rocket');
      state.removed = true;
    }
    return;
  }
  if (state.kind === 'arrow') {
    state.count--;
    if (outside(state, 0)) { delete state.previousArrowPoint; state.removed = true; return; }
    if (state.count >= 0 && state.count < 4 || state.targetY < 135 && state.y > 0 && state.y < 135) {
      if (arrowHit(state, callbacks, state.targetY >= 135 && state.count >= 0 && state.count < 4)) return;
    } else delete state.previousArrowPoint;
    if (state.count <= 0) {
      delete state.previousArrowPoint;
      state.shadowVisible = false; state.alpha = opacity(state.alpha - 0.025);
      if (state.count < -40) state.removed = true;
      return;
    }
    move(state, state.speed);
    state.rotation = rotation(state.rotation - state.rotationStep);
    state.y = position(trajectory(state));
    shadow(state, 6);
    if (state.count < 10) state.shadowAlpha = opacity(state.shadowAlpha - 0.1);
    if (state.shadowY < 135) state.shadowVisible = false;
    return;
  }
  if (state.kind === 'bolt') {
    if (outside(state, -10)) { delete state.previousArrowPoint; state.removed = true; return; }
    const groundTarget = state.targetY >= 135;
    if (groundTarget && state.y < 135 && state.count > 2) {
      delete state.previousArrowPoint;
      state.speed /= 2.5 - Math.abs(state.x - state.startX) / 450;
      state.rotation = rotation(state.rotation - state.rotationStep * 10);
      state.scale -= 0.1;
      if (state.scale <= 0) { state.removed = true; return; }
    } else if (groundTarget || state.y < 135) {
      if (arrowHit(state, callbacks, groundTarget)) return;
    } else delete state.previousArrowPoint;
    state.count++;
    move(state, state.speed);
    state.rotation = rotation(state.rotation - state.rotationStep);
    state.y = position(trajectory(state));
    shadow(state, 14);
    if (state.shadowY < 135) state.shadowVisible = false;
    return;
  }
  // В исходнике проверяется y корневого объекта (=0), а не mc.y. После удаления нет return.
  if (outside(state, -10)) state.removed = true;
  state.count--;
  if (state.count <= 0) {
    state.count = state.kind === 'gravity' ? 15 : 2;
    if (state.kind === 'gravity') state.pulseFrame = 1;
    callbacks.explode(state.x, state.y, state.damage, state.weaponSlot, state.kind);
  }
  move(state, state.speed);
  if (state.kind === 'gravity') state.rotation = rotation(state.rotation - 50);
  state.y = position(trajectory(state));
}
