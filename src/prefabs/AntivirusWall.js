import { GameConfig } from '../config/GameConfig';

export class AntivirusWall {
    constructor(scene, startX = GameConfig.ANTIVIRUS_WALL.START_OFFSET) {
        this.scene = scene;
        this.initialX = startX;
        
        // Store destroyed tiles information
        this.destroyedTiles = [];  // Array to store tile data
        this.movingForward = true; // Track direction
        
        // Create a gradient effect using multiple rectangles
        const wallWidth = GameConfig.ANTIVIRUS_WALL.WIDTH;
        const height = scene.scale.height;
        
        // Create main wall with gradient effect for destroyer mode
        const destroyerGraphics = scene.add.graphics();
        destroyerGraphics.fillStyle(0x000000, 0); // Transparent fill
        destroyerGraphics.fillRect(0, 0, wallWidth, height);
        
        // Create builder wall gradient effect
        const builderGraphics = scene.add.graphics();
        builderGraphics.fillStyle(0x00ff00, 0); // Transparent fill
        builderGraphics.fillRect(0, 0, wallWidth, height);
        
        // Convert graphics to textures
        const destroyerTexture = destroyerGraphics.generateTexture('antivirusWallDestroyer', wallWidth, height);
        const builderTexture = builderGraphics.generateTexture('antivirusWallBuilder', wallWidth, height);
        destroyerGraphics.destroy();
        builderGraphics.destroy();
        
        // Create the wall sprite using the destroyer texture initially
        this.wall = scene.add.sprite(startX, height / 2, 'antivirusWallDestroyer');
        this.wall.setDepth(-1); // Set depth to be behind the map layer
        this.wall.setAlpha(0); // Make wall completely invisible
        
        // Add to physics
        scene.physics.add.existing(this.wall, false);
        this.wall.body.setImmovable(true);
        this.wall.body.allowGravity = false;
        
        // Column movement configuration
        this.columnWidth = GameConfig.ANTIVIRUS_WALL.WIDTH;
        this.currentColumn = 0;
        this.targetX = startX;
        this.moveDelay = 100; // Reduced delay between movements
        this.lastMoveTime = 0;
        this.isMoving = false;
        this.active = false;

        // Set up tile destruction
        this.setupTileDestruction();
        
        // Create particle effects
        this.createParticles();
    }

    setupTileDestruction() {
        // Get the tilemap layers from the scene
        const layers = this.scene.map ? Object.values(this.scene.map.layers) : [];
        
        // For each layer, set up collision with the wall
        layers.forEach(layer => {
            if (layer.tilemapLayer) {
                this.scene.physics.add.overlap(this.wall, layer.tilemapLayer, (wall, tile) => {
                    // Get tile at the wall's position
                    const tiles = layer.tilemapLayer.getTilesWithinShape(wall.body);
                    
                    // Destroy each tile the wall overlaps with
                    tiles.forEach(tile => {
                        if (tile && tile.index !== -1) {  // -1 is an empty tile
                            // Store tile info before destruction
                            this.storeTileInfo(tile.x, tile.y, {
                                index: tile.index,
                                properties: tile.properties
                            });
                            layer.tilemapLayer.removeTileAt(tile.x, tile.y);
                            
                            // Create a destruction effect
                            this.createDestructionEffect(tile.pixelX, tile.pixelY);
                        }
                    });
                });
            }
        });
    }

    createDestructionEffect(x, y) {
        if (this.movingForward) {
            // Destruction effect with reduced particles
            const particles = this.scene.add.particles(x, y, 'flares', {
                frame: ['blue'],
                lifespan: 300,
                speed: { min: 50, max: 100 },
                scale: { start: 0.2, end: 0 },
                quantity: 2,
                tint: 0x330066,
                emitting: false
            });
            particles.explode(2);
            this.scene.time.delayedCall(300, () => particles.destroy());
        } else {
            // Building effect with reduced particles
            const particles = this.scene.add.particles(x, y, 'flares', {
                frame: ['blue'],
                lifespan: 300,
                speed: { min: 50, max: 100 },
                scale: { start: 0.2, end: 0 },
                quantity: 2,
                tint: 0x00ff00,
                emitting: false
            });
            particles.explode(2);
            this.scene.time.delayedCall(300, () => particles.destroy());
        }
    }

    createParticles() {
        // Create destroyer particles with more visible effects
        this.destroyerParticles = this.scene.add.particles(0, 0, 'flares', {
            frame: ['blue'],
            lifespan: 500,
            speed: { min: 50, max: 100 },
            scale: { start: 0.4, end: 0 }, // Increased particle size
            blendMode: 'ADD',
            emitting: false,
            quantity: 2,
            frequency: 100,
            tint: 0x330066
        });
        
        // Create builder particles with more visible effects
        this.builderParticles = this.scene.add.particles(0, 0, 'flares', {
            frame: ['blue'],
            lifespan: 500,
            speed: { min: 50, max: 100 },
            scale: { start: 0.4, end: 0 }, // Increased particle size
            blendMode: 'ADD',
            emitting: false,
            quantity: 2,
            frequency: 100,
            tint: 0x00ff00
        });
        
        // Position particles
        this.destroyerParticles.setPosition(this.wall.x, this.wall.y);
        this.builderParticles.setPosition(this.wall.x, this.wall.y);
        this.destroyerParticles.setDepth(1); // Increased depth to be more visible
        this.builderParticles.setDepth(1); // Increased depth to be more visible
    }

