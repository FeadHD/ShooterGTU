/**
 * Main Menu Scene
 * 
 * Dependencies:
 * - Phaser.Scene: Base scene class from Phaser framework
 * - TextStyleManager: Handles text styling and creation
 * - ManagerFactory: Creates and manages game systems (audio, UI, etc.)
 * 
 * State Management:
 * - Uses Phaser's registry system for global state (musicEnabled, musicVolume, etc.)
 * - Manages wallet connection state for blockchain integration
 * 
 * Audio System:
 * - Background music: 'bgMusic' asset
 * - Sound effects: 'confirmSound' for button clicks
 * - Volume control through AudioManager
 * 
 * UI Components:
 * - Title with shadow effects
 * - Interactive menu buttons
 * - Wallet connection interface
 * 
 * Scene Flow:
 * - Entry point -> createScene() -> [Menu Navigation] -> Game/Settings/etc.
 */

import { Scene } from 'phaser';
import { TextStyleManager } from '../../modules/managers/TextStyleManager';
import AudioManager from '../../modules/managers/AudioManager';

export class MainMenu extends Scene {
    /**
     * Constructor initializes scene key and defines reusable styles
     * Style definitions use specific font families and shadow effects for cyberpunk theme
     */
    constructor() {
        super('MainMenu');
        
        // Define styles for reuse across the menu system
        this.styles = {
            mainTitle: {
                fontFamily: 'Retronoid, Arial',
                fontSize: '100px',
                color: '#00ffff',
                align: 'center',
                stroke: '#ffffff',
                strokeThickness: 2,
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: '#ff00ff',
                    blur: 8,
                    fill: true
                }
            },
            titleShadow: (isBase = false) => ({
                fontFamily: 'Retronoid, Arial',
                fontSize: '100px',
                color: isBase ? '#4400ff' : '#ff00ff',
                align: 'center'
            }),
            menuButton: {
                fontFamily: 'Retronoid',
                fontSize: '32px',
                color: '#00ffff',
                align: 'center',
                stroke: '#ffffff',
                strokeThickness: 1
            },
            missionTitle: {
                fontFamily: 'Retronoid',
                fontSize: '36px',
                color: '#ff00ff',
                align: 'center'
            },
            walletButton: {
                fontFamily: 'Retronoid',
                fontSize: '24px',
                color: '#00ffff',
                align: 'right'
            }
        };
    }

    /**
     * Scene creation and initialization
     * Handles:
     * 1. Manager initialization
     * 2. Audio setup
     * 3. Game state reset
     * 4. Input system configuration
     * 5. UI creation
     */
    async create() {
        // Create the scene first before checking wallet
        await this.createScene();
        await this.initializeWallet();
    }

    async createScene() {
        // Initialize manager systems through dependency injection
        this.audioManager = new AudioManager(this);

        // Reset all game state to initial values
        this.registry.set('lives', 3);
        this.registry.set('playerHP', 100);
        this.registry.set('score', 0);
        this.registry.set('bitcoins', 0);
        
        // Configure input system
        this.input.keyboard.enabled = true;
        this.input.mouse.enabled = true;
        this.input.keyboard.removeAllKeys();
        this.input.removeAllListeners();

        // Set up visual environment
        this.cameras.main.setBackgroundColor('#000000');
        const canvasWidth = this.cameras.main.width;
        const canvasHeight = this.cameras.main.height;
        const bg = this.add.image(0, 0, 'mainbg');
        bg.setOrigin(0, 0);
        bg.setDisplaySize(canvasWidth, canvasHeight);

        // Initialize background music with volume control
        const musicEnabled = this.registry.get('musicEnabled');
        if (musicEnabled !== false && this.audioManager) {
            this.audioManager.playMusic('bgMusic', {
                loop: true,
                volume: this.registry.get('musicVolume') ?? 1
            });
        }

        // Set up volume change listener
        this.registry.events.on('changedata-musicVolume', (parent, value) => {
            if (this.audioManager) {
                this.audioManager.setMusicVolume(value);
            }
        });

        // Create UI elements
        this.createTitle(canvasWidth, canvasHeight);
        this.createGameButtons(canvasWidth, canvasHeight);
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
    }

    /**
     * Asset preloading
     * Loads audio assets needed for the menu:
     * - Background music
     * - UI sound effects
     */
    preload() {
        this.load.audio('bgMusic', 'assets/sounds/mainmenumusic.mp3');
        this.load.audio('confirmSound', 'assets/sounds/confirmation.mp3');
    }

    /**
     * Creates the main title with visual effects
     * Uses multiple shadow layers for 3D effect
     * @param {number} canvasWidth - Width of the game canvas
     * @param {number} canvasHeight - Height of the game canvas
     */
    createTitle(canvasWidth, canvasHeight) {
        // Create shadow layers for 3D depth effect
        const shadowOffset = 4;
        const numLayers = 5;
        
        for (let i = numLayers; i >= 0; i--) {
            TextStyleManager.createText(
                this,
                canvasWidth/2 + (i * shadowOffset),
                canvasHeight * 0.15 + (i * shadowOffset),
                'GOOD TIME UNIVERSE',
                'titleShadow',
                0.5
            );
        }

        // Add main title with glow effects
        TextStyleManager.createText(
            this,
            canvasWidth/2,
            canvasHeight * 0.15,
            'GOOD TIME UNIVERSE',
            'mainTitle'
        );

        // Add mission subtitle
        TextStyleManager.createText(
            this,
            canvasWidth/2,
            canvasHeight * 0.25,
            'MISSION ONE: LEDGER HEIST',
            'missionTitle'
        );
    }

    /**
     * Creates and configures interactive menu buttons
     * Handles:
     * - Button creation and positioning
     * - Click event handlers
     * - Scene transitions
     * - Audio feedback
     * @param {number} canvasWidth - Width of the game canvas
     * @param {number} canvasHeight - Height of the game canvas
     */
    createGameButtons(canvasWidth, canvasHeight) {
        // Configure button layout parameters
        const startY = canvasHeight * 0.4;  // Start buttons from 40% of screen height
        const buttonSpacing = 80;  // Space between buttons
        const buttonX = canvasWidth / 2;  // Center buttons horizontally

        // Create interactive menu buttons with hover effects and sound
        const createButton = (text, y, callback) => {
            const button = TextStyleManager.createText(
                this,
                buttonX,
                y,
                text,
                'menuButton'
            );
            
            // Configure button interactivity
            button.setInteractive({ useHandCursor: true })
                .on('pointerover', () => {
                    button.setScale(1.1);
                    button.setTint(0xff00ff);
                })
                .on('pointerout', () => {
                    button.setScale(1);
                    button.clearTint();
                })
                .on('pointerup', () => {
                    // Play confirmation sound if enabled
                    const sfxEnabled = this.registry.get('sfxEnabled');
                    if (sfxEnabled !== false && this.audioManager) {
                        this.audioManager.add('confirmSound');
                        this.audioManager.play('confirmSound');
                    }
                    callback();
                });
        };

        // Define menu options and their actions
        const menuItems = [
            {
                text: 'START GAME',
                callback: () => {
                    // Transition to game scene with fade effect
                    this.cameras.main.fadeOut(1000);
                    this.cameras.main.once('camerafadeoutcomplete', () => {
                        this.scene.start('CombinedGtuLevel');
                    });
                }
            },
            {
                text: 'SETTINGS',
                callback: () => this.scene.start('Settings')
            },
            {
                text: 'CONTROLS',
                callback: () => this.scene.start('ControlsSettings')
            },
            {
                text: 'LEADERBOARD',
                callback: () => this.scene.start('Leaderboard')
            },
            {
                text: 'CREDITS',
                callback: () => this.scene.start('Credits')
            }
        ];

        // Create buttons with proper spacing
        menuItems.forEach((item, index) => {
            createButton(
                item.text,
                startY + (index * buttonSpacing),
                item.callback
            );
        });

        // Add dev hub button if in development mode
        if (process.env.NODE_ENV === 'development') {
            createButton(
                'DEV HUB',
                startY + (menuItems.length * buttonSpacing),
                () => this.scene.start('DevHub')
            );
        }
    }

    /**
     * Wallet Integration System
     * Handles MetaMask connection and blockchain interactions
     * Features:
     * - Automatic connection detection
     * - Address display
     * - Error handling
     * - UI feedback
     */
    async initializeWallet() {
        let connectButton;
        try {
            // Check for existing MetaMask connection
            if (window.ethereum) {
                const accounts = await window.ethereum.request({
                    method: 'eth_accounts'
                });

                if (accounts.length > 0) {
                    // Already connected - display address
                    this.displayWalletAddress(accounts[0]);
                } else {
                    // Create connect button if not connected
                    connectButton = TextStyleManager.createText(
                        this,
                        this.canvasWidth - 20,
                        20,
                        'CONNECT WALLET',
                        'walletButton'
                    );
                    
                    // Configure button interactivity
                    connectButton
                        .setInteractive({ useHandCursor: true })
                        .on('pointerover', () => {
                            connectButton.setScale(1.1);
                            connectButton.setTint(0xff00ff);
                        })
                        .on('pointerout', () => {
                            connectButton.setScale(1);
                            connectButton.clearTint();
                        })
                        .on('pointerup', async () => {
                            try {
                                // Request account access
                                const accounts = await window.ethereum.request({
                                    method: 'eth_requestAccounts'
                                });
                                
                                if (accounts.length > 0) {
                                    this.displayWalletAddress(accounts[0]);
                                    connectButton.destroy();
                                }
                            } catch (error) {
                                console.error('User denied account access');
                            }
                        });
                }

                // Listen for account changes
                window.ethereum.on('accountsChanged', (accounts) => {
                    if (accounts.length > 0) {
                        this.displayWalletAddress(accounts[0]);
                        if (connectButton) connectButton.destroy();
                    } else {
                        if (this.walletText) this.walletText.destroy();
                        this.initializeWallet();
                    }
                });
            }
        } catch (error) {
            console.error('Error initializing wallet:', error);
            // Handle initialization errors gracefully
            if (connectButton) {
                connectButton.setText('WALLET ERROR');
                connectButton.setTint(0xff0000);
            }
        }
    }

    /**
     * Displays the connected wallet address
     * Truncates address for UI clarity
     * @param {string} address - The Ethereum wallet address
     */
    displayWalletAddress(address) {
        // Cleanup existing wallet text
        if (this.walletText) {
            this.walletText.destroy();
        }

        // Format address for display (0x1234...5678)
        const truncatedAddress = address.slice(0, 6) + '...' + address.slice(-4);
        
        // Create and position wallet text
        this.walletText = TextStyleManager.createText(
            this,
            this.canvasWidth - 20,
            20,
            truncatedAddress,
            'walletButton'
        );
    }

    /**
     * Scene cleanup handler
     * Ensures proper resource cleanup when leaving the scene:
     * - Stops background music
     * - Removes event listeners
     * - Cleans up UI elements
     */
    shutdown() {
        // Stop background music
        if (this.audioManager) {
            this.audioManager.stopMusic();
        }

        // Remove event listeners
        this.registry.events.off('changedata-musicVolume');
        
        // Cleanup wallet connection
        if (window.ethereum) {
            window.ethereum.removeAllListeners('accountsChanged');
        }
    }
}
