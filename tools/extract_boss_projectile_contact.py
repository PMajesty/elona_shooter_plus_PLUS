"""Фиксирует независимую проверку точки по исходным атласам и матрицам ally1."""
import hashlib
import json
import math
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'web/public/assets'
OUTPUT = ROOT / 'web/tests/fixtures/boss-projectile-contact.json'
ORIGINAL_SHA256 = '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663'


def main():
    manifest = json.loads((ASSETS / 'manifest.json').read_text(encoding='utf-8'))
    animation = json.loads((ASSETS / 'ally-animation.json').read_text(encoding='utf-8'))
    assert manifest['sourceSha256'] == animation['originalSha256'] == ORIGINAL_SHA256
    atlases = {}
    files = {'ally-animation.json'}
    for key in ['allyBack', 'allyFront', 'charaPic']:
        clip = manifest['clips'][key]
        atlases[key] = (Image.open(ASSETS / clip['image']).convert('RGBA'), json.loads((ASSETS / clip['json']).read_text(encoding='utf-8'))['frames'])
        files.update([clip['image'], clip['json']])

    def pixel(key, frame, x, y):
        image, frames = atlases[key]
        rect = frames[str(frame)]['frame']
        px, py = math.floor(x), math.floor(y)
        inside = 0 <= px < rect['w'] and 0 <= py < rect['h']
        alpha = image.getpixel((rect['x'] + px, rect['y'] + py))[3] if inside else 0
        return {'texture': key, 'textureFrame': frame, 'local': [x, y], 'pixel': [px, py],
                'atlasPixel': [rect['x'] + px, rect['y'] + py], 'insideFrame': inside, 'alpha': alpha}

    def evaluate(pose, wx, wy):
        x, y = (wx - pose['x']) / pose['facing'], wy - pose['y']
        components = []
        for key in ['allyBack', 'allyFront']:
            clip = manifest['clips'][key]
            sample = pixel(key, pose['frame'], x + clip['originX'], y + clip['originY'])
            sample['origin'] = [clip['originX'], clip['originY']]
            components.append(sample)
        for body in animation['frames'][str(pose['frame'])]['bodies']:
            a, b, c, d, tx, ty = body['matrix']
            determinant = a*d - b*c
            if determinant == 0:
                continue
            dx, dy = x - tx, y - ty
            clip = manifest['clips']['charaPic']
            sample = pixel('charaPic', 540 + body['pose'], (d*dx-c*dy)/determinant + clip['originX'], (a*dy-b*dx)/determinant + clip['originY'])
            sample.update(body=body['name'], matrix=body['matrix'], origin=[clip['originX'], clip['originY']])
            components.append(sample)
        return {'hit': any(sample['alpha'] > 0 for sample in components), 'components': components}

    before = {'x': 200, 'y': 220, 'frame': 24, 'facing': -1}
    after = {'x': 200, 'y': 220, 'frame': 201, 'facing': 1}
    point = {'x': 191, 'y': 212}
    samples = [{'name': name, 'pose': pose, **evaluate(pose, point['x'], point['y'])} for name, pose in [('before', before), ('after', after)]]
    assert [sample['hit'] for sample in samples] == [False, True]
    stable = sum(not evaluate(before, point['x']+dx, point['y']+dy)['hit'] and evaluate(after, point['x']+dx, point['y']+dy)['hit'] for dx in [-.2, 0, .2] for dy in [-.2, 0, .2])
    assert stable == 9
    def asset_hash(file):
        data = (ASSETS / file).read_bytes()
        if file.endswith('.json'):
            data = data.replace(b'\r\n', b'\n')
        return hashlib.sha256(data).hexdigest()

    report = {
        'format': 'elona-boss-projectile-contact', 'version': 1, 'originalSha256': ORIGINAL_SHA256,
        'boundary': 'Original extracted atlas alpha and ally1 placement matrices at one known contact; no Flash vector or native scheduler parity claim.',
        'regenerate': 'python tools/extract_boss_projectile_contact.py',
        'appearance': 54, 'point': point, 'samples': samples, 'stableNeighborSamples': stable,
        'assetSha256': {file: asset_hash(file) for file in sorted(files)},
    }
    OUTPUT.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'output': str(OUTPUT.relative_to(ROOT)), 'beforeHit': samples[0]['hit'], 'afterHit': samples[1]['hit'], 'stableNeighborSamples': stable}))


if __name__ == '__main__':
    main()
