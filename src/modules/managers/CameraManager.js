class CameraManager {
    constructor(scene) {
        this.scene = scene;
        this.camera = scene.cameras.main;
        this.isIntroPlaying = false;
        this.defaultZoom = 1.5;
        
        // Get game dimensions
        const { width, height } = scene.scale;
        this.gameWidth = width;
        this.gameHeight = height;
        
        // Level dimensions (same as level 1)
        this.levelWidth = 3840;  // 3840 pixels wide
        this.levelHeight = 1080; // 1080 pixels high

        // Find UI camera if it exists
        this.uiCamera = scene.cameras.cameras.find(cam => cam !== this.camera);

        // Store active tweens
        this.introTweens = [];
    }

    init(player) {
        this.player = player;
        this.camera.startFollow(player, true, 1, 1);  // Use 1, 1 for instant following, no lerp
        this.camera.setZoom(this.defaultZoom);
        this.camera.setRoundPixels(true);  // Enable pixel-perfect rendering

        // Make sure UI camera ignores game objects
        if (this.scene.gameUI) {
            this.scene.gameUI.updateCameraIgnoreList();
        }
    }

    stopIntroSequence() {
        // Stop all intro tweens
        this.introTweens.forEach(tween => {
            if (tween && tween.isPlaying()) {
                tween.stop();
            }
        });
        this.introTweens = [];

        // Reset camera to follow player
        this.camera.setZoom(this.defaultZoom);
        this.camera.startFollow(this.player, true, 1, 1);  // Use 1, 1 for instant following
        this.camera.setRoundPixels(true);  // Enable pixel-perfect rendering
        this.isIntroPlaying = false;
    }

    playIntroSequence(player) {
        if (this.isIntroPlaying) return;
        this.isIntroPlaying = true;
        this.player = player;
        
        // Stop following player during intro
        this.camera.stopFollow();

        // Calculate zoom to show exactly 1080px height (level height)
        const targetZoom = this.gameHeight / this.levelHeight;

        // Calculate how much of the level width we can see at this zoom
        const visibleWidth = this.gameWidth / targetZoom;
        
        // Calculate the maximum scroll position
        const maxScrollX = this.levelWidth - visibleWidth;

        // Phase 1: Zoom out
        const zoomTween = this.scene.tweens.add({
            targets: this.camera,
            zoom: targetZoom,
            duration: 2000,
            ease: 'Power2',
            onStart: () => {
                // Update UI camera ignore list at start of sequence
                if (this.scene.gameUI) {
                    this.scene.gameUI.updateCameraIgnoreList();
                }
            },
            onComplete: () => {
                // Phase 2: Pan across level
                const panTween = this.scene.tweens.add({
                    targets: this.camera,
                    scrollX: maxScrollX,
                    duration: 4000,
                    ease: 'Power2',
                    onComplete: () => {
                        // Phase 3: Return to player
                        const returnTween = this.scene.tweens.add({
                            targets: this.camera,
                            zoom: this.defaultZoom,
                            scrollX: this.player.x - (this.gameWidth / (2 * this.defaultZoom)),
                            duration: 1000,
                            ease: 'Power2',
                            onComplete: () => {
                                this.camera.startFollow(this.player, true, 1, 1);  // Use 1, 1 for instant following
                                this.camera.setRoundPixels(true);  // Enable pixel-perfect rendering
                                this.isIntroPlaying = false;
                                
                                // Final UI camera update
                                if (this.scene.gameUI) {
                                    this.scene.gameUI.updateCameraIgnoreList();
                                }
                            }
                        });
                        this.introTweens.push(returnTween);
                    }
                });
                this.introTweens.push(panTween);
            }
        });
        this.introTweens.push(zoomTween);
    }

    update() {
        if (!this.isIntroPlaying && this.player) {
            this.camera.startFollow(this.player, true, 1, 1);  // Use 1, 1 for instant following
            this.camera.setRoundPixels(true);  // Enable pixel-perfect rendering
        }
    }
}

export default CameraManager;