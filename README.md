# Elona Shooter Plus PLUS

A TypeScript/Phaser browser remake of Elona Shooter Plus 1.3.0.4.
The current local build supports **all eight original hero classes** and
**repeating campaign cycles**, including Casual and Hardcore modes. This is an
incomplete remake; original-save compatibility, remaining interactions and
presentation/stability evidence still need work.

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
  Chain Gun wind-up, release/resume and saved spin state work in manual and AI control.
  Bird-dropped rats drift and fall with separate original body/shadow artwork;
  troops can acquire them in the air, and mid-air deaths/save restores are connected.
  enemies, bosses and health bars; ordinary/boss loot, skills and settlements.
- F toggles the original Fire at will mode: the hero acquires targets, fires and
  reloads using the party AI, with its original accuracy penalty and Sister indicator.
  The mode/target state survives Continue; each new mission resets F and follows
  the hero's saved town order.
- The hero's Barrack controls support focused skills, all seven AI orders, and
  Boss/Defend priorities. An eligible focus has the original 50% first-choice chance
  when selecting level-up skills. Hero Mode uses manual input and temporary F;
  persistent town orders independently control later battles. Preferences survive
  Rest, Continue and JSON backups without spending AP/gold or drawing RNG.
- The castle Sister reacts to damage and critical kills using her original
  animations. Hero/companion hitscan can kill her, stopping her cheers; saves retain
  her pose/state and Rest revives her. Collision is independent of rendering.
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
- Original event cards and full English outcomes for town activities, all18 search
  families, visitor robbery, shop/recruit refreshes and Mission Hire. Rest, Free
  Repair and promotions use the same original window. Dismissing a card does not
  repeat its effects; Escape, Space and Enter also close these notices.
- Museum/Medals navigation, both original medal pages and English descriptions;
  robbery for 2 AP with daily diminishing payouts, Robber skill/medal bonuses,
  saved counters and action medals with their next-town AP chances.
  The original medal hint panel shows earned bonuses and locked requirements.
  Newly earned medals display the original notification artwork, wording and
  sound; Continue/import do not repeat existing awards.
  All six survival milestones through Day150 and the Day100 Hardcore Museum badge
  are connected to the shared collection and future-start gold/Fame bonuses.
  The original Kongregate link and its visit medal are available in the Museum.
- A persistent browser medal collection with class unlocks and original New Game
  starting bonuses. Eight browser save slots with the original title dropdown,
  trash icon and deletion confirmation, plus Continue and JSON import/export.
  Version40 accepts prior browser saves; the original Flash medal/index file can
  be imported. Original Flash town adventures have a validated import path;
  compatibility with real players' files remains unverified.
- Casual lowers encounter power/taxes and grants35% more kill XP. Hardcore uses
  normal combat, deletes the resumable save when a battle starts and permits
  saving/export only in town. Each mode has a separate best-day record.
- All seven original Game MODs: boss MOD drops, Intense Start, weapon-level limits,
  Skip hard waves, Tighter crosshair, Laptop difficulty and Community Compilation.
  New Game opens the original options panel; selected MODs persist per adventure.
- Original Basic, Battle, Town and Credits help pages, with all13 English tips,
  original navigation and credits links. Open Help from the title or pause menu;
  scroll tips with the wheel, scrollbar or keyboard. Esc/outside click closes help.
- Original Statistics & Options menu in combat, town and results, with working
  menu/mute icons, six presentation settings and quit confirmation. Options travel
  with the adventure; default options preserve existing save envelopes.
  Original crosshair variants, separate player/NPC damage numbers and victory
  fireworks are connected. Watching results long enough awards Ha-na-bi.
  Lifetime kill totals persist through Rest, Continue and JSON backups; Carry Over
  restores the earlier town's count. Older Day2+ browser saves show an explicit
  lower bound because earlier kills were never recorded.

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
F toggles Fire at will, Esc pauses. Losing focus also pauses combat. Continue restores the local save;
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
Ctrl+Shift+O imports JSON or Flash saves; Ctrl+Shift+M toggles mute. Testing stays muted and
never activates native fullscreen, which would take over the user's desktop.

To keep original Flash unlocks, select **elonas_idx.sol** with Ctrl+Shift+O and
confirm the in-game preview. Known medals merge with the browser collection;
Normal/Hardcore/Casual survival records retain the higher value. Existing adventures,
slot selection, sound and game options are preserved. Imported bonuses apply to
future New Games; existing adventures keep their saved medal set. Unsupported
flags such as the undefined Beta medal are ignored without granting bonuses.
Files named **elonas0.sol through elonas7.sol** contain town adventures. Select an
Empty Save first, then import the file with Ctrl+Shift+O and confirm its class,
day and destination slot. Import the matching **elonas_idx.sol first** to retain
the original medal collection and mission defense. The converter currently accepts
1.3.0.1–1.3.0.4 checkpoints within Days1–1000 and uses the normal browser save validator.
It preserves saved gold/AP, hero/party progression and equipment, stocks, mission
bonuses, upgrades, counters, orders and options. Starting bonuses are not applied
again. The original file is read only; Cancel leaves the selected adventure intact.

Flash did not store its random generator state. Import starts a deterministic
browser stream; future rolls will differ. Already-finished combat bookkeeping,
which is not resumable from a Flash town save, is reconstructed for browser save
validation. Import resumes in town, and the next Rest starts a normal battle.
Deleted, malformed or unsupported checkpoints are refused visibly. Controlled
source-schema files cover all eight classes, modes, town changes, customized gear,
later-cycle towns and save replay. A town save written by the preserved game under
Ruffle also imports correctly; its next search reproduces the original event,
AP and search cursor. The [native fixtures](web/tests/fixtures/flash-native/README.md)
record that independent comparison. Historical player files and the native Adobe
Flash runtime remain unverified. Preserve a backup and treat original-file
compatibility as provisional.
Opening the file picker pauses active combat/results; Space cannot dismiss the
import preview or resume the game underneath it. Escape cancels the preview.
The reader follows [Adobe's AMF3 specification](https://veovera.org/docs/legacy/amf3-file-format-spec.pdf)
and the [Ruffle SharedObject envelope](https://github.com/ruffle-rs/rust-flash-lso/blob/master/flash-lso/src/read.rs).

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
starting bonuses and actual class combat effects. Medal notification filters remain
approximate; historical player Flash files remain unverified. Slot tests cover eight independent
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
