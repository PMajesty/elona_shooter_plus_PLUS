import unittest
import xml.etree.ElementTree as ET

from extract_web_assets import placed_frame


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


if __name__ == '__main__':
    unittest.main()
