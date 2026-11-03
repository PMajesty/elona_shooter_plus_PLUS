import type { SimulationState } from './simulation.ts';

export function dayReport(state: SimulationState): { rows: number[]; news: string } {
  const result = state.result, other = state.otherBattleGold ?? 0;
  const taken = state.gold - state.resultBefore - result.netReward - other;
  const castle = result.salary + (result.museum ?? 0) + (result.fame ?? 0);
  const rows = [state.resultBefore, taken, result.reward + result.perfectBonus, castle,
    other, -result.wages, -(result.upkeep + result.tax), state.gold];
  const news = [...(state.battleNews ?? [])];
  if (state.noDamage) news.push("You've scored a perfect game! You are given +30% reward bonus.");
  if (state.economy.museum) news.push(`Your museum generated ${result.museum ?? 0} GP.`);
  if (result.salary) news.push(`You received a salary of ${result.salary} GP.`);
  if (state.day % 10 === 4) news.push("It's a MOD sales day! You should check the shop.");
  if (state.town?.preparation === 'pending' && state.town.ap > 4) {
    news.push(`Thanks to the Active skill, you gained extra ${state.town.ap - 4} AP to spend.`);
  }
  return { rows, news: news.join('\n') || 'No news today.' };
}
