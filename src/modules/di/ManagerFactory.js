import { GameStateManager } from '../managers/state/GameStateManager';
import { PersistenceManager } from '../managers/state/PersistenceManager';
import { SoundManager } from '../managers/audio/SoundManager';
import { MusicManager } from '../managers/audio/MusicManager';
import { EntityManager } from '../managers/entities/EntityManager';
import { EnemyManager } from '../managers/entities/EnemyManager';
import { HazardManager } from '../managers/entities/HazardManager';
import { AnimationManager } from '../managers/AnimationManager';
import { EffectsManager } from '../managers/EffectsManager';
import { SceneBoundaryManager } from '../managers/BoundaryManager';
import { DebugSystem } from '../../_Debug/DebugSystem';
import { CollisionManager } from '../managers/CollisionManager';
import { container } from './ServiceContainer';
import { eventBus } from '../events/EventBus';

export class ManagerFactory {
    static createManagers(scene) {
        // Register core dependencies
        container.register('scene', scene);
        container.register('eventBus', eventBus);
        
        // Create and register state managers
        const gameState = new GameStateManager(scene);
        const persistence = new PersistenceManager(gameState);
        
        // Create and register audio managers
        const sound = new SoundManager(scene);
        const music = new MusicManager(scene);
        
        // Create and register entity managers
        const entityManager = new EntityManager(scene);
        const enemies = new EnemyManager(scene);
        const hazards = new HazardManager(scene);
        
        // Create and register other managers
        const animations = new AnimationManager(scene);
        const effects = new EffectsManager(scene);
        const boundaries = new SceneBoundaryManager(scene);
        const debug = new DebugSystem(scene);
        const collision = new CollisionManager(scene);
        
        // Register all managers
        container.register('gameState', gameState);
        container.register('persistence', persistence);
        container.register('sound', sound);
        container.register('music', music);
        container.register('entityManager', entityManager);
        container.register('enemies', enemies);
        container.register('hazards', hazards);
        container.register('animations', animations);
        container.register('effects', effects);
        container.register('boundaries', boundaries);
        container.register('debug', debug);
        container.register('collision', collision);

        return {
            gameState,
            persistence,
            sound,
            music,
            entityManager,
            enemies,
            hazards,
            animations,
            effects,
            boundaries,
            debug,
            collision
        };
    }
}
