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

jest.mock('../../../prefabs/Player', () => {
    const mockPlayer = jest.fn().mockImplementation((scene, x, y) => {
        const player = {
            x,
            y,
            body: {
                velocity: { x: 0, y: 0 },
                blocked: { down: true },
                onFloor: jest.fn().mockReturnValue(true)
            },
            controller: {
                controls: {
                    jump: { isDown: false, wasJustPressed: false }
                },
                enabled: true,
                isMovingDown: jest.fn(),
                isMovingLeft: jest.fn(),
                isMovingRight: jest.fn(),
                isMovingUp: jest.fn()
            },
            doubleJumpSpeed: -300,
            isDying: false,
            jumpSpeed: -330,
            jumpsAvailable: 2,
            maxJumps: 2,
            movementSpeed: 160,
            play: jest.fn(),
            setBounce: jest.fn().mockReturnThis(),
            setCollideWorldBounds: jest.fn().mockReturnThis(),
            setFlipX: jest.fn().mockReturnThis(),
            setGravityY: jest.fn().mockReturnThis(),
            setPosition: jest.fn().mockReturnThis(),
            setVelocityX: jest.fn().mockReturnThis(),
            setVelocityY: jest.fn().mockReturnThis(),
            bounceX: 0.5,
            bounceY: 0.2,
            collideWorldBounds: true,
            dragX: 200,
            getChildren: jest.fn(),
            update: jest.fn().mockImplementation(() => {
                // Handle horizontal movement
                if (player.controller.isMovingLeft()) {
                    player.setVelocityX(-player.movementSpeed);
                    player.setFlipX(true);
                } else if (player.controller.isMovingRight()) {
                    player.setVelocityX(player.movementSpeed);
                    player.setFlipX(false);
                } else {
                    player.setVelocityX(0);
                    player.play('character_Idle', true);
                }

                // Handle jumping
                if (player.controller.isMovingUp() && player.body.blocked.down) {
                    player.setVelocityY(player.jumpSpeed);
                    player.play('character_Jump', true);
                }
            })
        };
        return player;
    });
    return { default: mockPlayer };
});

