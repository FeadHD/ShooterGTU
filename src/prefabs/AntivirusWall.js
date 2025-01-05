import { GameConfig } from '../config/GameConfig';

export class AntivirusWall {
    constructor(scene, startX = GameConfig.ANTIVIRUS_WALL.START_X) {
        this.scene = scene;
        this.initialX = startX;
        
        // Create a gradient effect using multiple rectangles
        const wallWidth = GameConfig.ANTIVIRUS_WALL.WIDTH;
        const height = scene.scale.height;
        
        // Create main wall with gradient effect
        const graphics = scene.add.graphics();
        graphics.fillGradientStyle(0x000000, 0x000000, 0x2a0033, 0x2a0033, 1); // Black to dark purple
        graphics.fillRect(0, 0, wallWidth, height);
        
        // Add a solid black core
        graphics.fillStyle(0x000000);
        graphics.fillRect(wallWidth * 0.25, 0, wallWidth * 0.5, height);
        
        // Convert graphics to texture
        const texture = graphics.generateTexture('antivirusWall', wallWidth, height);
        graphics.destroy();
        
        // Create the wall sprite using the generated texture
        this.wall = scene.add.sprite(startX, height / 2, 'antivirusWall');
        this.wall.setDepth(90); // Below UI (100) but above most game elements
        this.wall.setAlpha(0.9); // Slightly transparent
        
        // Add to physics
        scene.physics.add.existing(this.wall, false);
        this.wall.body.setImmovable(true);
        this.wall.body.allowGravity = false;
        
        // Configure movement
        this.speed = GameConfig.ANTIVIRUS_WALL.SPEED; // pixels per second
        this.active = false;
        
        // Create particle effects
        this.createParticles();
    }

    createParticles() {
        // Create particle manager
        this.particles = this.scene.add.particles(0, 0, 'flares', {
            frame: ['blue', 'white'],
            lifespan: 1000,
            speed: { min: 50, max: 100 },
            scale: { start: 0.4, end: 0 },
            blendMode: 'ADD',
            emitting: false,
            follow: this.wall,
            quantity: 4,
            frequency: 30,
            tint: 0x330066 // Purple tint
        });

        // Position particles relative to wall
        this.particles.setPosition(this.wall.x, this.wall.y);
        this.particles.setDepth(90); // Match wall depth
    }

    start() {
        this.active = true;
        if (this.particles) {
            this.particles.start();
        }
        
        // Add pulsing effect
        this.pulseEffect = this.scene.tweens.add({
            targets: this.wall,
            alpha: { from: 0.9, to: 1 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    stop() {
        this.active = false;
        if (this.particles) {
            this.particles.stop();
        }
        if (this.pulseEffect) {
            this.pulseEffect.stop();
        }
    }

    update(time, delta) {
        if (!this.active) return;

        // Move wall to the right
        this.wall.x += (this.speed * delta) / 1000;
        
        // Update particle position
        if (this.particles) {
            this.particles.setPosition(this.wall.x, this.wall.y);
        }
    }

    setSpeed(speed) {
        this.speed = speed;
    }

    getX() {
        return this.wall.x;
    }

    reset(x = this.initialX) {
        // Reset position
        this.wall.x = x;
        
        // Stop movement and effects
        this.stop();
        
        // Reset visual effects
        if (this.pulseEffect) {
            this.pulseEffect.stop();
            this.pulseEffect.remove();
            this.pulseEffect = null;
        }
        this.wall.setAlpha(0.9);
        
        // Reset particles
        if (this.particles) {
            this.particles.stop();
            this.particles.setPosition(x, this.wall.y);
        }
        
        this.active = false;
    }

    destroy() {
        if (this.particles) {
            this.particles.destroy();
        }
        this.wall.destroy();
    }
}
