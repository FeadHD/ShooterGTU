# ShooterGTU - Good Time Universe

## Overview

ShooterGTU is a dynamic 2D action platformer built with Phaser 3.87.0. Set in a cyberpunk universe, players navigate through challenging levels while battling enemies and collecting rewards.

## Features

- **Dynamic Level System**: Progressive level loading using LDtk for optimized performance
- **Advanced Audio System**: 
  - Background music for each scene
  - Sound effects for actions
  - Volume controls for both music and SFX
- **Responsive Controls**:
  - Smooth player movement
  - Precise jumping mechanics
  - Combat system with shooting mechanics
- **Modern UI**:
  - Clean, cyberpunk-themed menus
  - Interactive settings panel
  - Volume and control customization
  - Leaderboard system
- **Game Systems**:
  - Health and lives management
  - Score tracking
  - Checkpoint system
  - Enemy AI with various behaviors
  - Collision detection and physics

## Controls

- **Movement**: Arrow Keys / WASD
  - Left/Right: Move horizontally
  - Up/Space: Jump
- **Combat**:
  - Mouse Click / Space: Shoot
- **Menu**:
  - ESC: Pause game
  - Mouse: Navigate menus

## Getting Started

1. **Prerequisites**:
   ```json
   {
     "engineVersion": "Phaser 3.87.0",
     "buildTool": "Webpack 5.91.0",
     "runtime": "Node.js",
     "renderingEngine": "WebGL/Canvas",
     "dependencies": {
       "required": ["Node.js", "WebGL-enabled browser"],
       "development": ["VS Code", "ESLint", "Prettier"]
     }
   }
   ```

2. **Installation**:
   ```bash
   # Clone the repository
   git clone [repository-url]
   
   # Install dependencies
   npm install
   
   # Start development server
   npm start
   ```

## Architecture

### File Structure
```plaintext
src/
├── prefabs/           # Game object classes
│   ├── Player.js      # Player character implementation
│   ├── Enemy.js       # Base enemy class
│   └── entities/      # Specialized enemy types
├── scenes/
│   ├── levels/        # Game level scenes
│   ├── menus/         # UI scenes
│   └── elements/      # Reusable components
├── modules/
│   ├── managers/      # System managers
│   │   ├── CollisionManager.js    # Physics
│   │   ├── AnimationManager.js    # Animations
│   │   ├── AudioManager.js        # Sound system
│   │   └── UIManager.js           # Interface
│   ├── state/        # Global state management
│   └── di/           # Dependency injection
└── systems/          # Core game systems
```

### Key Systems

1. **Audio System**:
   - Background music management
   - Sound effects handling
   - Volume controls and persistence
   - Scene-specific audio

2. **Physics System**:
   - Arcade physics implementation
   - Collision detection and response
   - Platform interactions
   - Projectile management

3. **State Management**:
   - Redux-like pattern
   - Global game state
   - Scene-specific states
   - Persistent settings

4. **Level System**:
   - LDtk integration
   - Progressive loading
   - Dynamic enemy spawning
   - Checkpoint management

## Development Guidelines

1. **Code Style**:
   - Follow ESLint configuration
   - Use meaningful variable names
   - Document complex logic
   - Maintain modular structure

2. **Architecture Principles**:
   - Component-based design
   - Event-driven communication
   - Dependency injection
   - Single responsibility

3. **Performance**:
   - Optimize asset loading
   - Manage memory usage
   - Use object pooling
   - Implement progressive loading

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Phaser.js team for the game framework
- LDtk team for the level editor
- Contributors and testers