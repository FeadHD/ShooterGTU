/**
 * Boot.js
 * Initial scene that runs when the game starts.
 * Responsible for basic setup and minimal global configuration.
 */

import { Scene } from 'phaser';

export class Boot extends Scene {
    constructor() {
        super('Boot');
    }

    /**
     * ASSET CONFIGURATION
     * Set up initial asset loading settings
     */
    preload() {
        // Configure asset loading to use the current URL as base
        this.load.setBaseURL(window.location.href);
        
        // Load preloader animation sprite
        this.load.spritesheet('preloader', 'preloader/preloader.png', {
            frameWidth: 88,  // Adjust these values based on your sprite dimensions
            frameHeight: 88
        });
    }

    /**
     * SCENE INITIALIZATION
     * Just transitions to 'Preloader' after minimal setup
     */
    create() {
        // Move straight to the Preloader scene
        this.scene.start('Preloader');
    }
}