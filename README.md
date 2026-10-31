# Elona Shooter Plus PLUS

A game-start compatibility fix for the supplied **Elona Shooter Plus 1.3.0.4**
SWF, originally named `elonashooter1.3.swf`. Original game credits and assets
are retained.

The current release keeps the original English interface, gameplay and balance.
It contains no Russian localization or language selector.

## Play

Load **`elonashooter1.3-fixed.swf`** with Ruffle's **Select File** control.
Choose **New Game**, select your character and press **Proceed**.

The unmodified input is preserved at `original/elonashooter1.3.swf`.

## What changed

The original SWF9 file stalled during New Game in Ruffle: the character-selection
window accessed children before their construction completed. The fix uses
SWF10 construction behavior. Title initialization also waits one frame when its
required children are still being constructed and guards against reentrant setup.

The original loader and advertising flags remain unchanged. Ruffle may log a
nonfatal warning about the retired MochiAds endpoint while loading.

## Source and rebuild

- `src/shootem_fla/MainTimeline.as` is the editable game script with the fix.
- `src/original/MainTimeline.as` is the decompiled baseline for comparison.
- `original/elonashooter1.3.swf` supplies all other scripts and original assets.
- `tools/build.py` compiles the edited script into a separate SWF and verifies
  that non-code resources are preserved.

Requirements: Python 3, Java 21, and **JPEXS FFDec 26.4.0**. Portable Java and FFDec
are installed locally in the ignored `.tools/` directory; these third-party
binaries are not committed.

Official tools: [JPEXS FFDec](https://github.com/jindrapetrik/jpexs-decompiler/releases/tag/version26.4.0),
[Eclipse Temurin Java](https://adoptium.net/temurin/releases/),
and [Ruffle](https://ruffle.rs/).

```powershell
python tools/build.py
```

On another machine, place FFDec at `.tools/ffdec/ffdec.jar` and a Java runtime
under `.tools/jre/`, or specify their paths:

```powershell
python tools/build.py --java C:/path/to/java.exe --ffdec C:/path/to/ffdec.jar
```

FFDec can also export the other embedded scripts from the preserved original
when a future modification needs them. The current build replaces only
`shootem_fla.MainTimeline`.

## Validation

Tested in Ruffle 0.7.1 web: English title and character creation, New Game,
Proceed, enemy spawning and damage, and the normal game-over screen. No
ActionScript exceptions were observed in the fixed run.

All 3,491 root SWF tags retain their order and types. All original fonts, text,
images, sounds, shapes and timelines remain byte-identical. Only the ActionScript
payload and SWF version change. See `docs/verification.json` for hashes and
checks, and `docs/build-verification.json` for the latest local rebuild.

Original input SHA256:
`4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663`.
