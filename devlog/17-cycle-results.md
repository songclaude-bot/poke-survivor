# 17. Improved Cycle Results Screen

**Date**: 2026-02-23
**Phase**: 17 — Cycle Transition Polish

---

## What was implemented

### Enhanced Cycle Clear Screen
- Shows ace's **evolution name** (e.g., "Raichu ★" instead of generic)
- Displays **real companion Pokemon names** from their sprite texture keys
- Shows **total party DPS** (ace ATK + sum of companion ATK)
- Shows **wave count** reached in this cycle
- Legion data now stores real Pokemon names instead of generic "Ace_N"

### Before vs After

**Before**: `Ace + Squirtle, Gastly, Geodude` (hardcoded names)
**After**: `Raichu ★ + Squirtle, Gastly, Geodude, Charmander, Bulbasaur` (actual names, evolution reflected)

---

## Files Changed
- `src/scenes/GameScene.ts`
  - `showCycleClear()`: Uses EVOLUTION_CHAINS for ace name, reads companion sprite keys for names
  - Legion data stores real names and calculated DPS
