export class LevelLoader {
    constructor(scene) {
        this.scene = scene;
    }

    loadLevel(levelKey) {
        const levelData = this.scene.cache.json.get(levelKey);
        if (!levelData) {
            console.error(`Level data not found for key: ${levelKey}`);
            return { map: null, layer: null };
        }
        
        // Check if we need to get the first level's layer instances
        if (levelData.levels && levelData.levels[0]) {
            return this.createTileMap(levelData.levels[0]);
        }
        return this.createTileMap(levelData);
    }

    createTileMap(levelData) {
        // Get the layer instances, handling both direct and nested structures
        const layerInstances = levelData.layerInstances || [];
        const tileLayer = layerInstances.find(layer => layer.__type === "Tiles");
        
        if (!tileLayer) {
            console.error('Tiles layer not found');
            return { map: null, layer: null };
        }

        // Create the tilemap with the exact dimensions from LDtk
        const map = this.scene.make.tilemap({
            width: tileLayer.__cWid,
            height: tileLayer.__cHei,
            tileWidth: tileLayer.__gridSize,
            tileHeight: tileLayer.__gridSize
        });

        // Add the tileset
        const tileset = map.addTilesetImage('tileset');
        if (!tileset) {
            console.error('Failed to add tileset image');
            return { map: null, layer: null };
        }

        // Create a new layer
        const layer = map.createBlankLayer('level', tileset, 0, 0);
        if (!layer) {
            console.error('Failed to create level layer');
            return { map: null, layer: null };
        }

        // Place tiles according to the LDtk data
        if (tileLayer.gridTiles) {
            tileLayer.gridTiles.forEach(tile => {
                const tileX = Math.floor(tile.px[0] / tileLayer.__gridSize);
                const tileY = Math.floor(tile.px[1] / tileLayer.__gridSize);
                const tileIndex = this.getFrameFromSrc(tile.src, tileLayer.__gridSize);
                layer.putTileAt(tileIndex, tileX, tileY);
            });

            // Set collision for all non-empty tiles in the layer
            layer.forEachTile(tile => {
                if (tile && tile.index !== -1) {
                    tile.setCollision(true, true, true, true);
                    tile.properties = { ...tile.properties, collides: true };
                }
            });

            // Enable collision for specific tile indexes (all tiles in your tileset)
            const indexes = [];
            for (let i = 0; i < this.getTotalTiles(tileset); i++) {
                indexes.push(i);
            }
            layer.setCollision(indexes);
        }

        return { map, layer };
    }

    getFrameFromSrc(src, gridSize) {
        const [x, y] = src;
        return (y / gridSize) * (192/32) + (x / gridSize); // 192 is the tileset width
    }

    getTotalTiles(tileset) {
        return (tileset.image.width / tileset.tileWidth) * (tileset.image.height / tileset.tileHeight);
    }
}
