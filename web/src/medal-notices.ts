import { MEDALS } from './medals.ts';

export interface MedalNotice { id: number; slot: number; frame: number; age: number; battle: boolean; text: string }

/** popInfo: десять мест; frame139 освобождает место, frame150 удаляет ещё затухающий клип. */
export class MedalNotices {
  active: MedalNotice[] = [];
  private known = new Set<number>();

  reset(known: readonly number[]): void { this.known = new Set(known); this.active = []; }

  observe(earned: readonly number[], battle: boolean): MedalNotice[] {
    const added: MedalNotice[] = [];
    for (const id of earned) {
      if (this.known.has(id) || !MEDALS[id]) continue;
      this.known.add(id);
      const slot = Array.from({ length: 10 }, (_, i) => i).find(i => !this.active.some(n => n.slot === i && n.frame < 139));
      if (slot === undefined) continue;
      const notice = { id, slot, frame: 1, age: 0, battle, text: `You've been awarded <${MEDALS[id].name}> Medal!` };
      this.active.push(notice); added.push(notice);
    }
    return added;
  }

  advance(delta: number): void {
    for (const notice of this.active) {
      notice.age += Math.max(0, delta);
      notice.frame = 1 + Math.floor(notice.age * 30 / 1000 + 1e-7);
    }
    this.active = this.active.filter(notice => notice.frame < 150);
  }
}
