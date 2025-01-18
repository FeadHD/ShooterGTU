/**
 * BoundaryManager.js
 * Creates and manages invisible boundaries for the game scene
 * Prevents player from moving outside playable area
 */

export class SceneBoundaryManager {
    /**
     * Initialize boundary manager
     * @param {Phaser.Scene} scene - The scene to add boundaries to
     */
    constructor(scene) {
        this.scene = scene;
    }

    /**
     * Create invisible collision boundaries
     * Currently implements left boundary, can be extended for right/top/bottom
     * @param {Phaser.GameObjects.Sprite} player - Player sprite to collide with boundaries
     */
    createBoundaries(player) {
        const { width, height } = this.scene.scale;
        
        // Create invisible wall on left side of scene
        const leftBoundary = this.scene.add.rectangle(0, height/2, 10, height, 
                                                    0x000000, 0);  // Alpha = 0 for invisible
        this.scene.physics.add.existing(leftBoundary, true);  // true = static body
        
        // Set up collision between player and boundary if player exists
        if (player) {
            this.scene.physics.add.collider(player, leftBoundary);
        }
    }
}