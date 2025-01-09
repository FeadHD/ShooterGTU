export class LDTKTileManager {
    constructor(scene) {
        this.scene = scene;
        this.hitboxes = new Map(); // Store hitboxes for cleanup
        this.sectionHitboxes = new Map(); // Store hitboxes by section
    }

    /**
     * Process LDTK level data and create hitboxes for solid tiles
     * @param {Object} levelData - The LDTK level data
     * @param {number} worldX - World X offset for the level
     * @param {number} worldY - World Y offset for the level
     * @param {number} sectionWidth - Width of the section to load
     */
    createTileHitboxes(levelData, worldX = 0, worldY = 0, sectionWidth) {
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

        const sectionHitboxes = new Set();
        this.sectionHitboxes.set(worldX, sectionHitboxes);

        // Process auto-layer tiles
        if (solidLayer.autoLayerTiles) {
            this.processAutoLayerTiles(solidLayer.autoLayerTiles, worldX, worldY, sectionWidth, sectionHitboxes);
        }

        // Process IntGrid tiles if present
        if (solidLayer.intGridCsv) {
            this.processIntGridTiles(solidLayer, worldX, worldY, sectionWidth, sectionHitboxes);
        }
    }

    /**
     * Process auto-layer tiles and create hitboxes
     * @param {Array} tiles - Array of auto-layer tiles
     * @param {number} worldX - World X offset
     * @param {number} worldY - World Y offset
     * @param {number} sectionWidth - Width of the section
     * @param {Set} sectionHitboxes - Set to store hitboxes for this section
     */
    processAutoLayerTiles(tiles, worldX, worldY, sectionWidth, sectionHitboxes) {
        const sectionEnd = worldX + sectionWidth;
        
        tiles.forEach(tile => {
            const tileX = tile.px[0] + worldX;
            // Only create hitboxes for tiles within this section
            if (tileX >= worldX && tileX < sectionEnd) {
                const tileY = tile.px[1] + worldY;
                const hitbox = this.createHitbox(tileX, tileY);
                if (hitbox) {
                    sectionHitboxes.add(hitbox);
                }
            }
        });
    }

    /**
     * Process IntGrid tiles and create hitboxes
     * @param {Object} layer - The IntGrid layer
     * @param {number} worldX - World X offset
     * @param {number} worldY - World Y offset
     * @param {number} sectionWidth - Width of the section
     * @param {Set} sectionHitboxes - Set to store hitboxes for this section
     */
    processIntGridTiles(layer, worldX, worldY, sectionWidth, sectionHitboxes) {
        const tileSize = 32; // Standard tile size
        const sectionEnd = worldX + sectionWidth;
        const startTile = Math.floor(worldX / tileSize);
        const endTile = Math.ceil(sectionEnd / tileSize);
        
        for (let x = startTile; x < endTile; x++) {
            for (let y = 0; y < layer.__cHei; y++) {
                const idx = y * layer.__cWid + x;
                const value = layer.intGridCsv[idx];
                
                if (value > 0) {
                    const tileX = x * tileSize + worldX;
                    const tileY = y * tileSize + worldY;
                    const hitbox = this.createHitbox(tileX, tileY);
                    if (hitbox) {
                        sectionHitboxes.add(hitbox);
                    }
                }
            }
        }
    }

    /**
     * Create a hitbox at the specified position
     * @param {number} x - X position
     * @param {number} y - Y position
     * @returns {Phaser.GameObjects.Rectangle} The created hitbox
     */
    createHitbox(x, y) {
        const hitbox = this.scene.add.rectangle(x, y, 32, 32);
        this.scene.physics.add.existing(hitbox, true);
        hitbox.body.allowGravity = false;
        hitbox.body.immovable = true;
        this.hitboxes.set(`${x},${y}`, hitbox);
        return hitbox;
    }

    /**
     * Clean up hitboxes that are before the specified X position
     * @param {number} cleanupX - X position before which to remove hitboxes
     */
    cleanupHitboxes(cleanupX) {
        // Remove section hitboxes
        for (const [sectionX, hitboxes] of this.sectionHitboxes.entries()) {
            if (sectionX < cleanupX) {
                for (const hitbox of hitboxes) {
                    hitbox.destroy();
                    const key = `${hitbox.x},${hitbox.y}`;
                    this.hitboxes.delete(key);
                }
                this.sectionHitboxes.delete(sectionX);
            }
        }
    }

    /**
     * Add a collider between an object and all hitboxes
     * @param {Phaser.GameObjects.GameObject} object - The object to add collisions with
     */
    addCollider(object) {
        for (const hitbox of this.hitboxes.values()) {
            this.scene.physics.add.collider(object, hitbox);
        }
    }
}
