# Browser port status

Current playable scope: **two connected Sheriff days**, including owned
firearms and consumables, ordinary/boss loot, earned skills, results, prepared
towns, shop transactions, Free Repair and Rest. This is not a complete remake.
The client runs independently of Flash and Ruffle; the preserved game remains
the reference for behavior, content and appearance.

The v7 build is served at `http://127.0.0.1:5175/elona/`. It passed the automated
checks below and focused browser acceptance for New Game, equipment, Rest,
Day 2 Continue, second-town loading and legacy migration. The previous release
is retained in `.build/browser-before-day2`; the deployable archive is
`.build/elona-shooter-browser-day2-slice.zip`. Release hashes and exact browser
boundaries are recorded in [port verification](port-verification.json).

## Current goal amendments

The user amended the long-term goal on 2026-11-01: exact **30 Hz / 20 Hz rates
are optional**, unless changing them materially changes gameplay. Preserve
observable pacing, weapon cadence, reload durations, movement and enemy behavior.
The existing clocks remain the reference implementation; their literal rates
are not an independent requirement.

The veteran complaint, **“hitboxes that plague ES lategame,”** is an explicit
investigation target, not a reproduced defect. Use controlled late-game
encounters to distinguish visible shapes, hit regions, overlaps, animation,
projectile paths and input timing. Preserve a failing original case and a passing
port regression before documenting an intentional gameplay correction. The
earlier ordinary-enemy contour fixes do not establish this late-game diagnosis.

## Playable coverage

- Title, New Game, 22 appearances and the Sheriff class, including original hero
  rolls, character rerolls before Proceed and level growth.
- The original mission-zero opening battle and the prepared level-one mission
  on displayed Day 2, with victory/defeat, rewards and subsequent town entry.
- Mouse shooting and number keys 1–5 for owned slots. Ordinary firearms use item
  damage, accuracy, cadence, ammunition, weapon requirements, manual/magazine
  reload and automatic-fire/reload properties. Covered Sheriff skills and item
  modifiers affect combat; source-derived weapon/castle calculations are shared
  with the reference comparisons.
- Grenades with stored launch damage, Repair Hammers and Holy Grail protection.
  Consumables retain the selected weapon. Hammers spend a charge even at full
  HP; the Grail is single-use. Cooldowns belong to inventory slots. Original
  cooldown-bar and layhand artwork is included.
- Original art, fonts, audio and character animation layers; original boss health
  bars and the source boss appearance progression for the two covered days.
- Ordinary loot, earned boss prizes and earned Sheriff choices, followed by
  once-only financial settlement. Six owned slots, complete item records,
  pending offers and choices persist through saves without rerolls.
- Prepared towns with stock, cards, next-mission data, recruit data and search
  initialization in source order. Shop purchases, swaps, confirmed sales and
  Shop Token discounts work. Unsupported MOD mounting preserves both items.
- Castle Free Repair: two AP, full wall repair, no gold or RNG cost. Full walls
  are rejected before the insufficient-AP check.
- Mission → Rest: opening the original dialog changes no simulation state;
  acknowledgment starts Day 2. Rest costs no gold or AP, does not heal walls,
  refills guns and preserves spent consumable charges. Day 2 ends in its own
  rewards and prepared town; further Rest is disabled.
- Pause, local saves, Continue and validated browser-save import/export.

Other classes, Day 3 onward, Ragnarok, projectile weapons, recruiting, card and
search actions, stock refresh, weapon upgrades and MOD mounting remain
unavailable. Generated records or atlas entries do not imply these actions work.
Learned skills whose companion or town systems are absent do not have those
missing effects. Original Flash saves require a separate converter.

## Architecture and persistence

`web/src/simulation.ts` owns gameplay state separately from Phaser rendering.
It currently retains **30 Hz frame updates** and **20 Hz timer work**, while
rendering follows the browser refresh rate. Pause freezes simulation work.
`main.ts` connects input, scenes, original art, audio and persistence.

`hero.ts` owns character generation/growth; `missions.ts` owns the covered
mission/wave generators. `combat-stats.ts` and `consumables.ts` contain audited
weapon, castle and consumable calculations. `items.ts` and `progression.ts`
implement items, loot and Sheriff choices. The town/loot/skill/shop views expose
these systems through ordinary UI. `town-preparation.ts` and `recruits.ts`
preserve generation order and retained records across the two towns.

