import { TextStyleManager } from '../../modules/managers/TextStyleManager';

export class PauseMenu extends Phaser.Scene {
    constructor() {
        super({ key: 'PauseMenu' });
    }

    preload() {
        this.load.image('pauseBackground', 'assets/settings/settings.png');
        this.load.font('Gameplay', 'assets/fonts/retronoid/Gameplay.ttf');
        this.load.audio('confirmSound', 'assets/sounds/confirmation.mp3');
    }

    create() {
        // Get all active scenes and find the game scene that launched the pause menu
        const activeScenes = this.scene.manager.getScenes(true);
        this.parentSceneKey = activeScenes.find(scene => 
            scene.scene.key !== 'PauseMenu' && 
            scene.scene.isActive()
        )?.scene.key || 'MainMenu';
        
        const { width, height } = this.scale;

        // Add semi-transparent background
        const bg = this.add.rectangle(0, 0, width, height, 0x000000, 0.7);
        bg.setOrigin(0);

        // Add PAUSE title
        this.add.text(width / 2, height * 0.2, 'PAUSE', {
            fontFamily: 'Gameplay',
            fontSize: '64px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            fontWeight: 'bold'
        }).setOrigin(0.5);

        // Button configuration
        const buttonSpacing = 70;
        const buttons = [
            { text: 'RESUME', yOffset: -buttonSpacing * 2, callback: () => this.resumeGame() },
            { text: 'SETTINGS', yOffset: -buttonSpacing, callback: () => this.openSettings() },
            { text: 'RESTART', yOffset: 0, callback: () => this.restartGame() },
            { text: 'MAIN MENU', yOffset: buttonSpacing, callback: () => this.goToMainMenu() },
            { text: 'QUIT GAME', yOffset: buttonSpacing * 2, callback: () => this.quitGame() }
        ];

        // Create buttons
        buttons.forEach(({ text, yOffset, callback }) => {
            this.createMenuButton(text, yOffset, callback);
        });

        // Add ESC key handler to resume game
        this.input.keyboard.on('keydown-ESC', () => this.resumeGame());

        // Make sure the game scene is paused
        const gameScene = this.scene.get(this.parentSceneKey);
        if (gameScene) {
            gameScene.scene.pause();
            if (gameScene.physics?.world) {
                try {
                    gameScene.physics.world.pause();
                } catch (error) {
                    console.warn('Could not pause physics:', error);
                }
            }
        }
    }

    createMenuButton(text, yOffset, callback) {
        const { width, height } = this.scale;
        const buttonWidth = 300;
        const buttonHeight = 60;

        const button = this.add.rectangle(
            width / 2,
            height / 2 + yOffset,
            buttonWidth,
            buttonHeight,
            0x2a2a2a
        );

        button.setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
                button.setFillStyle(0x3a3a3a);
                buttonText.setScale(1.1);
            })
            .on('pointerout', () => {
                button.setFillStyle(0x2a2a2a);
                buttonText.setScale(1);
            })
            .on('pointerdown', () => {
                const sfxVolume = this.registry.get('sfxVolume') || 1;
                const confirmSound = this.sound.add('confirmSound');
                confirmSound.setVolume(sfxVolume);
                confirmSound.play();
                confirmSound.once('complete', () => {
                    confirmSound.destroy();
                });
                callback();
            });

        const buttonText = TextStyleManager.createText(
            this,
            width / 2,
            height / 2 + yOffset,
            text,
            'pauseButton'
        );

        return { button, buttonText };
    }

    resumeGame() {
        const gameScene = this.scene.get(this.parentSceneKey);
        if (gameScene) {
            // Check if the scene has a resumeGame method
            if (typeof gameScene.resumeGame === 'function') {
                gameScene.resumeGame();
            } else {
                // Resume the scene manually
                gameScene.scene.resume();
                if (gameScene.physics?.world) {
                    try {
                        gameScene.physics.world.resume();
                    } catch (error) {
                        console.warn('Could not resume physics:', error);
                    }
                }
            }
        }
        this.scene.stop();
    }

    restartGame() {
        // Stop all scenes except MainMenu to prevent scene conflicts
        const scenesToStop = this.scene.manager.getScenes(true)
            .filter(scene => scene.scene.key !== 'MainMenu');
        
        scenesToStop.forEach(scene => {
            this.scene.stop(scene.scene.key);
        });

        // Start the parent scene fresh
        this.scene.start(this.parentSceneKey);
    }

    goToMainMenu() {
        const gameScene = this.scene.get(this.parentSceneKey);
        
        // First try to use the scene's own main menu transition if available
        if (gameScene && typeof gameScene.returnToMainMenu === 'function') {
            gameScene.returnToMainMenu();
            this.scene.stop(); // Stop the pause menu
            return;
        }

        // Fallback behavior if no specific transition exists
        const scenesToStop = this.scene.manager.getScenes(true);
        scenesToStop.forEach(scene => {
            // Stop all game UI elements if they exist
            if (scene.gameUI) {
                scene.gameUI.stopTimer();
            }
            // Clean up any background music
            if (scene.bgMusic) {
                scene.bgMusic.stop();
                scene.bgMusic.destroy();
            }
            this.scene.stop(scene.scene.key);
        });

        // Start MainMenu scene
        this.scene.start('MainMenu');
    }

    openSettings() {
        // Launch settings scene but keep game paused
        const gameScene = this.scene.get(this.parentSceneKey);
        if (gameScene) {
            // Keep game scene paused
            gameScene.scene.pause();
            if (gameScene.physics?.world) {
                try {
                    gameScene.physics.world.pause();
                } catch (error) {
                    console.warn('Could not pause physics:', error);
                }
            }
        }
        
        // Stop this scene and start settings
        this.scene.sleep();
        this.scene.launch('Settings', { fromPause: true, parentScene: this.parentSceneKey });
        this.scene.moveAbove('Settings', 'PauseMenu');
    }

    quitGame() {
        // You might want to show a confirmation dialog here
        const confirmQuit = window.confirm('Are you sure you want to quit the game?');
        if (confirmQuit) {
            window.close();
        }
    }
}
