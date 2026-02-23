# 08. Radar, Aim Line, Spawn Animation

**Date**: 2026-02-23
**Phase**: 8 — HUD & Visual Polish

---

## What was implemented

### Enemy Spawn Animation
Enemies now scale from 0 → 1 when spawning, using `Back.easeOut` easing for a bouncy pop-in effect (250ms). This gives visual feedback when new enemies appear at screen edges.

### Minimap / Radar
A 60×60px radar display in the bottom-right corner shows:
- **Gold dot** (center): Player position
- **Red dots**: Enemies within 400 unit range
- **Cyan dots**: Companion positions
- **Blue dots**: XP gems
- **Magenta dot** (large, clamped to edge): Boss position when active
- Semi-transparent black background with border

The radar covers a 400-unit radius around the player, scaled to fit the minimap. This helps players see approaching enemies from off-screen.

### Auto-Aim Indicator
A faint gold line (alpha 0.2) draws from the player to the nearest enemy in attack range. This shows:
- Which enemy will be targeted next
- Whether any enemies are in attack range
- The auto-attack direction

The line is drawn every frame and cleared/redrawn, so it always points to the current nearest target. Uses the same `findNearestEnemy()` function as the auto-attack system to ensure accuracy.

---

## Files Changed
- `src/scenes/GameScene.ts`
  - Added spawn-in tween to `spawnEnemy()` (scale 0 → 1, Back.easeOut)
  - Added `minimapGfx` and `aimGfx` graphics objects
  - Added `drawMinimap()` method rendering player/enemy/companion/gem/boss dots
  - Updated `updateAceAutoAttack()` to draw aim line to target

## Next Steps
- Background music loop
- More enemy variety/behavior patterns
- Performance profiling
