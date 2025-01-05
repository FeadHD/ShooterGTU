const Phaser = {
    Scene: class {
        constructor() {
            this.preload = jest.fn();
            this.create = jest.fn();
            this.update = jest.fn();
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
            this.registry = {
                get: jest.fn().mockReturnValue(0),
                set: jest.fn(),
            };
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
            this.sound = {
                add: jest.fn().mockReturnValue({
                    play: jest.fn(),
                    setVolume: jest.fn(),
                    loop: true,
                }),
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
        }
    },
    Physics: {
        Arcade: {
            Sprite: jest.fn(),
            Group: jest.fn().mockImplementation(() => ({
                add: jest.fn(),
                create: jest.fn(),
            })),
            World: jest.fn().mockImplementation(() => ({
                setBounds: jest.fn(),
            })),
            StaticGroup: jest.fn().mockImplementation(() => ({
                create: jest.fn(),
                add: jest.fn(),
            })),
        },
    },
    GameObjects: {
        Sprite: jest.fn().mockImplementation(() => ({
            setTexture: jest.fn(),
            setPosition: jest.fn(),
            setScrollFactor: jest.fn(),
            setOrigin: jest.fn(),
            setDepth: jest.fn(),
            setScale: jest.fn(),
        })),
        Image: jest.fn().mockImplementation((scene, x, y, key) => ({
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
        Container: class {}
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
            enabled: true,
        },
    },
    Sound: {
        Sound: jest.fn().mockImplementation(() => ({
            play: jest.fn(),
            setVolume: jest.fn(),
        })),
    },
};

module.exports = Phaser;
