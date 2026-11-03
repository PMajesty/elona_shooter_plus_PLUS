# Flash fidelity review

The reference is `src/original/MainTimeline.as` and the original SWF. The
published desktop release at the start of this review is `df2b667`.

Claude in Cursor reviews the original player flows and reports discrepancies here.
Codex verifies each finding, makes the gameplay changes and records the result.
For each open finding, include the original function, browser path, and what a
player can do to observe the difference. Either reviewer can flag an uncertain
finding for reproduction. Keep save files and deployment access out of this log.

## Claude findings

### C1 — Hero Mode + F incorrectly leads moving targets with projectile weapons

**Status:** Fixed. The original hero slot now controls projectile lead, the
Gravity Gun offset and Militia grenade lead. A deterministic moving target at
x=250 stays at 250 under F before and after Continue. A persistent order still
leads the rocket and aims the Gravity Gun at x=50.
**Impact:** Rockets, launcher grenades, arrows/bolts and flame shots land ahead of
where the original hero would shoot while F is enabled. This changes hit rate,
not just the drawn cursor or incidental RNG.

- **Original:** `src/original/MainTimeline.as:7837–7867` uses the AI target's
  current integer x/y for F shots. `throwRocket:10925–10929` applies additional
  motion lead only when `shooterIndex != hero && shooterIndex != -1`.
  `throwGrenade:13394–13400` similarly excludes `param1 == hero`, regardless of F.
- **Port:** `web/src/simulation.ts:721–725` passes the AI target's speed to
  `createProjectile` whenever an AI state has a target, including actor 0 in
  Hero Mode + F. `web/src/projectiles.ts:47–48` then applies the extra lead.
  Companion/persistent non-Hero orders should retain their source lead.
- **Minimal repro:** Equip Rocket Launcher (ID22), sufficient Big Gun skill,
  remain in Hero Mode and enable F. Place a moving target at (250,230), speed3,
  and let the hero fire at it. With `random = () => 0.5` (zero net spread), target
  acquired and `aimCount=0`, one production `tick({})` creates a rocket with
  `targetX=326.5849435798517`; original `shoot` + `throwRocket` give `targetX=250`.
  The deterministic probe used `Simulation(42)`, generated ID22 in slot0,
  `traits[106]=20`, `toggleFireAtWill()`, and a spawned rat with 10000HP. No
  game files or saves were modified.
- **Suggested regression:** Compare Hero Mode + F against a persistent AI order
  and a companion for both rocket and non-rocket projectiles; preserve lead for
  the latter actors, and include Continue if targeting state is retained.

### C2 — Duelist projectile adrenaline uses the selected gun instead of the launched weapon

**Status:** Fixed. The hit reads the launch slot. A saved arrow in flight earns
4.342424242424242 adrenaline after switching to either a Pistol or a MOD and
continuing. The recorded companion combat comparison also passes.
**Impact:** Switching weapons while an arrow/bolt is in flight changes how much
Duelist adrenaline that shot earns. A slower selected gun can inflate charge;
a faster one reduces it. This affects the next shots' damage bonus.

- **Original:** `src/original/MainTimeline.as:1466–1469` (`procHit`) divides by
  `inventory.shootRate[weaponIndex]`, where `weaponIndex` belongs to the projectile.
  `throwGrenade:13409–13421` stores the launch weapon in the projectile's `w`.
- **Port:** `web/src/simulation.ts:787–803` (`processPellet`, line numbers before
  the in-progress report addition) correctly receives `weaponSlot` but calls
  `duelistHitFrenzy` with `this.actorWeapon(actorSlot)` (the currently selected
  weapon), not the inventory item indexed by `weaponSlot`.
- **Minimal repro:** `Simulation(42, {heroClass:'duelist', hitTest:()=>true})`;
  generate Long Bow ID24 in slot0 and Pistol ID1 in slot2 with `ItemFactory(() =>
  0.5)`. Set `random=()=>0.5`, isolate wave spawns, and spawn a stationary rat
  with 10000HP at (250,230). Select slot0, call `fireAt(250,230)` twice (draw,
  release), then select slot2 and tick until the first hit (24 ticks). Actual
  frenzy is **2.4333333333333336**, using Pistol shootRate100; source formula
  with the launched Bow shootRate55 gives **4.342424242424242**. No game files
  or persisted saves were modified by this probe.
