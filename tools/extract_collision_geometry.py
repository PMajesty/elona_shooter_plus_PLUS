"""Извлекает исходные заполненные контуры выбранных обычных врагов, не меняя графику."""
import argparse
import hashlib
import json
import math
from pathlib import Path
import xml.etree.ElementTree as ET

from extract_web_assets import placed_frame

ROOT = Path(__file__).resolve().parents[1]
SYMBOLS = {"sheep": 910, "rat": 1295, "chicken": 1063, "crow": 981, "archer": 1092, "fly": 952, "barbarian": 1340, "lava": 883}


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
            if symbol == 2622 and item.get("name") == "sisterFire":
                continue
            child = int(item.get("characterId"))
            found.extend(placements(child, 1, combine(transform, matrix(item)), shadow or item.get("name") == "shadow"))
        return found
    enemies = {}
    for kind, symbol in SYMBOLS.items():
        count = int(definitions[symbol].get("frameCount"))
        enemies[kind] = {"symbol": symbol, "count": count,
                         "frames": {str(frame): placements(symbol, frame) for frame in range(1, count + 1)}}
    effects = {"enemyRage": {"symbol": 2385, "count": 14,
               "frames": {str(frame): placements(2385, frame) for frame in range(1, 15)}}}
    sister = next(item for item in placed_frame(root.find("tags"), 33) if item.get("name") == "sister")
    effects["castleSister"] = {"symbol": 2622, "count": 72,
        "frames": {str(frame): placements(2622, frame, matrix(sister)) for frame in range(1, 73)}}
    def display_edges(symbol, frame=1, transform=(1, 0, 0, 1, 0, 0)):
        definition = definitions[symbol]
        if definition.get("shapeId"):
            bounds = definition.find("shapeBounds")
            left, top, right, bottom = [int(bounds.get(key)) for key in ("Xmin", "Ymin", "Xmax", "Ymax")]
            a, _, c, _, x, _ = transform
            return [math.floor(a * px + c * py + x + 0.5) for px, py in [(left, top), (right, top), (left, bottom), (right, bottom)]]
        found = []
        for item in placed_frame(definition.find("subTags"), frame):
            found.extend(display_edges(int(item.get("characterId")), 1, combine(transform, matrix(item))))
        return found
    hit_bounds = {}
    for frame in [*range(50, 63), *range(70, 76)]:
        edges = display_edges(1459, frame)
        hit_bounds[str(frame)] = [min(edges) / 20, max(edges) / 20]
    return {"version": 1, "units": "twips", "sourceSha256": hashlib.sha256((ROOT / "original/elonashooter1.3.swf").read_bytes()).hexdigest(),
            "shapes": shapes, "enemies": enemies, "effects": effects, "effectDisplayBounds": {"enemyHit": hit_bounds}}


def write_castle_sister(geometry, target=ROOT / "web/src/castle-sister-geometry.json"):
    clip = geometry["effects"]["castleSister"]
    used = {item["shape"] for frame in clip["frames"].values() for item in frame}
    target.write_text(json.dumps({"sourceSha256": geometry["sourceSha256"],
        "shapes": {key: geometry["shapes"][key] for key in sorted(used)},
        "frames": clip["frames"]}, separators=(",", ":")) + "\n", encoding="utf-8")


