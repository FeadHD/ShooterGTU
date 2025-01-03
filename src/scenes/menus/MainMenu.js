import { Scene } from 'phaser';
import { TextStyleManager } from '../../modules/managers/TextStyleManager';

export class MainMenu extends Scene {
    constructor() {
        super('MainMenu');
        
        // Define styles for reuse
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
            missionTitle: {
                fontFamily: 'Retronoid, Arial',
                fontSize: '48px',
                color: '#00ffff',
                align: 'center',
                stroke: '#ffffff',
                strokeThickness: 1,
                shadow: {
                    offsetX: 1,
                    offsetY: 1,
                    color: '#ff00ff',
                    blur: 4,
                    fill: true
                }
            },
            menuButton: {
                fontFamily: 'Retronoid, Arial',
                fontSize: '72px',
                color: '#00ffff',
                stroke: '#ffffff',
                strokeThickness: 4,
                shadow: {
                    offsetX: 3,
                    offsetY: 3,
                    color: '#ff00ff',
                    blur: 5,
                    fill: true
                }
            },
            walletButton: {
                fontFamily: 'Retronoid, Arial',
                fontSize: '24px',
                color: '#00ffff',
                stroke: '#ffffff',
                strokeThickness: 1,
                padding: { x: 10, y: 5 },
                shadow: {
                    offsetX: 1,
                    offsetY: 1,
                    color: '#ff00ff',
                    blur: 3,
                    fill: true
                }
            }
        };
    }

    async create() {
        // Create the scene first before checking wallet
        await this.createScene();
        await this.initializeWallet();
    }

    async createScene() {
        // Reset all game state
        this.registry.set('lives', 3);
        this.registry.set('playerHP', 100);
        this.registry.set('score', 0);
        this.registry.set('bitcoins', 0);
        
        // Enable input system
        this.input.keyboard.enabled = true;
        this.input.mouse.enabled = true;
        
        // Remove any existing input listeners
        this.input.keyboard.removeAllKeys();
        this.input.removeAllListeners();

        // Debug background color to see canvas size
        this.cameras.main.setBackgroundColor('#000000');

        // Get the canvas dimensions
        const canvasWidth = this.cameras.main.width;
        const canvasHeight = this.cameras.main.height;

        // Add and center the background image first
        const bg = this.add.image(0, 0, 'mainbg');
        bg.setOrigin(0, 0);
        bg.setDisplaySize(canvasWidth, canvasHeight);

        // Handle music
        let bgMusic = this.sound.get('bgMusic');
        const musicEnabled = this.registry.get('musicEnabled');
        const musicVolume = this.registry.get('musicVolume') ?? 1; // Use nullish coalescing to allow 0

        // Check if we need to create or restart the music
        if (!bgMusic || !bgMusic.isPlaying) {
            // If there's an existing stopped music instance, destroy it
            if (bgMusic) {
                bgMusic.destroy();
            }
            
            // Create new music instance with current volume
            bgMusic = this.sound.add('bgMusic', {
                volume: musicVolume,
                loop: true
            });
            
            // Only play if music is enabled and volume is not 0
            if (musicEnabled !== false && musicVolume > 0) {
                bgMusic.play();
            }
        } else {
            // Update volume of existing music
            bgMusic.setVolume(musicVolume);
            
            // Pause/resume based on volume
            if (musicVolume === 0 && bgMusic.isPlaying) {
                bgMusic.pause();
            } else if (musicVolume > 0 && !bgMusic.isPlaying && musicEnabled !== false) {
                bgMusic.resume();
            }
        }

        // Add registry listener for volume changes
        this.registry.events.on('changedata-musicVolume', (parent, value) => {
            const currentMusic = this.sound.get('bgMusic');
            if (currentMusic) {
                currentMusic.setVolume(value);
                // Pause/resume based on volume
                if (value === 0 && currentMusic.isPlaying) {
                    currentMusic.pause();
                } else if (value > 0 && !currentMusic.isPlaying && musicEnabled !== false) {
                    currentMusic.resume();
                }
            }
        });

        // Create title and buttons first
        this.createTitle(canvasWidth, canvasHeight);
        this.createGameButtons(canvasWidth, canvasHeight);

        // Store canvas dimensions for wallet initialization
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
    }

    preload() {
        // Load background music
        this.load.audio('bgMusic', 'assets/sounds/mainmenumusic.mp3');
        // Load confirmation sound
        this.load.audio('confirmSound', 'assets/sounds/confirmation.mp3');
    }

    createTitle(canvasWidth, canvasHeight) {
        // Add shadow layers for 3D effect
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

        // Add main title text with glow effect
        TextStyleManager.createText(
            this,
            canvasWidth/2,
            canvasHeight * 0.15,
            'GOOD TIME UNIVERSE',
            'mainTitle'
        );

        // Add mission title
        TextStyleManager.createText(
            this,
            canvasWidth/2,
            canvasHeight * 0.25,
            'MISSION ONE: LEDGER HEIST',
            'missionTitle'
        );
    }

    createGameButtons(canvasWidth, canvasHeight) {
        const buttonStyle = this.styles.menuButton;
        const buttonSpacing = 100;
        const startY = canvasHeight / 2;

        // Helper function to play confirmation sound
        const playConfirmSound = () => {
            const sfxVolume = this.registry.get('sfxVolume') ?? 1;
            const confirmSound = this.sound.add('confirmSound', { volume: sfxVolume });
            confirmSound.play();
        };

        // Create "START GAME" button
        const startButton = TextStyleManager.createText(
            this,
            canvasWidth / 2,
            startY - buttonSpacing,
            'START',
            'menuButton',
            0.5,
            true
        );

        const settingsButton = TextStyleManager.createText(
            this,
            canvasWidth/2,
            startY,
            'SETTINGS',
            'menuButton',
            0.5,
            true
        );

        const leaderboardButton = TextStyleManager.createText(
            this,
            canvasWidth/2,
            startY + buttonSpacing,
            'LEADERBOARD',
            'menuButton',
            0.5,
            true
        );

        const rulesButton = TextStyleManager.createText(
            this,
            canvasWidth/2,
            startY + buttonSpacing * 2,
            'RULES',
            'menuButton',
            0.5,
            true
        );

        const theZuccButton = TextStyleManager.createText(
            this,
            canvasWidth/2,
            startY + buttonSpacing * 3,
            'THE ZUCC',
            'menuButton',
            0.5,
            true
        );

        // Add click handlers
        startButton.on('pointerdown', () => {
            playConfirmSound();
            // Reset game state
            this.registry.set('score', 0);
            this.registry.set('lives', 3);
            this.registry.set('playerHP', 100);
            this.registry.set('bitcoins', 0);

            // Clean up scene before starting game
            this.input.keyboard.removeAllKeys();
            this.input.removeAllListeners();
            
            // Stop any existing scenes
            this.scene.stop('GameScene1');
            this.scene.stop('GameScene2');
            this.scene.stop('GameScene3');
            this.scene.stop('GameScene4');
            this.scene.stop('GameScene5');
            this.scene.stop('IntroScene');

            // Stop menu music before starting game
            if (this.sound.get('bgMusic')) {
                this.sound.get('bgMusic').stop();
            }

            // Start intro scene
            this.scene.start('IntroScene');
        });
        settingsButton.on('pointerdown', () => {
            playConfirmSound();
            this.scene.start('Settings');
        });
        leaderboardButton.on('pointerdown', () => {
            playConfirmSound();
            this.scene.start('Leaderboard');
        });
        rulesButton.on('pointerdown', () => {
            playConfirmSound();
            // Add rules functionality here
        });
        theZuccButton.on('pointerdown', () => {
            playConfirmSound();
            // Stop menu music before starting TheZucc
            if (this.sound.get('bgMusic')) {
                this.sound.get('bgMusic').stop();
            }
            this.scene.start('TheZucc');
        });
    }

    async initializeWallet() {
        let connectButton;
        try {
            // Add MetaMask connect button with adjusted position
            connectButton = TextStyleManager.createText(
                this,
                this.cameras.main.width - 100, 
                40, 
                'Connect Wallet', 
                'walletButton',
                1
            );

            // Function to handle wallet connection
            const connectWallet = async () => {
                try {
                    if (!connectButton || connectButton.destroyed) return false;
                    
                    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                    const account = accounts[0];
                    
                    // Use requestAnimationFrame to ensure the scene is ready
                    requestAnimationFrame(() => {
                        if (connectButton && !connectButton.destroyed) {
                            connectButton.setText('Disconnect Wallet');
                        }
                    });
                    
                    this.registry.set('walletAddress', account);
                    return true;
                } catch (error) {
                    console.error('Error connecting to MetaMask:', error);
                    if (connectButton && !connectButton.destroyed) {
                        connectButton.setText('Connect Wallet');
                    }
                    this.registry.set('walletAddress', null);
                    return false;
                }
            };

            // Check for existing MetaMask connection
            if (typeof window.ethereum !== 'undefined') {
                try {
                    // Check if already connected
                    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                    if (accounts.length > 0) {
                        // Auto-connect if we have permission
                        await connectWallet();
                    }

                    // Listen for account changes
                    window.ethereum.on('accountsChanged', async (accounts) => {
                        if (!connectButton || connectButton.destroyed) return;
                        
                        if (accounts.length === 0) {
                            requestAnimationFrame(() => {
                                if (connectButton && !connectButton.destroyed) {
                                    connectButton.setText('Connect Wallet');
                                }
                            });
                            this.registry.set('walletAddress', null);
                        } else {
                            await connectWallet();
                        }
                    });

                    // Listen for chain changes
                    window.ethereum.on('chainChanged', () => {
                        window.location.reload();
                    });
                } catch (error) {
                    console.error('Error checking MetaMask connection:', error);
                }
            }

            // Make connect button interactive with enhanced effects
            connectButton.setInteractive({ useHandCursor: true })
                .on('pointerover', () => {
                    if (!connectButton.destroyed) {
                        connectButton.setColor('#ff00ff');
                        connectButton.setScale(1.1);
                    }
                })
                .on('pointerout', () => {
                    if (!connectButton.destroyed) {
                        connectButton.setColor('#00ffff');
                        connectButton.setScale(1);
                    }
                })
                .on('pointerdown', async () => {
                    if (!connectButton.destroyed) {
                        const currentWallet = this.registry.get('walletAddress');
                        if (!currentWallet) {
                            if (typeof window.ethereum !== 'undefined') {
                                await connectWallet();
                            } else {
                                alert('Please install MetaMask to connect your wallet!');
                            }
                        } else {
                            // Disconnect wallet
                            try {
                                await window.ethereum.request({
                                    method: "wallet_revokePermissions",
                                    params: [/*{
                                        eth_accounts: {}
                                    }*/]
                                });
                                 
                                this.registry.set('walletAddress', null);
                                requestAnimationFrame(() => {
                                    if (connectButton && !connectButton.destroyed) {
                                        connectButton.setText('Connect Wallet');
                                    }
                                });
                            } catch (error) {
                                console.error('Error disconnecting wallet:', error);
                            }
                        }
                    }
                });
        } catch (error) {
            console.error('Error initializing wallet:', error);
        }
    }

    shutdown() {
        // Stop and cleanup menu music when leaving the scene
        const bgMusic = this.sound.get('bgMusic');
        if (bgMusic) {
            bgMusic.stop();
            bgMusic.destroy();
        }
        super.shutdown();
    }
}
