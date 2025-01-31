/**
 * PlayerHUD.js
 * Updated to remove local animation creation.
 * It defers partial/step-frame transitions to the AnimationManager.
 */
export class PlayerHUD {
    static ASSETS = {
        HEALTH: 'assets/PlayerHUD/health.png',
        LIFEBAR: 'assets/PlayerHUD/lifebar.png',
        STAMINA: 'assets/PlayerHUD/stamina.png'
    };

    static SPRITE_CONFIG = {
        frameWidth: 103,
        frameHeight: 32,
        startFrame: 0,
        endFrame: 9,
    };

    /**
     * Preload all HUD assets (called from Preloader or AssetManager)
     */
    static preloadAssets(scene) {
        scene.load.spritesheet('health', this.ASSETS.HEALTH, {
            frameWidth: this.SPRITE_CONFIG.frameWidth,
            frameHeight: this.SPRITE_CONFIG.frameHeight,
            startFrame: this.SPRITE_CONFIG.startFrame,
            endFrame: this.SPRITE_CONFIG.endFrame
        });

        scene.load.image('lifebar', this.ASSETS.LIFEBAR);

        scene.load.spritesheet('stamina', this.ASSETS.STAMINA, {
            frameWidth: this.SPRITE_CONFIG.frameWidth,
            frameHeight: this.SPRITE_CONFIG.frameHeight,
            startFrame: this.SPRITE_CONFIG.startFrame,
            endFrame: this.SPRITE_CONFIG.endFrame
        });
    }

    constructor(scene, x, y, fixedToCamera = true) {
        this.scene = scene;
        this.x = x;
        this.y = y;

        // Base stats
        this.maxHealth = 100;
        this.maxStamina = 100;
        this.currentHealth = this.maxHealth;
        this.previousHealth = this.maxHealth;
        this.currentStamina = this.maxStamina;
        this.previousStamina = this.maxStamina;

        // HUD state
        this.isAnimating = false;
        this.isDying = false;
        this.currentFrame = 0;

        // Create a container to hold HUD elements
        this.container = scene.add.container(x, y);

        // Lifebar background
        this.lifebar = scene.add.image(5, 5, 'lifebar')
            .setOrigin(0, 0)
            .setScale(2);
        this.lifebar.isUIElement = true;

        // Health bar sprite
        this.healthSprite = scene.add.sprite(5, 5, 'health')
            .setOrigin(0, 0)
            .setScale(2);
        this.healthSprite.isUIElement = true;

        // Stamina bar sprite
        this.staminaSprite = scene.add.sprite(5, 5, 'stamina')
            .setOrigin(0, 0)
            .setScale(2);
        this.staminaSprite.isUIElement = true;

        // Add them all to the container
        this.container.add([this.lifebar, this.healthSprite, this.staminaSprite]);

        // Optionally fix to the camera
        if (fixedToCamera) {
            this.container.setScrollFactor(0);
        }

        // Put HUD in front
        this.container.setDepth(1000);

        // (Optional) Listen for custom 'player-respawn' event
        scene.events.on('player-respawn', this.handleRespawn, this);

        // Update the HUD to initial full bars
        this.updateHealth(this.currentHealth);
        this.updateStamina(this.currentStamina);
    }

    /**
     * Clears HUD states and resets everything
     */
    reset() {
        this.isAnimating = false;
        this.isDying = false;

        // Stop animations
        if (this.healthSprite.anims.isPlaying) {
            this.healthSprite.anims.stop();
        }

        // Reset bar frames
        this.healthSprite.setFrame(0);
        this.staminaSprite.setFrame(0);

        // Reset numeric state
        this.currentHealth = this.maxHealth;
        this.previousHealth = this.maxHealth;
        this.currentStamina = this.maxStamina;
        this.previousStamina = this.maxStamina;
        this.currentFrame = 0;

        // (Optional) Remove any leftover ephemeral anim keys if you had them
        // const existingAnims = this.scene.anims.anims.entries;
        // Object.keys(existingAnims).forEach(key => {
        //     if (key.startsWith('health_change_')) {
        //         this.scene.anims.remove(key);
        //     }
        // });
    }

