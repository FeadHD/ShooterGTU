export class SceneBoundaryManager {
    constructor(scene) {
        this.scene = scene;
    }

    createBoundaries(player) {
        const { width, height } = this.scene.scale;
        const leftBoundary = this.scene.add.rectangle(0, height/2, 10, height, 
                                                    0x000000, 0);
        this.scene.physics.add.existing(leftBoundary, true);
        if (player) {
            this.scene.physics.add.collider(player, leftBoundary);
        }
    }
}