import { ENEMIES, type EnemyKind } from './content.ts';

export interface LowLevelMission {
  level: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7; fixedLv: number; strength: 0; power: number; powerOrg: number; reward: number;
  hire: false; ragnarok: false; wave: 5; spawnRate: number; group: number[];
  waveType: 0; loot: number[]; newWave: true; time: 30; bossDay: false; bossWave: number;
  note: ''; hpFix: 1; dmgFix: 1; expFix: 1; absorbFix: number; bossKilled: 0;
  noDamage: true; criticalCount: 0; resultOther: 0;
}

export interface GeneratedWave { enemies: EnemyKind[]; delays: number[]; initialCount: number }
export interface GeneratedWaves { waves: GeneratedWave[]; power: number; group: number[] }

// Миссия готовится до Rest; календарный день определяет гарантированный предмет.
export function generateLowLevelMission(level: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7, calendarDay: 1 | 2 | 3 | 4 | 5 | 6 | 7, random: () => number, options: { absorbFix?: number } = {}): LowLevelMission {
  if (![0, 1, 2, 3, 4, 5, 6, 7].includes(level) || ![1, 2, 3, 4, 5, 6, 7].includes(calendarDay)) throw new RangeError('Only mission preparation for the first seven towns is supported.');
  const absorbFix = options.absorbFix ?? 0;
  if (![0, 0.01, 0.02, 0.03, 0.04].includes(absorbFix)) throw new RangeError('Unsupported medal absorption.');
  const loot: number[] = [];
  if (random() > 0.97) loot.push(1038);
  if (calendarDay === 1) loot.push(1117);
  if (calendarDay === 2) loot.push(1103);
  if (calendarDay === 3) loot.push(1035);
  if (calendarDay === 4) loot.push(1102);
  if (calendarDay === 5) loot.push(1037);
  if (calendarDay === 6) loot.push(1106);
  const rolledBossWave = 2 + Math.trunc(random() * 5 / 3);
  const power = 800 + level * 50 + level * 70;
  return {
    level, fixedLv: level, strength: 0, power, powerOrg: power, reward: 600 + level * 20,
    hire: false, ragnarok: false, wave: 5, spawnRate: 15 - level / 5, group: [], waveType: 0,
    loot, newWave: true, time: 30, bossDay: false, bossWave: level === 0 ? 2 : rolledBossWave,
    note: '', hpFix: 1, dmgFix: 1, expFix: 1, absorbFix, bossKilled: 0,
    noDamage: true, criticalCount: 0, resultOther: 0,
  };
}

interface SelectionEnemy { id: number; level: number; power: number; flags: readonly string[] }
// Полный порядок setEnemy: даже недоступная по уровню муха расходует отдельный бросок.
const SELECTION_ENEMIES: readonly SelectionEnemy[] = [
  { id: 999, level: 9999, power: 500, flags: [] },
  { id: 11, level: 9999, power: 50, flags: [] },
  { id: 18, level: 9999, power: 80, flags: [] },
  { id: 3, level: 0, power: 70, flags: ['BATCH'] },
  { id: 17, level: 1, power: 50, flags: ['BATCH', 'MASS'] },
  { id: 2, level: 4, power: 100, flags: ['RANGED'] },
  { id: 6, level: 3, power: 110, flags: ['AIR', 'MASS'] },
  { id: 10, level: 6, power: 30, flags: ['AIR'] },
  { id: 7, level: 7, power: 95, flags: ['BATCH', 'MASS'] },
  { id: 4, level: 9, power: 300, flags: ['KAMIKAZE', 'MASS'] },
  { id: 5, level: 11, power: 300, flags: ['BOSS'] },
  { id: 9, level: 13, power: 160, flags: ['BATCH', 'MASS'] },
  { id: 14, level: 15, power: 260, flags: ['BATCH', 'MASS'] },
  { id: 1, level: 17, power: 350, flags: ['BATCH', 'MASS'] },
  { id: 8, level: 19, power: 280, flags: ['BATCH', 'MASS'] },
  { id: 16, level: 22, power: 420, flags: ['AIR'] },
  { id: 12, level: 25, power: 400, flags: ['BOSS'] },
  { id: 13, level: 28, power: 550, flags: ['BOSS', 'MASS'] },
  { id: 15, level: 32, power: 550, flags: ['BOSS'] },
  { id: 19, level: 2, power: 90, flags: ['BATCH', 'MASS'] },
];

