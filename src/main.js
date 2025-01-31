/**
 * main.js
 * Entry point for the game application.
 * Handles game initialization and browser-level event management.
 */

import 'phaser';
import { config } from './config/config';

/**
 * GAME INITIALIZATION
 */

// Initialize Phaser game instance with configuration
const game = new Phaser.Game(config);

/**
 * BROWSER EVENT HANDLERS
 * Setup event listeners for browser interactions
 */

// Disable context menu to prevent interference with game controls
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
}, false);

// Responsive design: Adjust game canvas on window resize
window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
});

// Browser zoom handling: Allow Ctrl+Wheel zoom while preventing game interference
window.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
        e.stopPropagation();
        return true;
    }
}, true);

// Update game canvas when browser zoom level changes
window.visualViewport.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
    game.scale.refresh();  // Ensure proper rendering after zoom
});
