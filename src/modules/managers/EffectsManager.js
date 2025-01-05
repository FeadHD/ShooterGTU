export class EffectsManager {
    constructor(scene) {
        this.scene = scene;
        this.sounds = {};
        this.initializeParticles();
        this.initializeSounds();
    }

    initializeParticles() {
        if (this.scene.textures.exists('particle')) {
            this.hitParticles = this.scene.add.particles({
                key: 'particle',
                config: {
                    speed: { min: 100, max: 200 },
                    scale: { start: 1, end: 0 },
                    tint: 0xffff00,
                    blendMode: 'ADD',
                    lifespan: 300,
                    quantity: 10,
                    emitZone: { type: 'random', source: new Phaser.Geom.Circle(0, 0, 20) }
                }
            });
        }
    }

    initializeSounds() {
        const soundKeys = ['laser', 'hit', 'playerHit', 'explosion'];
        soundKeys.forEach(key => {
            if (this.scene.cache.audio.exists(key)) {
                this.sounds[key] = this.scene.sound.add(key, { 
                    volume: key === 'laser' ? 0.05 : 
                            key === 'hit' ? 0.1 : 
                            key === 'playerHit' ? 0.15 : 
                            0.2 
                });
            }
        });
    }

    createHitEffect(x, y, color = 0xffff00) {
        for(let i = 0; i < 10; i++) {
            const particle = this.scene.add.circle(x, y, 3, color);
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 100;
            
            this.scene.tweens.add({
                targets: particle,
                x: particle.x + Math.cos(angle) * speed * 0.3,
                y: particle.y + Math.sin(angle) * speed * 0.3,
                alpha: 0,
                scale: 0.1,
                duration: 300,
                ease: 'Power2',
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
    }

    createExplosionEffect(x, y, scale = 1) {
        if (this.hitParticles) {
            this.hitParticles.emitParticleAt(x, y, 20);
        }
        this.playSound('explosion');
    }

    playSound(key) {
        if (this.sounds[key]) {
            this.sounds[key].play();
        }
    }

    createFlashEffect(target, duration = 100, repeat = 4) {
        if (!target) return;
        
        this.scene.tweens.add({
            targets: target,
            alpha: 0.5,
            duration: duration,
            yoyo: true,
            repeat: repeat,
            onComplete: () => target.setAlpha(1)
        });
    }

    cleanup() {
        // Clean up sounds
        Object.values(this.sounds).forEach(sound => {
            if (sound) {
                sound.stop();
                sound.destroy();
            }
        });
        this.sounds = {};

        // Clean up particles
        if (this.hitParticles) {
            this.hitParticles.destroy();
            this.hitParticles = null;
        }
    }
}