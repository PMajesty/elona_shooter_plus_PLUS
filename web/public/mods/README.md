# Weapon MODs

This folder holds game MODs. The first supported kind is **custom weapons**.

```
mods/
├─ README.md            this file
├─ index.json           list of installed weapon folders (see "Installing")
├─ weapons/             ← put weapon folders here (only this folder is loaded)
│  └─ <registry name>/
│     ├─ slot.png       inventory icon, 192×128
│     └─ data.json      weapon parameters
└─ examples/weapons/    example weapons (not loaded; copy them into weapons/ to try them)
```

## Installing and managing

1. Copy a weapon folder into `mods/weapons/`. The folder name is the weapon's **registry name**.
2. A web page cannot list folders, so the game reads the list from `mods/index.json`:
   - `npm run dev` serves it live from `public/mods/weapons`.
   - `npm run build` writes it from the folders that exist at build time.
   - On any other static server, edit it by hand: `{"weapons": ["storm-crossbow", "marksman-rifle"]}`.
3. Open **Options → Weapon MODs → Manage MODs…**. It shows every weapon with its icon, status and errors, and you can enable or disable each one.
4. Changes apply after **reloading the game**. The set of weapons is fixed for a session, so saves and random numbers stay consistent.

A registry name may contain lowercase letters, digits, `_` and `-`. It must start with a letter or digit and be at most 48 characters long. Saves store weapons by this name, so **do not rename a released weapon**.

## Saves

- A save stores MOD weapons by registry name. Adding or removing other MODs never turns a weapon into a different one.
- If a MOD is removed or disabled, its weapons in a save become **Unknown MOD Weapon**. The original data stays inside the save, so enabling the MOD again restores the weapon, including its level and attachments.
- Do not sell an Unknown MOD Weapon while its MOD is disabled: once sold, it is gone.

## slot.png: the icon

- It **must be a 192×128 PNG** with a transparent background. The game shows it at half size (96×64, the same as an inventory cell), so it stays sharp in enlarged menus.
- Draw the weapon pointing right, roughly centered. The game trims the transparent border and aligns the drawing like the original icons.
- Do not add a shadow: the game adds the original drop shadow.
- **192×128 is the maximum, not the target size.** It fits the largest original icon, the Sniper Rifle. Most original weapons are smaller:

  | Weapon | Size (2× pixels) |
  |---|---|
  | Pistol | about 118×66 |
  | Crossbow | about 128×88 |
  | Hunter's Rifle | about 160×86 |
  | Sniper Rifle | about 192×82 |

- A fully transparent image or a wrong size is an error, and the weapon is not loaded.

## data.json: the parameters

`data.json` is a JSON object. Comments (`//` and `/* */`) and a trailing comma after the last item are allowed. `examples/weapons/storm-crossbow/data.json` explains every field in comments.

There are two ways to write it:

- **With a template**: `"template": "<original weapon>"` starts from all parameters of that weapon, and you list only the changes (see `marksman-rifle`). `name` is still required.
- **Without a template**: write everything yourself (see `storm-crossbow`). These fields are required: `name`, `attack`, `shootRate`, `ammoMax`, `reloadTimeMax`, `baseAccuracy`, `accuracyDec`, `category` and `value`.

Other fields have defaults (see the tables below). The MOD manager reports misspelled fields, wrong types and out-of-range values, and names the field.

### Name and description

| Field | Type | Default | Meaning |
|---|---|---|---|
| `format` | number | 1 | Data format version; currently 1. |
| `template` | text | — | Template weapon; see the list below. |
| `name` | text | **required** | English name, at most 80 characters. Saves and translations use it. It must differ from original and other MOD weapons. Upgrades add “Mk-N” automatically. |
| `names` | object | — | Names in other languages, e.g. `{"ru": "Грозовой арбалет"}`. |
| `description` | text or object | — | Item description: English text, or `{"en": ..., "ru": ...}`; at most 600 characters each. Shown above the attachments in the item popup. |

### Combat values

