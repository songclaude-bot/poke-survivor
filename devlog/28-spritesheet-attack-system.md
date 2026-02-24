# 28. Spritesheet Attack System

**Date**: 2026-02-24
**Phase**: 28 — Proper Phaser Spritesheet Animations

---

## What changed

### Before (Phase 27)
- 74 individual PNG files loaded via `scene.load.image()` — one HTTP request per frame
- Only 4 attack types: ELECTRIC, FIRE, WATER, NORMAL (hit + range only)
- Animations built manually from separate texture keys
- No attack pose animation on the player pokemon
- No melee attack variant

### After (Phase 28)
- **51 packed horizontal spritesheets** loaded via `scene.load.spritesheet()` — one request per variant
- **18 attack types** with up to 3 variants each (range, hit, melee)
- Animations created via `scene.anims.generateFrameNumbers()` — the proper Phaser way
- **Pokemon Attack-Anim.png** spritesheets loaded for attack pose animations
- Player pokemon plays 8-directional attack pose when firing projectiles

---

## Attack Types (18 total)

| Type | Range | Hit | Melee |
|------|-------|-----|-------|
| BUG | 4f | 4f | 4f |
| DARK | 6f | 13f | 7f |
| DRAGON | 36f | — | 11f |
| ELECTRIC | 6f | 6f | 4f |
| FAIRY | 6f | 11f | 26f |
| FIGHTING | 29f | 3f | 2f |
| FIRE | 31f | 4f | 8f |
| FLYING | 8f | 6f | 18f |
| GHOST | 24f | 7f | 9f |
| GRASS | 20f | 3f | 5f |
| GROUND | — | 5f | 12f |
| ICE | 14f | 5f | 6f |
| NORMAL | — | 4f | 3f |
| POISON | 4f | 5f | 11f |
| PSYCHIC | 39f | 6f | 14f |
| ROCK | 8f | 14f | 11f |
| STEEL | 8f | 14f | 8f |
| WATER | 19f | 4f | 8f |

## Pokemon Attack Poses

All 9 pokemon now have Attack-Anim.png spritesheets with metadata from AnimData.xml:

| Pokemon | Attack Frame Size | Frame Count | HitFrame |
|---------|------------------|-------------|----------|
| Pikachu | 80×80 | 10 | 3 |
| Charmander | 64×64 | 11 | 6 |
| Squirtle | 64×72 | 10 | 3 |
| Bulbasaur | 64×72 | 11 | 5 |
| Gastly | 64×80 | 13 | 6 |
| Geodude | 72×80 | 14 | 5 |
| Rattata | 64×72 | 10 | 3 |
| Zubat | 72×80 | 11 | 4 |
| Pinsir | 64×80 | 10 | 3 |

---

## Technical Changes

### AttackEffects.ts — Complete rewrite
- **Before**: Individual `scene.load.image()` calls per frame, manual frame array
- **After**: `scene.load.spritesheet()` + `scene.anims.generateFrameNumbers()`
- Full 18-type metadata with frameWidth/frameHeight/frameCount per variant
- New helpers: `getRangeTextureKey()`, `getRangeAnimKey()`, `hasAttackVariant()`, `playMeleeEffect()`
- Starter → type mapping includes GRASS (Bulbasaur)
- Enemy → type mapping added: Gastly→GHOST, Geodude→ROCK, etc.

### PmdSpriteLoader.ts — Attack-Anim support
- New `PmdAttackConfig` interface with rushFrame/hitFrame/returnFrame
- All 9 pokemon configs now include `attack` metadata from AnimData.xml
- `loadPmdAttackSprites()` — loads Attack-Anim.png as spritesheets from local assets
- `createPmdAttackAnimations()` — creates 8-directional attack animations via `generateFrameNumbers()`

### GameScene.ts — Attack pose integration
- `fireProjectile()` now calls `playAttackPose()` on the ace sprite
- `playAttackPose()` — switches to attack texture, plays directional anim, reverts to walk on complete
- Projectile sprites use new spritesheet-based range textures

### BootScene.ts — New loading calls
- Added `loadPmdAttackSprites()` in preload
- Added `createPmdAttackAnimations()` in create

### Asset cleanup
- Individual attack PNG files (543 files, 2.7MB) replaced by 51 packed spritesheets (348KB)
- Local Attack-Anim.png + AnimData.xml for all 9 pokemon

---

## Files Changed
- **REWRITTEN**: `src/effects/AttackEffects.ts` — Spritesheet-based attack system
- **MODIFIED**: `src/sprites/PmdSpriteLoader.ts` — Attack-Anim loading + animations
- **MODIFIED**: `src/scenes/BootScene.ts` — Load/create attack assets
- **MODIFIED**: `src/scenes/GameScene.ts` — Attack pose + spritesheet projectiles
- **NEW**: `public/assets/attacks/{TYPE}/{variant}-sheet.png` — 51 packed spritesheets
- **NEW**: `public/assets/sprites/{ID}/Attack-Anim.png` — 9 pokemon attack sheets
- **NEW**: `public/assets/sprites/{ID}/AnimData.xml` — 9 animation metadata files
- **NEW**: `public/assets/attacks/attack-meta.json` — Attack spritesheet metadata
- **DELETED**: 543 individual attack PNG files

## Resource Attribution
- Attack sprites: [pokemonAutoChess](https://github.com/keldaanCommunity/pokemonAutoChess) — GPL-3.0
- Pokemon attack spritesheets: [PMD SpriteCollab](https://sprites.pmdcollab.org/) — CC BY-NC 4.0
