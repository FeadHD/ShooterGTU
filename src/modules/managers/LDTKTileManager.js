/**
 * LDTKTileManager.js
 * Manages tile-based collision system from LDtk level data
 * Creates and maintains physics hitboxes for solid tiles
 * Handles progressive loading and cleanup of level sections
 */

export class LDTKTileManager {
    /**
     * Initialize tile collision system
     * @param {Phaser.Scene} scene - Scene to create hitboxes in
     */
    constructor(scene) {
        this.scene = scene;
        this.hitboxes = new Map();        // All active hitboxes
        this.sectionHitboxes = new Map(); // Hitboxes by level section
    }

    /**
     * Create collision hitboxes for level section
     * Called when loading new level chunks
     * @param {Object} levelData - LDtk level definition
     * @param {number} worldX - Section X offset
     * @param {number} worldY - Section Y offset
     * @param {number} sectionWidth - Section width in pixels
     */
    createTileHitboxes(levelData, worldX = 0, worldY = 0, sectionWidth) {
        if (!levelData || !levelData.layerInstances) {
            console.error('Invalid level data provided');
            return;
        }

        // Find collision layer in LDtk data
        const solidLayer = levelData.layerInstances.find(layer => 
            layer.__identifier === 'Solid' || layer.__type === 'IntGrid'
        );

        if (!solidLayer) {
            console.warn('No solid layer found in level data');
            return;
        }

        // Track hitboxes for this section
        const sectionHitboxes = new Set();
        this.sectionHitboxes.set(worldX, sectionHitboxes);

        // Process different tile types
        if (solidLayer.autoLayerTiles) {
            this.processAutoLayerTiles(solidLayer.autoLayerTiles, worldX, worldY, sectionWidth, sectionHitboxes);
        }

        if (solidLayer.intGridCsv) {
            this.processIntGridTiles(solidLayer, worldX, worldY, sectionWidth, sectionHitboxes);
        }
    }

    /**
     * Process auto-placed tiles from LDtk
     * Creates hitboxes for solid auto-tiles
     * @param {Array} tiles - Auto-layer tile data
     * @param {number} worldX - Section offset X
     * @param {number} worldY - Section offset Y
     * @param {number} sectionWidth - Section bounds
     * @param {Set} sectionHitboxes - Current section's hitboxes
     */
    processAutoLayerTiles(tiles, worldX, worldY, sectionWidth, sectionHitboxes) {
        const sectionEnd = worldX + sectionWidth;
        
        tiles.forEach(tile => {
            const tileX = tile.px[0] + worldX;
            // Only process tiles in current section
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
     * Process integer grid tiles from LDtk
     * Creates hitboxes for solid grid cells
     * @param {Object} layer - IntGrid layer data
     * @param {number} worldX - Section offset X
     * @param {number} worldY - Section offset Y
     * @param {number} sectionWidth - Section bounds
     * @param {Set} sectionHitboxes - Current section's hitboxes
     */
    processIntGridTiles(layer, worldX, worldY, sectionWidth, sectionHitboxes) {
        const tileSize = 32;              // Tile dimensions
        const sectionEnd = worldX + sectionWidth;
        const startTile = Math.floor(worldX / tileSize);
        const endTile = Math.ceil(sectionEnd / tileSize);
        
        // Scan grid cells in section
        for (let x = startTile; x < endTile; x++) {
            for (let y = 0; y < layer.__cHei; y++) {
                const idx = y * layer.__cWid + x;
                const value = layer.intGridCsv[idx];
                
                // Create hitbox for solid cells (value > 0)
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
     * Create physics hitbox at position
     * Sets up collision properties
     * @param {number} x - World position X
     * @param {number} y - World position Y
     * @returns {Phaser.GameObjects.Rectangle} Physics hitbox
     */
    createHitbox(x, y) {
        const hitbox = this.scene.add.rectangle(x, y, 32, 32);
        this.scene.physics.add.existing(hitbox, true);
        hitbox.body.allowGravity = false;  // Static position
        hitbox.body.immovable = true;      // Solid collision
        this.hitboxes.set(`${x},${y}`, hitbox);
        return hitbox;
    }

    /**
     * Remove hitboxes from old sections
     * Called during level progression
     * @param {number} cleanupX - Remove sections before this X
     */
    cleanupHitboxes(cleanupX) {
        // Clean up by section
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
     * Add collision between object and hitboxes
     * Used for player and enemy physics
     * @param {Phaser.GameObjects.GameObject} object - Entity to collide
     */
    addCollider(object) {
        for (const hitbox of this.hitboxes.values()) {
            this.scene.physics.add.collider(object, hitbox);
        }
    }
}
