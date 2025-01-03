import { Scene } from 'phaser';
import { LevelLoader } from '../../modules/managers/LevelLoader';
import { Player } from '../../prefabs/Player';
import { PlayerController } from '../../modules/controls/PlayerController';
import { AnimationManager } from '../../modules/managers/AnimationManager';
import { Bullet } from '../../prefabs/Bullet'; 
import { TutorialManager } from '../../modules/managers/TutorialManager';

export class IntroScene extends Scene {
    constructor() {
        super({ 
            key: 'IntroScene',
            backgroundColor: '#000000'
        });
        this.SCENE_WIDTH = 900;
        this.SCENE_HEIGHT = 400;
    }

    init() {
        // Set the camera and game size for this scene
        this.scale.setGameSize(this.SCENE_WIDTH, this.SCENE_HEIGHT);
        this.scale.setZoom(1);
        
        // Create animations
        const animationManager = new AnimationManager(this);
        animationManager.createCharacterAnimations();

        // Create bullet animation
        this.anims.create({
            key: 'bullet_anim',
            frames: this.anims.generateFrameNumbers('bullet_animation', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });
    }

    preload() {
        console.log('IntroScene: preload started');
        
        // Load the LDtk level file
        this.load.json('introscene', 'assets/introscene/introscene.ldtk');
        
        // Load the Industrial tileset
        this.load.spritesheet('tileset', 'assets/introscene/1_Industrial_Tileset_1B.png', {
            frameWidth: 32,
            frameHeight: 32
        });

        // Load bullet sprite
        this.load.spritesheet('bullet_animation', 'assets/sprites/bullet.png', {
            frameWidth: 24,
            frameHeight: 24
        });

        // Load font
        this.load.font('Gameplay', 'assets/fonts/retronoid/Gameplay.ttf');

        this.load.on('complete', () => {
            console.log('IntroScene: All assets loaded');
        });

        this.load.on('loaderror', (file) => {
            console.error('IntroScene: Failed to load:', file.src);
        });
    }

    create() {
        console.log('IntroScene: create started');

        // Reset the camera
        const mainCamera = this.cameras.main;
        mainCamera.setViewport(0, 0, this.SCENE_WIDTH, this.SCENE_HEIGHT);
        mainCamera.setBackgroundColor('#87CEEB'); // Light blue background
        mainCamera.setBounds(0, 0, this.SCENE_WIDTH, this.SCENE_HEIGHT);
        mainCamera.setPosition(0, 0);
        mainCamera.setSize(this.SCENE_WIDTH, this.SCENE_HEIGHT);
        mainCamera.setZoom(1);
        
        // Create a light blue background for the visible area
        const background = this.add.rectangle(
            this.SCENE_WIDTH / 2,
            this.SCENE_HEIGHT / 2,
            this.SCENE_WIDTH,
            this.SCENE_HEIGHT,
            0x87CEEB
        );
        background.setDepth(-1);

        // Initialize bullets group
        this.bullets = this.physics.add.group({
            classType: Bullet,
            maxSize: 10,
            runChildUpdate: true
        });

        // Initialize tutorial manager
        this.tutorialManager = new TutorialManager(this);

        // Set world bounds
        this.physics.world.setBounds(0, 0, this.SCENE_WIDTH + 30, this.SCENE_HEIGHT); // +30 to include transfer zone width
        
        // Create invisible walls at the boundaries (except right side and bottom)
        this.worldBounds = this.physics.add.staticGroup();
        
        // Left wall
        this.worldBounds.add(
            this.add.rectangle(0, this.SCENE_HEIGHT/2, 4, this.SCENE_HEIGHT)
                .setOrigin(0.5)
                .setFillStyle(0xff0000) // Red color
        );
        
        // Top wall
        this.worldBounds.add(
            this.add.rectangle(this.SCENE_WIDTH/2 + 15, 0, this.SCENE_WIDTH + 30, 4)
                .setOrigin(0.5)
                .setFillStyle(0xff0000) // Red color
        );

        // Right wall after transfer zone
        this.worldBounds.add(
            this.add.rectangle(this.SCENE_WIDTH + 20, this.SCENE_HEIGHT/2, 4, this.SCENE_HEIGHT)
                .setOrigin(0.5)
                .setFillStyle(0xff0000) // Red color
        );

        // Create end zone trigger on the right side
        const endX = this.SCENE_WIDTH + 10; // 10 pixels past the right edge
        const endY = this.SCENE_HEIGHT / 2; // Center vertically
        this.endZone = this.add.rectangle(endX, endY, 20, this.SCENE_HEIGHT, 0x00ff00, 0.3);
        this.physics.add.existing(this.endZone, true); // true makes it static

        // Check if assets are loaded
        const levelData = this.cache.json.get('introscene');
        console.log('IntroScene: Level data loaded:', levelData ? 'yes' : 'no');
        console.log('IntroScene: Tileset loaded:', this.textures.exists('tileset') ? 'yes' : 'no');

        // Load the level using LevelLoader
        const levelLoader = new LevelLoader(this);
        const { map, layer } = levelLoader.loadLevel('introscene');

        console.log('IntroScene: Level loaded:', { 
            mapCreated: map ? 'yes' : 'no',
            layerCreated: layer ? 'yes' : 'no'
        });

        if (map && layer) {
            // Calculate the scale needed to fit the level in our viewport
            const levelWidth = map.widthInPixels;
            const levelHeight = map.heightInPixels;
            
            // Position the layer to center it in the viewport
            const xOffset = (this.SCENE_WIDTH - levelWidth) / 2;
            const yOffset = (this.SCENE_HEIGHT - levelHeight) / 2;
            
            layer.setPosition(xOffset, yOffset);
            layer.setScrollFactor(1);

            // Make sure collision is enabled for all tiles
            layer.forEachTile(tile => {
                if (tile && tile.index !== -1) {
                    tile.setCollision(true, true, true, true);
                    tile.properties = { ...tile.properties, collides: true };
                }
            });
            
            console.log('Level dimensions:', {
                width: levelWidth,
                height: levelHeight,
                xOffset,
                yOffset
            });

            // Create the player
            const startX = xOffset + 100; // Start near the left side
            const startY = yOffset + levelHeight - 100; // Near bottom
            this.player = new Player(this, startX, startY);
            
            // Set up player controller
            this.player.controller = new PlayerController(this);
            
            // Add collider between player and layer with debug callback
            this.physics.add.collider(this.player, layer, null, (player, tile) => {
                // Debug collision
                console.log('Collision with tile:', tile.index, 'at', tile.x, tile.y);
                return true; // Always allow collision
            });
            
            // Add collider between player and world bounds
            this.physics.add.collider(this.player, this.worldBounds);

            // Add overlap check for player and end zone
            this.physics.add.overlap(this.player, this.endZone, () => {
                console.log('Player reached the end zone!');
                this.scale.setGameSize(1920, 1080);
                this.scene.start('GameScene1');
            });

            // Start the tutorial
            this.tutorialManager.start();

            // Listen for player shooting
            this.input.on('pointerdown', () => {
                this.tutorialManager.onPlayerShoot();
            });
        }

        // Log the final scene setup
        console.log('IntroScene: Setup complete');
    }

    update() {
        // Update the player if it exists
        if (this.player) {
            this.player.update();
            
            // Check if player has fallen below the scene
            if (this.player.y > this.SCENE_HEIGHT + 100) {
                this.player.die();
                // Reset player position to start
                this.player.setPosition(100, this.SCENE_HEIGHT - 100);
            }
        }

        // Update tutorial
        if (this.tutorialManager) {
            this.tutorialManager.update();
        }
    }
}
