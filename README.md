# ShooterGTU

A 2D action platformer game built with Phaser 3, featuring dynamic combat, enemy AI, and procedurally generated levels.

## Features

- **Dynamic Combat System**: Fast-paced shooting mechanics with various enemy types
- **Intelligent Enemy AI**: Multiple enemy types with unique behaviors and attack patterns
  - Melee Warriors: Close combat enemies with strategic approach patterns
  - Drones: Flying enemies with ranged attacks
  - Slimes: Basic enemies with simple movement patterns
- **Level Design**: 
  - Two main game scenes with unique challenges:
    - Game Scene 1: Classic platformer experience
    - Combined GTU Level: Advanced challenges and mechanics
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
  - Developer Hub for testing and debugging
- **Technical Features**:
  - Robust debug system
  - Camera management with smooth following
  - Collision detection and handling
  - State management system
  - Advanced pathfinding for enemies
  - Particle effects system
  - Sound testing system

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

## Development Setup

### Requirements

- [Node.js](https://nodejs.org) for dependency management
- Modern web browser with WebGL support
- VS Code (recommended) with extensions:
  - ESLint
  - Prettier
  - JavaScript (ES6) code snippets
  - Path Intellisense
  - GitLens
  - Phaser Editor 2D
  - Live Server
  - Error Lens
  - Import Cost
  - Todo Tree
  - Color Highlight

### Installation

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
| `npm test` | Run Jest tests |
| `npm run test:watch` | Run Jest tests in watch mode |
| `npm run test:e2e` | Run Cypress E2E tests |
| `npm run test:e2e:headless` | Run Cypress E2E tests headless |

## Development

The development server runs on `http://localhost:8080` by default. The game supports hot-reloading for quick development workflow.

### Code Style

The project uses ESLint and Prettier for code formatting with the following key rules:
- 2 spaces for indentation
- Single quotes for strings
- Semicolons required
- 100 character line length limit
- camelCase for variables and functions
- PascalCase for classes

## Controls

- **Movement**: Arrow keys / WASD
- **Jump**: Space
- **Shoot**: Left mouse button
- **Pause**: ESC

## Testing

- Unit tests using Jest
- End-to-end tests using Cypress
- Sound testing available in Developer Hub

## Credits

Built with:
- [Phaser 3.87.0](https://github.com/phaserjs/phaser)
- [Webpack 5.91.0](https://github.com/webpack/webpack)

## Analysis Tools

For code analysis on Windows:
```bash
node scripts/analyze_windows.js
```

For code analysis on Linux:
```bash
# Make the script executable (only needed once)
chmod +x scripts/analyze_linux.sh

# Run the analysis
./scripts/analyze_linux.sh
```

The analysis will generate reports in the `analysis` directory:
- `summary.md`: Complete overview of the codebase analysis
- Individual analysis files for specific aspects:
  - `scene_hierarchy.txt`: All scene classes
  - `manager_classes.txt`: All manager classes
  - `event_handlers.txt`: Event handler methods
  - `update_methods.txt`: Update method implementations
  - `collision_handlers.txt`: Collision-related code
  - `constructor_patterns.txt`: Constructor implementations

## Last Updated
January 12, 2025