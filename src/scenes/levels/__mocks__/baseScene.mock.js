const Phaser = require('./phaser.mock');

class BaseScene extends Phaser.Scene {
    constructor(config) {
        super(config);
    }

    preload() {
        // Mock preload method
    }

    create() {
        // Mock create method that simulates the real BaseScene behavior
        const managers = {
            animations: {
                createAllAnimations: jest.fn(),
            },
            boundaries: {
                createBoundaries: jest.fn(),
            },
            gameState: {
                initializeGameState: jest.fn(),
            },
            music: {
                setCurrentMusic: jest.fn(),
            },
            entityManager: {
                update: jest.fn(),
            },
            hazards: {
                update: jest.fn(),
            },
            debug: {
                update: jest.fn(),
            },
            sound: {
                add: jest.fn(),
            },
            persistence: {
                save: jest.fn(),
                load: jest.fn(),
            },
            effects: {
                createEffect: jest.fn(),
                update: jest.fn(),
            },
            enemies: {
                update: jest.fn(),
            },
        };

        // Initialize managers
        this.gameState = managers.gameState;
        this.persistence = managers.persistence;
        this.soundManager = managers.sound;
        this.musicManager = managers.music;
        this.entityManager = managers.entityManager;
        this.enemies = managers.enemies;
        this.hazards = managers.hazards;
        this.animations = managers.animations;
        this.effects = managers.effects;
        this.boundaries = managers.boundaries;
        this.debug = managers.debug;

        // Initialize background music
        const bgMusic = this.sound.add('bgMusic', { loop: true });
        const musicVolume = this.registry.get('musicVolume') || 1;
        bgMusic.setVolume(musicVolume);

        // Initialize other properties
        this.physics = {
            add: {
                sprite: jest.fn(),
                staticGroup: jest.fn().mockReturnValue({
                    create: jest.fn(),
                    add: jest.fn(),
                }),
                group: jest.fn().mockReturnValue({
                    create: jest.fn(),
                    add: jest.fn(),
                    classType: null,
                    maxSize: -1,
                    runChildUpdate: true,
                    allowGravity: false,
                    immovable: true,
                }),
                collider: jest.fn(),
            },
            world: {
                setBounds: jest.fn(),
            },
        };

        this.add = {
            sprite: jest.fn().mockImplementation(() => ({
                setTexture: jest.fn(),
                setPosition: jest.fn(),
                setScrollFactor: jest.fn(),
                setOrigin: jest.fn(),
                setDepth: jest.fn(),
                setScale: jest.fn(),
            })),
            image: jest.fn().mockImplementation((x, y, key) => ({
                setTexture: jest.fn(),
                setPosition: jest.fn(),
                setScrollFactor: jest.fn(),
                setOrigin: jest.fn(),
                setDepth: jest.fn(),
                setScale: jest.fn(),
                width: 800,
                height: 600,
                x,
                y,
                texture: { key },
            })),
            existing: jest.fn(),
        };

        this.cameras = {
            main: {
                setBounds: jest.fn(),
                setZoom: jest.fn(),
                startFollow: jest.fn(),
                scrollX: 0,
                width: 800,
                height: 600,
            }
        };

        this.scale = { width: 800, height: 600 };

        this.events = {
            on: jest.fn(),
            once: jest.fn(),
            off: jest.fn(),
        };

        this.textures = {
            exists: jest.fn().mockReturnValue(true),
        };

        this.load = {
            spritesheet: jest.fn(),
            image: jest.fn(),
            audio: jest.fn(),
            json: jest.fn(),
            on: jest.fn(),
        };

        this.input = {
            keyboard: {
                enabled: true,
                addKey: jest.fn().mockReturnValue({
                    on: jest.fn(),
                    off: jest.fn(),
                }),
            },
        };

        // Call the manager methods as part of create
        this.animations.createAllAnimations();
        this.boundaries.createBoundaries();
        this.gameState.initializeGameState();
        this.musicManager.setCurrentMusic('level1Music');
    }

    update() {
        // Mock update method
        this.entityManager.update();
        this.hazards.update();
        this.debug.update();
    }
}

module.exports = { BaseScene };