| Field | Type | Default | Range | Meaning |
|---|---|---|---|---|
| `attack` | number | required | 0–100000 | Damage per shot. |
| `shootRate` | number | required | 1–3000 | Fire rate, higher is faster. A shot takes about `1000 / shootRate` frames. Pistol 100, Hunter's Rifle 30, Sniper Rifle 20. |
| `ammoMax` | whole number | required | 1–9999 | Magazine size. |
| `reloadTimeMax` | whole number | required | 0–2000 | Reload time in frames (1/30 s). 0 means no ammo is used, like the original bows and crossbows. Pistol 20, Sniper Rifle 65. |
| `manualReload` | true/false | false | | Reload one round at a time, like shotguns, the Hunter's Rifle and revolvers. |
| `automatic` | true/false | false | | Keep firing while the button is held. |
| `baseAccuracy` | number | required | 0–1000 | Base accuracy; higher means less spread. Pistol 150, Sniper Rifle 225. |
| `accuracyDec` | number | required | 0–10 | Recoil: accuracy lost per shot. Pistol 0.1, Crossbow 0.35. |
| `shell` | whole number | 1 | 1–30 | Pellets per shot (shotguns use more than 1). |
| `range` | whole number | 1 | 0–2 | Best range: 0 near, 1 middle, 2 far. Accuracy drops away from it. |
| `dmgAir` | number | 100 | 0–1000 | Damage against flying enemies, percent. |
| `dmgArmor` | number | 100 | 0–1000 | Damage against armored enemies, percent. |

### Requirements and drops

| Field | Type | Default | Meaning |
|---|---|---|---|
| `category` | text | required | Weapon skill: `smallGun`, `rifle`, `shotgun` or `bigGun`. |
| `reqLv` | whole number | 1 | Required skill level (0–99). |
| `weaponClass` | text | `normal` | `normal`; `sniper` (One hit kill applies); or `shotgun` (Dr Holliday adds pellets). |
| `value` | number | required | Price (1–10000000). **It also sets the rarity**; see below. |
| `randomDrop` | true/false | true | Appears in shops, loot and boss drops. With false it never appears randomly. |
| `weight` | number | 1 | Weight in the random pool (0–100). 1 = the same chance as one original item number, 2 = twice, 0 = never. |

**Rarity.** The original random item roll picks a number from 1–40 uniformly, then accepts or rejects it by price and current day. Cheap items are common early; expensive weapons become likelier later. MOD weapons join that pool and are judged by `value` the same way. A price close to an original weapon of the same tier gives about the same frequency. `weight` only changes how often the weapon's number is picked, not the price check.

| Original weapon | Price |
|---|---|
| Pistol | 300 |
| Hunter's Rifle | 400 |
| Crossbow | 650 |
| Sniper Rifle | 1100 |

Without installed MODs the item roll is unchanged: the same single random call as the original.

### Projectiles and special behavior

| Field | Type | Default | Meaning |
|---|---|---|---|
| `projectile` | text | `none` | `none` (instant bullets), `grenade`, `rocket`, `bolt`, `arrow` (arcing), `gravity` or `flame`. |
| `projectileSpeed` | number | 10 | Projectile speed (1–100). Long Bow 10, Crossbow 20. |
| `pierce` | whole number | 0 | Extra enemies a projectile passes through (0–20); only `arrow` and `bolt`. |
| `volley` | whole number | 1 | Projectiles per shot: 1, or 3 (a Wind Bow volley); needs a projectile. |
| `bowDraw` | true/false | false | Hold to draw, release to shoot; needs `"projectile": "arrow"`. |
| `spinUp` | true/false | false | Chain Gun spin-up; needs `"projectile": "none"`. |
| `reloadAfterShot` | true/false | false | Reload after every shot, like the Gravity Gun; needs `reloadTimeMax` above 0. |

### Presentation

| Field | Type | Default | Meaning |
|---|---|---|---|
| `pose` | text | by category | Hero pose: `pistol`, `shotgun`, `rifle`, `chainGun`, `launcher` or `bow`. |
| `sound` | text | `gun1` | Shot sound: `gun1`–`gun15`, `fireball` or `rampageEnemy` (every sound the original weapons use). |
| `reloadSound` | text | by reload type | `magazine`, `shell` or `revolver`. |

### Templates

`pistol`, `subMachineGun`, `shotgun`, `huntersRifle`, `assaultRifle`, `sniperRifle`, `sniperRevolver`, `revolver`, `chainGun`, `machineGun`, `laserPistol`, `combatShotgun`, `autoShotgun`, `grenadeLauncher`, `rocketLauncher`, `crossbow`, `longBow`, `windBow`, `repeatingCrossbow`, `gravityGun`, `cheapWornHmg`, `hmg`, `flameThrower`.

With a template, every field you leave out is taken from that weapon, including projectile, pose and sound. Upgrades, attachments and skill bonuses work on MOD weapons exactly as on original ones.
