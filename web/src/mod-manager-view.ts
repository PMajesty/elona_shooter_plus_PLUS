import { getLanguage, onLanguageChanged, t } from './i18n.ts';
import { modLoadResult, setModEnabled, type WeaponModStatus } from './mod-loader.ts';

/**
 * Окно модов (тот же пергамент, что и у окна настроек): каждое оружие из mods/weapons со значком, состоянием и ошибками;
 * моды можно включать и выключать, а набор оружия меняется только после перезагрузки игры.
 */
export function createModManager(dialog: HTMLDialogElement, back: () => void): { open(): void } {
  let initial = new Map<string, boolean>();
  const state = new Map<string, boolean>();

  const element = <K extends keyof HTMLElementTagNameMap>(tag: K, props: Record<string, unknown> = {}, ...children: (Node | string)[]): HTMLElementTagNameMap[K] => {
    const node = document.createElement(tag);
    Object.assign(node, props);
    node.append(...children);
    return node;
  };
  const displayName = (status: WeaponModStatus) => {
    return (getLanguage() === 'ru' ? status.names?.ru : undefined) ?? status.name ?? status.key;
  };
  const changed = () => [...state].some(([key, enabled]) => initial.get(key) !== enabled);

  const render = () => {
    const result = modLoadResult();
    dialog.replaceChildren();
    dialog.append(element('h2', { id: 'mod-manager-heading', tabIndex: -1 }, t('Weapon MODs')));
    const content = element('div', { className: 'options-content' });
    dialog.append(content);
    const intro = element('section');
    intro.append(
      element('h3', {}, t('Weapons')),
      element('p', {}, t('Add a weapon folder to mods/weapons next to index.html. The folder name is the weapon’s registry name; it holds slot.png (192×128) and data.json.')),
      element('p', { className: 'mod-note' }, t('Changes apply after reloading the game. Saved adventures keep weapons from disabled MODs as “Unknown MOD Weapon” until the MOD is enabled again.')),
    );
    content.append(intro);
    const list = element('section', { className: 'mod-list' });
    content.append(list);
    if (!result.available) {
      list.append(element('p', { className: 'mod-error' }, t('MODs are unavailable: mods/index.json could not be loaded. Start the game from a server that lists the mods folder.')));
    } else if (!result.weapons.length) {
      list.append(element('p', {}, t('No weapon MODs found in mods/weapons.')));
    }
    for (const status of result.weapons) {
      const enabled = state.get(status.key) ?? status.enabled;
      const row = element('div', { className: 'mod-row' });
      row.dataset.mod = status.key;
      const toggle = element('input', { type: 'checkbox', checked: enabled, disabled: !result.available });
      toggle.setAttribute('aria-label', `${t('Enable')} ${displayName(status)}`);
      toggle.addEventListener('change', () => { state.set(status.key, toggle.checked); setModEnabled(status.key, toggle.checked); render(); });
      const icon = element('div', { className: 'mod-icon' });
      if (status.iconUrl && !status.errors.some(error => error.includes('slot.png'))) icon.append(element('img', { src: status.iconUrl, alt: '' }));
      const info = element('div', { className: 'mod-info' });
      info.append(element('strong', {}, displayName(status)), element('span', { className: 'mod-key' }, status.key));
      const label = !status.errors.length ? (enabled === status.active ? (status.active ? t('Loaded') : t('Disabled'))
        : enabled ? t('Will be enabled after reloading') : t('Will be disabled after reloading')) : t('Not loaded: fix the errors below');
      info.append(element('span', { className: status.errors.length ? 'mod-status mod-error' : 'mod-status' }, label));
      if (status.errors.length) {
        const errors = element('ul', { className: 'mod-errors' });
        for (const error of status.errors) errors.append(element('li', {}, t(error)));
        info.append(errors);
      }
      const labelWrap = element('label', { className: 'mod-toggle' }, toggle);
      row.append(labelWrap, icon, info);
      list.append(row);
    }
    const actions = element('div', { className: 'options-files' });
    const reload = element('button', { type: 'button', disabled: !changed() }, t('Reload game to apply'));
    reload.addEventListener('click', () => window.location.reload());
    actions.append(reload);
    content.append(actions);
    const form = element('form', { method: 'dialog' }, element('button', {}, t('Back')));
    dialog.append(form);
  };

  dialog.addEventListener('close', () => back());
  dialog.addEventListener('keydown', event => event.stopPropagation());
  onLanguageChanged(() => { if (dialog.open) render(); });
  return {
    open() {
      const result = modLoadResult();
      // Сравниваем с настройкой на момент загрузки: перезагрузка нужна, только если отметки изменились.
      initial = new Map(result.weapons.map(status => [status.key, status.enabled]));
      state.clear();
      for (const status of result.weapons) state.set(status.key, status.enabled);
      render();
      dialog.showModal();
      dialog.querySelector<HTMLElement>('#mod-manager-heading')?.focus({ preventScroll: true });
    },
  };
}
