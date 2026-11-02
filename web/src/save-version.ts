export const SAVE_VERSION = 29;
export function supportedSaveVersion(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= SAVE_VERSION;
}
