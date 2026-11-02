export interface KillHistory { completed: number; incomplete?: true }
interface KillRecord { day: number; kills: number; killHistory?: KillHistory }

/** kills относится к текущему бою; старые сохранения после Day1 не содержат предыдущие итоги. */
export function lifetimeKills(state: KillRecord): { count: number; complete: boolean } {
  return { count: (state.killHistory?.completed ?? 0) + state.kills,
    complete: state.killHistory ? state.killHistory.incomplete !== true : state.day === 1 };
}

export function nextKillHistory(state: KillRecord): KillHistory {
  const { count, complete } = lifetimeKills(state);
  return { completed: count, ...(!complete ? { incomplete: true } : {}) };
}
