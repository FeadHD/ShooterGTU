/**
 * AudioManager.js
 * Unified manager for both sound effects (SFX) and background music
 * Handles volume control, muting, and audio state persistence
 */

import { BaseManager } from '../di/BaseManager';

export default class AudioManager extends BaseManager {
    /**
     * Initialize audio management system
     * Sets up volume controls and registry listeners
     */
    constructor(scene) {
        super();
        this.scene = scene;

        // Sound Effects (SFX) Setup
        this.sounds = new Map();                                      // Key-value store for sound effects
        this.soundVolume = scene.registry.get('soundVolume') ?? 1;    // Default volume = 1
        this.isMuted = false;

        // Background Music Setup
        this.currentMusic = null;                                     // Single track playing at a time
        this.musicVolume = scene.registry.get('musicVolume') ?? 1;    // Default volume = 1

        // Volume Change Listeners
        scene.registry.events.on('changedata-soundVolume', (_, newValue) => {
            if (this.soundVolume !== newValue) {
                this.soundVolume = newValue;
                this._updateAllSoundVolumes();
            }
        });

        scene.registry.events.on('changedata-musicVolume', (_, newValue) => {
            if (this.musicVolume !== newValue) {
                this.musicVolume = newValue;
                if (this.currentMusic) {
                    this.currentMusic.setVolume(newValue);
                }
            }
        });
    }

    /**
     * SOUND EFFECTS (SFX) MANAGEMENT
     */

    // Add new sound to cache without playing
    add(key, config = {}) {
        if (!this.sounds.has(key)) {
            const soundObj = this.scene.sound.add(key, {
                volume: this.soundVolume,
                ...config
            });
            this.sounds.set(key, soundObj);
        }
    }

    // Play sound effect, create if not cached
    play(key, config = {}) {
        if (this.isMuted) return;

        let soundObj = this.sounds.get(key);
        if (!soundObj) {
            soundObj = this.scene.sound.add(key, {
                volume: this.soundVolume,
                ...config
            });
            this.sounds.set(key, soundObj);
        }

        if (!soundObj.isPlaying) {
            soundObj.play(config);
        }
    }

    // Stop specific sound effect
    stop(key) {
        const soundObj = this.sounds.get(key);
        if (soundObj) {
            soundObj.stop();
        }
    }

    // Stop all sound effects
    stopAll() {
        this.sounds.forEach(soundObj => {
            soundObj.stop();
        });
    }

    /**
     * GLOBAL AUDIO CONTROL
     */

    // Mute all audio (both SFX and music)
    mute() {
        this.isMuted = true;

        this.sounds.forEach(soundObj => {
            if (soundObj.isPlaying) {
                soundObj.pause();
            }
        });

        if (this.currentMusic && this.currentMusic.isPlaying) {
            this.currentMusic.pause();
        }
    }

    // Resume all previously playing audio
    unmute() {
        this.isMuted = false;

        this.sounds.forEach(soundObj => {
            if (soundObj.isPaused) {
                soundObj.resume();
            }
        });

        if (this.currentMusic && this.currentMusic.isPaused) {
            this.currentMusic.resume();
        }
    }

    // Update volume for all sound effects
    _updateAllSoundVolumes() {
        this.sounds.forEach(soundObj => {
            soundObj.setVolume(this.soundVolume);
        });
    }

    /**
     * VOLUME CONTROL
     */

    // Update SFX volume and persist to registry
    setSoundVolume(value) {
        if (this.soundVolume === value) return;
        this.soundVolume = value;
        this.scene.registry.set('soundVolume', value);
    }

    getSoundVolume() {
        return this.soundVolume;
    }

    // Update music volume and persist to registry
    setMusicVolume(value) {
        if (this.musicVolume === value) return;
        this.musicVolume = value;
        this.scene.registry.set('musicVolume', value);
    }

    getMusicVolume() {
        return this.musicVolume;
    }

    /**
     * BACKGROUND MUSIC MANAGEMENT
     */

    /**
     * Play background music track
     * Stops current track if different from requested
     * @param {string} key - Asset key for music track
     * @param {object} config - Phaser sound config (loop=true by default)
     */
    playMusic(key, config = {}) {
        if (this.currentMusic?.key === key && this.currentMusic.isPlaying) {
            this.currentMusic.setVolume(this.musicVolume);
            return;
        }

        this.stopMusic();

        this.currentMusic = this.scene.sound.add(key, {
            loop: true,
            volume: this.musicVolume,
            ...config
        });

        if (!this.isMuted) {
            this.currentMusic.play();
        }
    }

    // Stop and cleanup current music track
    stopMusic() {
        if (this.currentMusic) {
            this.currentMusic.stop();
            this.currentMusic.destroy();
            this.currentMusic = null;
        }
    }

    // Convenience method for looping background music
    playBackgroundMusic(trackKey) {
        this.playMusic(trackKey, { loop: true });
    }
}
