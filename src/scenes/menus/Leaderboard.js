import { Scene } from 'phaser';

export class Leaderboard extends Scene {
    constructor() {
        super('Leaderboard');
        this.scores = [];
    }

    create() {
        const canvasWidth = this.cameras.main.width;
        const canvasHeight = this.cameras.main.height;

        // Set background
        this.cameras.main.setBackgroundColor('#000000');
        const bg = this.add.image(0, 0, 'mainbg');
        bg.setOrigin(0, 0);
        bg.setDisplaySize(canvasWidth, canvasHeight);

        // Add title
        const title = this.add.text(canvasWidth / 2, canvasHeight * 0.1, 'LEADERBOARD', {
            fontFamily: 'Retronoid, Arial',
            fontSize: '72px',
            color: '#00ffff',
            stroke: '#ffffff',
            strokeThickness: 4,
            shadow: {
                offsetX: 3,
                offsetY: 3,
                color: '#ff00ff',
                blur: 5,
                fill: true
            }
        }).setOrigin(0.5);

        // Add headers
        const headerStyle = {
            fontFamily: 'Retronoid, Arial',
            fontSize: '24px',
            color: '#ff00ff',
            stroke: '#ffffff',
            strokeThickness: 1
        };

        // Column headers
        this.add.text(canvasWidth * 0.2, canvasHeight * 0.2, 'RANK', headerStyle).setOrigin(0.5);
        this.add.text(canvasWidth * 0.5, canvasHeight * 0.2, 'WALLET ADDRESS', headerStyle).setOrigin(0.5);
        this.add.text(canvasWidth * 0.8, canvasHeight * 0.2, 'SCORE', headerStyle).setOrigin(0.5);

        // Load and display scores
        this.loadScores();

        // Back button
        const backButton = this.add.text(canvasWidth / 2, canvasHeight * 0.9, 'BACK TO MENU', {
            fontFamily: 'Retronoid, Arial',
            fontSize: '48px',
            color: '#00ffff',
            stroke: '#ffffff',
            strokeThickness: 2,
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#ff00ff',
                blur: 5,
                fill: true
            }
        }).setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

        backButton.on('pointerover', () => {
            backButton.setScale(1.1);
            backButton.setColor('#ff00ff');
        });

        backButton.on('pointerout', () => {
            backButton.setScale(1);
            backButton.setColor('#00ffff');
        });

        backButton.on('pointerdown', () => {
            this.scene.start('MainMenu');
        });
    }

    loadScores() {
        // Try to get scores from localStorage
        const savedScores = localStorage.getItem('topScores');
        this.scores = savedScores ? JSON.parse(savedScores) : [];

        const startY = this.cameras.main.height * 0.3;
        const spacing = 45;
        const maxScores = 10;

        // Get current wallet address
        const currentWallet = this.registry.get('walletAddress');

        const textStyle = {
            fontFamily: 'Retronoid, Arial',
            fontSize: '28px',
            color: '#00ffff',
            align: 'center'
        };

        // Fill empty slots if needed
        while (this.scores.length < maxScores) {
            this.scores.push({
                playerName: 'Guest',
                score: '---'
            });
        }

        // Display scores
        this.scores.slice(0, maxScores).forEach((score, index) => {
            const y = startY + (spacing * index);
            const rank = `#${index + 1}`;
            
            // Rank
            this.add.text(this.cameras.main.width * 0.2, y, rank, textStyle)
                .setOrigin(0.5);

            // Wallet Address or Guest
            const displayName = score.playerName === 'Guest' ? 'Guest' : score.playerName;
            
            // Use gold color for current user's wallet
            const walletStyle = {
                ...textStyle,
                color: currentWallet && score.playerName === currentWallet ? '#ffd700' : '#00ffff'
            };
            
            this.add.text(this.cameras.main.width * 0.5, y, displayName, walletStyle)
                .setOrigin(0.5);

            // Score
            this.add.text(this.cameras.main.width * 0.8, y, score.score.toString(), textStyle)
                .setOrigin(0.5);
        });
    }
}
