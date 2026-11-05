"""Русские варианты исходной графики: текстовые слои SWF, без изменения оригинала."""
from pathlib import Path
import html
import json
import re
import xml.etree.ElementTree as ET
import argparse
import copy
import hashlib
import math
import io
import zlib
from concurrent.futures import ThreadPoolExecutor
from PIL import Image, ImageFont, ImageDraw, ImageFilter
import extract_web_assets as original

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / '.build/localization'
DEST = ROOT / 'web/public/assets/ru'
FONT_DIR = ROOT / 'web/public/assets/fonts/ru'
TEXT_TYPES = {'DefineTextTag', 'DefineText2Tag', 'DefineEditTextTag'}
DEFINITION_TYPES = TEXT_TYPES | {'DefineButton2Tag', 'DefineSpriteTag'}


def plain_html(value):
    value = re.sub(r'<br\s*/?>|</p>', '\n', value, flags=re.I)
    return html.unescape(re.sub(r'<[^>]+>', '', value)).strip('\n')


def text_inventory(xml):
    tags = xml.find('tags')
    fonts = {int(t.get('fontID')): t for t in tags if t.get('type') in ('DefineFont2Tag', 'DefineFont3Tag')}
    result = {}
    for tag in tags:
        kind = tag.get('type')
        if kind not in ('DefineTextTag', 'DefineText2Tag', 'DefineEditTextTag'):
            continue
        if kind == 'DefineEditTextTag':
            source = plain_html(tag.get('initialText', '')) if tag.get('html') == 'true' else tag.get('initialText', '')
            font = int(tag.get('fontId', '0')); size = int(tag.get('fontHeight', '240')) / 20
            bounds = tag.find('bounds')
        else:
            lines, line, last_y, font, size = [], '', None, 0, 12
            for record in tag.find('textRecords'):
                if record.get('styleFlagsHasFont') == 'true':
                    font = int(record.get('fontId')); size = int(record.get('textHeight')) / 20
                y = record.get('yOffset', last_y)
                if last_y is not None and y != last_y and line:
                    lines.append(line); line = ''
                code = [int(value.text) for value in fonts[font].find('codeTable')]
                line += ''.join(chr(code[int(glyph.get('glyphIndex'))]) for glyph in record.find('glyphEntries'))
                last_y = y
            lines.append(line); source = '\n'.join(lines); bounds = tag.find('textBounds')
        if source:
            result[tag.get('characterID')] = {'source': source, 'font': fonts.get(font).get('fontName') if font in fonts else '',
                'size': size, 'bounds': [int(bounds.get(v)) / 20 for v in ('Xmin', 'Ymin', 'Xmax', 'Ymax')], 'type': kind}
    return result


def definitions(xml):
    return {int(next(t.get(k) for k in ('characterID', 'spriteId', 'buttonId') if t.get(k))): t
            for t in xml.find('tags') if t.get('type') in DEFINITION_TYPES}


def reachable_text(defs, symbol, seen=None):
    seen = set() if seen is None else seen
    if symbol in seen or symbol not in defs:
        return set()
    seen.add(symbol); tag = defs[symbol]
    if tag.get('type') in TEXT_TYPES:
        return {symbol}
    return set().union(*(reachable_text(defs, int(t.get('characterId')), seen)
                         for t in tag.iter() if t.get('characterId')))


def font_source():
    output = WORK / 'fonts.xml'
    if not output.exists():
        swf = WORK / 'fonts.swf'
        original.ffdec(['-replace', original.SOURCE, swf, 682, FONT_DIR / 'Neucha.ttf',
                        1535, FONT_DIR / 'PT_Sans-Web-Regular.ttf', 1653, FONT_DIR / 'PT_Sans-Web-Bold.ttf'], 'ru-fonts')
        original.ffdec(['-swf2xml', swf, output], 'ru-fonts-xml')
    return ET.parse(output).getroot()


def wrap(value, font, width, multiline):
    lines = []
    for paragraph in value.split('\n'):
        if not multiline:
            lines.append(paragraph); continue
        line = ''
        for word in paragraph.split(' '):
            joined = (line + ' ' + word).strip()
            if line and font.getlength(joined) > width:
                lines.append(line); line = word
            else:
                line = joined
        lines.append(line)
    return lines


