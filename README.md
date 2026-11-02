# Elona Shooter Plus PLUS

A TypeScript/Phaser browser remake of Elona Shooter Plus 1.3.0.4.
The current local build supports **Rogue, Hunter, Sheriff and Militia** through
**Days 1–40**. This is an incomplete remake; later campaign cycles and remaining town systems
are the next substantial work.

Open [the local game](http://127.0.0.1:5175/elona/).
Original artwork, English text, audio and credits are retained. Sound starts muted
unless you previously enabled it; its button explicitly displays the current state.

## Current capabilities

- All four starting classes: class-specific gear, growth and earned skill choices.
  Rogue and Hunter start with Little Girl; Militia has its class grenade,
  starting rifle, Simple Flame Thrower and Simple Chain Gun.
- The first 40-day encounter cycle: Catapult, Spider, Ghost, Ogre, Knight, Bird,
  Tank, Dino and Dragon, bird-dropped rats, multi-boss days and later boss attacks.
- Manual/automatic reload, owned firearms, bows, projectile weapons and consumables;
  enemies, bosses and health bars; ordinary/boss loot, skills and settlements.
- Prepared towns, shop buy/sell, weapon upgrades and MOD mounting; permanent
  companions, equipment, orders, autonomous combat, growth and wages.
- Both Castle pages: House, Wall, Sandbag, Storage, Looter, Fix Wall, Repairman,
  Trainer, Smith, Museum, Chicken, Sister, Villa and Sp.Trainer, with their effects.
- Prayer, Dinner, Party, egg collection, Taunt and training; Go searching with
  persistent outcomes, rewards, setbacks and talent growth; shop/recruit refresh,
  Free Repair, first title/salary and Rest. Sister bombs can be shot to explode.
- One browser save with Continue and JSON import/export. Version28 accepts prior
  browser saves; original Flash saves require a future converter.

Remaining work and validation limits are in [port status](docs/port-status.md).
The [process review](docs/development-process-review.md) records the correction
to solo, feature-first development. Older release history remains in Git at
`2075094` and [historical verification](docs/port-verification.json).

## Run, test and host

Use Node.js 22.12+ and npm. From the repository root:

```powershell
Set-Location web
npm.cmd ci
npm.cmd run dev
```

Open the Vite URL, choose New Game, select a class/appearance and press Proceed.
Mouse aims/fires; hold/release for bows. Space reloads, 1–5 select/use items,
Esc pauses. Losing focus also pauses combat. Continue restores the local save;
export a backup to transfer it between browsers or websites.

```powershell
npm.cmd test
npm.cmd run build
```

Publish the **contents of `web/dist/`** at a path on your website, or embed that
URL in an iframe. The build uses relative asset paths. No Flash plugin, Ruffle,
Node process or gameplay server is required on the website. The existing local
preview at `http://127.0.0.1:5175/elona/` serves `web/dist/`.

The simulation is independent of rendering. Existing original-game comparisons
remain available through `web/package.json`; rerun those affected by a change.
New class checks cover gear, growth, skill selection, JSON restore/replay, Militia
cooldown, and natural battles through the first two towns for each starting class.
Campaign checks cover all 40 days with controlled powerful equipment, natural wave
generation, rewards, town/Rest transitions and saves. This verifies progression;
full difficulty balance is not established by the controlled run. The economy
checks cover purchases/caps, daily limits, income, AP, bonuses, training, refreshes,
bomb launches/chains, saved actions and actual damage/XP effects.
Search checks cover every event family, full inventory, AP/XP boundaries, retained
random sequence, talent progress and fame income at the next settlement.
Test counts do not establish whole-game completeness or full pixel parity.

## Original assets and recovery

Runtime assets are included in `web/public/assets/`; ordinary web development
does not require Java or Flash tooling. The manifest records original symbols,
frames and registration offsets. Regeneration requires Python3/Pillow, Java21
and JPEXS FFDec26.4.0:

```powershell
python tools/extract_web_assets.py
```

Use `--refresh` to regenerate intermediate FFDec exports. They stay in ignored
`.build/`; extraction verifies the original SWF hash. See
[asset provenance](docs/asset-manifest.json) and [UI reference](docs/ui-reference.md).
Original game/artwork credits belong to **Noa** and the supplied release's contributors.
The extractor also generates the later enemy atlases and source frame-command
table through `tools/extract_campaign_enemies.py`. Later enemy collision currently
uses rendered alpha; early enemies retain source filled contours.

The preserved Flash version is `elonashooter1.3-fixed.swf`, playable through
Ruffle's Select File → New Game → appearance → Proceed flow. Its startup fix
uses SWF10 construction behavior, delayed title initialization and a reentry guard.
The original English UI/balance and original loader/advertising flags are retained;
the retired MochiAds endpoint can produce a nonfatal warning.

- `original/elonashooter1.3.swf` and `src/original/MainTimeline.as` are unchanged baselines.
- `src/shootem_fla/MainTimeline.as` contains the startup compatibility fix.
- `python tools/build.py` rebuilds the fixed SWF and validates non-code preservation.

Portable dependencies belong in ignored `.tools/ffdec/ffdec.jar` and `.tools/jre/`.
Alternatively pass `--java C:/path/to/java.exe --ffdec C:/path/to/ffdec.jar`.
See [SWF verification](docs/verification.json) and
[build verification](docs/build-verification.json). Those preservation claims apply
to the fixed SWF, not the new renderer. Original SWF SHA256:
`4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663`.
