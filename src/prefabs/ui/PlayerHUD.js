export class PlayerHUD {
    static ASSETS = {
        HEALTH: 'assets/PlayerHUD/health.png',
        HEALTH_2: 'assets/PlayerHUD/health_2.png',
        LIFEBAR: 'assets/PlayerHUD/lifebar.png',
        STAMINA: 'assets/PlayerHUD/stamina.png'
    };

    static SPRITE_CONFIG = {
        frameWidth: 103,
        frameHeight: 32,
        startFrame: 0,
        endFrame: 10
    };

    static preloadAssets(scene) {
        // Load health bar sprites
        scene.load.spritesheet('health', this.ASSETS.HEALTH, {
            frameWidth: this.SPRITE_CONFIG.frameWidth,
            frameHeight: this.SPRITE_CONFIG.frameHeight,
            startFrame: this.SPRITE_CONFIG.startFrame,
            endFrame: this.SPRITE_CONFIG.endFrame
        });

        scene.load.spritesheet('health_2', this.ASSETS.HEALTH_2, {
            frameWidth: this.SPRITE_CONFIG.frameWidth,
            frameHeight: this.SPRITE_CONFIG.frameHeight,
            startFrame: this.SPRITE_CONFIG.startFrame,
            endFrame: this.SPRITE_CONFIG.endFrame
        });

        // Load lifebar background
        scene.load.image('lifebar', this.ASSETS.LIFEBAR);

        // Load stamina bar sprite
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
        this.maxHealth = 100;
        this.maxStamina = 100;
        this.currentHealth = this.maxHealth;
        this.previousHealth = this.maxHealth;
        this.currentStamina = this.maxStamina;
        this.previousStamina = this.maxStamina;
        this.isAnimating = false;
        this.currentFrame = 0;
        this.isDying = false;

        // Create container for HUD elements
        this.container = scene.add.container(x, y);
        
        // Add lifebar background
        this.lifebar = scene.add.image(5, 5, 'lifebar');
        this.lifebar.setOrigin(0, 0);
        this.lifebar.setScale(2);
        this.lifebar.isUIElement = true;

        // Add health bar sprite
        this.healthSprite = scene.add.sprite(5, 5, 'health');
        this.healthSprite.setOrigin(0, 0);
        this.healthSprite.setScale(2);
        this.healthSprite.isUIElement = true;

        // Create health frames if they don't exist
        if (!scene.anims.exists('health_100')) {
            // Create individual frame animations for each health range
            for (let i = 0; i <= 10; i++) {
                scene.anims.create({
                    key: `health_${i}`,
                    frames: [{ key: 'health', frame: i }],
                    frameRate: 0,
                    repeat: 0
                });
            }
        }

        // Add stamina bar sprite
        this.staminaSprite = scene.add.sprite(5, 5, 'stamina');
        this.staminaSprite.setOrigin(0, 0);
        this.staminaSprite.setScale(2);
        this.staminaSprite.isUIElement = true;

        // Create stamina frames if they don't exist
        if (!scene.anims.exists('stamina_100')) {
            // Create individual frame animations for each stamina range
            for (let i = 0; i <= 10; i++) {
                scene.anims.create({
                    key: `stamina_${i}`,
                    frames: [{ key: 'stamina', frame: i }],
                    frameRate: 0,
                    repeat: 0
                });
            }
        }

        // Add all elements to container
        this.container.add([this.lifebar, this.healthSprite, this.staminaSprite]);
        
        // Fix to camera if requested
        if (fixedToCamera) {
            this.container.setScrollFactor(0);
        }

        // Set depth to ensure it's on top
        this.container.setDepth(1000);

        // Listen for player respawn event
        scene.events.on('player-respawn', this.handleRespawn, this);

        // Update initial displays
        this.updateHealth(this.currentHealth);
        this.updateStamina(this.currentStamina);
    }

    reset() {
        // Reset animation state
        this.isAnimating = false;
        this.isDying = false;
        
        // Stop any existing animations
        if (this.healthSprite.anims.isPlaying) {
            this.healthSprite.anims.stop();
        }
        
        // Reset sprites to frame 0 (full)
        this.healthSprite.setFrame(0);
        this.staminaSprite.setFrame(0);
        
        // Reset all values to initial state
        this.currentHealth = this.maxHealth;
        this.previousHealth = this.maxHealth;
        this.currentStamina = this.maxStamina;
        this.previousStamina = this.maxStamina;
        this.currentFrame = 0;

        // Clean up any existing animations
        const existingAnims = this.scene.anims.anims.entries;
        Object.keys(existingAnims).forEach(key => {
            if (key.startsWith('health_change_')) {
                this.scene.anims.remove(key);
            }
        });
    }

    getHealthFrame(health) {
        // Calculate frame based on health percentage (0-10 frames)
        const healthPercent = (health / this.maxHealth) * 100;
        if (healthPercent <= 0) return 10;
        if (healthPercent <= 10) return 9;
        if (healthPercent <= 20) return 8;
        if (healthPercent <= 30) return 7;
        if (healthPercent <= 40) return 6;
        if (healthPercent <= 50) return 5;
        if (healthPercent <= 60) return 4;
        if (healthPercent <= 70) return 3;
        if (healthPercent <= 80) return 2;
        if (healthPercent <= 90) return 1;
        return 0;
    }

    updateHealth(health) {
        // Store previous values
        this.previousHealth = this.currentHealth;
        this.currentHealth = Phaser.Math.Clamp(health, 0, this.maxHealth);

        // Calculate frames based on actual health values
        const prevFrame = this.getHealthFrame(this.previousHealth);
        const targetFrame = this.getHealthFrame(this.currentHealth);

        // Debug log
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

        // If no change in frames, just set directly
        if (prevFrame === targetFrame) {
            this.healthSprite.setFrame(targetFrame);
            return;
        }

        // Check if this is a death update
        if (this.currentHealth === 0 && this.previousHealth > 0) {
            this.isDying = true;
            return; // Let TestingGroundScene handle the death animation
        }

        // If we're already animating, wait for it to finish
        if (this.isAnimating) {
            return;
        }

        // Calculate how many frames we need to animate through
        const frames = [];

        if (this.currentHealth < this.previousHealth) {
            // Health decreasing
            for (let i = prevFrame; i <= targetFrame; i++) {
                frames.push({ key: 'health', frame: i });
            }
        } else {
            // Health increasing
            for (let i = prevFrame; i >= targetFrame; i--) {
                frames.push({ key: 'health', frame: i });
            }
        }

        // Create and play the animation
        const animKey = `health_change_${Date.now()}`;
        this.isAnimating = true;

        this.scene.anims.create({
            key: animKey,
            frames: frames,
            frameRate: 8,
            repeat: 0
        });

        this.healthSprite.play(animKey);
        this.healthSprite.once('animationcomplete', () => {
            this.scene.anims.remove(animKey);
            this.healthSprite.setFrame(targetFrame);
            this.isAnimating = false;
        });
    }

    updateStamina(stamina) {
        this.previousStamina = this.currentStamina;
        this.currentStamina = Phaser.Math.Clamp(stamina, 0, this.maxStamina);
        
        // Calculate which frame to show based on stamina (10 frames, each representing 10% of max stamina)
        const frame = Math.min(10, Math.floor((this.maxStamina - this.currentStamina) / 10));
        
        // Set the frame directly without animation
        this.staminaSprite.setFrame(frame);
    }

    handleRespawn() {
        console.log('Player respawned, animating health back to full');
        // Get the current frame the sprite is showing
        const currentFrame = parseInt(this.healthSprite.frame.name);
        
        // Create frames array from current frame back to 0
        const frames = [];
        for (let i = currentFrame; i >= 0; i--) {
            frames.push({ key: 'health', frame: i });
        }

        const animKey = `health_respawn_${Date.now()}`;
        this.isAnimating = true;

        // Create and play respawn animation
        this.scene.anims.create({
            key: animKey,
            frames: frames,
            frameRate: 12,
            repeat: 0
        });

        this.healthSprite.play(animKey);
        this.healthSprite.once('animationcomplete', () => {
            this.scene.anims.remove(animKey);
            this.healthSprite.setFrame(0);
            this.isAnimating = false;
            this.isDying = false;
            this.currentHealth = this.maxHealth;
            this.previousHealth = this.maxHealth;
        });
    }

    contains(gameObject) {
        // Check if the object is part of this HUD
        if (!this.container) return false;
        return this.container.list.includes(gameObject) || 
               gameObject === this.container ||
               gameObject === this.lifebar ||
               gameObject === this.healthSprite ||
               gameObject === this.staminaSprite;
    }

    destroy() {
        if (this.container) {
            this.container.destroy();
        }
    }
}
