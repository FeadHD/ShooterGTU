jest.mock('phaser', () => {
    const Phaser = {
        Scene: class {},
        Physics: {
            Arcade: {
                Sprite: jest.fn(),
            },
        },
        GameObjects: {
            Sprite: jest.fn(),
            Image: jest.fn(),
        },
        Input: {
            Keyboard: {
                KeyCodes: {
                    ESC: 27,
                    W: 87,
                    A: 65,
                    S: 83,
                    D: 68,
                    SPACE: 32,
                },
            },
        },
    };
    return Phaser;
});

jest.mock('../../../prefabs/Player', () => ({
    Player: jest.fn().mockImplementation(() => ({
        setPosition: jest.fn(),
        setCollideWorldBounds: jest.fn(),
        setBounce: jest.fn(),
        setGravityY: jest.fn(),
        play: jest.fn(),
        body: {
            onFloor: jest.fn().mockReturnValue(true),
            velocity: { x: 0, y: 0 },
            blocked: { down: true }
        },
        setVelocityX: jest.fn(),
        setVelocityY: jest.fn(),
        x: 100,
        y: 100,
        controller: {
            isMovingLeft: jest.fn().mockReturnValue(false),
            isMovingRight: jest.fn().mockReturnValue(false),
            isMovingUp: jest.fn().mockReturnValue(false),
            isMovingDown: jest.fn().mockReturnValue(false),
            enabled: true,
            controls: {
                jump: {
                    isDown: false,
                    wasJustPressed: false
                }
            }
        },
        update: function() {
            if (this.body && !this.isDying) {  
                // Reset jumps when landing
                if (this.body.onFloor()) {
                    this.jumpsAvailable = this.maxJumps;
                }
    
                // Handle horizontal movement
                if (this.controller.isMovingLeft()) {
                    this.setVelocityX(-this.movementSpeed);
                    this.setFlipX(true);
                    if (this.body.onFloor()) {
                        this.play('character_Walking', true);
                    }
                } else if (this.controller.isMovingRight()) {
                    this.setVelocityX(this.movementSpeed);
                    this.setFlipX(false);
                    if (this.body.onFloor()) {
                        this.play('character_Walking', true);
                    }
                } else {
                    this.setVelocityX(0);
                    if (this.body.onFloor()) {
                        this.play('character_Idle', true);
                    }
                }
    
                // Always show jump animation when in the air
                if (!this.body.onFloor()) {
                    this.play('character_Jump', true);
                }
    
                // Handle jumping
                if (this.controller.controls.jump.isDown && !this.controller.controls.jump.wasJustPressed) {
                    if (this.body.onFloor() && this.jumpsAvailable === this.maxJumps) {
                        // First jump
                        this.setVelocityY(this.jumpSpeed);
                        this.jumpsAvailable--;
                        this.play('character_Jump', true);
                    } else if (this.jumpsAvailable > 0) {
                        // Double jump
                        this.setVelocityY(this.doubleJumpSpeed);
                        this.jumpsAvailable--;
                        this.play('character_Jump', true);
                    }
                    // Set wasJustPressed to prevent multiple jumps from a single press
                    this.controller.controls.jump.wasJustPressed = true;
                }
            }
        },
        movementSpeed: 160,
        jumpSpeed: -330,
        doubleJumpSpeed: -300,
        maxJumps: 2,
        jumpsAvailable: 2,
        isDying: false,
        setFlipX: jest.fn(),
    }))
}));

jest.mock('../../../prefabs/Slime', () => ({
    Slime: jest.fn()
}));
jest.mock('../../../prefabs/Bitcoin', () => ({
    Bitcoin: jest.fn()
}));
jest.mock('../../../prefabs/Drone', () => ({
    default: jest.fn()
}));
jest.mock('../../../modules/managers/CameraManager', () => {
    const CameraManager = jest.fn().mockImplementation(() => ({
        init: jest.fn(),
        playIntroSequence: jest.fn(),
        stopIntroSequence: jest.fn(),
        isIntroPlaying: false,
    }));
    return CameraManager;
});
jest.mock('../../../modules/managers/CollisionManager', () => ({
    CollisionManager: jest.fn().mockImplementation(() => ({
        init: jest.fn(),
        setupCollisions: jest.fn(),
        handlePlayerEnemyCollision: jest.fn(),
        handlePlayerCoinCollision: jest.fn(),
        handlePlayerAlarmCollision: jest.fn(),
    })),
}));
jest.mock('../../../prefabs/MeleeWarrior', () => ({
    default: jest.fn()
}));
jest.mock('../../../prefabs/AlarmTrigger', () => ({
    AlarmTrigger: jest.fn()
}));
jest.mock('../../elements/BaseScene', () => ({
    BaseScene: class {
        constructor() {
            this.scale = { width: 800, height: 600 };
            this.registry = {
                get: jest.fn().mockReturnValue(1),
                set: jest.fn(),
                events: {
                    on: jest.fn(),
                    off: jest.fn()
                }
            };
        }
        create() {}
        update() {}
    }
}));
jest.mock('../../elements/GameUI', () => ({
    GameUI: jest.fn()
}));

