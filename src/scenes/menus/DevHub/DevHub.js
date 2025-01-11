import { Scene } from 'phaser';
import { createRetroButton } from '../ui-helpers';

export class DevHub extends Scene {
    constructor() {
        super({ key: 'DevHub' });
        this.buttonY = 150;  // Start sections lower down
        this.currentOpenDropdown = null;
        this.matrixChars = [];
        this.streams = [];
    }

    create() {
        this.cameras.main.setBackgroundColor('#2c3e50');
        
        // Create Matrix background
        this.createMatrixBackground();
        
        // Create a dark overlay to improve text readability
        this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.7)
            .setOrigin(0)
            .setDepth(1);

        // Create containers for different sections with proper depth
        this.mainContainer = this.add.container(0, 0).setDepth(2);
        this.dropdownContainer = this.add.container(0, 0).setDepth(2);

        // Title
        const title = this.add.text(
            this.cameras.main.centerX,
            80,
            'Developer Hub',
            { fontSize: '32px', fill: '#00ff00', fontFamily: 'Courier' }
        ).setOrigin(0.5).setDepth(2);
        this.mainContainer.add(title);

        this.buttonY = 150;

        this.createQuickLaunchSection();
        this.buttonY += 20;  // Add extra spacing between sections
        this.createDocumentationSection();
        this.buttonY += 20;  // Add extra spacing between sections
        this.createSoundTestingSection();

