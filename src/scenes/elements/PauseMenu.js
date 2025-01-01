import { TextStyleManager } from '../../modules/managers/TextStyleManager';

export class PauseMenu extends Phaser.Scene {
    constructor() {
        super({ key: 'PauseMenu' });
    }

    create() {
        // Store the key of the scene that launched the pause menu
        this.parentSceneKey = this.scene.get('Matrix640x360') ? 'Matrix640x360' : 'GameScene1';
        
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
            gameScene.resumeGame();
        }
        this.scene.stop();
    }

    restartGame() {
        this.scene.stop();
        this.scene.stop(this.parentSceneKey);
        this.scene.start(this.parentSceneKey);
    }

    goToMainMenu() {
        this.scene.stop();
        this.scene.stop(this.parentSceneKey);
        this.scene.start('MainMenu');
    }

    quitGame() {
        // You might want to show a confirmation dialog here
        window.close();
    }
}
