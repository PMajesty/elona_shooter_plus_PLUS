# Browser port status

Updated 2026-11-05. **Classic + optional Expanded desktop/touch release, save v46.**
[Play online](https://pastalapizza.site/elona/) or [locally](http://127.0.0.1:5175/elona/).
Browser Release 1.0.1 uses `index-ppsGvq4o.js`. The documented
desktop completion boundary was reached in v43. The subsequent joint review
found and corrected differences in combat and end-of-day settlement.

The **EN/RU** button beside mute changes language immediately and remembers the
choice in this browser. Opus translated the UI, game content and lettering in
the original artwork. Russian includes Cyrillic fonts, fitted text, translated
button states and matching click masks. Proper names and logos remain intact.
Both editions and existing saves work without conversion; gameplay data stays
in English. Checks passed for 25 focused cases, identical seeded saves/replays,
muted desktop New Game/combat/Continue/help/town flows, and Russian phone-sized
Chromium touch controls. The deployed HTTPS build passed the same desktop flow,
including translated artwork, language persistence, exact save/Continue and an
unavailable-translation fallback; its bundle hash matches the local build.
[Translation maintenance](localization.md).
Class names and related descriptions now use «Плут» and «Дуэлянт», independent
of portrait selection. The catalog checks and production build passed again.
The public release fixes mixed-language result news after weapon experience,
companion skill-gain notices and trainer messages that split multiword names.
The day badge retains its textured background and original border. Seven
localization checks cover these compositions, save/replay stability and asset
footprints; muted browser inspection confirmed the corrected result/trainer
screens and the source link in Credits.
The 1.0.1 copy pass removes added em dashes and restores original artwork
heading delimiters. Ballista frames now have transparent atlas gutters; all
279 frames keep identical pixels, dimensions and registration.

The title now offers **Classic** and **Expanded** before New Game. Existing
adventures and Flash imports stay Classic. Expanded has independent medals and
day records, uses the same eight labeled save slots, and keeps its edition on
Continue/import/Carry Over. Replacing an occupied slot requires confirmation.
The title remembers the last explicitly selected edition across reloads;
loading an adventure does not change that preference. Carry Over now uses the
original button states and explanatory text, with the original parchment
confirmation dialog, instead of a plain rectangle.

Expanded's first feature, **Smart Mode** (formerly Careful Consideration), is
now the default for starting/newly recruited companions and the hired-gun
preference in new Expanded adventures. Existing saved orders are preserved.
Allies prefer uncovered targets, protect the wall, then seek ranged attackers,
including chickens. Bosses and the last enemy can receive shared fire; surplus
allies help when every target is covered. Allies commit until their target dies,
disappears or shields; priorities and coordination apply on the next acquisition.
Changing crowd priorities no longer resets an ongoing aim. Switching aim adds distance / 25
simulation frames, rounded and capped at 12 (0..0.4 seconds), instead of the
former flat delay. Automatic damage still costs 15% at launch. The hero and
Classic defaults are unchanged. [Usage and limits](expanded-edition.md).
The edition selector uses original parchment/pin/radio artwork and menu fonts;
the order uses a short description with its damage cost.
The parchment now resizes without stretching its scroll emblem. New Game's
overwrite warning fits above Yes/No at normal and double size. Muted browser
checks covered both editions, cancellation preserving the save and confirmation
opening character creation.

Codex and Opus jointly implemented and reviewed this addition. The full suite
passed 636 tests; the original AI comparison retained all 74 snapshots. Muted
desktop checks exercised both editions, original-save preservation, overwrite
cancellation, invalid-revision rejection, Barrack selection, hired-gun Rest and
exact battle Continue. Touch Chromium exercised Expanded and WebKit Classic,
including rotation, shooting/reload, saves and the loot/results/town transition.
The broader suite also exposed and fixed a pre-existing manual Militia grenade
targeting call with a null actor; its affected class/control tests now pass.
The earlier immediate-preemption policy is superseded by target commitment.
Crowd checks cover uninterrupted aiming and firing, replacement priorities,
shield avoidance and deterministic Continue.
The Smart Mode followup covers distance-based acquisition, two-ally target
coordination and Continue, starting/recruit/hired-gun defaults, saved opt-outs
and updated Barrack/Inn labels. Prior fixed-delay skirmish numbers are historical;
they do not establish balance for the new coordination behavior.
The commitment/UI followup passed 60 focused checks and the 74 original AI
snapshots. A muted browser checked committed firing in a 24-enemy encounter,
exact battle Continue, both edition preferences across reloads, Classic save
loading with Expanded selected, and Carry Over cancellation/confirmation/retry.

Phone and tablet browsers have touch aiming, a second-finger reload, Fire at
will, hotbar selection, pause and save-file controls. The portrait menu can be
enlarged and panned without cropping combat. Muted Chromium and WebKit on
Windows exercised the phone-sized viewport, rotation, combat, save/Continue
and the loot-to-town transition. Layout checks also covered a 320-pixel phone,
a landscape cutout and a 768-pixel tablet. Physical iOS and Android hardware was unavailable.
The dinosaur atlas uses about 8 MiB decoded instead of 44 MiB. All 375 poses
were compared after restoring their original transparent margins.

The phone smoke check uses an isolated browser profile and the production
build served locally. Install Playwright Core under `.tools/browser-qa` and its
Chromium or WebKit browser, then run
`node --experimental-strip-types web/scripts/mobile-smoke.mjs chromium` or
substitute `webkit`. A third argument selects another game URL.

The opening logo leads into the animated title. The Sister uses the original
right-panned reload and gunfire cues on her title timeline. Clicking the logo skips it.
The character picker has the original foot shadows and isolated sprite frames.
Inventory and hotbar items use the original drop-shadow settings rounded to
raster pixels. All six town navigation buildings use their source placement
shadows. Sheep frames have transparent gutters around the original art.
Victory fireworks use the rocket and both spark symbols.

Enlarged and high-density displays can draw at 1240 × 760, with 620 × 380
game and input coordinates. Dynamic menu labels use the extracted fonts at
higher resolution. The six town panels and their action labels now use 2×
renders from the original SWF. Inventory icons retain their source bitmap pixels.
The mouse crosshair uses the original artwork, red outer glow, recoil scale and
firing opacity. The reticle follows pointer events in a layer clipped to the
battlefield. Browser zoom scales both together, including when the mouse stays
still. The ring signals recoil and range penalty.
Weapon accuracy determines how far pellets can scatter beyond it. Town
navigation and Help tabs retain their hover artwork when their panels change.
Low Quality uses the smaller drawing buffer. In a short headless Chrome sample
using the same 150-enemy battle save at 1× and 2×, the 95th-percentile frame
interval was 16.8 ms at both sizes. The README and Help credits
identify this as an unofficial, free, AI-assisted port of Noa’s game and the
Plus release. The [source repository](https://github.com/PMajesty/elona_shooter_plus_PLUS)
is public with the developer's permission, confirmed by the maintainer on 2026-11-05.

Both review passes are complete. Claude reproduced five discrepancies and
independently rechecked four fixes. Codex verified the fifth on public HTTPS by
recovering a v43 Day 198 Sister save and comparing the complete state after
Continue. V45 retains the day's growth notices and side income. The
[review log](fidelity-review.md) records the comparisons and limits.

The supported campaign/save range remains **Day1–1000**, an intentional browser
safety boundary rather than an original campaign ending. The source encounter
cycles repeat within this range. Wider numerical ranges and new content are
future work. Desktop Windows Chrome156 and Edge156 with JavaScript, WebGL and
ordinary browser storage are the measured browser scope.

## Connected original coverage

| Player flow | Implemented coverage |
| --- | --- |
| New Game | All eight classes, four medal unlocks, all22 animated appearances, original English class/skill hints, starting equipment/skills/companions, starting medal bonuses, Casual/Hardcore and all seven original Game MODs. |
| Combat | Manual/automatic reload, all weapon/projectile/consumable categories, Chain Gun wind-up/down and saved spin, skill growth/bonuses, hero manual/AI orders and F, companion AI/orders/focus/priorities, castle/Sister reactions and hitscan death, protection/repair, damage/health displays and pause/options. |
| Encounters | All19 enemy kinds, repeating40-level cycles, strength scaling/large variants, multi-boss days and original boss actions, ranged attack-frame flights/muzzle flashes, bird-dropped rats with separate body/shadow/fall state and airborne targeting. |
| Progression | Ordinary/boss loot, loot MODs, earned skill choices, weapon/living-weapon growth, results, taxes/upkeep/wages, honorary promotions/salaries, defeat and Carry Over with town snapshot/earnings/AP/medal restrictions. |
| Town/equipment | Shop buy/sell/refresh, recruit refresh/hiring/dismissal, permanent companions and Mission Hire henchman, equipment transfers, weapon upgrades/MOD mounting, Recycle Gun/Charge Item, both Castle pages and all functional upgrades, repair/Rest. |
| Town activities | Prayer, Dinner, Party, eggs, Taunt/training, all18 search families and talent/gift variants, visitor robbery and source English event narratives/artwork. Outcomes persist once; closing notices repeats no effects/RNG. |
| Medals/collection | All38 defined awards, both Museum pages/hints, action/class/day/perfect/Hardcore/Ragnarok/recycling awards, original medal bonuses and independent collection/day records across slots/New Game. Source bonus/text discrepancies remain preserved. |
| Saves/website | Eight slots, deletion confirmation, Continue, actual JSON import/export/download, native Flash SOL collection/adventure conversion, invalid/write-failure recovery, same-origin/cross-origin input isolation, static nested-folder hosting and public HTTPS embedding. Hardcore retains town-only saving. |
| Presentation | Original extracted artwork/fonts/audio/English/credits, original item/skill/medal/help/event panels, creation/Barracks idles, class/rampage auras and notices, boss bars/entrance reticle, original combat shake/hotbar/frame cues, moving clouds/dusk/night all three special-shot trails and the friendly Sister launch cue. Mute and fullscreen controls stay inside the responsive game window. |

Source review includes the MainTimeline public-function inventory, original
reachable menu/input paths and the earlier finite trait/content audits. Dormant
cardEvent/generateCard and optionAltStart debug branches have no reachable player
control in the preserved source and are not missing normal-play features. These
audits are evidence about connections, not formula/behavior equivalence proofs.

## Latest integrated fixes

Piercing bow arrows and crossbow bolts damage each enemy at most once per
projectile. Previously a target still overlapping the next collision check took
another hit and spent another penetration. Optional saved target IDs preserve
the correction across Continue. Older saves remain readable but cannot recover
unrecorded contacts from before this update. Other arrows and other enemies
remain eligible. The existing Flash callback trace is retained as evidence of
the original behavior, separate from the corrected gameplay regressions.

Manual Hunter/Rogue/Sheriff/Militia now apply Burst, Power Shot, One Shot and
Killer during ordinary firing; an optional advanced-class meter had incorrectly
gated them. V42 introduced optional saved manual Burst state. Tests use actual
Simulation.tick shots, damage/cooldown, AI transfer and deterministic continuation.

V43 saves dusk/night transition phase/step. Source waves3/1 start100 timer steps
(updateBG5926, onTick8374/8381). Rest resets lighting. Legacy late battles infer
settled dusk/night without RNG draws because their transition history is absent.
The clouds move0.2px/reference frame and preserve Continue position through saved
tick; their phase continues across Rest rather than restarting at the source's
initial position. The reticle switches to its night frame at the source boundary.
Background layers are separated from the HUD/castle; source text hidden below bg
is excluded from the overlay. Only background/clouds receive the source RGB tint.

Power Shot/One Shot/One Hit Kill carry the source special-hit type through each
pellet and render trail1/2/3 (symbols2408/2407/2406) with their original fade/life.
One Shot also uses the original flash; Disable flash shot suppresses it while
retaining the trail. These effects add no gameplay RNG draws/save fields. The Sister launch sound
now starts once per wave with one or multiple bombs, following onTick8364.

Creation uses ally4 stand poses5/6 for four reference frames each, with original
selection/hover transparency. Mute works on title/creation/gameplay and persists.
At 100% page zoom the preferred field is 1240 × 760 on a 1920 × 1080 desktop.
Larger monitors get a wider field. The available window or iframe limits both
dimensions. In isolated Chromium desktop tests the field measured 1240, 1600
and 2400 physical pixels wide at 100% on FHD, QHD and 4K virtual displays.
At 200% it measured 1607, 2194 and 3369 respectively. Browser chrome and OS
display scaling affect these sizes. Automated checks used windowed mode.

## Evidence retained

Recent browser evidence is under ignored .build/browser-qa/; deployment evidence
is under .build/deployment/. Historical detail remains in Git and
port-verification.json; do not reread trace archives for routine work.

- The full suite passed 599 checks before the final Sister save correction.
  The final build and all 32 affected campaign, town economy and Flash import
  checks passed, including battle and town round-trips on Days 198 and 998.
  The original SWF is retained as the comparison baseline.
  Independent original-runtime/source comparisons remain in the existing tests;
  seeded self-replay alone is not evidence of Flash equivalence.
- **Changed features:** backdrop-verification.json covers ordinary wave-driven
  lighting, moving clouds, paused/full-save equality and exact mid-transition
  Continue. backdrop-layer-verification.json/screenshots cover the corrected
  layer order. trail-verification.json and its retained partial pass cover all
  three visible trails, ending/fade, Pause and the flash-disable option. The
  remaining two checks reused the earlier passing cases after correcting a
  fixture's aim; no collision change was made for that test correction.
- **Public release flows:** https-release-verification.json covers the C0xS2vSY
  build before the final launch-audio-only addition: New Game,
  fire, delivered export, exact Continue, HTTPS iframe Continue and domain/root/
  www redirects. Ordinary Chrome DNS/network routing, TLS1.3/YE1, secure context;
  no host mappings, proxy override, TLS bypass, script errors or failed requests.
  The parent iframe HTML is a client fixture; game/assets are public responses.
  The final By__DLWU bundle additionally passes sister-cue-public-verification.json:
  ordinary trusted HTTPS, loaded audio, two spawned bombs and exactly one actual
  WebAudio start for the original0.705292s launch sample while output stays muted.
  No new save/input/network behavior changed in that final audio connection.
- **Current dense rendering check:** chrome-release-smoke-verification.json runs
 30.015s with150 initial enemies/six bosses/three companions, ending131 enemies.
  Simulation advances30s.1795 rAF gaps average16.713ms; one exceeds50ms, maximum
 66.7ms, none exceed100ms. One long task is67ms. Sampled JS heap rises from about
 19MiB to27.7MiB. Full-envelope final Continue matches; no script/request errors.
  This is a short changed-rendering check, not another long stability proof.
- **Completed hour:** chrome-stability-verification.json records3600.017s,
 3598.567s simulation,150 initial enemies/six bosses/three companions and131
  remaining enemies.215870 rAF gaps average16.677ms; four exceed50ms, three100ms,
  two250ms; maximum983.4ms, none exceed1s. Minute JS heap samples16.2–43.7MiB,
  ending29.6MiB versus30.3MiB initially. No script/request errors; exact final
  Continue. Castle HP/max HP alone was raised to10million. Retain the outlier and
  sampling limits; these figures do not prove zero leaks or measure total GPU/RAM.
- **Other ordinary flows:** existing focused evidence covers loot/skills/results/
  town, all class controls, town/search/equipment/medal interactions, Flash save
  conversion, save-error recovery, failed required/optional assets, context loss,
  static hosting, delivered iframe downloads and website input isolation. A real
  original-game/Ruffle Hunter Day1 SOL plus search comparison supplements the
  controlled source-schema import tests. User profiles/saves remain untouched.

## Accepted differences and support limits

1. Exact cosmetic/audio/incidental RNG matching is deferred by user direction.
   Raster/filter/subpixel differences, text glows, decorative particle positions,
   title animation subframes and precise sound mixing/sample scheduling differ.
   Camera shake and new trails remain separate from collision/game RNG.
2. Browser UI replaces Flash components: eight visible save choices instead of
   a five-row scrolling ComboBox; help/statistics use canvas/wheel scrolling.
   Pause/statistics panels shift to fit620×380. Hover delay/fade and long item
   detail layout remain approximate. Original English/artwork/fields are retained.
3. Normal mode permits browser combat/results checkpoints in addition to town;
   native Flash saved adventures in town. Continue starts paused and suppresses
   old announcements/spawn/entrance cues. Historical player SOL variants beyond
   the independent/controlled evidence remain unverified. Old Day2+ browser saves
   without earlier kill totals show a marked lifetime lower bound.
4. Intentional gameplay fixes include ground bow and bolt contacts between
   frames, the crossbow boundary at height 135, the No Armor order, Trouble's
   next-day enemy HP, Kongregate's wage discount and Ha-na-bi's extra fireworks.
   The [fidelity review](fidelity-review.md) records their Flash behavior and tests.
5. Native fullscreen is left for the user to operate. Automated expanded-layout
   checks cover sizing/input; native fullscreen was deliberately not entered.
   Physical phone performance, restrictive/sandboxed embeds, public CDN policies and IAB iframe
   download delivery remain outside the verified scope. External credit/Museum
   URLs are preserved; their ongoing availability is unverified.
6. One IAB ready-but-black screenshot observation remains undiagnosed and has no
   stock-browser reproduction. Font failure and WebGL loss have distinct tested
   recovery; neither proves that observation's cause. Arbitrary malformed assets,
   hanging requests and all possible browser/privacy policies are not exhaustively
   tested. No measured performance advantage over Flash or natural late-game
   difficulty equivalence is claimed.
7. Bodies use extracted alpha/source weak points; exact Flash vector/filter edges
   are unverified. The veteran late-game hitbox complaint remains unreproduced
   and deferred per user direction; earlier contour/projectile corrections are
   not its diagnosis. It does not justify an unbounded investigation here.

## Operating state

See [deployment](deployment.md), [process review](development-process-review.md)
and [goal](long-term-goal.md). The published desktop release meets the documented
completion boundary with the finite differences above. Both recurring watchers
are confirmed paused through the native automation tool; resume work for a concrete defect,
new feature or changed direction, not repeated unchanged verification.
