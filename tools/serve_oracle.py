"""Локальный стенд оригинального SWF; результаты сохраняются без ручного прохождения."""
import argparse
import json
import mimetypes
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / ".build/oracle/browser-report.json"
REPORTS = {
    "/api/report": REPORT,
    "/api/waves-report": ROOT / ".build/oracle/waves-browser-report.json",
    "/api/combat-report": ROOT / ".build/oracle/combat-browser-report.json",
    "/api/geometry-report": ROOT / ".build/oracle/geometry-browser-report.json",
    "/api/loot-report": ROOT / ".build/oracle/loot-browser-report.json",
    "/api/progression-report": ROOT / ".build/oracle/progression-browser-report.json",
    "/api/town-report": ROOT / ".build/oracle/town-browser-report.json",
}
ROUTES = {
    "/": ROOT / "tools/oracle/index.html",
    "/harness.js": ROOT / "tools/oracle/harness.js",
    "/reference.swf": ROOT / ".build/oracle/reference.swf",
    "/build-report.json": ROOT / ".build/oracle/build-report.json",
    "/waves-reference.swf": ROOT / ".build/oracle/waves-reference.swf",
    "/waves-build-report.json": ROOT / ".build/oracle/waves-build-report.json",
    "/combat-reference.swf": ROOT / ".build/oracle/combat-reference.swf",
    "/combat-build-report.json": ROOT / ".build/oracle/combat-build-report.json",
    "/geometry-reference.swf": ROOT / ".build/oracle/geometry-reference.swf",
    "/geometry-build-report.json": ROOT / ".build/oracle/geometry-build-report.json",
    "/loot-reference.swf": ROOT / ".build/oracle/loot-reference.swf",
    "/loot-build-report.json": ROOT / ".build/oracle/loot-build-report.json",
    "/progression-reference.swf": ROOT / ".build/oracle/progression-reference.swf",
    "/progression-build-report.json": ROOT / ".build/oracle/progression-build-report.json",
    "/town-reference.swf": ROOT / ".build/oracle/town-reference.swf",
    "/town-build-report.json": ROOT / ".build/oracle/town-build-report.json",
}


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        route = unquote(urlsplit(self.path).path)
        if route in REPORTS:
            path = REPORTS[route]
        elif route.startswith("/ruffle/"):
            base = (ROOT / ".tools/ruffle/package").resolve()
            path = (base / route.removeprefix("/ruffle/")).resolve()
            if not path.is_relative_to(base):
                self.send_error(403)
                return
        else:
            path = ROUTES.get(route)
        if path is None or not path.is_file():
            self.send_error(404)
            return
        data = path.read_bytes()
        kind = {".js": "text/javascript", ".wasm": "application/wasm", ".swf": "application/x-shockwave-flash"}.get(path.suffix)
        self.send_response(200)
        self.send_header("Content-Type", kind or mimetypes.guess_type(path.name)[0] or "application/octet-stream")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        destination = REPORTS.get(urlsplit(self.path).path)
        if destination is None:
            self.send_error(404)
            return
        # Стенд принимает отчёты только со своей страницы; путь записи не задаётся клиентом.
        expected_origin = f"http://{self.headers.get('Host')}"
        if self.headers.get("Origin") != expected_origin:
            self.send_error(403)
            return
        try:
            size = int(self.headers.get("Content-Length", "0"))
            if not 0 < size <= 2_000_000:
                raise ValueError("Invalid report length")
            report = json.loads(self.rfile.read(size))
            if not isinstance(report, dict) or report.get("format") != "elona-original-oracle" or report.get("version") != 1:
                raise ValueError("Unsupported report")
            destination.parent.mkdir(parents=True, exist_ok=True)
            temporary = destination.with_suffix(".tmp")
            temporary.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
            temporary.replace(destination)
        except (ValueError, OSError) as error:
            self.send_error(400, str(error))
            return
        self.send_response(204)
        self.end_headers()

    def log_message(self, format, *args):
        if args and str(args[0]).startswith("POST"):
            super().log_message(format, *args)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=5176)
    arguments = parser.parse_args()
    server = ThreadingHTTPServer(("127.0.0.1", arguments.port), Handler)
    print(f"Original-game oracle: http://127.0.0.1:{arguments.port}/", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
