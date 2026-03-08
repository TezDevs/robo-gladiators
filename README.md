# Robo Gladiator Arena

A refactored version of the original prompt-based Robo Gladiators project, now upgraded into a real-time browser arena minigame built with HTML5 Canvas and modular JavaScript.

## Quick Start

1. Clone the repo.
2. Open `/Users/courtezcannady/code/dh/robo-gladiator/index.html` in a browser.
3. For best module compatibility, run a local server:

```bash
cd /Users/courtezcannady/code/dh/robo-gladiator
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Controls

- Desktop movement: `WASD` or Arrow keys
- Desktop attack: `Space` or click/tap arena to fire
- Pause/Resume: `P`
- Mobile: on-screen move pad + fire button (shown on coarse-pointer devices)

## Gameplay Loop

1. Start a run and enter the arena.
2. Fight real-time enemy waves.
3. Survive arena hazards.
4. Clear wave and earn scrap rewards.
5. Spend scrap in the upgrade hangar.
6. Progress through rounds to a boss finale.

Session target: about 3–5 minutes.

## Implemented Systems

- Real-time movement and projectile combat
- Enemy AI chase + contact damage
- Health systems with visible bars
- Round-based progression and boss round
- Scrap economy and upgrade shop:
  - Chassis: boosts max health
  - Weapon: increases damage
  - Sensor: improves crit/dodge and fire rate
- Arena hazards:
  - Sweeping laser
  - Electric tiles
  - Rotating obstacles
  - Shrinking safe arena boundary
- UI flow:
  - Start screen
  - Arena HUD
  - Upgrade screen
  - Game-over screen
  - Restart flow
- Feedback polish:
  - Floating damage numbers
  - Spark particles
  - Screen shake + hit flash
  - Audio hook system (placeholder events)

## Architecture

Project is now split into modular systems for maintainability and future packaging:

- `/Users/courtezcannady/code/dh/robo-gladiator/assets/js/main.js`:
  - App bootstrap and DOM wiring
- `/Users/courtezcannady/code/dh/robo-gladiator/assets/js/core/`:
  - `constants.js`, `utils.js`, `game.js` (orchestration/state machine)
- `/Users/courtezcannady/code/dh/robo-gladiator/assets/js/entities/`:
  - Player, Enemy, Projectile, floating text, particles
- `/Users/courtezcannady/code/dh/robo-gladiator/assets/js/systems/`:
  - Input, Combat, Hazards, Renderer, UI, Audio hooks
- `/Users/courtezcannady/code/dh/robo-gladiator/assets/css/styles.css`:
  - Responsive game shell and UI styling

## Refactor Notes (from legacy code)

Reusable concepts retained from the original prompt game:

- Randomized combat values
- Named player bot
- Round progression
- Shop/upgrade economy
- High-score persistence via `localStorage`

Legacy prompt-based flow has been replaced by a state-driven real-time loop.

## Changed Files Summary

- `/Users/courtezcannady/code/dh/robo-gladiator/index.html`
  - Replaced prompt-only shell with canvas and full UI screens.
- `/Users/courtezcannady/code/dh/robo-gladiator/assets/css/styles.css`
  - Added responsive visual layout and HUD/screen styling.
- `/Users/courtezcannady/code/dh/robo-gladiator/assets/js/main.js`
  - Added bootstrap entry point for the modular game.
- `/Users/courtezcannady/code/dh/robo-gladiator/assets/js/core/constants.js`
  - Added tunable gameplay constants.
- `/Users/courtezcannady/code/dh/robo-gladiator/assets/js/core/utils.js`
  - Added shared math/helpers.
- `/Users/courtezcannady/code/dh/robo-gladiator/assets/js/core/game.js`
  - Added main state machine and gameplay loop orchestration.
- `/Users/courtezcannady/code/dh/robo-gladiator/assets/js/entities/entities.js`
  - Added player/enemy/projectile/effect data models.
- `/Users/courtezcannady/code/dh/robo-gladiator/assets/js/systems/input.js`
  - Added keyboard + touch-ready input abstraction.
- `/Users/courtezcannady/code/dh/robo-gladiator/assets/js/systems/combat.js`
  - Added combat resolution and hit interactions.
- `/Users/courtezcannady/code/dh/robo-gladiator/assets/js/systems/hazards.js`
  - Added arena hazard framework and round scaling.
- `/Users/courtezcannady/code/dh/robo-gladiator/assets/js/systems/renderer.js`
  - Added canvas rendering and visual feedback effects.
- `/Users/courtezcannady/code/dh/robo-gladiator/assets/js/systems/ui.js`
  - Added HUD and screen state control.
- `/Users/courtezcannady/code/dh/robo-gladiator/assets/js/systems/audio.js`
  - Added sound event hook placeholder.

## Mobile Packaging Readiness Recommendations

Current implementation already supports several mobile-forward decisions:

- Fixed internal render resolution with responsive display scaling
- Touch control mapping via input abstraction
- Pause handling on blur/visibility change
- No ads/tracking/accounts/data collection
- Lightweight stack (HTML/CSS/JS + canvas)

Recommended next steps before app-store packaging:

1. Add dedicated touch joystick and aim reticle UX polish.
2. Add app lifecycle persistence (save run state on suspend).
3. Add explicit pause menu and settings page.
4. Add sprite/audio asset pipeline and optional low-effects mode.
5. Wrap with Capacitor or Cordova and test performance on low-end devices.
