# 10. Background Music + Wave System

**Date**: 2026-02-23
**Phase**: 10 — BGM & Waves

---

## What was implemented

### Procedural 8-bit BGM
Added background music loop to SfxManager using Web Audio API:

- **Bass line**: Triangle wave cycling through C3-E3-D3-F3 (0.4s per beat)
- **Arpeggio layer**: Square wave playing C5-E5-G5-E5-D5-F5-G5-F5 (0.2s per note)
- Master volume: 6% (subtle background)
- Starts on GameScene create, stops on death
- Methods: `startBgm()`, `stopBgm()`

### Wave System
Replaced continuous time-based spawning with discrete wave-based combat:

| Feature | Details |
|---------|---------|
| **Wave size** | `5 + waveNumber * 3 + cycleNumber * 2` enemies per wave |
| **Spawn interval** | `max(0.25, 1.2 - waveNumber * 0.08)` seconds between spawns |
| **Batch size** | `1 + floor(waveNumber / 4)` enemies per spawn tick |
| **Rest period** | 3 seconds between waves |
| **Wave clear** | "WAVE CLEAR!" floating text on completion |
| **Wave announce** | Warning banner at wave start |
| **UI** | Wave number displayed below cycle info (top right, purple) |

Flow: Wave start → enemies spawn → all killed → "WAVE CLEAR!" → 3s rest → next wave

---

## Files Changed
- `src/audio/SfxManager.ts` — Added `startBgm()`, `stopBgm()` with bass + arpeggio layers
- `src/scenes/GameScene.ts`
  - Added wave state vars: `waveNumber`, `waveTimer`, `waveRestTimer`, `waveEnemiesRemaining`, `inWaveRest`
  - Added `waveText` UI element
  - Rewrote `updateEnemySpawning()` with wave logic
  - Added `startNextWave()`, `showWaveClearText()`
  - `create()` calls `sfx.startBgm()`
  - `onAceDeath()` calls `sfx.stopBgm()`
  - `resetState()` initializes wave + items arrays

## Next Steps
- Pokemon evolution system
- More stat variety per Pokemon
- Difficulty curve tuning
