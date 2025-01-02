import { TextStyleManager } from '../../modules/managers/TextStyleManager';

export class PauseMenu extends Phaser.Scene {
    constructor() {
        super({ key: 'PauseMenu' });
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

        // Button configuration
        const buttonSpacing = 70;
        const buttons = [
            { text: 'RESUME', yOffset: -buttonSpacing * 1.5, callback: () => this.resumeGame() },
            { text: 'RESTART', yOffset: -buttonSpacing * 0.5, callback: () => this.restartGame() },
            { text: 'MAIN MENU', yOffset: buttonSpacing * 0.5, callback: () => this.goToMainMenu() },
            { text: 'QUIT GAME', yOffset: buttonSpacing * 1.5, callback: () => this.quitGame() }
        ];

        // Create buttons
        buttons.forEach(({ text, yOffset, callback }) => {
            this.createMenuButton(text, yOffset, callback);
        });

        // Add ESC key handler to resume game
        this.input.keyboard.on('keydown-ESC', () => this.resumeGame());
    }

    createMenuButton(text, yOffset, callback) {
        const x = this.scale.width / 2;
        const y = this.scale.height / 2 + yOffset;
        const width = 200;
        const height = 50;

        const button = this.add.rectangle(x, y, width, height, 0x4a4a4a)
            .setInteractive()
            .on('pointerover', () => {
                button.setFillStyle(0x666666);
                buttonText.setScale(1.1);
            })
            .on('pointerout', () => {
                button.setFillStyle(0x4a4a4a);
                buttonText.setScale(1);
            })
            .on('pointerdown', callback);

        const buttonText = TextStyleManager.createText(
            this,
            x,
            y,
            text,
            'pauseButton'
        );

        return { button, text: buttonText };
    }

    resumeGame() {
        const gameScene = this.scene.get(this.parentSceneKey);
        if (gameScene) {
            // Check if the scene has a resumeGame method
            if (typeof gameScene.resumeGame === 'function') {
                gameScene.resumeGame();
            } else {
                // Fallback resume behavior
                gameScene.scene.resume();
                if (gameScene.physics) {
                    gameScene.physics.resume();
                }
                if (gameScene.player?.controller) {
                    gameScene.player.controller.enabled = true;
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

    quitGame() {
        // You might want to show a confirmation dialog here
        const confirmQuit = window.confirm('Are you sure you want to quit the game?');
        if (confirmQuit) {
            window.close();
        }
    }
}
