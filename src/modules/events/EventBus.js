/**
 * EventBus.js
 * A lightweight, game-wide event bus for cross-component communication
 * Implements the pub/sub (publisher/subscriber) pattern
 * Used for events that need to be accessible across different scenes
 */

/**
 * EventBus class
 * Provides methods for subscribing to and publishing events
 * Uses Map and Set for efficient event handling
 */
export class EventBus {
    /**
     * Initialize the event bus
     * Creates a Map to store event listeners
     * Each event has a Set of callback functions
     */
    constructor() {
        this.listeners = new Map();
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event identifier
     * @param {Function} callback - Function to call when event occurs
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - Event identifier
     * @param {Function} callback - Function to remove from listeners
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }
    }

    /**
     * Publish an event
     * Calls all registered callbacks with the provided data
     * Errors in callbacks are caught to prevent event chain breaking
     * @param {string} event - Event identifier
     * @param {*} data - Data to pass to callbacks
     */
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }
}

// Create and export a singleton instance for app-wide use
export const eventBus = new EventBus();
