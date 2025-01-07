export class CombinedLevelCamera {
    constructor(scene, levelWidth = 3840, levelHeight = 3240) {
        this.scene = scene;
        this.camera = scene.cameras.main;
        this.isIntroPlaying = false;
        this.defaultZoom = 1.5;
        
        // Get game dimensions
        const { width, height } = scene.scale;
        this.gameWidth = width;
        this.gameHeight = height;
        
        // Level dimensions from parameters or default to combined level size
        this.levelWidth = levelWidth;
        this.levelHeight = levelHeight;

        // Tile-based scrolling properties (Super Mario Bros 3 style)
        this.tileWidth = 256; // Width of one screen/tile
        this.tileHeight = 240; // Height of one screen/tile
        this.currentTileX = 0;
        this.currentTileY = 0;
        this.isTransitioning = false;
        this.transitionDuration = 200; // Faster transitions for snappier feel
        this.transitionThreshold = 32; // Distance from edge to trigger transition

        // Find UI camera if it exists
        this.uiCamera = scene.cameras.cameras.find(cam => cam !== this.camera);

        // Store intro tweens
        this.introTweens = [];
    }

    init(player) {
        this.player = player;
        this.camera.startFollow(player, true, 0.1, 0.1); // Smoother following
        this.camera.setZoom(this.defaultZoom);
        this.camera.setRoundPixels(true);
        
        // Set camera bounds to prevent showing outside of level
        this.camera.setBounds(0, 0, this.levelWidth, this.levelHeight);
        
        // Immediately center on player
        this.camera.centerOn(player.x, player.y);
        
        console.log('Camera initialized with:', {
            bounds: this.camera.getBounds(),
            playerPos: { x: player.x, y: player.y },
            zoom: this.camera.zoom
        });

        // Make sure UI camera ignores game objects
        if (this.scene.gameUI) {
            this.updateCameraIgnoreList();
        }
    }

    updateCameraBounds() {
        const bounds = {
            x: this.currentTileX * this.tileWidth,
            y: this.currentTileY * this.tileHeight,
            width: this.tileWidth,
            height: this.tileHeight
        };
        this.camera.setBounds(bounds.x, bounds.y, bounds.width, bounds.height);
    }

    checkTileTransition() {
        if (this.isTransitioning || !this.player) return;

        const playerTileX = Math.floor(this.player.x / this.tileWidth);
        const playerTileY = Math.floor(this.player.y / this.tileHeight);

        // Get player's position relative to current tile
        const relativeX = this.player.x - (this.currentTileX * this.tileWidth);
        const relativeY = this.player.y - (this.currentTileY * this.tileHeight);
        
        // Check if player has crossed screen boundaries
        if (relativeX >= this.tileWidth || relativeX < 0 || 
            relativeY >= this.tileHeight || relativeY < 0) {
            
            // Calculate new tile position
            const newTileX = Math.floor(this.player.x / this.tileWidth);
            const newTileY = Math.floor(this.player.y / this.tileHeight);
            
            // Only transition one screen at a time
            const targetTileX = Phaser.Math.Clamp(
                newTileX,
                this.currentTileX - 1,
                this.currentTileX + 1
            );
            const targetTileY = Phaser.Math.Clamp(
                newTileY,
                this.currentTileY - 1,
                this.currentTileY + 1
            );
            
            if (targetTileX !== this.currentTileX || targetTileY !== this.currentTileY) {
                this.transitionToTile(targetTileX, targetTileY);
            }
        }
    }

    transitionToTile(newTileX, newTileY) {
        this.isTransitioning = true;
        this.camera.stopFollow();

        const targetX = newTileX * this.tileWidth;
        const targetY = newTileY * this.tileHeight;

        // Use linear interpolation for crisp screen transitions
        this.scene.tweens.add({
            targets: this.camera,
            scrollX: targetX,
            scrollY: targetY,
            duration: this.transitionDuration,
            ease: 'Linear',
            onComplete: () => {
                this.currentTileX = newTileX;
                this.currentTileY = newTileY;
                this.updateCameraBounds();
                this.isTransitioning = false;
                this.camera.startFollow(this.player, true, 0.1, 0.1);
            }
        });
    }

    updateCameraIgnoreList() {
        if (this.scene.gameUI && this.scene.gameUI.container) {
            this.camera.ignore(this.scene.gameUI.container);
        }
    }

    update() {
        if (!this.player || !this.camera) return;

        // Get the current screen section
        const screenWidth = 256;
        const currentSection = Math.floor(this.player.x / screenWidth);
        
        // Calculate target camera position
        const targetX = currentSection * screenWidth;
        
        // If we're in a new section, start transition
        if (targetX !== this.camera.scrollX) {
            // Use lerp for smooth transition
            const t = 0.1; // Adjust this value to control smoothness (0.1 = very smooth, 0.5 = faster)
            this.camera.scrollX = Phaser.Math.Linear(this.camera.scrollX, targetX, t);
            
            // Snap to target if we're very close to avoid floating point issues
            if (Math.abs(this.camera.scrollX - targetX) < 0.1) {
                this.camera.scrollX = targetX;
            }
        }

        // Keep vertical position centered on player
        const centerY = this.player.y - this.camera.height * 0.5;
        this.camera.scrollY = centerY;
    }
}
