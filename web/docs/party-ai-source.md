# Recruited companion combat: original-source boundary

This audit reads `src/original/MainTimeline.as` and the unmodified embedded
`enemy`/`ally1` classes exported under `.build/export/scripts/`. The source audit
is supplemented by the accepted, explicitly bounded AI comparison below. The original
30 Hz frame and 20 Hz timer callbacks are useful comparison boundaries; the
user does not require those internal rates if observable behavior is retained.
Hiring, equipment transactions, persistence and wages have a separate owner.

## Actors and battle initialization

`maxAlly=5` and `maxParty=4` (Main:9169). Slots0–3 are the hero and permanent
companions; slot4 is the temporary henchman; recruiter slot5 is outside battle.
`weapon(i)` returns selected player inventory `ci` for slot0, otherwise40+i
(Main:5401). Hiring transfers the recruit's one actual weapon; its extra Militia
generation records are not extra equipped guns. All nine recruit class branches
can therefore reach combat, including Guardian.

Battle initialization refreshes party skills before `updateAlly`, sets `ci=20`,
then installs root frame/timer listeners (Main:1581–1619). `updateAlly`
(6776–6852) creates the same **ally1/symbol838** actor for every slot, even an
absent slot; absent actors are hidden. `ally2/3/4` are character-menu clips,
not independent combat AI. Actor positions are:

| Slot | Role | x | y | Initial AI cursor x |
|---|---|---:|---:|---:|
|0|Hero|510|245|Manual mouse cursor|
|1|Companion|512|215|482|
|2|Companion|514|275|484|
|3|Companion|508|185|486|
|4|Temporary henchman|518|305|488|

The y array is Main:9032. Initialization clears target/onMark/shooting/burst,
idleCount, frenzy, rampage, shot timer and accuracyFix; refreshes the weapon
presentation/calculations; sets AI aimCount100; and refills its equipped gun and
clears reloadTime. The player refills non-use inventory, preserving consumable
quantities. `refreshPlayer` also resets chain state and the Militia countdown
(Main:4617–4678). Orders choose `aiNormal` by default, overridden by Air4,
Armor5 or FireAtWill6. Slot0 becomes AI too when its order is not Hero−1.

`refreshPlayer` computes:

```
rangeFix = 1800 + CALC.HUNTER(i) * 20
aimTime = max(2, (18 - sqrt(BASE_AIMING)*1.4 - BASE_AIMING*.05)
                    * 100 / (100 + PARTY.LEADERSHIP))
workRate = min(.3, .03 + sqrt(BASE_TEAMWORK)*.025)
accuracyDiv = weapon.baseAccuracy
              * (100 + ACCURACY + NOBLE + COOL - DR_HOLLIDAY) / 100
```

The manual hero omits COOL from accuracyDiv and instead recovers recoil in the
timer callback (8410–8446). Companion spread does **not** use its accumulated
accuracyFix. All CALC functions return0 for an unowned trait (5919–5925).
Party passives use the highest calculated value, not a sum; Guardian is the
exception. `initPartySkill` sums Guardian and records **every existing actor**
in the retaliation-credit list (7761–7784,8479–8511).

## Target selection and orders

Targets are shared 3×3 caches: type0 ordinary/type1 air/type2 armor, crossed
with x bands `<150`, `[150,300)`, `>=300`. Each cache starts `[undefined,1000]`.
An untagged living non-bomb enemy registers only if its x is smaller than the
cached x; this is not a nearest-to-wall search. Registration is in the enemy
frame callback **before movement** (enemy:983–1005). A positive tag decrements
instead of registering. Selection consumes that cache entry and sets tag60.
`enemy.kill` clears every cache (enemy:532–549); the other actors' held target
references are cleared when their own AI observes death. No per-frame global
cache clear was found. `enemy.init` does not explicitly reset tag, so pooled
reuse/history needs a direct probe before choosing an intentional correction.

Weapon range preference lists are `[2,1,0]`, `[1,2,0]`, `[0,1,2]` for range
classes0/1/2 (Main:9012–9015). Source order behavior is:

| Order | Actual selection function |
|---|---|
|Normal0|For each of the first two preferred bands: ordinary, armor, air.|
|NoAir1|Normal function; returns undefined immediately after an empty ordinary/armor check in the first band, rather than trying a second band.|
|NoArmor2|Flash falls through to Normal. The port implements the displayed armor exclusion, including Boss/Defend and automatic grenade targeting.|
|Neither3|Returns undefined immediately after an empty ordinary check in the first band.|
|Air4|Air only, all three bands in weapon preference order.|
|Armor5|Armor only, all three preferred bands.|
|FireAtWill6|Type priority ordinary, air, armor; for each type checks all three preferred bands.|

Anchors: `aiNormal`13003–13042, `aiAir`7600–7616, `aiArmor`11702–11718,
`aiFireAtWill`12561–12589; UI labels/hints1697–1727,10194–10220. These apparent
order defects are source observations, not yet original-runtime reproductions.

At each root frame actors run in ascending slot order (2333–2511). An AI with
no target always draws one shared U and searches only if `U < workRate`.
Successful acquisition computes aimCount and **continues**, skipping common
rampage/frenzy/cooldown/idle processing that frame. If acquisition fails, it may
reload: manual guns below ammoMax/1.5, magazine guns below ammoMax/3. This
idle-reload check only happens after the work-rate roll succeeds. An idle cursor
eases toward `(cursorX[range],playerY[i])` with divisor aimTime×3.

An existing target dying also clears/retargets and continues. Otherwise the
cursor follows the target with x lead `target.speed*aimTime`; falling-rat y has
a separate `rat.y` offset. Positive aimCount decrements; shooting becomes true
only on a later frame when the count is already zero (2400–2443).

`startingAim` (2514–2530) uses distance from `500-range*200`. Below100 the
multiplier is1; otherwise it is distance/rangeFix+1. With optWall and target
x>400 it multiplies by `3-x/200`, then returns max(int(aimTime*multiplier),2).
Boss priority checks occur **before assigning global w for this actor**:
`startingAim(index,w)` at2357 uses the previous shared weapon reference. It
also continues for that frame. This cross-actor dependency needs an explicit
two-weapon probe; silently substituting the actor's weapon changes the source.

`alert` assigns a wall threat to the first existing unmarked optWall actor,
excluding a manually controlled hero; it sets both actor/enemy marks and the
aim countdown (3814–3839). `searchNextAlert` uses a separate nextAlert object
when a marked target dies (10945–10960). Boss priority applies only while the
actor is unmarked; it is not unconditional continuous boss focus.

## Shooting, reload and display timing

After the AI-specific branch, the same frame decrements positive rampage,
decays Duelist frenzy by.04 (manual hero.12), subtracts weapon.shootRate from
shootTimer and invokes `shoot` when shooting is true. Otherwise idleCount
increases by.033 and chain idle behavior runs (2446–2508). Early continues
therefore affect class bonuses and cooldown as well as target timing.

The actual AI `shoot` path (7837–7895) checks its own weapon requirement,
dead/left-of−10 target and weapon.num. An inadequate skill simply returns;
there is no player warning or target reset. It does not duplicate the manual
hero's gun-type check. A non-autoReload reload blocks shots; an empty gun
clears shooting/burst and starts reload. Otherwise:

```
spread = 13 * (100 + accuracyDec² * 500) / accuracyDiv
FireAtWill spread *= (100 + 50*100/(100 + HUNTER*2)) / 100
aimX = int(target.x); aimY = int(target.y)
shootTimer = 1000 + AIMED_SHOT_level * 70
nonautomatic AI: shootTimer += int(U * (shootRate / 1.5 / workRate))
```

Thus the visible aim cursor and its lead **are not** the hitscan coordinates.
Ordinary AI shots center on the target registration point, not its weakpoint.
Random spread may still hit a weakpoint. Unlike a manually clicked semi-auto
gun, AI shooting stays enabled after a shot. Each shell uses four shared
spread draws; every contour contact consumes SENSE then ONE_HIT_KILL draws,
including unowned traits/corpse contacts (8060–8129). Projectile procHit has a
different one-SENSE-roll path (1428–1479); preserve shooter identity through
launch and impact. Companion projectile launch also leads target x in
throwRocket10926–10928/throwGrenade13394–13399; gravity uses the separate
AI `hitX -= 200` rule at8023–8027.

