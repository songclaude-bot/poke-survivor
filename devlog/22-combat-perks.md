# 22. Combat Perks — Critical Hit, Lifesteal, XP Magnet

**Date**: 2026-02-24
**Phase**: 22 — Combat Perks

---

## What was implemented

### Critical Hit System
- New `critChance` stat (starts at 0%, caps at 50%)
- On projectile hit, rolls for crit → **2× damage** on success
- Crit damage shows red popup with "CRIT!" text
- Level-up choice: **CRIT +10%** (available until 50% cap)

### Lifesteal System
- New `lifestealRate` stat (starts at 0%, caps at 30%)
- On projectile hit, heals player for a percentage of damage dealt
- Works with both normal and critical hits
- Level-up choice: **LIFESTEAL +5%** (available until 30% cap)

### XP Magnet Range
- XP gem pickup magnet range now driven by `xpMagnetRange` field (base 60)
- Level-up choice: **XP MAGNET +30** — increases pickup radius
- Stacks with per-level scaling (base + level × 5)

### Level-Up Pool Expansion
Total level-up choices now 8 (from 5):
1. **EVOLVE** (conditional: level threshold + evolution available)
2. **+ Companion** (conditional: slots < 5)
3. **ATK +25%**
4. **MAX HP +30**
5. **SPEED +20%**
6. **CRIT +10%** (conditional: < 50%)
7. **LIFESTEAL +5%** (conditional: < 30%)
8. **XP MAGNET +30**

3 randomly chosen from available pool each level-up.

---

## Files Changed
- `src/scenes/GameScene.ts`
  - Added `critChance`, `lifestealRate`, `xpMagnetRange` fields
  - Modified `onProjectileHitEnemy()`: crit roll + lifesteal heal
  - Modified `updateXpGemMagnet()`: uses `xpMagnetRange` field
  - Added 3 new level-up choices in `showLevelUpSelection()`