def translated_definitions(xml, translations):
    inventory = text_inventory(xml)
    fonts = {int(t.get('fontID')): t for t in xml.find('tags') if t.get('type') in ('DefineFont2Tag', 'DefineFont3Tag')}
    result, fits = {}, []
    for tag in xml.find('tags'):
        if tag.get('type') not in TEXT_TYPES or tag.get('characterID') not in inventory:
            continue
        key = tag.get('characterID'); info = inventory[key]
        value = translations.get(key, info['source'])
        if value == info['source']:
            continue  # Имена авторов, марки и числа сохраняют исходные контуры.
        menu = any(name in info['font'] for name in ('HGP', 'Victorian', 'KaiTi'))
        bold = not menu and any(name in info['font'] for name in ('Bold', 'Impact', 'Times New', 'Optimum', 'Gothic'))
        font_id = 60000 if menu else 60002 if bold else 60001
        filename = 'Neucha.ttf' if menu else 'PT_Sans-Web-Bold.ttf' if bold else 'PT_Sans-Web-Regular.ttf'
        bounds = tag.find('bounds') if tag.get('type') == 'DefineEditTextTag' else tag.find('textBounds')
        width = (int(bounds.get('Xmax')) - int(bounds.get('Xmin'))) / 20
        height = (int(bounds.get('Ymax')) - int(bounds.get('Ymin'))) / 20
        maximum = info['size']; size = maximum
        multiline = '\n' in value or height > maximum * 2
        while True:
            font = ImageFont.truetype(str(FONT_DIR / filename), round(size * 4))
            lines = wrap(value, font, max(1, width - 3) * 4, multiline)
            ink = max((font.getbbox(line or 'А')[3] - font.getbbox(line or 'А')[1]) / 4 for line in lines)
            fits_width = max(font.getlength(line) / 4 for line in lines) <= width - 2
            fits_height = ink + (len(lines) - 1) * size * 1.15 <= height - 1
            if fits_width and fits_height or size <= 6:
                break
            size = max(6, size - 0.5)
        if size < maximum * 0.8 or not fits_width or not fits_height:
            fits.append({'id': key, 'source': info['source'], 'translation': value, 'size': size,
                         'originalSize': maximum, 'fits': fits_width and fits_height})
        node = ET.Element('item', type='DefineEditTextTag', characterID=key, forceWriteAsLong='true',
            fontId=str(font_id), fontHeight=str(round(size * 20)), align=tag.get('align', '0'),
            autoSize='false', border='false', hasFont='true', hasFontClass='false', hasLayout='true',
            hasMaxLength='false', hasText='true', hasTextColor='true', html='false', indent='0',
            initialText='\n'.join(lines), leading='0', leftMargin='0', rightMargin='0', multiline='true',
            noSelect='true', password='false', readOnly='true', useOutlines='true', variableName='',
            wasStatic='false', wordWrap='false')
        rect = copy.deepcopy(bounds); rect.tag = 'bounds'; node.append(rect)
        color = tag.find('textColor')
        if color is None:
            color = tag.find('textRecords/item/textColor')
        attrs = {'type': 'RGBA', 'alpha': '255', 'red': '0', 'green': '0', 'blue': '0'}
        if color is not None:
            attrs.update({k: v for k, v in color.attrib.items() if k != 'type'})
        node.append(ET.Element('textColor', **attrs)); result[key] = node
    return result, fits