- **Suggested regression:** Test projectile charge after switching and Continue,
  including a non-gun selected slot (which currently drops the charge entirely).

### C3 — Disarm retains fractional attack damage that Flash truncates

**Status:** Fixed. A Disarm hit reduces attack 3 to 2 before the boss multiplies
it. The pistol now takes 8 castle HP. Loading a disarmed enemy from an older
save with attack 2.5 produces the same 8 HP hit.
**Impact:** Disarmed enemies can deal more castle damage than in Flash. The
integer conversion at `damageCastle` is too late for boss attacks that multiply
attack by 3/4/5, and for Sandbag/Prayer absorption.

- **Original:** `.build/export/scripts/enemy.as:37` declares `attack:int`;
  `enemy.damage:617–620` assigns `attack * 100 / (100 + disarmed)` back to that
  integer. Disarm1 is20%, so an attack3 enemy becomes attack2, not2.5. The boss
  multiplies that already-truncated attack for its pistol/special attacks.
- **Port:** `web/src/combat-stats.ts:121–123` stores the untruncated division in
  `weaponHitEffects().attack`, then `simulation.ts` copies it to `enemy.attack`.
  `tickBossAction` multiplies it before the later castle int conversion.
- **Minimal repro:** Sniper with Disarm1 (trait130=1), a usable Pistol and
  `hitTest:()=>true`, `random=()=>0.5`; spawn a boss at(250,230), attack3,
  10000HP, `bossAction=1`, `bossWeapon=1`, `bossIdle=0`, `bossFireNum=1`.
  Isolate wave spawns, `fireAt(250,230)`, then `tick({})`. Port retains attack2.5
  and emits `castle-hit.amount=10`; Flash attack:int becomes2 and the pistol
  attack must deal8 before any absorption (none in the probe).
- **Suggested regression:** Cover fractional Disarm division before multiplied
  boss attacks and fractional absorption; keep the source minimum-one damage.

### C4 — Mission Hire refreshes party bonuses too early during settlement

**Status:** Fixed. The contract ends at settlement, but the battle party's
cached skills still determine AP and the next shop's Engineer bonus. The test
resumes at skill choice and at results with no hire, an ordinary hire and a
hire contributing Active. All seven Mission Hire cases pass.
**Impact:** Hiring a temporary henchman changes when newly learned party skills
start working. Active learned after this battle can grant extra AP immediately,
unlike both Flash and the browser's own non-hired flow. The refresh also removes
the departing henchman's cached contribution before the source does.

- **Original:** `src/original/MainTimeline.as:3411–3452` (`renewResult`) hides
  the henchman at3433–3434, but does **not** call `initPartySkill` before
  `townEvent()`. `townEvent:6425–6437` rolls AP with the old `PARTY.ACTIVE`.
  The next town refreshes skills during `generateMission`/frame71. Hero skill
  selection increments the trait without refreshing PARTY.
- **Port:** `web/src/simulation.ts:1686–1695` (`prepareResult`) calls
  `refreshPartySkills()` when removing the henchman, before rolling extra AP.
  Without Mission Hire, the port correctly keeps the old cache here.
- **Minimal repro:** Start Rogue `Simulation(42)`, finish the first day into
  town, contract Mission Hire and Rest. Give the hero one earned skill point
  (controlled fixture), finish the next day through loot, and make Active123 an
  available choice. With `random=()=>0.9`, call `chooseSkill(123)`. Before the
  choice cached Active is0; the hired result refreshes it to1 and grants **5AP**.
  Original cached Active0 gives `int(.9*.9*(0+1))=0`, hence **4AP**. Repeating
  without the contract correctly gives4AP in the current browser code.
- **Suggested regression:** Newly learned hero/companion Active with and without
  Mission Hire, a departing henchman's party contribution, and Continue from the
  skill screen. Preserve existing original wage/reward timing while fixing this.

### C5 — Sister upgrade makes valid later-campaign saves unloadable

