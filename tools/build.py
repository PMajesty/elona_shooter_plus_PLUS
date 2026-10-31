"""Пересобирает исправленный SWF и проверяет сохранность исходных ресурсов."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import struct
import subprocess
import sys
import uuid
import zlib

ROOT = Path(__file__).resolve().parents[1]
ORIGINAL_SHA256 = "4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663"
FFDEC_VERSION = "26.4.0"
JAVA_MAJOR = "21"


def digest(data):
    return hashlib.sha256(data).hexdigest()


def command(args, timeout=180):
    return subprocess.run(args, cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                          text=True, encoding="utf-8", errors="replace", timeout=timeout)


def unpack(data):
    if data[:3] == b"CWS":
        body = zlib.decompress(data[8:])
    elif data[:3] == b"FWS":
        body = data[8:]
    else:
        raise ValueError("Unsupported SWF compression")
    if len(body) + 8 != struct.unpack_from("<I", data, 4)[0]:
        raise ValueError("SWF length does not match its header")
    start = (5 + 4 * (body[0] >> 3) + 7) // 8 + 4
    pos, tags = start, []
    while pos + 2 <= len(body):
        header = struct.unpack_from("<H", body, pos)[0]
        pos += 2
        kind, size = header >> 6, header & 63
        if size == 63:
            size = struct.unpack_from("<I", body, pos)[0]
            pos += 4
        if pos + size > len(body):
            raise ValueError("Truncated SWF tag")
        tags.append((kind, body[pos:pos + size]))
        pos += size
        if kind == 0:
            if pos != len(body):
                raise ValueError("Unexpected bytes after SWF End tag")
            return body[:start], tags
    raise ValueError("SWF has no complete End tag")


def verify(original, output):
    before_header, before = unpack(original)
    after_header, after = unpack(output)
    if original[:3] != output[:3] or output[3] != 10 or before_header != after_header:
        raise ValueError("Unexpected compression, version, dimensions, frame rate or frame count")
    if len(before) != len(after):
        raise ValueError("SWF tag count changed")
    changed = []
    for index, ((old_kind, old), (new_kind, new)) in enumerate(zip(before, after)):
        if old_kind != new_kind:
            raise ValueError(f"SWF tag type/order changed at {index}")
        if old != new:
            if old_kind != 82:
                raise ValueError(f"Non-DoABC resource changed at tag {index} (type {old_kind})")
            changed.append(index)
    if len(changed) != 1:
        raise ValueError(f"Expected one modified DoABC tag, got {len(changed)}")
    return {"tag_count": len(before), "modified_doabc_tag_indices": changed,
            "all_non_doabc_tag_payloads_identical": True,
            "tag_types_and_order_identical": True, "frame_header_identical": True,
            "original_swf_version": original[3], "output_swf_version": output[3]}


def find_java(override):
    if override:
        executable = shutil.which(override) or override
        return str(Path(executable).resolve())
    candidates = sorted((ROOT / ".tools/jre").glob("**/java.exe"))
    candidates += sorted((ROOT / ".tools/jre").glob("**/bin/java"))
    if candidates:
        return str(candidates[0].resolve())
    executable = shutil.which("java")
    if not executable:
        raise FileNotFoundError("Java 21 not found; use --java or install it under .tools/jre")
    return executable


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ffdec", type=Path, default=ROOT / ".tools/ffdec/ffdec.jar")
    parser.add_argument("--java", help="Java 21 executable path or command")
    args = parser.parse_args()
    summary = {"status": "failed", "ffdec_version": FFDEC_VERSION, "java_major": JAVA_MAJOR}
    report = ROOT / "docs/build-verification.json"
    try:
        original = (ROOT / "original/elonashooter1.3.swf").read_bytes()
        if digest(original) != ORIGINAL_SHA256:
            raise ValueError("Original SWF fingerprint differs from the preserved input")
        source = ROOT / "src/shootem_fla/MainTimeline.as"
        summary.update(original_sha256=digest(original), source_sha256=digest(source.read_bytes()))
        java, ffdec = find_java(args.java), args.ffdec.resolve()
        java_info = command([java, "-version"], 30)
        if java_info.returncode or not re.search(r'version\s+"' + JAVA_MAJOR + r'(?:\.|\")', java_info.stdout):
            raise RuntimeError("This build requires Java 21: " + java_info.stdout.strip())
        ffdec_info = command([java, "-jar", str(ffdec), "-help"], 30)
        version = re.search(r"JPEXS Free Flash Decompiler v\.([^\s]+)", ffdec_info.stdout)
        if ffdec_info.returncode or not version or version[1] != FFDEC_VERSION:
            raise RuntimeError("This build requires FFDec " + FFDEC_VERSION)
        build_root = ROOT / ".build"
        build_root.mkdir(exist_ok=True)
        # Новый временный файл исключает принятие результата предыдущей сборки.
        candidate = build_root / ("compiled-" + uuid.uuid4().hex + ".swf")
        result = command([java, "-Xmx1g", "-jar", str(ffdec), "-replace",
                          str(ROOT / "original/elonashooter1.3.swf"), str(candidate),
                          "shootem_fla.MainTimeline", str(source)])
        (build_root / "last-build.log").write_text(result.stdout, encoding="utf-8")
        if result.returncode or not candidate.is_file():
            raise RuntimeError("FFDec failed; inspect .build/last-build.log")
        output = bytearray(candidate.read_bytes())
        if len(output) < 8:
            raise ValueError("FFDec produced a truncated SWF")
        output[3] = 10
        summary.update(verify(original, output))
        summary.update(status="passed", output_sha256=digest(output), output_bytes=len(output))
        candidate.write_bytes(output)
        # Готовая копия заменяется только после проверки; при ошибке она сохраняется.
        os.replace(candidate, ROOT / "elonashooter1.3-fixed.swf")
    except (OSError, ValueError, RuntimeError, subprocess.SubprocessError, struct.error, zlib.error) as error:
        summary["status"] = "failed"
        summary["error"] = str(error)
        print("Build failed; release output was not updated: " + str(error), file=sys.stderr)
    report.parent.mkdir(exist_ok=True)
    report.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, indent=2))
    return 0 if summary["status"] == "passed" else 1


if __name__ == "__main__":
    sys.exit(main())
