"""Извлекает исходную графику и звуки SWF для браузерной версии."""
import argparse
import copy
import hashlib
import json
import math
from pathlib import Path
import re
import shutil
import subprocess
import xml.etree.ElementTree as ET

from PIL import Image
from build import ORIGINAL_SHA256, find_java

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "original/elonashooter1.3.swf"
CACHE = ROOT / ".build/export"
WORK = ROOT / ".build/web-assets"
DEST = ROOT / "web/public/assets"
CLIPS = {"charaPic": 677, "enemy_sheep": 910,
         "heroAdrenalineFill": 2717, "heroAdrenalineFrame": 2715,
         "enemy_sister-bomb": 2272, "enemy_cata": 1020, "enemy_spider": 1164, "enemy_ghost": 1118,
         "enemy_ogre": 1363, "enemy_knight": 1211, "enemy_bird": 964,
         "enemy_tank": 993, "enemy_dino": 1247, "enemy_dragon": 945,
         "enemy_chicken": 1063, "enemy_rat": 1295, "enemy_crow": 981, "enemy_archer": 1092, "enemy_fly": 952,
         "enemy_barbarian": 1340, "enemy_lava": 883, "enemyRage": 2385,
         "explosion": 2235, "itemPicture": 2113, "ammoBar": 2698, "radioButton": 2312,
         "grenadeBody": 2275, "grenadeShadow": 2199, "bossHealthFill": 2411, "shopCoin": 1442,
         "layhand": 2226, "itemTimer": 2370, "launcherGrenadeBody": 2238,
         "rocketBody": 2246, "arrowBody": 2263, "flameBody": 2195, "explosionLarge": 2403,
         "shopUpgradeArrow": 2129, "enemyArrowBody": 2281,
         "townActionCard": 2426, "townActionPin": 2430,
         "partyShadow": 680, "partyTraitIcon": 2142, "partyAimCursor": 2340,
         "partyCheckOff": 1474, "partyCheckOn": 1469,
         "partyOrderSkin": 1713, "partyOrderListSkin": 1721}
PROJECTILES = {"hand-grenade": (2276, "grenadeBody"), "grenade": (2239, "launcherGrenadeBody"),
               "rocket": (2247, "rocketBody"), "bolt": (2264, "arrowBody"),
               "arrow": (2265, "arrowBody"), "gravity": (2260, "gravityBody"),
               "flame": (2196, "flameBody")}
BUTTONS = {"button_newGame": 2521, "button_continue": 2542, "button_help": 2579,
           "button_proceed": 1547, "button_gameMods": 1881,
           "button_townMission": 2753, "button_townCastle": 2763,
           "button_townChara": 2768, "button_townEquip": 2773,
           "button_townShop": 2758, "button_townMedal": 2777,
           "button_townRest": 1601, "button_townHire": 1605,
           "button_shopRefresh": 1807, "button_shopUpgrade": 1815,
           "button_dialogYes": 2128, "button_dialogNo": 2126,
           "button_freeRepair": 1642, "button_eventOk": 2434, "button_windowClose": 1497,
           "button_partyPortrait": 130, "button_partyDismiss": 1696,
           "button_partyRecycle": 1758, "button_partyRestock": 1762,
           "button_castlePage1": 1625, "button_castlePage2": 1630}
BUTTONS["button_robVisitors"] = 1831
BUTTONS["button_modBack"] = 1893
BUTTONS["button_deleteSave"] = 2644
BUTTONS.update({"button_helpBattle": 1936, "button_helpTown": 1938,
                "button_helpCredits": 1941, "button_helpTips": 1943,
                "button_helpLink": 1978, "button_pauseHelp": 1493})
CLIPS.update({"helpTextAreaSkin": 1504, "helpScrollUp": 1519,
              "helpScrollDown": 1522, "helpScrollThumb": 1521})
CLIPS.update({"sisterFireAtWill": 2593, "fireAtWillRage": 2386})
CLIPS.update({"gameVolume": 2671, "originalCrosshair": 2689, "fireworkLaunch": 96,
              "fireworkBit1": 101, "fireworkBit2": 91})
CLIPS["museumKongregate"] = 1835
CLIPS["townEventCards"] = 2336
BUTTONS.update({"button_pauseTitle": 1487, "button_pauseSave": 1490, "button_gameMenu": 2703})
FORCE = False


def ffdec(args, log_name):
    WORK.mkdir(parents=True, exist_ok=True)
    result = subprocess.run([find_java(None), "-Djava.awt.headless=true", "-Xmx2g", "-jar",
                             str(ROOT / ".tools/ffdec/ffdec.jar"), *map(str, args)],
                            cwd=ROOT, capture_output=True, text=True, encoding="utf-8",
                            errors="replace", timeout=300)
    (WORK / (log_name + ".log")).write_text(result.stdout + result.stderr, encoding="utf-8")
    if result.returncode:
        raise RuntimeError(f"FFDec failed: {log_name}.log")


def placed_frame(tags, frame):
    """Вычисляет список объектов кадра без выполнения ActionScript."""
    display = {}
    current = 1
    for tag in tags:
        kind = tag.get("type", "")
        if kind.startswith("PlaceObject"):
            depth = tag.get("depth")
            if tag.get("placeFlagMove") == "true" and depth in display:
                merged = copy.deepcopy(display[depth])
                for key, value in tag.attrib.items():
                    # MoveObject2 меняет матрицу PlaceObject3, но не отменяет его фильтры и формат.
                    if key == "type" and merged.get("type") == "PlaceObject3Tag" and kind == "PlaceObject2Tag":
                        continue
                    if value != "false":
                        merged.set(key, value)
                for child in tag:
                    old = merged.find(child.tag)
                    if old is not None:
                        merged.remove(old)
                    merged.append(copy.deepcopy(child))
                display[depth] = merged
            else:
                display[depth] = copy.deepcopy(tag)
        elif kind.startswith("RemoveObject"):
            display.pop(tag.get("depth"), None)
        elif kind == "ShowFrameTag":
            if current == frame:
                break
            current += 1
    result = []
    for _, tag in sorted(display.items(), key=lambda pair: int(pair[0])):
        tag.set("placeFlagMove", "false")
        tag.set("placeFlagHasCharacter", "true")
        result.append(tag)
    return result


def clip_labels(sprite):
    labels, frame = {}, 1
    for tag in sprite.find("subTags"):
        if tag.get("type") == "FrameLabelTag":
            labels[tag.get("name")] = frame
        if tag.get("type") == "ShowFrameTag":
            frame += 1
    return labels


