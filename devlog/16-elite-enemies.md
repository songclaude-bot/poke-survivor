# 16. Elite Enemy Variants

**Date**: 2026-02-23
**Phase**: 16 — Elite Enemies

---

## What was implemented

### Elite Enemy System
Starting from Wave 3, some enemies spawn as **elite variants**:

| Property | Normal | Elite |
|----------|--------|-------|
| HP | 1x | 2.5x |
| ATK | 1x | 1.8x |
| Speed | 1x | 1.2x |
| Scale | 1.0 | 1.4 |
| Tint | Red (0xff8888) | Gold (0xffaa00) |
| HP bar | 20px, red | 26px, gold |
| XP drop | 3 + maxHp/10 | 10 + maxHp/5 |
| Item drop | 8% | 40% |
| Screen shake | None (unless streak) | Medium (100ms) |

**Spawn chance**: `min(35%, 15% + waveNumber * 1%)` — starts at 15% on wave 3, caps at 35%.

---

## Files Changed
- `src/scenes/GameScene.ts`
  - Added `isElite` to `EnemyData` interface
  - Modified `spawnEnemy()` with elite roll, gold tint, larger scale
  - Modified `onEnemyDeath()` with elite XP bonus, drop rate, screen shake
  - Modified HP bar drawing for elite (wider bar, gold color)
