# Poke Survivor - Development Log

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