def static_screen(xml, name, tags, omit=(), offset=(0, 0), sprite_frames=None, sprite_omit=None):
    out = DEST / "screens" / (name + ".png")
    if out.exists() and not FORCE:
        image = Image.open(out)
        return {"file": str(out.relative_to(DEST)).replace("\\", "/"), "width": image.width,
                "height": image.height, "originX": 0, "originY": 0}
    output = copy.deepcopy(xml)
    target = output.find("tags")
    for symbol, names in (sprite_omit or {}).items():
        sprite = next(t for t in target if t.get("spriteId") == str(symbol))
        subtags = sprite.find("subTags")
        for tag in list(subtags):
            if tag.get("name") in names:
                subtags.remove(tag)
    # Диалоги выбирают исходную карточку до появления окна.
    for symbol, frame in (sprite_frames or {}).items():
        sprite = next(t for t in target if t.get("spriteId") == str(symbol))
        subtags = sprite.find("subTags")
        selected = placed_frame(subtags, frame)
        subtags.clear()
        subtags.extend(selected)
        subtags.append(ET.Element("item", type="ShowFrameTag", forceWriteAsLong="false"))
        subtags.append(ET.Element("item", type="EndTag", forceWriteAsLong="false"))
        sprite.set("frameCount", "1")
    # Код исходной игры останавливает сестру на кадре stand и прячет реплику.
    sister = next((t for t in target if t.get("spriteId") == "2622"), None)
    if sister is not None:
        subtags = sister.find("subTags")
        idle = [t for t in placed_frame(subtags, 4) if t.get("name") != "sisterFire"]
        subtags.clear()
        subtags.extend(idle)
        subtags.append(ET.Element("item", type="ShowFrameTag", forceWriteAsLong="false"))
        subtags.append(ET.Element("item", type="EndTag", forceWriteAsLong="false"))
        sister.set("frameCount", "1")
    # Из копии убираются только корневые команды кадров; ресурсы не меняются.
    for tag in list(target):
        kind = tag.get("type", "")
        if (kind.startswith(("PlaceObject", "RemoveObject", "DoAction", "DoABC"))
                or kind in {"FrameLabelTag", "ShowFrameTag", "EndTag", "SymbolClassTag",
                            "SoundStreamBlockTag", "SoundStreamHeadTag", "SoundStreamHead2Tag"}):
            target.remove(tag)
    for tag in tags:
        if tag.get("name") in omit:
            continue
        tag = copy.deepcopy(tag)
        if name == "townHud" and tag.get("name") == "bgAlpha":
            transform = tag.find("colorTransform")
            if transform is not None:
                transform.set("alphaMultTerm", "256")
        matrix = tag.find("matrix")
        if matrix is not None:
            matrix.set("translateX", str(int(matrix.get("translateX", "0")) + round(offset[0] * 20)))
            matrix.set("translateY", str(int(matrix.get("translateY", "0")) + round(offset[1] * 20)))
        target.append(tag)
    target.append(ET.Element("item", type="ShowFrameTag", forceWriteAsLong="false"))
    target.append(ET.Element("item", type="EndTag", forceWriteAsLong="false"))
    output.set("frameCount", "1")
    xml_path = WORK / (name + ".xml")
    ET.ElementTree(output).write(xml_path, encoding="utf-8", xml_declaration=True)
    swf_path = WORK / (name + ".swf")
    ffdec(["-xml2swf", xml_path, swf_path], name + "-swf")
    ffdec(["-ignorebackground", "-export", "frame", WORK / name, swf_path], name + "-png")
    image = Image.open(WORK / name / "1.png").convert("RGBA")
    out = DEST / "screens" / (name + ".png")
    out.parent.mkdir(parents=True, exist_ok=True)
    image.save(out, optimize=True)
    return {"file": str(out.relative_to(DEST)).replace("\\", "/"), "width": image.width,
            "height": image.height, "originX": 0, "originY": 0}


