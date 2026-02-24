# 23. Endless Mode + Difficulty Ramping

**Date**: 2026-02-24
**Phase**: 23 — Endless Difficulty

---

## What was implemented

### Difficulty Scaling per Cycle
- **Wave rest timer**: Decreases by 0.3s per cycle (3s → min 1s)
- **Spawn interval**: Faster spawns at higher cycles (cycleSpeedUp up to 0.4s reduction)
- **Batch spawn size**: Increases with cycle number (extra +1 per 3 cycles)
- **Elite rate**: Now scales with cycle (+5% per cycle, up to 50%)
- **Existing**: Enemy HP/ATK/speed already scaled with cycleMult

### Difficulty Labels
Visual indicator on HUD based on cycle number:
- Cycle 1: (none)
- Cycle 2: NORMAL+
- Cycle 3-4: HARD (yellow text)
- Cycle 5-6: NIGHTMARE (red text)
- Cycle 7+: INFERNO (red text)

### Total Survival Time
- `totalSurvivalTime` tracks time across all cycles
- Passed through cycle transitions via `CyclePassData`
- Displayed in game over screen as "Total Time"
- Saved in high score data for persistence

### Title Screen Updates
- High score now shows cycle number if > 1
- Version updated to v1.2.0

---

## Files Changed
- `src/scenes/GameScene.ts`
  - Added `totalSurvivalTime`, `getDifficultyLabel()`
  - Updated `CyclePassData` with `totalTime`
  - Updated `init()`, `updateTimer()`, `startNextCycle()` for time tracking
  - Updated `updateEnemySpawning()`: cycle-based wave rest, spawn interval, batch size
  - Updated `spawnEnemy()`: cycle-based elite chance
  - Updated `drawUI()`: difficulty label with color coding
  - Updated `onAceDeath()`: total time + difficulty in game over stats
  - Updated `saveHighScore()`: tracks totalTime
- `src/scenes/TitleScene.ts`
  - High score shows cycle number
  - Version v1.2.0
