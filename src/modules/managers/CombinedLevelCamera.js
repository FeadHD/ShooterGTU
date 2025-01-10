export class CombinedLevelCamera {
    constructor(scene, levelWidth = 3840, levelHeight = 720) {
        this.scene = scene;
        this.camera = scene.cameras.main;
        this.isIntroPlaying = false;
        this.defaultZoom = 1.5;
        
        // Get game dimensions
        const { width, height } = scene.scale;
        this.gameWidth = width;
        this.gameHeight = height;
        
        // Level dimensions
        this.levelWidth = levelWidth;
        this.levelHeight = levelHeight;
        
        // Camera settings
        this.followOffsetX = width / 4; // Position player 1/4 from left of screen
        this.followOffsetY = 0;
        this.followLerpX = 0.1;
        this.followLerpY = 0.1;
        this.deadZoneWidth = width / 3; // Mario-style deadzone
        this.deadZoneHeight = height / 4;
        
        // Progressive loading
        this.loadAheadDistance = width * 2; // Load 2 screens ahead
        this.unloadBehindDistance = -width; // Unload 1 screen behind
        
        // Transition settings
        this.transitionThreshold = 50;
        this.lastUpdateTime = 0;
        this.updateInterval = 100;
        this.currentBounds = { x: 0, y: 0, width: width, height: height };

        // Find UI camera if it exists
        this.uiCamera = scene.cameras.cameras.find(cam => cam !== this.camera);

        // Store intro tweens
        this.introTweens = [];
    }

    init(player) {
        this.player = player;
        
        // Set up camera to follow player with deadzone
        this.camera.startFollow(player, true, this.followLerpX, this.followLerpY);
        this.camera.setFollowOffset(this.followOffsetX, this.followOffsetY);
        this.camera.setZoom(this.defaultZoom);
        this.camera.setRoundPixels(true);
        
        // Set initial camera bounds
        this.camera.setBounds(0, 0, this.levelWidth, this.levelHeight);
        
        // Set up Mario-style deadzone
        this.camera.setDeadzone(this.deadZoneWidth, this.deadZoneHeight);
        
        console.log('Camera initialized with Mario-style following');
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

    checkProgressiveLoading() {
        if (!this.player) return;
        
        const cameraRight = this.camera.scrollX + this.camera.width;
        const cameraLeft = this.camera.scrollX;
        const playerX = this.player.x;
        
        // Check both directions from player position
        this.scene.loadAdjacentSections(playerX);
        
        // Update unloading to work in both directions
        if (Math.abs(playerX - this.camera.scrollX) > Math.abs(this.unloadBehindDistance)) {
            this.scene.cleanupBehindPlayer(playerX);
        }
    }

    update() {
        if (!this.player) return;
        
        // Check for progressive loading
        this.checkProgressiveLoading();
        
        // Camera restriction removed to allow backward movement
        
        const now = performance.now();
        if (now - this.lastUpdateTime < this.updateInterval) return;
        this.lastUpdateTime = now;

        // Get current level
        const currentLevel = this.scene.currentLevel || 0;
        const levelWidth = this.scene.scale.width;
        
        // Calculate camera bounds for current level
        const targetBounds = {
            x: currentLevel * levelWidth,
            y: 0,
            width: levelWidth,
            height: this.scene.scale.height
        };
        
        // Only update bounds if they've significantly changed
        if (Math.abs(this.currentBounds.x - targetBounds.x) > this.transitionThreshold || 
            Math.abs(this.currentBounds.width - targetBounds.width) > this.transitionThreshold) {
            
            this.camera.setBounds(targetBounds.x, targetBounds.y, targetBounds.width, targetBounds.height);
            this.currentBounds = { ...targetBounds };
            console.log('Updated camera bounds:', targetBounds);
        }

        // Get the current screen section
        const screenWidth = this.gameWidth;
        const playerOffset = this.player.x - (currentLevel * levelWidth);
        const currentSection = Math.floor(playerOffset / screenWidth);
        
        // Calculate target camera position with level offset
        const targetX = (currentLevel * levelWidth) + (currentSection * screenWidth);
        
        // If we're in a new section and not too close to the previous position
        if (Math.abs(targetX - this.camera.scrollX) > this.transitionThreshold) {
            // Use lerp for smooth transition
            const t = 0.1; // Adjust this value to control smoothness
            this.camera.scrollX = Phaser.Math.Linear(this.camera.scrollX, targetX, t);
        }

        // Smooth vertical following
        const idealY = this.player.y - (this.camera.height * 0.5);
        this.camera.scrollY = Phaser.Math.Linear(this.camera.scrollY, idealY, 0.1);
    }
}
