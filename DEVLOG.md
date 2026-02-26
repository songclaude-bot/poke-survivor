# Poke Survivor - Development Log

## 2026-02-26 (Session 11) — Critical Fixes: syncBack, Buttons, XP, Attack Freeze, Photosensitivity

### Changes
- **syncBack ROOT CAUSE FIXED (commit bb6e343)**: `update()` captured `const c = this.ctx` BEFORE scene methods ran, then `syncBack(c)` overwrote `this.waveNumber` back to 0 from stale snapshot — causing `showWarning("Wave 1")` to fire EVERY FRAME (60× red flash rectangles/sec = opaque red screen). Fix: moved ctx capture AFTER scene methods; removed wave/boss/spawn fields from syncBack.
- **Buttons unclickable FIXED (commit eecd436)**: Container+Zone with `scrollFactor(0)` — Phaser hit-testing uses world coords that don't match when camera at (1500,1500). Fix: position containers at `(scrollX, scrollY)` in world space, remove scrollFactor(0).
- **XP not registering FIXED (commit eecd436)**: `handleCollectXpGem` called `this.ctx` twice — each creates NEW object, so xp++ on first ctx lost when syncing from second. Fix: capture ctx ONCE.
- **Machop attack freeze FIXED (commit b3e7eb2)**: `sprite.once("animationcomplete")` unreliable in Phaser 3.90 — never fires, leaving sprite frozen. Replaced with `setTimeout` using calculated frame count / frame rate. Also fixed `playHitEffect` and `playMeleeEffect` in AttackEffects.ts.
- **Photosensitivity safety overhaul (commit b3e7eb2)**: All flash/shake effects drastically reduced:
  - `cameras.main.flash()` RGB values reduced ~70% across 7 call sites
  - `cameras.main.shake()` removed for elite/streak kills, reduced for boss
  - Danger vignette: slower pulse (0.005→0.002), lower opacity (0.2→0.06), thinner border
  - Warning flash rectangle alpha 0.15→0.06
  - Boss-defeat overlay alpha 0.2→0.08

### Commits
| Commit | Description |
|--------|-------------|
| `bb6e343` | Fix root cause: syncBack overwrote wave/boss state every frame |
| `eecd436` | Fix buttons unclickable + XP not registering |
| `b3e7eb2` | Fix Machop attack freeze + reduce all flash/shake effects |

### Critical Architecture: this.ctx creates NEW object every call
- `this.ctx` is a getter that creates a new snapshot each invocation
- Calling `this.ctx` twice = two separate objects; mutations on one are invisible to the other
- ALWAYS capture `const c = this.ctx` ONCE, operate on it, then `syncBack(c)` from the SAME reference

---

## 2026-02-26 (Session 10) — Critical Bug Fixes & UI Polish

### Changes
- **Wave 1 stuck text ROOT CAUSE FIXED**: Tutorial overlay's `setInteractive()` + `setScrollFactor(0)` combo is broken in Phaser 3.90. When camera follows the ace at world (1500,1500), hit-testing on scrollFactor(0) objects fails because Phaser transforms pointer to world coords, which don't intersect the overlay's world position. Fix: `this.input.once("pointerdown")` instead of `overlay.setInteractive()` + `overlay.once("pointerdown")`.
- **Phaser tween onComplete completely removed**: All `tweens.add`/`tweens.chain` onComplete callbacks replaced with `setTimeout`. This fixed:
  - `showWarning` text never disappearing (UIManager.ts)
  - Enemy spawn pop-in (scale 0 → 1) never completing (EnemyManager.ts)
  - `createButton` onClick never firing through tween press animation (UIComponents.ts)
- **Blurry text fixed**: `pixelArt: false`, `antialias: true`, `roundPixels: true` in Phaser config
- **Stat bars layout**: 2×2 grid layout replacing vertical list to avoid overlapping evolution names
- **Pokédex sprites fixed**: New `findIdleFrame()` method finds Walk/Idle frame instead of alphabetically-first Attack frame. 5 columns, 68px cells.
- **Shop icon clipping fixed**: Icons shifted down, proper padding
- **All lobby tabs**: Top padding increased (8-10px → 18px) from header
- **Pause/death buttons styled**: Replaced `[text]` buttons with `createButton()`/`createPanel()`
- **cycleNumber reset fix**: `data?.cycleNumber ?? 1` instead of conditional assignment (fixes carry-over from previous run)

