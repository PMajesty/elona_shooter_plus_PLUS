# Elona Shooter Plus PLUS

A TypeScript/Phaser browser remake of Elona Shooter Plus 1.3.0.4.
The current local build supports **all eight original hero classes** and
**repeating campaign cycles**, including Casual and Hardcore modes. This is an
incomplete remake; remaining medal effects, Flash-save conversion and other systems are still being ported.

Open [the local game](http://127.0.0.1:5175/elona/).
Original artwork, English text, audio and credits are retained. Sound starts muted
unless you previously enabled it; the mute preference persists between visits.

## Current capabilities

- All eight hero classes: class-specific gear, growth and earned skill choices.
  Rogue and Hunter start with Little Girl; Militia has its class grenade,
  starting rifle, Simple Flame Thrower and Simple Chain Gun.
  Sniper, Ranger, Duelist and Noble unlock through the four starting-class medals.
  Their adrenaline effects and Noble's passive bonuses are connected to combat.
- Repeating 40-level encounter cycles: Catapult, Spider, Ghost, Ogre, Knight, Bird,
  Tank, Dino and Dragon, bird-dropped rats, multi-boss days and later boss attacks.
  Later cycles increase enemy strength and can spawn the original larger variants.
  The current browser save safety boundary is Day1000; this is not an endless-play claim.
- Manual/automatic reload, owned firearms, bows, projectile weapons and consumables;
  enemies, bosses and health bars; ordinary/boss loot, skills and settlements.
- Equipment's original Recycle Gun and Charge Item actions: turn an owned gun into
  a random MOD for5 AP, or refill an eligible usable item for3 AP. Ten recycles earn
  Gun Mania, including its +15% MOD efficiency in mounting, generated weapons,
  living-weapon growth and upgrades. Carry Over retains its medal restrictions.
  Ragnarok consumes its artifact, attempts30 real dinosaur spawns and extends the
  spawn timer; surviving awards its original medal and bonuses.
- Prepared towns, shop buy/sell, weapon upgrades and MOD mounting; permanent
  companions, equipment, orders, autonomous combat, growth and wages.
- Both Castle pages: House, Wall, Sandbag, Storage, Looter, Fix Wall, Repairman,
  Trainer, Smith, Museum, Chicken, Sister, Villa and Sp.Trainer, with their effects.
- Prayer, Dinner, Party, egg collection, Taunt and training; Go searching with
  persistent outcomes, rewards, setbacks and talent growth; shop/recruit refresh,
  Free Repair, all eight honorary promotions/salaries and Rest. Mission Hire contracts a temporary
  Militia henchman with a Rapid Bowgun for half the next mission reward; he joins
  through Rest and leaves at settlement. Sister bombs can be shot to explode.
- Museum/Medals navigation, both original medal pages and English descriptions;
  robbery for 2 AP with daily diminishing payouts, Robber skill/medal bonuses,
  saved counters and action medals with their next-town AP chances.
- A persistent browser medal collection with class unlocks and original New Game
  starting bonuses. Eight browser save slots with the original title dropdown,
  trash icon and deletion confirmation, plus Continue and JSON import/export.
  Version37 accepts prior browser saves; original Flash saves require a future converter.
- Casual lowers encounter power/taxes and grants35% more kill XP. Hardcore uses
  normal combat, deletes the resumable save when a battle starts and permits
  saving/export only in town. Each mode has a separate best-day record.
- All seven original Game MODs: boss MOD drops, Intense Start, weapon-level limits,
  Skip hard waves, Tighter crosshair, Laptop difficulty and Community Compilation.
  New Game opens the original options panel; selected MODs persist per adventure.
- Original Basic, Battle, Town and Credits help pages, with all13 English tips,
  original navigation and credits links. Open Help from the title or pause menu;
  scroll tips with the wheel, scrollbar or keyboard. Esc/outside click closes help.

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
export a backup to transfer it between browsers or websites. Current-format imports
restore the saved medal collection as well as the adventure. Legacy imports merge
their medals into the existing collection; Continue preserves the collection.
Keep a recent export before restoring an older backup.
Select an Empty Save on the title screen before New Game to keep a separate run.
Continue, save and JSON import/export use that selected slot; existing browser
adventures remain in the first slot. Medals/day records are shared across slots
and survive deleting an adventure. Each JSON backup contains one adventure and
the shared collection; exporting one does not export all eight adventures.
The page contains only the centered game and its requested top-right fullscreen
icon. There is no added bottom toolbar or floating explanatory message overlay.
Browser shortcuts: Ctrl+S saves, Ctrl+Shift+S exports a JSON backup,
Ctrl+Shift+O imports one and Ctrl+Shift+M toggles mute. Testing stays muted and
never activates native fullscreen, which would take over the user's desktop.

```powershell
npm.cmd test
npm.cmd run build
```

Publish the **contents of `web/dist/`** at a path on your website, or embed that
URL in an iframe. The build uses relative asset paths. No Flash plugin, Ruffle,
Node process or gameplay server is required on the website. The existing local
preview at `http://127.0.0.1:5175/elona/` serves `web/dist/`.
To restore that preview after an app restart, run
`npm.cmd --prefix web run preview -- --port 5175 --strictPort --base /elona/`.

The simulation is independent of rendering. Existing original-game comparisons
remain available through `web/package.json`; rerun those affected by a change.
Class checks cover gear, growth, skill selection, JSON restore/replay, Militia
cooldown, and natural battles through the first two towns for all eight classes.
The automated player uses ordinary Free Repair between battles when damaged.
Campaign checks cover all 40 days with controlled powerful equipment, natural wave
generation, rewards, town/Rest transitions and saves. This verifies progression;
full difficulty balance is not established by the controlled run. The economy
checks cover purchases/caps, daily limits, income, AP, bonuses, training, refreshes,
bomb launches/chains, saved actions and actual damage/XP effects.
Search checks cover every event family, full inventory, AP/XP boundaries, retained
random sequence, talent progress and fame income at the next settlement.
Temporary-hire checks cover confirmation, a full permanent party, actual AI fire,
projectile replay, half rewards, wages, departure and old-save migration.
Museum checks cover payouts, medal thresholds, daily resets, action AP bonuses,
correct hero-class awards and migration. Unlock checks cover the global collection,
starting bonuses and actual class combat effects. Some medal effects and
Flash-save conversion remain incomplete. Slot tests cover eight independent
adventures, selection persistence, deletion, Hardcore isolation and storage failures.
Additional controlled combat crosses Day40/80 through ordinary rewards, towns,
Rest and JSON restores. Source-formula checks cover later cycles and Day1000 save
boundaries; these do not prove balanced play or long-session performance there.
Ragnarok checks cover actual attacks, capacity, one-use consumption, save replay,
victory/defeat medal boundaries, wage reduction and the future New Game bonus.
Mode checks cover Casual combat/settlement and replay, Hardcore save policy,
day20/40/80 medals, independent records and unchanged normal-save migration.
Game MOD checks measure actual movement, spread/recoil, XP, waves, rewards and
party-based weapon generation limits, plus AP, repeating sales and save replay.
Carry Over is available after defeat from Day2 outside Hardcore: restore the last
town, add battle earnings (minimum200 GP) and1 AP, with original medal restrictions.
Checks cover full restoration, repeated retries, JSON replay and invalid checkpoints.
Claim title now follows every original rank through King on Day101, with daily
salaries from100 to3000 GP. Delayed promotions stay sequential and cost4 AP each;
the new salary first pays at the next settlement. Numeric title saves keep their
existing format. Tests cover all unlock days, AP refusal, final-rank limits,
settlement credits and save/Carry Over restoration.
Legacy battle saves gain a Carry Over town snapshot at their next Rest.
The source's alternative-start branches have no reachable player control; see the
[source audit](docs/port-status.md).
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
