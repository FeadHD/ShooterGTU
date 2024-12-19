export class LevelLoader {
    constructor(scene) {
        this.scene = scene;
    }

    loadLDtkLevel(levelData, tileset) {
        const { width, height } = this.scene.scale;
        
        // Create tilemap
        const map = this.scene.make.tilemap({
            width: levelData.pxWid / 16,
            height: levelData.pxHei / 16,
            tileWidth: 16,
            tileHeight: 16
        });

        // Add tileset
        const tilesetImage = map.addTilesetImage('Buildings', tileset, 16, 16);
        if (!tilesetImage) {
            console.error('Failed to create tileset!');
            return null;
        }

        // Create container for layers
        const mapContainer = this.scene.add.container(0, 0);

        // Process layers
        const layerInstances = [...levelData.layerInstances].reverse();
        const layers = layerInstances.map(layerInstance => {
            const layer = map.createBlankLayer(layerInstance.__identifier, tilesetImage, 0, 0);
            if (!layer) return null;

            // Place tiles
            layerInstance.gridTiles.forEach(tile => {
                const x = Math.floor(tile.px[0] / layerInstance.__gridSize);
                const y = Math.floor(tile.px[1] / layerInstance.__gridSize);
                const srcX = Math.floor(tile.src[0] / 16);
                const srcY = Math.floor(tile.src[1] / 16);
                const tileIndex = srcY * 20 + srcX;

                const placedTile = layer.putTileAt(tileIndex, x, y);
                if (placedTile) {
                    if (layerInstance.__identifier === 'Buildings') {
                        placedTile.properties = { collision: true };
                        placedTile.setCollision(true);
                    }
                }
            });

            layer.setVisible(true);
            mapContainer.add(layer);

            return layer;
        }).filter(layer => layer !== null);

        // Calculate scale and position
        const scaleX = (width * 0.9) / levelData.pxWid;
        const scaleY = (height * 0.9) / levelData.pxHei;
        const scale = Math.min(scaleX, scaleY);

        mapContainer.setScale(scale);
        mapContainer.setPosition(
            (width - (levelData.pxWid * scale)) / 2,
            (height - (levelData.pxHei * scale)) / 2
        );

        return {
            map,
            layers,
            container: mapContainer
        };
    }
}
