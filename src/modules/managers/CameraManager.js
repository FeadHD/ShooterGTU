class CameraManager {
    constructor(scene, levelWidth = 3840, levelHeight = 1080) {
        this.scene = scene;
        this.camera = scene.cameras.main;
        this.isIntroPlaying = false;
        this.defaultZoom = 1.5;
        
        // Get game dimensions
        const { width, height } = scene.scale;
        this.gameWidth = width;
        this.gameHeight = height;
        
        // Level dimensions from parameters or default to level 1 size
        this.levelWidth = levelWidth;
        this.levelHeight = levelHeight;

        // Find UI camera if it exists
        this.uiCamera = scene.cameras.cameras.find(cam => cam !== this.camera);

        // Store active tweens
        this.introTweens = [];

        // Camera settings from CombinedLevelCamera
        this.followOffsetX = width / 4; // Position player 1/4 from left of screen
        this.followOffsetY = 0;
        this.followLerpX = 0.1;
        this.followLerpY = 0.1;
        this.deadZoneWidth = width / 3; // Mario-style deadzone
        this.deadZoneHeight = height / 4;

        // Progressive loading properties
        this.lastUpdateTime = performance.now();
        this.updateInterval = 100; // Update every 100ms
        this.loadBuffer = 2; // Number of sections to keep loaded
        this.sectionWidth = 640; // Width of each section in pixels
    }

    init(player) {
        this.player = player;
        
        // Set up camera to follow player with lerp
        this.camera.startFollow(player, true, this.followLerpX, this.followLerpY);
        this.camera.setZoom(this.defaultZoom);
        this.camera.setRoundPixels(true);  // Enable pixel-perfect rendering
        
        // Set up deadzone for Mario-style camera
        this.camera.setDeadzone(this.deadZoneWidth, this.deadZoneHeight);
        
        // Set follow offset
        this.camera.setFollowOffset(-this.followOffsetX, this.followOffsetY);
        
        // Set camera bounds
        this.updateCameraBounds();

        // Make sure UI camera ignores game objects
        if (this.scene.gameUI) {
            this.scene.gameUI.updateCameraIgnoreList();
        }
    }

    update() {
        if (!this.player || this.isIntroPlaying) return;
        
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

        // Check if bounds need updating
        const boundsChanged = 
            this.camera.bounds.x !== targetBounds.x ||
            this.camera.bounds.y !== targetBounds.y ||
            this.camera.bounds.width !== targetBounds.width ||
            this.camera.bounds.height !== targetBounds.height;

        if (boundsChanged) {
            this.camera.setBounds(
                targetBounds.x,
                targetBounds.y,
                targetBounds.width,
                targetBounds.height
            );
        }

        // Check for progressive loading if the scene supports it
        this.checkProgressiveLoading();
    }

    checkProgressiveLoading() {
        if (!this.player || !this.scene.loadLevelSection) return;

        const playerSection = Math.floor(this.player.x / this.sectionWidth);
        
        // Load sections ahead of and behind the player
        for (let i = -this.loadBuffer; i <= this.loadBuffer; i++) {
            const sectionToLoad = playerSection + i;
            if (sectionToLoad >= 0) {
                const sectionStartX = sectionToLoad * this.sectionWidth;
                this.scene.loadLevelSection(sectionStartX);
            }
        }
    }

    updateCameraBounds() {
        if (!this.camera) return;
        
        this.camera.setBounds(0, 0, this.levelWidth, this.levelHeight);
    }

    playIntroSequence(player) {
        this.isIntroPlaying = true;
        this.player = player;

        // Store current camera position
        const startX = this.camera.scrollX;
        const startY = this.camera.scrollY;

        // Create pan tween
        this.introTweens.push(
            this.scene.tweens.add({
                targets: this.camera,
                scrollX: player.x - this.gameWidth / 2,
                scrollY: player.y - this.gameHeight / 2,
                duration: 2000,
                ease: 'Power2',
                onComplete: () => {
                    this.stopIntroSequence();
                }
            })
        );
    }

    stopIntroSequence() {
        this.isIntroPlaying = false;
        
        // Stop all intro tweens
        this.introTweens.forEach(tween => {
            if (tween.isPlaying) tween.stop();
        });
        this.introTweens = [];

        // Resume normal camera following
        if (this.player) {
            this.camera.startFollow(this.player, true, this.followLerpX, this.followLerpY);
        }
    }
}

export default CameraManager;