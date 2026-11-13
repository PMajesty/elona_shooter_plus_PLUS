"""Подмножества китайских шрифтов только с символами китайских каталогов, для сайта и localize_web_assets.py.

Запуск: python tools/subset_zh_fonts.py <LXGWWenKai-Medium.ttf> <NotoSansSC[wght].ttf>
Источники шрифтов (оба под SIL OFL 1.1):
- LXGW WenKai Medium: https://github.com/lxgw/LxgwWenKai/releases
- вариативный Noto Sans SC: https://github.com/google/fonts/tree/main/ofl/notosanssc
Запускайте заново после изменения web/src/locales/zh-*.ts или zh-images.json, иначе новые иероглифы покажет системный шрифт.
"""
import argparse
import json
import re
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parents[1]
LOCALES = ROOT / 'web/src/locales'
DEST = ROOT / 'web/public/assets/fonts/zh'
ENTRY = re.compile(r'^\s*("(?:[^"\\]|\\.)*")\s*:\s*("(?:[^"\\]|\\.)*"),?\s*$')
# Динамически собранные числа, английские имена и обычная пунктуация: ASCII, Latin-1, общая пунктуация, знаки CJK и полноширинные формы.
RANGES = [(0x20, 0x7E), (0xA0, 0xFF), (0x2010, 0x2027), (0x2030, 0x203A), (0x3000, 0x3011), (0xFF01, 0xFF5E)]


def catalog_text():
    values = []
    for name in ('zh-ui.ts', 'zh-content.ts'):
        for line in (LOCALES / name).read_text(encoding='utf-8').splitlines():
            match = ENTRY.match(line)
            if match:
                values.append(json.loads(match[2]))
    values += json.loads((LOCALES / 'zh-images.json').read_text(encoding='utf-8')).values()
    characters = {character for value in values for character in value if character >= ' '}
    characters |= {chr(code) for start, end in RANGES for code in range(start, end + 1)}
    return ''.join(sorted(characters))


def rename(font, family, style):
    """OFL LXGW WenKai резервирует названия шрифта; подмножество как изменённая версия получает нейтральное имя, записи об авторских правах и лицензии сохраняются."""
    table = font['name']
    postscript = family.replace(' ', '') + '-' + style
    table.names = [record for record in table.names if record.nameID not in (1, 2, 3, 4, 6, 16, 17, 18, 19, 21, 22)]
    for name_id, value in ((1, family), (2, 'Regular'), (3, f'{postscript}:subset'), (4, f'{family} {style}'), (6, postscript)):
        table.setName(value, name_id, 3, 1, 0x409)


def write_subset(font, text, output, family=None, style=None):
    options = subset.Options()
    options.layout_features = ['*']
    options.name_IDs = ['*']
    options.name_languages = ['*']
    options.notdef_outline = True
    options.hinting = False
    subsetter = subset.Subsetter(options)
    subsetter.populate(text=text)
    subsetter.subset(font)
    if family:
        rename(font, family, style)
    font.save(output)
    return output.stat().st_size


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('wenkai', type=Path)
    parser.add_argument('noto', type=Path)
    args = parser.parse_args()
    text = catalog_text()
    DEST.mkdir(parents=True, exist_ok=True)
    sizes = {'characters': len(text)}
    sizes['LXGWWenKai-Subset.ttf'] = write_subset(TTFont(args.wenkai), text, DEST / 'LXGWWenKai-Subset.ttf',
                                                  'Elona Chinese Menu', 'Medium')
    for weight, name in ((400, 'NotoSansSC-Regular-Subset.ttf'), (700, 'NotoSansSC-Bold-Subset.ttf')):
        # Сначала фиксируется насыщенность вариативного шрифта, чтобы FFDec и Pillow получили статический TrueType.
        static = instancer.instantiateVariableFont(TTFont(args.noto), {'wght': weight}, updateFontNames=True)
        sizes[name] = write_subset(static, text, DEST / name)
    print(json.dumps(sizes))


if __name__ == '__main__':
    main()
