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
        return this.createTileMap(levelData);
    }

    createTileMap(levelData) {
        const tileLayer = levelData.layerInstances.find(layer => layer.__identifier === "WannabeeTileset");
        
        if (!tileLayer) {
            console.error('WannabeeTileset layer not found');
            return { map: null, layer: null };
        }

        const map = this.scene.make.tilemap({
            width: Math.ceil(levelData.pxWid / tileLayer.__gridSize),
            height: Math.ceil(levelData.pxHei / tileLayer.__gridSize),
            tileWidth: tileLayer.__gridSize,
            tileHeight: tileLayer.__gridSize
        });

        const tileset = map.addTilesetImage('megapixel');
        if (!tileset) {
            console.error('Failed to add tileset image');
            return { map: null, layer: null };
        }

        const layer = map.createBlankLayer('collision', tileset);
        if (!layer) {
            console.error('Failed to create collision layer');
            return { map: null, layer: null };
        }

        // Create a physics group for tiles
        this.scene.tileLayer = this.scene.physics.add.staticGroup();
        
        if (tileLayer.gridTiles) {
            tileLayer.gridTiles.forEach(tile => {
                const frameIndex = this.getFrameFromSrc(tile.src, tileLayer.__gridSize);
                
                // Create a physics-enabled sprite for each tile
                const tileSprite = this.scene.physics.add.sprite(
                    tile.px[0],
                    tile.px[1],
                    'megapixel',
                    frameIndex
                );
                tileSprite.setOrigin(0);
                tileSprite.setImmovable(true);
                tileSprite.body.allowGravity = false;
                this.scene.tileLayer.add(tileSprite);

                // Add collision tile to the tilemap layer
                const tileX = Math.floor(tile.px[0] / tileLayer.__gridSize);
                const tileY = Math.floor(tile.px[1] / tileLayer.__gridSize);
                const collisionTile = layer.putTileAt(frameIndex, tileX, tileY);
                if (collisionTile) {
                    collisionTile.setCollision(true);
                }
            });
        }

        // Enable collision for the entire layer
        layer.setCollisionByProperty({ collides: true });
        layer.setCollision(0, true); // Enable collision for all tiles

        return { map, layer };
    }

    getFrameFromSrc(src, gridSize) {
        const tilesPerRow = 25;
        const tileX = src[0] / gridSize;
        const tileY = src[1] / gridSize;
        return tileY * tilesPerRow + tileX;
    }
}
