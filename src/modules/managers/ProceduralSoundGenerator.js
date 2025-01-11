/**
 * ProceduralSoundGenerator - Generates procedural sound effects for the game
 * using the Web Audio API
 */
class ProceduralSoundGenerator {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    /**
     * Creates a stereo panner node
     * @param {number} stereoPan - Pan position from -1 (left) to 1 (right)
     * @returns {StereoPannerNode} The configured stereo panner
     */
    createStereoPanner(stereoPan = 0) {
        const panner = this.audioContext.createStereoPanner();
        panner.pan.value = stereoPan;
        return panner;
    }

    /**
     * Generates a laser shoot sound effect
     * @param {Object} options - Sound parameters
     * @param {number} options.frequency - Base frequency (default: 1000)
     * @param {number} options.duration - Sound duration in seconds (default: 0.1)
     * @param {number} options.stereoPan - Stereo pan position from -1 to 1 (default: 0)
     */
    generateLaserSound({ frequency = 1000, duration = 0.1, stereoPan = 0 } = {}) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const panner = this.createStereoPanner(stereoPan);

        oscillator.connect(gainNode);
        gainNode.connect(panner);
        panner.connect(this.audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.1, this.audioContext.currentTime + duration);

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    /**
     * Generates an explosion sound effect
     * @param {Object} options - Sound parameters
     * @param {number} options.duration - Sound duration in seconds (default: 0.5)
     * @param {number} options.stereoPan - Stereo pan position from -1 to 1 (default: 0)
     */
    generateExplosionSound({ duration = 0.5, stereoPan = 0 } = {}) {
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
            data[i] *= 1 - i / bufferSize; // Apply fade out
        }

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        const panner = this.createStereoPanner(stereoPan);

        source.buffer = buffer;
        filter.type = 'lowpass';
        filter.frequency.value = 1000;

        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(panner);
        panner.connect(this.audioContext.destination);

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        source.start();
    }

    /**
     * Generates a powerup collection sound
     * @param {Object} options - Sound parameters
     * @param {number} options.baseFrequency - Starting frequency (default: 300)
     * @param {number} options.duration - Sound duration in seconds (default: 0.2)
     * @param {number} options.stereoPan - Stereo pan position from -1 to 1 (default: 0)
     */
    generatePowerupSound({ baseFrequency = 300, duration = 0.2, stereoPan = 0 } = {}) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const panner = this.createStereoPanner(stereoPan);

        oscillator.connect(gainNode);
        gainNode.connect(panner);
        panner.connect(this.audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(baseFrequency, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(baseFrequency * 3, this.audioContext.currentTime + duration);

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    /**
     * Generates a coin pickup sound similar to Super Mario Bros 3
     * @param {Object} options - Sound parameters
     * @param {number} options.baseFrequency - Starting frequency (default: 1200)
     * @param {number} options.duration - Sound duration in seconds (default: 0.07)
     * @param {number} options.stereoPan - Stereo pan position from -1 to 1 (default: 0)
     */
    generateCoinSound({ baseFrequency = 1200, duration = 0.07, stereoPan = 0 } = {}) {
        // Create two oscillators for the characteristic two-tone sound
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const panner = this.createStereoPanner(stereoPan);

        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(panner);
        panner.connect(this.audioContext.destination);

        // Use square waves for a more 8-bit sound
        oscillator1.type = 'square';
        oscillator2.type = 'square';
        
        // First tone (higher pitch)
        oscillator1.frequency.setValueAtTime(baseFrequency * 2, this.audioContext.currentTime);
        
        // Second tone (lower pitch, slightly delayed)
        oscillator2.frequency.setValueAtTime(baseFrequency, this.audioContext.currentTime + duration * 0.2);

        // Quick attack and decay envelope
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.15, this.audioContext.currentTime + duration * 0.2);
        gainNode.gain.linearRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator1.start(this.audioContext.currentTime);
        oscillator2.start(this.audioContext.currentTime + duration * 0.2);
        oscillator1.stop(this.audioContext.currentTime + duration);
        oscillator2.stop(this.audioContext.currentTime + duration);
    }
}

export default ProceduralSoundGenerator;
