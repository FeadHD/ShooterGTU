import { Scene } from 'phaser';

export class TheZucc extends Scene {
    constructor() {
        super('TheZucc');
        this.enemyConfig = {
            'Slime': 0,
            'Drone': 0,
            'MeleeWarrior': 0
        };
    }

    async create() {
        // Create the scene first before checking wallet
        await this.createScene();
        await this.initializeWallet();
    }

    createEnemyConfigSection(yOffset) {
        const sectionX = 50;
        const labelStyle = {
            fontSize: '18px',
            fill: '#fff',
            fontFamily: 'Arial'
        };
        const inputStyle = {
            fontSize: '16px',
            fill: '#000',
            backgroundColor: '#fff',
            padding: { x: 5, y: 5 },
            fixedWidth: 40
        };

        // Add section title
        this.add.text(sectionX, yOffset, 'Enemy Configuration:', labelStyle);
        yOffset += 30;

        // Create input fields for each enemy type
        Object.keys(this.enemyConfig).forEach((enemyType, index) => {
            // Enemy label
            this.add.text(sectionX, yOffset + (index * 35), `${enemyType}:`, labelStyle);
            
            // Create input field
            const input = this.add.text(sectionX + 150, yOffset + (index * 35), '0', inputStyle)
                .setInteractive()
                .setPadding(5)
                .setBackgroundColor('#ffffff');

            // Add + button
            const plusBtn = this.add.text(sectionX + 200, yOffset + (index * 35), '+', labelStyle)
                .setInteractive()
                .setPadding(5)
                .on('pointerdown', () => {
                    const currentValue = parseInt(input.text);
                    if (currentValue < 10) {
                        input.setText((currentValue + 1).toString());
                        this.enemyConfig[enemyType] = currentValue + 1;
                    }
                });

            // Add - button
            const minusBtn = this.add.text(sectionX + 230, yOffset + (index * 35), '-', labelStyle)
                .setInteractive()
                .setPadding(5)
                .on('pointerdown', () => {
                    const currentValue = parseInt(input.text);
                    if (currentValue > 0) {
                        input.setText((currentValue - 1).toString());
                        this.enemyConfig[enemyType] = currentValue - 1;
                    }
                });

            // Add hover effects
            [plusBtn, minusBtn].forEach(btn => {
                btn.on('pointerover', () => btn.setBackgroundColor('#2980b9'))
                   .on('pointerout', () => btn.setBackgroundColor(null));
            });
        });

        return yOffset + (Object.keys(this.enemyConfig).length * 35) + 20;
    }

    async createScene() {
        const { width, height } = this.scale;

        // Add background
        const bg = this.add.rectangle(0, 0, width, height, 0x000000);
        bg.setOrigin(0);

        // Add title
        const titleStyle = {
            fontSize: '32px',
            fill: '#fff',
            fontFamily: 'Arial',
            align: 'center'
        };
        this.add.text(width / 2, 50, 'THE ZUCC', titleStyle).setOrigin(0.5);

        // Define scene categories and their scenes
        const sceneCategories = {
            'ZUCC TESTING': {
                scenes: ['Matrix640x360'],
                showConfig: true  // Flag to show enemy config
            },
            'PROCEDURAL SCENE': {
                scenes: ['Matrix640x360'],
                showConfig: false,
                showProcedural: true  // Flag to show procedural config
            },
            'Levels': {
                scenes: [
                    'GameScene1',
                    'GameScene2',
                    'GameScene3',
                    'GameScene4',
                    'GameScene5'
                ],
                showConfig: false
            },
            'Menus': {
                scenes: [
                    'MainMenu',
                    'Credits'
                ],
                showConfig: false
            }
        };

        // Style for category headers
        const categoryStyle = {
            fontSize: '24px',
            fill: '#fff',
            fontFamily: 'Arial'
        };

        // Style for scene buttons
        const buttonStyle = {
            fontSize: '18px',
            fill: '#fff',
            backgroundColor: '#34495e',
            padding: { x: 10, y: 5 }
        };

        let yOffset = 120;

        // Create sections for each category
        for (const [category, config] of Object.entries(sceneCategories)) {
            // Add category header
            this.add.text(50, yOffset, category, categoryStyle);
            yOffset += 40;

            // Add scene buttons
            let xOffset = 50;
            const maxWidth = width - 100;

            config.scenes.forEach(sceneName => {
                const button = this.add.text(xOffset, yOffset, sceneName, buttonStyle)
                    .setInteractive()
                    .setPadding(10)
                    .setBackgroundColor('#34495e')
                    .on('pointerover', () => button.setBackgroundColor('#2980b9'))
                    .on('pointerout', () => button.setBackgroundColor('#34495e'))
                    .on('pointerdown', () => {
                        console.log(`Launching scene: ${sceneName}`);
                        if (sceneName === 'Matrix640x360') {
                            // Pass enemy configuration to the Matrix scene
                            this.scene.start(sceneName, { enemyConfig: this.enemyConfig });
                        } else {
                            this.scene.start(sceneName);
                        }
                    });

                xOffset += button.width + 20;

                // Move to next row if we exceed max width
                if (xOffset > maxWidth) {
                    xOffset = 50;
                    yOffset += 40;
                }
            });
            
            // Add enemy configuration section if this category needs it
            if (config.showConfig) {
                yOffset += 40;  // Add some space before the config section
                yOffset = this.createEnemyConfigSection(yOffset);
            }

            // Add procedural configuration section if this category needs it
            if (config.showProcedural) {
                yOffset += 40;  // Add some space before the config section
                yOffset = this.createProceduralSection(yOffset);
            }
            
            yOffset += 60;  // Space between categories
        }

        // Add back button at the bottom
        const backButton = this.add.text(width / 2, height - 50, 'BACK TO MAIN MENU', {
            fontSize: '24px',
            fill: '#fff',
            backgroundColor: '#c0392b',
            padding: { x: 15, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive()
        .setPadding(10)
        .setBackgroundColor('#c0392b')
        .on('pointerover', () => backButton.setBackgroundColor('#e74c3c'))
        .on('pointerout', () => backButton.setBackgroundColor('#c0392b'))
        .on('pointerdown', () => {
            this.scene.stop('TheZucc');
            this.scene.start('MainMenu');
        });
    }

    createProceduralSection(yOffset) {
        const labelStyle = {
            fontSize: '18px',
            fill: '#fff',
            fontFamily: 'Arial'
        };

        const buttonStyle = {
            fontSize: '16px',
            fill: '#fff',
            backgroundColor: '#34495e',
            padding: { x: 10, y: 5 }
        };

        // Add section title
        this.add.text(50, yOffset, 'Procedural Configuration:', labelStyle);
        yOffset += 40;

        // Add description
        this.add.text(50, yOffset, 'Configure procedural scene generation:', labelStyle);
        yOffset += 30;

        // We'll add the actual configuration controls in the next step
        // For now, just return the updated yOffset
        return yOffset;
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
