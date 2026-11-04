import Phaser from 'phaser';

export type EditionChoice = 'classic' | 'expanded';
export const EDITION_SELECTOR_BOUNDS = { x: 425, y: 180, width: 185, height: 132 } as const;

const DESCRIPTIONS: Record<EditionChoice, string> = {
  classic: 'Faithful port + bug fixes.\nIndependent medals.',
  expanded: 'Original game + new features.\nIndependent medals.',
};

/** Панель не меняет сохранения: владелец сцены обрабатывает выбор и блокировку диалогами. */
export function createEditionSelector(scene: Phaser.Scene, selected: EditionChoice,
  onSelect: (edition: EditionChoice) => void): Phaser.GameObjects.Container {
  const bounds = EDITION_SELECTOR_BOUNDS;
  const root = scene.add.container(bounds.x, bounds.y).setName('edition-selector');
  root.setSize(bounds.width, bounds.height).setData({ selected, bounds: { ...bounds } });
  // Однотонная подложка, без новых текстур и без перекрытия исходного логотипа.
  const plate = scene.add.graphics();
  plate.fillStyle(0xe9d9b2, 0.96).fillRoundedRect(0, 0, bounds.width, bounds.height, 3);
  plate.lineStyle(1, 0x6b5639, 0.9).strokeRoundedRect(0.5, 0.5, bounds.width - 1, bounds.height - 1, 3);
  plate.lineStyle(1, 0x8d7957, 0.45).lineBetween(9, 91, bounds.width - 9, 91);
  root.add(plate);
  const text = (x: number, y: number, value: string, size = 12, color = '#352c20') => {
    const label = scene.add.text(x, y, value, { resolution: 2, fontFamily: 'Arial', fontSize: `${size}px`, color,
      wordWrap: { width: bounds.width - x - 9 }, padding: { x: 0, y: 1 } });
    root.add(label); return label;
  };
  text(10, 6, 'NEW GAME EDITION', 11, '#5a452b').setFontStyle('bold');
  const description = text(10, 97, DESCRIPTIONS[selected], 10.5).setName('edition-description');
  const options: EditionChoice[] = ['classic', 'expanded'];
  const radios: Phaser.GameObjects.Image[] = [];
  const labels: Phaser.GameObjects.Text[] = [];
  const choice = selected;
  const paint = () => {
    radios.forEach((radio, index) => radio.setFrame(options[index] === choice ? '2' : '1'));
    labels.forEach((label, index) => label.setColor(options[index] === choice ? '#172e5a' : '#352c20')
      .setFontStyle(options[index] === choice ? 'bold' : 'normal'));
    description.setText(DESCRIPTIONS[choice]); root.setData('selected', choice);
  };
  options.forEach((edition, index) => {
    const y = 24 + index * 32;
    // Кружок занимает только часть прозрачного кадра119×36; масштабируем кадр равномерно.
    const scale = 0.65;
    const radio = scene.add.image(18 - 16.5 * scale, y + 15 - 17.7 * scale, 'radioButton', edition === selected ? '2' : '1')
      .setOrigin(0).setScale(scale).setName(`edition-radio-${edition}`);
    root.add(radio); radios.push(radio);
    labels.push(text(33, y + 7, edition === 'classic' ? 'Classic' : 'Expanded', 13));
    // Вся строка, а не только маленький кружок, доступна для касания.
    const hit = scene.add.zone(7, y, bounds.width - 14, 30).setOrigin(0)
      .setInteractive({ useHandCursor: true }).setName(`edition-choice-${edition}`);
    root.add(hit);
    hit.on('pointerover', () => labels[index].setColor('#000099'));
    hit.on('pointerout', paint);
    hit.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      if (choice === edition) return;
      onSelect(edition);
    });
  });
  paint();
  return root;
}
