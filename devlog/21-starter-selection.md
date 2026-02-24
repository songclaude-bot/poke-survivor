# 21. Starter Pokémon Selection

**Date**: 2026-02-24
**Phase**: 21 — Starter Selection

---

## What was implemented

### Title Screen Starter Selection
- **3 starter cards** on the title screen: Pikachu, Charmander, Squirtle
- Each card shows: portrait, name, stat description (ATK/HP/SPD stars)
- Interactive selection — tap a card to highlight it with gold border
- Selected starter is passed to GameScene via scene data

### Per-Starter Base Stats
Each starter has unique base stats creating different playstyles:

| Starter    | HP  | ATK | Speed | Range | Cooldown | Playstyle |
|------------|-----|-----|-------|-------|----------|-----------|
| Pikachu    | 100 | 10  | 160   | 120   | 800ms   | Balanced  |
| Charmander | 80  | 14  | 160   | 130   | 700ms   | Attacker  |
| Squirtle   | 130 | 8   | 150   | 110   | 900ms   | Tank      |

### Cycle Persistence
- Starter key is preserved through cycle transitions via `scene.restart()` data
- Correct starter stats are applied on every new cycle

---

## Files Changed
- `src/scenes/TitleScene.ts`
  - Added `StarterInfo` interface and `STARTERS` array
  - Added interactive starter card UI with portraits and descriptions
  - Pass `starterKey` to GameScene on start
- `src/scenes/GameScene.ts`
  - Added `STARTER_STATS` static data with per-Pokemon base stats
  - Modified `CyclePassData` to include `starterKey`
  - Modified `init()` to accept and store `starterKey`
  - Modified `createAce()` to use starter-specific stats
  - Updated `startNextCycle()` to pass `starterKey` through cycle restart
