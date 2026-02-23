# 15. Screen Transitions + Danger Vignette

**Date**: 2026-02-23
**Phase**: 15 — Visual Polish

---

## What was implemented

### Scene Fade In
- GameScene fades in from black (500ms) on create
- Smooth transition from TitleScene's fadeOut → GameScene fadeIn

### Danger Vignette
When HP drops below 30%, a pulsing red border effect appears:
- Red rectangles on all 4 edges of the screen (30px wide, 40px tall)
- Pulsing intensity based on `sin(time * 0.005)`
- Scales with HP ratio — lower HP = stronger effect
- Clears instantly when HP goes above 30%

---

## Files Changed
- `src/scenes/GameScene.ts`
  - Added `dangerVignette` graphics object
  - Added `createDangerVignette()` and `updateDangerVignette()` methods
  - Added `cameras.main.fadeIn(500)` in `create()`
  - Vignette update called in main update loop