// Источник: generateWave/selectEnemy/randLv/preGenerateWave. Миссия готовится до Rest,
// а календарный день меняется до генерации волн; переданную миссию не создаём заново.
export function generateLowLevelWaves(mission: Readonly<LowLevelMission>, calendarDay: 1 | 2 | 3 | 4 | 5 | 6 | 7, random: () => number): GeneratedWaves {
  if (![0, 1, 2, 3, 4, 5, 6].includes(mission.level) || mission.fixedLv !== mission.level || mission.wave !== 5 || mission.bossDay || ![1, 2, 3, 4, 5, 6, 7].includes(calendarDay)) throw new RangeError('Unsupported low-level wave configuration.');
  const waves: GeneratedWave[] = [];
  let power = mission.powerOrg;
  for (let index = 0; index < mission.wave; index++) {
    const enemies: EnemyKind[] = [];
    const delays: number[] = [];
    const used: number[] = [];
    power = Math.trunc(mission.powerOrg - mission.powerOrg / 2.5 * index / mission.wave);
    const randLv = (level: number, factor: number) => Math.trunc(level * (1 - random() * (1 - random() * factor)));
    const select = (level: number, budget: number, flags: string[]) => {
      const cappedLevel = Math.min(level, 30);
      const target = Math.trunc(cappedLevel - random() * random() * cappedLevel);
      let chosen: SelectionEnemy | undefined;
      for (const definition of SELECTION_ENEMIES) {
        if (definition.id === 10 && random() > 0.2) continue;
        if (definition.level > level) continue;
        if (chosen) {
          if (definition.level === chosen.level) { if (random() > 0.5) continue; }
          else if (Math.abs(target - definition.level) > Math.abs(target - chosen.level)) continue;
        }
        if (flags.some(flag => !definition.flags.includes(flag)) || used.includes(definition.id)) continue;
        chosen = definition;
      }
      if (!chosen) {
        let fallback = random() > 0.7 ? 17 : 3;
        if (mission.fixedLv > 1 && random() > 0.7) fallback = 19;
        if (mission.fixedLv > 3 && random() > 0.5) fallback = 17;
        if (mission.fixedLv > 7 && random() > 0.5) fallback = 7;
        if (mission.fixedLv > 13 && random() > 0.5) fallback = 9;
        if (mission.fixedLv > 17 && random() > 0.4) fallback = 1;
        if (mission.fixedLv > 22 && random() > 0.4) fallback = 8;
        chosen = SELECTION_ENEMIES.find(enemy => enemy.id === fallback)!;
      }
      used.push(chosen.id);
      const kind = (Object.keys(ENEMIES) as EnemyKind[]).find(kind => ENEMIES[kind].id === chosen!.id);
      if (!kind) throw new RangeError(`Selected original enemy ${chosen.id} has no implemented combat behavior.`);
      const count = Math.max(1, Math.trunc(power * budget / 100 / chosen.power));
      for (let n = 0; n < count; n++) enemies.push(kind);
    };
    // Успешный AIR прерывает цепочку до проверок BATCH1/RANGED/BATCH2.
    if (random() < 0.1 && mission.level > 3) {
      select(randLv(mission.level, 0.5), 20, ['AIR']);
      select(randLv(mission.level, 0.8), 20, ['AIR']);
      select(mission.level, 20, ['AIR']);
      select(mission.level + 2, 20, ['AIR']);
      select(randLv(mission.level, 0.2), 20, ['AIR']);
    } else if (random() < 0.1 && mission.level > 2) {
      // BATCH1 прерывает цепочку: броски RANGED и BATCH2 здесь не выполняются.
      select(randLv(mission.level, 0.7), 40, ['BATCH']);
      select(mission.level + 2, 20, []);
      select(randLv(mission.level, 1), 60, ['BATCH']);
    } else if (random() < 0.2 && mission.level > 5) {
      // Исходные бюджеты RANGED дают 90%; успешная ветка пропускает бросок BATCH2.
      select(randLv(mission.level, 0.8), 10, []);
      select(randLv(mission.level, 1), 30, ['RANGED']);
      select(mission.level + 2, 20, []);
      select(randLv(mission.level, 1), 15, []);
      select(randLv(mission.level, 1), 15, ['RANGED']);
    } else {
      random();
      select(randLv(mission.level, 0.25), 15, ['BATCH']);
      if (mission.level > 1) select(randLv(mission.level, 0.8), 15, []);
      select(randLv(mission.level, 0.5), 20, ['BATCH']);
      select(mission.level + 2, 20, []);
      if (mission.level > 1) select(randLv(mission.level, 1), 15, []);
      select(randLv(mission.level, 0.4), 15, ['BATCH']);
    }
    if (index === mission.bossWave) enemies.push('boss');
    for (let n = 0; n < enemies.length; n++) {
      const enemyPower = ENEMIES[enemies[n]].power;
      // Исходник вычисляет задержку до перестановки, но меняет местами только id.
      delays[n] = mission.spawnRate + Math.trunc(enemyPower / 100) + (enemyPower >= 300 ? 2 : 0);
      const swap = Math.trunc(random() * enemies.length);
      [enemies[n], enemies[swap]] = [enemies[swap], enemies[n]];
    }
    delays[0] += 90 - Math.trunc(mission.fixedLv * 1.5);
    delays[0] += 20;
    if (index === 0) delays[0] += 50;
    waves.push({ enemies, delays, initialCount: enemies.length });
  }
  return { waves, power, group: waves.map(wave => wave.initialCount) };
}
