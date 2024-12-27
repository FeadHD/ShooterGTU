import { GameOver } from '../events/GameOver';
import { GameScene1 } from '../scenes/levels/GameScene1';
import { GameScene2 } from '../scenes/levels/GameScene2';
import { GameScene3 } from '../scenes/levels/GameScene3';
import { GameScene4 } from '../scenes/levels/GameScene4';
import { GameScene5 } from '../scenes/levels/GameScene5';
import { Leaderboard } from '../scenes/menus/Leaderboard';
import { MainMenu } from '../scenes/menus/MainMenu';
import { MissionComplete } from '../scenes/menus/MissionComplete';
import { Preloader } from '../scenes/elements/Preloader';
import { TitleScene } from '../scenes/elements/TitleScene';
import Settings from '../scenes/menus/Settings';
import { ControlsSettingsScene } from '../scenes/menus/ControlsSettingsScene';
import { PauseMenu } from '../scenes/elements/PauseMenu';

export const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.NONE,
        parent: 'game-container',
        width: 1920,
        height: 1080,
        autoRound: true,
        zoom: 1,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        fullscreenTarget: 'game-container',
        expandParent: true
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    input: {
        mouse: {
            preventDefaultWheel: true
        }
    },
    scene: [
        Preloader,
        TitleScene,
        MainMenu,
        GameScene1,
        GameScene2,
        GameScene3,
        GameScene4,
        GameScene5,
        Settings,
        Leaderboard,
        GameOver,
        MissionComplete,
        ControlsSettingsScene,
        PauseMenu
    ]
};
