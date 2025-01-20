/**
 * Boot.js
 * Initial scene that runs when the game starts.
 * Responsible for basic setup and global systems initialization.
 */

import { Scene } from 'phaser';
import { EventManager } from '../../modules/managers/EventManager';

export class Boot extends Scene {
    constructor() {
        // Register this scene with Phaser as 'Boot'
        super('Boot');
    }

    /**
     * ASSET CONFIGURATION
     * Set up initial asset loading settings
     */
    preload() {
        // Configure asset loading to use the current URL as base
        // This ensures assets are loaded relative to the game's location
        this.load.setBaseURL(window.location.href);
        
        // Load preloader animation sprite
        this.load.spritesheet('preloader', 'preloader/preloader.png', {
            frameWidth: 88,  // Adjust these values based on your sprite dimensions
            frameHeight: 88
        });
    }

    /**
     * SCENE INITIALIZATION
     * Set up global systems and transition to preloader
     */
    create() {
        // Initialize global event system
        // Must be done first as other systems depend on it
        this.game.globalEventManager = new EventManager(this);
        this.game.globalEventManager.initialize();
        
        // Transition to preloader scene
        // This scene will handle loading all game assets
        this.scene.start('Preloader');
    }
}
