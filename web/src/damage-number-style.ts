export interface DamageNumberStyle {
  fontSize: number;
  color: string;
  alpha: number;
  shadowBlur: number;
  ticks: number;
  moveY: number;
  offsetY: number;
}

/** В Expanded числа урона спутников визуально отличаются от попаданий героя. */
export function damageNumberStyle(expanded: boolean, actorSlot: number, critical: boolean): DamageNumberStyle {
  if (expanded && Number.isInteger(actorSlot) && actorSlot >= 1 && actorSlot <= 4) {
    return {
      fontSize: 11,
      color: critical ? '#d9c49a' : '#b8cedc',
      alpha: 0.82,
      shadowBlur: 1,
      ticks: 20,
      moveY: -0.45,
      offsetY: -18,
    };
  }
  return {
    fontSize: 13,
    color: critical ? '#ffef62' : '#ffffff',
    alpha: 1,
    shadowBlur: 2,
    ticks: 24,
    moveY: -0.6,
    offsetY: -25,
  };
}
