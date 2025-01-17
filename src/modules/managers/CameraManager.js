export class CameraManager {
    constructor(scene, levelWidth = 3840, levelHeight = 1080) {
        this.scene = scene;
        this.camera = scene.cameras.main;
        this.isIntroPlaying = false;
        this.defaultZoom = 1.5;
        this.player = null; // To be assigned later
        
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
        this.followOffsetX = width / 8; // Small offset to the right (1/8 of screen width)
        this.followOffsetY = 0;
        this.followLerpX = 0.1;
        this.followLerpY = 0.1;
        this.deadZoneWidth = width / 4; // Keep smaller deadzone for smooth movement
        this.deadZoneHeight = height / 4;

        // Progressive loading properties
        this.lastUpdateTime = performance.now();
        this.updateInterval = 100; // Update every 100ms
        this.loadBuffer = 2; // Number of sections to keep loaded
        this.sectionWidth = 640; // Width of each section in pixels
    }

    init({ player, levelBounds }) {
        if (!player) {
            console.warn('CameraManager: No player provided for initialization');
            return;
        }

        this.player = player;
        
        // Ensure camera exists
        if (!this.camera) {
            console.warn('CameraManager: Camera not found');
            return;
        }

        // Initialize camera bounds with level dimensions
        const width = levelBounds?.width || this.levelWidth;
        const height = levelBounds?.height || this.levelHeight;
        
        // Set camera bounds to full level width and height
        this.camera.setBounds(0, 0, width, height);
        this.levelWidth = width;  // Update levelWidth to match bounds
        this.levelHeight = height;  // Update levelHeight to match bounds
        
        console.log("Camera Bounds set to:", { 
            width, 
            height,
            playerPos: { x: player.x, y: player.y }
        });
        
        // Set up camera to follow player with lerp
        this.camera.startFollow(player, true, this.followLerpX, this.followLerpY);
        this.camera.setZoom(this.defaultZoom);
        this.camera.setRoundPixels(true);  // Enable pixel-perfect rendering
        
        // Set up deadzone for smoother camera movement
        this.camera.setDeadzone(this.deadZoneWidth, this.deadZoneHeight);
        
        // Offset camera slightly to the right
        this.camera.setFollowOffset(-this.followOffsetX, this.followOffsetY);

        // Make sure UI camera ignores game objects
        if (this.scene.gameUI) {
            this.scene.gameUI.updateCameraIgnoreList();
        }
    }

    setupCamera() {
        console.log('Setting up camera');
        // Add your camera setup logic here
        const camera = this.scene.cameras.main;
        camera.startFollow(this.scene.player); // Example: follow the player
    }

    update() {
        if (!this.player || this.isIntroPlaying) return;
        
        const now = performance.now();
        if (now - this.lastUpdateTime < this.updateInterval) return;
        this.lastUpdateTime = now;

        // Safety check for camera
        if (!this.camera || !this.camera.bounds) return;

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
            console.log("Camera Bounds:", { x: targetBounds.x, y: targetBounds.y, width: targetBounds.width, height: targetBounds.height });
        }

        // Check for progressive loading if the scene supports it
        this.checkProgressiveLoading();
    }

    checkProgressiveLoading() {
        // Early return if player or loadLevelSection doesn't exist
        if (!this.player || !this.scene.loadLevelSection) return;

        // Get player section
        const playerX = this.player.x;
        if (typeof playerX === 'undefined') return;

        // Calculate which section the player is in
        const playerSection = Math.floor(playerX / this.sectionWidth);
        
        // Load sections around player
        if (this.scene.loadLevelSection) {
            const sectionsToLoad = [-1, 0, 1]; // Load previous, current, and next sections
            sectionsToLoad.forEach(offset => {
                const sectionToLoad = playerSection + offset;
                if (sectionToLoad >= 0) {
                    this.scene.loadLevelSection(sectionToLoad * this.sectionWidth);
                }
            });
        }
    }

    updateCameraBounds() {
        if (!this.camera) return;
        
        this.camera.setBounds(0, 0, this.levelWidth, this.levelHeight);
        console.log("Camera Bounds:", { x: 0, y: 0, width: this.levelWidth, height: this.levelHeight });
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