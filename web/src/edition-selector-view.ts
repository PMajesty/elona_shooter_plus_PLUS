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
  const backing = scene.add.graphics();
  backing.fillStyle(0xe8d8b5, 1).fillRect(3, 3, bounds.width - 6, bounds.height - 6);
  root.add(backing);
  // Растягиваем середину бумаги, сохраняя пропорции свитка в левом верхнем углу.
  const texture = scene.textures.get('medalHint');
  if (!texture.has('edition-paper')) texture.add('edition-paper', 0, 8, 0, 300, 109);
  const paper = scene.add.nineslice(0, 0, 'medalHint', 'edition-paper', bounds.width, bounds.height, 30, 10, 28, 10)
    .setOrigin(0).setName('edition-parchment');
  root.add(paper);
  root.add(scene.add.image(bounds.width / 2, 7, 'townActionPin', '1').setOrigin(0.5).setScale(0.8));
  const text = (x: number, y: number, value: string, size = 12, color = '#352c20') => {
    const label = scene.add.text(x, y, value, { resolution: 2, fontFamily: 'ElonaMenu', fontSize: `${size}px`, color,
      wordWrap: { width: bounds.width - x - 9 }, padding: { x: 0, y: 1 } });
    root.add(label); return label;
  };
  text(32, 9, 'New game', 13, '#330000').setFontFamily('ElonaMenuBold');
  const description = text(12, 89, DESCRIPTIONS[selected], 11).setName('edition-description');
  const options: EditionChoice[] = ['classic', 'expanded'];
  const radios: Phaser.GameObjects.Image[] = [];
  const labels: Phaser.GameObjects.Text[] = [];
  const choice = selected;
  const paint = () => {
    radios.forEach((radio, index) => radio.setFrame(options[index] === choice ? '2' : '1'));
    labels.forEach((label, index) => label.setColor(options[index] === choice ? '#000099' : '#000000')
      .setFontFamily(options[index] === choice ? 'ElonaMenuBold' : 'ElonaMenu'));
    description.setText(DESCRIPTIONS[choice]); root.setData('selected', choice);
  };
  options.forEach((edition, index) => {
    const y = 24 + index * 32;
    // Кружок занимает только часть прозрачного кадра119×36; масштабируем кадр равномерно.
    const scale = 0.65;
    const radio = scene.add.image(18 - 16.5 * scale, y + 15 - 17.7 * scale, 'radioButton', edition === selected ? '2' : '1')
      .setOrigin(0).setScale(scale).setName(`edition-radio-${edition}`);
    root.add(radio); radios.push(radio);
    labels.push(text(33, y + 7, edition === 'classic' ? 'Classic' : 'Expanded', 15));
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
