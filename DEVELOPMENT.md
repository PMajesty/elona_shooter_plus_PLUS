# Development

[About the game](README.md) · [Faithfulness](FAITHFULNESS.md)

The browser game lives in `web/` and uses TypeScript and Phaser. You only need
Node.js 22.12 or newer and npm to run it. Flash tooling is needed only when
rebuilding the preserved SWF or extracting assets.

## Run locally

From the repository root, in PowerShell:

```powershell
npm.cmd --prefix web ci
npm.cmd --prefix web run dev
```

Open [localhost:5173](http://127.0.0.1:5173/). In other shells, use `npm` in
place of `npm.cmd`. The development server reloads the game when source files change.

## Find your way around

| Location | What's there |
| --- | --- |
| `web/src/simulation.ts` | Combat, progression and the adventure state |
| `web/src/party-ai.ts` | Companion and automatic hero control |
| `web/src/rulesets.ts` | Classic and Expanded definitions |
| `web/src/main.ts` and `*-view.ts` | Input, screens and rendering |
| `web/src/locales/` and `i18n.ts` | Russian catalogs and presentation-only translation |
| `web/public/assets/` | Extracted artwork, fonts, sounds and layout data |
| `web/tests/` | Logic, save and regression tests |
| `web/scripts/` | Original-game comparisons and browser checks |
| `tools/` | Asset extraction and SWF build scripts |

Simulation runs without the renderer. Keep gameplay rules there so they can be
tested without clicking through a battle. New optional content belongs in
Expanded; [the edition guide](docs/expanded-edition.md) explains its save boundary.

## Check a change

Run the tests and make a production build:

```powershell
npm.cmd --prefix web test
npm.cmd --prefix web run build
```

For a small change, start with the relevant test file:

```powershell
node --experimental-strip-types --test web/tests/smart-mode-integration.test.ts
```

Use a fixed seed to reproduce combat problems. If a change affects saved state,
check loading an older save and continuing from a current one. The comparison
scripts listed in [package.json](web/package.json) check behavior against the
preserved game; replaying our own simulation alone cannot establish fidelity.

Check changed screens in the browser too. For changes spanning the game loop,
follow New Game, combat, results, town, and save/Continue. Use an isolated browser
profile, keep sound muted, and leave native fullscreen to the player. Never use
someone's active save as a test fixture.

Touch checks are described in [port status](docs/port-status.md). They use
Playwright from the ignored `.tools/browser-qa/` folder. The game itself has no
Playwright dependency.

## Saves

Adventures live in browser storage, tied to the site's origin. A different port,
hostname or HTTP/HTTPS scheme has different storage. Export before moving a run.

- The eight slots contain one adventure each, labeled Classic or Expanded.
- Each edition has its own medal collection and day records, shared across its slots.
- A JSON export contains one adventure and that edition's collection, not all slots.
- Import merges the matching collection; it cannot convert an adventure's edition.
- Hardcore saves and exports are available only in town.

Save versions are defined in `web/src/save-version.ts`; edition revisions are in
`web/src/rulesets.ts`. Keep migrations compatible with existing saves. Unknown
formats should fail visibly before changing the current adventure or storage.

## Build and host

`npm.cmd --prefix web run build` writes `web/dist/`. To preview that folder:

```powershell
python -m http.server 8080 --bind 127.0.0.1 --directory web/dist
```

Open [localhost:8080](http://127.0.0.1:8080/) instead of double-clicking
`index.html`. To restore the usual local preview at `/elona/`:

```powershell
npm.cmd --prefix web run preview -- --port 5175 --strictPort --base /elona/
```

Upload the **contents** of `web/dist/`, including assets, to a static web host.
Use a folder URL with a trailing slash. Asset paths are relative, so the game
can live under `/elona/` or another subfolder. The website needs no Flash plugin,
Ruffle, Node process or gameplay server.

For an embed:

```html
<div style="width:100%;max-width:1240px;aspect-ratio:31/19">
  <iframe src="/elona/" title="Elona Shooter Plus"
    width="620" height="380" allow="fullscreen"
    style="display:block;width:100%;height:100%;border:0"></iframe>
</div>
```

Keep a direct game link available for save downloads. Test input, save/Continue
and export under the host's actual browser policies; sandboxed embeds have not
been verified. The current site's HTTPS setup and release recovery are documented
in [deployment](docs/deployment.md).

The [public browser release](https://github.com/PMajesty/elona_shooter_plus_PLUS/releases/latest)
also includes a static web build and SHA-256 checksum. Its browser version is
separate from the original Flash game's 1.3.0.4 version and the save format.

## Original assets and Flash reference

The checked-in assets are enough for ordinary browser development. Their
[manifest](docs/asset-manifest.json) and [UI reference](docs/ui-reference.md)
record where they came from.

Regeneration needs Python with Pillow, Java 21 and JPEXS FFDec 26.4.0:

```powershell
python tools/extract_web_assets.py
```

Add `--refresh` to regenerate the intermediate FFDec exports in `.build/`.
The extractor checks the original SWF hash before proceeding.

Keep `original/elonashooter1.3.swf` and `src/original/MainTimeline.as` unchanged.
SWF compatibility edits belong in `src/shootem_fla/MainTimeline.as`. Rebuild with
`python tools/build.py`, then open `elonashooter1.3-fixed.swf` in Ruffle and check
New Game through Proceed. A successful compilation does not prove startup works.

Portable Java/FFDec tools belong in `.tools/jre/` and `.tools/ffdec/ffdec.jar`.
The build also accepts `--java` and `--ffdec` paths. See the
[SWF verification](docs/verification.json) and
[build record](docs/build-verification.json) for preservation checks.

Keep `.tools/`, `.build/`, credentials and runtime caches out of commits.
The [license](LICENSE.md) covers newly written port code, not the upstream game
or its extracted assets.

## Translation

See [localization](docs/localization.md) for catalogs, Cyrillic font credits, image regeneration and the language-switch checks.
