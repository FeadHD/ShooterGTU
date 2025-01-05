export class ServiceContainer {
    constructor() {
        this.services = new Map();
    }

    register(key, service) {
        this.services.set(key, service);
    }

    get(key) {
        if (!this.services.has(key)) {
            throw new Error(`Service ${key} not found in container`);
        }
        return this.services.get(key);
    }
}

// Create a singleton instance
export const container = new ServiceContainer();
