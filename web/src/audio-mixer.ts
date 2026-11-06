import type Phaser from 'phaser';
import { normalizeAudioSettings, soundCategory, type AudioSettings, type SoundCategory } from './audio-settings.ts';

type Config = Phaser.Types.Sound.SoundConfig;
type Sound = Phaser.Sound.BaseSound & { volume: number; config: Config };
interface Backend { volume: number; add(key: string, config?: Config): Phaser.Sound.BaseSound }

/** Сохраняет исходные громкость, панораму и время каждого звука, добавляя только коэффициенты каналов. */
export class AudioMixer {
  private backend: Backend;
  private levels: AudioSettings;
  private active = new Map<Sound, { category: SoundCategory; volume: number }>();

  constructor(backend: Backend, levels: AudioSettings) {
    this.backend = backend; this.levels = normalizeAudioSettings(levels);
    this.backend.volume = this.levels.master;
  }

  get settings(): AudioSettings { return { ...this.levels }; }

  setSettings(value: AudioSettings): void {
    this.levels = normalizeAudioSettings(value);
    this.backend.volume = this.levels.master;
    for (const [sound, source] of this.active) {
      const volume = source.volume * this.gain(source.category);
      sound.config.volume = volume;
      sound.volume = volume;
    }
  }

  private gain(category: SoundCategory): number {
    return category === 'effects' || category === 'ambience' ? this.levels[category] : 0;
  }

  add(key: string, config: Config = {}): Phaser.Sound.BaseSound {
    const category = soundCategory(key);
    if (category === 'unused') throw new Error(`Sound has no verified playback role: ${key}`);
    const volume = config.volume ?? 1;
    const sound = this.backend.add(key, { ...config, volume: volume * this.gain(category) }) as Sound;
    this.active.set(sound, { category, volume });
    sound.once('destroy', () => this.active.delete(sound));
    return sound;
  }

  play(key: string, config: Config = {}, marker?: { name: string; start: number; duration: number }): boolean {
    const sound = this.add(key, config) as Sound;
    sound.once('complete', sound.destroy, sound);
    if (marker) {
      sound.addMarker({ ...marker, config: { ...config, volume: sound.config.volume } });
      return sound.play(marker.name);
    }
    return sound.play();
  }
}