**Status:** Fixed. The loader bounds the schedule by the saved mission's
validated wave count plus its index-zero slot. Battle and town round-trips pass
on Days 198 and 998 with 11 and 17 entries, followed by Rest and another
round-trip. An extra entry beyond the mission's capacity is still rejected.
**Impact:** With at least one Sister owned, Day198 battle and town saves cannot
be restored (`Invalid town economy.`). This is inside the documented Day1–1000
supported range and can strand a normal or Hardcore campaign after closing it.

- **Original:** `src/original/MainTimeline.as:12147,12192–12195` computes fixed
  level `level%40 + int(level/40)*3` and boss-day wave count
  `6 + int(fixedLevel/10)`. `updateAlly:1552–1564` builds `sisterList` through
  `mission.wave` inclusively and assigns Sisters to indices1…wave. On calendar
  Day198, mission level197 gives fixedLv49 and **10 waves**, hence11 entries.
- **Port:** `web/src/simulation.ts:272–273` correctly allocates
  `Array(state.waves.length + 1)` when Sisters are owned, but
  `web/src/town-economy.ts:17–19` (`validTownEconomy`) rejects arrays longer
  than10. The same schedule remains in the town snapshot after settlement.
- **Minimal repro:** `Simulation(42)`; complete the first day through
  `finishDay`, `finishLoot`/`chooseSkill`, `enterTown`, provide fixture gold and
  call `buyCastleUpgrade('sister')` once. Repeat `startNextDay()` and controlled
  settlement through Day198. At every day attempt
  `Simulation.fromSave(sim.toSave())`. First failure is Day198 battle:
  `waves.length=10`, `economy.sisterWaves.length=11`. Settling that day and
  restoring its town save fails with the same error. The probe used actual
  mission generation and Rest transitions, not a manually enlarged array.
- **Suggested regression:** Sister-owned campaign at Day198 and a later larger
  boss-day schedule within Day1000; battle/town Continue and following Rest.
  Validate against campaign-derived schedule bounds rather than the first-cycle
  ten-entry assumption; do not change original wave counts to satisfy validation.

## Claude verification checkpoint

Reviewed Codex's fixes in `1eaba02` against the original conditions and the
reported reproductions. Independently reran the three targeted regression cases:
**3/3 pass**, covering Hero Mode/F versus persistent orders with Continue,
Duelist launch-weapon charge after selection/Continue, and Disarm integer attack
including older saves. C1–C3 are closed for the reported scenarios.

An earlier combined run passed39/40 with the new Duelist replay fixture rejected
as `Invalid counters`; after the fixture update its whole file passed6/6 and the
final targeted run passed3/3. The unchanged existing combat/hero/projectile/F
suite had passed30/30 before these fixes. This pass used source inspection and
headless simulation only: Claude did not run a new browser/SWF session, modify
game files, deploy, or touch user saves. These results establish the three fixes,
not complete game equivalence or an exhaustive late-game balance review.

## Claude outside-combat pass — 2026-11-03

**Scope completed:** Bounded source/control-flow inspection of ordinary/boss
loot and MOD confirmation; hero choices and automatic companion growth;
settlement reward/perfect bonus/wages/upkeep/Museum/Active timing; shop buying,
selling, tokens, stock refresh and weapon upgrades; companion hiring/dismissal,
equipment and orders/focus; Prayer, Dinner, Party, eggs, Taunt, special training,
search outcomes, title claims, repair and Rest. Compared the corresponding
MainTimeline branches with the production simulation and view callbacks. This
was not a pixel-by-pixel UI or exhaustive formula/RNG audit.

**Findings:** C4 (premature hired-party cache refresh) and C5 (Sister schedule
save rejection starting Day198). Codex fixed C4 in `bd58b16`; Claude inspected
the one-line correction and independently ran **7/7 Mission Hire checks**, with
skill/result Continue and departing-party Active coverage. C4 is closed for the
reported scenarios. C5 was open when Claude finished the pass. Codex subsequently
fixed it in `8caf3d9` and verified recovery with the released game.

**Validation:** The focused equipment-services, loot-mod, party, titles,
town-economy, town-search and mission-hire files pass **44/44 tests** on the
checkout after C4. Those existing tests did not cover C5: a separate controlled
Day1–198 progression probe reproduced the actual save rejection in battle and
town. Controlled day completion deliberately skipped combat difficulty; the
probe does not claim a natural198-day playthrough. Test helpers regenerate
ignored QA fixtures; no user saves or game source were edited by Claude.

