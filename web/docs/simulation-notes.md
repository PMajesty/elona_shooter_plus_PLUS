# First playable simulation

The browser simulation currently supports the original **Sheriff** starting class, Shotgun and five Soldier's Grenades through the first battle and its result. Its state can be saved and resumed during battle or on the result screen. This is the first integrated migration slice, not a completed port of the campaign.

## Rules recovered from source

References below are to `src/shootem_fla/MainTimeline.as` unless another class is named. Remaining classes were exported read-only from the preserved original SWF into ignored `.build/export/scripts/`.

| Behavior | Source | Port |
| --- | --- | --- |
| Stage and simulation frames | metadata line 22; `onEnterFrame` line 2232 | 620×380, fixed 30 Hz |
| Independent timer | `new Timer(50,0)` line 9227; `onTick` line 8290 | Exact 20 Hz timer accumulated alongside the 30 Hz frame clock |
| First battle | New Game calls `generateMission(0)` line 7487; `generateMission` line 12196 | Displayed day 1 uses mission level **0**, power 800, reward 600, five waves, boss at wave index 2 |
| Wave construction and scheduling | `selectEnemy` line 1116; `generateWave` line 5326; `onTick` line 8359 | Original power budgets, selection flags, shuffle, reverse wave order and spawn delays |
| End condition | `onTick` line 8370 onward | End follows the exhausted wave schedule, as in the original; killing every remaining enemy is not required |
| Starting loadout | `generatePlayer` line 2078; Sheriff branch line 2178 | Shotgun, Shotgun skill 2, Fury 1, five 45-damage Soldier's Grenades, 200 GP |
| Shotgun | `generateStuff` line 3958; `shoot` line 7839 | Six pellets, 16 damage each, five-shell magazine, 1,000 cooldown reduced by 40 each frame |
| Spread | `shoot` line 7881; recoil recovery line 8464 | Original triangular random spread, accumulated recoil and distance penalty |
| Reload | `reload` line 4618; `reloading` line 7378; mouse-down line 12112 | Seven **20 Hz ticks** per shell; click cancels partial reload; another click fires |
| Critical hit and knockback | `enemy.damage` line 550 | Original critical rectangles, double damage, Sheriff resistance-scaled knockback |
| Enemies | `enemy.init` line 166; `enemy.onEnterFrame` line 902 | Sheep, rat, chicken and first-battle boss stats and behaviors; their original frame-script attack timings |
| Grenade | `throwGrenade` line 13409; `bullet_grenade`; `explode` line 3094; `itemTimer` | Original ballistic formula, 45 damage in ±60×±50 box, 100-frame item cooldown |
| Castle | initialization line 9258; `damageCastle` line 10911 | 40 HP; no starting sandbag reduction |
| Results | `renewResult` line 3463; `eventAfterBattle` line 12536; `exitBattle2` line 13350 | 600 GP reward, +30% when perfect, 40 GP storage upkeep, +250 completion XP, gun refilled |
| Save | original `saveGame` line 6363 | New versioned JSON snapshot; original Flash/Ruffle saves are not automatically compatible |

## Current limits and deliberate differences

- The first playable class is explicitly Sheriff. Original New Game defaults to Rogue; Rogue requires its starting companion and has not been ported yet.
- There is no second day, town economy, inventory editing, character recruitment, skill-choice interface, medals, unlock progression or full loot-generation flow yet. Loot IDs and pending skill points are retained as state for subsequent implementation. The result does not imply these systems are complete.
- The first-day special mission loot roll and pending queue are implemented and compared against original traces. Inventory redemption, boss prize generation and medal rewards are not implemented. Ordinary kill rewards and base result rewards exist, with the listed original-reference coverage below.
- The port uses its own seeded PRNG for reproducible new saves. It does not reproduce a Flash random stream or consume all cosmetic random calls. Rule distributions are ported, not historical replay seeds.
- Pure simulation tests use documented approximate body rectangles. The renderer may supply `SimulationOptions.hitTest` to use original exported frame pixels. Critical rectangles remain the original source values. Flash's dynamic child transforms, shadow exclusions and draw order still need full visual parity verification.
- The first-day boss state machine is supported. Higher-level shields, special attacks, rampage and later enemy species are outside this slice.
- Critical-kill voice selection currently assumes the original initial living sister; sister damage and its effects remain unimplemented.
- Frame-script effects and the 50 ms timer are scheduled deterministically at 30 Hz boundaries. This removes runtime scheduling jitter; event order can differ by one frame from the Flash player.
- A strictly vertical grenade throw used a zero divisor in Flash. The port shifts its horizontal target by 0.01 pixel to produce a finite trajectory.

## Validation

`npm test` checks authentic first-mission configuration, both clocks, semi-automatic and queued input, partial reload cancellation, grenade cooldown, save/resume including an in-flight grenade, corrupt-save rejection, unattended defeat, and successful first-battle results. `npm run build` type-checks the simulation with its renderer. Visual and interaction checks in the actual browser remain necessary; these tests do not establish complete visual parity or a performance improvement over Ruffle.

The ordinary suite also compares captured original results: 72 reload snapshots,
three seeded wave-generation snapshots and 21 spawn/single-pellet snapshots.
The point adapter supplies original geometry to the actual production
`processPellet` path; it tests critical decisions, damage/accounting and RNG, not
alpha-mask geometry itself. Negative controls detect the previous missing shell
feedback and RNG omissions. `npm run test:soak` exercises seeded full opening
battles with exact save/replay equality. Current evidence and next work are
maintained in `docs/port-status.md`, `docs/port-verification.json` and
`docs/oracle-notes.md` at repository root.
