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

## Codex findings

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
