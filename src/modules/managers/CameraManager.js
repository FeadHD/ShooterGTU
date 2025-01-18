/**
 * CameraManager.js
 * Controls game camera behavior, following, and transitions
 * Handles progressive level loading and intro sequences
 * Manages camera bounds and UI camera separation
 */

export class CameraManager {
    /**
     * Initialize camera system with level dimensions
     * Sets up following, deadzone, and progressive loading settings
     */
    constructor(scene, levelWidth = 3840, levelHeight = 1080) {
        this.scene = scene;
        this.camera = scene.cameras.main;
        this.isIntroPlaying = false;
        this.defaultZoom = 1.5;
        this.player = null;

        // Game dimensions
        const { width, height } = scene.scale;
        this.gameWidth = width;
        this.gameHeight = height;
        this.levelWidth = levelWidth;
        this.levelHeight = levelHeight;

        // Separate UI camera from main camera
        this.uiCamera = scene.cameras.cameras.find(cam => cam !== this.camera);
        this.introTweens = [];

        // Camera follow settings
        this.followOffsetX = width / 8;     // Offset right by 1/8 screen
        this.followOffsetY = 0;
        this.followLerpX = 0.1;             // Smooth follow interpolation
        this.followLerpY = 0.1;
        this.deadZoneWidth = width / 4;     // Player movement buffer zone
        this.deadZoneHeight = height / 4;

        // Progressive level loading settings
        this.lastUpdateTime = performance.now();
        this.updateInterval = 100;          // Check every 100ms
        this.loadBuffer = 2;                // Keep 2 sections loaded
        this.sectionWidth = 640;            // Section size in pixels
    }

    /**
     * Set up camera with player and level bounds
     * Initializes following, zoom, and rendering settings
     */
    init({ player, levelBounds }) {
        if (!player) {
            console.warn('CameraManager: No player provided for initialization');
            return;
        }

        this.player = player;
        
        if (!this.camera) {
            console.warn('CameraManager: Camera not found');
            return;
        }

        // Set camera bounds from level or default dimensions
        const width = levelBounds?.width || this.levelWidth;
        const height = levelBounds?.height || this.levelHeight;
        this.camera.setBounds(0, 0, width, height);
        this.levelWidth = width;
        this.levelHeight = height;
        
        console.log("Camera Bounds set to:", { 
            width, 
            height,
            playerPos: { x: player.x, y: player.y }
        });
        
        // Configure camera properties
        this.camera.startFollow(player, true, this.followLerpX, this.followLerpY);
        this.camera.setZoom(this.defaultZoom);
        this.camera.setRoundPixels(true);
        this.camera.setDeadzone(this.deadZoneWidth, this.deadZoneHeight);
        this.camera.setFollowOffset(-this.followOffsetX, this.followOffsetY);

        // Update UI camera settings if UI exists
        if (this.scene.gameUI) {
            this.scene.gameUI.updateCameraIgnoreList();
        }
    }

    /**
     * Basic camera setup for following player
     * Used when full initialization isn't needed
     */
    setupCamera() {
        console.log('Setting up camera');
        const camera = this.scene.cameras.main;
        camera.startFollow(this.scene.player);
    }

    /**
     * Update camera bounds and check for progressive loading
     * Called every frame when not in intro sequence
     */
    update() {
        if (!this.player || this.isIntroPlaying) return;
        
        // Throttle updates to updateInterval
        const now = performance.now();
        if (now - this.lastUpdateTime < this.updateInterval) return;
        this.lastUpdateTime = now;

        if (!this.camera || !this.camera.bounds) return;

        // Update bounds based on current level
        const currentLevel = this.scene.currentLevel || 0;
        const levelWidth = this.scene.scale.width;
        
        const targetBounds = {
            x: currentLevel * levelWidth,
            y: 0,
            width: levelWidth,
            height: this.scene.scale.height
        };

        // Only update bounds if they've changed
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
            console.log("Camera Bounds:", { x: targetBounds.x, y: targetBounds.y, width: targetBounds.width, height: targetBounds.height });
        }

        this.checkProgressiveLoading();
    }

    /**
     * Check and trigger progressive level loading
     * Loads sections ahead of and behind player position
     */
    checkProgressiveLoading() {
        if (!this.player || !this.scene.loadLevelSection) return;

        const playerX = this.player.x;
        if (typeof playerX === 'undefined') return;

        const playerSection = Math.floor(playerX / this.sectionWidth);
        
        if (this.scene.loadLevelSection) {
            // Load previous, current, and next sections
            const sectionsToLoad = [-1, 0, 1];
            sectionsToLoad.forEach(offset => {
                const sectionToLoad = playerSection + offset;
                if (sectionToLoad >= 0) {
                    this.scene.loadLevelSection(sectionToLoad * this.sectionWidth);
                }
            });
        }
    }

    /**
     * Reset camera bounds to full level dimensions
     */
    updateCameraBounds() {
        if (!this.camera) return;
        
        this.camera.setBounds(0, 0, this.levelWidth, this.levelHeight);
        console.log("Camera Bounds:", { x: 0, y: 0, width: this.levelWidth, height: this.levelHeight });
    }

    /**
     * Play camera intro sequence
     * Pans to player position with easing
     */
    playIntroSequence(player) {
        this.isIntroPlaying = true;
        this.player = player;

        const startX = this.camera.scrollX;
        const startY = this.camera.scrollY;

        // Pan camera to player
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

    /**
     * Stop intro sequence and resume normal camera following
     */
    stopIntroSequence() {
        this.isIntroPlaying = false;
        
        // Clean up tweens
        this.introTweens.forEach(tween => {
            if (tween.isPlaying) tween.stop();
        });
        this.introTweens = [];

        // Resume player following
        if (this.player) {
            this.camera.startFollow(this.player, true, this.followLerpX, this.followLerpY);
        }
    }
}

export default CameraManager;