No new browser or original-SWF runtime session was run in this pass. Browser
verification/release remains Codex's responsibility. No other confirmed material
difference was established in the inspected paths; that is not a whole-port
parity certification. Review game files remain read-only for Claude.

## Public release verification

The published build contains C1–C5. In isolated muted Chrome, a v43 Day 198
Sister save imported on the public domain and retained its complete simulation
state. Export, page reload and Continue produced identical v45 save data.
The same public build displayed the original Community Compilation details,
preserved the selected MOD and started battle.

## Codex findings

- **Long Bow arrows can skip a moving sheep between hit checks.** In a Day 1
  Rogue simulation with seed 12, one ordinary sheep, no further spawns and no
  player fire, the companion's arrow 3 missed at ticks 153 and 154. Its two hit
  points were (129.7, 269) and (120, 281.65). Between them the arc entered the
  moving sheep's body shape near (125.76, 274.07), using either animation pose
  and excluding the shadow. Both ticks were inside the ground-hit window.
  Across seeds 1–24 this accounted for one of 29 misses in 74 resolved arrows.
  The original SWF's `bullet_arrow2.onEnterFrame_bullet` likewise tests a
  single point per eligible update. A correction could sweep the arc against
  target motion within that window while preserving spread and high-arc flight.

- **Rogue pistol at browser zoom.** Flash moves `customCursor` to the mouse
  in `MouseMove` and scales it by `0.3 + accuracyFix` in `onTick`. In the
  startup-fixed SWF running in Ruffle, the resting pistol ring and visible glow
  measured about 18 × 19 pixels on the 620 × 380 stage. Earlier port checks
  resized the canvas without changing the browser's tab zoom. Opus implemented
  the pointer-driven layer and Codex integrated it with display and aim resizing.
  At true 100% and 200% tab zoom the resting ring measured about 19 × 19 stage
  pixels, including glow. The comparison uses a five-level RGB difference
  threshold, so the faint outer edge can vary by a pixel. At both zoom levels
  one shot spent one round and the exported aim was within one stage pixel of
  the requested point.

- **Community Compilation details.** The Game MODs menu now opens the original
  explanation of sale-day shop refreshes and Active AP. It uses the Flash
  button, panel and checkbox art. The link accepts a click anywhere inside its
  bounds. Muted Chrome opened and closed it with the MOD enabled, confirmed
  that clicking a covered row had no effect and proceeded into battle.
- **Day results and Hard Badge.** The settlement now displays the original
  growth, reward, museum, salary, MOD sale and extra AP notices. Insurance and
  Sister earnings appear under Other. The Hard Badge reduces daily upkeep by
  40 GP, including on its free starting slot. Muted Chrome restored a result,
  scrolled through the weapon gains to the museum income and proceeded to town.
  Older saves lack the history for growth and side income earned before import.
- **Battle input.** Flash `mouseDownFunc` accepts the visible stage outside
  controls. The browser discarded the top 30 pixels and bottom 35 pixels. The
  correction passes a muted New Game check in which both shots spend ammunition
  and clicking Menu pauses with the same ammunition count.
- **Weapon selection.** Flash `refreshPlayer` resets Burst and the Militia
  grenade timer on gun selection. A held burst and nearly ready grenade used
  to survive manual reselection. A saved and restored run now resets both.
- **Sniper.** Flash `onTick` drains idle charge during ordinary reloads and
  caps stored adrenaline when the hero bar fills. Both behaviors now apply in
  manual play. The tests cover a full meter and the first reload timer tick.
- **First-day guidance.** The first empty magazine, the two grenade tips and
  the first town's repair reminder now use the original info popup. A muted
  browser run emptied the magazine, observed the reload hint, exported v44,
  restored it and loaded a shell with Space. Old browser saves can see the
  reload tip once. Flash imports keep the original `game.hintReload` flag.
- **Reading a hit.** The original `enemy.damage` signals a poor anti-armor or
  anti-air rating below 60 with a spark and sound. Muted Chrome now shows the
  spark at 59 and the original mechanical hit at 60 on the same Tank. Ground
  misses, blood and critical hit artwork also appear through normal firing.
  The 22 recorded Flash shooting cases check impact eligibility from their
  original pellet coordinates and shape contacts.
