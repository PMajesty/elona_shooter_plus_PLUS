// fixedRnd использует сохранённый счётчик, отдельно от боевого Math.random.
// Порядок Number-операций и исходные константы важны для последовательности.
export function fixedSearchRandom(counter: number): number {
  const factor = 3.14159265358979 * (0.753624683711678 + 0.5);
  const cube = 173 * counter * counter * counter;
  return (counter * 2.71828182845905 + cube) * factor % 1;
}