### Commits
| Commit | Description |
|--------|-------------|
| `2e6dba6` | Fix blurry text: pixelArt:false + antialias:true + roundPixels:true |
| `842c0ec` | Fix stat bars overlapping evolution names (2×2 layout) |
| `a1fbfd0` | Fix Pokédex wrong sprites (Walk/Idle frame finder, 5 cols) |
| `c9edf88` | Fix Shop icon clipping + top padding all tabs |
| `a29514a` | Replace pause/death [text] buttons with styled UI |
| `fb42f6e` | showWarning: setTimeout instead of Phaser timers |
| `8a2f154` | Tutorial overlay hit-test fix (root cause) + cycleNumber reset |
| `2b8b25d` | Fix enemy spawn, button clicks, and card layout |

### Critical Phaser 3.90 Lessons
1. **scrollFactor(0) + setInteractive() = BROKEN** when camera is offset from world origin. Always use `scene.input.once()` for fixed-UI click handling.
2. **tweens.add onComplete is UNRELIABLE** — use `setTimeout` for guaranteed callbacks.
3. **Scene instances are reused** — `scene.start()` does NOT create new instance. Reset all state in `init()`.

---

## 2026-02-25 (Session 9) — Lobby Overhaul & Meta Progression

### Changes
- **LobbyScene fully rewritten** — tab-based hub with 4 tabs:
  - **Play tab**: Grid starter selection (5-column), detail card with evo chain preview, coin unlock for locked starters
  - **Shop tab**: 8 permanent upgrades (HP, ATK, Speed, XP Gain, Crit, Regen, Magnet, Coin Bonus) with scaling costs
  - **Pokédex tab**: Full pokemon grid with encountered/undiscovered display, auto-populated from enemy kills
  - **Records tab**: Stats overview + achievement viewer with star/check badges
- **UI Component system** (`src/ui/UIComponents.ts`):
  - `createButton()` — styled buttons with hover/press animations (replaces `[text]` style)
  - `createPanel()` — rounded card backgrounds
  - `createTabBar()` — bottom tab navigation with active indicators
  - `createCoinBadge()` — coin display with icon
  - `enableVerticalScroll()` — scrollable container helper
- **SaveData expanded**:
  - `upgradeLevels: Record<string, number>` — permanent upgrade progression
  - `pokedex: string[]` — encountered pokemon tracking
  - `totalRuns: number` — run counter
  - `STARTER_COIN_COST` — alternative coin-based starter unlocking
  - `UPGRADES` — 8 upgrade definitions with scaling costs
  - `getUpgradeBonus()` / `getUpgradeCost()` — pure utility functions
- **GameScene integration**:
  - `createAce()` applies permanent upgrade bonuses (HP, ATK, Speed)
  - `getEarnedCoins()` applies coin bonus upgrade
  - Enemy kills recorded to pokedex on death
  - Pokedex saved on run end

### Architecture
```
LobbyScene (tab-based hub)
  ├── Play: Grid select → detail card → START
  ├── Shop: 8 permanent upgrades (coin sink)
  ├── Pokédex: All species grid (enemy kills tracked)
  └── Records: Stats + achievements
UIComponents (reusable)
  ├── createButton (hover/press fx)
  ├── createPanel (rounded cards)
  ├── createTabBar (bottom nav)
  └── createCoinBadge
```

### Meta Progression Loop
```
Run → Earn Coins → Shop Upgrades → Stronger Runs → More Coins
                  → Unlock Starters (coin OR achievement)
                  → Fill Pokédex (enemy kills)
```

---

## 2026-02-24 (Session 8) — Full Manager Refactoring

