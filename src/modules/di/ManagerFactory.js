import { StateManager } from '../managers/StateManager';
import { AnimationManager } from '../managers/AnimationManager';
import { EffectsManager } from '../managers/EffectsManager';
import { EnemyManager } from '../managers/EnemyManager';
import { SceneBoundaryManager } from '../managers/BoundaryManager';
import { DebugSystem } from '../../_Debug/DebugSystem';
import { container } from './ServiceContainer';
import { eventBus } from '../events/EventBus';

export class ManagerFactory {
    static createManagers(scene) {
        // Register scene and eventBus in the container
        container.register('scene', scene);
        container.register('eventBus', eventBus);
        
        // Create and register managers
        const stateManager = new StateManager(scene);
        const animationManager = new AnimationManager(scene);
        const effectsManager = new EffectsManager(scene);
        const enemyManager = new EnemyManager(scene);
        const boundaryManager = new SceneBoundaryManager(scene);
        const debugSystem = new DebugSystem(scene);
        
        container.register('stateManager', stateManager);
        container.register('animationManager', animationManager);
        container.register('effectsManager', effectsManager);
        container.register('enemyManager', enemyManager);
        container.register('boundaryManager', boundaryManager);
        container.register('debugSystem', debugSystem);
        
        return {
            stateManager,
            animationManager,
            effectsManager,
            enemyManager,
            boundaryManager,
            debugSystem
        };
    }
}
