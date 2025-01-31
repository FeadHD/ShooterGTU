// Error handling system for game errors and recovery

// Constants for error handling and monitoring
const ERROR_CONSTANTS = {
    DEBUG_TEXT_X: 10,               // X position of debug text
    DEBUG_TEXT_Y: 10,               // Y position of debug text
    DEBUG_TEXT_SIZE: '16px',        // Font size for debug text
    DEBUG_TEXT_COLOR: '#ff0000',    // Color for debug text
    DEBUG_TEXT_DURATION: 3000,      // How long to show debug text
    CONTROLLER_RETRY_DELAY: 100     // Delay before retrying controller initialization
};

const MONITORING_CONSTANTS = {
    FPS_THRESHOLD: 30,           // Minimum acceptable FPS
    TEXTURE_CHECK_INTERVAL: 1000, // How often to check textures (in ms)
    ENEMY_CHECK_INTERVAL: 500,    // How often to check enemies (in ms)
    MEMORY_THRESHOLD: 0.9,        // 90% memory usage threshold
    NETWORK_TIMEOUT: 5000,        // Network timeout in ms
    AUDIO_CHECK_INTERVAL: 2000    // How often to verify audio (in ms)
};

/**
 * Handles error detection, monitoring, and recovery for the game
 */
export class ErrorSystem {
    constructor(scene) {
        this.scene = scene;
        this.initializeErrorDetection();
    }

    /**
     * Initialize monitoring systems for error detection
     */
    initializeErrorDetection() {
        // Monitor frame rate
        this.scene.time.addEvent({
            delay: 1000,
            callback: this.checkPerformance,
            callbackScope: this,
            loop: true
        });

        // Monitor enemy rendering
        this.scene.time.addEvent({
            delay: MONITORING_CONSTANTS.ENEMY_CHECK_INTERVAL,
            callback: this.checkEnemyRendering,
            callbackScope: this,
            loop: true
        });

        // Monitor memory usage
        this.scene.time.addEvent({
            delay: 5000,
            callback: this.checkMemoryUsage,
            callbackScope: this,
            loop: true
        });

        // Monitor audio system
        this.scene.time.addEvent({
            delay: MONITORING_CONSTANTS.AUDIO_CHECK_INTERVAL,
            callback: this.checkAudioSystem,
            callbackScope: this,
            loop: true
        });
    }

    /**
     * Handle errors gracefully with debug output and recovery attempts.
     */
    handleError(error, context) {
        console.error(`Error in ${context}:`, error);
        
        // Log error but don't crash the game
        if (this.scene.debug && this.scene.debug.enabled) {
            // Create debug text for error
            const errorText = this.scene.add.text(
                ERROR_CONSTANTS.DEBUG_TEXT_X,
                ERROR_CONSTANTS.DEBUG_TEXT_Y,
                `Error: ${error.message} in ${context}`,
                {
                    fontSize: ERROR_CONSTANTS.DEBUG_TEXT_SIZE,
                    fill: ERROR_CONSTANTS.DEBUG_TEXT_COLOR
                }
            );
            errorText.setScrollFactor(0);
            errorText.setDepth(1000);
            
            // Remove text after delay
            this.scene.time.delayedCall(ERROR_CONSTANTS.DEBUG_TEXT_DURATION, () => {
                errorText.destroy();
            });
        }
        
        // Attempt recovery based on context
        switch(context) {
            case 'controller':
            case 'sound':
            case 'network':
                // Try to reinitialize the failed component
                this.reinitializeComponent(context);
                break;
            
            case 'player':
            case 'ui':
            case 'graphics':
                // Reset position or recreate visual elements
                this.resetGameElement(context);
                break;

            case 'save':
            case 'memory':
                // Handle data and resource management issues
                this.handleResourceError(context);
                break;
                
            case 'physics':
                if (this.scene.physics && this.scene.physics.world) {
                    this.scene.physics.world.resume();
                }
                break;
        }
    }

    /**
     * Helper method to reinitialize components that can be recreated
     */
    reinitializeComponent(context) {
        switch(context) {
            case 'controller':
                if (this.scene.controller) {
                    if (typeof this.scene.controller.destroy === 'function') {
                        this.scene.controller.destroy();
                    }
                    this.scene.controller = null;
                    this.scene.time.delayedCall(ERROR_CONSTANTS.CONTROLLER_RETRY_DELAY, () => {
                        this.scene.initializeController();
                    });
                }
                break;
            case 'sound':
                if (this.scene.musicManager) {
                    // Stop current music
                    this.scene.musicManager.stop();
                    // Attempt to restart the music manager
                    this.scene.time.delayedCall(ERROR_CONSTANTS.CONTROLLER_RETRY_DELAY, () => {
                        if (this.scene.musicManager && typeof this.scene.musicManager.play === 'function') {
                            // Try to restart the current music
                            this.scene.musicManager.play();
                        }
                    });
                }
                break;
            case 'network':
                // Try to reconnect to network services
                this.scene.time.delayedCall(ERROR_CONSTANTS.CONTROLLER_RETRY_DELAY, () => {
                    if (this.scene.network) {
                        this.scene.network.reconnect();
                    }
                });
                break;
        }
    }

