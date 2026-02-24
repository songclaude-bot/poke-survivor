# 25. Enemy Variety + Mini-Bosses

**Date**: 2026-02-24
**Phase**: 25 — Enemy Variety

---

## What was implemented

### Ranged Enemy Behavior
- New `"ranged"` behavior type for enemies
- Gastly now uses ranged behavior instead of circle
- Maintains preferred distance (~120px), retreats if too close
- Fires slow red projectiles at player every 2 seconds
- Enemy projectiles deal 50% of enemy ATK as damage
- Projectiles are dodgeable with the dodge roll mechanic

### Mini-Boss System
- Mini-boss spawns every 3 waves (wave 3, 6, 9, etc.)
- Drawn from mid/elite enemy pools with charge behavior
- Purple tint (0xff00ff), 1.7x scale
- ~4x normal enemy HP, scaling with elapsed time and cycle
- Shows "MINI-BOSS!" warning on spawn
- Counted as elite for drops and kill tracking

### Boss Variety
- Bosses now cycle through different Pokemon per cycle:
  - Cycle 1: Pinsir
  - Cycle 2: Geodude
  - Cycle 3: Gastly
  - Cycle 4+: loops back

### State Reset Fixes
- Reset dodge/crit/lifesteal/magnet stats on cycle restart
- Clean up enemy projectiles on cycle transition
- Added `enemyProjectiles` array cleanup in resetState

---

## Files Changed
- `src/scenes/GameScene.ts`
  - Added `"ranged"` to `EnemyBehavior` type
  - Added `isMini`, `lastRangedAttack` fields to `EnemyData`
  - Added `enemyProjectiles` array
  - Added `fireEnemyProjectile()`, `updateEnemyProjectiles()`
  - Added `spawnMiniBoss()` method
  - Updated `startNextWave()`: mini-boss every 3 waves
  - Updated `spawnBoss()`: boss pool cycling
  - Updated `resetState()`: clean all new state
  - Updated `startNextCycle()`: destroy enemy projectiles
