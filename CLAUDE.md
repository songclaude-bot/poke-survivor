# Poke Survivor — Claude Code Rules

## Project Overview
Pokemon Mystery Dungeon × Vampire Survivors roguelike mobile web game.
- **Engine**: Phaser 3 (WebGL, Arcade Physics)
- **Stack**: TypeScript + Vite 6
- **Target**: Mobile-first (390×844 viewport, capped 500px width)
- **Deploy**: GitHub Pages via GitHub Actions (`main` branch push)

## Key Paths
- `src/scenes/` — Phaser scenes (Boot, Title, Lobby, Game)
- `src/managers/` — Pure function managers (Combat, Enemy, Companion, UI, etc.)
- `src/data/` — Game data, types, save system
- `src/audio/` — SfxManager (BGM/SFX via HTMLAudioElement)
- `src/config.ts` — Constants (world size, game size, cycle duration)
- `.github/workflows/deploy.yml` — CI/CD pipeline

## Deployment Rules (MANDATORY)

### Pre-Push Checklist
Before EVERY `git push`, you MUST run:

```bash
cd <project-root> && npm run build
```

This runs `tsc && vite build` — the EXACT same command CI uses.
- `tsc` = strict TypeScript type checking (catches type errors)
- `vite build` = bundle (looser, may miss type errors)

**NEVER** use `npx vite build` alone — it skips `tsc` and will cause CI failures.

### Deployment Flow
1. Make code changes
2. Run `npm run build` — fix ALL errors before proceeding
3. `git add` changed files (specific files, not `-A`)
4. `git commit` with descriptive message
5. `git push origin main`
6. Verify CI status: `gh run list --limit 1`
7. If CI fails: check logs with `gh run view <id> --log-failed`, fix, and push again

### Common CI Pitfalls
- **TS2345**: Phaser overlap callback params are union types, not `GameObject` — cast with `as Phaser.GameObjects.GameObject`
- **OOM on CI**: CI has more RAM than local — `NODE_OPTIONS='--max-old-space-size=4096'` is set in package.json scripts
- **Missing exports**: Always verify new exports are properly imported

## Code Conventions

### Architecture
- GameScene owns all state, creates a `GameContext` snapshot each frame
- Managers are pure functions that take `GameContext` — no class instances
- Module-level variables (e.g. `_regenAccum`) must be reset on scene restart
- Use `getUpgradeBonus()` from SaveData for all shop upgrade effects

### Bug Fix Protocol
- Fix bugs sequentially, most critical first
- After each fix: run `npm run build` to verify
- Batch related fixes into one commit with detailed message
- Always check for array mutation during iteration (use collect-then-process pattern)
- Guard setTimeout/setInterval with runId or scene lifecycle checks

### Performance
- Use Map<Sprite, Data> for O(1) collision lookups, not Array.find()
- Skip rendering for invisible/unchanged elements (e.g. full-HP enemy bars)
- Clear intervals/timers in cleanup paths (stopBgm, scene shutdown)
