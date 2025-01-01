import { Scene } from 'phaser';
import { EnemyManager } from '../../../modules/managers/EnemyManager';
import AudioManager from '../../../modules/managers/AudioManager';
import { TextStyleManager } from '../../../modules/managers/TextStyleManager';
import { DEFAULT_ENEMY_CONFIG, DEFAULT_TRAP_CONFIG, DEFAULT_PROCEDURAL_CONFIG } from '../../../constants/Constants';
import { createRetroButton } from '../../../scenes/menus/ui-helpers';

export class TheZucc extends Scene {
    constructor() {
        super({ key: 'TheZucc' });
        this.enemyConfig = { ...DEFAULT_ENEMY_CONFIG };
        this.trapConfig = { ...DEFAULT_TRAP_CONFIG };
        this.proceduralConfig = { ...DEFAULT_PROCEDURAL_CONFIG };
        this.audioManager = new AudioManager(this);
    }

    preload() {
        this.audioManager.preloadMusic('thezucc', './assets/sounds/thezucc.wav');
    }

    async create() {
        await this.audioManager.initialize();
        await this.createScene();
    }

    async createScene() {
        const { width, height } = this.scale;
        this.createBackground();
        this.createTitle();
        this.createSceneCategories();
        this.createBackButton();
    }

    createBackground() {
        const { width, height } = this.scale;
        this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0);
    }

    createTitle() {
        TextStyleManager.createText(
            this,
            this.scale.width / 2,
            50,
            'THE ZUCC',
            'mainTitle'
        );
    }

    createSceneCategories() {
        const sceneCategories = {
            'ZUCC TESTING': {
                scenes: ['Matrix640x360'],
                showConfig: true
            },
            'PROCEDURAL SCENE': {
                scenes: ['Matrix640x360'],
                showConfig: false,
                showProcedural: true
            },
            'Levels': {
                scenes: ['GameScene1', 'GameScene2', 'GameScene3', 'GameScene4', 'GameScene5'],
                showConfig: false
            },
            'Menus': {
                scenes: ['MainMenu', 'Credits'],
                showConfig: false
            }
        };

        let yOffset = 120;
        Object.entries(sceneCategories).forEach(([category, config]) => {
            yOffset = this.createCategorySection(category, config, yOffset);
        });
    }

    createCategorySection(category, config, yOffset) {
        TextStyleManager.createText(
            this,
            50,
            yOffset,
            category,
            'configText',
            0
        );
        yOffset += 60;

        yOffset = this.createSceneButtons(config.scenes, yOffset);

        if (config.showConfig) {
            yOffset += 60;
            yOffset = this.createConfigSection(yOffset);
        }

        if (config.showProcedural) {
            yOffset += 60;
            yOffset = this.createProceduralSection(yOffset);
        }

        return yOffset + 80;
    }

    createSceneButtons(scenes, yOffset) {
        const maxWidth = this.scale.width - 100;
        let xOffset = 50;

        scenes.forEach(sceneName => {
            const button = TextStyleManager.createText(
                this,
                xOffset,
                yOffset,
                sceneName,
                'menuButton',
                0,
                true
            );

            button.on('pointerdown', () => {
                this.audioManager.stopMusic();
                this.startScene(sceneName);
            });

            xOffset += button.width + 30;
            if (xOffset > maxWidth) {
                xOffset = 50;
                yOffset += 60;
            }
        });

        return yOffset;
    }

    startScene(sceneName) {
        const sceneData = {
            enemyConfig: this.enemyConfig,
            trapConfig: this.trapConfig,
            proceduralConfig: this.proceduralConfig
        };
        this.scene.start(sceneName, sceneData);
    }

    createBackButton() {
        const backButton = createRetroButton(
            this,
            this.scale.width / 2,
            this.scale.height - 50,
            'BACK TO MAIN MENU',
            () => {
                this.audioManager.stopMusic();
                this.scene.start('MainMenu');
            }
        ).setOrigin(0.5);
    }

    createConfigSection(yOffset) {
        const configStyle = {
            fontSize: '24px',
            fill: '#fff',
            fontFamily: 'Arial'
        };

        this.add.text(50, yOffset, 'Configuration Section', configStyle);
        yOffset += 40;

        // Display enemy types
        const enemyTypes = Object.keys(DEFAULT_ENEMY_CONFIG);
        enemyTypes.forEach((enemyType, index) => {
            this.add.text(50, yOffset + (index * 30), enemyType, { fontSize: '20px', fill: '#fff' });
        });
        yOffset += enemyTypes.length * 30;

        // Enemies Input
        this.add.text(50, yOffset, 'Number of Enemies:', configStyle);
        const enemiesInput = this.add.dom(200, yOffset).createElement('input');
        enemiesInput.node.setAttribute('type', 'number');
        enemiesInput.node.setAttribute('min', '1');
        enemiesInput.node.setAttribute('max', '8');
        enemiesInput.node.style.backgroundColor = 'white';
        enemiesInput.node.style.color = 'black';
        enemiesInput.node.style.border = '1px solid black';
        enemiesInput.node.style.padding = '5px';
        yOffset += 40;

        // Traps Input
        this.add.text(50, yOffset, 'Number of Traps:', configStyle);
        const trapsInput = this.add.dom(200, yOffset).createElement('input');
        trapsInput.node.setAttribute('type', 'number');
        trapsInput.node.setAttribute('min', '1');
        trapsInput.node.setAttribute('max', '8');
        trapsInput.node.style.backgroundColor = 'white';
        trapsInput.node.style.color = 'black';
        trapsInput.node.style.border = '1px solid black';
        trapsInput.node.style.padding = '5px';
        yOffset += 40;

        // Alarms Input
        this.add.text(50, yOffset, 'Number of Alarms:', configStyle);
        const alarmsInput = this.add.dom(200, yOffset).createElement('input');
        alarmsInput.node.setAttribute('type', 'number');
        alarmsInput.node.setAttribute('min', '1');
        alarmsInput.node.setAttribute('max', '8');
        alarmsInput.node.style.backgroundColor = 'white';
        alarmsInput.node.style.color = 'black';
        alarmsInput.node.style.border = '1px solid black';
        alarmsInput.node.style.padding = '5px';
        yOffset += 40;

        return yOffset;
    }

    createProceduralSection(yOffset) {
        const proceduralStyle = {
            fontSize: '24px',
            fill: '#fff',
            fontFamily: 'Arial'
        };

        this.add.text(50, yOffset, 'Procedural Section', proceduralStyle);
        yOffset += 40;

        // Add more UI elements for procedural generation as needed

        return yOffset;
    }

    shutdown() {
        this.audioManager.shutdown();
        super.shutdown();
    }
}