Attack damage is applied by `shoot`/projectile callbacks, not an ally animation
frame script. The ally1 frame scripts change face poses, stop at weapon idle
frames24/84/109/134/159/184, hold a drawn bow at92, and loop reload42→30.
`getWeaponInfo`9938–10025 supplies attack/idle/draw frames:

| Equipped gun IDs | Attack | Idle | Draw |
|---|---:|---:|---:|
|1,2,14,15,18 and fallback|10|24|10|
|3,4,19,20|95|109|95|
|5,13,17,36|120|134|120|
|16|145|159|145|
|21,22|170|184|184|
|23,24,25,26,27,40|70|84|86|

`shoot` restarts animation only when currentFrame>attackFrame+3 (7961–7964).
Bow24/25 AI draws on one eligible shot call, retains its normal cooldown, then
releases on the next eligible call (7924–7942); it does not require mouse-up.
Chain gun16 retains sound-position-dependent spin-up (7896–7922), which needs
a bounded sound-clock seam if tested synchronously.

Timer callback order is ascending actor slots, autoReload check, reloading,
then Militia grenade (8258–8305). AutoReload begins when timer<=−3*shootRate;
the new reload advances in that same timer callback. Reload decrements idle
bonus by.15 only without Auto Reload. Per-shell/full-magazine timing and sound
are the same original reload methods already used by the hero (4566–4595,
7326–7370). Target acquisition does not cancel a companion's manual reload:
the companion waits through it. Per-shell completion loops reload until full.

## All recruit classes and credited effects

Recruit setup is Main:2075–2225. These are the actual starting combat paths;
later NPC skill allocation can add further shared or weapon-specific effects.

| Class ID | Actual starting weapon | Reachable class behavior |
|---|---|---|
|Hunter1|Modified crossbow23|Range/aim multiplier, target-leading bolt and Scavenger party passive.|
|Sniper2|Rifle4|IdleCount damage growth; KILLER cooldown after critical kill.|
|Rogue3|Pistol1|Critical kill guarantees gold, larger gold and conditional Luck doubling.|
|Militia4|Rifle4|Independent timer-driven free grenade; generated extra guns47/48 are not both equipped.|
|Ranger5|Machinegun36|Kill XP fills frenzy; at1000 resets it and starts rampage for every existing actor.|
|Sheriff6|Shotgun3|Own knockback, shells and Fury rampage duration.|
|Duelist7|Ammo-enchanted pistol1|Per-contact frenzy damage with class cap; AI decay.04 per non-skipped frame.|
|Noble8|Accuracy-enchanted PDW2|Own damage/accuracy bonuses and40% kill-XP bonus.|
|Guardian9|Default bow24|Actual bow draw/release plus party Defender2 and retaliation.|

Class formulas are registered at9380–9418. CALC.GUARDIAN is summed, then a
castle hit chooses credit uniformly from **all existing** actors, not only
Guardians; retaliation happens before Insurance/Defender and can itself kill
and consume additional RNG (10871–10883). Last Hope chooses a random slot0–4,
then checks existence and that actor's trait (10899–10905).

Militia counter is max(100,325−classLevel*4), reset by refreshPlayer and after
a throw (6695–6703). Each timer decrements it; below0 it uses FireAtWill with
range2. No candidate, or candidate right of the actor, adds10. A valid throw
draws one lead roll, uses damage25+2*classLevel, weaponIndex−1 and type0, then
resets the counter (8283–8301). The grenade helper may add another lead based
on the actor's currently held target, distinct from the chosen grenade target.

