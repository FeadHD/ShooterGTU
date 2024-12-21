import { Scene } from 'phaser';

export class LeaderboardScene extends Scene {
    constructor() {
        super('LeaderboardScene');
        this.loadLeaderboard();
    }

    loadLeaderboard() {
        // Try to load existing leaderboard from localStorage
        const savedLeaderboard = localStorage.getItem('gtuLeaderboard');
        if (savedLeaderboard) {
            this.leaderboard = JSON.parse(savedLeaderboard);
        } else {
            // Initialize with empty scores if no saved data
            this.leaderboard = [
                { name: '0x0000...0000', score: 0 },
                { name: '0x0000...0000', score: 0 },
                { name: '0x0000...0000', score: 0 },
                { name: '0x0000...0000', score: 0 },
                { name: '0x0000...0000', score: 0 }
            ];
            this.saveLeaderboard();
        }
    }

    saveLeaderboard() {
        localStorage.setItem('gtuLeaderboard', JSON.stringify(this.leaderboard));
    }

    addScore(score) {
        const walletAddress = this.registry.get('walletAddress') || '0x0000...0000';
        const displayAddress = walletAddress.length > 10 ? 
            walletAddress.substring(0, 6) + '...' + walletAddress.substring(38) : 
            walletAddress;

        // Add new score
        this.leaderboard.push({ name: displayAddress, score: score });
        
        // Sort by score (highest first)
        this.leaderboard.sort((a, b) => b.score - a.score);
        
        // Keep only top 5
        this.leaderboard = this.leaderboard.slice(0, 5);
        
        // Save to localStorage
        this.saveLeaderboard();
    }

    create() {
        const { width, height } = this.cameras.main;
        
        // Set background
        this.cameras.main.setBackgroundColor('#000000');

        // Add title
        this.add.text(width/2, height * 0.1, 'HIGH SCORES', {
            fontFamily: 'Retronoid, Arial',
            fontSize: '64px',
            color: '#00ffff',
            align: 'center',
            stroke: '#ffffff',
            strokeThickness: 4,
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#ff00ff',
                blur: 5,
                fill: true
            }
        }).setOrigin(0.5);

        // Display scores
        this.leaderboard.forEach((entry, index) => {
            const yPos = height * (0.3 + index * 0.1);
            
            // Rank number with neon effect
            this.add.text(width * 0.3, yPos, `${index + 1}.`, {
                fontFamily: 'Retronoid, Arial',
                fontSize: '48px',
                color: '#ff00ff',
                align: 'right'
            }).setOrigin(1, 0.5);

            // Player name
            this.add.text(width * 0.35, yPos, entry.name, {
                fontFamily: 'Retronoid, Arial',
                fontSize: '48px',
                color: '#00ffff',
                align: 'left'
            }).setOrigin(0, 0.5);

            // Score with neon glow
            this.add.text(width * 0.7, yPos, entry.score.toString(), {
                fontFamily: 'Retronoid, Arial',
                fontSize: '48px',
                color: '#ffff00',
                align: 'right',
                stroke: '#ffffff',
                strokeThickness: 2
            }).setOrigin(1, 0.5);
        });

        // Back button
        const backButton = this.add.text(width/2, height * 0.85, 'BACK TO MENU', {
            fontFamily: 'Retronoid, Arial',
            fontSize: '48px',
            color: '#00ffff',
            stroke: '#ffffff',
            strokeThickness: 4,
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#ff00ff',
                blur: 5,
                fill: true
            }
        }).setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

        // Add hover effects
        backButton.on('pointerover', () => {
            backButton.setScale(1.2);
            backButton.setColor('#ff00ff');
        });

        backButton.on('pointerout', () => {
            backButton.setScale(1);
            backButton.setColor('#00ffff');
        });

        // Add click handler
        backButton.on('pointerdown', () => {
            this.scene.start('MainMenu');
        });
    }

    // Method to update leaderboard with new high score
    updateLeaderboard(playerName, score) {
        // Only update if the score is higher than the lowest score
        const lowestScore = this.leaderboard[this.leaderboard.length - 1].score;
        if (score > lowestScore) {
            // Add new score
            this.leaderboard.push({ name: playerName, score: score });
            // Sort by score (highest first)
            this.leaderboard.sort((a, b) => b.score - a.score);
            // Keep only top 5
            this.leaderboard = this.leaderboard.slice(0, 5);
            // Save to localStorage
            this.saveLeaderboard();
        }
    }
}
