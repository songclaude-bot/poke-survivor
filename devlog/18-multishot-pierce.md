# 18. Multi-Shot Attack + Pierce Scaling

**Date**: 2026-02-23
**Phase**: 18 — Attack Variety

---

## What was implemented

### Multi-Shot System
Ace fires multiple projectiles in a spread pattern based on level:

| Level Range | Shots | Spread | Per-shot Damage |
|-------------|-------|--------|-----------------|
| 1-6 | 1 | None | 100% ATK |
| 7-14 | 3 | ±0.2 rad (~11°) | ATK / 1.8 per shot |
| 15+ | 5 | ±0.4 rad (~23°) | ATK / 3.0 per shot |

Total damage across all projectiles is slightly higher than single-shot, rewarding survival.

### Pierce Scaling with Evolution
Projectiles pierce through enemies based on evolution stage:
- Stage 0 (base): Pierce 1 (no pierce)
- Stage 1 (evolved): Pierce 2
- Stage 2 (final): Pierce 3

Combined with multi-shot, a fully evolved Lv15+ ace fires 5 projectiles that each pierce 3 enemies — devastating crowd control.

### Attack Sound
Added `sfx.playHit()` on ace attack (was missing, only played on projectile hit before).

---

## Files Changed
- `src/scenes/GameScene.ts`
  - `updateAceAutoAttack()`: Multi-shot logic with angle spread
  - `fireProjectile()`: Pierce scales with `aceEvoStage`