### Changes
- **GameScene.ts refactored from 3649 → 1298 lines** (64% reduction)
- **4 manager modules created** (functional/declarative style):
  - `CombatManager.ts` (663 lines) — projectiles, hit handling, damage, skills, items, XP, evolution
  - `EnemyManager.ts` (478 lines) — spawning, AI movement, formations, boss logic
  - `UIManager.ts` (304 lines) — HUD, minimap, danger vignette, warnings, damage popups, particles
  - `CompanionManager.ts` (228 lines) — companion add/update/evolve, legion update
- **Data layer extracted**:
  - `GameTypes.ts` (137 lines) — all shared interfaces and types
  - `GameData.ts` (231 lines) — pure constants and utility functions
  - `GameContext.ts` (122 lines) — shared context interface between scene and managers
- **Removed all duplicate data**: inline ENEMY_POOL, behavior Sets, BOSS_POOL, COMPANION_POOL, formatTime, getDungeonName, getDifficultyLabel — now single-source in GameData.ts
- **Achievement check fix**: Now uses proper GameStats snapshot instead of passing `this`

### Architecture
```
GameScene (orchestrator, 1298 lines)
  ├── GameContext (shared interface)
  ├── CombatManager (combat logic)
  ├── EnemyManager (spawn + AI)
  ├── CompanionManager (companions + legions)
  ├── UIManager (HUD + effects)
  ├── GameData (constants)
  └── GameTypes (interfaces)
```

### Technical Notes
- Each manager exports pure functions that receive GameContext
- GameScene creates a `ctx` getter that snapshots current state for managers
- `syncBack()` method writes manager mutations back to scene state
- Callback bridges (onEnemyDeath, damageAce, fireProjectile) handle cross-manager interactions
- Zero TypeScript errors, Vite build passes clean

---

## 2026-02-24 (Session 7) — Lobby Scene, Coin Economy, Unique Skills & Machop Easter Egg

### Changes
- **LobbyScene**: New hub between runs (Title → Lobby → Game → death → Lobby)
  - Coin counter display with persistent savings
  - Starter card selection with swipe navigation (arrows + swipe gesture)
  - Passive skill description per starter shown on card
  - Stat bars (HP, ATK, SPD, RNG) with visual fill
  - High score, achievement count, Pokédex progress display
  - BGM plays in lobby
- **Coin economy**: Earn coins per run (kills/10 + waves×5 + (cycle-1)×10 + level×2)
  - Coins persist via SaveData localStorage
  - Displayed on death screen and lobby
- **15 unique starter skills** (passive abilities):
  - Static (Pikachu): 10% paralyze on hit
  - Blaze (Charmander): ATK +30% when HP < 30%
  - Torrent (Squirtle): -25% damage taken when HP > 70%
  - Overgrow (Bulbasaur): Regen 1% max HP every 3s
  - Levitate (Gastly): 1s phase-through after taking damage
  - Sturdy (Geodude): Survive one fatal hit per wave
  - Adaptability (Eevee): Level-up stat boosts 20% stronger
  - Leaf Guard (Chikorita): -15% damage with companions
  - Flash Fire (Cyndaquil): +1% ATK per kill (max 30%)
  - Sheer Force (Totodile): +1 projectile pierce
  - Unburden (Treecko): +50% speed for 3s after kill
  - Speed Boost (Torchic): +5% attack speed every 30s
  - Damp (Mudkip): Slow nearby enemies 20%
  - Inner Focus (Riolu): 3x crit damage instead of 2x
  - Guts (Machop): ATK +50%, speed -20%, melee range
- **Machop easter egg**: Hidden semi-transparent Machop in lobby corner, tap 5× to unlock
  - Machop → Machoke → Machamp evolution chain
  - FIGHTING type attacks
- **TitleScene simplified**: Now just splash screen → LobbyScene

### Technical Notes
- Skills use effectId-based system — init in createAce(), runtime in update/damage/kill handlers
- updateSkillEffects() runs each frame for periodic effects (regen, speed boost timer, etc.)
- Adaptability multiplier applies to all level-up stat choices (ATK/HP/SPD)
- Damp applies velocity reduction per-frame to nearby enemies

