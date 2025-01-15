import { Scene } from 'phaser';
import { createRetroButton } from '../ui-helpers';

export class DevHub extends Scene {
    constructor() {
        super({ key: 'DevHub' });
        this.buttonY = 0;
        this.currentOpenDropdown = null;
        this.baseDropdownDepth = 10;
        this.currentMaxDepth = this.baseDropdownDepth;
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
        this.dropdownContainer = this.add.container(0, 0).setDepth(10);
        this.activeDropdownContainer = this.add.container(0, 0).setDepth(1000);

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
          .on('pointerdown', () => this.scene.start('MainMenu'))
          .setDepth(2);
        this.mainContainer.add(backButton);
    }

    createQuickLaunchSection() {
        // Section title
        const sectionTitle = this.add.text(
            this.cameras.main.centerX,
            this.buttonY,
            'Quick Launch',
            { fontSize: '24px', fill: '#00ff00', fontFamily: 'Courier' }
        ).setOrigin(0.5);
        this.mainContainer.add(sectionTitle);
        this.buttonY += 50;

        this.createDropdown('Select Level...', [
            { key: 'GameScene1', title: 'Game Scene 1' },
            { key: 'CombinedGtuLevel', title: 'Combined GTU Level' },
            { key: 'TestingGroundScene', title: 'Testing Ground' },
            { key: 'WayneWorld', title: 'Wayne World' }
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

        // Documentation files from the docs directory
        const documentationFiles = [
            { path: 'animation-manager-documentation.html', title: 'Animation Manager' },
            { path: 'arcade-physics-documentation.html', title: 'Arcade Physics' },
            { path: 'base-manager-documentation.html', title: 'Base Manager' },
            { path: 'base-scene-manager-documentation.html', title: 'Base Scene Manager' },
            { path: 'boot-scene-documentation.html', title: 'Boot Scene' },
            { path: 'boundary-manager-documentation.html', title: 'Boundary Manager' },
            { path: 'collision-manager-documentation.html', title: 'Collision Manager' },
            { path: 'combined-level-documentation.html', title: 'Combined Level' },
            { path: 'dependency-injection-documentation.html', title: 'Dependency Injection' },
            { path: 'enemy-manager-documentation.html', title: 'Enemy Manager' },
            { path: 'event-manager-documentation.html', title: 'Event Manager' },
            { path: 'game-config-documentation.html', title: 'Game Configuration' },
            { path: 'game-dependencies-documentation.html', title: 'Game Dependencies' },
            { path: 'game-scene-documentation.html', title: 'Game Scene' },
            { path: 'ldtk-documentation.html', title: 'LDtk' },
            { path: 'ldtk-tile-manager-documentation.html', title: 'LDtk Tile Manager' },
            { path: 'level-loader-documentation.html', title: 'Level Loader' },
            { path: 'manager-factory-documentation.html', title: 'Manager Factory' },
            { path: 'object-pool-documentation.html', title: 'Object Pool' },
            { path: 'phaser-api-documentation.html', title: 'Phaser API' },
            { path: 'player-documentation.html', title: 'Player' },
            { path: 'preloader-documentation.html', title: 'Preloader' },
            { path: 'scene-initializer-documentation.html', title: 'Scene Initializer' },
            { path: 'service-container-documentation.html', title: 'Service Container' },
            { path: 'state-manager-documentation.html', title: 'State Manager' },
            { path: 'ui-manager-documentation.html', title: 'UI Manager' }
        ];

        // Create dropdown items with proper formatting
        const dropdownItems = documentationFiles.map(doc => ({
            key: doc.path.replace('.html', ''),
            title: doc.title,
            path: doc.path
        }));

        // Create the dropdown with the documentation items
        this.createDropdown('Select Documentation...', dropdownItems);
    }

    handleDocumentationSelect(item) {
        // Open documentation in a new window/tab
        if (item && item.path) {
            const docPath = `${window.location.origin}/docs/${item.path}`;
            window.open(docPath, '_blank');
        }
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

    closeDropdown() {
        if (this.currentOpenDropdown) {
            // Move elements back to regular container
            this.dropdownContainer.add([
                this.currentOpenDropdown.header,
                this.currentOpenDropdown.optionsContainer
            ]);
            if (this.currentOpenDropdown.scrollbar) {
                this.dropdownContainer.add(this.currentOpenDropdown.scrollbar);
            }
            
            this.currentOpenDropdown.isOpen = false;
            this.currentOpenDropdown.arrow.setText('▼');
            this.currentOpenDropdown.optionsContainer.setVisible(false);
            if (this.currentOpenDropdown.scrollbar) {
                this.currentOpenDropdown.scrollbar.setVisible(false);
            }
            this.currentOpenDropdown = null;
        }
    }

    setDropdownDepth(dropdownState, depth) {
        // Set depths for all dropdown components
        dropdownState.header.setDepth(depth);
        dropdownState.optionsContainer.setDepth(depth + 1);
        if (dropdownState.scrollbar) {
            dropdownState.scrollbar.setDepth(depth + 2);
        }
        
        // Set depth for all children in the options container
        dropdownState.optionsContainer.each(child => {
            child.setDepth(depth + 1);
        });
        
        // Set depth for all children in the header
        dropdownState.header.each(child => {
            child.setDepth(depth);
        });
    }

    createDropdown(placeholder, items) {
        const dropdownWidth = 300;
        const dropdownHeight = 40;
        const dropdownX = this.cameras.main.centerX - (dropdownWidth / 2);
        const currentY = this.buttonY;
        const maxDropdownHeight = 400; // Maximum height for the dropdown
        let dropdownState = {
            optionsContainer: null,
            header: null,
            arrow: null,
            scrollbar: null,
            isOpen: false,
            baseDepth: this.baseDropdownDepth // Store the base depth for this dropdown
        };

        // Create dropdown header with initial depth
        const header = this.add.container(0, currentY);
        dropdownState.header = header;
        
        const dropdownBg = this.add.rectangle(
            dropdownX,
            0,
            dropdownWidth,
            dropdownHeight,
            0x2c3e50
        ).setOrigin(0);

        const dropdownText = this.add.text(
            dropdownX + 10,
            10,
            placeholder,
            { 
                fontSize: '18px', 
                fill: '#00ff00',
                fontFamily: 'Courier' 
            }
        );

        const arrow = this.add.text(
            dropdownX + dropdownWidth - 30,
            10,
            '▼',
            { 
                fontSize: '18px', 
                fill: '#00ff00',
                fontFamily: 'Courier' 
            }
        );
        dropdownState.arrow = arrow;

        header.add([dropdownBg, dropdownText, arrow]);
        this.dropdownContainer.add(header);

        // Create scrollable container for options with proper depth
        const optionsContainer = this.add.container(dropdownX, currentY + dropdownHeight);
        optionsContainer.setDepth(dropdownState.baseDepth);
        dropdownState.optionsContainer = optionsContainer;
        this.dropdownContainer.add(optionsContainer);

        // Create options background with semi-transparent black
        const optionsBackground = this.add.rectangle(
            0,
            0,
            dropdownWidth,
            items.length * dropdownHeight,
            0x000000,
            0.9
        ).setOrigin(0);
        optionsContainer.add(optionsBackground);

        // Add scrollbar if needed
        const contentHeight = items.length * dropdownHeight;
        if (contentHeight > maxDropdownHeight) {
            const scrollbarWidth = 8;
            const scrollbarHeight = (maxDropdownHeight / contentHeight) * maxDropdownHeight;
            
            const scrollbar = this.add.rectangle(
                dropdownX + dropdownWidth - scrollbarWidth - 2,
                currentY + dropdownHeight,
                scrollbarWidth,
                scrollbarHeight,
                0x4a6fa5
            ).setOrigin(0)
            .setVisible(false)
            .setDepth(dropdownState.baseDepth + 3);
            
            dropdownState.scrollbar = scrollbar;

            // Make scrollbar interactive
            this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
                if (dropdownState.isOpen && pointer.y > currentY + dropdownHeight && pointer.y < currentY + dropdownHeight + maxDropdownHeight) {
                    const newY = Phaser.Math.Clamp(
                        optionsContainer.y + (deltaY * -0.5),
                        currentY + dropdownHeight - (contentHeight - maxDropdownHeight),
                        currentY + dropdownHeight
                    );
                    optionsContainer.y = newY;

                    // Update scrollbar position
                    const scrollProgress = (currentY + dropdownHeight - optionsContainer.y) / (contentHeight - maxDropdownHeight);
                    const scrollbarY = currentY + dropdownHeight + (scrollProgress * (maxDropdownHeight - scrollbarHeight));
                    scrollbar.y = scrollbarY;
                }
            });
        }

        // Add options
        items.forEach((item, index) => {
            const bg = this.add.rectangle(
                0,
                index * dropdownHeight,
                dropdownWidth,
                dropdownHeight,
                0x2c3e50
            ).setOrigin(0);

            const text = this.add.text(
                10,
                index * dropdownHeight + 10,
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
                    this.closeDropdown();
                });

            optionsContainer.add([bg, text]);
        });

        // Make dropdown header interactive
        dropdownBg.setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                if (dropdownState.isOpen) {
                    this.closeDropdown();
                } else {
                    if (this.currentOpenDropdown) {
                        // Move current dropdown back to regular container
                        this.dropdownContainer.add([
                            this.currentOpenDropdown.header,
                            this.currentOpenDropdown.optionsContainer
                        ]);
                        if (this.currentOpenDropdown.scrollbar) {
                            this.dropdownContainer.add(this.currentOpenDropdown.scrollbar);
                        }
                        this.closeDropdown();
                    }
                    
                    this.currentOpenDropdown = dropdownState;
                    dropdownState.isOpen = true;
                    arrow.setText('▲');
                    optionsContainer.setVisible(true);
                    if (dropdownState.scrollbar) {
                        dropdownState.scrollbar.setVisible(true);
                    }
                    
                    // Move active dropdown to top container
                    this.activeDropdownContainer.add([header, optionsContainer]);
                    if (dropdownState.scrollbar) {
                        this.activeDropdownContainer.add(dropdownState.scrollbar);
                    }
                }
            });

        // Initially hide options
        optionsContainer.setVisible(false);
        
        this.buttonY += dropdownHeight + 20;
        return dropdownState;
    }

    createMatrixBackground() {
        // Initialize arrays
        this.matrixChars = [];
        this.streams = [];
        
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
