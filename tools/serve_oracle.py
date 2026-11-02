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
    "/api/sixth-day-waves-report": ROOT / ".build/oracle/sixth-day-waves-browser-report.json",
    "/api/sixth-town-report": ROOT / ".build/oracle/sixth-town-browser-report.json",
    "/api/barbarian-report": ROOT / ".build/oracle/barbarian-browser-report.json",
    "/api/fly-report": ROOT / ".build/oracle/fly-browser-report.json",
    "/api/fifth-town-report": ROOT / ".build/oracle/fifth-town-browser-report.json",
    "/api/fifth-day-waves-report": ROOT / ".build/oracle/fifth-day-waves-browser-report.json",
    "/api/fourth-town-report": ROOT / ".build/oracle/fourth-town-browser-report.json",
    "/api/fourth-day-waves-report": ROOT / ".build/oracle/fourth-day-waves-browser-report.json",
    "/api/boss-ai-report": ROOT / ".build/oracle/boss-ai-browser-report.json",
    "/api/archer-report": ROOT / ".build/oracle/archer-browser-report.json",
    "/api/third-day-waves-report": ROOT / ".build/oracle/third-day-waves-browser-report.json",
    "/api/report": REPORT,
    "/api/waves-report": ROOT / ".build/oracle/waves-browser-report.json",
    "/api/prepared-waves-report": ROOT / ".build/oracle/prepared-waves-browser-report.json",
    "/api/hero-report": ROOT / ".build/oracle/hero-browser-report.json",
    "/api/shoot-report": ROOT / ".build/oracle/shoot-browser-report.json",
    "/api/equipment-report": ROOT / ".build/oracle/equipment-browser-report.json",
    "/api/rest-report": ROOT / ".build/oracle/rest-browser-report.json",
    "/api/second-town-report": ROOT / ".build/oracle/second-town-browser-report.json",
    "/api/third-town-report": ROOT / ".build/oracle/third-town-browser-report.json",
    "/api/castle-report": ROOT / ".build/oracle/castle-browser-report.json",
    "/api/projectiles-report": ROOT / ".build/oracle/projectiles-browser-report.json",
    "/api/modifications-report": ROOT / ".build/oracle/modifications-browser-report.json",
    "/api/combat-report": ROOT / ".build/oracle/combat-browser-report.json",
    "/api/geometry-report": ROOT / ".build/oracle/geometry-browser-report.json",
    "/api/loot-report": ROOT / ".build/oracle/loot-browser-report.json",
    "/api/progression-report": ROOT / ".build/oracle/progression-browser-report.json",
    "/api/town-report": ROOT / ".build/oracle/town-browser-report.json",
    "/api/town-preparation-report": ROOT / ".build/oracle/town-preparation-browser-report.json",
}
ROUTES = {
    "/sixth-day-waves-reference.swf": ROOT / ".build/oracle/sixth-day-waves-reference.swf",
    "/sixth-day-waves-build-report.json": ROOT / ".build/oracle/sixth-day-waves-build-report.json",
    "/sixth-town-reference.swf": ROOT / ".build/oracle/sixth-town-reference.swf",
    "/sixth-town-build-report.json": ROOT / ".build/oracle/sixth-town-build-report.json",
    "/barbarian-reference.swf": ROOT / ".build/oracle/barbarian-reference.swf",
    "/barbarian-build-report.json": ROOT / ".build/oracle/barbarian-build-report.json",
    "/fly-reference.swf": ROOT / ".build/oracle/fly-reference.swf",
    "/fly-build-report.json": ROOT / ".build/oracle/fly-build-report.json",
    "/fifth-town-reference.swf": ROOT / ".build/oracle/fifth-town-reference.swf",
    "/fifth-town-build-report.json": ROOT / ".build/oracle/fifth-town-build-report.json",
    "/fifth-day-waves-reference.swf": ROOT / ".build/oracle/fifth-day-waves-reference.swf",
    "/fifth-day-waves-build-report.json": ROOT / ".build/oracle/fifth-day-waves-build-report.json",
    "/fourth-town-reference.swf": ROOT / ".build/oracle/fourth-town-reference.swf",
    "/fourth-town-build-report.json": ROOT / ".build/oracle/fourth-town-build-report.json",
    "/fourth-day-waves-reference.swf": ROOT / ".build/oracle/fourth-day-waves-reference.swf",
    "/fourth-day-waves-build-report.json": ROOT / ".build/oracle/fourth-day-waves-build-report.json",
    "/boss-ai-reference.swf": ROOT / ".build/oracle/boss-ai-reference.swf",
    "/boss-ai-build-report.json": ROOT / ".build/oracle/boss-ai-build-report.json",
    "/archer-reference.swf": ROOT / ".build/oracle/archer-reference.swf",
    "/archer-build-report.json": ROOT / ".build/oracle/archer-build-report.json",
    "/third-day-waves-reference.swf": ROOT / ".build/oracle/third-day-waves-reference.swf",
    "/third-day-waves-build-report.json": ROOT / ".build/oracle/third-day-waves-build-report.json",
    "/": ROOT / "tools/oracle/index.html",
    "/harness.js": ROOT / "tools/oracle/harness.js",
    "/reference.swf": ROOT / ".build/oracle/reference.swf",
    "/build-report.json": ROOT / ".build/oracle/build-report.json",
    "/waves-reference.swf": ROOT / ".build/oracle/waves-reference.swf",
    "/waves-build-report.json": ROOT / ".build/oracle/waves-build-report.json",
    "/prepared-waves-reference.swf": ROOT / ".build/oracle/prepared-waves-reference.swf",
    "/prepared-waves-build-report.json": ROOT / ".build/oracle/prepared-waves-build-report.json",
    "/hero-reference.swf": ROOT / ".build/oracle/hero-reference.swf",
    "/hero-build-report.json": ROOT / ".build/oracle/hero-build-report.json",
    "/shoot-reference.swf": ROOT / ".build/oracle/shoot-reference.swf",
    "/shoot-build-report.json": ROOT / ".build/oracle/shoot-build-report.json",
    "/equipment-reference.swf": ROOT / ".build/oracle/equipment-reference.swf",
    "/equipment-build-report.json": ROOT / ".build/oracle/equipment-build-report.json",
    "/rest-reference.swf": ROOT / ".build/oracle/rest-reference.swf",
    "/rest-build-report.json": ROOT / ".build/oracle/rest-build-report.json",
    "/second-town-reference.swf": ROOT / ".build/oracle/second-town-reference.swf",
    "/second-town-build-report.json": ROOT / ".build/oracle/second-town-build-report.json",
    "/third-town-reference.swf": ROOT / ".build/oracle/third-town-reference.swf",
    "/third-town-build-report.json": ROOT / ".build/oracle/third-town-build-report.json",
    "/castle-reference.swf": ROOT / ".build/oracle/castle-reference.swf",
    "/castle-build-report.json": ROOT / ".build/oracle/castle-build-report.json",
    "/projectiles-reference.swf": ROOT / ".build/oracle/projectiles-reference.swf",
    "/projectiles-build-report.json": ROOT / ".build/oracle/projectiles-build-report.json",
    "/modifications-reference.swf": ROOT / ".build/oracle/modifications-reference.swf",
    "/modifications-build-report.json": ROOT / ".build/oracle/modifications-build-report.json",
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
    "/town-preparation-reference.swf": ROOT / ".build/oracle/town-preparation-reference.swf",
    "/town-preparation-build-report.json": ROOT / ".build/oracle/town-preparation-build-report.json",
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
