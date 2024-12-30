import { Scene } from 'phaser';

export class TheZucc extends Scene {
    constructor() {
        super({ key: 'TheZucc' });
        this.enemyConfig = {
            'Slime': 0,
            'Drone': 0,
            'MeleeWarrior': 0
        };
        this.trapConfig = {
            'AlarmTrigger': 0
        };
        // Add procedural configuration
        this.proceduralConfig = {
            gridWidth: 20,
            gridHeight: 12,
            minPlatformWidth: 3,
            maxPlatformWidth: 8,
            platformDensity: 0.6,
            minGapWidth: 3, // In tiles
            maxGapWidth: 5  // In tiles
        };
        this.backgroundMusic = null;
    }

    preload() {
        console.log('TheZucc preload - Checking audio cache');
        if (!this.cache.audio.exists('thezucc')) {
            console.log('TheZucc preload - Audio not in cache, loading...');
            this.load.audio('thezucc', './assets/sounds/thezucc.wav');
            this.load.on('filecomplete-audio-thezucc', () => {
                console.log('TheZucc preload - Audio loaded successfully');
            });
            this.load.on('loaderror', (file) => {
                console.error('TheZucc preload - Error loading audio:', file.key, file.url);
            });
        } else {
            console.log('TheZucc preload - Audio already in cache');
        }
    }

    async create() {
        console.log('TheZucc create - Starting');
        // Stop any existing background music and play thezucc
        if (this.sound.get('bgMusic')) {
            this.sound.get('bgMusic').stop();
        }
        this.sound.play('thezucc', { loop: true });

        // Set up camera
        this.cameras.main.setBounds(0, 0, this.scale.width, this.scale.height);
        this.cameras.main.setZoom(0.75);

        // Create the scene first before checking wallet
        await this.createScene();
        await this.initializeWallet();
    }

    createEnemyConfigSection(yOffset) {
        const leftColumnX = 50;
        const rightColumnX = this.cameras.main.width / 2 + 50;
        const labelStyle = {
            fontSize: '32px',
            fill: '#fff',
            fontFamily: 'Press Start 2P'
        };
        const valueStyle = {
            fontSize: '48px',
            fill: '#00ff00',
            fontFamily: 'Press Start 2P'
        };
        const buttonStyle = {
            fontSize: '48px',
            fill: '#fff',
            fontFamily: 'Press Start 2P',
            backgroundColor: '#444444'
        };

        // Add section titles
        this.add.text(leftColumnX, yOffset, 'Enemy Configuration:', {
            ...labelStyle,
            fontSize: '48px'
        });
        this.add.text(rightColumnX, yOffset, 'Trap Configuration:', {
            ...labelStyle,
            fontSize: '48px',
            fill: '#ff0000'
        });
        yOffset += 60;

        // Create enemy counters (left column)
        Object.keys(this.enemyConfig).forEach((enemyType, index) => {
            const y = yOffset + (index * 60);
            
            // Enemy label
            this.add.text(leftColumnX, y, `${enemyType}:`, labelStyle);
            
            // Create counter display with background
            const counterBg = this.add.rectangle(leftColumnX + 350, y + 20, 80, 50, 0x333333);
            const counter = this.add.text(leftColumnX + 320, y, this.enemyConfig[enemyType].toString(), valueStyle);
            
            // Add + button
            const plusBtn = this.add.text(leftColumnX + 420, y, '+', buttonStyle)
                .setInteractive()
                .setPadding(10)
                .on('pointerdown', () => {
                    this.enemyConfig[enemyType]++;
                    counter.setText(this.enemyConfig[enemyType].toString());
                });

            // Add - button
            const minusBtn = this.add.text(leftColumnX + 500, y, '-', buttonStyle)
                .setInteractive()
                .setPadding(10)
                .on('pointerdown', () => {
                    if (this.enemyConfig[enemyType] > 0) {
                        this.enemyConfig[enemyType]--;
                        counter.setText(this.enemyConfig[enemyType].toString());
                    }
                });

            // Add hover effects
            [plusBtn, minusBtn].forEach(btn => {
                btn.on('pointerover', () => btn.setBackgroundColor('#666666'))
                   .on('pointerout', () => btn.setBackgroundColor('#444444'));
            });
        });

        // Create trap counters (right column)
        Object.keys(this.trapConfig).forEach((trapType, index) => {
            const y = yOffset + (index * 60);
            
            // Trap label
            this.add.text(rightColumnX, y, `${trapType}:`, labelStyle);
            
            // Create counter display with background
            const counterBg = this.add.rectangle(rightColumnX + 350, y + 20, 80, 50, 0x333333);
            const counter = this.add.text(rightColumnX + 320, y, this.trapConfig[trapType].toString(), {
                ...valueStyle,
                fill: '#ff0000'
            });
            
            // Add + button
            const plusBtn = this.add.text(rightColumnX + 420, y, '+', buttonStyle)
                .setInteractive()
                .setPadding(10)
                .on('pointerdown', () => {
                    this.trapConfig[trapType]++;
                    counter.setText(this.trapConfig[trapType].toString());
                });

            // Add - button
            const minusBtn = this.add.text(rightColumnX + 500, y, '-', buttonStyle)
                .setInteractive()
                .setPadding(10)
                .on('pointerdown', () => {
                    if (this.trapConfig[trapType] > 0) {
                        this.trapConfig[trapType]--;
                        counter.setText(this.trapConfig[trapType].toString());
                    }
                });

            // Add hover effects
            [plusBtn, minusBtn].forEach(btn => {
                btn.on('pointerover', () => btn.setBackgroundColor('#666666'))
                   .on('pointerout', () => btn.setBackgroundColor('#444444'));
            });
        });

        // Calculate max height between columns
        const enemyHeight = Object.keys(this.enemyConfig).length * 60;
        const trapHeight = Object.keys(this.trapConfig).length * 60;
        return yOffset + Math.max(enemyHeight, trapHeight) + 40;
    }

