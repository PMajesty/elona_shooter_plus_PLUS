# Classic and Expanded

Implemented 2026-11-04, jointly designed and coded by Codex and Claude Opus.
These are fan additions, separate from the original developers' game.

## Player behavior

- The title's **New Game Edition** selector defaults to Classic. Expanded opts
  into new features; the original Game MODs remain independent choices.
- An adventure keeps its edition throughout its life. Continue/import use the
  saved edition regardless of the selector. There is no in-place conversion.
- Both editions share the eight labeled adventure slots, with confirmation
  before overwriting. Use an empty slot to keep both adventures. Medals and day
  records are independent; importing merges only the matching collection.
- Existing browser saves and Flash imports are Classic. The save format is v46;
  current saves require a supported edition/content revision. Unknown revisions
  fail before changing the active adventure or storage. Carry Over stays within
  the adventure's edition. Mute remains a shared browser preference.

## Smart Mode

Smart Mode is the default for starting companions, newly recruited companions
and hired guns in new Expanded adventures. Your character stays in Hero Mode.
Choose another order in Barrack, or change the hired gun preference at the Inn.
Existing saves retain their selected orders and hired gun preference. The old
Careful Consideration order keeps ID 7 and is now called Smart Mode.

Allies protect the wall, then seek ranged attackers, then other enemies.
Chickens count as ranged attackers. Preferred weapon range helps choose between
similar threats, but never makes a distant target ineligible. Boss is a small
preference; Defend broadens the urgency boundary.

### Spreading fire

Smart allies prefer enemies that another Smart ally is not already aiming at.
This uses live targets, not the temporary markers left behind by old attacks.
Bosses and the last viable enemy can draw shared fire. If every enemy already
has someone aiming at it, extra allies help with the least-covered targets.
They do not wait for a target to become free.

If allies share a target and another enemy becomes available, a stable slot
order decides who keeps it and who switches. Small score changes do not restart
aim. A more urgent threat, a shielded boss or an uncovered alternative can cause
a switch.

### Cost and timing

Changing aim farther takes longer. The extra delay is the distance from the
current aim point to the new target, divided by 25 and rounded to simulation
frames, capped at 12 frames. At the reference 30 Hz, a 75-pixel move adds 0.1s,
150 pixels adds 0.2s, and 300 pixels or more adds 0.4s. These are game coordinates,
so browser zoom does not change the delay. Keeping the same target adds no cost
per shot. Shielded bosses stop receiving aimed fire immediately.

Smart Mode also costs **15% automatic shot damage**, including class grenades.
Grenades have no extra aiming delay. Damage is fixed at launch; projectiles
already in flight keep it through Continue. Integer damage can round the loss
slightly above 15%. Accuracy, learned skills, ammunition and reload rules stay
unchanged. Orders can only be changed in town.

There is no guarantee of a Perfect Game. Allies may waste shots beyond their
preferred range. A projectile already in flight can hit a newly raised shield.

## Evidence and limits

Focused checks cover distance-based aim, stable target ownership, shared bosses,
last-target and fully-covered fallback, immediate shield avoidance, damage at
launch, defaults, opt-outs and deterministic save/Continue. Original AI reference
checks cover the unchanged Classic orders. Muted browser checks exercise the
normal menus and exported saves in an isolated profile.

Run the focused checks with:

```sh
node --experimental-strip-types --test web/tests/smart-mode*.test.ts
```

The balance test contains four small encounters with paired seeds and records
castle HP, kills, shots and clear time. It is not campaign balance evidence.
Earlier figures for the fixed 0.2-second delay no longer describe this version.
Team composition, weapon choices and active hero play still matter.

`rulesets.ts` defines the edition boundary. Both editions use the original
content catalog; no new classes, items or enemies ship yet.
