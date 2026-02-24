# 20. v1.0.0 Release

**Date**: 2026-02-24
**Phase**: 20 — Release

---

## What was implemented

### Title Screen Enhancements
- **Achievement counter**: Shows "★ X/13 Achievements" below high score
- **Fade in**: Smooth 600ms fade from black on scene load
- **Version**: Updated to `v1.0.0 — Release`

### Complete Feature Summary (Phases 1-20)

**Core Gameplay**
- Joystick controls, auto-attack, XP/leveling system
- Wave-based enemy spawning with 4 behavior patterns (chase, circle, charge, swarm)
- Multi-shot projectiles (3/5-way spread at Lv7/15)
- Pierce scaling with evolution stage
- Boss fights every 5-minute cycle
- Cycle → Legion system (infinite progression)

**Pokemon**
- 9 PMD-style Pokemon sprites with 8-directional walk animations
- Evolution system (6 Pokemon with evolution chains)
- Companion Pokemon with 3 attack types (projectile, orbital, area)
- Auto-evolution for companions every 5 waves

**Combat & Items**
- Elite enemies (gold, 2.5x HP, higher drops)
- 3 item types: Heal, Bomb, Magnet
- Kill streak combos with announcements
- Death particles, screen shake, camera flash

**UI & Polish**
- Title screen with floating sprites + Pikachu mascot
- Minimap radar + aim indicator
- Danger vignette at low HP
- Pause menu with volume controls
- Level-up card selection with portraits
- Wave clear announcements
- Cycle results screen with party summary

**Audio**
- Procedural 8-bit SFX (7 sound types)
- BGM loop (bass + arpeggio)
- Master volume control

**Persistence**
- 13 achievements with popup banners
- High score tracking (kills, wave, level, cycle)
- localStorage persistence

---

## Total Stats
- **Lines of code**: ~2700+ (GameScene alone)
- **Files**: 6 TypeScript source files
- **Commits**: 20 phases
- **Features**: 50+ distinct gameplay features
