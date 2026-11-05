import { Simulation, type SimulationOptions, type SimulationState } from './simulation.ts';
import { supportedSaveVersion } from './save-version.ts';
import { validProfile, profileRuleset, type GlobalProfile } from './profile.ts';
import { GAME_OPTIONS_VERSION, defaultGameOptions, validGameOptions, type GameOptions } from './game-options.ts';
import { canSaveAdventure } from './storage.ts';

export interface PortSave { format: 'elona-shooter-browser'; version: number; appearance: number; simulation: unknown; profile?: GlobalProfile; carryCheckpoint?: unknown; options?: GameOptions; optionsVersion?: typeof GAME_OPTIONS_VERSION }
export interface ParsedAdventure { simulation: Simulation; appearance: number; profile?: GlobalProfile; carryCheckpoint?: SimulationState; options: GameOptions }

// Разбор не меняет коллекции, слот или активную игру. Запись происходит только после принятия импорта.
export function parseAdventureSave(raw: unknown, options: SimulationOptions = {}, ignoreProfileError = false): ParsedAdventure {
  const save = raw as Partial<PortSave> | null;
  if (!save || save.format !== 'elona-shooter-browser' || !supportedSaveVersion(save.version) || !Number.isInteger(save.appearance) || save.appearance! < 0 || save.appearance! > 21) throw new Error('This is not a supported browser-port save. Select an original .sol file to import a Flash adventure.');
  if (save.options !== undefined && !validGameOptions(save.options)) throw new Error('This save contains invalid game options.');
  if (save.optionsVersion !== undefined && save.optionsVersion !== GAME_OPTIONS_VERSION) throw new Error('This save contains invalid game option settings.');
  if (!save.simulation || typeof save.simulation !== 'object' || (save.simulation as { version?: unknown }).version !== save.version) throw new Error('Inconsistent save format versions.');
  const simulation = Simulation.fromSave(save.simulation, options);
  const validCollection = validProfile(save.profile);
  if (save.profile !== undefined && !validCollection && !ignoreProfileError) throw new Error('This save contains an invalid medal collection.');
  if (validCollection && profileRuleset(save.profile!) !== simulation.state.ruleset.id) throw new Error('This medal collection belongs to a different game edition.');
  if (!canSaveAdventure(simulation.state)) throw new Error('Hardcore games can only be restored in town.');
  const carryCheckpoint = save.carryCheckpoint === undefined ? undefined : simulation.readCarryCheckpoint(save.carryCheckpoint);
  if (carryCheckpoint && save.version! < 36) throw new Error('Invalid Carry Over save version.');
  const displayOptions = { ...(save.options ?? defaultGameOptions(simulation.state.ruleset.id)) };
  // Старые Expanded-сохранения записывали общий выключенный флаг NPC даже без выбора игрока.
  // Включаем новый стандарт один раз; новая версия настроек сохраняет последующий отказ.
  if (simulation.state.ruleset.id === 'expanded' && save.optionsVersion === undefined) displayOptions.showAllyDamage = true;
  return { simulation, appearance: save.appearance!, options: displayOptions, ...(validCollection ? { profile: structuredClone(save.profile!) } : {}), ...(carryCheckpoint ? { carryCheckpoint } : {}) };
}
