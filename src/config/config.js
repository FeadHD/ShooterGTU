/**
 * config.js
 * Main Phaser game configuration file that defines core settings and scene management.
 * This file sets up the game engine, rendering, physics, and scene order.
 */

// @ai-do-not-touch

/**
 * SCENE IMPORTS
 * Import all game scenes, menus, and UI components
 */
// Core game scenes
import { GameOver } from '../events/GameOver';
import { GameScene1 } from '../scenes/levels/GameScene1';
import { CombinedGtuLevel } from '../scenes/levels/CombinedGtuLevel';
import { TestingGroundScene } from '../scenes/levels/TestingGroundScene';
import { WayneWorld } from '../scenes/levels/WayneWorld';

// Menu scenes
import { MainMenu } from '../scenes/menus/MainMenu';
import { Leaderboard } from '../scenes/menus/Leaderboard';
import { MissionComplete } from '../scenes/menus/MissionComplete';
import { DevHub } from '../scenes/menus/DevHub/DevHub';
import { Credits } from '../scenes/menus/Credits';

// Settings scenes
import Settings from '../scenes/menus/Settings';
import ControlsSettings from '../scenes/menus/ControlsSettings';
import SoundSettings from '../scenes/menus/SoundSettings';
import { SoundTester } from '../scenes/menus/DevHub/SoundTester';

// Core engine scenes
import { Preloader } from '../scenes/elements/Preloader';
import { TitleScene } from '../scenes/elements/TitleScene';
import { IntroScene } from '../scenes/elements/IntroScene';
import { PauseMenu } from '../scenes/elements/PauseMenu';

/**
 * GAME CONFIGURATION
 * Core settings that define how the game engine behaves
 */
export const config = {
    // Rendering configuration
    type: Phaser.AUTO,          // Let Phaser choose WebGL or Canvas
    pixelArt: true,             // Optimize for pixel art graphics
    
    // Display settings
    scale: {
        mode: Phaser.Scale.NONE,
        parent: 'game-container',    // DOM element to mount game
        width: 1920,                 // Base game resolution
        height: 1080,
        autoRound: true,             // Round pixel values
        zoom: 1,
        autoCenter: Phaser.Scale.CENTER_BOTH,  // Center game in container
        fullscreenTarget: 'game-container',
        expandParent: true
    },
    
    // DOM element support (for UI overlays)
    dom: {
        createContainer: true
    },
    
    // Physics engine settings
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,           // Show physics bodies when true
            gravity: { y: 400 },    // Vertical gravity strength
            tileBias: 32,          // Tile collision accuracy
        }
    },
    
    // Input handling
    input: {
        mouse: {
            preventDefaultWheel: true,           // Prevent page scroll on wheel
            preventDefaultContextMenu: true      // Disable right-click menu
        }
    },
    
    // Scene sequence (loaded in order)
    scene: [
        // Boot sequence
        Preloader,      // Asset loading
        TitleScene,     // Title screen
        IntroScene,     // Opening sequence
        
        // Main menus
        MainMenu,       // Game start menu
        Settings,       // General settings
        ControlsSettings,
        SoundSettings,
        
        // Game levels
        GameScene1,
        CombinedGtuLevel,
        TestingGroundScene,
        WayneWorld,
        
        // UI overlays
        Leaderboard,
        MissionComplete,
        GameOver,
        PauseMenu,
        
        // Development tools
        DevHub,         // Developer hub
        Credits,        // Game credits
        SoundTester     // Audio testing
    ]
};
