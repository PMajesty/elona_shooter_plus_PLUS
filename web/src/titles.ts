export const TITLES = [
  { name: 'Newcomer', day: 1, salary: 0 },
  { name: 'Honorary Citizen', day: 6, salary: 100 },
  { name: 'Private', day: 11, salary: 200 },
  { name: 'Knight Apprentice', day: 16, salary: 400 },
  { name: 'Knight', day: 26, salary: 700 },
  { name: 'Baron', day: 41, salary: 1000 },
  { name: 'Duke', day: 61, salary: 1500 },
  { name: 'Prince', day: 81, salary: 2000 },
  { name: 'King', day: 101, salary: 3000 },
] as const;
export type Title = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export function isTitle(value: unknown): value is Title {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < TITLES.length;
}

export function nextTitle(title: Title, day: number): Title | undefined {
  const next = title + 1;
  // Исходный newTitle проходит ранги по порядку, даже если игрок отложил повышение.
  return isTitle(next) && day >= TITLES[next].day ? next : undefined;
}