def write_display_widths(geometry, target=ROOT / "web/src/enemy-display-bounds.ts"):
    """Сохраняет display bounds лучника и мухи для исходного ограничения отбрасывания."""
    tables, sections, bound_tables = {}, [], {}
    for kind in ("archer", "fly", "barbarian", "lava"):
        enemy = geometry["enemies"][kind]
        widths, bounds = [0], [[0, 0]]
        for frame in range(1, enemy["count"] + 1):
            edges = []
            for placement in enemy["frames"][str(frame)]:
                left, top, right, bottom = geometry["shapes"][placement["shape"]]["bounds"]
                a, _, c, _, x, _ = placement["matrix"]
                # Учитываем прозрачные bitmap-fill и тень. Вложенная тень обоих
                # символов имеет единичную матрицу; внешняя матрица уже сохранена.
                # Для Fly измеренный width округляет преобразованные границы до
                # ближайшего twip: 14.25/16.75/16.65 вместо усечённых 14.2/16.7/16.6.
                # Подтверждено всеми кадрами исходного Fly trace; ранее принятая
                # таблица Archer сохраняется без изменения непроверенных промежутков.
                # Barbarian trace подтвердил то же округление: 16.25 вместо 16.2;
                # исправляем только новый символ, не меняя принятые старые таблицы.
                # Отдельный trace Lava подтвердил такое округление нового символа,
                # включая временные частицы; старые таблицы не изменяются.
                quantize = (lambda value: math.floor(value + 0.5)) if kind in ("fly", "barbarian", "lava") else int
                edges.extend(quantize(a * px + c * py + x) for px, py in
                             [(left, top), (right, top), (left, bottom), (right, bottom)])
            widths.append((max(edges) - min(edges)) / 20 if edges else 0)
            bounds.append([min(edges) / 20, max(edges) / 20] if edges else [0, 0])
        tables[kind] = widths
        bound_tables[kind] = bounds
        # Индекс массива совпадает с исходным номером кадра; ноль не используется.
        rows = [", ".join(json.dumps(value) for value in widths[start:start + 15])
                for start in range(0, len(widths), 15)]
        sections.append(f"export const {kind.upper()}_DISPLAY_WIDTHS: readonly number[] = [\n  "
                        + ",\n  ".join(rows) + ",\n];\n")
    rage_bounds = [[0, 0]]
    for frame in range(1, 13):
        edges = []
        for placement in geometry["effects"]["enemyRage"]["frames"][str(frame)]:
            left, top, right, bottom = geometry["shapes"][placement["shape"]]["bounds"]
            a, _, c, _, x, _ = placement["matrix"]
            edges.extend(int(a * px + c * py + x) for px, py in
                         [(left, top), (right, top), (left, bottom), (right, bottom)])
        rage_bounds.append([min(edges) / 20, max(edges) / 20] if edges else [0, 0])
    for name, bounds in [("BARBARIAN_DISPLAY_X_BOUNDS", bound_tables["barbarian"]), ("LAVA_DISPLAY_X_BOUNDS", bound_tables["lava"]), ("ENEMY_RAGE_DISPLAY_X_BOUNDS", rage_bounds)]:
        sections.append(f"export const {name}: readonly (readonly [number, number])[] = " + json.dumps(bounds) + ";\n")
    sections.append("/** Исходная ширина mc с временным дочерним эффектом ярости. */\n"
                    "export function barbarianDisplayWidth(frame: number, rageEffectFrame = 0): number {\n"
                    "  const body = BARBARIAN_DISPLAY_X_BOUNDS[frame];\n"
                    "  const rage = ENEMY_RAGE_DISPLAY_X_BOUNDS[rageEffectFrame];\n"
                    "  return rageEffectFrame > 0 && rage\n"
                    "    ? Math.round((Math.max(body[1], rage[1]) - Math.min(body[0], rage[0])) * 20) / 20\n"
                    "    : BARBARIAN_DISPLAY_WIDTHS[frame];\n}\n")
    sections.append("export const ENEMY_HIT_DISPLAY_X_BOUNDS: Readonly<Record<number, readonly [number, number]>> = "
                    + json.dumps(geometry["effectDisplayBounds"]["enemyHit"]) + ";\n")
    sections.append("/** Ширина родителя включает частицы попадания, хотя его mc.hitTestPoint их не проверяет. */\n"
                    "export function barbarianParentWidth(frame: number, rageEffectFrame = 0, hitEffects: readonly { frame: number; x: number }[] = []): number {\n"
                    "  const body = BARBARIAN_DISPLAY_X_BOUNDS[frame], rage = ENEMY_RAGE_DISPLAY_X_BOUNDS[rageEffectFrame];\n"
                    "  let left = Math.round(body[0] * 20), right = Math.round(body[1] * 20);\n"
                    "  if (rageEffectFrame > 0 && rage) { left = Math.min(left, Math.round(rage[0] * 20)); right = Math.max(right, Math.round(rage[1] * 20)); }\n"
                    "  for (const effect of hitEffects) {\n"
                    "    const bounds = ENEMY_HIT_DISPLAY_X_BOUNDS[effect.frame], x = Math.round(effect.x * 20);\n"
                    "    left = Math.min(left, Math.round(bounds[0] * 20) + x); right = Math.max(right, Math.round(bounds[1] * 20) + x);\n"
                    "  }\n"
                    "  return (right - left) / 20;\n}\n")
    sections.append("/** Lava использует исходную ширину родителя с теми же внешними частицами попадания. */\n"
                    "export function lavaParentWidth(frame: number, hitEffects: readonly { frame: number; x: number }[] = []): number {\n"
                    "  const body = LAVA_DISPLAY_X_BOUNDS[frame];\n"
                    "  let left = Math.round(body[0] * 20), right = Math.round(body[1] * 20);\n"
                    "  for (const effect of hitEffects) {\n"
                    "    const bounds = ENEMY_HIT_DISPLAY_X_BOUNDS[effect.frame], x = Math.round(effect.x * 20);\n"
                    "    left = Math.min(left, Math.round(bounds[0] * 20) + x); right = Math.max(right, Math.round(bounds[1] * 20) + x);\n"
                    "  }\n"
                    "  return (right - left) / 20;\n}\n")
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text("// Создано tools/extract_collision_geometry.py из исходных shapeBounds и матриц.\n"
                      f"// SWF SHA-256: {geometry['sourceSha256']}\n"
                      "// Номера кадров начинаются с 1; нулевой элемент — заполнитель.\n"
                      + "\n".join(sections), encoding="utf-8")
    return tables["archer"]


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / "web/public/assets/collision-geometry.json")
    parser.add_argument("--display-output", type=Path)
    args = parser.parse_args()
    target = args.output
    result = extract()
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(result, separators=(",", ":")) + "\n", encoding="utf-8")
    if args.display_output is not None:
        write_display_widths(result, args.display_output)
    print(json.dumps({"shapes": len(result["shapes"]), "enemies": len(result["enemies"]), "bytes": target.stat().st_size}))
