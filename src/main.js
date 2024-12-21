import 'phaser';
import { config } from './config/config';

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
