import type Phaser from 'phaser';
import { t, onLanguageChanged } from './i18n.ts';
import type { AudioChannel, AudioSettings } from './audio-settings.ts';
import { bindTouchSafeDismiss } from './touch-scroll.ts';

/** Нативные ползунки поддерживают касание и клавиатуру; бумага остаётся исходной графикой игры. */
export function createAudioSettingsView(scene: Phaser.Scene, playfield: HTMLElement, settings: AudioSettings,
  muted: boolean, change: (settings: AudioSettings) => void, toggleMute: () => void, close?: () => void) {
  const x = close ? 192.5 : 375, y = close ? 110 : 56, width = 235, height = 144;
  const root = scene.add.container(x, y).setName('audio-settings');
  if (close) {
    const shade = scene.add.rectangle(-x, -y, 620, 380, 0, 0.45).setOrigin(0).setInteractive();
    root.add(shade); bindTouchSafeDismiss(scene, root, shade, close);
  }
  const texture = scene.textures.get('medalHint');
  if (!texture.has('audio-paper')) texture.add('audio-paper', 0, 8, 0, 300, 109);
  root.add(scene.add.rectangle(3, 3, width - 6, height - 6, 0xe8d8b5).setOrigin(0));
  root.add(scene.add.nineslice(0, 0, 'medalHint', 'audio-paper', width, height, 30, 10, 28, 10).setOrigin(0));
  const panel = document.createElement('section');
  panel.id = 'audio-settings'; panel.setAttribute('role', close ? 'dialog' : 'group');
  if (close) panel.setAttribute('aria-modal', 'true');
  // Ручка берёт металлический кружок из исходной радиокнопки, без её текстовой области.
  const radio = scene.textures.get('radioButton'), frame = radio.get('1');
  if (!radio.has('audio-knob')) radio.add('audio-knob', frame.sourceIndex, frame.cutX + 7, frame.cutY + 8, 19, 20);
  for (const [property, key, frame] of [['--audio-knob', 'radioButton', 'audio-knob'],
    ['--audio-check-off', 'partyCheckOff', '1'], ['--audio-check-on', 'partyCheckOn', '1'],
    ['--audio-close', 'button_windowClose', undefined], ['--audio-close-over', 'button_windowClose_over', undefined]] as const) {
    panel.style.setProperty(property, `url("${scene.textures.getBase64(key, frame)}")`);
  }
  const previousFocus = document.activeElement;
  let closeButton: HTMLButtonElement | undefined;
  if (close) {
    closeButton = document.createElement('button'); closeButton.type = 'button'; closeButton.className = 'audio-close';
    closeButton.addEventListener('click', close); panel.append(closeButton);
    panel.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const controls = [...panel.querySelectorAll<HTMLElement>('button, input')];
      const index = controls.indexOf(document.activeElement as HTMLElement);
      if (event.shiftKey && index === 0 || !event.shiftKey && index === controls.length - 1) {
        event.preventDefault(); controls[event.shiftKey ? controls.length - 1 : 0].focus();
      }
    });
  }
  const header = document.createElement('header'), title = document.createElement('strong');
  const muteLabel = document.createElement('label'), muteText = document.createElement('span'), mute = document.createElement('input');
  mute.type = 'checkbox'; mute.checked = muted; mute.id = 'audio-mute';
  mute.addEventListener('change', toggleMute);
  muteLabel.append(mute, muteText); header.append(title, muteLabel); panel.append(header);
  const labels: [HTMLElement, string][] = [[title, 'Sound'], [muteText, 'Mute audio']];
  for (const [key, name] of [['master', 'Master volume'], ['effects', 'Effects'], ['ambience', 'Ambience']] as [AudioChannel, string][]) {
    const row = document.createElement('label'), label = document.createElement('span');
    const input = document.createElement('input'), value = document.createElement('output');
    input.type = 'range'; input.min = '0'; input.max = '100'; input.step = '5'; input.id = `audio-${key}`;
    input.value = String(Math.round(settings[key] * 100)); value.textContent = `${input.value}%`;
    value.htmlFor = input.id;
    input.addEventListener('input', () => {
      settings = { ...settings, [key]: Number(input.value) / 100 };
      value.textContent = `${input.value}%`; change(settings);
    });
    row.className = 'audio-row'; row.append(label, input, value); panel.append(row); labels.push([label, key === 'master' ? 'Master' : name]);
  }
  const localize = () => {
    panel.setAttribute('aria-label', t('Sound'));
    closeButton?.setAttribute('aria-label', t('Close sound settings'));
    for (const [element, key] of labels) element.textContent = t(key);
    panel.querySelector('#audio-master')?.setAttribute('aria-label', t('Master volume'));
  };
  localize(); const unlisten = onLanguageChanged(localize);
  const resize = () => {
    const size = scene.scale.displaySize, bounds = playfield.getBoundingClientRect(), scale = size.width / 620;
    panel.style.left = `${(bounds.width - size.width) / 2 + x * scale}px`;
    panel.style.top = `${(bounds.height - size.height) / 2 + y * scale}px`;
    panel.style.transform = `scale(${scale})`;
  };
  playfield.append(panel); resize(); scene.scale.on('resize', resize);
  if (close) mute.focus({ preventScroll: true });
  root.once('destroy', () => {
    const restoreFocus = close && panel.contains(document.activeElement);
    panel.remove(); unlisten(); scene.scale.off('resize', resize);
    if (restoreFocus && previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
  });
  return { root, sync(visible: boolean, isMuted: boolean) {
    root.setVisible(visible); panel.hidden = !visible; mute.checked = isMuted;
  } };
}
