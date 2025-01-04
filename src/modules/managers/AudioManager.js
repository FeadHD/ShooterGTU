class AudioManager {
    constructor() {
        this.sounds = {};
        this.volume = 1;
        this.isMuted = false;
    }

    loadAudio(key, path) {
        this.sounds[key] = new Audio(path);
    }

    preloadMusic(key, path) {
        this.sounds[key] = new Audio(path);
    }

    playSound(key) {
        if (this.isMuted) return;
        if (this.sounds[key]) {
            this.sounds[key].volume = this.volume;
            this.sounds[key].play();
        }
    }

    stopSound(key) {
        if (this.sounds[key]) {
            this.sounds[key].pause();
            this.sounds[key].currentTime = 0;
        }
    }

    stopMusic() {
        for (const key in this.sounds) {
            if (this.sounds[key].paused === false) {
                this.sounds[key].pause();
                this.sounds[key].currentTime = 0;
            }
        }
    }

    setVolume(value) {
        this.volume = value;
        for (const key in this.sounds) {
            this.sounds[key].volume = this.volume;
        }
    }

    mute() {
        this.isMuted = true;
    }

    unmute() {
        this.isMuted = false;
    }

    initialize() {
        // Preload default music files here if necessary
    }
}

export default AudioManager;