def day_badge(xml):
    import cv2
    import numpy as np
    # Day нарисовано внутри bitmap2690; рамку сохраняем, заменяем только внутреннюю надпись.
    tag = next(t for t in xml.find('tags') if t.get('characterID') == '2690')
    picture = Image.open(io.BytesIO(bytes.fromhex(tag.get('imageData')))).convert('RGBA')
    picture.putalpha(Image.frombytes('L', picture.size, zlib.decompress(bytes.fromhex(tag.get('bitmapAlphaData')))))
    # Восстанавливаем фон под буквами из соседних пикселей самого значка.
    # Рамка и её исходная фактура остаются пиксель в пиксель без ресайза.
    pixels = np.array(picture)
    mask = np.zeros((26, 26), dtype=np.uint8)
    # Маска закрывает светлые буквы и тень, оставляя тёмную зелёную текстуру между ними.
    interior = pixels[7:20, 4:22, :3]
    mask[7:20, 4:22] = np.where((interior.min(axis=2) > 90) | (interior.max(axis=2) < 35), 255, 0)
    clean = Image.fromarray(cv2.inpaint(pixels[:, :, :3], mask, 2, cv2.INPAINT_TELEA)).convert('RGBA')
    clean.putalpha(picture.getchannel('A'))
    lettering = Image.new('RGBA', (160, 104))
    draw = ImageDraw.Draw(lettering)
    draw.text((80, 50), 'День', font=ImageFont.truetype(str(FONT_DIR / 'PT_Sans-Web-Bold.ttf'), 48),
              anchor='mm', fill='#eee8d2', stroke_width=2, stroke_fill='#121714')
    letters = lettering.crop(lettering.getbbox()).resize((76, 40), Image.Resampling.LANCZOS)
    lettering = Image.new('RGBA', (104, 104))
    lettering.alpha_composite(letters, (14, 30))
    # Сглаживаем только новые буквы; исходная рамка не проходит повторный ресайз.
    picture = Image.alpha_composite(clean, lettering.resize((26, 26), Image.Resampling.LANCZOS))
    argb = bytearray()
    for r, g, b, a in picture.getdata():
        argb.extend((a, round(r*a/255), round(g*a/255), round(b*a/255)))
    return ET.Element('item', type='DefineBitsLossless2Tag', characterID='2690', bitmapFormat='5',
        bitmapHeight='26', bitmapWidth='26', forceWriteAsLong='true', zlibBitmapData=zlib.compress(argb).hex())


def localize_tree(xml, replacements, font_xml):
    tags = xml.find('tags')
    new_ids = {'682': '60000', '1535': '60001', '1653': '60002'}
    for tag in font_xml.find('tags'):
        if tag.get('fontID') in new_ids:
            font = copy.deepcopy(tag); font.set('fontID', new_ids[tag.get('fontID')]); tags.insert(0, font)
    for index, tag in enumerate(list(tags)):
        replacement = replacements.get(tag.get('characterID'))
        if replacement is not None:
            tags.remove(tag); tags.insert(index, copy.deepcopy(replacement))
    return xml


def export_swf(name, xml):
    path, swf = WORK / f'{name}.xml', WORK / f'{name}.swf'
    ET.ElementTree(xml).write(path, encoding='utf-8', xml_declaration=True)
    original.ffdec(['-xml2swf', path, swf], 'ru-' + name)
    return swf


def svg_origin(path, size):
    root = ET.parse(path).getroot()
    shift = re.search(r'matrix\([^,]+,[^,]+,[^,]+,[^,]+,\s*([^,]+),\s*([^\)]+)\)', list(root)[0].get('transform'))
    width = math.ceil(float(root.get('width').removesuffix('px')))
    height = math.ceil(float(root.get('height').removesuffix('px')))
    return float(shift[1]) + (size[0] - width) / 2, float(shift[2]) + (size[1] - height) / 2


def normalize(image, origin, asset, size=None):
    # Регистрация и размер английского атласа остаются неизменными при смене языка.
    canvas = Image.new('RGBA', size or (int(asset['width']), int(asset['height'])))
    canvas.alpha_composite(image, (round(asset['originX'] - origin[0]), round(asset['originY'] - origin[1])))
    return canvas