`original-animation.ts` combines exported effect layers with character poses and
source transforms. Ordinary-enemy collision uses original filled contours and
placement matrices, rather than bitmap transparency. Persisted shadow history
preserves a sheep's shadow exclusion after attack-to-walk transitions. Bosses
use a separate rendered alpha path; the headless soak uses a documented boss
rectangle fallback.

Version **7** makes owned items the source of ammo and reload timers. It stores
the selected slot, five consumable cooldowns, protection state, grenade launch
damage and five weapon-experience categories: Small Gun, Big Gun, Rifle,
Shotgun and other. Kills credit the selected slot's original `reqTrait` metadata,
even if a grenade has depleted that record before impact. Owning a Shotgun does
not redirect experience earned while holding another item. Each of the first
four categories advances once only when XP is strictly above `skill * 12 + 20`,
then resets that category to zero; the other category does not promote a skill.

The save also retains the active mission, entry gold used by results, prior town,
covered campaign medals, perfect-day count and boss appearance count. A medal
earned after Day 2 changes the next prepared mission, not the historical mission
that was just fought. `totalMoney` includes gold pickups, result income and
confirmed sales; purchases do not reduce that historical counter.

Versions **1–6** remain accepted. Their duplicate player ammo/cooldown fields
migrate to items and slot timers; scalar weapon XP maps to Shotgun's category.
Old in-flight grenades retain the former fixed damage of 45. Missing campaign
values are derived only from the covered first-day state. Current v7 saves must
provide their shadow history; only legacy saves use the former frame-derived
fallback, which cannot recover an earlier attack-to-walk transition.

Earlier migration guarantees remain:

- v1 item records and pre-v6 hidden hero data use separate recorded
  reconstruction streams. Existing combat RNG, owned items and known traits are
  preserved; lost item metadata, potentials and growth history are unrecoverable.
- Results that omitted boss/skill rewards resume the owed stage. New rewards use
  the saved random stream once. v1–v3 early settlement is reconciled without
  paying twice; completed results retain their final balance.
- v4 towns keep gold, AP and HP while missing preparation runs once. v5 and later
  retain inactive item records because original generation can reuse their fields.
  Historical gold-pickup income omitted by older port versions is not reconstructed.
- Preparation saves the completed `searched` initialization, deliberately avoiding
  the source's intermediate autosave before that draw. Restoring a ready town
  does not reroll it. Free Repair and shop transactions add no random draws.

Port saves preserve the port's own RNG sequence. The generator differs from
Flash's `Math.random()`; identical seeds do not recreate an arbitrary original
playthrough. Browser storage remains local to the site and browser profile;
exported JSON provides portability.

Assets come from `tools/extract_web_assets.py`, with animation metadata from
`tools/extract_animation_metadata.py`. Original source exports and derived SWFs
stay in ignored `.build/`; selected runtime files are in `web/public/assets/`.
The static build is `web/dist/` with relative URLs for a website subdirectory.
Phaser is bundled; no Flash plugin, Ruffle, external CDN or gameplay server is
required by the distributed client. See the [README](../README.md) for commands
and original credits.

## Evidence and limits

The integrated release passes **135 tests** and TypeScript checks. The newest
independent original comparisons cover:

| Boundary | Accepted comparison |
| --- | --- |
| Equipment selection, fire and reload input | 56 original snapshots |
| Castle damage, solo skills and protection | 17 original states with RNG accounting |
| Rest | Three final port transitions from 12 original observations; intermediate dialog observations are not twelve port comparisons |
| Second-town preparation | Six original snapshots, including retained metadata and medal absorption |

These originals were captured in two identical runs. Earlier accepted coverage
remains: 72 reload snapshots; three opening-wave and three prepared-Day-2-wave
cases; 21 spawn/single-pellet cases; 22 actual shooting cases; 12 hero creation/
growth cases; 157 item/loot cases; nine Sheriff progression cases; 11 settlement/
Free Repair cases; 16 first-town preparation cases; and 19 ordinary-enemy grids
with 77,824 sampled points. The single-pellet cases supply original body/shadow
classification; the separate grids exercise production contours. Expected
original results are never generated from
the port. Boundaries, hashes, capture instructions and negative controls are in
[oracle notes](oracle-notes.md) and the [feature ledger](feature-ledger.json).

