import { Scene } from 'phaser';

export class MainMenu extends Scene {
    constructor() {
        super('MainMenu');
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

        // Only create new music if it doesn't exist
        if (!bgMusic) {
            bgMusic = this.sound.add('bgMusic', {
                volume: 0.15,
                loop: true
            });
            
            // Only play if music was enabled
            if (musicEnabled !== false) {
                bgMusic.play();
            }
        }

        // Create title and buttons first
        this.createTitle(canvasWidth, canvasHeight);
        this.createGameButtons(canvasWidth, canvasHeight);

        // Store canvas dimensions for wallet initialization
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
    }

    createTitle(canvasWidth, canvasHeight) {
        // Add shadow layers for 3D effect
        const shadowOffset = 4;
        const numLayers = 5;
        
        for (let i = numLayers; i >= 0; i--) {
            const layerColor = i === 0 ? '#4400ff' : '#ff00ff';
            this.add.text(canvasWidth/2 + (i * shadowOffset), canvasHeight * 0.15 + (i * shadowOffset), 'GOOD TIME UNIVERSE', {
                fontFamily: 'Retronoid, Arial',
                fontSize: '100px',
                color: layerColor,
                align: 'center',
            }).setOrigin(0.5);
        }

        // Add main title text with glow effect
        this.add.text(canvasWidth/2, canvasHeight * 0.15, 'GOOD TIME UNIVERSE', {
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
        }).setOrigin(0.5);

        // Add mission title with similar style but smaller
        this.add.text(canvasWidth/2, canvasHeight * 0.25, 'MISSION ONE: LEDGER HEIST', {
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
        }).setOrigin(0.5);
    }

    createGameButtons(canvasWidth, canvasHeight) {
        // Create retro-style buttons
        const buttonStyle = {
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
        };

        // Helper function to create buttons
        const createButton = (text, y) => {
            const button = this.add.text(canvasWidth / 2, y, text, buttonStyle)
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true });

            button.on('pointerover', () => {
                button.setScale(1.2);
                button.setColor('#ff00ff');
            });

            button.on('pointerout', () => {
                button.setScale(1);
                button.setColor('#00ffff');
            });

            return button;
        };

        // Create menu buttons - moved up for better spacing
        const startButton = createButton('START', canvasHeight * 0.45);
        const controlsButton = createButton('CONTROLS', canvasHeight * 0.55);
        const settingsButton = createButton('SETTINGS', canvasHeight * 0.65);
        const leaderboardButton = createButton('LEADERBOARD', canvasHeight * 0.75);
        const rulesButton = createButton('RULES', canvasHeight * 0.85);

        // Add click handlers
        startButton.on('pointerdown', () => {
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

            // Start first level
            this.scene.start('GameScene1');
        });
        controlsButton.on('pointerdown', () => {
            this.scene.start('ControlsSettingsScene');
        });
        settingsButton.on('pointerdown', () => {
            this.scene.start('Settings');
        });
        leaderboardButton.on('pointerdown', () => {
            this.scene.start('Leaderboard');
        });
        rulesButton.on('pointerdown', () => {
            // Add rules functionality here
        });
    }

    async initializeWallet() {
        let connectButton;
        try {
            // Add MetaMask connect button with retro style
            connectButton = this.add.text(this.canvasWidth - 30, 30, 'Connect Wallet', {
                fontFamily: 'Retronoid, Arial',
                fontSize: '32px',
                color: '#00ffff',
                stroke: '#ffffff',
                strokeThickness: 2,
                padding: { x: 15, y: 10 },
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: '#ff00ff',
                    blur: 5,
                    fill: true
                }
            }).setOrigin(1, 0);

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
                                    params: [{
                                        eth_accounts: {}
                                    }]
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
}
