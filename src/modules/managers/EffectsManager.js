/**
 * EffectsManager.js
 * Manages visual and audio effects for game events
 * Handles particle effects, sound playback, and visual feedback
 */

import { ParticlePool } from './pools/ParticlePool';

export class EffectsManager {
    /**
     * Initialize effects system
     * Sets up sound and particle pools
     * @param {Phaser.Scene} scene - Scene to attach effects to
     */
    constructor(scene) {
        this.scene = scene;
        this.sounds = {};
        this.particlePool = new ParticlePool(scene, 50);  // Pool size of 50 particles
        this.initializeSounds();
    }

    /**
     * Load and configure game sound effects
     * Sets appropriate volume levels for different effect types
     */
    initializeSounds() {
        const soundKeys = ['laser', 'hit', 'playerHit', 'explosion'];
        soundKeys.forEach(key => {
            if (this.scene.cache.audio.exists(key)) {
                this.sounds[key] = this.scene.sound.add(key, { 
                    volume: key === 'laser' ? 0.05 :     // Quiet for frequent sounds
                            key === 'hit' ? 0.1 : 
                            key === 'playerHit' ? 0.15 : 
                            0.2                          // Default volume
                });
            }
        });
    }

    /**
     * Create hit particle effect and play sound
     * Used for general impact effects (bullets, collisions)
     */
    createHitEffect(x, y, color = 0xffff00) {
        this.particlePool.createEffect(x, y, color);
        this.playSound('hit');
    }

    /**
     * Create larger explosion effect and sound
     * Used for enemy deaths or major impacts
     */
    createExplosionEffect(x, y) {
        this.particlePool.createEffect(x, y, 0xff0000, 20);  // Red particles
        this.playSound('explosion');
    }

    /**
     * Play sound effect by key
     * Safely handles missing sound assets
     */
    playSound(key) {
        if (this.sounds[key]) {
            this.sounds[key].play();
        }
    }

    /**
     * Create flashing effect on target
     * Used for damage feedback or highlighting
     * @param {Phaser.GameObjects.Sprite} target - Object to flash
     * @param {number} duration - Flash duration in ms
     * @param {number} repeat - Number of flash cycles
     */
    createFlashEffect(target, duration = 100, repeat = 4) {
        if (!target) return;
        
        this.scene.tweens.add({
            targets: target,
            alpha: 0.5,                     // Flash transparency
            duration: duration,
            yoyo: true,                     // Fade in and out
            repeat: repeat,
            onComplete: () => target.setAlpha(1)
        });
    }

    /**
     * Clean up all effects
     * Called when transitioning scenes or shutting down
     */
    cleanup() {
        // Stop and destroy all sound effects
        Object.values(this.sounds).forEach(sound => {
            if (sound) {
                sound.stop();
                sound.destroy();
            }
        });
        this.sounds = {};

        // Clean up particle effects
        this.particlePool.destroy();
    }
}