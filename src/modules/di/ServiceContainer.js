/**
 * ServiceContainer.js
 * Implements a simple dependency injection container for managing game services.
 * Provides centralized access to game managers, systems, and shared resources.
 */

export class ServiceContainer {
    /**
     * Initialize an empty service container
     * Uses Map for efficient key-value storage of services
     */
    constructor() {
        this.services = new Map();
    }

    /**
     * Register a new service in the container
     * @param {string} key - Unique identifier for the service
     * @param {Object} service - Service instance to store
     */
    register(key, service) {
        this.services.set(key, service);
    }

    /**
     * Retrieve a service from the container
     * @param {string} key - Identifier of the service to retrieve
     * @returns {Object} The requested service instance
     * @throws {Error} If service is not found
     */
    get(key) {
        if (!this.services.has(key)) {
            throw new Error(`Service ${key} not found in container`);
        }
        return this.services.get(key);
    }
}

// Global singleton instance used throughout the game
export const container = new ServiceContainer();
