"""Извлекает исходные заполненные контуры четырёх обычных врагов, не меняя графику."""
import argparse
import hashlib
import json
from pathlib import Path
import xml.etree.ElementTree as ET

from extract_web_assets import placed_frame

ROOT = Path(__file__).resolve().parents[1]
SYMBOLS = {"sheep": 910, "rat": 1295, "chicken": 1063, "crow": 981}


def matrix(tag):
    item = tag.find("matrix")
    if item is None:
        return [1, 0, 0, 1, 0, 0]
    def fixed(name, default):
        return round(float(item.get(name, default)) * 65536) / 65536
    return [fixed("scaleX", "1"), fixed("rotateSkew0", "0"), fixed("rotateSkew1", "0"),
            fixed("scaleY", "1"), int(item.get("translateX", "0")), int(item.get("translateY", "0"))]


def combine(parent, child):
    a, b, c, d, x, y = parent
    e, f, g, h, u, v = child
    return [a * e + c * f, b * e + d * f, a * g + c * h, b * g + d * h,
            int(a * u + c * v + x), int(b * u + d * v + y)]


def shape_geometry(shape):
    records = shape.find("shapes/shapeRecords")
    fills, active, x, y, generation = {}, [0, 0], 0, 0, 0
    for record in records:
        kind = record.get("type")
        if kind == "StyleChangeRecord":
            if record.get("stateMoveTo") == "true":
                x, y = int(record.get("moveDeltaX", "0")), int(record.get("moveDeltaY", "0"))
            for index in range(2):
                if record.get("stateFillStyle" + str(index)) == "true":
                    active[index] = int(record.get("fillStyle" + str(index), "0"))
            assert int(record.get("lineStyle", "0")) == 0, "Stroke collision needs separate implementation"
            if record.get("stateNewStyles") == "true":
                assert active == [0, 0], "New style block retains an earlier active fill"
                generation += 1
        elif kind in ("StraightEdgeRecord", "CurvedEdgeRecord"):
            if kind == "StraightEdgeRecord":
                end_x, end_y = x + int(record.get("deltaX", "0")), y + int(record.get("deltaY", "0"))
                edge = [x, y, end_x, end_y]
            else:
                control_x = x + int(record.get("controlDeltaX", "0"))
                control_y = y + int(record.get("controlDeltaY", "0"))
                end_x = control_x + int(record.get("anchorDeltaX", "0"))
                end_y = control_y + int(record.get("anchorDeltaY", "0"))
                edge = [x, y, control_x, control_y, end_x, end_y]
            for fill in set(active) - {0}:
                fills.setdefault(f"{generation}:{fill}", []).append(edge)
            x, y = end_x, end_y
    bounds = shape.find("shapeBounds")
    return {"bounds": [int(bounds.get(key)) for key in ("Xmin", "Ymin", "Xmax", "Ymax")],
            "fills": list(fills.values())}


def extract(xml_path=ROOT / ".build/reference/original.xml"):
    root = ET.parse(xml_path).getroot()
    definitions = {}
    for tag in root.find("tags"):
        for key in ("shapeId", "spriteId"):
            if tag.get(key):
                definitions[int(tag.get(key))] = tag
    shapes = {}
    def placements(symbol, frame, transform=(1, 0, 0, 1, 0, 0), shadow=False):
        definition = definitions[symbol]
        if definition.get("shapeId"):
            shapes[str(symbol)] = shape_geometry(definition)
            return [{"shape": str(symbol), "matrix": list(transform), "shadow": shadow}]
        found = []
        for item in placed_frame(definition.find("subTags"), frame):
            child = int(item.get("characterId"))
            found.extend(placements(child, 1, combine(transform, matrix(item)), shadow or item.get("name") == "shadow"))
        return found
    enemies = {}
    for kind, symbol in SYMBOLS.items():
        count = int(definitions[symbol].get("frameCount"))
        enemies[kind] = {"symbol": symbol, "count": count,
                         "frames": {str(frame): placements(symbol, frame) for frame in range(1, count + 1)}}
    return {"version": 1, "units": "twips", "sourceSha256": hashlib.sha256((ROOT / "original/elonashooter1.3.swf").read_bytes()).hexdigest(),
            "shapes": shapes, "enemies": enemies}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / "web/public/assets/collision-geometry.json")
    target = parser.parse_args().output
    result = extract()
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(result, separators=(",", ":")) + "\n", encoding="utf-8")
    print(json.dumps({"shapes": len(result["shapes"]), "enemies": len(result["enemies"]), "bytes": target.stat().st_size}))
