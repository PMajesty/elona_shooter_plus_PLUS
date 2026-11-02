"""Извлекает графику и команды кадров остальных обычных врагов из сохранённого SWF."""
import json
import hashlib
import re
import xml.etree.ElementTree as ET
from pathlib import Path

import extract_web_assets as assets

KINDS = ['cata', 'spider', 'ghost', 'ogre', 'knight', 'bird', 'tank', 'dino', 'dragon']


def extract_dropped_rat(xml, manifest):
    symbol = 1258
    for suffix, directory, extra in [('png', assets.CACHE, []), ('svg', assets.ROOT / '.build/svg-bounds', ['-format', 'sprite:svg'])]:
        if not list(directory.glob(f'DefineSprite_{symbol}*')):
            assets.ffdec(['-ignorebackground', '-selectid', symbol, *extra, '-export', 'sprite', directory, assets.SOURCE], 'dropped-rat-' + suffix)
    sprite = next(tag for tag in xml.find('tags') if tag.get('type') == 'DefineSpriteTag' and tag.get('spriteId') == str(symbol))
    manifest['clips']['droppedRatBody'] = assets.atlas('droppedRatBody', symbol, sprite)


def main():
    if hashlib.sha256(assets.SOURCE.read_bytes()).hexdigest() != assets.ORIGINAL_SHA256:
        raise ValueError('Original SWF differs from the preserved baseline')
    xml = ET.parse(assets.ROOT / '.build/reference/original.xml').getroot()
    sprites = {int(tag.get('spriteId')): tag for tag in xml.find('tags') if tag.get('type') == 'DefineSpriteTag'}
    sources = {kind: (assets.CACHE / 'scripts' / f'enemy_{kind}.as').read_text(encoding='utf-8') for kind in KINDS}
    symbols = {kind: int(re.search(r'symbol(\d+)', source)[1]) for kind, source in sources.items()}
    for suffix, root, extra in [('png', assets.CACHE, []), ('svg', assets.ROOT / '.build/svg-bounds', ['-format', 'sprite:svg'])]:
        missing = [symbol for symbol in symbols.values() if not list(root.glob(f'DefineSprite_{symbol}*'))]
        if missing:
            assets.ffdec(['-ignorebackground', '-selectid', ','.join(map(str, missing)), *extra,
                          '-export', 'sprite', root, assets.SOURCE], 'campaign-enemies-' + suffix)
    manifest_path = assets.DEST / 'manifest.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    extract_dropped_rat(xml, manifest)
    timelines = {}
    for kind, symbol in symbols.items():
        sprite = sprites[symbol]
        clip = assets.atlas('enemy_' + kind, symbol, sprite)
        manifest['clips']['enemy_' + kind] = clip
        rows = {}
        for number, body in re.findall(r'function frame(\d+)\(\) : \*\s*\{(.*?)\n      \}', sources[kind], re.S):
            row = {}
            jump = re.search(r'gotoAnd(?:Play|Stop)\("([^"]+)"\)', body)
            if jump:
                row['jump'] = clip['labels'][jump[1]]
            if re.search(r'\bstop\(\)', body):
                row['stop'] = True
            if '_root.damageCastle' in body:
                row['damage'] = True
            if '_root.alert(' in body:
                row['alert'] = True
            if '_parent.attacked = true' in body:
                row['attacked'] = True
            shadow = re.search(r'shadowHit = (true|false)', body)
            if shadow:
                row['shadow'] = shadow[1] == 'true'
            if row:
                rows[number] = row
        timelines[kind] = {'labels': clip['labels'], 'count': clip['count'], 'frames': rows}
    target = assets.ROOT / 'web/src/enemy-timelines.ts'
    target.write_text('// Сгенерировано tools/extract_campaign_enemies.py из исходных кадров SWF.\n'
                      'export interface EnemyFrameAction { jump?: number; stop?: boolean; damage?: boolean; alert?: boolean; attacked?: boolean; shadow?: boolean }\n'
                      'export interface EnemyTimeline { labels: Record<string, number>; count: number; frames: Record<number, EnemyFrameAction> }\n'
                      'export const ENEMY_TIMELINES: Record<string, EnemyTimeline> = '
                      + json.dumps(timelines, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    provenance_path = assets.ROOT / 'docs/asset-manifest.json'
    if provenance_path.exists():
        provenance = json.loads(provenance_path.read_text(encoding='utf-8'))
        provenance['counts'] = {key: len(manifest[key]) for key in ['images', 'clips', 'sounds', 'fonts']}
        provenance['campaignEnemies'] = {'symbols': symbols, 'timelines': 'web/src/enemy-timelines.ts',
                                         'collision': 'raster alpha for later enemies; filled contours retained for early enemies'}
        provenance['runtimeAdjustments'] = [text.replace('Ordinary enemy collision uses original filled contours and placement matrices, not bitmap alpha',
            'Early enemies use source filled contours; later enemy atlases currently use raster alpha collision') for text in provenance.get('runtimeAdjustments', [])]
        provenance_path.write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print('Extracted original atlases and frame commands for ' + ', '.join(KINDS))


if __name__ == '__main__':
    main()
