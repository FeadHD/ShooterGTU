# ShooterGTU

A 2D action platformer game built with Phaser 3, featuring dynamic combat, enemy AI, and procedurally generated levels.

## Features

- **Dynamic Combat System**: Fast-paced shooting mechanics with various enemy types
- **Intelligent Enemy AI**: Multiple enemy types with unique behaviors and attack patterns
  - Melee Warriors: Close combat enemies with strategic approach patterns
  - Drones: Flying enemies with ranged attacks
  - Slimes: Basic enemies with simple movement patterns
- **Level Design**: 
  - Multiple game scenes with unique challenges
  - Procedurally generated levels
  - Solid tile-based collision system
- **Game Mechanics**:
  - Player health and damage system
  - Collectible items (Bitcoins)
  - Traps and hazards
  - Alarm triggers that affect enemy behavior
- **User Interface**:
  - Pause menu system
  - Main menu with multiple options
  - Game UI showing player status
  - Mission complete screen
  - Leaderboard system
- **Technical Features**:
  - Robust debug system
  - Camera management with smooth following
  - Collision detection and handling
  - State management system
  - Advanced pathfinding for enemies
  - Particle effects system

## Project Structure

- `src/` - Source code directory
  - `prefabs/` - Game object classes (Player, Enemy, etc.)
  - `scenes/` 
    - `levels/` - Game level scenes
    - `menus/` - Menu scenes
    - `elements/` - Reusable scene elements
  - `modules/`
    - `controls/` - Input handling
    - `managers/` - Game systems (Animation, Camera, etc.)
    - `pathfinding/` - Enemy pathfinding system
  - `_Debug/` - Debugging tools
  - `config/` - Game configuration
  - `constants/` - Game constants

## Requirements

- [Node.js](https://nodejs.org) for dependency management
- Modern web browser with WebGL support

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

## Available Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install project dependencies |
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run dev-nolog` | Start development server without analytics |
| `npm run build-nolog` | Create production build without analytics |

## Development

The development server runs on `http://localhost:8080` by default. The game supports hot-reloading for quick development workflow.

## Controls

- **Movement**: Arrow keys / WASD
- **Jump**: Space
- **Shoot**: Left mouse button
- **Pause**: ESC

## Credits

Built with:
- [Phaser 3.87.0](https://github.com/phaserjs/phaser)
- [Webpack 5.91.0](https://github.com/webpack/webpack)
