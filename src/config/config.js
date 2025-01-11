// @ai-do-not-touch

import { GameOver } from '../events/GameOver';
import { GameScene1 } from '../scenes/levels/GameScene1';
import { GameScene2 } from '../scenes/levels/GameScene2';
import { GameScene3 } from '../scenes/levels/GameScene3';
import { GameScene4 } from '../scenes/levels/GameScene4';
import { GameScene5 } from '../scenes/levels/GameScene5';
import { Matrix640x360 } from '../scenes/levels/Matrix640x360';
import { BlueTest } from '../scenes/levels/BlueTest';
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
import { LegacyGameScene1 } from '../scenes/levels/LegacyGameScene1';
import { GtuTestLevel0 } from '../scenes/levels/GtuTestLevel0';
import { GtuTestLevel1 } from '../scenes/levels/GtuTestLevel1';
import { GtuTestLevel2 } from '../scenes/levels/GtuTestLevel2';
import { CombinedGtuLevel } from '../scenes/levels/CombinedGtuLevel';
import { SoundTester } from '../scenes/menus/DevHub/SoundTester';

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
        GameScene2,
        GameScene3,
        GameScene4,
        GameScene5,
        Matrix640x360,
        BlueTest,
        Leaderboard,
        MissionComplete,
        GameOver,
        PauseMenu,
        DevHub,
        Credits,
        LegacyGameScene1,
        GtuTestLevel0,
        GtuTestLevel1,
        GtuTestLevel2,
        CombinedGtuLevel,
        SoundTester
    ]
};