def build_assets(only=None):
    source = ET.parse(ROOT / '.build/reference/original.xml').getroot()
    manifest = json.loads((original.DEST / 'manifest.json').read_text())
    translations = json.loads((ROOT / 'web/src/locales/ru-images.json').read_text(encoding='utf-8'))
    replacements, fits = translated_definitions(source, translations)
    font_xml = font_source(); defs = definitions(source)
    replacements['2690'] = day_badge(source)
    DEST.mkdir(parents=True, exist_ok=True)
    localized = {'images': {}, 'clips': {}, 'hitMasks': {}}
    stamp = hashlib.sha256(json.dumps(translations, ensure_ascii=False).encode() + Path(__file__).read_bytes()).hexdigest()
    cache = WORK / 'render-cache'; cache.mkdir(exist_ok=True)
    def cached(key, action):
        if only and key not in only:
            return
        marker = cache / f'{key}.stamp'
        if not marker.exists() or marker.read_text() != stamp:
            action(); marker.write_text(stamp)
    # Готовые XML кадров уже содержат точные исключения динамических полей и смещения.
    jobs = []
    for key, asset in manifest['images'].items():
        if not asset['file'].startswith('screens/'):
            continue
        path = original.WORK / f'{key}.xml'
        tree = ET.parse(path).getroot(); screen_defs = definitions(tree)
        visible = set().union(*(reachable_text(screen_defs, int(t.get('characterId')))
                               for t in tree.find('tags') if t.get('type', '').startswith('PlaceObject') and t.get('characterId')))
        if not visible and key not in {'battle', 'townHud', 'townScene'}:
            continue
        localized['images'][key] = asset['file']
        def render(key=key, asset=asset, tree=tree):
            swf = export_swf(key, localize_tree(tree, replacements, font_xml))
            directory = WORK / ('frames-' + key)
            double = asset['file'].endswith('.webp')
            original.ffdec(['-ignorebackground', '-zoom', '2' if double else '1', '-export', 'frame', directory, swf], 'ru-frame-' + key)
            picture = Image.open(directory / '1.png').convert('RGBA')
            if double:
                x, y = round(-asset['originX'] * 2), round(-asset['originY'] * 2)
                picture = picture.crop((x, y, x + round(asset['width'] * 2), y + round(asset['height'] * 2)))
            output = DEST / asset['file']; output.parent.mkdir(parents=True, exist_ok=True)
            picture.save(output, **({'lossless': True} if double else {'optimize': True}))
        jobs.append((key, render))
    with ThreadPoolExecutor(max_workers=3) as pool:
        list(pool.map(lambda job: cached(*job), jobs))
    ru_source = WORK / 'source.swf'
    cached('source', lambda: export_swf('source', localize_tree(copy.deepcopy(source), replacements, font_xml)))
    buttons = {key: symbol for key, symbol in original.BUTTONS.items() if reachable_text(defs, symbol)}
    png_dir, svg_dir = WORK / 'buttons', WORK / 'buttons-svg'
    def render_buttons():
        ids = ','.join(map(str, buttons.values()))
        original.ffdec(['-ignorebackground', '-selectid', ids, '-export', 'button', png_dir, ru_source], 'ru-buttons')
        original.ffdec(['-ignorebackground', '-selectid', ids, '-format', 'button:svg', '-export', 'button', svg_dir, ru_source], 'ru-buttons-svg')
    cached('buttons', render_buttons)
    nav_shadows = {int(t.get('characterId')): t.find('surfaceFilterList/item')
                   for t in original.placed_frame(source.find('tags'), 71) if t.get('name') in
                   {'missionButton', 'castleButton', 'charaButton', 'equipButton', 'shopButton', 'medalButton'}}
    for key, symbol in buttons.items():
        for state in ['1_up', '2_over', '3_down', '4_hittest']:
            image = Image.open(png_dir / f'DefineButton2_{symbol}' / f'{state}.png').convert('RGBA')
            origin = svg_origin(svg_dir / f'DefineButton2_{symbol}' / f'{state}.svg', image.size)
            name = key if state in ('1_up', '4_hittest') else key + '_' + state.split('_')[1]
            asset = manifest['images'][name]; result = normalize(image, origin, asset)
            if state == '4_hittest':
                import base64
                localized['hitMasks'][key] = base64.b64encode(result.getchannel('A').point(lambda v: 255 if v >= 100 else 0, '1').tobytes()).decode()
                continue
            output = DEST / asset['file']; output.parent.mkdir(parents=True, exist_ok=True); result.save(output, optimize=True)
            localized['images'][name] = asset['file']
            shadow_key = name + '_shadow'
            if shadow_key in manifest['images']:
                filt = nav_shadows[symbol]; radius = float(filt.get('blurX')) / 2
                distance, angle = float(filt.get('distance')), float(filt.get('angle'))
                pad = math.ceil(radius + distance)
                alpha = Image.new('L', (result.width + 2 * pad, result.height + 2 * pad))
                alpha.paste(result.getchannel('A'), (pad + round(distance * math.cos(angle)), pad + round(distance * math.sin(angle))))
                strength = float(filt.get('strength')) * int(filt.find('dropShadowColor').get('alpha')) / 255
                shadow = Image.new('RGBA', alpha.size)
                shadow.putalpha(alpha.filter(ImageFilter.BoxBlur(radius)).point(lambda v: round(v * strength)))
                shadow.save(DEST / manifest['images'][shadow_key]['file'], optimize=True)
                localized['images'][shadow_key] = manifest['images'][shadow_key]['file']
    # Остаточные надписи в атласах: те же координаты, кадры и прозрачные поля.
    clip_sources = {'itemPicture': 'runtime-clips', 'radioButton': 'runtime-clips', 'inventorySlot': 'runtime-clips',
        'itemPopup': 'item-popup', 'infoPopup': 'info-popup', 'partyPortraitBackground': 'party-portrait-background',
        'castleUpgradeTiles': 'castle-tiles', 'levelUp': 'ally-level-up'}
    for key, asset in manifest['clips'].items():
        symbol = asset.get('characterId')
        if not reachable_text(defs, symbol):
            continue
        tree = ET.parse(original.WORK / f'{clip_sources[key]}.xml').getroot() if key in clip_sources else copy.deepcopy(source)
        if not reachable_text(definitions(tree), symbol):
            continue
        def render_clip(key=key, asset=asset, tree=tree, symbol=symbol):
            swf = export_swf('clip-' + key, localize_tree(tree, replacements, font_xml))
            directory, svgs = WORK / ('clip-' + key), WORK / ('clip-' + key + '-svg')
            original.ffdec(['-ignorebackground', '-selectid', str(symbol), '-export', 'sprite', directory, swf], 'ru-clip-' + key)
            original.ffdec(['-ignorebackground', '-selectid', str(symbol), '-format', 'sprite:svg', '-export', 'sprite', svgs, swf], 'ru-clip-svg-' + key)
            pngs = original.sprite_directory(directory, symbol); vectors = original.sprite_directory(svgs, symbol)
            atlas = json.loads((original.DEST / asset['json']).read_text()); picture = Image.open(original.DEST / asset['image']).convert('RGBA')
            done = set()
            for number, frame in atlas['frames'].items():
                rect = frame['frame']; bounds = (rect['x'], rect['y'], rect['x'] + rect['w'], rect['y'] + rect['h'])
                if bounds in done:
                    continue
                done.add(bounds)
                source_image = Image.open(pngs / f'{number}.png').convert('RGBA')
                origin = svg_origin(vectors / f'{number}.svg', source_image.size)
                normal = normalize(source_image, origin, asset, (rect['w'], rect['h']))
                picture.paste(normal, bounds[:2])
            output = DEST / asset['image']; output.parent.mkdir(parents=True, exist_ok=True); picture.save(output, optimize=True)
        cached('clip-' + key, render_clip)
        localized['clips'][key] = asset['image']
    # Game Over используется как отдельная картинка, но источник остаётся клипом.
    key, symbol = 'gameOver', 2741; asset = manifest['images'][key]
    def render_game_over():
        tree = ET.parse(original.WORK / 'runtime-clips.xml').getroot()
        swf = export_swf(key, localize_tree(tree, replacements, font_xml))
        directory, svgs = WORK / key, WORK / (key + '-svg')
        original.ffdec(['-ignorebackground', '-selectid', str(symbol), '-export', 'sprite', directory, swf], 'ru-gameOver')
        original.ffdec(['-ignorebackground', '-selectid', str(symbol), '-format', 'sprite:svg', '-export', 'sprite', svgs, swf], 'ru-gameOver-svg')
        pngs, vectors = original.sprite_directory(directory, symbol), original.sprite_directory(svgs, symbol)
        frame = Image.open(pngs / '1.png').convert('RGBA')
        picture = normalize(frame, svg_origin(vectors / '1.svg', frame.size), asset)
        output = DEST / asset['file']; output.parent.mkdir(parents=True, exist_ok=True); picture.save(output, optimize=True)
    cached(key, render_game_over); localized['images'][key] = asset['file']
    (DEST / 'manifest.json').write_text(json.dumps(localized, indent=2) + '\n', encoding='utf-8')
    (WORK / 'text-fit.json').write_text(json.dumps(fits, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({'images': len(localized['images']), 'clips': len(localized['clips']), 'fitWarnings': len(fits)}))


if __name__ == '__main__':
    WORK.mkdir(parents=True, exist_ok=True)
    parser = argparse.ArgumentParser(description=__doc__); parser.add_argument('--build', action='store_true')
    parser.add_argument('--only', nargs='+', help='Rebuild selected asset keys; keep other existing exports.'); args = parser.parse_args()
    inventory = text_inventory(ET.parse(ROOT / '.build/reference/original.xml').getroot())
    (WORK / 'image-source.json').write_text(json.dumps(inventory, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'{len(inventory)} original text symbols inventoried', flush=True)
    if args.build:
        build_assets(set(args.only) if args.only else None)
