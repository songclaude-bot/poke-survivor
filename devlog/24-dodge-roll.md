# 24. Dodge Roll + Invincibility Frames

**Date**: 2026-02-24
**Phase**: 24 — Dodge Roll

---

## What was implemented

### Dodge/Dash Mechanic
- **Trigger**: Tap the right side of the screen (or the DODGE button)
- **Effect**: Quick dash in joystick direction at 400 speed
- **I-frames**: 0.25 seconds of complete invincibility during dash
- **Cooldown**: 1.5 seconds between dodges
- Falls back to downward dash if no joystick input

### Visual Feedback
- Player sprite becomes semi-transparent (alpha 0.4) during dodge
- DODGE button on bottom-right corner of screen
- Button dims and grays out when on cooldown
- Sound effect plays on dodge activation

### Combat Integration
- `damageAce()` returns early during dodge — complete damage immunity
- Adds a skill-based survival mechanic for higher difficulty cycles
- Works with existing contact damage and any future projectile mechanics

---

## Files Changed
- `src/scenes/GameScene.ts`
  - Added dodge state fields: `isDodging`, `dodgeTimer`, `dodgeCooldown`
  - Added static constants: `DODGE_DURATION`, `DODGE_COOLDOWN`, `DODGE_SPEED`
  - Added `dodgeBtn` UI element
  - Added `tryDodge()` method
  - Updated `updateAceMovement()`: dodge timer management, visual updates
  - Updated `damageAce()`: i-frame check
  - Updated joystick input: right-side tap triggers dodge
