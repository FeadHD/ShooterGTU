export class PauseMenu extends Phaser.Scene {
    constructor() {
        super({ key: 'PauseMenu' });
    }

    create() {
        const { width, height } = this.scale;

        // Add semi-transparent background
        const bg = this.add.rectangle(0, 0, width, height, 0x000000, 0.7);
        bg.setOrigin(0);

        // Create container for buttons
        const container = this.add.container(width / 2, height / 2 - 100);

        // Button style configuration
        const buttonWidth = 200;
        const buttonHeight = 50;
        const buttonSpacing = 70;
        const buttonStyle = {
            fontSize: '24px',
            fontFamily: 'ArcadeClassic',
            fill: '#ffffff'
        };

        // Create buttons
        this.createMenuButton('RESUME', -buttonSpacing * 1.5, () => this.resumeGame(), buttonWidth, buttonHeight, buttonStyle);
        this.createMenuButton('RESTART', -buttonSpacing * 0.5, () => this.restartGame(), buttonWidth, buttonHeight, buttonStyle);
        this.createMenuButton('MAIN MENU', buttonSpacing * 0.5, () => this.goToMainMenu(), buttonWidth, buttonHeight, buttonStyle);
        this.createMenuButton('QUIT GAME', buttonSpacing * 1.5, () => this.quitGame(), buttonWidth, buttonHeight, buttonStyle);

        // Add ESC key handler to resume game
        this.input.keyboard.on('keydown-ESC', () => this.resumeGame());
    }

    createMenuButton(text, yOffset, callback, width, height, textStyle) {
        const button = this.add.rectangle(this.scale.width / 2, this.scale.height / 2 + yOffset, width, height, 0x4a4a4a)
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

        const buttonText = this.add.text(button.x, button.y, text, textStyle)
            .setOrigin(0.5)
            .setScale(1);

        return { button, text: buttonText };
    }

    resumeGame() {
        const gameScene = this.scene.get('GameScene1');
        if (gameScene) {
            gameScene.resumeGame();
        }
        this.scene.stop();
    }

    restartGame() {
        this.scene.stop();
        this.scene.stop('GameScene1');
        this.scene.start('GameScene1');
    }

    goToMainMenu() {
        this.scene.stop();
        this.scene.stop('GameScene1');
        this.scene.start('MainMenu');
    }

    quitGame() {
        // You might want to show a confirmation dialog here
        window.close();
    }
}
