/**
 * Generic Object Pool
 * Base class for managing reusable game objects
 * Improves performance by recycling objects instead of creating/destroying them
 */
export class ObjectPool {
    /**
     * Create a new object pool
     * @param {Phaser.Scene} scene - Game scene this pool belongs to
     * @param {string} type - Type identifier for the pooled objects
     * @param {number} initialSize - Initial pool size (default: 20)
     */
    constructor(scene, type, initialSize = 20) {
        this.scene = scene;
        this.type = type;
        this.pool = [];           // Inactive objects ready for reuse
        this.active = new Set();  // Currently active objects
        this.initialSize = initialSize;
        this.initialize();
    }

    /**
     * Initialize pool with inactive objects
     * Creates the initial set of reusable objects
     * @private
     */
    initialize() {
        for (let i = 0; i < this.initialSize; i++) {
            const obj = this.createNewObject();
            obj.setActive(false);
            obj.setVisible(false);
            this.pool.push(obj);
        }
    }

    /**
     * Create a new object for the pool
     * Must be implemented by child classes
     * @protected
     * @abstract
     * @throws {Error} If not implemented by child class
     */
    createNewObject() {
        throw new Error('createNewObject must be implemented by child class');
    }

    /**
     * Get an object from the pool
     * Reuses an inactive object or creates a new one if needed
     * @returns {Object} Activated game object
     */
    get() {
        let obj;
        
        // Reuse existing object if available
        if (this.pool.length > 0) {
            obj = this.pool.pop();
        } else {
            // Create new object if pool is empty
            obj = this.createNewObject();
        }

        // Activate and track the object
        obj.setActive(true);
        obj.setVisible(true);
        this.active.add(obj);
        return obj;
    }

    /**
     * Return an object to the pool
     * Deactivates the object and makes it available for reuse
     * @param {Object} obj - Object to return to pool
     */
    release(obj) {
        if (!obj) return;

        // Deactivate and return to pool
        obj.setActive(false);
        obj.setVisible(false);
        this.active.delete(obj);
        this.pool.push(obj);
    }

    /**
     * Return all active objects to the pool
     * Useful when clearing the game state
     */
    releaseAll() {
        this.active.forEach(obj => this.release(obj));
        this.active.clear();
    }

    /**
     * Clean up the pool
     * Destroys all objects and clears the pool
     */
    destroy() {
        [...this.pool, ...this.active].forEach(obj => obj.destroy());
        this.pool = [];
        this.active.clear();
    }
}
