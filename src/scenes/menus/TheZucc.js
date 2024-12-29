import { Scene } from 'phaser';

export class TheZucc extends Scene {
    constructor() {
        super('TheZucc');
    }

    async create() {
        // Create the scene first before checking wallet
        await this.createScene();
        await this.initializeWallet();
    }

    async createScene() {
        // Enable input system
        this.input.keyboard.enabled = true;
        this.input.mouse.enabled = true;
        
        // Remove any existing input listeners
        this.input.keyboard.removeAllKeys();
        this.input.removeAllListeners();

        // Set background color
        this.cameras.main.setBackgroundColor('#2c3e50');

        // Add title
        const title = this.add.text(this.cameras.main.centerX, 50, 'Developer Testing Menu', {
            fontSize: '32px',
            fill: '#fff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Define scene categories and their scenes
        const sceneCategories = {
            'Levels': [
                'GameScene1',
                'GameScene2',
                'GameScene3',
                'GameScene4',
                'GameScene5',
                'Matrix640x360'
            ],
            'Menus': [
                'MainMenu',
                'Settings',
                'ControlsSettingsScene',
                'Leaderboard',
                'MissionComplete'
            ],
            'Other': [
                'Boot',
                'Preloader',
                'TitleScene'
            ]
        };

        let yOffset = 120;
        const buttonStyle = {
            fontSize: '16px',
            fill: '#fff',
            backgroundColor: '#34495e',
            padding: { x: 10, y: 5 }
        };

        // Create buttons for each category
        for (const [category, scenes] of Object.entries(sceneCategories)) {
            // Add category title
            this.add.text(50, yOffset, category, {
                fontSize: '24px',
                fill: '#fff',
                fontFamily: 'Arial'
            });
            
            yOffset += 40;
            let xOffset = 50;
            
            // Create buttons for each scene in the category
            scenes.forEach((sceneName, index) => {
                const button = this.add.text(xOffset, yOffset, sceneName, buttonStyle)
                    .setInteractive()
                    .setPadding(10)
                    .setBackgroundColor('#34495e')
                    .on('pointerover', () => button.setBackgroundColor('#2980b9'))
                    .on('pointerout', () => button.setBackgroundColor('#34495e'))
                    .on('pointerdown', () => {
                        console.log(`Launching scene: ${sceneName}`);
                        this.scene.start(sceneName);
                    });

                xOffset += button.width + 20;
                
                // New row after 3 buttons
                if ((index + 1) % 3 === 0) {
                    xOffset = 50;
                    yOffset += 40;
                }
            });
            
            yOffset += 60;
        }

        // Add a reset button at the bottom
        const resetButton = this.add.text(
            this.cameras.main.centerX,
            yOffset,
            'Reset Game State',
            {
                fontSize: '20px',
                fill: '#fff',
                backgroundColor: '#c0392b',
                padding: { x: 15, y: 10 }
            }
        )
        .setOrigin(0.5)
        .setInteractive()
        .setPadding(10)
        .setBackgroundColor('#c0392b')
        .on('pointerover', () => resetButton.setBackgroundColor('#e74c3c'))
        .on('pointerout', () => resetButton.setBackgroundColor('#c0392b'))
        .on('pointerdown', () => {
            // Reset all game state
            this.registry.set('lives', 3);
            this.registry.set('playerHP', 100);
            this.registry.set('score', 0);
            this.registry.set('bitcoins', 0);
            console.log('Game state reset');
        });
    }

    async initializeWallet() {
        let connectButton;
        try {
            // Add MetaMask connect button with retro style
            connectButton = this.add.text(this.cameras.main.width - 30, 30, 'Connect Wallet', {
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
