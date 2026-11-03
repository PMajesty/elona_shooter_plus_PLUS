# Flash fidelity review

The reference is `src/original/MainTimeline.as` and the original SWF. The
published desktop release at the start of this review is `df2b667`.

Claude in Cursor reviews the original player flows and reports discrepancies here.
Codex verifies each finding, makes the gameplay changes and records the result.
For each open finding, include the original function, browser path, and what a
player can do to observe the difference. Either reviewer can flag an uncertain
finding for reproduction. Keep save files and deployment access out of this log.

## Codex findings

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
