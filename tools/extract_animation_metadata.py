"""Извлекает матрицы ally1 и выбор поз charaPic, которые FFDec не исполняет."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]


def extract(xml_path, script_path):
    document = ET.parse(xml_path).getroot()
    sprite = next(tag for tag in document.find("tags") if tag.get("spriteId") == "838")
    script = script_path.read_text(encoding="utf-8-sig")
    actions = {}
    for match in re.finditer(r"internal function frame(\d+)\(\) : \*\s*\{(.*?)\n      \}", script, re.S):
        number, body = int(match[1]), match[2]
        action = {}
        for child, pose in re.findall(r"(chara[12])\.gotoAndStop\(this\.pic \* 10 \+ (\d+)\)", body):
            action[child] = int(pose)
        jump = re.search(r"(?<!\.)gotoAndPlay\((?:\"([^\"]+)\"|(\d+))\)", body)
        if jump:
            action["goto"] = jump[1] or int(jump[2])
        if re.search(r"(?<!\.)\bstop\(\)", body):
            action["stop"] = True
        if action:
            actions[number] = action

    state, labels, frames = {}, {}, {}
    poses = {"chara1": 1, "chara2": 9}
    number = 1
    for tag in sprite.find("subTags"):
        kind, depth = tag.get("type", ""), tag.get("depth")
        if kind.startswith("PlaceObject"):
            entry = state.get(depth, {}).copy() if tag.get("placeFlagMove") == "true" else {}
            for key in ("name", "characterId"):
                if tag.get(key) is not None:
                    entry[key] = tag.get(key)
            matrix = tag.find("matrix")
            if matrix is not None:
                entry["matrix"] = matrix.attrib
            state[depth] = entry
        elif kind.startswith("RemoveObject"):
            state.pop(depth, None)
        elif kind == "FrameLabelTag":
            labels[tag.get("name")] = number
        elif kind == "ShowFrameTag":
            action = actions.get(number, {})
            poses.update({key: value for key, value in action.items() if key.startswith("chara")})
            bodies = []
            for depth, entry in sorted(state.items(), key=lambda pair: int(pair[0])):
                name = entry.get("name")
                if name not in poses:
                    continue
                matrix = entry.get("matrix", {})
                a, d = float(matrix.get("scaleX", 1)), float(matrix.get("scaleY", 1))
                b, c = float(matrix.get("rotateSkew0", 0)), float(matrix.get("rotateSkew1", 0))
                # Матрицы этого символа ортогональны: Phaser может передать их без потери skew.
                if abs(a * c + b * d) > 0.00001:
                    raise ValueError(f"Frame {number}: a skew transform needs explicit renderer support")
                bodies.append({"name": name, "depth": int(depth), "pose": poses[name],
                               "matrix": [a, b, c, d, int(matrix.get("translateX", 0)) / 20,
                                          int(matrix.get("translateY", 0)) / 20]})
            frames[str(number)] = {"bodies": bodies, **({"action": action} if action else {})}
            number += 1

    return {"version": 1, "symbol": 838, "frameRate": 30, "count": number - 1,
            "originalSha256": hashlib.sha256((ROOT / "original/elonashooter1.3.swf").read_bytes()).hexdigest(),
            "labels": labels, "frames": frames}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--xml", type=Path, default=ROOT / ".build/reference/original.xml")
    parser.add_argument("--script", type=Path, default=ROOT / ".build/export/scripts/ally1.as")
    parser.add_argument("--output", type=Path, default=ROOT / "web/public/assets/ally-animation.json")
    args = parser.parse_args()
    metadata = extract(args.xml, args.script)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(metadata, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Extracted ally1 transforms and frame-script poses: {metadata['count']} frames -> {args.output}")


if __name__ == "__main__":
    main()
