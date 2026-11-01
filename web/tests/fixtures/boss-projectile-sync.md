The boss projectile synchronization regression uses a controlled valid v11 save
derived from the browser-verified Day4 Rest state. The campaign, hidden hero
initialization, previous town and active mission are retained. Controlled fields
isolate a boss at `(200,220)`, action 4, frame 24 and facing -1, with a long walking
counter; a Crossbow occupies slot 2 and Rifle is level 3. A previously launched
bolt is one trajectory step old. No input fires a new projectile. New enemy
spawns are delayed to make the browser outcome observable.

On the next tick the original action-4 branch turns the boss to facing +1 and
starts its walk animation, reaching frame 201 at the projectile callback. The
bolt probes `(191,212)`. The extracted original atlas alpha and ally1 placement
matrices give a miss for the prior pose and a hit for the current pose. These
results remain distinct for all nine probes within ±0.2 pixels of the point.

`boss-projectile-contact.json` records each component's texture/frame, source
pixel, alpha, transform and input asset hashes. Regenerate it from the preserved
extracted assets with `python tools/extract_boss_projectile_contact.py`. That
tool uses Pillow already required by the asset tools; the Node test introduces
no dependency and does not import Phaser.

`boss-projectile-sync.test.ts` runs the actual `Simulation.tick()` using this
independently extracted contact sample. It asserts that the callback receives
the current boss pose, that the synchronized callback deals 40 damage and
removes the bolt, and that a deliberately cached prior pose instead leaves the
boss at 225 HP. This tests the simulation/geometry boundary. It does not inspect
source text or prove the actual `main.ts` callback wiring. Importing the same
save through the browser and observing 185 HP with no bolt is the separate
wiring check. It also does not claim that atlas alpha equals Flash vector
geometry or establish native Flash scheduling.
