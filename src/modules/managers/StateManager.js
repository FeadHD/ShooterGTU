// 3. StateManager.js
export class StateManager {
    constructor(scene) {
        this.scene = scene;
        this.registry = scene.registry;
    }

    initializeGameState() {
        const defaults = {
            score: 0,
            lives: 3,
            playerHP: 100,
            bitcoins: 0
        };

        Object.entries(defaults).forEach(([key, value]) => {
            if (this.registry.get(key) === undefined) {
                this.registry.set(key, value);
            }
        });
    }
}