The expanded soak passed **96 scenarios across 32 seeds**, with **193,607
simulation frames, 2,167 JSON checkpoints, 399 reward transitions, 352 town
actions, 56 Rest transitions, 32 Day 2 victories and 303 equipment selections**.
Idle, aimed and interrupted-input policies vary skill choices and exercise
purchased equipment. Restored state and events match uninterrupted runs through
both days. A source check corrected the soak's former grenade assumption:
`ammo` and `ammoMax` are independently rolled, so eight charges with a maximum
of three are valid. The failed assumption is archived with the soak evidence.

This run establishes bounded port stability and replay, not Flash parity,
rendering correctness or browser performance. It uses production ordinary-enemy
contours and the boss rectangle fallback. Reports are in `.build/soak/`.
Focused regressions also cover Rest without healing/AP cost, the Day 2 boss's
175 HP and appearance 52, historical versus newly earned absorption, consumable
save/resume, category-specific weapon XP and rejection of missing v7 shadow state.

The v7 browser check opened the original Rest dialog without changing the save,
then acknowledged it into Day 2. The full export matched `startNextDay`; page
reload and Continue produced an identical export. A shop purchase survived Rest
and key 3 selected it in battle. Grenade use retained the gun selection and
started its own cooldown; Space began the manual reload animation. A real-play
second-town checkpoint retained all values, and attempting Day 3 left its export
unchanged. On the served build, New Game reached battle at tick 0 with five shells
and full HP. The existing v6 save migrated exactly and was restored after testing.
No console errors were observed. These are focused browser segments, not an
uninterrupted two-day browser playthrough or a comparative performance benchmark.

Earlier browser milestones verified New Game without an accidental shot,
shooting, manual reload, pause/Space resume, boss health bars, defeat, item and
skill menus, shop transactions, legacy imports and exact export/Continue state.
The prior v6 release also verified preserved hero/traits/items/RNG and explicit
legacy hero reconstruction. Those observations remain historical evidence;
they are not new v7 browser results. See [port verification](port-verification.json)
for concrete checkpoints and release records, rather than reusing their old
balances or RNG values as expectations after added source draws.

The early collision comparison corrected overly strict alpha-based ordinary
enemy targets. The sheep `32→5` case then exposed 76 false-positive hits caused
by lost shadow history; the current production contour path matches all 19
accepted grids. Those corrections restore the tested source behavior. They do
not reproduce the veteran late-game complaint or prove every overlapping-target
and animation case.

The former reference-runner timeout was diagnosed as a slow intro, reaching the
title after 44.1 seconds. Diagnostic builds skip the retired ad/intro while
retaining original initialization and compared methods. This solved the capture
obstacle; controlled method calls do not establish native event scheduling or
wall-clock equivalence.

Remaining limits:

- Rasterized Flash assets, filtering, fonts, dynamic text and subpixel rendering
  can differ from Flash/Ruffle. Not every animation, VFX or hit-mask edge has a
  matched browser capture. The cooldown bar scales its baked shadow with the image.
- Coverage is one class and two missions. Day 3+, projectiles, Ragnarok, other
  town actions, companions and other classes remain separate integration work.
  Global medal persistence and future-New-Game bonuses are not fully implemented.
- Original late-game collision complaints remain unverified. Boss alpha geometry
  is outside the soak's contour checks; the initial living sister is still assumed.
- No comparative benchmark establishes a speed improvement over Flash/Ruffle.
  Browser compatibility beyond the exercised environment remains to be checked.
- [SWF verification](verification.json) and [build verification](build-verification.json)
  describe the preserved Flash startup fix, not browser-port completeness.

## Next integrated work

Expand one usable original feature boundary at a time—remaining
equipment/projectiles or town actions—with
source comparisons and save continuity before enabling more days. Generated
content alone is not a completed gameplay feature.

Continuous goal work and a 30-minute watcher were authorized on 2026-11-01;
unchanged monitoring stays quiet. The clock and late-game hitbox amendments above
remain part of that direction. Current user steering takes precedence.
