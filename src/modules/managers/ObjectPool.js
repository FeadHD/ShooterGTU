export class ObjectPool {
    constructor(scene, type, initialSize = 20) {
        this.scene = scene;
        this.type = type;
        this.pool = [];
        this.active = new Set();
        this.initialSize = initialSize;
        this.initialize();
    }

    initialize() {
        // Create initial pool of objects
        for (let i = 0; i < this.initialSize; i++) {
            const obj = this.createNewObject();
            obj.setActive(false);
            obj.setVisible(false);
            this.pool.push(obj);
        }
    }

    createNewObject() {
        // This should be overridden by specific pool implementations
        throw new Error('createNewObject must be implemented by child class');
    }

    get() {
        let obj;
        
        // Try to get an inactive object from the pool
        if (this.pool.length > 0) {
            obj = this.pool.pop();
        } else {
            // Create new object if pool is empty
            obj = this.createNewObject();
        }

        obj.setActive(true);
        obj.setVisible(true);
        this.active.add(obj);
        return obj;
    }

    release(obj) {
        if (!obj) return;

        obj.setActive(false);
        obj.setVisible(false);
        this.active.delete(obj);
        this.pool.push(obj);
    }

    releaseAll() {
        this.active.forEach(obj => this.release(obj));
        this.active.clear();
    }

    destroy() {
        // Destroy all objects in pool and active set
        [...this.pool, ...this.active].forEach(obj => obj.destroy());
        this.pool = [];
        this.active.clear();
    }
}
