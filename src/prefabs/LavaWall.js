export class LavaWall {
    constructor(scene, startX = 0) {
        this.scene = scene;
        
        // Create the lava wall graphics
        this.wall = scene.add.rectangle(startX, scene.scale.height / 2, 50, scene.scale.height, 0xff4400);
        
        // Add glow effect
        this.wall.setPostPipeline('Glow');
        this.wall.pipeline.setFloat1('intensity', 0.5);
        
        // Add to physics
        scene.physics.add.existing(this.wall, false);
        this.wall.body.setImmovable(true);
        this.wall.body.allowGravity = false;
        
        // Configure movement
        this.speed = 100; // pixels per second
        this.active = false;
        
        // Particle effects
        this.createParticles();
    }

    createParticles() {
        this.particles = this.scene.add.particles('flares');
        
        this.emitter = this.particles.createEmitter({
            frame: 'red',
            lifespan: 1000,
            speed: { min: 50, max: 100 },
            scale: { start: 0.4, end: 0 },
            blendMode: 'ADD',
            on: false
        });
        
        // Attach emitter to wall
        this.emitter.startFollow(this.wall);
    }

    start() {
        this.active = true;
        this.emitter.start();
    }

    stop() {
        this.active = false;
        this.emitter.stop();
    }

    update(time, delta) {
        if (!this.active) return;

        // Move wall to the right
        this.wall.x += (this.speed * delta) / 1000;
        
        // Update particle position
        this.particles.x = this.wall.x;
    }

    setSpeed(speed) {
        this.speed = speed;
    }

    getX() {
        return this.wall.x;
    }

    reset(x = 0) {
        this.wall.x = x;
        this.stop();
    }

    destroy() {
        this.particles.destroy();
        this.wall.destroy();
    }
}