    async createScene() {
        const { width, height } = this.scale;

        // Add background
        const bg = this.add.rectangle(0, 0, width, height, 0x000000);
        bg.setOrigin(0);

        // Add title
        const titleStyle = {
            fontSize: '48px',  
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
            fontSize: '36px',  
            fill: '#fff',
            fontFamily: 'Arial'
        };

        // Style for scene buttons
        const buttonStyle = {
            fontSize: '24px',  
            fill: '#fff',
            backgroundColor: '#34495e',
            padding: { x: 15, y: 10 }
        };

        let yOffset = 120;

        // Create sections for each category
        for (const [category, config] of Object.entries(sceneCategories)) {
            // Add category header
            this.add.text(50, yOffset, category, categoryStyle);
            yOffset += 60;  

            // Add scene buttons
            let xOffset = 50;
            const maxWidth = width - 100;

            config.scenes.forEach(sceneName => {
                const button = this.add.text(xOffset, yOffset, sceneName, buttonStyle)
                    .setInteractive()
                    .setPadding(15)
                    .setBackgroundColor('#34495e')
                    .on('pointerover', () => button.setBackgroundColor('#2980b9'))
                    .on('pointerout', () => button.setBackgroundColor('#34495e'))
                    .on('pointerdown', () => {
                        // Stop the music before starting the scene
                        const music = this.sound.get('thezucc');
                        if (music) {
                            music.stop();
                        }
                        
                        if (config.showConfig) {
                            this.scene.start(sceneName, { enemyConfig: this.enemyConfig, trapConfig: this.trapConfig });
                        } else {
                            this.scene.start(sceneName);
                        }
                    });

                xOffset += button.width + 30;  

                // Move to next row if we exceed max width
                if (xOffset > maxWidth) {
                    xOffset = 50;
                    yOffset += 60;  
                }
            });
            
            // Add enemy configuration section if this category needs it
            if (config.showConfig) {
                yOffset += 60;  
                yOffset = this.createEnemyConfigSection(yOffset);
            }

            // Add procedural configuration section if this category needs it
            if (config.showProcedural) {
                yOffset += 60;  
                yOffset = this.addProceduralControls(yOffset);
            }
            
            yOffset += 80;  
        }

        // Add back button at the bottom
        const backButton = this.add.text(width / 2, height - 50, 'BACK TO MAIN MENU', {
            fontSize: '36px',  
            fill: '#fff',
            backgroundColor: '#c0392b',
            padding: { x: 20, y: 15 }
        })
        .setOrigin(0.5)
        .setInteractive()
        .setPadding(15)
        .setBackgroundColor('#c0392b')
        .on('pointerover', () => backButton.setBackgroundColor('#e74c3c'))
        .on('pointerout', () => backButton.setBackgroundColor('#c0392b'))
        .on('pointerdown', () => {
            // Stop the music before going back to main menu
            const music = this.sound.get('thezucc');
            if (music) {
                music.stop();
            }
            this.scene.stop('TheZucc');
            this.scene.start('MainMenu');
        });
    }

