"""Извлекает заставку и авторские дорожки главного меню из исходного SWF."""
import copy
import xml.etree.ElementTree as ET

import extract_web_assets as assets

from PIL import Image


TITLE_ACTORS = {"titleBoy": 2516, "titleGirl": 2537, "titleCat": 2558, "titleLady": 2574,
                "titleSister": 2637, "titleRunners": 763}


def extract(xml, manifest, refresh=False):
    derived = copy.deepcopy(xml)
    tags = derived.find("tags")
    sprites = {int(t.get("spriteId")): t for t in tags if t.get("type") == "DefineSpriteTag"}

    def freeze(sprite, placements):
        timeline = sprite.find("subTags")
        timeline.clear()
        timeline.extend(placements)
        timeline.append(ET.Element("item", type="ShowFrameTag"))
        timeline.append(ET.Element("item", type="EndTag"))
        sprite.set("frameCount", "1")

    # На титульном экране вложенная сестра останавливается на stand и скрывает sisterFire.
    sister = sprites[2622]
    freeze(sister, [t for t in assets.placed_frame(sister.find("subTags"), 4) if t.get("name") != "sisterFire"])
    # В runner.as chara1.gotoAndStop выбирает одну из четырёх поз до применения матрицы тела.
    runner = sprites[763]
    source = runner.find("subTags")
    poses = sprites[752].find("subTags")
    timeline = ET.Element("subTags")
    snapshots = [assets.placed_frame(source, f) for f in range(1, 121)]
    insert_at = list(tags).index(runner)
    depths = []
    for pic in range(8):
        for pose in range(1, 5):
            symbol = 3000 + pic * 4 + pose
            body = ET.Element("item", type="DefineSpriteTag", spriteId=str(symbol), frameCount="1")
            ET.SubElement(body, "subTags")
            freeze(body, assets.placed_frame(poses, pic * 10 + pose))
            tags.insert(insert_at, body)
            insert_at += 1
        for f, snapshot in enumerate(snapshots, 1):
            for depth in depths:
                timeline.append(ET.Element("item", type="RemoveObject2Tag", depth=depth))
            placements = copy.deepcopy(snapshot)
            pose = 4 if f < 34 else 2 if f < 75 else 1 if f < 78 else 3
            for t in placements:
                if t.get("name") == "chara1":
                    t.set("characterId", str(3000 + pic * 4 + pose))
                timeline.append(t)
            depths = [t.get("depth") for t in placements]
            timeline.append(ET.Element("item", type="ShowFrameTag"))
    timeline.append(ET.Element("item", type="EndTag"))
    runner.remove(source)
    runner.append(timeline)
    runner.set("frameCount", "960")

    directory, svg = assets.WORK / "title-actors", assets.WORK / "title-actors-svg"
    if refresh or any(not assets.sprite_directory(directory, i) or not assets.sprite_directory(svg, i)
                      for i in TITLE_ACTORS.values()):
        path, movie = assets.WORK / "title-actors.xml", assets.WORK / "title-actors.swf"
        ET.ElementTree(derived).write(path, encoding="utf-8", xml_declaration=True)
        assets.ffdec(["-xml2swf", path, movie], "title-actors-swf")
        ids = ",".join(map(str, TITLE_ACTORS.values()))
        assets.ffdec(["-ignorebackground", "-selectid", ids, "-export", "sprite", directory, movie], "title-actors-png")
        assets.ffdec(["-ignorebackground", "-selectid", ids, "-select", "1", "-format", "sprite:svg",
                 "-export", "sprite", svg, movie], "title-actors-svg")
    for name, symbol in TITLE_ACTORS.items():
        manifest["clips"][name] = assets.atlas(name, symbol, sprites[symbol], directory, svg)

    # На обычном сайте EnterFrame_logo заканчивает показ после кадра 170.
    logo_dir = assets.sprite_directory(assets.CACHE, 2473)
    if not logo_dir or refresh:
        assets.ffdec(["-ignorebackground", "-selectid", "2473", "-export", "sprite", assets.CACHE, assets.SOURCE], "opening-logo")
        logo_dir = assets.sprite_directory(assets.CACHE, 2473)
    frames = []
    for f in range(1, 172):
        with Image.open(logo_dir / f"{f}.png") as picture:
            stage = Image.new("RGB", (620, 380))
            stage.paste(picture, ((620 - picture.width) // 2, (380 - picture.height) // 2), picture.convert("RGBA").getchannel("A"))
            frames.append(stage)
    frames[0].save(assets.DEST / "screens/opening.webp", save_all=True, append_images=frames[1:],
                   duration=[round((f + 1) * 1000 / 30) - round(f * 1000 / 30) for f in range(171)],
                   loop=1, lossless=True, method=4)
