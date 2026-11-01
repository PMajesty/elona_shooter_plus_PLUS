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
         "enemy_chicken": 1063, "enemy_rat": 1295, "enemy_crow": 981,
         "explosion": 2235, "itemPicture": 2113, "ammoBar": 2698, "radioButton": 2312,
         "grenadeBody": 2275, "grenadeShadow": 2199, "bossHealthFill": 2411, "shopCoin": 1442}
BUTTONS = {"button_newGame": 2521, "button_continue": 2542, "button_help": 2579,
           "button_proceed": 1547, "button_gameMods": 1881,
           "button_townMission": 2753, "button_townCastle": 2763,
           "button_townChara": 2768, "button_townEquip": 2773,
           "button_townShop": 2758, "button_townMedal": 2777,
           "button_townRest": 1601, "button_townHire": 1605,
           "button_shopRefresh": 1807, "button_shopUpgrade": 1815,
           "button_dialogYes": 2128, "button_dialogNo": 2126,
           "button_freeRepair": 1642, "button_eventOk": 2434, "button_windowClose": 1497}
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


def static_screen(xml, name, tags, omit=(), offset=(0, 0), sprite_frames=None):
    out = DEST / "screens" / (name + ".png")
    if out.exists() and not FORCE:
        image = Image.open(out)
        return {"file": str(out.relative_to(DEST)).replace("\\", "/"), "width": image.width,
                "height": image.height, "originX": 0, "originY": 0}
    output = copy.deepcopy(xml)
    target = output.find("tags")
    # Диалог ремонта выбирает исходную карточку кадра 2 до появления окна.
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
             "gameOver": (2741, {"6", "9"}, False)}
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
    navigation = {}
    for name, key in {"mission": "Mission", "castle": "Castle", "chara": "Chara",
                      "equip": "Equip", "shop": "Shop", "medal": "Medal"}.items():
        navigation[name] = {**root[name + "Button"], "image": "button_town" + key}
    # В городе окно стартует с 630; после боя та же анимация стартовала с 590.
    return {"version": 1, "sourceSha256": ORIGINAL_SHA256, "rootFrame": 71,
            "menuPosition": {"x": 630 - sum(i ** 1.7 for i in range(16)), "y": -22},
            "panelImageOffset": {"x": 0, "y": -22}, "navigation": navigation, "rootChildren": root,
            "mission": {"characterId": 1995, "frame": 40, "image": "townMission", "labelsImage": "townMissionLabels",
                        "children": placements(sprites[1995].find("subTags"), 40)},
            "castle": {"characterId": 1995, "frame": 54, "image": "townCastle", "labelsImage": "townCastleLabels",
                       "children": placements(sprites[1995].find("subTags"), 54)},
            "shop": {"characterId": 1995, "frame": 80, "image": "townShop", "labelsImage": "townShopLabels",
                     "children": placements(sprites[1995].find("subTags"), 80),
                     "slots": {"stock": {"count": 8, "sourceStart": 0, "x": 140, "y": 160, "columns": 8, "stepX": 50, "op": 0},
                               "inventory": {"initialCount": 6, "sourceStart": 20, "x": 140, "y": 250, "columns": 8, "stepX": 50, "stepY": 48, "op": 1}}},
            "inventorySlot": {"characterId": 2121, "children": placements(sprites[2121].find("subTags"), 1)},
            "saleDialog": {"characterId": 2131, "frame": 1, "image": "shopSaleDialog",
                           "children": placements(sprites[2131].find("subTags"), 1)},
            "repairDialog": {"characterId": 2437, "frame": 1, "image": "eventRepair",
                             "cardFrame": 2, "children": placements(sprites[2437].find("subTags"), 1)}}


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
        ("title", tags, 22, omit_title, (0, 0)), ("battle", tags, 27, omit_battle, (0, 0)),
        ("townHud", tags, 65, omit_battle | omit_town_nav, (0, 0)),
        ("townScene", tags, 71, omit_battle | omit_town_nav | {"textCarryOver"}, (0, 0)),
        ("townMission", sprites[1995].find("subTags"), 40,
         {"closeButton", "hint2", "act1", "act2", "actRef1", "actRef2"}, (0, -22)),
        ("townCastle", sprites[1995].find("subTags"), 54,
         {"closeButton", "hint2", "hint", "unkeep", "locker", "act1", "actRef1"}, (0, -22)),
        ("townShop", sprites[1995].find("subTags"), 80,
         {"closeButton", "hint2", "warning", "popup", "actHelp", "act1", "act2", "actRef1", "actRef2"}, (0, -22)),
        ("gene", sprites[1995].find("subTags"), 125, omit_gene, (0, -26)),
        ("result", sprites[1995].find("subTags"), 14, omit_result, (0, -26)),
        ("loot", sprites[1995].find("subTags"), 89, omit_loot, (0, -26)),
        ("lootBoss", sprites[1995].find("subTags"), 100, omit_loot | {"lootText"}, (0, -26)),
        ("level", sprites[1995].find("subTags"), 148, omit_level, (0, -26))]:
        manifest["images"][name] = static_screen(xml, name, placed_frame(timeline, frame), omit, offset)
    # Подписи лежат выше карточек-действий в исходной временной шкале.
    for name, frame, labels in [("townMissionLabels", 40, {"actRef1", "actRef2"}),
                                ("townCastleLabels", 54, {"actRef1"}),
                                ("townShopLabels", 80, {"actRef1", "actRef2"})]:
        selected = [tag for tag in placed_frame(sprites[1995].find("subTags"), frame)
                    if tag.get("name") in labels]
        manifest["images"][name] = static_screen(xml, name, selected, offset=(0, -22))
    manifest["images"]["eventRepair"] = static_screen(xml, "eventRepair",
        placed_frame(sprites[2437].find("subTags"), 1), {"title", "text", "okButton"}, sprite_frames={2336: 2})
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
    for name, font_id in {"menu": 682, "menuBold": 1608, "hud": 2681, "small": 1392, "ui": 1535}.items():
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
    from extract_collision_geometry import extract as extract_collision
    collision = extract_collision(xml_path)
    (DEST / "collision-geometry.json").write_text(json.dumps(collision, separators=(",", ":")) + "\n", encoding="utf-8")
    manifest["collisionGeometry"] = "collision-geometry.json"
    (DEST / "town-layout.json").write_text(json.dumps(town_layout(xml, sprites), indent=2) + "\n", encoding="utf-8")
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
            "Sister is frozen at original stand frame 4 and sisterFire is hidden",
            "townHud applies the original eventGene bgAlpha.alpha=1",
            "Town panels retain offset (0,-22); original town slide settles at x24.41238023502831",
            "Town action labels are separate original foreground layers above their card buttons",
            "Town scene and panels omit runtime HUD fields; Free Repair uses original event card frame 2",
            "gene and result retain offset (0,-26); application applies menu slide X offset",
            "Item quantities and radio labels are rendered by the application",
            "allyBack and allyFront retain source depths around separately selected charaPic poses",
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
    print(json.dumps({"images": len(manifest["images"]), "clips": len(manifest["clips"]),
                      "sounds": len(manifest["sounds"]), "originalUnchanged": True}))


if __name__ == "__main__":
    main()
