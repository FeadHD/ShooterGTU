import { BaseManager } from '../../di/BaseManager';
import { GameConfig } from '../../../config/GameConfig';

export class SoundManager extends BaseManager {
    constructor(scene) {
        super();
        this.scene = scene;
        this.sounds = new Map();
        this.volume = scene.registry.get('soundVolume') || 1;
        
        // Listen for volume changes
        scene.registry.events.on('changedata-soundVolume', (_, value) => {
            this.volume = value;
            this._updateAllSoundVolumes();
        });
    }

    add(key, config) {
        this.sounds.set(key, this.scene.sound.add(key, config));
    }

    play(key, config = {}) {
        let sound = this.sounds.get(key);
        
        if (!sound) {
            // Create new sound if it doesn't exist
            sound = this.scene.sound.add(key, {
                volume: this.volume,
                ...config
            });
            this.sounds.set(key, sound);
        }

        if (!sound.isPlaying) {
            sound.play();
        }
    }

    stop(key) {
        const sound = this.sounds.get(key);
        if (sound) {
            sound.stop();
        }
    }

    stopAll() {
        this.sounds.forEach(sound => sound.stop());
    }

    setVolume(value) {
        this.volume = value;
        this._updateAllSoundVolumes();
    }

    getVolume() {
        return this.volume;
    }

    // Internal method to update sound volumes
    _updateAllSoundVolumes() {
        this.sounds.forEach(sound => {
            sound.setVolume(this.volume);
        });
    }
}
