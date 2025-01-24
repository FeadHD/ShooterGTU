/**
 * DevHub.js
 * A developer tools scene providing quick access to game levels, documentation, and sound testing.
 * Features a Matrix-style background and dropdown menus for navigation.
 */

import { Scene } from 'phaser';
import { createRetroButton } from '../ui-helpers';

export class DevHub extends Scene {
    constructor() {
        super({ key: 'DevHub' });
        this.buttonY = 0;                     // Tracks vertical position for UI elements
        this.currentOpenDropdown = null;      // Reference to currently open dropdown
        this.baseDropdownDepth = 10;          // Base z-index for dropdowns
        this.currentMaxDepth = this.baseDropdownDepth;
    }

    /**
     * SCENE INITIALIZATION
     * Sets up the developer hub interface with Matrix background and UI sections
     */
    create() {
        this.cameras.main.setBackgroundColor('#2c3e50');
        
        // Create animated Matrix-style background
        this.createMatrixBackground();
        
        // Add semi-transparent overlay for better readability
        this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.7)
            .setOrigin(0)
            .setDepth(1);

        // Setup layered containers for UI elements
        this.mainContainer = this.add.container(0, 0).setDepth(2);          // Base UI elements
        this.dropdownContainer = this.add.container(0, 0).setDepth(10);     // Inactive dropdowns
        this.activeDropdownContainer = this.add.container(0, 0).setDepth(1000); // Active dropdown

        // Hub title
        const title = this.add.text(
            this.cameras.main.centerX,
            80,
            'Developer Hub',
            { fontSize: '32px', fill: '#00ff00', fontFamily: 'Courier' }
        ).setOrigin(0.5).setDepth(2);
        this.mainContainer.add(title);

        this.buttonY = 150;

        // Create main sections with spacing
        this.createQuickLaunchSection();
        this.buttonY += 20;
        this.createDocumentationSection();
        this.buttonY += 20;
        this.createSoundTestingSection();

        // Add return to main menu button
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

    /**
     * QUICK LAUNCH SECTION
     * Creates dropdown for quick access to different game levels
     */
    createQuickLaunchSection() {
        // Section header
        const sectionTitle = this.add.text(
            this.cameras.main.centerX,
            this.buttonY,
            'Quick Launch',
            { fontSize: '24px', fill: '#00ff00', fontFamily: 'Courier' }
        ).setOrigin(0.5);
        this.mainContainer.add(sectionTitle);
        this.buttonY += 50;

        // Level selection dropdown
        this.createDropdown('Select Level...', [
            { key: 'WayneWorld', title: 'Wayne World' }
        ]);
    }

    /**
     * DOCUMENTATION SECTION
     * Creates dropdown menu for accessing game documentation
     */
    createDocumentationSection() {
        // Section header
        const docTitle = this.add.text(
            this.cameras.main.centerX,
            this.buttonY,
            'Documentation:',
            { fontSize: '24px', fill: '#00ff00', fontFamily: 'Courier' }
        ).setOrigin(0.5).setDepth(2);
        this.mainContainer.add(docTitle);
        this.buttonY += 40;

        // List of available documentation files
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

        // Create documentation dropdown
        const dropdownItems = documentationFiles.map(doc => ({
            key: doc.path.replace('.html', ''),
            title: doc.title,
            path: doc.path
        }));

        this.createDropdown('Select Documentation...', dropdownItems);
    }

    /**
     * Opens documentation in new window/tab
     */
    handleDocumentationSelect(item) {
        if (item && item.path) {
            const docPath = `${window.location.origin}/docs/${item.path}`;
            window.open(docPath, '_blank');
        }
    }