    addProceduralControls(yOffset) {
        const labelStyle = {
            fontSize: '32px',  
            fill: '#fff',
            fontFamily: 'Arial'
        };

        const buttonStyle = {
            fontSize: '24px',  
            fill: '#fff',
            backgroundColor: '#34495e',
            padding: { x: 15, y: 10 }
        };

        this.add.text(50, yOffset, 'Procedural Level Settings:', labelStyle);
        yOffset += 60;  

        // Platform Width Controls
        this.add.text(50, yOffset, 'Min Platform Width:', labelStyle);
        const minPlatformText = this.add.text(250, yOffset, this.proceduralConfig.minPlatformWidth.toString(), buttonStyle)
            .setInteractive()
            .setPadding(15);

        this.add.text(350, yOffset, '+', buttonStyle)
            .setInteractive()
            .setPadding(15)
            .on('pointerdown', () => {
                if (this.proceduralConfig.minPlatformWidth < this.proceduralConfig.maxPlatformWidth - 1) {
                    this.proceduralConfig.minPlatformWidth++;
                    minPlatformText.setText(this.proceduralConfig.minPlatformWidth.toString());
                }
            });

        this.add.text(400, yOffset, '-', buttonStyle)
            .setInteractive()
            .setPadding(15)
            .on('pointerdown', () => {
                if (this.proceduralConfig.minPlatformWidth > 2) {
                    this.proceduralConfig.minPlatformWidth--;
                    minPlatformText.setText(this.proceduralConfig.minPlatformWidth.toString());
                }
            });
        yOffset += 60;  

        // Max Platform Width Controls
        this.add.text(50, yOffset, 'Max Platform Width:', labelStyle);
        const maxPlatformText = this.add.text(250, yOffset, this.proceduralConfig.maxPlatformWidth.toString(), buttonStyle)
            .setInteractive()
            .setPadding(15);

        this.add.text(350, yOffset, '+', buttonStyle)
            .setInteractive()
            .setPadding(15)
            .on('pointerdown', () => {
                if (this.proceduralConfig.maxPlatformWidth < 12) {
                    this.proceduralConfig.maxPlatformWidth++;
                    maxPlatformText.setText(this.proceduralConfig.maxPlatformWidth.toString());
                }
            });

        this.add.text(400, yOffset, '-', buttonStyle)
            .setInteractive()
            .setPadding(15)
            .on('pointerdown', () => {
                if (this.proceduralConfig.maxPlatformWidth > this.proceduralConfig.minPlatformWidth + 1) {
                    this.proceduralConfig.maxPlatformWidth--;
                    maxPlatformText.setText(this.proceduralConfig.maxPlatformWidth.toString());
                }
            });
        yOffset += 60;  

        // Platform Density Controls
        this.add.text(50, yOffset, 'Platform Density:', labelStyle);
        const densityText = this.add.text(250, yOffset, this.proceduralConfig.platformDensity.toFixed(1), buttonStyle)
            .setInteractive()
            .setPadding(15);

        this.add.text(350, yOffset, '+', buttonStyle)
            .setInteractive()
            .setPadding(15)
            .on('pointerdown', () => {
                if (this.proceduralConfig.platformDensity < 0.9) {
                    this.proceduralConfig.platformDensity += 0.1;
                    densityText.setText(this.proceduralConfig.platformDensity.toFixed(1));
                }
            });

        this.add.text(400, yOffset, '-', buttonStyle)
            .setInteractive()
            .setPadding(15)
            .on('pointerdown', () => {
                if (this.proceduralConfig.platformDensity > 0.2) {
                    this.proceduralConfig.platformDensity -= 0.1;
                    densityText.setText(this.proceduralConfig.platformDensity.toFixed(1));
                }
            });
        yOffset += 60;  

        // Gap Width Controls
        this.add.text(50, yOffset, 'Min Gap Width:', labelStyle);
        const minGapText = this.add.text(250, yOffset, this.proceduralConfig.minGapWidth.toString(), buttonStyle)
            .setInteractive()
            .setPadding(15);

        this.add.text(350, yOffset, '+', buttonStyle)
            .setInteractive()
            .setPadding(15)
            .on('pointerdown', () => {
                if (this.proceduralConfig.minGapWidth < this.proceduralConfig.maxGapWidth - 1) {
                    this.proceduralConfig.minGapWidth++;
                    minGapText.setText(this.proceduralConfig.minGapWidth.toString());
                }
            });

        this.add.text(400, yOffset, '-', buttonStyle)
            .setInteractive()
            .setPadding(15)
            .on('pointerdown', () => {
                if (this.proceduralConfig.minGapWidth > 2) {
                    this.proceduralConfig.minGapWidth--;
                    minGapText.setText(this.proceduralConfig.minGapWidth.toString());
                }
            });
        yOffset += 60;  

        // Test Button
        const testButton = this.add.text(50, yOffset, 'Test Procedural Level', {
            fontSize: '36px',  
            fill: '#fff',
            backgroundColor: '#2ecc71',
            padding: { x: 20, y: 15 }
        })
        .setInteractive()
        .setPadding(15)
        .on('pointerdown', () => {
            // Stop the music before starting the procedural level
            const music = this.sound.get('thezucc');
            if (music) {
                music.stop();
            }
            console.log('Starting procedural level with config:', this.proceduralConfig);
            this.scene.start('Matrix640x360', { 
                procedural: true,
                proceduralConfig: this.proceduralConfig,
                enemyConfig: this.enemyConfig,
                trapConfig: this.trapConfig
            });
        });

        return yOffset + 80;  
    }

    shutdown() {
        // Stop the thezucc music when leaving the scene
        const music = this.sound.get('thezucc');
        if (music) {
            music.stop();
        }
        super.shutdown();
    }

    async initializeWallet() {
        let connectButton;
        try {
            // Add MetaMask connect button with retro style
            connectButton = this.add.text(this.cameras.main.width - 30, 30, 'Connect Wallet', {
                fontFamily: 'Retronoid, Arial',
                fontSize: '48px',  
                color: '#00ffff',
                stroke: '#ffffff',
                strokeThickness: 2,
                padding: { x: 20, y: 15 },
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
