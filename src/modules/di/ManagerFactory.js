import { GameStateManager } from '../managers/state/GameStateManager';
import { PersistenceManager } from '../managers/state/PersistenceManager';
import { SoundManager } from '../managers/audio/SoundManager';
import { MusicManager } from '../managers/audio/MusicManager';
import { EntityManager } from '../managers/entities/EntityManager';
import { EnemyManager } from '../managers/entities/EnemyManager';
import { HazardManager } from '../managers/entities/HazardManager';
import { LDTKEntityManager } from '../managers/LDTKEntityManager';
import { LDTKTileManager } from '../managers/LDTKTileManager';
import { AnimationManager } from '../managers/AnimationManager';
import { EffectsManager } from '../managers/EffectsManager';
import { SceneBoundaryManager } from '../managers/BoundaryManager';
import { DebugSystem } from '../../_Debug/DebugSystem';
import { CollisionManager } from '../managers/CollisionManager';
import { EventManager } from '../managers/EventManager';
import { AssetManager } from '../managers/AssetManager';
import { container } from './ServiceContainer';
import { eventBus } from '../events/EventBus';
import { UIManager } from '../../scenes/elements/UIManager';
import Enemy from '../../prefabs/Enemy';
import { Bitcoin } from '../../prefabs/Bitcoin';
import { Slime } from '../../prefabs/Slime';
import { Drone } from '../../prefabs/Drone';
import Trampoline from '../../prefabs/Trampoline';
import { Trap } from '../../prefabs/Trap';
import { DestructibleBlock } from '../../prefabs/DestructibleBlock';
import { FallingDestructibleBlock } from '../../prefabs/FallingDestructibleBlock';
import { DisappearingPlatform } from '../../prefabs/DisappearingPlatform';
import { Turret } from '../../prefabs/Turret';
import MeleeWarrior from '../../prefabs/MeleeWarrior';
import { Zapper } from '../../prefabs/enemies/Zapper';
import { BulletManager } from '../../modules/managers/BulletManager';
import { BulletPool } from '../../modules/managers/pools/BulletPool';
import { CameraManager } from '../../modules/managers/CameraManager';

export class ManagerFactory {
    static createManagers(scene) {
        // Register core dependencies
        container.register('scene', scene);
        container.register('eventBus', eventBus);
        
        // Create and register asset manager
        const assets = new AssetManager(scene);
        container.register('assets', assets);
        
        // Create and register state managers
        const gameState = new GameStateManager(scene);
        const persistence = new PersistenceManager(gameState);
        
        // Create and register audio managers
        const sound = new SoundManager(scene);
        const music = new MusicManager(scene);
        
        // Create and register entity managers
        const entityManager = new EntityManager(scene);
        const ldtkEntityManager = new LDTKEntityManager(scene);
        
        // Register entity factories with LDTKEntityManager
        ldtkEntityManager.registerEntityFactories({
            Enemy: (scene, x, y, fields) => new Enemy(scene, x, y),
            Bitcoin: (scene, x, y, fields) => new Bitcoin(scene, x, y),
            Slime: (scene, x, y, fields) => new Slime(scene, x, y),
            Drone: (scene, x, y, fields) => new Drone(scene, x, y),
            Trampoline: (scene, x, y, fields) => new Trampoline(scene, x, y),
            Trap: (scene, x, y, fields) => new Trap(scene, x, y),
            DestructibleBlock: (scene, x, y, fields) => new DestructibleBlock(scene, x, y),
            FallingDestructibleBlock: (scene, x, y, fields) => new FallingDestructibleBlock(scene, x, y),
            DisappearingPlatform: (scene, x, y, fields) => new DisappearingPlatform(scene, x, y),
            Turret: (scene, x, y, fields) => new Turret(scene, x, y),
            MeleeWarrior: (scene, x, y, fields) => new MeleeWarrior(scene, x, y),
            Zapper: (scene, x, y, fields) => new Zapper(scene, x, y),
            PlayerStart: (scene, x, y, fields) => ({ x, y, type: 'PlayerStart' }) // Just store position
        });

        const enemies = new EnemyManager(scene);
        const hazards = new HazardManager(scene);
        
        // Create and register other managers
        const animations = new AnimationManager(scene);
        const effects = new EffectsManager(scene);
        const boundaries = new SceneBoundaryManager(scene);
        const debug = new DebugSystem(scene);
        const collision = new CollisionManager(scene);
        const ui = new UIManager(scene);
        
        // Get or create event manager
        let events = scene.game.globalEventManager;
        if (!events) {
            console.warn('Global EventManager not found, creating new instance');
            events = new EventManager(scene);
            scene.game.globalEventManager = events;
        }

        // Register all managers
        container.register('gameState', gameState);
        container.register('persistence', persistence);
        container.register('sound', sound);
        container.register('music', music);
        container.register('entityManager', entityManager);
        container.register('ldtkEntityManager', ldtkEntityManager);
        container.register('enemies', enemies);
        container.register('hazards', hazards);
        container.register('animations', animations);
        container.register('effects', effects);
        container.register('boundaries', boundaries);
        container.register('debug', debug);
        container.register('collision', collision);
        container.register('ui', ui);
        container.register('events', events);

        // Initialize managers that need it
        events.initialize();
        assets.initialize();
        
        return {
            assets,
            gameState,
            persistence,
            sound,
            music,
            entityManager,
            ldtkEntityManager,
            enemies,
            hazards,
            animations,
            effects,
            boundaries,
            debug,
            collision,
            events,
            ui
        };
    }

    static getAnimationManager() {
        if (!this.animationManager) {
            this.animationManager = new AnimationManager();
        }
        return this.animationManager;
    }

    static getEventManager() {
        if (!this.eventManager) {
            this.eventManager = new EventManager();
        }
        return this.eventManager;
    }
        
    static bulletManager = null;
    
    static getBulletManager(scene) {
        if (!this.bulletManager) {
            this.bulletManager = new BulletManager(scene); // Pass scene here
        }
        return this.bulletManager;
    }

    static getBulletPool() {
        if (!this.bulletPool) {
            this.bulletPool = new BulletPool();
        }
        return this.bulletPool;
    }

    static musicManager = null;

    static getMusicManager(scene) {
        if (!this.musicManager) {
            this.musicManager = new MusicManager(scene);
        }
        return this.musicManager;
    }

    static cameraManager = null;

    static getCameraManager(scene) {
        if (!this.cameraManager) {
            this.cameraManager = new CameraManager(scene);
        }
        return this.cameraManager;
    }

    static ldtkEntityManager = null;

    static getLDTKEntityManager(scene) {
        if (!this.ldtkEntityManager) {
            this.ldtkEntityManager = new LDTKEntityManager(scene);
        }
        return this.ldtkEntityManager;
    }

    static ldtkTileManager = null;

    static getLDTKTileManager(scene) {
        if (!this.ldtkTileManager) {
            this.ldtkTileManager = new LDTKTileManager(scene);
        }
        return this.ldtkTileManager;
    }

    static uiManager = null;

    static getUIManager(scene) {
        if (!this.uiManager) {
            this.uiManager = new UIManager(scene);
        }
        return this.uiManager;
    }

}
