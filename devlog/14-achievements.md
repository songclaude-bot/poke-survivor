# 14. Achievement System + Persistent High Scores

**Date**: 2026-02-23
**Phase**: 14 — Achievements & Persistence

---

## What was implemented

### Achievement System
13 achievements tracked during gameplay:

| ID | Name | Requirement |
|----|------|-------------|
| first_kill | First Blood | 1 kill |
| kill_50 | Hunter | 50 kills |
| kill_200 | Slayer | 200 kills |
| kill_500 | Exterminator | 500 kills |
| wave_5 | Survivor | Wave 5 |
| wave_10 | Veteran | Wave 10 |
| wave_20 | Elite | Wave 20 |
| level_5 | Growing | Level 5 |
| level_10 | Experienced | Level 10 |
| evolve | Evolution! | Evolve ace |
| full_party | Squad Goals | 5 companions |
| cycle_2 | New Game+ | Cycle 2 |
| streak_15 | Combo Master | 15 kill streak |

**Achievement popup**: Gold-bordered banner slides down from top, displays for 2s, then slides up. Queued — multiple achievements shown sequentially.

### Persistent High Scores
- Stored in `localStorage` under `poke-survivor-data`
- Tracks: kills, wave, level, cycle
- Updated on death (only if current > previous best)
- Displayed on:
  - Game over screen (gold text, above retry button)
  - Title screen (below "Tap to Start")

### Save Data Structure
```json
{
  "highScore": { "kills": 0, "wave": 0, "level": 0, "cycle": 1 },
  "unlockedAchievements": ["first_kill", "kill_50", ...]
}
```

---

## Files Changed
- `src/scenes/GameScene.ts`
  - Added `ACHIEVEMENTS` array, `SaveData` interface, `loadSaveData()`/`saveSaveData()`
  - Added achievement checking in update loop
  - Added `checkAchievements()`, `processAchievementQueue()`, `saveHighScore()`
  - Added public getter methods for achievement checks
  - Enhanced game over screen with high score display
- `src/scenes/TitleScene.ts`
  - Added high score display from localStorage
  - Version bumped to v0.14.0