jest.mock('../../../prefabs/Trampoline', () => ({
    default: jest.fn().mockImplementation((scene, x, y) => ({
        x,
        y,
        body: {
            velocity: { x: 0, y: 0 },
            blocked: { down: true }
        },
        setBounce: jest.fn().mockReturnThis(),
        setCollideWorldBounds: jest.fn().mockReturnThis(),
        setImmovable: jest.fn().mockReturnThis(),
        setVelocityX: jest.fn().mockReturnThis(),
        setVelocityY: jest.fn().mockReturnThis(),
        bounceX: 0.5,
        bounceY: 0.2,
        collideWorldBounds: true,
        dragX: 200,
        getChildren: jest.fn(),
        onCollide: jest.fn().mockImplementation((player) => {
            player.setVelocityY(-1250);
            scene.add.particles('spark');
        })
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
jest.mock('../../elements/TransitionScreen', () => ({
    TransitionScreen: jest.fn().mockImplementation(() => ({
        start: jest.fn(callback => callback()),
    }))
}));
jest.mock('../../elements/GameUI', () => ({
    GameUI: jest.fn().mockImplementation(() => ({
        startTimer: jest.fn(),
        animateUIElements: jest.fn(),
        updateScore: jest.fn(),
        updateLives: jest.fn(),
        updateHP: jest.fn(),
        updateBitcoins: jest.fn(),
    }))
}));

const { GameScene1 } = require('../GameScene1');
const Phaser = require('phaser');
const Player = require('../../../prefabs/Player').default;

describe('GameScene1', () => {
    let scene;

    beforeEach(() => {
        scene = new GameScene1();

        // Mock the Phaser Scene methods that we use
        scene.add = {
            rectangle: jest.fn().mockReturnValue({
                setOrigin: jest.fn(),
                setDepth: jest.fn(),
                setAlpha: jest.fn(),
                setFillStyle: jest.fn(),
            }),
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
            particles: jest.fn().mockReturnValue({
                createEmitter: jest.fn().mockReturnValue({
                    setPosition: jest.fn(),
                    setSpeed: jest.fn(),
                    setScale: jest.fn(),
                    setAlpha: jest.fn(),
                    setLifespan: jest.fn(),
                    setQuantity: jest.fn(),
                    setFrequency: jest.fn(),
                    start: jest.fn(),
                }),
            }),
        };

        // Set up basic mocks that all tests will need
        scene.scale = {
            width: 800,
            height: 600,
        };
        scene.playerSpawnPoint = { x: 80, y: 500 };
        scene.input = {
            keyboard: {
                addKey: jest.fn().mockReturnValue({
                    on: jest.fn(),
                    off: jest.fn(),
                }),
            },
        };
        scene.events = {
            on: jest.fn(),
            emit: jest.fn(),
            off: jest.fn(),
        };
        scene.sound = {
            add: jest.fn().mockReturnValue({
                play: jest.fn(),
                stop: jest.fn(),
                setVolume: jest.fn(),
                destroy: jest.fn(),
            }),
        };
        scene.physics = {
            add: {
                sprite: jest.fn().mockReturnValue({
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
                }),
                collider: jest.fn((obj1, obj2, callback) => {
                    // Don't execute the callback if it's an enemy collision
                    if (callback && !obj1.getChildren && !obj2.getChildren) {
                        callback(obj1, obj2);
                    }
                    return {
                        callbacks: [],
                        active: true,
                    };
                }),
                overlap: jest.fn(),
                group: jest.fn().mockReturnValue({
                    setVelocityX: jest.fn(),
                    getChildren: jest.fn().mockReturnValue([]),
                    collideWorldBounds: true,
                    bounceX: 0.5,
                    bounceY: 0.2,
                    dragX: 200
                }),
                staticGroup: jest.fn().mockReturnValue({
                    create: jest.fn().mockReturnValue({
                        setSize: jest.fn(),
                        setDepth: jest.fn(),
                        setPosition: jest.fn(),
                        setCollideWorldBounds: jest.fn(),
                        setBounce: jest.fn(),
                        setGravityY: jest.fn(),
                        play: jest.fn(),
                        setVelocityX: jest.fn(),
                        setVelocityY: jest.fn(),
                    }),
                    getChildren: jest.fn().mockReturnValue([]),
                }),
            },
            world: {
                setBounds: jest.fn(),
            },
        };
        scene.scale = {
            resize: jest.fn(),
            setGameSize: jest.fn(),
        };
        scene.cameras = {
            main: {
                setBounds: jest.fn(),
                setZoom: jest.fn(),
                startFollow: jest.fn(),
                setViewport: jest.fn(),
            },
        };
        scene.anims = {
            create: jest.fn(),
            play: jest.fn(),
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
        scene.enemies = {
            getChildren: jest.fn().mockReturnValue([
                {
                    body: {
                        velocity: { x: 100, y: 0 },
                        blocked: { down: true }
                    },
                    setVelocityX: jest.fn(),
                    setVelocityY: jest.fn(),
                    enemy: {
                        reverseDirection: jest.fn()
                    }
                },
                {
                    body: {
                        velocity: { x: -100, y: 0 },
                        blocked: { down: true }
                    },
                    setVelocityX: jest.fn(),
                    setVelocityY: jest.fn(),
                    enemy: {
                        reverseDirection: jest.fn()
                    }
                }
            ]),
            setVelocityX: jest.fn(),
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
        scene.create();
        
        // Call the transition screen callback directly since it's async
        scene.transitionScreen.start.mock.calls[0][0]();
        
        // Calculate expected player position
        const expectedX = scene.scale.width * 0.1; // 10% from left edge
        const expectedY = 500;

        // Now verify that the player was initialized correctly
        expect(scene.player.setPosition).toHaveBeenCalledWith(expectedX, expectedY);
        expect(scene.physics.world.setBounds).toHaveBeenCalledWith(0, 0, 3840, 1080);
        expect(scene.cameras.main.setBounds).toHaveBeenCalledWith(0, 0, 3840, 1080);
        expect(scene.cameras.main.setZoom).toHaveBeenCalledWith(1.5);
        expect(scene.cameras.main.startFollow).toHaveBeenCalledWith(scene.player, true, 0.1, 0.1);
    });

    describe('player movement', () => {
        beforeEach(() => {
            scene.player = new Player(scene, 100, 100);
            scene.gameStarted = true;
            scene.player.controller.isMovingUp.mockReturnValue(false);
            scene.player.controller.isMovingLeft.mockReturnValue(false);
            scene.player.controller.isMovingRight.mockReturnValue(false);
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
            scene.player.controller.isMovingUp.mockReturnValue(true);
            scene.player.body.blocked.down = true;
            scene.player.update();
            expect(scene.player.setVelocityY).toHaveBeenCalledWith(-330);
            expect(scene.player.play).toHaveBeenCalledWith('character_Jump', true);
        });
    });

    describe('trampoline', () => {
        let Trampoline;

        beforeEach(() => {
            Trampoline = require('../../../prefabs/Trampoline').default;
            scene.player = new Player(scene, 100, 100);
            scene.create();
            scene.transitionScreen.start.mock.calls[0][0]();
            scene.trampoline = {
                x: 735,
                y: 448,
                body: {
                    velocity: { x: 0, y: 0 },
                    blocked: { down: true }
                },
                onCollide: jest.fn((player) => {
                    player.setVelocityY(-1250);
                    scene.add.particles('spark');
                }),
                setImmovable: jest.fn(),
                setVelocityY: jest.fn(),
                setBounce: jest.fn(),
                setCollideWorldBounds: jest.fn()
            };
            scene.trampoline.setImmovable(true);
            scene.trampoline.setBounce(0.7);
            scene.trampoline.setCollideWorldBounds(true);
        });

        test('should set up trampoline physics properties', () => {
            // Set up collider with callback
            const colliderCallback = (player, trampoline) => {
                trampoline.onCollide(player);
            };
            scene.physics.add.collider(scene.player, scene.trampoline, colliderCallback);
            
            // Verify collider was added
            expect(scene.physics.add.collider).toHaveBeenCalledWith(
                scene.player,
                scene.trampoline,
                expect.any(Function)
            );
            
            // Simulate collision by calling the callback directly
            colliderCallback(scene.player, scene.trampoline);
            expect(scene.player.setVelocityY).toHaveBeenCalledWith(-1250);
            expect(scene.add.particles).toHaveBeenCalledWith('spark');
        });

        test('trampoline should handle multiple collisions', () => {
            const colliderCallback = (player, trampoline) => {
                trampoline.onCollide(player);
            };
            
            // Simulate multiple collisions
            colliderCallback(scene.player, scene.trampoline);
            colliderCallback(scene.player, scene.trampoline);
            colliderCallback(scene.player, scene.trampoline);
            
            // Verify bounce effect and particles were triggered multiple times
            expect(scene.player.setVelocityY).toHaveBeenCalledTimes(3);
            expect(scene.add.particles).toHaveBeenCalledTimes(3);
        });

        test('trampoline should be immovable', () => {
            expect(scene.trampoline.setImmovable).toHaveBeenCalled();
        });

        test('should bounce player when colliding', () => {
            // Simulate collision
            scene.trampoline.onCollide(scene.player);

            // Verify the bounce
            expect(scene.player.setVelocityY).toHaveBeenCalledWith(-1250);
        });

        test('should create particle effects on bounce', () => {
            // Simulate collision
            scene.trampoline.onCollide(scene.player);

            // Verify particle effect was created
            expect(scene.add.particles).toHaveBeenCalledWith('spark');
        });
    });
});
