# 27. Real PMD Audio & Attack Effects

**Date**: 2026-02-24
**Phase**: 27 — Audio & VFX from pokemonAutoChess

---

## What was implemented

### BGM — Real PMD Dungeon Music
Replaced the procedural oscillator BGM with actual Pokemon Mystery Dungeon music tracks (.ogg) from the [pokemonAutoChessMusic](https://github.com/keldaanCommunity/pokemonAutoChessMusic) repository.

#### Track Mapping
| Game Context | Track | Source |
|-------------|-------|--------|
| Title Screen | Top Menu Theme | PMD Explorers |
| Gameplay (random) | Amp Plains, Crystal Cave, Mt. Blaze, Treasure Town | PMD Explorers |
| Boss Warning (3:00) | Monster House! | PMD Red/Blue |
| Boss Battle | Boss Battle! | PMD Red/Blue |
| Boss Battle (Cycle 3+) | Versus Legendary | PMD Explorers |
| Boss Defeated | Job Clear! | PMD Red/Blue |

#### BGM Flow
```
Title Screen (Top Menu Theme)
  → Game Start (random dungeon track)
    → Boss Warning at 3:00 (Monster House!)
      → Boss Spawn at 4:00 (Boss Battle! / Versus Legendary)
        → Boss Defeated (Job Clear!)
          → Next Cycle (new random dungeon track)
```

Crossfade transition between tracks using `switchBgm()` for smooth context changes.

### SFX — pokemonAutoChess Sound Effects
Replaced all procedural Web Audio API sounds with actual .ogg sound effects from the [pokemonAutoChess](https://github.com/keldaanCommunity/pokemonAutoChess) repository.

| Game Event | SFX File | Original Use |
|-----------|----------|--------------|
| Projectile hit | refresh.ogg | Shop refresh |
| XP/Item pickup | carouselunlock.ogg | Carousel unlock |
| Level up | evolutiont2.ogg | Tier 2 evolution |
| Death/Defeat | finish8.ogg | 8th place finish |
| Boss warning | notification.ogg | Notification |
| Stage clear | finish1.ogg | 1st place finish |
| Game start | startgame.ogg | Game start |
| UI click | buttonclick.ogg | Button click |

SFX uses HTMLAudioElement pool (3 per sound) for overlapping playback.

### Attack Visual Effects — Type-Based Sprites
Added type-specific projectile and hit impact sprites from pokemonAutoChess attack animations.

#### Type → Starter Mapping
| Starter | Attack Type | Projectile Frames | Hit Frames |
|---------|------------|-------------------|------------|
| Pikachu | ELECTRIC | 6 (range loop) | 6 (one-shot) |
| Charmander | FIRE | 31 (range loop) | 4 (one-shot) |
| Squirtle | WATER | 19 (range loop) | 4 (one-shot) |
| Other | NORMAL | (placeholder) | 4 (one-shot) |

- Projectiles now show animated type sprites (e.g., electric sparks, fireballs, water drops)
- Hit impacts play a one-shot type-specific explosion animation at the point of impact
- All sprites loaded from `public/assets/attacks/{TYPE}/{variant}/` directories

---

## Technical Changes

### SfxManager.ts — Complete Rewrite
- **Before**: Web Audio API oscillators generating procedural 8-bit sounds
- **After**: HTMLAudioElement-based playback of real .ogg files
- Same public API maintained (`playHit()`, `playPickup()`, etc.)
- Added `switchBgm()` for crossfade BGM transitions
- Added `playClick()` for UI interactions
- BGM tracks defined in `BGM_TRACKS` constant for easy mapping

### AttackEffects.ts — New Module
- `loadAttackEffects()` — Preloads all attack PNG frames in BootScene
- `createAttackAnimations()` — Creates Phaser animations (range=loop, hit=one-shot)
- `playHitEffect()` — Spawns a self-destroying hit animation at a position
- `STARTER_ATTACK_TYPE` — Maps starter pokemon key to attack type

### BootScene.ts
- Added attack effect loading and animation creation

### GameScene.ts
- `fireProjectile()` — Uses type-specific animated sprites for projectiles
- `onProjectileHitEnemy()` — Spawns hit effect animation on impact
- `updateTimer()` — Switches BGM on boss warning (Monster House)
- `spawnBoss()` — Switches BGM to boss battle music (Boss Battle! / Versus Legendary)
- `onBossDefeated()` — Stops BGM, plays victory music (Job Clear!)
- `startNextCycle()` — Stops BGM before scene restart

### TitleScene.ts
- Plays title BGM (Top Menu Theme) on scene creation
- Stops BGM on game start before transitioning

---

## Files Changed
- **REWRITTEN** `src/audio/SfxManager.ts` — Real audio file playback
- **NEW** `src/effects/AttackEffects.ts` — Type-based attack animations
- `src/scenes/BootScene.ts` — Load attack effects
- `src/scenes/GameScene.ts` — Type projectiles, hit effects, BGM flow
- `src/scenes/TitleScene.ts` — Title BGM
- **NEW** `public/assets/musics/` — 8 PMD BGM tracks (.ogg, ~15MB)
- **NEW** `public/assets/sounds/` — 9 SFX files (.ogg, ~180KB)
- **NEW** `public/assets/attacks/` — 74 attack effect PNGs (4 types)

## Resource Attribution
- Music: [pokemonAutoChessMusic](https://github.com/keldaanCommunity/pokemonAutoChessMusic) — CC BY-NC 4.0
- SFX: [pokemonAutoChess](https://github.com/keldaanCommunity/pokemonAutoChess) — GPL-3.0
- Attack sprites: [pokemonAutoChess](https://github.com/keldaanCommunity/pokemonAutoChess) — GPL-3.0
