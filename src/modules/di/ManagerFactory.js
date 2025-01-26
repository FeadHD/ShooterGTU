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
    
        // 1) Register the scene in DI
        container.register('scene', scene);
    
        // 2) Create a scene-based EventManager FIRST
        let events;
        if (container.services.has('events')) {
            events = container.get('events');
        } else {
            events = new EventManager(scene);
            container.register('events', events);
        }
    
        // 3) Now initialize it (so events are ready for other managers)
        events.initialize();

        // 4) Make sure the scene has a reference to it
        scene.eventManager = events;   // <-- IMPORTANT!
    
        // 5) Local DI container
        const localContainer = scene.container || {};
        container.register('container', localContainer);
    
        // 6) Asset management
        const assets = new AssetManager(scene);
        container.register('assets', assets);
    
        // 6) State management
        const gameState = new GameStateManager(scene);
        const persistence = new PersistenceManager(gameState);
    
        // 7) Audio system
        let audio = container.services.has('audio')
            ? container.get('audio')
            : new AudioManager(scene);
    
        if (!container.services.has('audio')) {
            container.register('audio', audio);
        }
    
        // 8) Entity + gameplay managers
        // (Now it's safe to do these, as events is registered)
        const entityManager = new EntityManager(scene);
        const ldtkEntityManager = new LDTKEntityManager(scene);
        console.log('LDTKEntityManager created:', ldtkEntityManager);
        container.register('ldtkEntityManager', ldtkEntityManager);
    
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
            Zapper: (scene, x, y, fields) => {
                console.log(`Factory invoked for Zapper at (${x}, ${y}) with fields:`, fields);
                return new Zapper(scene, x, y, fields);
            },
            // ... other entity factories
            PlayerStart: (scene, x, y, fields) => {
                console.log(`Factory invoked for PlayerStart at (${x}, ${y}) with fields:`, fields);
                return { x, y, type: 'PlayerStart' };
            },
        });
    
        const enemies = new EnemyManager(scene);
        const hazards = new HazardManager(scene);
        const animations = new AnimationManager(scene);
        const effects = new EffectsManager(scene);
        const boundaries = new SceneBoundaryManager(scene);
        const debug = new DebugSystem(scene);
        const collision = new CollisionManager(scene);
    
        // 9) Skip UI if MainMenu
        let ui = null;
        if (scene.scene.key !== 'MainMenu') {
            ui = new UIManager(scene);  
        }
    
        // 10) Initialize assets
        assets.initialize();
    
        // 11) Register all these managers
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
    
        if (ui) {
            container.register('ui', ui);
        }
    
        // 12) Return references
        return {
            events,
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