const { GameScene1 } = require('../GameScene1');
const { Player } = require('../../../prefabs/Player');
const Phaser = require('phaser');

describe('GameScene1', () => {
    let scene;

    beforeEach(() => {
        scene = new GameScene1();
        // Set up basic mocks that all tests will need
        scene.physics = {
            add: {
                sprite: jest.fn().mockReturnValue({
                    setPosition: jest.fn(),
                    setCollideWorldBounds: jest.fn(),
                    setBounce: jest.fn(),
                    setGravityY: jest.fn(),
                    play: jest.fn(),
                    body: {
                        onFloor: jest.fn().mockReturnValue(true),
                        velocity: { x: 0, y: 0 },
                        blocked: { down: true }
                    },
                    setVelocityX: jest.fn(),
                    setVelocityY: jest.fn(),
                    x: 100,
                    y: 100,
                }),
                group: jest.fn().mockReturnValue({
                    create: jest.fn(),
                    setVelocityX: jest.fn(),
                    getChildren: jest.fn().mockReturnValue([]),
                }),
                staticGroup: jest.fn().mockReturnValue({
                    create: jest.fn().mockReturnValue({
                        setSize: jest.fn().mockReturnThis(),
                        setDepth: jest.fn().mockReturnThis(),
                        setPosition: jest.fn().mockReturnThis(),
                        setCollideWorldBounds: jest.fn().mockReturnThis(),
                        setBounce: jest.fn().mockReturnThis(),
                        setGravityY: jest.fn().mockReturnThis(),
                        play: jest.fn().mockReturnThis(),
                        setVelocityX: jest.fn().mockReturnThis(),
                        setVelocityY: jest.fn().mockReturnThis(),
                    }),
                    getChildren: jest.fn().mockReturnValue([]),
                }),
                collider: jest.fn(),
                overlap: jest.fn(),
            },
            world: {
                setBounds: jest.fn(),
            },
        };
        scene.anims = {
            create: jest.fn(),
            play: jest.fn(),
        };
        scene.add = {
            sprite: jest.fn().mockReturnThis(),
            image: jest.fn().mockReturnThis(),
            graphics: jest.fn().mockReturnValue({
                clear: jest.fn().mockReturnThis(),
                lineStyle: jest.fn().mockReturnThis(),
                strokeRect: jest.fn().mockReturnThis(),
                fillStyle: jest.fn().mockReturnThis(),
                fillRect: jest.fn().mockReturnThis(),
                setDepth: jest.fn().mockReturnThis(),
                setVisible: jest.fn().mockReturnThis(),
                setAlpha: jest.fn().mockReturnThis(),
            }),
            group: jest.fn().mockReturnValue({
                getChildren: jest.fn().mockReturnValue([]),
            }),
        };
        scene.make = {
            tilemap: jest.fn().mockReturnValue({
                addTilesetImage: jest.fn().mockReturnThis(),
                createBlankLayer: jest.fn().mockReturnThis(),
                putTileAt: jest.fn().mockReturnThis(),
                setCollision: jest.fn().mockReturnThis(),
                setCollisionByProperty: jest.fn().mockReturnThis(),
                getTileAt: jest.fn().mockReturnValue(null),
                getTileAtWorldXY: jest.fn().mockReturnValue(null),
                width: 120,
                height: 34,
                tileWidth: 32,
                tileHeight: 32,
                layers: [],
            }),
        };
        scene.scale = { width: 800, height: 600 };
        scene.cameras = {
            main: {
                setBounds: jest.fn(),
                startFollow: jest.fn(),
                setZoom: jest.fn(),
            },
        };
        scene.input = {
            keyboard: {
                addKey: jest.fn().mockReturnValue({
                    on: jest.fn(),
                    isDown: false,
                }),
                addKeys: jest.fn().mockReturnValue({
                    W: { isDown: false },
                    A: { isDown: false },
                    S: { isDown: false },
                    D: { isDown: false },
                    SPACE: { isDown: false },
                }),
            },
        };
        scene.sound = {
            add: jest.fn().mockReturnValue({
                play: jest.fn(),
                stop: jest.fn(),
                isPlaying: false,
                setVolume: jest.fn(),
            }),
        };
        scene.registry = {
            get: jest.fn().mockReturnValue(1),
            set: jest.fn(),
            events: {
                on: jest.fn(),
                off: jest.fn()
            }
        };
        scene.gameStarted = true;
        scene.slimes = {
            getChildren: jest.fn().mockReturnValue([]),
        };
        scene.coins = {
            getChildren: jest.fn().mockReturnValue([]),
        };
        scene.drones = {
            getChildren: jest.fn().mockReturnValue([]),
        };
        scene.warriors = {
            getChildren: jest.fn().mockReturnValue([]),
        };
        scene.alarmTriggers = {
            getChildren: jest.fn().mockReturnValue([]),
        };
        scene.load = {
            on: jest.fn(),
            audio: jest.fn(),
            image: jest.fn(),
            json: jest.fn(),
        };
        scene.cache = {
            json: {
                get: jest.fn().mockReturnValue({
                    layers: [],
                    tilesets: [],
                    width: 120,
                    height: 34,
                    tilewidth: 32,
                    tileheight: 32,
                    layerInstances: [
                        {
                            __identifier: "Megapixel",
                            __type: "Tiles",
                            __cWid: 120,
                            __cHei: 34,
                            __gridSize: 32,
                            __opacity: 1,
                            __pxTotalOffsetX: 0,
                            __pxTotalOffsetY: 0,
                            __tilesetDefUid: 1,
                            __tilesetRelPath: "megapixel.png",
                            levelId: 0,
                            layerDefUid: 2,
                            pxOffsetX: 0,
                            pxOffsetY: 0,
                            visible: true,
                            optionalRules: [],
                            intGridCsv: [],
                            autoLayerTiles: [],
                            seed: 1234,
                            overrideTilesetUid: null,
                            gridTiles: [],
                            entityInstances: []
                        }
                    ]
                })
            }
        };
        scene.raycaster = {
            createRay: jest.fn(),
        };
        scene.tweens = {
            add: jest.fn().mockReturnValue({
                play: jest.fn(),
                stop: jest.fn(),
                pause: jest.fn(),
                resume: jest.fn(),
                on: jest.fn(),
                once: jest.fn(),
                complete: jest.fn(),
            }),
        };
    });

    test('scene should be created successfully', () => {
        expect(scene).toBeTruthy();
        expect(scene.totalEnemies).toBe(7);
        expect(scene.remainingEnemies).toBe(7);
    });

    test('create method should initialize game objects', () => {
        // Mock Phaser.Input.Keyboard.KeyCodes
        global.Phaser = {
            Input: {
                Keyboard: {
                    KeyCodes: {
                        ESC: 27,
                        W: 87,
                        A: 65,
                        S: 83,
                        D: 68,
                        SPACE: 32,
                    },
                },
            },
        };

        // Create the player before calling create
        scene.player = new Player(scene, 100, 100);
        scene.playerSpawnPoint = { x: 80, y: 500 };
        scene.create();
        
        // Verify that the player was initialized correctly
        expect(scene.player.setPosition).toHaveBeenCalledWith(80, 500);
        expect(scene.physics.world.setBounds).toHaveBeenCalledWith(0, 0, 3840, 1080);
        expect(scene.cameras.main.setBounds).toHaveBeenCalledWith(0, 0, 3840, 1080);
        expect(scene.cameras.main.setZoom).toHaveBeenCalledWith(1.5);
        expect(scene.cameras.main.startFollow).toHaveBeenCalledWith(scene.player, true, 0.1, 0.1);
    });

    describe('player movement', () => {
        beforeEach(() => {
            scene.player = new Player(scene, 100, 100);
            scene.gameStarted = true;
        });

        test('should move left when left cursor is pressed', () => {
            scene.player.controller.isMovingLeft.mockReturnValue(true);
            scene.player.update();
            expect(scene.player.setVelocityX).toHaveBeenCalledWith(-160);
            expect(scene.player.setFlipX).toHaveBeenCalledWith(true);
        });

        test('should move right when right cursor is pressed', () => {
            scene.player.controller.isMovingRight.mockReturnValue(true);
            scene.player.update();
            expect(scene.player.setVelocityX).toHaveBeenCalledWith(160);
            expect(scene.player.setFlipX).toHaveBeenCalledWith(false);
        });

        test('should not move horizontally when no cursor is pressed', () => {
            scene.player.update();
            expect(scene.player.setVelocityX).toHaveBeenCalledWith(0);
            expect(scene.player.play).toHaveBeenCalledWith('character_Idle', true);
        });

        test('should jump when up cursor is pressed and player is on floor', () => {
            scene.player.controller.controls.jump.isDown = true;
            scene.player.controller.controls.jump.wasJustPressed = false;
            scene.player.body.onFloor.mockReturnValue(true);
            scene.player.body.blocked.down = true;
            scene.player.update();
            expect(scene.player.setVelocityY).toHaveBeenCalledWith(-330);
            expect(scene.player.play).toHaveBeenCalledWith('character_Jump', true);
        });
    });
});
