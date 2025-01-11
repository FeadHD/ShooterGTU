import { Scene } from 'phaser';
import { createRetroButton } from '../ui-helpers';

export class DevHub extends Scene {
    constructor() {
        super({ key: 'DevHub' });
        this.buttonY = 100;
        this.spacing = 40;
    }

    create() {
        this.cameras.main.setBackgroundColor('#2c3e50');
        
        // Create containers for different sections with proper depth
        this.mainContainer = this.add.container(0, 0);
        this.dropdownContainer = this.add.container(0, 0).setDepth(100);

        // Title
        const title = this.add.text(
            this.cameras.main.centerX,
            20,
            'Developer Hub',
            { fontSize: '32px', fill: '#fff', fontFamily: 'Courier New' }
        ).setOrigin(0.5);
        this.mainContainer.add(title);

        this.buttonY = 50;

        this.createQuickLaunchSection();
        this.createDocumentationSection();

        // Back button
        const backButton = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.height - 50,
            'Back to Main Menu',
            { fontSize: '24px', fill: '#fff', fontFamily: 'Courier New' }
        ).setOrigin(0.5)
          .setInteractive({ useHandCursor: true })
          .on('pointerover', () => backButton.setStyle({ fill: '#0ff' }))
          .on('pointerout', () => backButton.setStyle({ fill: '#fff' }))
          .on('pointerdown', () => this.scene.start('MainMenu'));
        this.mainContainer.add(backButton);
    }

    createQuickLaunchSection() {
        // Section title
        const quickLaunchTitle = this.add.text(20, this.buttonY, 'Quick Launch:', {
            fontSize: '24px',
            fill: '#fff'
        });
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
        const docTitle = this.add.text(20, this.buttonY, 'Documentation:', {
            fontSize: '24px',
            fill: '#fff'
        });
        this.mainContainer.add(docTitle);
        this.buttonY += 40;

        this.createDropdown('Select Documentation...', [
            { key: 'animation-manager-documentation', title: 'Animation Manager', path: 'animation-manager-documentation.html' },
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

    createDropdown(placeholder, items) {
        const dropdownWidth = 300;
        const dropdownHeight = 40;
        const dropdownX = this.cameras.main.centerX - (dropdownWidth / 2);
        const currentY = this.buttonY;

        // Create dropdown header
        const header = this.add.container(0, currentY);
        
        const dropdownBg = this.add.rectangle(
            dropdownX,
            0,
            dropdownWidth,
            dropdownHeight,
            0x4a6fa5
        ).setOrigin(0);

        const dropdownText = this.add.text(
            dropdownX + 10,
            10,
            placeholder,
            { fontSize: '18px', fill: '#fff' }
        );

        const arrow = this.add.text(
            dropdownX + dropdownWidth - 30,
            10,
            '▼',
            { fontSize: '18px', fill: '#fff' }
        );

        header.add([dropdownBg, dropdownText, arrow]);
        this.dropdownContainer.add(header);

        // Create options container
        const optionsContainer = this.add.container(0, currentY + dropdownHeight);
        this.dropdownContainer.add(optionsContainer);

        // Calculate visible options
        const maxVisibleOptions = Math.floor((this.cameras.main.height - currentY - dropdownHeight - 100) / 40);
        const itemHeight = 40;

        // Create options background
        const optionsBackground = this.add.rectangle(
            dropdownX,
            0,
            dropdownWidth,
            Math.min(items.length, maxVisibleOptions) * itemHeight,
            0x2c3e50
        ).setOrigin(0);
        optionsContainer.add(optionsBackground);

        // Add options
        items.forEach((item, index) => {
            const bg = this.add.rectangle(
                dropdownX,
                index * itemHeight,
                dropdownWidth,
                itemHeight,
                0x2c3e50
            ).setOrigin(0);

            const text = this.add.text(
                dropdownX + 10,
                index * itemHeight + 10,
                item.title,
                { fontSize: '18px', fill: '#fff' }
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
                    isOpen = false;
                    optionsContainer.setVisible(false);
                    arrow.setText('▼');
                });

            optionsContainer.add([bg, text]);
        });

        // Handle dropdown toggle
        let isOpen = false;
        let scrollOffset = 0;

        dropdownBg.setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                isOpen = !isOpen;
                optionsContainer.setVisible(isOpen);
                arrow.setText(isOpen ? '▲' : '▼');
                scrollOffset = 0;
                optionsContainer.y = currentY + dropdownHeight;
            });

        // Add scroll handling
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
            if (isOpen && pointer.y > currentY + dropdownHeight) {
                scrollOffset = Phaser.Math.Clamp(
                    scrollOffset + deltaY,
                    -Math.max(0, (items.length - maxVisibleOptions) * itemHeight),
                    0
                );
                optionsContainer.y = currentY + dropdownHeight + scrollOffset;
            }
        });

        optionsContainer.setVisible(false);
        this.buttonY += dropdownHeight + 40;
    }
}
