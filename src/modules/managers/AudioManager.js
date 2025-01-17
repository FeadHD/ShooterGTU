// File: src/modules/managers/AudioManager.js
// Purpose: Manage both SFX and music in one place

import { BaseManager } from '../di/BaseManager';

export default class AudioManager extends BaseManager {
    constructor(scene) {
        super();
        this.scene = scene;

        // For SFX (sound effects)
        this.sounds = new Map(); // storing multiple SFX keyed by string
        this.soundVolume = scene.registry.get('soundVolume') || 1;
        this.isMuted = false;

        // =============== Merged from MusicManager ===============
        // We'll keep a separate "musicVolume" for background music,
        // plus a "currentMusic" reference if you only play one track at a time.
        this.currentMusic = null;
        this.musicVolume = scene.registry.get('musicVolume') || 1;
        // ========================================================

        // Listen for volume changes: 
        // 1) SFX volume: 'soundVolume'
        scene.registry.events.on('changedata-soundVolume', (_, newValue) => {
            this.soundVolume = newValue;
            this._updateAllSoundVolumes();
        });

        // 2) Music volume: 'musicVolume'
        scene.registry.events.on('changedata-musicVolume', (_, newValue) => {
            this.musicVolume = newValue;
            if (this.currentMusic) {
                this.currentMusic.setVolume(newValue);
            }
        });
    }

    /**
     * =======================
     *  SFX Methods (old AudioManager)
     * =======================
     */

    /**
     * add(key, config = {})
     * Adds a Phaser sound if it isn't already in our map
     * for SFX usage. 'config' can include loop, volume, etc.
     */
    add(key, config = {}) {
        if (!this.sounds.has(key)) {
            const soundObj = this.scene.sound.add(key, {
                volume: this.soundVolume,
                ...config
            });
            this.sounds.set(key, soundObj);
        }
    }

    /**
     * play(key, config = {})
     * Plays a sound effect by key. If it doesn't exist yet, we create it on the fly.
     * Respects global mute and updates volume.
     */
    play(key, config = {}) {
        // If user is globally muted, do nothing
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

    /**
     * stop(key)
     * Stops a specific SFX by key if found
     */
    stop(key) {
        const soundObj = this.sounds.get(key);
        if (soundObj) {
            soundObj.stop();
        }
    }

    /**
     * stopAll()
     * Stops all currently playing SFX in this manager
     */
    stopAll() {
        this.sounds.forEach(soundObj => {
            soundObj.stop();
        });
    }

    /**
     * setVolume(value)
     * Sets SFX volume only (if you want to unify SFX + music volume, you can adapt).
     */
    setVolume(value) {
        this.soundVolume = value;
        this._updateAllSoundVolumes();
    }

    /**
     * getVolume()
     * Returns the current SFX volume
     */
    getVolume() {
        return this.soundVolume;
    }

    /**
     * mute()
     * Globally mutes all SFX (and can optionally pause them)
     */
    mute() {
        this.isMuted = true;
        // Optionally pause any SFX that is playing
        this.sounds.forEach(soundObj => {
            if (soundObj.isPlaying) {
                soundObj.pause();
            }
        });

        // If you also want to mute music, you can do something like:
        if (this.currentMusic && this.currentMusic.isPlaying) {
            this.currentMusic.pause();
        }
    }

    /**
     * unmute()
     * Resumes any paused SFX if desired
     */
    unmute() {
        this.isMuted = false;
        // Resume paused SFX
        this.sounds.forEach(soundObj => {
            if (soundObj.isPaused) {
                soundObj.resume();
            }
        });

        // Resume music if it was paused
        if (this.currentMusic && this.currentMusic.isPaused) {
            this.currentMusic.resume();
        }
    }

    /**
     * _updateAllSoundVolumes()
     * Internal helper to apply 'this.soundVolume' to every SFX
     */
    _updateAllSoundVolumes() {
        this.sounds.forEach(soundObj => {
            soundObj.setVolume(this.soundVolume);
        });
    }

    /**
     * =======================
     *  Music Methods (from MusicManager)
     * =======================
     */

    /**
     * setCurrentMusic(phaserSound)
     * Replaces the old setCurrentMusic() from MusicManager. 
     * phaserSound is a Phaser sound object (like scene.sound.add('bgMusic', ...)).
     */
    setCurrentMusic(phaserSound) {
        // Stop the old track if playing
        if (this.currentMusic) {
            this.currentMusic.stop();
        }
        this.currentMusic = phaserSound;
        if (this.currentMusic) {
            // Respect the current music volume
            this.currentMusic.setVolume(this.musicVolume);
        }
    }

    /**
     * playMusic()
     * Actually plays the currentMusic if it’s not already playing
     */
    playMusic() {
        if (this.isMuted) return; // If you want to unify the "mute" logic for music
        if (this.currentMusic && !this.currentMusic.isPlaying) {
            this.currentMusic.play();
        }
    }

    /**
     * pauseMusic()
     * Pause the current music track if it’s playing
     */
    pauseMusic() {
        if (this.currentMusic && this.currentMusic.isPlaying) {
            this.currentMusic.pause();
        }
    }

    /**
     * resumeMusic()
     * Resume the current music track if paused
     */
    resumeMusic() {
        if (this.currentMusic && this.currentMusic.isPaused) {
            this.currentMusic.resume();
        }
    }

    /**
     * stopMusic()
     * If you only ever have one music track, this stops it
     */
    stopMusic() {
        if (this.currentMusic) {
            this.currentMusic.stop();
        }
    }

    /**
     * setMusicVolume(value)
     * Adjusts volume for your background music only
     */
    setMusicVolume(value) {
        this.musicVolume = value;
        if (this.currentMusic) {
            this.currentMusic.setVolume(value);
        }
    }

    /**
     * getMusicVolume()
     * Returns the music volume
     */
    getMusicVolume() {
        return this.musicVolume;
    }
}
