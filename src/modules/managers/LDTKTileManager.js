export class LDTKTileManager {
    constructor(scene) {
        this.scene = scene;
        this.hitboxes = new Map(); // Store hitboxes for cleanup
    }

    /**
     * Process LDTK level data and create hitboxes for solid tiles
     * @param {Object} levelData - The LDTK level data
     * @param {number} worldX - World X offset for the level
     * @param {number} worldY - World Y offset for the level
     */
    createTileHitboxes(levelData, worldX = 0, worldY = 0) {
        if (!levelData || !levelData.layerInstances) {
            console.error('Invalid level data provided');
            return;
        }

        // Find the Solid layer
        const solidLayer = levelData.layerInstances.find(layer => 
            layer.__identifier === 'Solid' || layer.__type === 'IntGrid'
        );

        if (!solidLayer) {
            console.warn('No solid layer found in level data');
            return;
        }

        // Process auto-layer tiles
        if (solidLayer.autoLayerTiles) {
            this.processAutoLayerTiles(solidLayer.autoLayerTiles, worldX, worldY);
        }

        // Process IntGrid tiles if present
        if (solidLayer.intGridCsv) {
            this.processIntGridTiles(solidLayer, worldX, worldY);
        }
    }

    /**
     * Process auto-layer tiles and create hitboxes
     * @param {Array} tiles - Array of auto-layer tiles
     * @param {number} worldX - World X offset
     * @param {number} worldY - World Y offset
     */
    processAutoLayerTiles(tiles, worldX, worldY) {
        tiles.forEach(tile => {
            const x = tile.px[0] + worldX;
            const y = tile.px[1] + worldY;
            this.createHitbox(x, y);
        });
    }

    /**
     * Process IntGrid tiles and create hitboxes
     * @param {Object} layer - The layer containing IntGrid data
     * @param {number} worldX - World X offset
     * @param {number} worldY - World Y offset
     */
    processIntGridTiles(layer, worldX, worldY) {
        const gridSize = layer.__gridSize;
        const width = layer.__cWid;
        const height = layer.__cHei;

        layer.intGridCsv.forEach((value, index) => {
            if (value === 1) { // Assuming 1 represents solid tiles
                const x = (index % width) * gridSize + worldX;
                const y = Math.floor(index / width) * gridSize + worldY;
                this.createHitbox(x, y);
            }
        });
    }

    /**
     * Create a physics hitbox at the specified position
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    createHitbox(x, y) {
        // Create an invisible rectangle for the hitbox
        const hitbox = this.scene.add.rectangle(
            x + 16, // Center of tile
            y + 16, // Center of tile
            32,     // Tile width
            32,     // Tile height
            0x000000, // Color (invisible)
            0        // Alpha (invisible)
        );

        // Enable physics and make it static
        this.scene.physics.add.existing(hitbox, true);

        // Store the hitbox for potential cleanup
        this.hitboxes.set(`${x},${y}`, hitbox);

        return hitbox;
    }

    /**
     * Add collision between an object and all tile hitboxes
     * @param {Phaser.GameObjects.GameObject} object - The object to add collisions for
     */
    addCollider(object) {
        this.hitboxes.forEach(hitbox => {
            this.scene.physics.add.collider(object, hitbox);
        });
    }

    /**
     * Clear all hitboxes
     */
    clearHitboxes() {
        this.hitboxes.forEach(hitbox => {
            hitbox.destroy();
        });
        this.hitboxes.clear();
    }
}
