/**
 * ProceduralSoundGenerator.js
 * Real-time sound effect synthesis using Web Audio API
 * Generates game sounds without pre-recorded audio files
 * Supports positional audio and customizable parameters
 */
class ProceduralSoundGenerator {
    /**
     * Initialize audio system
     * Creates Web Audio context with fallback
     */
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    /**
     * Create stereo positioning node
     * Used for directional sound effects
     * @param {number} stereoPan - -1 (left) to 1 (right)
     * @returns {StereoPannerNode} Configured panner
     */
    createStereoPanner(stereoPan = 0) {
        const panner = this.audioContext.createStereoPanner();
        panner.pan.value = stereoPan;
        return panner;
    }

    /**
     * Generate laser weapon sound
     * High-to-low frequency sweep with quick decay
     * @param {Object} options - Sound configuration
     * @param {number} options.frequency - Starting pitch (Hz)
     * @param {number} options.duration - Length (seconds)
     * @param {number} options.stereoPan - Position (-1 to 1)
     */
    generateLaserSound({ frequency = 1000, duration = 0.1, stereoPan = 0 } = {}) {
        // Setup audio nodes
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const panner = this.createStereoPanner(stereoPan);

        // Connect audio chain
        oscillator.connect(gainNode);
        gainNode.connect(panner);
        panner.connect(this.audioContext.destination);

        // Configure sound characteristics
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.1, this.audioContext.currentTime + duration);

        // Set volume envelope
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        // Play and cleanup
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    /**
     * Generate explosion effect
     * Filtered noise burst with fade-out
     * @param {Object} options - Sound configuration
     * @param {number} options.duration - Length (seconds)
     * @param {number} options.stereoPan - Position (-1 to 1)
     */
    generateExplosionSound({ duration = 0.5, stereoPan = 0 } = {}) {
        // Create noise buffer
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        // Generate and fade noise
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
            data[i] *= 1 - i / bufferSize; // Linear fade
        }

        // Setup audio chain
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        const panner = this.createStereoPanner(stereoPan);

        // Configure nodes
        source.buffer = buffer;
        filter.type = 'lowpass';
        filter.frequency.value = 1000;

        // Connect and play
        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(panner);
        panner.connect(this.audioContext.destination);

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        source.start();
    }

    /**
     * Generate powerup collection sound
     * Rising pitch with smooth fade-out
     * @param {Object} options - Sound configuration
     * @param {number} options.baseFrequency - Starting pitch (Hz)
     * @param {number} options.duration - Length (seconds)
     * @param {number} options.stereoPan - Position (-1 to 1)
     */
    generatePowerupSound({ baseFrequency = 300, duration = 0.2, stereoPan = 0 } = {}) {
        // Setup audio chain
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const panner = this.createStereoPanner(stereoPan);

        oscillator.connect(gainNode);
        gainNode.connect(panner);
        panner.connect(this.audioContext.destination);

        // Configure rising pitch
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(baseFrequency, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(baseFrequency * 3, this.audioContext.currentTime + duration);

        // Smooth fade-out
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);

        // Play and cleanup
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    /**
     * Generate retro coin pickup sound
     * Two-tone chime with quick decay
     * @param {Object} options - Sound configuration
     * @param {number} options.baseFrequency - Starting pitch (Hz)
     * @param {number} options.duration - Length (seconds)
     * @param {number} options.stereoPan - Position (-1 to 1)
     */
    generateCoinSound({ baseFrequency = 1200, duration = 0.07, stereoPan = 0 } = {}) {
        // Setup dual oscillators
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const panner = this.createStereoPanner(stereoPan);

        // Connect audio chain
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(panner);
        panner.connect(this.audioContext.destination);

        // Configure 8-bit style tones
        oscillator1.type = 'square';
        oscillator2.type = 'square';
        
        // High tone followed by low tone
        oscillator1.frequency.setValueAtTime(baseFrequency * 2, this.audioContext.currentTime);
        oscillator2.frequency.setValueAtTime(baseFrequency, this.audioContext.currentTime + duration * 0.2);

        // Sharp attack and decay
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.15, this.audioContext.currentTime + duration * 0.2);
        gainNode.gain.linearRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        // Sequence tones
        oscillator1.start(this.audioContext.currentTime);
        oscillator2.start(this.audioContext.currentTime + duration * 0.2);
        oscillator1.stop(this.audioContext.currentTime + duration);
        oscillator2.stop(this.audioContext.currentTime + duration);
    }
}

export default ProceduralSoundGenerator;