        // Back button
        const backButton = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.height - 50,
            'Back to Main Menu',
            { fontSize: '24px', fill: '#00ff00', fontFamily: 'Courier New' }
        ).setOrigin(0.5)
          .setInteractive({ useHandCursor: true })
          .on('pointerover', () => backButton.setStyle({ fill: '#0ff' }))
          .on('pointerout', () => backButton.setStyle({ fill: '#00ff00' }))
          .on('pointerdown', () => this.scene.start('MainMenu'));
        this.mainContainer.add(backButton);
    }

    createQuickLaunchSection() {
        // Section title
        const quickLaunchTitle = this.add.text(
            this.cameras.main.centerX,
            this.buttonY,
            'Quick Launch:',
            {
                fontSize: '24px',
                fill: '#00ff00',
                fontFamily: 'Courier'
            }
        ).setOrigin(0.5).setDepth(2);
        this.mainContainer.add(quickLaunchTitle);
        this.buttonY += 40;

        this.createDropdown('Select Level...', [
            { key: 'GameScene1', title: 'Game Scene 1' },
            { key: 'GameScene2', title: 'Game Scene 2' },
            { key: 'GameScene3', title: 'Game Scene 3' },
            { key: 'GameScene4', title: 'Game Scene 4' },
            { key: 'GameScene5', title: 'Game Scene 5' },
            { key: 'GtuTestLevel0', title: 'GTU Test Level 0' },
            { key: 'GtuTestLevel1', title: 'GTU Test Level 1' },
            { key: 'GtuTestLevel2', title: 'GTU Test Level 2' },
            { key: 'CombinedGtuLevel', title: 'Combined GTU Level' },
            { key: 'Matrix640x360', title: 'Matrix Level' },
            { key: 'BlueTest', title: 'Blue Test Level' },
            { key: 'LegacyGameScene1', title: 'Legacy Game Scene 1' }
        ]);
    }

    createDocumentationSection() {
        // Section title
        const docTitle = this.add.text(
            this.cameras.main.centerX,
            this.buttonY,
            'Documentation:',
            {
                fontSize: '24px',
                fill: '#00ff00',
                fontFamily: 'Courier'
            }
        ).setOrigin(0.5).setDepth(2);
        this.mainContainer.add(docTitle);
        this.buttonY += 40;

        this.createDropdown('Select Documentation...', [
            { key: 'animation-manager-documentation', title: 'Animation Manager', path: 'animation-manager-documentation.html' },
            { key: 'base-scene-manager-documentation', title: 'Base Scene', path: 'base-scene-manager-documentation.html' },
            { key: 'boundary-manager-documentation', title: 'Boundary Manager', path: 'boundary-manager-documentation.html' },
            { key: 'collision-manager-documentation', title: 'Collision Manager', path: 'collision-manager-documentation.html' },
            { key: 'combined-level-documentation', title: 'Combined Level', path: 'combined-level-documentation.html' },
            { key: 'enemy-manager-documentation', title: 'Enemy Manager', path: 'enemy-manager-documentation.html' },
            { key: 'ldtk-documentation', title: 'LDtk Documentation', path: 'ldtk-documentation.html' },
            { key: 'ldtk-tile-manager-documentation', title: 'LDtk Tile Manager', path: 'ldtk-tile-manager-documentation.html' },
            { key: 'level-loader-documentation', title: 'Level Loader', path: 'level-loader-documentation.html' },
            { key: 'manager-factory-documentation', title: 'Manager Factory', path: 'manager-factory-documentation.html' },
            { key: 'object-pool-documentation', title: 'Object Pool', path: 'object-pool-documentation.html' },
            { key: 'player-documentation', title: 'Player Documentation', path: 'player-documentation.html' },
            { key: 'scene-initializer-documentation', title: 'Scene Initializer', path: 'scene-initializer-documentation.html' },
            { key: 'state-manager-documentation', title: 'State Manager', path: 'state-manager-documentation.html' }
        ]);
    }

    createSoundTestingSection() {
        const sectionTitle = this.add.text(
            this.cameras.main.centerX,
            this.buttonY,
            'Sound Testing',
            { fontSize: '24px', fill: '#00ff00', fontFamily: 'Courier' }
        ).setOrigin(0.5);
        this.mainContainer.add(sectionTitle);
        this.buttonY += 50;

        const soundTesterButton = this.add.text(
            this.cameras.main.centerX,
            this.buttonY,
            'Open Sound Tester',
            { fontSize: '20px', fill: '#ffffff', fontFamily: 'Courier' }
        )
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => soundTesterButton.setStyle({ fill: '#0ff' }))
        .on('pointerout', () => soundTesterButton.setStyle({ fill: '#ffffff' }))
        .on('pointerdown', () => this.scene.start('SoundTester'));

        this.mainContainer.add(soundTesterButton);
        this.buttonY += 40;
    }

    createDropdown(placeholder, items) {
        const dropdownWidth = 300;
        const dropdownHeight = 40;
        const dropdownX = this.cameras.main.centerX - (dropdownWidth / 2);
        const currentY = this.buttonY;
        let dropdownState = {
            optionsContainer: null,
            arrow: null,
            isOpen: false
        };

        // Create dropdown header
        const header = this.add.container(0, currentY);
        
        const dropdownBg = this.add.rectangle(
            dropdownX,
            0,
            dropdownWidth,
            dropdownHeight,
            0x2c3e50
        ).setOrigin(0).setDepth(2);

        const dropdownText = this.add.text(
            dropdownX + 10,
            10,
            placeholder,
            { 
                fontSize: '18px', 
                fill: '#00ff00',
                fontFamily: 'Courier' 
            }
        ).setDepth(2);

        const arrow = this.add.text(
            dropdownX + dropdownWidth - 30,
            10,
            '▼',
            { 
                fontSize: '18px', 
                fill: '#00ff00',
                fontFamily: 'Courier' 
            }
        ).setDepth(2);
        dropdownState.arrow = arrow;

        header.add([dropdownBg, dropdownText, arrow]);
        this.dropdownContainer.add(header);

        // Create options container
        const optionsContainer = this.add.container(dropdownX + dropdownWidth + 10, currentY);
        dropdownState.optionsContainer = optionsContainer;
        this.dropdownContainer.add(optionsContainer);

        // Calculate visible options
        const maxVisibleOptions = Math.floor((this.cameras.main.height - currentY - dropdownHeight - 100) / 40);
        const itemHeight = 40;

        // Create options background
        const optionsBackground = this.add.rectangle(
            0,
            0,
            dropdownWidth,
            Math.min(items.length, maxVisibleOptions) * itemHeight,
            0x2c3e50
        ).setOrigin(0);
        optionsContainer.add(optionsBackground);

        // Add options
        items.forEach((item, index) => {
            const bg = this.add.rectangle(
                0,
                index * itemHeight,
                dropdownWidth,
                itemHeight,
                0x2c3e50
            ).setOrigin(0);

            const text = this.add.text(
                10,
                index * itemHeight + 10,
                item.title,
                { 
                    fontSize: '18px', 
                    fill: '#00ff00',
                    fontFamily: 'Courier' 
                }
            );

            bg.setInteractive({ useHandCursor: true })
                .on('pointerover', () => bg.setFillStyle(0x4a6fa5))
                .on('pointerout', () => bg.setFillStyle(0x2c3e50))
                .on('pointerdown', () => {
                    if (item.key.includes('-')) {
                        const docPath = `http://localhost:3000/docs/${item.path}`;
                        // Create an iframe to display the documentation
                        const iframe = document.createElement('iframe');
                        iframe.style.position = 'fixed';
                        iframe.style.top = '0';
                        iframe.style.left = '0';
                        iframe.style.width = '100%';
                        iframe.style.height = '100%';
                        iframe.style.border = 'none';
                        iframe.style.zIndex = '1000';
                        iframe.src = docPath;
                        document.body.appendChild(iframe);
                        
                        // Add a close button
                        const closeButton = document.createElement('button');
                        closeButton.textContent = 'Close Documentation';
                        closeButton.style.position = 'fixed';
                        closeButton.style.top = '10px';
                        closeButton.style.right = '10px';
                        closeButton.style.zIndex = '1001';
                        closeButton.style.padding = '10px';
                        closeButton.style.backgroundColor = '#4a6fa5';
                        closeButton.style.color = 'white';
                        closeButton.style.border = 'none';
                        closeButton.style.borderRadius = '5px';
                        closeButton.style.cursor = 'pointer';
                        closeButton.onclick = () => {
                            document.body.removeChild(iframe);
                            document.body.removeChild(closeButton);
                        };
                        document.body.appendChild(closeButton);
                    } else {
                        this.scene.start(item.key);
                    }
                    dropdownState.isOpen = false;
                    optionsContainer.setVisible(false);
                    arrow.setText('▼');
                });

            optionsContainer.add([bg, text]);
        });

        // Handle dropdown toggle
        let scrollOffset = 0;

        const closeDropdown = () => {
            dropdownState.isOpen = false;
            optionsContainer.setVisible(false);
            arrow.setText('▼');
            this.currentOpenDropdown = null;
        };

        const openDropdown = () => {
            // Close currently open dropdown if exists
            if (this.currentOpenDropdown && this.currentOpenDropdown !== dropdownState) {
                this.currentOpenDropdown.isOpen = false;
                this.currentOpenDropdown.optionsContainer.setVisible(false);
                this.currentOpenDropdown.arrow.setText('▼');
            }
            dropdownState.isOpen = true;
            optionsContainer.setVisible(true);
            arrow.setText('▲');
            this.currentOpenDropdown = dropdownState;
        };

        dropdownBg.setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                if (dropdownState.isOpen) {
                    closeDropdown();
                } else {
                    openDropdown();
                }
                scrollOffset = 0;
            });

        // Add scroll handling
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
            if (dropdownState.isOpen && pointer.y > currentY + dropdownHeight) {
                scrollOffset = Phaser.Math.Clamp(
                    scrollOffset + deltaY,
                    -Math.max(0, (items.length - maxVisibleOptions) * itemHeight),
                    0
                );
                optionsContainer.y = currentY + scrollOffset;
            }
        });

        optionsContainer.setVisible(false);
        this.buttonY += dropdownHeight + 40;
    }

    createMatrixBackground() {
        // Matrix green color
        const matrixGreen = '#00ff00';
        
        // Create character streams
        const streamCount = Math.floor(this.cameras.main.width / 20); // Space streams every 20 pixels
        
        for (let i = 0; i < streamCount; i++) {
            const x = i * 20;
            const speed = Phaser.Math.Between(2, 5);
            const startDelay = Phaser.Math.Between(0, 2000);
            
            const stream = {
                x: x,
                y: -20,
                speed: speed,
                chars: [],
                delay: startDelay,
                update: 0
            };
            
            // Create characters in the stream
            const streamLength = Phaser.Math.Between(5, 15);
            for (let j = 0; j < streamLength; j++) {
                const char = this.add.text(x, -20 - (j * 20), this.getRandomMatrixChar(), {
                    fontSize: '20px',
                    fontFamily: 'Courier',
                    color: matrixGreen,
                    alpha: j === 0 ? 1 : 0.5 // First character brighter
                }).setDepth(0);  // Set matrix characters to depth 0
                stream.chars.push(char);
                this.matrixChars.push(char);
            }
            
            this.streams.push(stream);
        }
        
        // Update the streams
        this.time.addEvent({
            delay: 50,
            callback: () => {
                if (!this.scene.isActive()) return;  // Don't update if scene is not active
                
                this.streams.forEach(stream => {
                    if (stream.delay > 0) {
                        stream.delay -= 50;
                        return;
                    }

                    stream.update += 50;
                    if (stream.update >= 100) {
                        stream.update = 0;
                        
                        stream.chars.forEach(char => {
                            if (char && char.active) {  // Check if character still exists and is active
                                char.y += stream.speed;
                                
                                // Randomly change characters
                                if (Phaser.Math.Between(0, 20) === 0) {
                                    char.setText(this.getRandomMatrixChar());
                                }
                                
                                // Reset if off screen
                                if (char.y > this.cameras.main.height) {
                                    char.y = -20;
                                }
                            }
                        });
                    }
                });
            },
            callbackScope: this,
            loop: true
        });
    }

    getRandomMatrixChar() {
        const chars = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ1234567890@#$%&*';
        return chars[Math.floor(Math.random() * chars.length)];
    }
}
