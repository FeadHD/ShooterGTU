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

### Core Components

#### Entry & Setup
- **main.js**: Entry point for the game application, handling initialization and browser events
- **Boot.js**: Initial scene for basic setup and global systems initialization
- **Game.js**: Main gameplay scene managing core mechanics (player movement, shooting, enemies, scoring)
- **Preloader.js**: Asset loading and initialization with progress tracking
- **DevHub.js**: Developer tools scene for quick access to levels and testing

#### Configuration
- **Config.js**: Core Phaser game configuration (engine, rendering, physics, scenes)
- **Constants.js**: Default entity configurations and fallback values
- **Settings.js**: Game settings management with pause menu integration
- **SoundSettings.js**: Audio configuration with interactive volume controls

#### Scene Management
- **TransitionScreen.js**: Animated scene transitions and UI overlays
- **ControlsSettingsScene.js**: Key binding customization interface

### Manager System

#### Base Managers
- **BaseManager.js**: Foundation class for dependency injection
- **ManagerFactory.js**: Factory for game system instantiation
- **ServiceContainer.js**: Dependency injection container for game services

#### Gameplay Managers
- **EnemyManager.js**: Enemy lifecycle and combat interactions
- **EntityManager.js**: Core entity tracking and lifecycle management
- **HazardManager.js**: Hazardous elements and damage system
- **TutorialManager.js**: In-game tutorial with dynamic instructions
- **Pathfinder.js**: Platform-specific movement and navigation

#### Specialized Managers
- **AudioManager.js**: Unified SFX and music management
- **CollisionManager.js**: Physics and interaction handling
- **BoundaryManager.js**: Game scene boundaries
- **CameraManager.js**: Camera control and transitions
- **BulletManager.js**: Projectile pooling and lifecycle
- **EffectsManager.js**: Visual and audio effects
- **AnimationManager.js**: Sprite animation system

#### Asset & Level Management
- **AssetManager.js**: Game asset loading and initialization
- **LDTKEntityManager.js**: LDtk level editor integration
- **LDTKTileManager.js**: Tile-based collision system
- **LevelLoader.js**: LDtk to Phaser tilemap conversion
- **GameFlowManager.js**: Game progression and state changes

### Procedural Systems
- **ProceduralSoundGenerator.js**: Real-time sound synthesis
- **ProceduralGenerator.js**: Dynamic level generation

### UI System
- **UIManager.js**: HUD and debug information
- **TextStyleManager.js**: Consistent UI styling
- **SoundTester.js**: Sound effect testing tool
- **ControlsSettings.js**: Control scheme management
- **ui-helpers.js**: Reusable UI components

### Game Objects
- **Player.js**: Core player mechanics and states
- **Enemy.js**: Base enemy functionality
- **PlayerController.js**: Input handling and controls
- **ObjectPool.js**: Object reuse system
- **BulletPool.js**: Projectile pooling
- **ParticlePool.js**: Visual effect pooling
- **Bullet.js**: Projectile physics and lifecycle

### Event System
- **EventManager.js**: Type-safe event handling

### Build System
- **webpack/config.js**: Development build configuration
- **webpack/config.prod.js**: Production optimization settings

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

3. **Level System**:
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