    // Method to switch wall appearance
    switchAppearance() {
        // Only update particles, wall remains invisible
        if (this.movingForward) {
            if (this.builderParticles) {
                this.builderParticles.stop();
            }
            if (this.destroyerParticles) {
                this.destroyerParticles.start();
            }
        } else {
            if (this.destroyerParticles) {
                this.destroyerParticles.stop();
            }
            if (this.builderParticles) {
                this.builderParticles.start();
            }
        }
    }

    start() {
        this.active = true;
        if (this.destroyerParticles) {
            this.destroyerParticles.start();
        }
        
        // Add pulsing effect
        this.pulseEffect = this.scene.tweens.add({
            targets: this.wall,
            alpha: { from: 0, to: 0 }, // Wall remains invisible
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    stop() {
        this.active = false;
        if (this.destroyerParticles) {
            this.destroyerParticles.stop();
        }
        if (this.builderParticles) {
            this.builderParticles.stop();
        }
        if (this.pulseEffect) {
            this.pulseEffect.stop();
        }
    }

    moveToNextColumn() {
        if (this.isMoving) return;
        
        this.isMoving = true;
        this.currentColumn++;
        this.targetX = this.initialX + (this.currentColumn * this.columnWidth);

        // Create a tween for smooth movement
        this.scene.tweens.add({
            targets: this.wall,
            x: this.targetX,
            duration: 100, // Faster movement
            ease: 'Linear', // Linear movement for constant speed
            onComplete: () => {
                this.isMoving = false;
            }
        });
    }

    reset() {
        console.log('Reset called - switching to backward movement');
        this.stop();
        this.isMoving = true;
        this.movingForward = false;
        this.switchAppearance(); // Switch to builder appearance
        
        // Calculate total distance to move
        const totalDistance = Math.abs(this.wall.x - this.initialX);
        const speed = 1200; // Increased speed (pixels per second)
        const duration = (totalDistance / speed) * 1000; // Convert to milliseconds
        
        // Move back to initial position outside map
        this.scene.tweens.add({
            targets: this.wall,
            x: this.initialX,
            duration: duration,
            ease: 'Linear',
            onUpdate: () => {
                if (this.builderParticles) {
                    this.builderParticles.setPosition(this.wall.x, this.wall.y);
                }
            },
            onComplete: () => {
                console.log('Reset complete - waiting before moving forward');
                this.currentColumn = 0;
                this.targetX = this.initialX;
                this.lastMoveTime = 0;
                this.isMoving = false;
                this.movingForward = true;
                this.destroyedTiles = []; // Clear any remaining stored tiles
                this.switchAppearance(); // Switch back to destroyer appearance
                
                // Wait 3 seconds before starting to move forward
                this.scene.time.delayedCall(3000, () => {
                    console.log('Starting forward movement');
                    // Emit event when wall is completely ready to move forward
                    this.scene.events.emit('wallResetComplete');
                    this.start();
                });
            }
        });
    }

    // Add method to store destroyed tile info
    storeTileInfo(x, y, tileData) {
        console.log('Storing tile:', { x, y, index: tileData.index });
        this.destroyedTiles.push({ ...tileData, x, y });
    }

    update(time, delta) {
        if (!this.active) return;

        if (!this.isMoving && time > this.lastMoveTime + this.moveDelay) {
            this.moveToNextColumn();
            this.lastMoveTime = time;
        }
        
        // Update particle positions
        if (this.movingForward) {
            if (this.destroyerParticles) {
                this.destroyerParticles.setPosition(this.wall.x, this.wall.y);
            }
        } else {
            if (this.builderParticles) {
                this.builderParticles.setPosition(this.wall.x, this.wall.y);
            }
            
            // Check all tiles in the current column when moving backward
            const currentTileX = Math.floor(this.wall.x / this.columnWidth);
            const mapLayer = this.scene.mapLayer;
            const height = this.scene.scale.height;
            const tileHeight = 32; // Standard tile height
            
            // Check each tile position in the column
            for (let y = 0; y < Math.ceil(height / tileHeight); y++) {
                const tile = mapLayer.getTileAt(currentTileX, y);
                if (!tile || !tile.visible) {
                    // Check if we have a stored tile for this position
                    for (let i = this.destroyedTiles.length - 1; i >= 0; i--) {
                        const storedTile = this.destroyedTiles[i];
                        if (storedTile.x === currentTileX && storedTile.y === y) {
                            // Make the tile visible again
                            const existingTile = mapLayer.getTileAt(currentTileX, y);
                            if (existingTile) {
                                existingTile.setVisible(true);
                                // Create building effect
                                if (this.createDestructionEffect) {
                                    this.createDestructionEffect(
                                        currentTileX * this.columnWidth + this.columnWidth / 2,
                                        y * tileHeight + tileHeight / 2
                                    );
                                }
                                // Remove from stored tiles
                                this.destroyedTiles.splice(i, 1);
                            }
                            break;
                        }
                    }
                }
            }
        }
    }

    getX() {
        return this.wall.x;
    }

    destroy() {
        if (this.destroyerParticles) {
            this.destroyerParticles.destroy();
        }
        if (this.builderParticles) {
            this.builderParticles.destroy();
        }
        if (this.pulseEffect) {
            this.pulseEffect.stop();
        }
        this.wall.destroy();
    }
}
