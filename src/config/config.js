// @ai-do-not-touch

import { GameOver } from '../events/GameOver';
import { GameScene1 } from '../scenes/levels/GameScene1';
import { Leaderboard } from '../scenes/menus/Leaderboard';
import { MainMenu } from '../scenes/menus/MainMenu';
import { MissionComplete } from '../scenes/menus/MissionComplete';
import { Preloader } from '../scenes/elements/Preloader';
import { TitleScene } from '../scenes/elements/TitleScene';
import { IntroScene } from '../scenes/elements/IntroScene';
import Settings from '../scenes/menus/Settings';
import ControlsSettings from '../scenes/menus/ControlsSettings';
import SoundSettings from '../scenes/menus/SoundSettings';
import { PauseMenu } from '../scenes/elements/PauseMenu';
import { DevHub } from '../scenes/menus/DevHub/DevHub';
import { Credits } from '../scenes/menus/Credits';
import { CombinedGtuLevel } from '../scenes/levels/CombinedGtuLevel';
import { SoundTester } from '../scenes/menus/DevHub/SoundTester';
import { TestingGroundScene } from '../scenes/levels/TestingGroundScene';
import { WayneWorld } from '../scenes/levels/WayneWorld';

export const config = {
    type: Phaser.AUTO,
    pixelArt: true,
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
    dom: {
        createContainer: true
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { y: 400 },  
            tileBias: 32,
        }
    },
    input: {
        mouse: {
            preventDefaultWheel: true,
            preventDefaultContextMenu: true
        }
    },
    scene: [
        Preloader,
        TitleScene,
        IntroScene,
        MainMenu,
        Settings,
        ControlsSettings,
        SoundSettings,
        GameScene1,
        Leaderboard,
        MissionComplete,
        GameOver,
        PauseMenu,
        DevHub,
        Credits,
        CombinedGtuLevel,
        SoundTester,
        TestingGroundScene,
        WayneWorld
    ]
};
