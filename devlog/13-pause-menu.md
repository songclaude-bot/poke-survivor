# 13. Pause Menu + Volume Control

**Date**: 2026-02-23
**Phase**: 13 — Pause System

---

## What was implemented

### Pause Button
- "❚❚" button at top-right (below cycle text)
- Disabled during level-up selection overlay
- Toggles pause state on tap

### Pause Menu Overlay
Full-screen dark overlay with:
- **PAUSED** title (blue, large)
- **[ Resume ]** button (green) — unpauses game
- **Volume** controls — [ - ] and [ + ] buttons adjust master volume (±10%)
- **[ Main Menu ]** button (red) — stops BGM and returns to TitleScene

### Volume Control
- Added `adjustVolume(delta)` to SfxManager
- Clamps master gain between 0.0 and 1.0
- Affects all SFX and BGM simultaneously

### State Management
- `manualPause` flag prevents conflict with level-up pause
- Resume properly restores game state
- Pause container cleaned up on resume

---

## Files Changed
- `src/scenes/GameScene.ts` — Added pause button, menu, toggle/show/resume methods
- `src/audio/SfxManager.ts` — Added `adjustVolume()` method
