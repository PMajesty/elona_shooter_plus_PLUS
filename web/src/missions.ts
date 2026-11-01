import { ENEMIES, type EnemyKind } from './content.ts';

export interface LowLevelMission {
  level: 0 | 1; fixedLv: number; strength: 0; power: number; powerOrg: number; reward: number;
  hire: false; ragnarok: false; wave: 5; spawnRate: number; group: number[];
  waveType: 0; loot: number[]; newWave: true; time: 30; bossDay: false; bossWave: number;
  note: ''; hpFix: 1; dmgFix: 1; expFix: 1; absorbFix: 0; bossKilled: 0;
  noDamage: true; criticalCount: 0; resultOther: 0;
}

export interface GeneratedWave { enemies: EnemyKind[]; delays: number[]; initialCount: number }
export interface GeneratedWaves { waves: GeneratedWave[]; power: number; group: number[] }

// Ограничение явно отражает покрытые обычные миссии без медалей и улучшений.
export function generateLowLevelMission(level: 0 | 1, calendarDay: 1 | 2, random: () => number): LowLevelMission {
  if ((level !== 0 && level !== 1) || (calendarDay !== 1 && calendarDay !== 2)) throw new RangeError('Only the opening and prepared second-day missions are supported.');
  const loot: number[] = [];
  if (random() > 0.97) loot.push(1038);
  loot.push(calendarDay === 1 ? 1117 : 1103);
  const rolledBossWave = 2 + Math.trunc(random() * 5 / 3);
  const power = 800 + level * 50 + level * 70;
  return {
    level, fixedLv: level, strength: 0, power, powerOrg: power, reward: 600 + level * 20,
    hire: false, ragnarok: false, wave: 5, spawnRate: 15 - level / 5, group: [], waveType: 0,
    loot, newWave: true, time: 30, bossDay: false, bossWave: level === 0 ? 2 : rolledBossWave,
    note: '', hpFix: 1, dmgFix: 1, expFix: 1, absorbFix: 0, bossKilled: 0,
    noDamage: true, criticalCount: 0, resultOther: 0,
  };
}

// Источник: generateWave/selectEnemy/randLv/preGenerateWave. Миссия готовится до Rest,
// а календарный день меняется до генерации волн; переданную миссию не создаём заново.
export function generateLowLevelWaves(mission: Readonly<LowLevelMission>, calendarDay: 1 | 2, random: () => number): GeneratedWaves {
  if ((mission.level !== 0 && mission.level !== 1) || mission.fixedLv !== mission.level || mission.wave !== 5 || mission.bossDay || (calendarDay !== 1 && calendarDay !== 2)) throw new RangeError('Unsupported low-level wave configuration.');
  const waves: GeneratedWave[] = [];
  let power = mission.powerOrg;
  for (let index = 0; index < mission.wave; index++) {
    const enemies: EnemyKind[] = [];
    const delays: number[] = [];
    const used: EnemyKind[] = [];
    power = Math.trunc(mission.powerOrg - mission.powerOrg / 2.5 * index / mission.wave);
    const randLv = (level: number, factor: number) => Math.trunc(level * (1 - random() * (1 - random() * factor)));
    const select = (level: number, budget: number, flags: string[]) => {
      const target = Math.trunc(level - random() * random() * level);
      let chosen: EnemyKind | undefined;
      // Пропущенные записи каталога имеют уровень >3 и не расходуют RNG; муха
      // проверяется отдельно до проверки уровня даже в первых двух миссиях.
      for (const kind of ['boss', 'sheep', 'rat', 'crow', 'fly', 'chicken'] as const) {
        if (kind === 'fly') { random(); continue; }
        const definition = ENEMIES[kind];
        if (definition.level > level) continue;
        if (chosen && Math.abs(target - definition.level) > Math.abs(target - ENEMIES[chosen].level)) continue;
        if (flags.some(flag => !definition.flags.includes(flag)) || used.includes(kind)) continue;
        chosen = kind;
      }
      // Дополнительные fallback-ветви исходника начинаются с fixedLv >1.
      if (!chosen) chosen = random() > 0.7 ? 'rat' : 'sheep';
      used.push(chosen);
      const count = Math.max(1, Math.trunc(power * budget / 100 / ENEMIES[chosen].power));
      for (let n = 0; n < count; n++) enemies.push(chosen);
    };
    // Четыре условия специальных волн потребляют броски до проверки низкого уровня.
    random(); random(); random(); random();
    select(randLv(mission.level, 0.25), 15, ['BATCH']);
    select(randLv(mission.level, 0.5), 20, ['BATCH']);
    select(mission.level + 2, 20, []);
    select(randLv(mission.level, 0.4), 15, ['BATCH']);
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