    /**
     * Returns the frame index (0..9) based on % health
     */
    getHealthFrame(health) {
        const healthPercent = (health / this.maxHealth) * 100;
        if (healthPercent <= 0)  return 9;
        if (healthPercent <= 10) return 8;
        if (healthPercent <= 20) return 7;
        if (healthPercent <= 30) return 6;
        if (healthPercent <= 40) return 5;
        if (healthPercent <= 50) return 4;
        if (healthPercent <= 60) return 3;
        if (healthPercent <= 70) return 2;
        if (healthPercent <= 80) return 1;
        return 0; // above 80% => frame 0
    }

    /**
     * Called to update HUD health bar
     * @param {number} health - new health value
     */
    updateHealth(health) {
        this.previousHealth = this.currentHealth;
        this.currentHealth = Phaser.Math.Clamp(health, 0, this.maxHealth);

        const prevFrame = this.getHealthFrame(this.previousHealth);
        const targetFrame = this.getHealthFrame(this.currentHealth);

        console.log('Health Update:', {
            health,
            currentHealth: this.currentHealth,
            previousHealth: this.previousHealth,
            isDying: this.isDying,
            isAnimating: this.isAnimating,
            prevFrame,
            targetFrame,
            currentSpriteFrame: this.healthSprite.frame.name
        });

        // If no change, set frame directly
        if (prevFrame === targetFrame) {
            this.healthSprite.setFrame(targetFrame);
            return;
        }

        // If we just died
        if (this.currentHealth === 0 && this.previousHealth > 0) {
            this.isDying = true;
            this.healthSprite.setFrame(targetFrame); // e.g. frame 9
            return;
        }

        // If already animating, skip
        if (this.isAnimating) {
            return;
        }

        // Ask the AnimationManager to do the partial-step transition
        // (fall back to direct setFrame if manager is missing)
        const animations = this.scene.animations; 
        if (!animations || typeof animations.playHealthTransition !== 'function') {
            // Manager not available or missing the function—just set frame
            this.healthSprite.setFrame(targetFrame);
            return;
        }

        // Let the manager handle ephemeral anim creation & cleanup
        this.isAnimating = true;
        animations.playHealthTransition(
            this.healthSprite,
            prevFrame,
            targetFrame,
            () => {
                // Called on completion
                this.isAnimating = false;
                // If you need final logic, place it here
            }
        );
    }

    /**
     * Updates the stamina bar (directly sets frame with no partial stepping)
     */
    updateStamina(stamina) {
        this.previousStamina = this.currentStamina;
        this.currentStamina = Phaser.Math.Clamp(stamina, 0, this.maxStamina);

        // 10 frames total => 0 = full, 9 = empty
        const frame = Math.min(
            9,
            Math.floor((this.maxStamina - this.currentStamina) / 10)
        );
        this.staminaSprite.setFrame(frame);
    }

    /**
     * Optional: if the game triggers 'player-respawn' event,
     * run a quick "refill" animation from currentFrame to 0
     */
    handleRespawn() {
        console.log('Player respawned, animating health back to full');
        const currentFrame = parseInt(this.healthSprite.frame.name, 10);

        if (isNaN(currentFrame)) {
            // If we can't parse it, just set to 0
            this.healthSprite.setFrame(0);
            return;
        }

        // If there's an AnimationManager with a special "respawn" method:
        const animations = this.scene.animations;
        if (!animations || typeof animations.playHealthTransition !== 'function') {
            this.healthSprite.setFrame(0);
            return;
        }

        this.isAnimating = true;
        animations.playHealthTransition(
            this.healthSprite,
            currentFrame, // start
            0,            // end
            () => {
                // On complete
                this.healthSprite.setFrame(0);
                this.isAnimating = false;
                this.isDying = false;
                this.currentHealth = this.maxHealth;
                this.previousHealth = this.maxHealth;
            }
        );
    }

    /**
     * Utility to see if container holds a given object
     */
    contains(gameObject) {
        if (!this.container) return false;
        return (
            this.container.list.includes(gameObject) ||
            gameObject === this.container ||
            gameObject === this.lifebar ||
            gameObject === this.healthSprite ||
            gameObject === this.staminaSprite
        );
    }

    /**
     * Clean up HUD elements
     */
    destroy() {
        if (this.container) {
            this.container.destroy();
        }
    }
}
