import { container } from './ServiceContainer';

export class BaseManager {
    constructor() {
        this.container = container;
    }

    getScene() {
        return this.container.get('scene');
    }

    getManager(managerKey) {
        return this.container.get(managerKey);
    }
}
