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
    }

    init(player) {
        this.player = player;
        this.camera.startFollow(player);
        this.camera.setZoom(this.defaultZoom);

        // Make sure UI camera ignores game objects
        if (this.scene.gameUI) {
            this.scene.gameUI.updateCameraIgnoreList();
        }
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
        this.scene.tweens.add({
            targets: this.camera,
            zoom: targetZoom,
            duration: 3000,
            ease: 'Sine.easeOut',
            onStart: () => {
                // Update UI camera ignore list at start of sequence
                if (this.scene.gameUI) {
                    this.scene.gameUI.updateCameraIgnoreList();
                }
            },
            onComplete: () => {
                // Phase 2: Pan to the right
                this.scene.tweens.add({
                    targets: this.camera,
                    scrollX: maxScrollX,
                    duration: 4000,
                    ease: 'Sine.easeInOut',
                    onComplete: () => {
                        // Phase 3: Pan back and zoom in to player
                        this.scene.tweens.add({
                            targets: this.camera,
                            scrollX: this.player.x,
                            scrollY: this.player.y,
                            zoom: this.defaultZoom,
                            duration: 3000,
                            ease: 'Sine.easeInOut',
                            onComplete: () => {
                                // Resume following player
                                this.camera.startFollow(this.player);
                                this.isIntroPlaying = false;
                                
                                // Final UI camera update
                                if (this.scene.gameUI) {
                                    this.scene.gameUI.updateCameraIgnoreList();
                                }
                            }
                        });
                    }
                });
            }
        });
    }

    update() {
        if (!this.isIntroPlaying && this.player) {
            this.camera.startFollow(this.player);
        }
    }
}

export default CameraManager;