    /**
     * Helper method to reset game elements to a known good state
     */
    resetGameElement(context) {
        switch (context) {
            case 'graphics':
                // Try to recover graphics by refreshing textures
                if (this.scene.game.renderer) {
                    this.scene.children.list.forEach(child => {
                        // Check if the child has a valid texture that supports refresh
                        if (child.texture && typeof child.texture.refresh === 'function') {
                            child.texture.refresh();
                        }
                    });
                    // Reset the camera to ensure proper rendering
                    if (this.scene.cameras && this.scene.cameras.main) {
                        this.scene.cameras.main.dirty = true;
                        this.scene.cameras.main.preRender();
                    }
                }
                break;
            // Other cases remain unchanged...
        }
    }

    /**
     * Helper method to handle data and resource management errors
     */
    handleResourceError(context) {
        switch(context) {
            case 'save':
                // Try to save again or recover last good save
                if (this.scene.persistence) {
                    console.warn('Save error detected, attempting to recover last good save...');
                    this.scene.persistence.recoverLastGoodSave().then(() => {
                        // Notify player that save was recovered
                        this.scene.events.emit('saveRecovered');
                    }).catch(err => {
                        console.error('Failed to recover save:', err);
                        // Create a fresh save if recovery fails
                        this.scene.persistence.createNewSave();
                    });
                }
                break;
            case 'memory':
                console.warn('Memory issue detected, attempting cleanup...');
                // Clear texture caches
                this.scene.textures.each(texture => {
                    if (!texture.key.startsWith('__default')) {
                        this.scene.textures.remove(texture);
                    }
                });
                // Clear audio
                this.scene.sound.removeAll();
                // Force garbage collection if possible
                if (typeof window.gc === 'function') {
                    window.gc();
                }
                // Reload essential textures
                this.scene.load.once('complete', () => {
                    console.log('Essential resources reloaded');
                });
                this.scene.load.start();
                break;
        }
    }

    /**
     * Check game performance (FPS)
     */
    checkPerformance() {
        const currentFPS = this.scene.game.loop.actualFps;
        if (currentFPS < MONITORING_CONSTANTS.FPS_THRESHOLD) {
            console.warn(`Low FPS detected: ${currentFPS}`);
            this.handleError(new Error(`FPS dropped below ${MONITORING_CONSTANTS.FPS_THRESHOLD}`), 'memory');
        }
    }

    /**
     * Check if enemies are rendering correctly
     */
/**
 * Check if enemies are rendering correctly
 */
checkEnemyRendering() {
    if (!this.scene.enemies || !this.scene.enemies.getChildren) {
        return;
    }

    this.scene.enemies.getChildren()
        .filter(child => child.isEnemy) // Ensure only enemies are processed
        .forEach(enemy => {
            if (!this.isEnemyValid(enemy)) {
                return;
            }

            if (enemy.visible && this.isEnemyInCameraView(enemy)) {
                if (!enemy.texture?.key) {
                    console.warn('Enemy texture not loaded properly:', enemy);
                    this.handleError(new Error('Enemy rendering failed'), 'graphics');
                }
            }
        });
}


/**
 * Validate enemy properties
 */
isEnemyValid(enemy) {
    if (!enemy || !enemy.active) {
        console.warn('Invalid enemy (inactive or null):', enemy);
        return false;
    }

    if (!enemy.texture || !enemy.frame || !enemy.frame.sourceSize) {
        console.warn('Invalid enemy properties:', {
            texture: enemy.texture?.key,
            frame: enemy.frame,
            sourceSize: enemy.frame?.sourceSize
        });
        this.handleError(new Error('Enemy initialization failed'), 'graphics');
        return false;
    }

    return true;
}

/**
 * Check if enemy is within the camera view
 */
isEnemyInCameraView(enemy) {
    try {
        const camera = this.scene.cameras.main;
        const bounds = enemy.getBounds();
        return camera.worldView.contains(bounds.x, bounds.y);
    } catch (error) {
        console.warn('Error checking enemy bounds:', error);
        return false;
    }
}


    /**
     * Monitor memory usage
     */
    checkMemoryUsage() {
        if (window.performance && window.performance.memory) {
            const memoryInfo = window.performance.memory;
            const usageRatio = memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit;

            if (usageRatio > MONITORING_CONSTANTS.MEMORY_THRESHOLD) {
                console.warn(`High memory usage detected: ${(usageRatio * 100).toFixed(2)}%`);
                this.handleError(new Error('High memory usage'), 'memory');
            }
        }
    }

    /**
     * Check audio system status
     */
    checkAudioSystem() {
        try {
            // Skip check if scene is transitioning or not fully initialized
            if (!this.scene || !this.scene.scene || this.scene.scene.isTransitioning) {
                return;
            }

            // Only check if we have sound manager and it's not explicitly muted
            if (!this.scene.sound || this.scene.sound.mute) {
                return;
            }

            // If music manager exists, verify it's in a valid state
            if (this.scene.musicManager && this.scene.musicManager.currentMusic) {
                const music = this.scene.musicManager.currentMusic;
                // Only report error if music should be playing but isn't
                if (music.shouldBePlaying && !music.isPlaying && !music.isPaused) {
                    console.warn('Background music stopped unexpectedly');
                    this.handleError(new Error('Audio system failure'), 'sound');
                }
            }
        } catch (error) {
            // Log but don't throw to prevent cascading errors
            console.warn('Error checking audio system:', error);
        }
    }
}
