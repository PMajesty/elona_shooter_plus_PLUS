import json
import unittest
import xml.etree.ElementTree as ET

from PIL import Image
from extract_web_assets import DEST, placed_frame


class PlacedFrameTests(unittest.TestCase):
    def test_matrix_only_move_keeps_placeobject3_filters(self):
        tags = ET.fromstring('''<subTags>
          <item type="PlaceObject3Tag" depth="2" characterId="1973" placeFlagHasFilterList="true">
            <matrix translateX="0"/><surfaceFilterList/>
          </item><item type="ShowFrameTag"/>
          <item type="PlaceObject2Tag" depth="2" placeFlagMove="true">
            <matrix translateX="120"/>
          </item><item type="ShowFrameTag"/>
        </subTags>''')
        result = placed_frame(tags, 2)[0]
        self.assertEqual(result.get('type'), 'PlaceObject3Tag')
        self.assertEqual(result.get('characterId'), '1973')
        self.assertEqual(result.find('matrix').get('translateX'), '120')
        self.assertIsNotNone(result.find('surfaceFilterList'))
        self.assertEqual(tags[0].find('matrix').get('translateX'), '0')

    def test_plain_placement_can_gain_placeobject3_fields(self):
        tags = ET.fromstring('''<subTags>
          <item type="PlaceObject2Tag" depth="2" characterId="1973"><matrix translateX="0"/></item>
          <item type="ShowFrameTag"/>
          <item type="PlaceObject3Tag" depth="2" placeFlagMove="true" placeFlagHasFilterList="true">
            <surfaceFilterList/>
          </item><item type="ShowFrameTag"/>
        </subTags>''')
        result = placed_frame(tags, 2)[0]
        self.assertEqual(result.get('type'), 'PlaceObject3Tag')
        self.assertEqual(result.get('characterId'), '1973')
        self.assertIsNotNone(result.find('surfaceFilterList'))


class EnemyAtlasTests(unittest.TestCase):
    def test_shipped_enemy_frames_have_transparent_sampling_gutters(self):
        failures = []
        atlases = sorted((DEST / "sprites").glob("enemy_*.json"))
        self.assertTrue(atlases)
        for path in atlases:
            data = json.loads(path.read_text(encoding="utf-8"))
            with Image.open(path.with_suffix(".png")) as image:
                alpha = image.convert("RGBA").getchannel("A")
            frames = {tuple(entry["frame"][key] for key in ("x", "y", "w", "h"))
                      for entry in data["frames"].values()}
            for x, y, w, h in frames:
                # Фильтрация может читать соседний тексель даже при неизменной геометрии кадра.
                if x < 1 or y < 1 or x + w >= alpha.width or y + h >= alpha.height:
                    failures.append(f"{path.stem}: no outer gutter at {x},{y}")
                    continue
                for box in ((x - 1, y - 1, x + w + 1, y), (x - 1, y + h, x + w + 1, y + h + 1),
                            (x - 1, y, x, y + h), (x + w, y, x + w + 1, y + h)):
                    if alpha.crop(box).getbbox():
                        failures.append(f"{path.stem}: neighboring pixels at {x},{y}")
                        break
        self.assertEqual(len(failures), 0, "\n".join(failures[:16]))


if __name__ == '__main__':
    unittest.main()
