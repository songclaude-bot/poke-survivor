# 09. Enemy Behavior Patterns & Item Drops

**Date**: 2026-02-23
**Phase**: 9 — Enemy AI & Items

---

## What was implemented

### Enemy Behavior Patterns
Four distinct movement behaviors assigned per Pokemon species:

| Behavior | Pokemon | Description |
|----------|---------|-------------|
| **chase** | Bulbasaur (default) | Direct pursuit toward player |
| **circle** | Zubat, Gastly | Orbits around player, gradually closing in |
| **charge** | Geodude, Charmander, Pinsir | Slow approach → white flash warning → red high-speed dash |
| **swarm** | Rattata | Groups with nearby swarm allies, attacks as a pack |

**Circle behavior**: Uses orbit angle that increments over time, with orbit radius gradually shrinking. Enemies move 1.2x speed to keep up with orbit position.

**Charge behavior**: 3-phase cycle:
1. Slow approach (0.3x speed) until within 120px
2. White flash warning (400ms before charge)
3. Red-tinted dash at 3.5x speed for 800ms
4. Cooldown (2.5-4s) then repeat

**Swarm behavior**: Blends chase movement with cohesion — each swarm enemy seeks its nearest swarm ally (40% speed bonus toward ally), creating emergent pack formation.

### Item Drop System
Three item types drop from defeated enemies:

| Item | Texture | Drop Weight | Effect |
|------|---------|-------------|--------|
| **Heal** | Green circle | 50% | Restores 25% max HP |
| **Bomb** | Orange circle | 25% | 50% HP damage to all enemies within 300px, screen flash + shake |
| **Magnet** | Light blue circle | 25% | Pulls all XP gems toward player at 600 speed |

- **Drop rate**: 8% per enemy kill, 100% from boss
- **Lifetime**: 10 seconds, blinks for last 3 seconds
- **Spawn animation**: Scale 0 → 1.5 → 1.0 (bounce)
- **Pickup radius**: 24px
- Damage popup shows item name on collection ("BOOM!", "MAGNET!", "+HP")

---

## Files Changed
- `src/scenes/GameScene.ts`
  - Added `EnemyBehavior` type and extended `EnemyData` interface
  - Rewrote `updateEnemies()` with `switch(e.behavior)` for 4 patterns
  - Added `ItemDrop` interface and `items[]` array
  - Added `spawnItem()`, `updateItems()`, `collectItem()` methods
  - Modified `onEnemyDeath()` to drop items (8% chance)
  - Updated `showDamagePopup()` to accept `string | number`
  - Boss now includes `behavior: "chase"` property
- `src/scenes/BootScene.ts`
  - Added `item-heal`, `item-bomb`, `item-magnet` placeholder textures

## Next Steps
- Background music loop
- More enemy types per tier
- Performance optimization
- Screen transitions polish
