/**
 * ManagerFactory.js
 * Factory class responsible for creating and managing game system instances.
 * Handles dependency injection and ensures proper initialization order.
 */

import { GameStateManager } from '../managers/state/GameStateManager';
import { PersistenceManager } from '../managers/state/PersistenceManager';
import AudioManager from '../managers/AudioManager';
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

// Entity prefabs
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

// Game systems
import { BulletManager } from '../../modules/managers/BulletManager';
import { BulletPool } from '../../modules/managers/pools/BulletPool';
import { CameraManager } from '../../modules/managers/CameraManager';
export class ManagerFactory {
    /**
     * Creates and initializes all game managers for a scene
     * @param {Phaser.Scene} scene - The scene to create managers for
     * @returns {Object} Collection of initialized managers
     */
    static createManagers(scene) {
        console.log('Initializing managers for scene:', scene);

        // Register dependencies in the service container
        container.register('scene', scene);
        container.register('eventBus', eventBus);

        // Asset management
        const assets = new AssetManager(scene);
        container.register('assets', assets);

        // State management
        const gameState = new GameStateManager(scene);
        const persistence = new PersistenceManager(gameState);

        // Audio system
        let audio = container.services.has('audio')
            ? container.get('audio')
            : new AudioManager(scene);
        if (!container.services.has('audio')) {
            container.register('audio', audio);
        }

        // Entity management
        const entityManager = new EntityManager(scene);
        const ldtkEntityManager = new LDTKEntityManager(scene);
        console.log('LDTKEntityManager created:', ldtkEntityManager);

        // Entity factories
        console.log('Registering entity factories...');
        
        ldtkEntityManager.registerEntityFactories({
            Enemy: (scene, x, y, fields) => {
                console.log(`Factory invoked for Enemy at (${x}, ${y}) with fields:`, fields);
                return new Enemy(scene, x, y);
            },
            Bitcoin: (scene, x, y, fields) => {
                console.log(`Factory invoked for Bitcoin at (${x}, ${y}) with fields:`, fields);
                return new Bitcoin(scene, x, y);
            },
            Slime: (scene, x, y, fields) => {
                console.log(`Factory invoked for Slime at (${x}, ${y}) with fields:`, fields);
                return new Slime(scene, x, y);
            },
            Drone: (scene, x, y, fields) => {
                console.log(`Factory invoked for Drone at (${x}, ${y}) with fields:`, fields);
                return new Drone(scene, x, y);
            },
            Trampoline: (scene, x, y, fields) => {
                console.log(`Factory invoked for Trampoline at (${x}, ${y}) with fields:`, fields);
                return new Trampoline(scene, x, y);
            },
            Trap: (scene, x, y, fields) => {
                console.log(`Factory invoked for Trap at (${x}, ${y}) with fields:`, fields);
                return new Trap(scene, x, y);
            },
            DestructibleBlock: (scene, x, y, fields) => {
                console.log(`Factory invoked for DestructibleBlock at (${x}, ${y}) with fields:`, fields);
                return new DestructibleBlock(scene, x, y);
            },
            FallingDestructibleBlock: (scene, x, y, fields) => {
                console.log(`Factory invoked for FallingDestructibleBlock at (${x}, ${y}) with fields:`, fields);
                return new FallingDestructibleBlock(scene, x, y);
            },
            DisappearingPlatform: (scene, x, y, fields) => {
                console.log(`Factory invoked for DisappearingPlatform at (${x}, ${y}) with fields:`, fields);
                return new DisappearingPlatform(scene, x, y);
            },
            Turret: (scene, x, y, fields) => {
                console.log(`Factory invoked for Turret at (${x}, ${y}) with fields:`, fields);
                return new Turret(scene, x, y);
            },
            MeleeWarrior: (scene, x, y, fields) => {
                console.log(`Factory invoked for MeleeWarrior at (${x}, ${y}) with fields:`, fields);
                return new MeleeWarrior(scene, x, y);
            },
            Zapper: (scene, x, y, fields) => {
                console.log(`Factory invoked for Zapper at (${x}, ${y}) with fields:`, fields);
                return new Zapper(scene, x, y, fields);
            },
            PlayerStart: (scene, x, y, fields) => {
                console.log(`Factory invoked for PlayerStart at (${x}, ${y}) with fields:`, fields);
                return { x, y, type: 'PlayerStart' };
            },
        });

        // Gameplay systems
        const enemies = new EnemyManager(scene);
        const hazards = new HazardManager(scene);
        const animations = new AnimationManager(scene);
        const effects = new EffectsManager(scene);
        const boundaries = new SceneBoundaryManager(scene);
        const debug = new DebugSystem(scene);
        const collision = new CollisionManager(scene);
        const ui = new UIManager(scene);

        // Event system
        const events = container.services.has('events')
            ? container.get('events')
            : new EventManager(scene);
        if (!container.services.has('events')) {
            container.register('events', events);
        }

        // Initialize services
        events.initialize();
        assets.initialize();

        // Register all managers in the container
        container.register('gameState', gameState);
        container.register('persistence', persistence);
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

        // Return references
        return {
            assets,
            gameState,
            persistence,
            audio,
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
            ui,
        };
    }

    static createEntityManager(scene) {
        console.log('Creating LDTKEntityManager for scene:', scene);
        return new LDTKEntityManager(scene);
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

    static getBulletManager(scene) {
        if (!this.bulletManager) {
            this.bulletManager = new BulletManager(scene);
        }
        return this.bulletManager;
    }

    static getBulletPool() {
        if (!this.bulletPool) {
            this.bulletPool = new BulletPool();
        }
        return this.bulletPool;
    }

    static getCameraManager(scene) {
        if (!this.cameraManager) {
            this.cameraManager = new CameraManager(scene);
        }
        return this.cameraManager;
    }

    static getLDTKEntityManager(scene) {
        if (!this.ldtkEntityManager) {
            this.ldtkEntityManager = new LDTKEntityManager(scene);
        }
        return this.ldtkEntityManager;
    }

    static getLDTKTileManager(scene) {
        if (!this.ldtkTileManager) {
            this.ldtkTileManager = new LDTKTileManager(scene);
        }
        return this.ldtkTileManager;
    }

    static getUIManager(scene) {
        if (!this.uiManager) {
            this.uiManager = new UIManager(scene);
        }
        return this.uiManager;
    }
}

export default ManagerFactory;