Damage/kill credit is per shooter (enemy:550–839): personal kill and the current
weapon-XP bucket increment; weapon effects/living progress use the launch
weapon. NPCs below day/1.5 get an extra weapon XP and double kill XP, then all
NPCs multiply XP by1.5. Level-gap reduction and Noble×1.4 follow, with integer
coercion at each assignment because enemy.exp is int. Trainer applies through
the source `_root.pc` comparison; no declared `pc` was found in MainTimeline,
so an original runtime probe must distinguish it from `_pc` before cleanup.
No XP sharing occurs on ordinary kills. Gold eventually credits player0 and
cumulative earnings, while player.earn[shooter] records the attribution.

Ranger frenzy is based on enemy.exp **before** mission/companion XP multipliers;
team rampage duration is int(12*30*(100+RANGER)/100) then each recipient's Fury
(enemy:734–737, Main:2796–2812,12299–12318). Seven personal critical kills also
trigger a personal rampage. Only player0 critical kills increment the mission
critical medal counter and select the good-shot sound (enemy:801–813).

After battle every existing slot gets250XP, then weapon promotion and automatic
NPC skill allocation run in slot order before loot (12484–12531). NPC weapon
thresholds are half the hero's, strict `>` with at most one promotion per bucket
(6907–6941). Each level-up consumes two growth draws. Recruits can already have
unspent SP when hired. `gainTrait`11517–11618 consumes ten weighted candidates,
conditional unlimited-skill draws, focus randomness and nextTrait; its
currentWeight is not reset at every iteration. Noble/Rogue/Ranger may force
ACTIVE. Cached PARTY values are not recomputed inside this reward loop.
Replacing this with the Sheriff's choice UI would change behavior and RNG.

## State and focused original probes

Persistent integration needs each actor's existing identity/traits/weapon,
personal XP/weapon-XP/kill/earn, shot timer/rampage/bow state, plus target identity,
onMark/shooting, aimCount/cursor position, cached aim/work/range values,
idleCount/frenzy/burst/Militia counter/chain state. Shared target caches, enemy
tag/onMark, boss target and nextAlert are behavior, not disposable render data.
The source global weapon reference is a separate ordering risk. Use one shared
RNG across actors, enemies, visual shake and rewards; do not create per-ally RNGs.

Recommended first original diagnostic, preserving method bodies:

1. Nine actual generated recruit classes transferred into slot1; run original
   updateAlly/refreshPlayer. Capture positions, traits, weapon, aim/work/spread,
   initial frame/countdowns and RNG. Add one two-actor mixed-range case for
   stale-w boss acquisition. Preserve the raw result before any proposed fix.
2. Original selectors on explicit populated caches: each order, exact range
   bands149.95/150/299.95/300, two actors consuming the same cache, tag59→0 and
   a death clearing all caches. Include NoArmor and first-band early returns.
3. Root frame method with controlled acquisition rolls below/equal workRate;
   acquired, aiming, target-dead and boss-mark branches. Record shot timer,
   rampage/frenzy and cursor twips to detect skipped common updates. A short
   native listener-order probe is separate from the manual schedule.
4. Actual shoot with Rifle4, Shotgun3, pistol1 and bow24: requirement failure,
   nonautomatic extra roll, target-centred aim versus displaced cursor, first
   bow draw/next-call release, empty reload and no-target top-up. Feed the same
   explicit original timer/frame schedule to the port, not guessed elapsed time.
5. Direct original class boundaries: Militia counter expiry/failed target,
   Ranger threshold/team rampage, Duelist contact/decay, Sniper idle damage,
   Guardian credit among hero+companion, and a companion lethal hit with
   catch-up XP. Include selected-versus-launched weapon XP attribution.
6. One whole battle→reward→town with the hired actor retained, recorded inputs
   and complete save replay, after the method comparisons pass. This validates
   integration separately; it cannot substitute for independent source checks.

The diagnostic should emit stable actor/target IDs, ordered callback events and
draw count/state. Manual callbacks prove those declared boundaries, not native
whole-battle scheduling, audio playback, every possible hire/equipment history,
or campaign balance. Party acquisition is meaningful only when the actor can
fight, receive its own rewards and survive save/Continue through the next town.

## Captured AI boundary

