import { ParticlePool } from './pools/ParticlePool';

export class EffectsManager {
    constructor(scene) {
        this.scene = scene;
        this.sounds = {};
        this.particlePool = new ParticlePool(scene, 50);
        this.initializeSounds();
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
        this.particlePool.createEffect(x, y, color);
        this.playSound('hit');
    }

    createExplosionEffect(x, y) {
        this.particlePool.createEffect(x, y, 0xff0000, 20);
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
        this.particlePool.destroy();
    }
}