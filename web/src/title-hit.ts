export type TitleButtonKey = 'button_newGame' | 'button_continue' | 'button_help';
export type TitleButtonState = 'up' | 'over' | 'down' | 'hit';

/** Исходные DefineEditText bounds и BUTTONRECORD placement, в двадцатых долях пикселя. */
export function titleStateBounds(key: TitleButtonKey, state: TitleButtonState) {
  const up = state === 'up';
  const tx = up ? 1060 : 1100, ty = up ? -318 : -300;
  const xmax = key === 'button_help' ? (up ? 1620 : 1580) : 2720;
  return { xMin: (tx - 40) / 20, yMin: (ty - 40) / 20, xMax: (tx + xmax) / 20, yMax: (ty + 676) / 20 };
}

/** SimpleButton.hitTestPoint проверяет текущее TextField-состояние, включая его границы. */
export function titleStateHit(key: TitleButtonKey, state: TitleButtonState, x: number, y: number): boolean {
  const bounds = titleStateBounds(key, state);
  return x >= bounds.xMin && x <= bounds.xMax && y >= bounds.yMin && y <= bounds.yMax;
}

/** Выбор мышью дополнительно допускает hitTestState; это не меняет область проверки клика. */
export function titlePointerHit(key: TitleButtonKey, state: TitleButtonState, x: number, y: number): boolean {
  return titleStateHit(key, state, x, y) || titleStateHit(key, 'hit', x, y);
}
