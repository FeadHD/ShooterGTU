import { BaseScene } from '../elements/BaseScene';
import { GameConfig } from '../../config/GameConfig';
import { Player } from '../../prefabs/Player';
import { Bullet } from '../../prefabs/Bullet';
import { CollisionManager } from '../../modules/managers/CollisionManager';
import { BulletPool } from '../../modules/managers/pools/BulletPool';
import { UIManager } from '../elements/UIManager';
import { AnimationManager } from '../../modules/managers/AnimationManager';
import { container } from '../../modules/di/ServiceContainer';
import { eventBus } from '../../modules/events/EventBus';
import { ManagerFactory } from '../../modules/di/ManagerFactory';

export class TestingGroundScene extends BaseScene {
    constructor() {
        super({ 
            key: 'TestingGroundScene',
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 300 },
                    debug: false
                }
            }
        });
        
        this.SCENE_WIDTH = 1000;
        this.SCENE_HEIGHT = 500;
    }

    init() {
        // Initialize scene properties
        this.scale.setGameSize(this.SCENE_WIDTH, this.SCENE_HEIGHT);
        this.physics.world.setBounds(0, 0, this.SCENE_WIDTH, this.SCENE_HEIGHT);
    }

    preload() {
        super.preload();
        
        // Load character spritesheets with correct casing
        this.load.spritesheet('character_idle', 'assets/character/character_Idle.png', {
            frameWidth: 32,
            frameHeight: 32
        });
        this.load.spritesheet('character_run', 'assets/character/character_Run.png', {
            frameWidth: 32,
            frameHeight: 32
        });
        this.load.spritesheet('character_jump', 'assets/character/character_Jump.png', {
            frameWidth: 32,
            frameHeight: 32
        });
        this.load.spritesheet('character_fall', 'assets/character/character_Fall.png', {
            frameWidth: 32,
            frameHeight: 32
        });
        this.load.spritesheet('character_rollover', 'assets/character/character_Rollover.png', {
            frameWidth: 32,
            frameHeight: 32
        });

        // Load tileset for the ground
        this.load.spritesheet('tileset', 'assets/introscene/1_Industrial_Tileset_1B.png', {
            frameWidth: 32,
            frameHeight: 32
        });

        // Load bullet assets
        this.load.image('bullet', 'assets/bullet.png');

        // Add load event handlers for debugging
        this.load.on('complete', () => {
            console.log('All assets loaded successfully');
            // Debug: list all loaded textures
            console.log('Available textures:', Object.keys(this.textures.list));
        });

        this.load.on('loaderror', (file) => {
            console.error('Failed to load:', file.src);
        });
    }

    create() {
        // Register core dependencies
        container.register('scene', this);
        container.register('eventBus', eventBus);
        
        // Create managers first
        this.managers = ManagerFactory.createManagers(this);
        
        // Setup core systems and create animations
        this.animations = this.managers.animations;
        this.animations.initialize();  

        // Create bullets group
        this.bullets = this.add.group({
            classType: Bullet,
            maxSize: 10,
            runChildUpdate: true
        });

        // Create the ground platform using tiles
        const tileSize = 32;
        const groundHeight = 2;
        const numTilesWidth = Math.ceil(this.SCENE_WIDTH / tileSize);

        // Create a tilemap
        const map = this.make.tilemap({
            tileWidth: tileSize,
            tileHeight: tileSize,
            width: numTilesWidth,
            height: groundHeight
        });

        // Add tileset
        const tileset = map.addTilesetImage('tileset');

        // Create the ground layer
        const groundLayer = map.createBlankLayer('ground', tileset, 0, this.SCENE_HEIGHT - (groundHeight * tileSize));

        // Fill the ground layer with tiles
        for (let x = 0; x < numTilesWidth; x++) {
            for (let y = 0; y < groundHeight; y++) {
                groundLayer.putTileAt(1, x, y);
            }
        }

        // Enable collision for all tiles in the ground layer
        groundLayer.setCollisionByExclusion([-1]);

        // Create the player
        const playerX = 100;
        const playerY = this.SCENE_HEIGHT - (groundHeight * tileSize) - 50;
        this.player = new Player(this, playerX, playerY);
        this.player.isRolling = false; // Add rolling state tracking
        
        // Set up player movement keys
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = {
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            space: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
            shift: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)
        };

        // Initialize bullet pool
        this.bulletPool = new BulletPool(this);

        // Set up collisions
        this.collisionManager = new CollisionManager(this);
        this.collisionManager.setupCollisions();

        // Add physics collision between player and ground layer
        this.physics.add.collider(this.player, groundLayer);

        // Add UI elements
        this.uiManager = new UIManager(this);

        // Set up camera
        this.cameras.main.setBounds(0, 0, this.SCENE_WIDTH, this.SCENE_HEIGHT);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setBackgroundColor('#87CEEB');
    }

    update(time, delta) {
        // Update player
        if (this.player) {
            // Handle player movement
            const speed = 300;
            
            // Left/Right movement
            if (this.keys.left.isDown || this.cursors.left.isDown) {
                this.player.setVelocityX(-speed);
                this.player.setFlipX(true);
                if (this.player.body.touching.down && !this.player.isRolling) {
                    this.player.play('character_Run', true);
                }
            } else if (this.keys.right.isDown || this.cursors.right.isDown) {
                this.player.setVelocityX(speed);
                this.player.setFlipX(false);
                if (this.player.body.touching.down && !this.player.isRolling) {
                    this.player.play('character_Run', true);
                }
            } else {
                this.player.setVelocityX(0);
                if (this.player.body.touching.down && !this.player.isRolling) {
                    this.player.play('character_Idle', true);
                }
            }

            // Jumping
            if ((this.keys.up.isDown || this.cursors.up.isDown || this.keys.space.isDown) && this.player.body.touching.down && !this.player.isRolling) {
                this.player.setVelocityY(-330);
                this.player.play('character_Jump', true);
            }

            // Check if falling
            if (this.player.body.velocity.y > 50 && !this.player.body.touching.down && !this.player.isRolling) {
                this.player.play('character_Fall', true);
            }

            // Rolling (Shift key)
            if (this.keys.shift.isDown && this.player.body.touching.down && !this.player.isRolling) {
                const rollSpeed = this.player.flipX ? -450 : 450;
                this.player.setVelocityX(rollSpeed);
                this.player.isRolling = true;
                this.player.play('character_Rollover', true).once('animationcomplete', () => {
                    this.player.isRolling = false;
                });
            }

            this.player.update();
        }

        // Update UI
        if (this.uiManager) {
            this.uiManager.update();
        }
    }
}
