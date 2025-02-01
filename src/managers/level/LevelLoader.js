/**
 * LevelLoader.js
 * Loads and converts LDtk level data into Phaser tilemaps
 * Handles tile placement, collision setup, and layer management
 * Bridges LDtk editor format with Phaser's tilemap system
 */

export class LevelLoader {
    /**
     * Initialize level loading system
     * @param {Phaser.Scene} scene - Scene to create tilemaps in
     */
    constructor(scene) {
        this.scene = scene;
    }

    /**
     * Load level from cache and create tilemap
     * Handles both single and multi-level files
     * @param {string} levelKey - Cache key for level data
     * @returns {Object} Created map and layer
     */
    loadLevel(levelKey) {
        const levelData = this.scene.cache.json.get(levelKey);
        if (!levelData) {
            console.error(`Level data not found for key: ${levelKey}`);
            return { map: null, layer: null };
        }
        
        // Handle both single level and world files
        if (levelData.levels && levelData.levels[0]) {
            return this.createTileMap(levelData.levels[0]);
        }
        return this.createTileMap(levelData);
    }

    /**
     * Convert LDtk level to Phaser tilemap
     * Sets up tiles, collisions, and properties
     * @param {Object} levelData - LDtk level definition
     * @returns {Object} Phaser map and layer objects
     */
    createTileMap(levelData) {
        // Extract tile layer data
        const layerInstances = levelData.layerInstances || [];
        const tileLayer = layerInstances.find(layer => layer.__type === "Tiles");
        
        if (!tileLayer) {
            console.error('Tiles layer not found');
            return { map: null, layer: null };
        }

        // Create base tilemap from dimensions
        const map = this.scene.make.tilemap({
            width: tileLayer.__cWid,
            height: tileLayer.__cHei,
            tileWidth: tileLayer.__gridSize,
            tileHeight: tileLayer.__gridSize
        });

        // Load and validate tileset
        const tileset = map.addTilesetImage('tileset');
        if (!tileset) {
            console.error('Failed to add tileset image');
            return { map: null, layer: null };
        }

        // Create gameplay layer
        const layer = map.createBlankLayer('level', tileset, 0, 0);
        if (!layer) {
            console.error('Failed to create level layer');
            return { map: null, layer: null };
        }

        // Place tiles from LDtk data
        if (tileLayer.gridTiles) {
            // Convert LDtk tile positions to Phaser format
            tileLayer.gridTiles.forEach(tile => {
                const tileX = Math.floor(tile.px[0] / tileLayer.__gridSize);
                const tileY = Math.floor(tile.px[1] / tileLayer.__gridSize);
                const tileIndex = this.getFrameFromSrc(tile.src, tileLayer.__gridSize);
                layer.putTileAt(tileIndex, tileX, tileY);
            });

            // Setup collision for placed tiles
            layer.forEachTile(tile => {
                if (tile && tile.index !== -1) {
                    tile.setCollision(true, true, true, true);
                    tile.properties = { ...tile.properties, collides: true };
                }
            });

            // Enable collision for all possible tiles
            const indexes = [];
            for (let i = 0; i < this.getTotalTiles(tileset); i++) {
                indexes.push(i);
            }
            layer.setCollision(indexes);
        }

        return { map, layer };
    }

    /**
     * Convert LDtk tile coordinates to tileset index
     * Maps 2D position to 1D array index
     * @param {Array} src - [x,y] position in tileset
     * @param {number} gridSize - Tile dimensions
     * @returns {number} Tileset index
     */
    getFrameFromSrc(src, gridSize) {
        const [x, y] = src;
        return (y / gridSize) * (192/32) + (x / gridSize); // 192 is tileset width
    }

    /**
     * Calculate total tiles in tileset
     * Used for collision setup
     * @param {Phaser.Tilemaps.Tileset} tileset - Loaded tileset
     * @returns {number} Total tile count
     */
    getTotalTiles(tileset) {
        return (tileset.image.width / tileset.tileWidth) * 
               (tileset.image.height / tileset.tileHeight);
    }
}