---

## 2026-02-24 (Session 6) — Massive Pokemon Expansion (200+ Species)

### Changes
- **200+ pokemon registered**: Complete Gen 1 national dex (151), plus 60+ from Gen 2, 60+ from Gen 3, 40+ from Gen 4, 40+ from Gen 5
- **14 selectable starters**: Pikachu, Charmander, Squirtle, Bulbasaur, Gastly, Geodude, Eevee, Chikorita, Cyndaquil, Totodile, Treecko, Torchic, Mudkip, Riolu
- **Full 3-stage evolution chains**: All starters now evolve to final form (Charizard, Blastoise, Venusaur, Gengar, Golem, Typhlosion, Blaziken, etc.)
- **5-tier enemy system**: Tier 0 (bugs/rodents) → Tier 1 (mid) → Tier 2 (evolved) → Tier 3 (elite) → Tier 4 (pseudo-legends/tanks)
- **33 legendary bosses**: Articuno, Zapdos, Moltres, Mewtwo, Raikou, Entei, Suicune, Lugia, Ho-Oh, Groudon, Kyogre, Rayquaza, Dialga, Palkia, Giratina, Reshiram, Zekrom, and more
- **8 new unlock achievements**: wave_8, wave_10, cycle_3/4/5, time_600, kill_500/1000
- **Behavior system refactored**: Static Sets for O(1) lookup, 4 categories: swarm/circle/ranged/charge (default: chase)
- **Attack types for all starters**: GHOST, ROCK, NORMAL, FIGHTING, etc.

### Technical Notes
- Adding a pokemon is now just `key: { id: "XXXX", name: "Name" }` — one line
- PAC atlas format means zero per-pokemon debugging for frame sizes
- Tier progression: T0 (0-45s) → T1 (45-90s) → T2 (90-150s) → T3 (150-220s) → T4 (220s+)
- Behavior lookup using `Set.has()` instead of object map — faster for 200+ pokemon

### Stats
- 4 files changed, 631 insertions, 141 deletions
- Commit: `a8050eb`

---

## 2026-02-24 (Session 5) — Pokemon Auto Chess Atlas Migration

### Changes
- **Sprite system overhaul**: Migrated from PMDCollab raw spritesheets to Pokemon Auto Chess pre-packed TexturePacker multiatlas format
  - `load.spritesheet()` → `load.multiatlas()` — no more manual frameWidth/frameHeight
  - Walk + Attack + Idle + Hurt all in one atlas per pokemon — no texture swapping needed
  - Auto-discovers animations by scanning atlas frame names at runtime
  - Texture key prefix changed from `pmd-` to `pac-`
- **Pokemon roster expanded to 80+**: Gen 1-3 coverage with chikorita, cyndaquil, totodile, treecko, torchic, mudkip, ralts, bagon, beldum, and many more
- **Attack system simplified**: Attack animations play from same atlas texture — no more `setTexture()` swap between walk/attack spritesheets
- **Evolution simplified**: Just play new animation from evolved pokemon's atlas, update pokemonKey

### Technical Notes
- Source: `keldaanCommunity/pokemonAutoChess` (GPL-3.0) — `app/public/src/assets/pokemons/{id}.json` + `{id}.png`
- Atlas frame naming: `Normal/{Action}/Anim/{Dir 0-7}/{FrameIdx 0000}`
- Frame dimensions vary per action within same pokemon — atlas handles it all
- This permanently fixes the "wrong frame dimensions" class of bugs that plagued sessions 1-4
- Vite build needs `--max-old-space-size=4096` due to larger bundle (80+ pokemon configs)

### Stats
- 3 files changed, 264 insertions, 346 deletions (net reduction!)
- Commit: `f24d0fc`

---

## 2026-02-24 (Session 4) — Enemy Formations, Pokemon Expansion, Evolution Fix

