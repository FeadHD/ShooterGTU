/**
 * BaseManager.js
 * Base class for all game managers providing dependency injection functionality.
 * Serves as a foundation for specialized managers (Audio, UI, State, etc.)
 */

import { container } from './ServiceContainer';

export class BaseManager {
    /**
     * Initialize manager with service container access
     * Container holds references to all game services and managers
     */
    constructor() {
        this.container = container;
    }

    /**
     * Get the current active scene
     * @returns {Phaser.Scene} Current game scene
     */
    getScene() {
        return this.container.get('scene');
    }

    /**
     * Get a specific manager instance by key
     * @param {string} managerKey - Identifier for the desired manager
     * @returns {BaseManager} Instance of the requested manager
     */
    getManager(managerKey) {
        return this.container.get(managerKey);
    }
}
