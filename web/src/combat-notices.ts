export const CRITICAL_STREAK_MESSAGES = ['', '[6] Great shot!', '[5] Fantastic!', '[4] Shena is dancing!',
  '[3] Jure blesses you!', '[2] Lulwy is pleased!', '[1] ....meoowwwww!'] as const;

export interface CombatNotice { id: number; text: string; frame: number }

/** textEffect2390: следующий текст ждёт кадра62 предыдущего, повторяя исходный цикл ожидания. */
export class CombatNotices {
  active: CombatNotice[] = [];
  private nextId = 0;
  private clock = 0;

  reset(): void { this.active = []; this.nextId = 0; this.clock = 0; }

  add(text: string): CombatNotice {
    const previous = this.active.find(n => n.id === this.nextId - 1);
    const notice = { id: this.nextId++, text, frame: previous && previous.frame < 62 ? 2 : 11 };
    this.active.push(notice);
    return notice;
  }

  advance(delta: number): void {
    this.clock += Math.max(0, delta);
    while (this.clock + 1e-7 >= 1000 / 30) {
      this.clock -= 1000 / 30;
      for (const notice of this.active) {
        notice.frame++;
        if (notice.frame === 10) {
          const previous = this.active.find(n => n.id === notice.id - 1);
          notice.frame = previous && previous.frame < 62 ? 2 : 11;
        }
      }
      this.active = this.active.filter(n => n.frame < 92);
    }
  }
}