### Changes
- **Evolution sprite fix (3rd attempt, final)**: Root cause was `this.ace.pokemonKey` never updating after evolution. Also cleared stale `animationcomplete` listeners that could overwrite the evolved texture. Now properly: stops animation → removes listeners → setTexture with frame 0 → updates pokemonKey.
- **Enemy formation events**: Added 3 Vampire Survivors-style formation patterns:
  - Encirclement: Ring of enemies spawns around player and closes in
  - Diagonal March: Line of enemies marches diagonally across the screen
  - Rush Swarm: Wave of enemies rushes from one direction
  - Triggered every 2 waves starting from wave 2
- **Pokemon roster expansion**: Added 29 new pokemon sprites (all frame dimensions verified via PIL). Enemy pool expanded from 7 to 40+ across 4 difficulty tiers. Boss pool expanded to 8. All pokemon mapped to behavior types (swarm, circle, ranged, charge, chase).
- **Cycle transition fix**: Changed from `scene.restart()` to `scene.stop()` + `scene.start()` for cleaner physics/group cleanup.
- **Mobile viewport**: Added `100dvh`, `expandParent` for proper full-screen on mobile devices.

### Technical Notes
- Evolution debugging required 3 sessions to fully fix: (1) wrong sprite frame dimensions, (2) pokemonKey not updated, (3) animationcomplete listener interference
- Formation enemy spawning uses simplified `spawnFormationEnemy()` to avoid full enemy setup overhead
- Pokemon sprite dimensions must be verified against actual PNG files — PMD SpriteCollab has inconsistent frame sizes

### Stats
- 4 files changed, 170 insertions, 18 deletions
- Commit: `114fec5`

---

## 2026-02-24 (Session 3) — Scrolling Camera World

### Changes
- **Scrolling camera**: Player roams freely in 3000x3000 world, camera follows with lerp 0.1
- **World decorations**: 200 random decorations (rocks, grass, cracks) to break up dungeon floor monotony
- **Physics bounds**: World bounds set to WORLD_WIDTH/WORLD_HEIGHT, player uses collideWorldBounds
- **UI layer**: All UI elements use `setScrollFactor(0)` to stay fixed on screen

### Technical Notes
- Most systems (enemy spawn, items, minimap) were already position-based and worked without changes
- Legion clamping updated from screen bounds to world bounds
- Player spawn moved to world center (WORLD_WIDTH/2, WORLD_HEIGHT/2)

---

## 2026-02-24 (Session 2) — Evolution Sprites, XP Magnet, Attack Restore

### Changes
- **Evolution sprite dimensions**: Verified all 6 evolution pokemon frame sizes via Python/PIL (raichu 40x48, charmeleon 24x32, wartortle 32x40, ivysaur 32x32, haunter 80x56, graveler 32x48)
- **XP magnet fix**: Added `magnetized` flag — once a gem enters magnet range, it stays pulled toward player
- **Attack pose restore**: Saves current texture key before attack, restores correct (possibly evolved) texture after

---

## 2026-02-24 (Session 1) — Evolution System, Joystick, Cycle Transition

### Changes
- **Evolution system**: Added `spriteKey` to EVOLUTION_CHAINS, setTexture on evolution, direction-aware animation using current texture
- **Joystick**: Fixed to center-bottom position (GAME_WIDTH/2, GAME_HEIGHT-100), maxDist=50
- **Level-up selection**: 100ms delay before unpausing to prevent joystick jump
- **Cycle transition**: Added `cycleTransitioning` guard against double-call
- **Dodge removal**: Cleaned up all references from tutorial and showcase page
- **Stage backgrounds**: 6 dungeon themes cycling by cycle number
- **Starter UI redesign**: Swipe card UI with stat bars
- **Pokedex unlock system**: Track and unlock starters via achievements

---

## Earlier Sessions — Foundation

- Initial game creation: Phaser 3.90, TypeScript, Vite
- Core Vampire Survivors gameplay loop: auto-attack, XP, level-up choices
- PMD SpriteCollab integration for Pokemon sprites
- 6 starter Pokemon with unique attack patterns
- 5-minute survival cycles with escalating difficulty
- Companion/legion system
- GitHub Pages deployment via Actions
- Showcase page (poke-survivor-page/)
