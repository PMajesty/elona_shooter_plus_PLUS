# Browser port status

Updated 2026-11-03. **Desktop-browser release, save v45.**
[Play online](https://pastalapizza.site/elona/) or [locally](http://127.0.0.1:5175/elona/).
The production bundle is `index-CxrTg8bC.js` from `8caf3d9`. The documented
desktop completion boundary was reached in v43. The subsequent joint review
found and corrected differences in combat and end-of-day settlement.

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
| Presentation | Original extracted artwork/fonts/audio/English/credits, original item/skill/medal/help/event panels, creation/Barracks idles, class/rampage auras and notices, boss bars/entrance reticle, original combat shake/hotbar/frame cues, moving clouds/dusk/night all three special-shot trails and the friendly Sister launch cue. Linked mute/fullscreen icons and crisp integer scaling are integrated. |

Source review includes the MainTimeline public-function inventory, original
reachable menu/input paths and the earlier finite trait/content audits. Dormant
cardEvent/generateCard and optionAltStart debug branches have no reachable player
control in the preserved source and are not missing normal-play features. These
audits are evidence about connections, not formula/behavior equivalence proofs.

## Latest integrated fixes

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
Large displays use integer scaling/letterboxing;1080p gives1240×760 at2×. Smaller
windows shrink proportionally. The native buffer and input remain620×380.
Native fullscreen was never activated during automated testing.

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
   Raster/filter/subpixel differences, text glows, title-intro shake/impact cues,
   precise sound mixing/sample scheduling, fireworks and some transient phases
   differ. Camera shake and new trails remain separate from collision/game RNG.
2. Browser UI replaces Flash components: eight visible save choices instead of
   a five-row scrolling ComboBox; help/statistics use canvas/wheel scrolling.
   Pause/statistics panels shift to fit620×380. Hover delay/fade and long item
   detail layout remain approximate. Original English/artwork/fields are retained.
3. Normal mode permits browser combat/results checkpoints in addition to town;
   native Flash saved adventures in town. Continue starts paused and suppresses
   old announcements/spawn/entrance cues. Historical player SOL variants beyond
   the independent/controlled evidence remain unverified. Old Day2+ browser saves
   without earlier kill totals show a marked lifetime lower bound.
4. The source's ineffective Trouble HP expression, medal93 source-count text,
   Ragnarok/Kongregate wage discrepancy and Ha-na-bi/firework discrepancy are
   preserved. Do not silently rebalance them to match their descriptions.
5. Native fullscreen is left for the user to operate. Automated expanded-layout
   checks cover sizing/input; native fullscreen was deliberately not entered.
   Mobile/touch, restrictive/sandboxed embeds, public CDN policies and IAB iframe
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