    /**
     * SOUND TESTING SECTION
     * Creates button to access sound testing interface
     */
    createSoundTestingSection() {
        // Section header
        const sectionTitle = this.add.text(
            this.cameras.main.centerX,
            this.buttonY,
            'Sound Testing',
            { fontSize: '24px', fill: '#00ff00', fontFamily: 'Courier' }
        ).setOrigin(0.5);
        this.mainContainer.add(sectionTitle);
        this.buttonY += 50;

        // Sound tester launch button
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

    /**
     * DROPDOWN MANAGEMENT
     * Handles closing of currently open dropdown menu
     */
    closeDropdown() {
        if (this.currentOpenDropdown) {
            // Return elements to default container
            this.dropdownContainer.add([
                this.currentOpenDropdown.header,
                this.currentOpenDropdown.optionsContainer
            ]);
            if (this.currentOpenDropdown.scrollbar) {
                this.dropdownContainer.add(this.currentOpenDropdown.scrollbar);
            }
            
            // Reset dropdown state
            this.currentOpenDropdown.isOpen = false;
            this.currentOpenDropdown.arrow.setText('▼');
            this.currentOpenDropdown.optionsContainer.setVisible(false);
            if (this.currentOpenDropdown.scrollbar) {
                this.currentOpenDropdown.scrollbar.setVisible(false);
            }
            this.currentOpenDropdown = null;
        }
    }

    /**
     * Updates z-index for dropdown components
     */
    setDropdownDepth(dropdownState, depth) {
        // Set depths for container elements
        dropdownState.header.setDepth(depth);
        dropdownState.optionsContainer.setDepth(depth + 1);
        if (dropdownState.scrollbar) {
            dropdownState.scrollbar.setDepth(depth + 2);
        }
        
        // Update depths for option items
        dropdownState.optionsContainer.each(child => {
            child.setDepth(depth + 1);
        });
        
        // Update depths for header items
        dropdownState.header.each(child => {
            child.setDepth(depth);
        });
    }

    /**
     * DROPDOWN CREATION
     * Creates an interactive dropdown menu with scrolling support
     */
    createDropdown(placeholder, items) {
        const dropdownWidth = 300;
        const dropdownHeight = 40;
        const dropdownX = this.cameras.main.centerX - (dropdownWidth / 2);
        const currentY = this.buttonY;
        const maxDropdownHeight = 400;
        
        // Initialize dropdown state
        let dropdownState = {
            optionsContainer: null,
            header: null,
            arrow: null,
            scrollbar: null,
            isOpen: false,
            baseDepth: this.baseDropdownDepth
        };

        // Create dropdown header
        const header = this.add.container(0, currentY);
        dropdownState.header = header;
        
        // Create visual elements
        const dropdownBg = this.add.rectangle(dropdownX, 0, dropdownWidth, dropdownHeight, 0x2c3e50)
            .setOrigin(0);

        const dropdownText = this.add.text(
            dropdownX + 10,
            10,
            placeholder,
            { fontSize: '18px', fill: '#00ff00', fontFamily: 'Courier' }
        );

        const arrow = this.add.text(
            dropdownX + dropdownWidth - 30,
            10,
            '▼',
            { fontSize: '18px', fill: '#00ff00', fontFamily: 'Courier' }
        );
        dropdownState.arrow = arrow;

        // Add elements to containers
        header.add([dropdownBg, dropdownText, arrow]);
        this.dropdownContainer.add(header);

        // Create options container
        const optionsContainer = this.add.container(dropdownX, currentY + dropdownHeight);
        optionsContainer.setDepth(dropdownState.baseDepth);
        dropdownState.optionsContainer = optionsContainer;
        this.dropdownContainer.add(optionsContainer);

        // Add semi-transparent background
        const optionsBackground = this.add.rectangle(
            0,
            0,
            dropdownWidth,
            items.length * dropdownHeight,
            0x000000,
            0.9
        ).setOrigin(0);
        optionsContainer.add(optionsBackground);

        // Add scrollbar if content exceeds max height
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

        // Add dropdown options
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

    /**
     * MATRIX BACKGROUND
     * Creates animated Matrix-style background effect
     */
    createMatrixBackground() {
        // Initialize character arrays
        this.matrixChars = [];
        this.streams = [];
        
        const matrixGreen = '#00ff00';
        const streamCount = Math.floor(this.cameras.main.width / 20);
        
        // Create vertical character streams
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
            
            // Add characters to stream
            const streamLength = Phaser.Math.Between(5, 15);
            for (let j = 0; j < streamLength; j++) {
                const char = this.add.text(x, -20 - (j * 20), this.getRandomMatrixChar(), {
                    fontSize: '20px',
                    fontFamily: 'Courier',
                    color: matrixGreen,
                    alpha: j === 0 ? 1 : 0.5
                }).setDepth(0);
                stream.chars.push(char);
                this.matrixChars.push(char);
            }
            
            this.streams.push(stream);
        }
        
        // Animate streams
        this.time.addEvent({
            delay: 50,
            callback: this.updateMatrixStreams,
            callbackScope: this,
            loop: true
        });
    }

    /**
     * Updates Matrix stream animations
     */
    updateMatrixStreams() {
        if (!this.scene.isActive()) return;
        
        this.streams.forEach(stream => {
            if (stream.delay > 0) {
                stream.delay -= 50;
                return;
            }

            stream.update += 50;
            if (stream.update >= 100) {
                stream.update = 0;
                
                stream.chars.forEach(char => {
                    if (char && char.active) {
                        char.y += stream.speed;
                        
                        // Randomly change characters
                        if (Phaser.Math.Between(0, 20) === 0) {
                            char.setText(this.getRandomMatrixChar());
                        }
                        
                        // Reset position when off screen
                        if (char.y > this.cameras.main.height) {
                            char.y = -20;
                        }
                    }
                });
            }
        });
    }

    /**
     * Returns a random Matrix character
     */
    getRandomMatrixChar() {
        const chars = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ1234567890@#$%&*';
        return chars[Math.floor(Math.random() * chars.length)];
    }
}
