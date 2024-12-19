import 'phaser';
import { MainMenu } from './scenes/MainMenu';
import { Preloader } from './scenes/Preloader';
import { GameScene1 } from './scenes/GameScene1';
import { GameScene2 } from './scenes/GameScene2';
import { GameScene3 } from './scenes/GameScene3';
import { GameScene4 } from './scenes/GameScene4';
import { GameScene5 } from './scenes/GameScene5';
import { G1S1 } from './scenes/G1S1';
import { MissionComplete } from './scenes/MissionComplete';
import { GameOver } from './scenes/GameOver';
import Settings from './scenes/Settings';

const config = {
    type: Phaser.AUTO,
    width: 320,
    height: 480,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    input: {
        mouse: {
            preventDefaultWheel: true
        }
    },
    scene: [
        Preloader,
        MainMenu,
        Settings,
        GameScene1,
        GameScene2,
        GameScene3,
        GameScene4,
        GameScene5,
        MissionComplete,
        G1S1,
        GameOver
    ]
};

// Create game instance
const game = new Phaser.Game(config);

// Handle window resize
window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
});

// Allow browser zoom controls
window.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
        e.stopPropagation();
        return true;
    }
}, true);

// Handle zoom changes
window.visualViewport.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
    game.scale.refresh();
});
