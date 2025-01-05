import { BaseManager } from '../../di/BaseManager';

export class MusicManager extends BaseManager {
    constructor(scene) {
        super();
        this.scene = scene;
        this.currentMusic = null;
        this.volume = scene.registry.get('musicVolume') || 1;
        
        // Listen for volume changes
        scene.registry.events.on('changedata-musicVolume', (_, value) => {
            this.volume = value;
            if (this.currentMusic) {
                this.currentMusic.setVolume(value);
            }
        });
    }

    setCurrentMusic(music) {
        if (this.currentMusic) {
            this.currentMusic.stop();
        }
        this.currentMusic = music;
        if (this.currentMusic) {
            this.currentMusic.setVolume(this.volume);
        }
    }

    play() {
        if (this.currentMusic && !this.currentMusic.isPlaying) {
            this.currentMusic.play();
        }
    }

    pause() {
        if (this.currentMusic && this.currentMusic.isPlaying) {
            this.currentMusic.pause();
        }
    }

    resume() {
        if (this.currentMusic && !this.currentMusic.isPlaying) {
            this.currentMusic.resume();
        }
    }

    stop() {
        if (this.currentMusic) {
            this.currentMusic.stop();
        }
    }

    setVolume(value) {
        this.volume = value;
        if (this.currentMusic) {
            this.currentMusic.setVolume(value);
        }
    }

    getVolume() {
        return this.volume;
    }
}
