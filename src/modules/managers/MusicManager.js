export class MusicManager {
    constructor(scene) {
        this.scene = scene;
        this.currentMusic = null;
        this.musicVolume = scene.registry.get('musicVolume') || 1;

        // Listen for volume changes in the registry
        scene.registry.events.on('changedata-musicVolume', (parent, value) => {
            this.musicVolume = value;
            if (this.currentMusic) {
                this.currentMusic.setVolume(value);
            }
        });
    }

    playMusic(key, config = {}) {
        // Stop current music if it exists
        if (this.currentMusic) {
            this.currentMusic.stop();
        }

        // Create new music instance with current volume
        this.currentMusic = this.scene.sound.add(key, {
            loop: true,
            volume: this.musicVolume,
            ...config
        });

        this.currentMusic.play();
    }

    stopMusic() {
        if (this.currentMusic) {
            this.currentMusic.stop();
            this.currentMusic = null;
        }
    }

    setVolume(volume) {
        this.musicVolume = volume;
        if (this.currentMusic) {
            this.currentMusic.setVolume(volume);
        }
    }
}
