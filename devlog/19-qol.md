# 19. Quality of Life Improvements

**Date**: 2026-02-24
**Phase**: 19 — QoL

---

## What was implemented

### Wave Clear Bonuses
- **XP Vacuum**: All XP gems are magnetically pulled to the player on wave clear
- **Wave Heal**: 10% max HP restored on each wave clear
- Provides natural sustain without relying solely on heal item drops

### Randomized Level-Up Choices
- Speed option now always in the pool (was previously conditional)
- All available choices are shuffled randomly
- 3 choices presented from the shuffled pool
- Creates variety across runs — sometimes evolution appears, sometimes it doesn't

---

## Files Changed
- `src/scenes/GameScene.ts`
  - `showWaveClearText()`: Added XP vacuum and HP restore
  - `showLevelUpSelection()`: Speed choice always available, random shuffle + cap at 3
