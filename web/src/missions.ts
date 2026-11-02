import { ENEMIES, type EnemyKind } from './content.ts';

export interface LowLevelMission {
  level: number; fixedLv: number; strength: number; power: number; powerOrg: number; reward: number;
  hire: false; ragnarok: false; wave: number; spawnRate: number; group: number[];
  waveType: 0; loot: number[]; newWave: true; time: 30; bossDay: boolean; bossWave: number;
  note: ''; hpFix: 1; dmgFix: 1; expFix: 1; absorbFix: number; bossKilled: 0;
  noDamage: true; criticalCount: 0; resultOther: 0;
}

export interface GeneratedWave { enemies: EnemyKind[]; delays: number[]; initialCount: number }
export interface GeneratedWaves { waves: GeneratedWave[]; power: number; group: number[] }

// Миссия готовится до Rest; календарный день определяет гарантированный предмет.
export function generateLowLevelMission(level: number, calendarDay: number, random: () => number, options: { absorbFix?: number; negotiator?: number } = {}): LowLevelMission {
  if (!Number.isInteger(level) || level < 0 || level > MAX_CAMPAIGN_DAY || !validCampaignDay(calendarDay)) throw new RangeError('Unsupported campaign mission preparation.');
  const absorbFix = options.absorbFix ?? 0;
  if (![0, 0.01, 0.02, 0.03, 0.04].includes(absorbFix)) throw new RangeError('Unsupported medal absorption.');
  const negotiator = options.negotiator ?? 0;
  if (!Number.isInteger(negotiator) || !(negotiator === 0 || negotiator >= 9 && negotiator <= 45 && (negotiator - 5) % 4 === 0)) throw new RangeError('Invalid original Negotiator effect.');
  const loot = calendarLoot(calendarDay);
  if (random() > 0.97) loot.unshift(1038);
  const fixedLv = level % 40 + Math.trunc(level / 40) * 3;
  const strength = Math.trunc(level / 40) * 200;
  const bossDay = fixedLv % 10 === 9;
  const wave = bossDay ? 6 + Math.trunc(fixedLv / 10) : 5 + Number(fixedLv > 10) + Number(fixedLv > 20) + Number(fixedLv > 30) + Number(fixedLv > 35);
  const rolledBossWave = bossDay ? wave - 1 : 2 + Math.trunc(random() * wave / 3);
  const power = 800 + fixedLv * 50 + level * 70;
  return {
    // generateMission обновляет PARTY перед расчётом; округление происходит после деления.
    level, fixedLv, strength, power, powerOrg: power, reward: Math.trunc((600 + level * 20) * (100 + negotiator) / 100),
    hire: false, ragnarok: false, wave, spawnRate: Math.max(5, 15 - fixedLv / 5), group: [], waveType: 0,
    loot, newWave: true, time: 30, bossDay, bossWave: level === 0 ? 2 : rolledBossWave,
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
export function generateLowLevelWaves(mission: Readonly<LowLevelMission>, calendarDay: number, random: () => number): GeneratedWaves {
  if (!Number.isInteger(mission.level) || mission.level < 0 || mission.level >= MAX_CAMPAIGN_DAY || !validCampaignDay(calendarDay)) throw new RangeError('Unsupported campaign mission.');
  const expected = generateLowLevelMission(mission.level, calendarDay, () => 0);
  if (mission.wave !== expected.wave || mission.fixedLv !== expected.fixedLv || mission.bossDay !== expected.bossDay
    || !Number.isInteger(mission.bossWave) || mission.bossWave < 2 || mission.bossWave >= mission.wave) throw new RangeError('Invalid campaign wave configuration.');
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
    if (mission.bossDay) {
      if (index === mission.bossWave) for (let n = 0; n < Math.trunc(Math.sqrt(mission.level)); n++) enemies.push('boss');
      else for (let n = 0; n < mission.wave - index - 1; n++) select(randLv(mission.fixedLv, 1), 1, []);
    } else if (random() < 0.1 && mission.level > 3) {
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
      const batch = random() < 0.15 && mission.level > 10;
      if (batch) select(randLv(mission.level - 2, 0.8), 100, ['MASS']);
      else {
        select(randLv(mission.level, 0.25), 15, ['BATCH']);
        if (mission.level > 1) select(randLv(mission.level, 0.8), 15, []);
        select(randLv(mission.level, 0.5), 20, ['BATCH']);
        select(mission.level + 2, 20, []);
        if (mission.level > 1) select(randLv(mission.level, 1), 15, []);
        select(randLv(mission.level, 0.4), 15, ['BATCH']);
      }
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
    if (calendarDay < 10) delays[0] += 20;
    if (index === 0) delays[0] += 50;
    waves.push({ enemies, delays, initialCount: enemies.length });
  }
  return { waves, power, group: waves.map(wave => wave.initialCount) };
}

export const MAX_CAMPAIGN_DAY = 40;
export function validCampaignDay(day: unknown): day is number {
  return typeof day === 'number' && Number.isInteger(day) && day >= 1 && day <= MAX_CAMPAIGN_DAY;
}
export function calendarLoot(day: number): number[] {
  const loot: number[] = [];
  if (day % 8 === 5) loot.push(1037);
  if (day % 6 === 3) loot.push(1035);
  const statues: Record<number, number> = {1:17,2:3,4:2,6:6,9:10,11:7,14:4,17:5,20:9,23:14,26:1,29:8,32:16,35:12,38:13,39:15};
  if (statues[day % 40]) loot.push(1100 + statues[day % 40]);
  return loot;
}
