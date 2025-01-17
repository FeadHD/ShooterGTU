// File: src/modules/managers/AudioManager.js
// Purpose: Manage BOTH SFX and Music in one file, merged from old AudioManager and “Other MusicManager”

import { BaseManager } from '../di/BaseManager';

export default class AudioManager extends BaseManager {
    constructor(scene) {
        super();
        this.scene = scene;

        // For SFX (sound effects)
        this.sounds = new Map(); // storing multiple SFX keyed by string
        this.soundVolume = scene.registry.get('soundVolume') || 1;
        this.isMuted = false;

        // For Music (merging logic from both old MusicManagers)
        // We keep a single "currentMusic" reference if we only play 1 track at a time.
        this.currentMusic = null;
        this.musicVolume = scene.registry.get('musicVolume') || 1;

        // Listen for volume changes for SFX
        scene.registry.events.on('changedata-soundVolume', (_, newValue) => {
            this.soundVolume = newValue;
            this._updateAllSoundVolumes();
        });

        // Listen for volume changes for music
        scene.registry.events.on('changedata-musicVolume', (_, newValue) => {
            this.musicVolume = newValue;
            if (this.currentMusic) {
                this.currentMusic.setVolume(newValue);
            }
        });
    }

    /** ----------------------------------------------------------------
     *  SFX METHODS (from old AudioManager code)
     * ----------------------------------------------------------------*/
    add(key, config = {}) {
        if (!this.sounds.has(key)) {
            const soundObj = this.scene.sound.add(key, {
                volume: this.soundVolume,
                ...config
            });
            this.sounds.set(key, soundObj);
        }
    }

    play(key, config = {}) {
        // If globally muted, do nothing
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

    stop(key) {
        const soundObj = this.sounds.get(key);
        if (soundObj) {
            soundObj.stop();
        }
    }

    stopAll() {
        this.sounds.forEach(soundObj => {
            soundObj.stop();
        });
    }

    setVolume(value) {
        this.soundVolume = value;
        this._updateAllSoundVolumes();
    }

    getVolume() {
        return this.soundVolume;
    }

    mute() {
        this.isMuted = true;

        // Pause SFX that is playing
        this.sounds.forEach(soundObj => {
            if (soundObj.isPlaying) {
                soundObj.pause();
            }
        });

        // Also pause music if playing
        if (this.currentMusic && this.currentMusic.isPlaying) {
            this.currentMusic.pause();
        }
    }

    unmute() {
        this.isMuted = false;

        // Resume paused SFX
        this.sounds.forEach(soundObj => {
            if (soundObj.isPaused) {
                soundObj.resume();
            }
        });

        // Resume music if paused
        if (this.currentMusic && this.currentMusic.isPaused) {
            this.currentMusic.resume();
        }
    }

    _updateAllSoundVolumes() {
        this.sounds.forEach(soundObj => {
            soundObj.setVolume(this.soundVolume);
        });
    }

    /** ----------------------------------------------------------------
     *  MUSIC METHODS (merged from "Other MusicManager.js")
     * ----------------------------------------------------------------*/

    /**
     * playMusic(key, config = {})
     * This new approach (from the other MusicManager) is simpler:
     *  - If there's current music, we stop it.
     *  - We create a new Phaser sound for "key" with loop = true by default
     *  - We apply the musicVolume from registry
     *  - Then we play it immediately.
     */
    playMusic(key, config = {}) {
        // 1) Stop current music if it exists
        if (this.currentMusic) {
            this.currentMusic.stop();
            this.currentMusic = null;
        }

        // 2) Create new music object
        this.currentMusic = this.scene.sound.add(key, {
            loop: true, // Typically background music loops
            volume: this.musicVolume,
            ...config
        });

        // 3) If globally muted, skip playing it, or handle logic
        if (this.isMuted) {
            return; // or you could store it for playing once unmuted
        }

        // 4) Play it
        this.currentMusic.play();
    }

    /**
     * stopMusic()
     * If there's current music, stop and set null
     */
    stopMusic() {
        if (this.currentMusic) {
            this.currentMusic.stop();
            this.currentMusic = null;
        }
    }

    /**
     * playBackgroundMusic(trackKey)
     * Another convenience from "Other MusicManager".
     * If there's already currentMusic playing, do nothing.
     * Otherwise, create new music with loop = true.
     */
    playBackgroundMusic(trackKey) {
        // If we already have music playing, skip
        if (this.currentMusic && this.currentMusic.isPlaying) {
            return;
        }

        // Create new track
        this.currentMusic = this.scene.sound.add(trackKey, {
            loop: true,
            volume: this.musicVolume
        });
        this.currentMusic.play();
    }

    /**
     * setMusicVolume(volume)
     * Adjust music volume only
     */
    setMusicVolume(volume) {
        this.musicVolume = volume;
        if (this.currentMusic) {
            this.currentMusic.setVolume(volume);
        }
    }

    getMusicVolume() {
        return this.musicVolume;
    }
}