def atlas(name, character_id, sprite, png_root=CACHE, svg_root=ROOT / ".build/svg-bounds"):
    folder = next(png_root.glob(f"DefineSprite_{character_id}*"))
    paths = sorted(folder.glob("*.png"), key=lambda path: int(path.stem))
    first = Image.open(paths[0]).convert("RGBA")
    width, height = first.size
    unique, indices, images = {}, {}, []
    for path in paths:
        image = Image.open(path).convert("RGBA")
        digest = hashlib.sha256(image.tobytes()).hexdigest()
        if digest not in unique:
            unique[digest] = len(images)
            images.append(image)
        indices[path.stem] = unique[digest]
    columns = max(1, math.ceil(math.sqrt(len(images) * height / width)))
    sheet = Image.new("RGBA", (columns * width, math.ceil(len(images) / columns) * height))
    for index, image in enumerate(images):
        sheet.paste(image, ((index % columns) * width, (index // columns) * height))
    directory = DEST / "sprites"
    directory.mkdir(parents=True, exist_ok=True)
    sheet.save(directory / (name + ".png"), optimize=True)
    frames = {frame: {"frame": {"x": (index % columns) * width, "y": (index // columns) * height,
                                "w": width, "h": height}, "rotated": False, "trimmed": False,
                      "spriteSourceSize": {"x": 0, "y": 0, "w": width, "h": height},
                      "sourceSize": {"w": width, "h": height}}
              for frame, index in indices.items()}
    (directory / (name + ".json")).write_text(json.dumps({"frames": frames, "meta": {
        "app": "Elona original SWF extraction", "image": name + ".png", "scale": "1"}},
        separators=(",", ":")), encoding="utf-8")
    svg_path = next(svg_root.glob(f"DefineSprite_{character_id}*/1.svg"))
    svg = ET.parse(svg_path).getroot()
    shift = re.search(r"matrix\([^,]+,[^,]+,[^,]+,[^,]+,\s*([^,]+),\s*([^\)]+)\)", list(svg)[0].get("transform"))
    svg_width = float(svg.get("width").removesuffix("px"))
    svg_height = float(svg.get("height").removesuffix("px"))
    # PNG-экспорт добавляет симметричный запас для теней и фильтров.
    origin_x = float(shift[1]) + (width - math.ceil(svg_width)) / 2
    origin_y = float(shift[2]) + (height - math.ceil(svg_height)) / 2
    return {"image": f"sprites/{name}.png", "json": f"sprites/{name}.json",
            "originX": origin_x, "originY": origin_y, "frameWidth": width,
            "frameHeight": height, "labels": clip_labels(sprite), "count": len(paths),
            "uniqueFrames": len(images), "characterId": character_id}


def ally_effects(xml, sprite, layer):
    directory = WORK / ("ally-" + layer)
    svg_directory = WORK / ("ally-" + layer + "-svg")
    if FORCE or not directory.exists():
        derived = copy.deepcopy(xml)
        target = next(t for t in derived.find("tags") if t.get("spriteId") == "838")
        subtags = target.find("subTags")
        # Внешность персонажа выбирается кодом; оружие остаётся исходным слоем.
        for tag in list(subtags):
            depth = int(tag.get("depth", "0"))
            excluded = depth >= 6 if layer == "back" else (depth <= 6 or depth == 10)
            if excluded and tag.get("type", "").startswith(("PlaceObject", "RemoveObject")):
                subtags.remove(tag)
        path = WORK / ("ally-" + layer + ".xml")
        ET.ElementTree(derived).write(path, encoding="utf-8", xml_declaration=True)
        swf_path = WORK / ("ally-" + layer + ".swf")
        ffdec(["-xml2swf", path, swf_path], "ally-" + layer + "-swf")
        ffdec(["-ignorebackground", "-selectid", "838", "-export", "sprite", directory, swf_path], "ally-" + layer + "-png")
        ffdec(["-ignorebackground", "-selectid", "838", "-format", "sprite:svg", "-export",
               "sprite", svg_directory, swf_path], "ally-" + layer + "-svg")
    return atlas("ally" + layer.capitalize(), 838, sprite, directory, svg_directory)


def projectile_assets(xml, sprites, manifest):
    """Сохраняет регистрацию mc/тени и исходный вложенный импульс гравитационного шара."""
    directory, svg_directory = WORK / "projectile-gravity", WORK / "projectile-gravity-svg"
    parent = placed_frame(sprites[2260].find("subTags"), 1)[0]
    source_body = placed_frame(sprites[2259].find("subTags"), 1)
    pulse = next(tag for tag in source_body if tag.get("name") == "puls")
    if FORCE or not list(directory.glob("DefineSprite_2260*")):
        derived = copy.deepcopy(xml)
        target = next(tag for tag in derived.find("tags") if tag.get("spriteId") == "2260")
        timeline = target.find("subTags")
        timeline.clear()
        previous_depths = []
        # explosion_puls останавливается на кадре 13; внешний mc продолжает вращаться.
        for frame in range(1, 14):
            for depth in previous_depths:
                timeline.append(ET.Element("item", type="RemoveObject2Tag", depth=depth,
                                           forceWriteAsLong="false"))
            selected = [copy.deepcopy(tag) for tag in source_body if tag is not pulse]
            for tag in placed_frame(sprites[2258].find("subTags"), frame):
                tag = copy.deepcopy(tag)
                tag.set("depth", str(int(tag.get("depth")) + 1))
                matrix = tag.find("matrix")
                pulse_matrix = pulse.find("matrix")
                for axis in ("translateX", "translateY"):
                    matrix.set(axis, str(int(matrix.get(axis, "0")) + int(pulse_matrix.get(axis, "0"))))
                selected.append(tag)
            for tag in selected:
                # Цвет родительского mc: RGB 33/256 с прибавлением (133,0,44).
                # В дочерних исходных размещениях собственного CXFORM нет.
                assert tag.find("colorTransform") is None
                tag.set("placeFlagHasColorTransform", "true")
                tag.append(copy.deepcopy(parent.find("colorTransform")))
                timeline.append(tag)
            previous_depths = [tag.get("depth") for tag in selected]
            timeline.append(ET.Element("item", type="ShowFrameTag", forceWriteAsLong="false"))
        timeline.append(ET.Element("item", type="EndTag", forceWriteAsLong="false"))
        target.set("frameCount", "13")
        xml_path, swf_path = WORK / "projectile-gravity.xml", WORK / "projectile-gravity.swf"
        ET.ElementTree(derived).write(xml_path, encoding="utf-8", xml_declaration=True)
        ffdec(["-xml2swf", xml_path, swf_path], "projectile-gravity-swf")
        ffdec(["-ignorebackground", "-selectid", "2260", "-export", "sprite", directory, swf_path], "projectile-gravity-png")
        ffdec(["-ignorebackground", "-selectid", "2260", "-format", "sprite:svg", "-export",
               "sprite", svg_directory, swf_path], "projectile-gravity-svg")
    manifest["clips"]["gravityBody"] = atlas("gravityBody", 2260, sprites[2260], directory, svg_directory)
    # WebGL не поддерживает Flash hard-light напрямую. Два прохода сохраняют
    # формулу D*(1-alpha+alpha*A)+alpha*B, где A=2*min(S,1-S), B=max(0,2*S-1).
    original = manifest["clips"]["gravityBody"]
    image = Image.open(DEST / original["image"]).convert("RGBA")
    atlas_data = json.loads((DEST / original["json"]).read_text(encoding="utf-8"))
    for name, transform in [("gravityMultiply", lambda value: 2 * min(value, 255 - value)),
                            ("gravityAdd", lambda value: max(0, 2 * value - 255))]:
        rgb = [image.getchannel(channel).point(transform) for channel in "RGB"]
        Image.merge("RGBA", (*rgb, image.getchannel("A"))).save(DEST / "sprites" / (name + ".png"), optimize=True)
        atlas_data["meta"]["image"] = name + ".png"
        (DEST / "sprites" / (name + ".json")).write_text(json.dumps(atlas_data, separators=(",", ":")), encoding="utf-8")
        manifest["clips"][name] = {**original, "image": f"sprites/{name}.png", "json": f"sprites/{name}.json"}
    visuals = {}
    for kind, (symbol, clip) in [*PROJECTILES.items(), ("enemy-arrow", (2282, "enemyArrowBody"))]:
        placements = placed_frame(sprites[symbol].find("subTags"), 1)
        body = next(tag for tag in placements if tag.get("name") == "mc")
        matrix = body.find("matrix")
        value = {"characterId": symbol, "clip": clip,
                 "bodyX": int(matrix.get("translateX", "0")) / 20,
                 "initialBodyY": int(matrix.get("translateY", "0")) / 20}
        if body.get("blendMode") == "14":
            value["hardLight"] = {"multiplyClip": "gravityMultiply", "addClip": "gravityAdd"}
        shadow = next((tag for tag in placements if tag.get("name") == "shadow"), None)
        if shadow is not None:
            matrix = shadow.find("matrix")
            value["shadow"] = {"clip": "grenadeShadow", "x": int(matrix.get("translateX", "0")) / 20,
                "initialY": int(matrix.get("translateY", "0")) / 20,
                "scaleX": float(matrix.get("scaleX", "1")), "scaleY": float(matrix.get("scaleY", "1")),
                "aboveBody": int(shadow.get("depth")) > int(body.get("depth"))}
        visuals[kind] = value
    # Вражеская стрела добавляется в stage над корнем игры, а не в его слой снарядов.
    manifest["enemyArrowVisual"] = visuals.pop("enemy-arrow")
    manifest["projectileVisuals"] = visuals


def item_popup_asset(xml, sprite):
    """Оставляет исходную рамку/подписи popup; значения до и после рисуются из сохранённого предмета."""
    directory, svg_directory = WORK / "item-popup", WORK / "item-popup-svg"
    if FORCE or not list(directory.glob("DefineSprite_1791*")):
        derived = copy.deepcopy(xml)
        target = next(tag for tag in derived.find("tags") if tag.get("spriteId") == "1791")
        timeline = target.find("subTags")
        for tag in list(timeline):
            if tag.get("type", "").startswith("PlaceObject") and tag.get("name"):
                timeline.remove(tag)
        path, swf_path = WORK / "item-popup.xml", WORK / "item-popup.swf"
        ET.ElementTree(derived).write(path, encoding="utf-8", xml_declaration=True)
        ffdec(["-xml2swf", path, swf_path], "item-popup-swf")
        ffdec(["-ignorebackground", "-selectid", "1791", "-export", "sprite", directory, swf_path], "item-popup-png")
        ffdec(["-ignorebackground", "-selectid", "1791", "-format", "sprite:svg", "-export", "sprite", svg_directory, swf_path], "item-popup-svg")
    return atlas("itemPopup", 1791, sprite, directory, svg_directory)


def party_portrait_background(xml, sprite):
    """Запекает bg вместе с исходными матрицей, alpha и blur в координатах ally3."""
    directory, svg_directory = WORK / "party-portrait-background", WORK / "party-portrait-background-svg"
    isolated = copy.deepcopy(sprite)
    timeline = isolated.find("subTags")
    background = next(tag for tag in placed_frame(timeline, 8) if tag.get("name") == "bg")
    timeline.clear()
    timeline.append(background)
    timeline.append(ET.Element("item", type="ShowFrameTag", forceWriteAsLong="false"))
    timeline.append(ET.Element("item", type="EndTag", forceWriteAsLong="false"))
    isolated.set("frameCount", "1")
    if FORCE or not list(directory.glob("DefineSprite_685*")):
        derived = copy.deepcopy(xml)
        tags = derived.find("tags")
        original = next(tag for tag in tags if tag.get("spriteId") == "685")
        index = list(tags).index(original)
        tags.remove(original)
        tags.insert(index, copy.deepcopy(isolated))
        path, swf_path = WORK / "party-portrait-background.xml", WORK / "party-portrait-background.swf"
        ET.ElementTree(derived).write(path, encoding="utf-8", xml_declaration=True)
        ffdec(["-xml2swf", path, swf_path], "party-portrait-background-swf")
        ffdec(["-ignorebackground", "-selectid", "685", "-export", "sprite", directory, swf_path], "party-portrait-background-png")
        ffdec(["-ignorebackground", "-selectid", "685", "-format", "sprite:svg", "-export", "sprite", svg_directory, swf_path], "party-portrait-background-svg")
    return {**atlas("partyPortraitBackground", 685, isolated, directory, svg_directory),
            "coordinateSpace": "ally3-parent", "sourceFrame": 8, "sourceChild": "bg",
            "placementBaked": True, "sourceAlpha": 41 / 256, "sourceBlur": {"x": 11, "y": 11, "passes": 1}}


def effect_segment_asset(xml, sprite, name, cache_name, start, end, alpha):
    """Извлекает исходный диапазон эффекта без кадров других его анимаций."""
    directory, svg_directory = WORK / cache_name, WORK / (cache_name + "-svg")
    segment = copy.deepcopy(sprite)
    segment.set("frameCount", str(end - start))
    timeline = segment.find("subTags")
    timeline.clear()
    depths = []
    for frame in range(start, end):
        for depth in depths:
            timeline.append(ET.Element("item", type="RemoveObject2Tag", depth=depth, forceWriteAsLong="false"))
        selected = placed_frame(sprite.find("subTags"), frame)
        timeline.extend(selected)
        depths = [tag.get("depth") for tag in selected]
        timeline.append(ET.Element("item", type="ShowFrameTag", forceWriteAsLong="false"))
    timeline.append(ET.Element("item", type="EndTag", forceWriteAsLong="false"))
    if FORCE or not list(directory.glob("DefineSprite_1459*")):
        derived = copy.deepcopy(xml)
        target = next(tag for tag in derived.find("tags") if tag.get("spriteId") == "1459")
        target.set("frameCount", str(end - start))
        target.remove(target.find("subTags"))
        target.append(copy.deepcopy(timeline))
        path, swf_path = WORK / (cache_name + ".xml"), WORK / (cache_name + ".swf")
        ET.ElementTree(derived).write(path, encoding="utf-8", xml_declaration=True)
        ffdec(["-xml2swf", path, swf_path], cache_name + "-swf")
        ffdec(["-ignorebackground", "-selectid", "1459", "-export", "sprite", directory, swf_path], cache_name + "-png")
        ffdec(["-ignorebackground", "-selectid", "1459", "-format", "sprite:svg", "-export", "sprite", svg_directory, swf_path], cache_name + "-svg")
    return {**atlas(name, 1459, segment, directory, svg_directory),
            "sourceFrameStart": start, "frameAlpha": alpha}


def castle_upgrade_tiles(xml, sprites):
    """Запекает исходные фильтры/размещения плитки; название и цена остаются динамическими."""
    directory, svg_directory = WORK / "castle-tiles-v2", WORK / "castle-tiles-v2-svg"
    derived = copy.deepcopy(xml)
    tags = derived.find("tags")
    target = next(tag for tag in tags if tag.get("spriteId") == "2192")
    target_index = list(tags).index(target)
    existing = {tag.get(key) for tag in tags for key in ("spriteId", "buttonId", "characterID") if tag.get(key)}
    assert not existing.intersection(str(value) for value in range(30000, 30017))
    # Кадр upgradePic выбирается кодом. Отдельные однокадровые копии не запускают его временную шкалу.
    for index in range(16):
        picture = copy.deepcopy(sprites[2191])
        picture.set("spriteId", str(30000 + index))
        picture.set("frameCount", "1")
        timeline = picture.find("subTags")
        timeline.clear()
        timeline.extend(placed_frame(sprites[2191].find("subTags"), index + 2))
        timeline.append(ET.Element("item", type="ShowFrameTag", forceWriteAsLong="false"))
        timeline.append(ET.Element("item", type="EndTag", forceWriteAsLong="false"))
        tags.insert(target_index, picture)
        target_index += 1
    # Состояние over содержит собственные исходные alpha/blur, а не прибавленную браузером заливку.
    hover_button = copy.deepcopy(next(tag for tag in tags if tag.get("buttonId") == "2159"))
    hover_button.set("buttonId", "30016")
    records = hover_button.find("characters")
    for record in list(records):
        if record.get("buttonStateOver") != "true":
            records.remove(record)
        else:
            for state in ("Up", "Over", "Down", "HitTest"):
                record.set("buttonState" + state, "true")
    tags.insert(target_index, hover_button)
    timeline = target.find("subTags")
    timeline.clear()
    source = [tag for tag in placed_frame(sprites[2192].find("subTags"), 1)
              if tag.get("name") not in {"upgradeName", "upgradeCost"}]
    depths = []
    for index in range(16):
        for hover in (False, True):
            for depth in depths:
                timeline.append(ET.Element("item", type="RemoveObject2Tag", depth=depth, forceWriteAsLong="false"))
            selected = copy.deepcopy(source)
            for tag in selected:
                if tag.get("name") == "upgradePic":
                    tag.set("characterId", str(30000 + index))
                elif tag.get("name") == "upgradeButton" and hover:
                    tag.set("characterId", "30016")
            timeline.extend(selected)
            depths = [tag.get("depth") for tag in selected]
            timeline.append(ET.Element("item", type="ShowFrameTag", forceWriteAsLong="false"))
    timeline.append(ET.Element("item", type="EndTag", forceWriteAsLong="false"))
    target.set("frameCount", "32")
    if FORCE or not list(directory.glob("DefineSprite_2192*")):
        path, swf_path = WORK / "castle-tiles.xml", WORK / "castle-tiles.swf"
        ET.ElementTree(derived).write(path, encoding="utf-8", xml_declaration=True)
        ffdec(["-xml2swf", path, swf_path], "castle-tiles-swf")
        ffdec(["-ignorebackground", "-selectid", "2192", "-export", "sprite", directory, swf_path], "castle-tiles-png")
        ffdec(["-ignorebackground", "-selectid", "2192", "-format", "sprite:svg", "-export", "sprite", svg_directory, swf_path], "castle-tiles-svg")
    return {**atlas("castleUpgradeTiles", 2192, target, directory, svg_directory),
            "coordinateSpace": "upgrades-parent", "placementBaked": True,
            "sourcePictureId": 2191, "sourcePictureFrames": list(range(2, 18)),
            "framesPerTile": 2, "states": ["up", "over"]}


def buttons(manifest):
    png_dir, svg_dir = ROOT / ".build/buttons", ROOT / ".build/buttons-svg"
    for directory, extension, format_args, log in [(png_dir, "png", [], "buttons"),
            (svg_dir, "svg", ["-format", "button:svg"], "buttons-svg")]:
        needed = [value for value in BUTTONS.values()
                  if FORCE or any(not (directory / f"DefineButton2_{value}" / (state + "." + extension)).exists()
                                  for state in ("1_up", "2_over", "3_down"))]
        if needed:
            ffdec(["-ignorebackground", "-selectid", ",".join(map(str, needed)), *format_args,
                   "-export", "button", directory, SOURCE], log)
    for name, button_id in BUTTONS.items():
        for state in ["1_up", "2_over", "3_down"]:
            source = png_dir / f"DefineButton2_{button_id}" / (state + ".png")
            svg = ET.parse(svg_dir / f"DefineButton2_{button_id}" / (state + ".svg")).getroot()
            image = Image.open(source)
            shift = re.search(r"matrix\([^,]+,[^,]+,[^,]+,[^,]+,\s*([^,]+),\s*([^\)]+)\)", list(svg)[0].get("transform"))
            width = float(svg.get("width").removesuffix("px"))
            height = float(svg.get("height").removesuffix("px"))
            key = name if state == "1_up" else name + "_" + state.split("_")[1]
            output = DEST / "buttons" / (key + ".png")
            output.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, output)
            manifest["images"][key] = {"file": f"buttons/{key}.png", "width": image.width,
                "height": image.height, "originX": float(shift[1]) + (image.width - math.ceil(width)) / 2,
                "originY": float(shift[2]) + (image.height - math.ceil(height)) / 2, "characterId": button_id}


def runtime_clips(xml, sprites, manifest):
    directory, svg_directory = WORK / "runtime-clips", WORK / "runtime-clips-svg"
    specs = {"itemPicture": (2113, {"2"}, False), "radioButton": (2312, {"1", "8"}, False),
             "inventorySlot": (2121, {"2", "3", "4", "6"}, False),
             "sheepShadow": (910, {"1"}, True), "crowShadow": (981, {"1"}, True),
             "gameOver": (2741, {"6", "9"}, False),
             "castleSister": (2622, {"5"}, False)}
    if FORCE or any(not list(directory.glob(f"DefineSprite_{value[0]}*")) for value in specs.values()):
        derived = copy.deepcopy(xml)
        for name, (character_id, depths, keep) in specs.items():
            target = next(t for t in derived.find("tags") if t.get("spriteId") == str(character_id))
            subtags = target.find("subTags")
            # Счётчики рисует браузер; маски теней нужны для исходного hitTestPoint.
            for tag in list(subtags):
                excluded = tag.get("depth") not in depths if keep else tag.get("depth") in depths
                if excluded and tag.get("type", "").startswith(("PlaceObject", "RemoveObject")):
                    subtags.remove(tag)
        path, swf_path = WORK / "runtime-clips.xml", WORK / "runtime-clips.swf"
        ET.ElementTree(derived).write(path, encoding="utf-8", xml_declaration=True)
        ffdec(["-xml2swf", path, swf_path], "runtime-clips-swf")
        ids = ",".join(str(value[0]) for value in specs.values())
        ffdec(["-ignorebackground", "-selectid", ids, "-export", "sprite", directory, swf_path], "runtime-clips-png")
        ffdec(["-ignorebackground", "-selectid", ids, "-format", "sprite:svg", "-export",
               "sprite", svg_directory, swf_path], "runtime-clips-svg")
    for name, (character_id, _, _) in specs.items():
        manifest["clips"][name] = atlas(name, character_id, sprites[character_id], directory, svg_directory)
    entry = manifest["clips"].pop("gameOver")
    source = next(directory.glob("DefineSprite_2741*/1.png"))
    shutil.copyfile(source, DEST / "images/gameOver.png")
    manifest["images"]["gameOver"] = {"file": "images/gameOver.png", "width": entry["frameWidth"],
        "height": entry["frameHeight"], "originX": entry["originX"], "originY": entry["originY"]}
    (DEST / "sprites/gameOver.png").unlink()
    (DEST / "sprites/gameOver.json").unlink()


def town_layout(xml, sprites):
    tags = xml.find("tags")
    definitions = {tag.get("characterID"): tag for tag in tags if tag.get("characterID")}

    def placements(timeline, frame):
        output = {}
        for tag in placed_frame(timeline, frame):
            if not tag.get("name"):
                continue
            matrix = tag.find("matrix")
            a, d = (float(matrix.get(key, "1")) for key in ("scaleX", "scaleY"))
            b, c = (float(matrix.get(key, "0")) for key in ("rotateSkew0", "rotateSkew1"))
            x, y = (int(matrix.get(key, "0")) / 20 for key in ("translateX", "translateY"))
            entry = {"characterId": int(tag.get("characterId")), "x": x, "y": y,
                     "matrix": [a, b, c, d, x, y], "scaleX": math.hypot(a, b),
                     "scaleY": math.hypot(c, d), "rotationDegrees": math.degrees(math.atan2(b, a))}
            definition = definitions.get(tag.get("characterId"))
            if definition is not None and definition.get("type") == "DefineEditTextTag":
                bounds = definition.find("bounds")
                color = definition.find("textColor")
                entry["text"] = {"fontId": int(definition.get("fontId")),
                    "fontSize": int(definition.get("fontHeight")) / 20,
                    "bounds": [int(bounds.get(key)) / 20 for key in ("Xmin", "Ymin", "Xmax", "Ymax")],
                    "align": int(definition.get("align", "0")),
                    "color": "#" + "".join(f"{int(color.get(key)):02x}" for key in ("red", "green", "blue")),
                    "initialHtml": definition.get("initialText", "")}
            output[tag.get("name")] = entry
        return output

    root = placements(tags, 71)
    grids = {}
    for tag in tags:
        if tag.get("type") == "DefineScalingGridTag" and tag.get("characterId") in {"1713", "1721"}:
            grid = tag.find("splitter")
            grids[tag.get("characterId")] = [int(grid.get(key)) / 20 for key in ("Xmin", "Ymin", "Xmax", "Ymax")]
    navigation = {}
    for name, key in {"mission": "Mission", "castle": "Castle", "chara": "Chara",
                      "equip": "Equip", "shop": "Shop", "medal": "Medal"}.items():
        navigation[name] = {**root[name + "Button"], "image": "button_town" + key}
    upgrade_children = placements(sprites[2192].find("subTags"), 1)
    for name in ("upgradeName", "upgradeCost"):
        definition = definitions[str(upgrade_children[name]["characterId"])]
        upgrade_children[name]["text"]["indent"] = int(definition.get("indent", "0")) / 20
    # HitTest-состояние SimpleButton содержит заполненный прямоугольник, почти прозрачный после alpha.
    # Берём исходные границы и переносы, а не расширенные фильтром границы растра.
    upgrade_button = next(tag for tag in tags if tag.get("buttonId") == str(upgrade_children["upgradeButton"]["characterId"]))
    hit_record = next(record for record in upgrade_button.iter("item") if record.get("buttonStateHitTest") == "true")
    hit_shape = next(tag for tag in tags if tag.get("shapeId") == hit_record.get("characterId"))
    hit_bounds, hit_matrix = hit_shape.find("shapeBounds"), hit_record.find("placeMatrix")
    hit_rect = [upgrade_children["upgradeButton"]["x"] + (int(hit_matrix.get("translateX")) + int(hit_bounds.get("Xmin"))) / 20,
                upgrade_children["upgradeButton"]["y"] + (int(hit_matrix.get("translateY")) + int(hit_bounds.get("Ymin"))) / 20,
                (int(hit_bounds.get("Xmax")) - int(hit_bounds.get("Xmin"))) / 20,
                (int(hit_bounds.get("Ymax")) - int(hit_bounds.get("Ymin"))) / 20]
    # В городе окно стартует с 630; после боя та же анимация стартовала с 590.
    source = (ROOT / "src/original/MainTimeline.as").read_text(encoding="utf-8")
    tips_body = source.split("public function insertHelp()", 1)[1].split("public function refreshPlayer", 1)[0]
    tips = [json.loads('"' + line.replace("\\'", "'") + '"')
            for line in re.findall(r'window4_mc\.help\.text \+= "(.*?)";', tips_body)]
    links_body = source.split("public function procLink(", 1)[1].split("internal function frame7", 1)[0]
    links = {index: url for index, url in re.findall(r'url\[(\d+)\] = "(.*?)";', links_body) if url}
    option_source = (CACHE / "scripts/shootem_fla/optionwindow_222.as").read_text(encoding="utf-8")
    option_labels = {name: json.loads('"' + label.replace("\\'", "'") + '"')
                     for name, label in re.findall(r'(opt\w+)\.label = "(.*?)";', option_source)}
    pause_children = placements(sprites[1995].find("subTags"), 10)
    # Исходная панель обрезает заголовок справа и последний флажок снизу в области620×380.
    for name in ("returnTitleButton", "saveGameButton", "helpButton"):
        pause_children[name]["x"] -= 50
        pause_children[name]["matrix"][4] -= 50
    pause_children["options"]["y"] -= 15
    pause_children["options"]["matrix"][5] -= 15
    return {"version": 1, "sourceSha256": ORIGINAL_SHA256, "rootFrame": 71,
            "titleSaves": {"children": {name: value for name, value in placements(tags, 22).items() if name in {"saveBox", "trash"}}},
            "fireAtWill": {"sister": placements(tags, 33)["sister"],
                           "fire": placements(sprites[2622].find("subTags"), 4)["sisterFire"], "rageOffsetY": 16},
            "pause": {"image": "pauseMenu", "children": pause_children,
                      "options": placements(sprites[1531].find("subTags"), 1), "labels": option_labels,
                      "controls": {name: value for name, value in placements(tags, 33).items() if name in {"menuButton", "vol"}}},
            "help": {"position": {"x": 600 - sum(i ** 1.7 for i in range(16)), "y": -20},
                     "pages": [{"image": f"help{page}", "children": placements(sprites[1995].find("subTags"), 161 + page)}
                               for page in range(1, 5)], "tips": tips, "links": links,
                     "textAreaBase": {"width": 100, "height": 44}},
            "menuPosition": {"x": 630 - sum(i ** 1.7 for i in range(16)), "y": -22},
            "panelImageOffset": {"x": 0, "y": -22}, "navigation": navigation, "rootChildren": root,
            "mission": {"characterId": 1995, "frame": 40, "image": "townMission", "labelsImage": "townMissionLabels",
                        "children": placements(sprites[1995].find("subTags"), 40)},
            "castle": {"characterId": 1995, "frame": 54, "image": "townCastle", "labelsImage": "townCastleLabels",
                       "children": placements(sprites[1995].find("subTags"), 54)},
            "medals": {"characterId": 1995, "frame": 85, "image": "townMedals", "labelsImage": "townMedalsLabels",
                       "children": placements(sprites[1995].find("subTags"), 85),
                       "rowChildren": placements(sprites[2151].find("subTags"), 1),
                       "hintImage": "medalHint", "hintChildren": placements(sprites[1657].find("subTags"), 1)},
            "castleUpgrades": {"characterId": 2192, "clip": "castleUpgradeTiles", "children": upgrade_children,
                               "x": 150, "y": 140, "columns": 4, "stepX": 100, "stepY": 110,
                               "names": ["Fix Wall", "Wall", "Sandbag", "Storage", "House", "Looter", "Repairman", "Trainer", "Smith", "Museum", "Chicken", "Sister", "Villa", "Sp.Trainer", "N/A", "N/A"],
                               "disabledAlpha": 0.3, "affordableColor": "#0000cc", "unavailableColor": "#cc0000",
                               "pageButtons": ["button_castlePage1", "button_castlePage2"], "hitRect": hit_rect},
            "characters": {"characterId": 1995, "frame": 63, "image": "townCharacters", "labelsImage": "townCharactersLabels",
                           "children": placements(sprites[1995].find("subTags"), 63),
                           "portraits": {"x": 160, "y": 146, "stepX": 62, "candidateIndex": 5, "candidateExtraX": 10}},
            "equipment": {"characterId": 1995, "frame": 71, "image": "townEquipment", "labelsImage": "townEquipmentLabels",
                          "children": placements(sprites[1995].find("subTags"), 71),
                          "portraits": {"x": 155, "y": 195, "stepX": 80},
                          "slots": {"inventory": {"x": 140, "y": 250, "columns": 8, "stepX": 50, "stepY": 48},
                                    "companions": {"sourceStart": 40, "x": 166, "y": 160, "stepX": 80},
                                    "heroPlaceholder": {"sourceId": 46, "op": -1}}},
            "partyPortrait": {"characterId": 685, "frame": 8, "children": placements(sprites[685].find("subTags"), 8),
                              "shadow": {"clip": "partyShadow", "x": -9.25, "y": 7, "scaleX": 0.9024353, "scaleY": 1},
                              "poseFrames": [5, 6], "poseDuration": 4},
            "equipmentPortrait": {"characterId": 687, "frame": 8, "children": placements(sprites[687].find("subTags"), 8),
                                  "shadow": {"clip": "partyShadow", "x": -9.25, "y": 3, "scaleX": 0.9024353, "scaleY": 1}},
            "partyTrait": {"characterId": 2143, "children": placements(sprites[2143].find("subTags"), 1),
                           "x": 150, "y": 232, "rows": 6, "stepX": 130, "stepY": 18},
            "partyControls": {"orderGrid": grids["1713"], "orderListGrid": grids["1721"],
                              "componentBaseWidth": 100, "componentBaseHeight": 22,
                              "checkIconX": 5, "checkIconY": 4, "checkLabelX": 24},
            "battleParty": {"actorClip": "ally1", "cursorClip": "partyAimCursor",
                            "slots": [{"slot": i, "x": 510 + i * 2 - (8 if i == 3 else 0),
                                       "y": [245, 215, 275, 185, 305][i], "cursorX": 480 + i * 2} for i in range(5)]},
            "shop": {"characterId": 1995, "frame": 80, "image": "townShop",
                     "refreshLabelsImage": "townShopRefreshLabel", "upgradeLabelsImage": "townShopUpgradeLabel",
                     "children": placements(sprites[1995].find("subTags"), 80),
                     "slots": {"stock": {"count": 8, "sourceStart": 0, "x": 140, "y": 160, "columns": 8, "stepX": 50, "op": 0},
                               "inventory": {"initialCount": 6, "sourceStart": 20, "x": 140, "y": 250, "columns": 8, "stepX": 50, "stepY": 48, "op": 1}}},
            "inventorySlot": {"characterId": 2121, "children": placements(sprites[2121].find("subTags"), 1)},
            "saleDialog": {"characterId": 2131, "frame": 1, "image": "shopSaleDialog",
                           "children": placements(sprites[2131].find("subTags"), 1)},
            "itemPopup": {"characterId": 1791, "clip": "itemPopup", "children": placements(sprites[1791].find("subTags"), 1)},
            "repairDialog": {"characterId": 2437, "frame": 1, "image": "eventWindow",
                             "cardFrame": 2, "children": placements(sprites[2437].find("subTags"), 1)},
            "claimTitleAction": {"characterId": 2431, "sourceIndex": 9, "x": 465, "y": 255,
                                 "cardClip": "townActionCard", "cardFrame": 3, "cardRotation": -9,
                                 "hoverScale": 1.04, "pinClip": "townActionPin", "text": "4 AP\nClaim title",
                                 "children": placements(sprites[2431].find("subTags"), 1)},
            "newTitleDialog": {"characterId": 2437, "frame": 1, "image": "eventWindow",
                               "cardFrame": 3, "children": placements(sprites[2437].find("subTags"), 1)}}


def pause_screen(xml, sprites):
    tags = placed_frame(sprites[1995].find("subTags"), 10)
    for tag in tags:
        matrix = tag.find("matrix")
        if tag.get("characterId") in {"1479", "1481"}:
            matrix.set("translateX", str(int(matrix.get("translateX")) - 1000))
        elif tag.get("name") == "options":
            matrix.set("translateY", str(int(matrix.get("translateY")) - 300))
    return static_screen(xml, "pauseMenu", tags,
        {"returnTitleButton", "saveGameButton", "helpButton", "closeButton"},
        sprite_omit={1531: {"stats", "optShowDamage", "optShowAllyDamage", "optLowQuality", "optFirework", "optColor", "optFlashShot"}})


def write_medal_definitions():
    source = (ROOT / "src/original/MainTimeline.as").read_text(encoding="utf-8")
    ids = {name: int(value) for name, value in re.findall(r"public const (_medal\w+):int = (\d+);", source)}
    body = source.split("public function getMedalInfo", 1)[1].split("public function calcParty", 1)[0]
    medals = {}
    for name, array in re.findall(r"if\(param1 == (_medal\w+)\)\s*\{\s*_loc2_ = (\[.*?\]);", body, re.S):
        fields = json.loads(array.replace("\\'", "'"))
        medals[ids[name]] = dict(zip(("name", "condition", "earned", "bonus"), fields))
    if len(medals) < 30:
        raise ValueError("Original medal descriptions were not extracted")
    text = "// Исходные определения getMedalInfo; генерируется tools/extract_web_assets.py.\n"
    text += "export interface MedalInfo { name: string; condition: string; earned: string; bonus: string }\n"
    text += "export const MEDALS: Readonly<Record<number, MedalInfo>> = "
    text += json.dumps(dict(sorted(medals.items())), ensure_ascii=False, indent=2) + ";\n"
    (ROOT / "web/src/medals.ts").write_text(text, encoding="utf-8")


def main():
    global FORCE
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--refresh", action="store_true")
    args = parser.parse_args()
    FORCE = args.refresh
    fingerprint = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
    if fingerprint != ORIGINAL_SHA256:
        raise ValueError("Original SWF differs from preserved baseline")
    DEST.mkdir(parents=True, exist_ok=True)
    if args.refresh or not list((CACHE / "images").glob("2491.*")):
        ffdec(["-export", "image,font,sound,symbolClass,script", CACHE, SOURCE], "resources")
    xml_path = ROOT / ".build/reference/original.xml"
    if args.refresh or not xml_path.exists():
        xml_path.parent.mkdir(parents=True, exist_ok=True)
        ffdec(["-swf2xml", SOURCE, xml_path], "xml")
    xml = ET.parse(xml_path).getroot()
    tags = xml.find("tags")
    sprites = {int(tag.get("spriteId")): tag for tag in tags if tag.get("type") == "DefineSpriteTag"}
    needed = [i for i in CLIPS.values() if args.refresh or not list(CACHE.glob(f"DefineSprite_{i}*"))]
    ids = ",".join(map(str, needed))
    if needed:
        ffdec(["-ignorebackground", "-selectid", ids, "-export", "sprite", CACHE, SOURCE], "sprites")
    needed = [i for i in CLIPS.values() if args.refresh or not list((ROOT / ".build/svg-bounds").glob(f"DefineSprite_{i}*"))]
    ids = ",".join(map(str, needed))
    if needed:
        ffdec(["-ignorebackground", "-selectid", ids, "-format", "sprite:svg", "-export",
               "sprite", ROOT / ".build/svg-bounds", SOURCE], "svg")
    manifest = {"sourceSha256": fingerprint, "sourceFrameRate": 30, "images": {},
                "clips": {}, "sounds": {}, "fonts": {}}
    for name, i in CLIPS.items():
        manifest["clips"][name] = atlas(name, i, sprites[i])
    manifest["clips"]["itemPopup"] = item_popup_asset(xml, sprites[1791])
    manifest["clips"]["partyPortraitBackground"] = party_portrait_background(xml, sprites[685])
    manifest["clips"]["castleUpgradeTiles"] = castle_upgrade_tiles(xml, sprites)
    manifest["clips"]["shieldHit"] = effect_segment_asset(xml, sprites[1459], "shieldHit", "shield-hit", 140, 146, [0.7, 0.7, 0.5, 0.5, 0.2, 0.2])
    # Наблюдаемые значения alpha хранятся Flash с точностью 1/256.
    manifest["clips"]["bloodHit"] = effect_segment_asset(xml, sprites[1459], "bloodHit", "enemy-hit-blood", 50, 63, [1, 1, 1, 1, 204/256, 204/256, 153/256, 153/256, 102/256, 102/256, 25/256, 25/256, 25/256])
    manifest["clips"]["criticalHit"] = effect_segment_asset(xml, sprites[1459], "criticalHit", "enemy-hit-critical", 70, 76, [1] * 6)
    projectile_assets(xml, sprites, manifest)
    for layer in ["back", "front"]:
        manifest["clips"]["ally" + layer.capitalize()] = ally_effects(xml, sprites[838], layer)
    omit_title = {"newGameButton", "continueButton", "helpButton", "longest", "saveBox", "trash",
                  "vol", "kong_mc", "kong_mc2", "armorButton"}
    omit_battle = {"dayText", "moneyText", "castleHPText", "ammoText", "lvText", "expText", "apText",
                   "customCursor", "frenzyBar", "frenzyBar2", "frenzyText", "menuButton", "vol", "ammobar"}
    omit_gene = {"hint", "closeButton", "desc2", "classPic", "optHint", "optHint3", "optHC", "optCasual",
                 "unlockButton", "extraButton", "procButton"}
    omit_result = {"closeButton", "field", "before", "now", "taken", "reward", "wage", "castle", "other",
                   "tax", "mc_playMore", "procButton"}
    omit_loot = {"closeButton", "popup", "warning", "procButton"}
    omit_level = {"closeButton", "procButton", "itemDesc", "itemDesc2", "now"}
    omit_town_nav = {"missionButton", "shopButton", "castleButton", "charaButton", "equipButton", "medalButton"}
    for name, timeline, frame, omit, offset in [
        ("title", tags, 22, omit_title, (0, 0)), ("battle", tags, 27, omit_battle | {"sister"}, (0, 0)),
        ("townHud", tags, 65, omit_battle | omit_town_nav, (0, 0)),
        ("townScene", tags, 71, omit_battle | omit_town_nav | {"textCarryOver"}, (0, 0)),
        ("townMission", sprites[1995].find("subTags"), 40,
         {"closeButton", "hint2", "act1", "act2", "actRef1", "actRef2"}, (0, -22)),
        ("townCastle", sprites[1995].find("subTags"), 54,
         {"closeButton", "hint2", "hint", "unkeep", "locker", "act1", "actRef1", "page1", "page2"}, (0, -22)),
        ("townShop", sprites[1995].find("subTags"), 80,
         {"closeButton", "hint2", "warning", "popup", "actHelp", "act1", "act2", "actRef1", "actRef2"}, (0, -22)),
        ("townCharacters", sprites[1995].find("subTags"), 63,
         {"closeButton", "hint2", "hint", "dismissButton", "classText", "wage", "titleText", "wageText", "earnText", "killText",
          "orderText", "recruitText", "dismissText", "costText", "order", "fo", "act1", "actRef1", "optHint", "optBoss", "optWall"}, (0, -22)),
        ("townEquipment", sprites[1995].find("subTags"), 71,
         {"closeButton", "hint2", "popup", "warning", "actHelp", "act1", "act2", "actRef1", "actRef2"}, (0, -22)),
        ("townMedals", sprites[1995].find("subTags"), 85,
         {"closeButton", "hint2", "hint", "lootText", "act1", "actRef1", "page1", "page2", "kongMc", "armorbt"}, (0, -22)),
        ("medalRow", sprites[2151].find("subTags"), 1, {"medalName"}, (0, 0)),
        ("gene", sprites[1995].find("subTags"), 125, omit_gene, (0, -26)),
        ("gameMods", sprites[1995].find("subTags"), 136,
         {"classPic", "button1", "procButton", "warning", "backButton", "closeButton", "detailButton", "detailWin",
          "optDropMod", "optMore", "optWeaponLevel", "optSkipHard", "optTight", "optLaptop", "optComp"}, (0, -26)),
        ("result", sprites[1995].find("subTags"), 14, omit_result, (0, -26)),
        ("loot", sprites[1995].find("subTags"), 89, omit_loot, (0, -26)),
        ("lootBoss", sprites[1995].find("subTags"), 100, omit_loot | {"lootText"}, (0, -26)),
        ("level", sprites[1995].find("subTags"), 148, omit_level, (0, -26))]:
        manifest["images"][name] = static_screen(xml, name, placed_frame(timeline, frame), omit, offset)
    # Подписи лежат выше карточек-действий в исходной временной шкале.
    for name, frame, labels in [("townMissionLabels", 40, {"actRef1", "actRef2"}),
                                ("townCastleLabels", 54, {"actRef1"}),
                                ("townShopRefreshLabel", 80, {"actRef1"}),
                                ("townShopUpgradeLabel", 80, {"actRef2"}),
                                ("townCharactersLabels", 63, {"actRef1"}),
                                ("townEquipmentLabels", 71, {"actRef1", "actRef2"}),
                                ("townMedalsLabels", 85, {"actRef1"})]:
        selected = [tag for tag in placed_frame(sprites[1995].find("subTags"), frame)
                    if tag.get("name") in labels]
        manifest["images"][name] = static_screen(xml, name, selected, offset=(0, -22))
    (DEST / "screens/townShopLabels.png").unlink(missing_ok=True)
    manifest["images"]["eventWindow"] = static_screen(xml, "eventWindow",
        placed_frame(sprites[2437].find("subTags"), 1), {"title", "text", "okButton", "card"})
    manifest["images"]["shopSaleDialog"] = static_screen(xml, "shopSaleDialog",
        placed_frame(sprites[2131].find("subTags"), 1), {"question", "yes", "no", "pop1", "pop2", "poparrow"})
    for name, image_id in {"background": 2491, "clouds": 2494, "town": 2743, "parchment": 1477}.items():
        source = next((CACHE / "images").glob(f"{image_id}.*"))
        dest = DEST / "images" / (name + ".png")
        dest.parent.mkdir(parents=True, exist_ok=True)
        Image.open(source).convert("RGBA").save(dest, optimize=True)
        im = Image.open(dest)
        manifest["images"][name] = {"file": f"images/{name}.png", "width": im.width,
                                    "height": im.height, "originX": 0, "originY": 0}
    for name, font_id in {"menu": 682, "menuBold": 1608, "hud": 2681, "small": 1392, "ui": 1535, "impact": 1653}.items():
        source = next((CACHE / "fonts").glob(f"{font_id}_*"))
        dest = DEST / "fonts" / (name + ".ttf")
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, dest)
        manifest["fonts"][name] = f"fonts/{name}.ttf"
    for source in (CACHE / "sounds").glob("*"):
        if not source.is_file() or "sound" not in source.stem:
            continue
        name = re.sub(r"^\d+_", "", source.stem)
        dest = DEST / "sounds" / (name + source.suffix)
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, dest)
        manifest["sounds"][name] = f"sounds/{dest.name}"
    buttons(manifest)
    manifest["images"]["pauseMenu"] = pause_screen(xml, sprites)
    manifest["images"]["medalHint"] = static_screen(xml, "medalHint", placed_frame(sprites[1657].find("subTags"), 1),
        {"itemName", "itemDesc", "itemDesc2", "maxText", "typeText"})
    for page in range(1, 5):
        manifest["images"][f"help{page}"] = static_screen(xml, f"help{page}",
            placed_frame(sprites[1995].find("subTags"), 161 + page),
            {"closeButton", "help1", "help2", "help3", "help4", "help"} | {f"link{i}" for i in range(1, 11)})
    runtime_clips(xml, sprites, manifest)
    ammo = manifest["clips"]["ammoBar"]
    source = next(CACHE.glob("DefineSprite_2698*/1.png"))
    destination = DEST / "images/ammo_fill.png"
    shutil.copyfile(source, destination)
    manifest["images"]["ammo_fill"] = {"file": "images/ammo_fill.png", "width": ammo["frameWidth"],
        "height": ammo["frameHeight"], "originX": ammo["originX"], "originY": ammo["originY"]}
    from extract_animation_metadata import extract
    animation = extract(xml_path, CACHE / "scripts/ally1.as")
    (DEST / "ally-animation.json").write_text(json.dumps(animation, separators=(",", ":")) + "\n", encoding="utf-8")
    manifest["allyAnimation"] = "ally-animation.json"
    from extract_collision_geometry import extract as extract_collision, write_display_widths, write_castle_sister
    collision = extract_collision(xml_path)
    (DEST / "collision-geometry.json").write_text(json.dumps(collision, separators=(",", ":")) + "\n", encoding="utf-8")
    write_display_widths(collision)
    write_castle_sister(collision)
    manifest["collisionGeometry"] = "collision-geometry.json"
    (DEST / "town-layout.json").write_text(json.dumps(town_layout(xml, sprites), indent=2) + "\n", encoding="utf-8")
    write_medal_definitions()
    manifest["townLayout"] = "town-layout.json"
    (DEST / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    summary = {
        "source": "original/elonashooter1.3.swf", "sourceSha256": fingerprint,
        "exporter": "tools/extract_web_assets.py", "ffdecVersion": "26.4.0",
        "runtimeManifest": "web/public/assets/manifest.json", "frameRate": 30,
        "frameNames": "Original one-based Flash timeline frame numbers as strings",
        "origins": "Pixel offset from exported image top-left to Flash registration point",
        "counts": {"images": len(manifest["images"]), "clips": len(manifest["clips"]),
                   "sounds": len(manifest["sounds"]), "fonts": len(manifest["fonts"])},
        "runtimeAdjustments": [
            "Static screens omit runtime text placeholders and separately rendered controls",
            "Town Sister is frozen at stand frame4; battle Sister is rendered separately with original reactions and hidden sisterFire",
            "townHud applies the original eventGene bgAlpha.alpha=1",
            "Town panels retain offset (0,-22); original town slide settles at x24.41238023502831",
            "Town action labels are separate original foreground layers above their card buttons",
            "Castle upgrade tiles retain original icon, button-state, coin and filter placements; runtime draws levels/prices and uses the source button hit-state rectangle",
            "Characters/Equipment panels retain original labels, portraits, slot placements and separately rendered controls; permanent recruitment is separate from the Mission henchman action",
            "partyPortraitBackground bakes ally3 bg placement, alpha41/256 and blur11 in parent portrait coordinates; selection opacity applies to the whole portrait",
            "Shop Upgrade and Refresh labels are separate so each retains its own enabled state",
            "Item comparison popup retains original static labels and renders saved before/after values separately",
            "Town events use original eventWindow2437 and separate card2336 frames with runtime text",
            "gene and result retain offset (0,-26); application applies menu slide X offset",
            "Item quantities and radio labels are rendered by the application",
            "allyBack and allyFront retain source depths around separately selected charaPic poses",
            "Projectile metadata preserves original mc/shadow registration and layer order",
            "Archer retains all 210 original frames and filled collision contours; its separate enemy arrow retains stage-overlay registration",
            "Fly retains all 126 original frames, including the shadow and falling corpse about104 pixels below its root; collision and display widths use source geometric bounds",
            "Barbarian retains symbol1340 and its temporary rage effect2385; source effect frames1-12 are drawn at local y20 and removed on13",
            "Lava retains all 223 source frames and embedded explosion artwork; attack and ordinary death use distinct timeline paths with persistent shadow exclusion",
            "Claim title uses the original Mission action card2426 frame3, pin2430 and action2431 placement; New Title dialog uses event card2336 frame3",
            "shieldHit contains original effect1459 frames140-145 with frame-script alpha metadata; source frame146 removes it",
            "gravityBody flattens original nested pulse frames 1-13 with the inherited mc color transform",
            "Gravity hard-light is decomposed into original-alpha multiply/add textures for the WebGL renderer",
            "sheepShadow and crowShadow preserve shadow-only alpha masks for original hit exclusion",
            "Ordinary enemy collision uses original filled contours and placement matrices, not bitmap alpha",
            "gameOver hides day-one carry-over control and retired external play-more button"
        ],
        "limitations": [
            "FFDec renders timelines without executing ActionScript; application implements frame actions",
            "Asset extraction alone does not establish complete original gameplay parity",
            "Only selected runtime visuals are packaged; full source exports remain in ignored .build"
        ]
    }
    (ROOT / "docs/asset-manifest.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    assert hashlib.sha256(SOURCE.read_bytes()).hexdigest() == fingerprint
    from extract_campaign_enemies import main as extract_campaign_enemies
    extract_campaign_enemies()
    print(json.dumps({"images": len(manifest["images"]), "clips": len(manifest["clips"]),
                      "sounds": len(manifest["sounds"]), "originalUnchanged": True}))


if __name__ == "__main__":
    main()
