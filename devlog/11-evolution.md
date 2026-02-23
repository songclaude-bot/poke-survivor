# 11. Pokemon Evolution System

**Date**: 2026-02-23
**Phase**: 11 — Evolution + Stat Scaling

---

## What was implemented

### Ace Evolution System
When the ace reaches level 5 and level 10, a special "EVOLVE" option appears in the level-up selection UI:

| Pokemon | Stage 1 | Stage 2 | Stage 3 |
|---------|---------|---------|---------|
| Pikachu | Base (1x/1x/1x) | Raichu ★ (1.5x ATK, 1.3x HP, 1.15x SPD) | Raichu GX ★★ (2.2x ATK, 1.8x HP, 1.3x SPD) |
| Squirtle | Base | Wartortle ★ (1.5x/1.4x/1.1x) | — |
| Charmander | Base | Charmeleon ★ (1.6x/1.3x/1.15x) | — |
| Bulbasaur | Base | Ivysaur ★ (1.4x/1.5x/1.1x) | — |
| Gastly | Base | Haunter ★ (1.7x/1.2x/1.2x) | — |
| Geodude | Base | Graveler ★ (1.4x/1.6x/1.0x) | — |

Evolution effects:
- Full heal on evolution
- Camera flash (magenta) + screen shake
- Particle burst from ace position
- Floating "★ Name ★" announcement text
- Sprite scale increase per stage
- Stat multipliers applied relative to previous stage

### Companion Auto-Evolution
Companions automatically evolve every 5 waves cleared:
- Uses the same evolution chain data
- Scale + ATK boost applied
- Particle burst on evolution

### Evolution as a Choice
Evolution is presented as a level-up card choice (magenta border, top priority) rather than automatic — the player might prefer a companion or stat boost instead.

---

## Files Changed
- `src/scenes/GameScene.ts`
  - Added `EVOLUTION_CHAINS` data (6 Pokemon, up to 3 stages each)
  - Added `aceEvoStage`, `companionEvoStages` tracking
  - Added `evolveAce()` with visual effects
  - Added `evolveCompanion()` for auto-evolve
  - Modified `showLevelUpSelection()` to include evolution choice
  - Modified `showWaveClearText()` to trigger companion evolution every 5 waves
  - Modified `resetState()` to reset evolution tracking

## Next Steps
- Final balance pass
- Performance optimization
- More polish effects