The separate `tools/build_party_ai_oracle.py` diagnostic preserves the original
AI method bodies and all non-code SWF resources. Two Ruffle runs produced the
same 75 snapshots. `web/tests/fixtures/original-party-ai-trace.json` retains the
accepted observations; `web/tests/party-ai-reference.test.ts` compares the new
AI functions and the production `Simulation.fireActorAt` boundary. 74 snapshots match Flash. The remaining snapshot requires flying target 103
and preserves armored target 101 for other allies under NoArmor. Three focused tests also verify that the comparison rejects
same-frame cooldown advancement after target acquisition, omission of the
shared work-roll draw, and restoring the original NoArmor bug.

The fixture covers nine real recruit initialization profiles, all seven target
orders, target-cache consumption, cursor twips, acquisition/dead-target/boss
early returns, the stale global weapon range on boss acquisition, manual and
automatic reload initiation, Militia's free grenade, and two eligible original
shoot calls for each class's initial weapon. It records the actual projectile
child after the original throw helper applies ally lead, including target
coordinates and speed. The first comparison caught a missing persisted bow
chain state: Guardian's draw sets `chainMode=1`, and release resets it to zero.
The production correction leaves these fields consistent with `bowDrawing`.

The instrumented SWF SHA-256 is
`ada5d43c2e86fee24d31bad842ea8c3a5328bc804a93ad9aad53adec6bba8195`.
The preceding capture and SWF are preserved in ignored
`.build/oracle/party-ai-before-launch-observer-*`; the only subsequent change
added recoil and actual post-launch observations. The first comparison failure
is retained in `.build/oracle/party-ai-comparison-before.json`.

Controller cases record shoot callbacks without executing weapon damage.
Actual-shoot cases use an empty collision world. Generated traits/items are
captured inputs; their generation has separate original fixtures. Actor
animation frame is observed but not compared here. This evidence establishes
the declared method boundaries, not native listener scheduling, companion
damage/kill credit, Guardian retaliation, Ranger team effects, or an integrated
party campaign; those remain separate checks.

## Chain Gun timing: remaining compatibility decision

`shoot` (Main:7896–7922) uses both `chainPos` and a real audio channel's
position. Mode2 becomes mode3 when the previous counter exceeds82 **or**
`channel.position+400 >= 2462`; that call still returns without firing. The
next eligible call fires and sets the counter to82. With item16's original
shootRate1000 and uninterrupted30Hz calls, attempt43 changes mode and attempt44
fires, about1.433seconds after the first attempt. This is earlier than the
audio threshold2062ms, so a counter-only fallback resembles this one common
case but does not reproduce every interruption.

On idle, the source reverses up/down audio with a seek of
`2462-currentChannelPosition`; cooling from mode3 starts at zero. Resuming from
mode1 reverses again (Main:2480–2506,7901–7912). NPC cooling stops at64 because
the counter decreases by2 only while `abs(chainPos-62)>2`; a manually controlled
hero continues to zero. These are source behaviors, not new optimizations.

The preserved SWF metadata identifies soundChain1/2 as DefineSound72/71,
44100Hz,110592samples each, with zero MP3 seek samples. Decoding the extracted
files with the installed FFmpeg confirms110592stereo frames, or
2507.755102ms. The hard-coded2462ms reversal constant is therefore distinct
from the asset's decoded duration and should not be replaced by it. The loop
soundChain3/DefineSound70 declares1729samples at22050Hz and1669MP3 seek samples;
its extracted MP3 includes padding, so its whole-file duration is not a firing
threshold.

A deterministic compatibility model can persist the virtual up/down channel
position in milliseconds alongside existing mode/counter state, advance it
from logical elapsed time, and reproduce the reversal and2062ms check. Audible
playback should follow that state rather than decide whether bullets fire.
The current counter fallback lacks this virtual audio position. The remaining
pause choice must be explicit: source `stopSound` (Main:5439–5453), called by
the paused root frame, stops mode3 only, leaving up/down channels running.
Freezing the virtual clock during pause would deliberately remove that source
pause acceleration. Negative/out-of-range reversed seeks and audio decoding
details have not yet been probed in the original runtime; do not claim exact
audio compatibility from this static audit.
