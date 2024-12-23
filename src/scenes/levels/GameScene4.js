import { BaseScene } from '../elements/BaseScene';
import { StrongEnemy } from '../../prefabs/EnemyTypes';
import { GameUI } from '../elements/GameUI';
import { Bitcoin } from '../../prefabs/Bitcoin';

export class GameScene4 extends BaseScene {
    constructor() {
        super({ key: 'GameScene4' });
        this.tileColliderAdded = false;
        this.messageShown = false;
        this.totalEnemies = 5;
        this.remainingEnemies = this.totalEnemies;
    }

    preload() {
        // Load all audio files
        this.load.audio('laser', 'assets/sounds/laser.wav');
        this.load.audio('hit', 'assets/sounds/hit.wav');
        this.load.audio('victoryMusic', 'assets/sounds/congratulations');

        // Load tileset with error handling
        this.load.on('loaderror', (file) => {
            console.error('Error loading file:', file.src);
        });

        // Load tileset
        this.load.image('tileset-map-4', 'assets/levels/image/TileSet v1.0.png');
        
        // Load level data
        this.load.json('level4', 'assets/levels/Json/Level_Map_4.json');
    }

    create() {
        this.cameras.main.setBackgroundColor('#2A2A2A');
        super.create();

        const { width, height } = this.scale;

        // Set world bounds before calling super.create()
        this.physics.world.setBounds(0, 0, 3840, 1080);
        
        // Set next scene
        this.nextSceneName = 'GameScene5';
        
        // Set player to left side
        this.player.x = width * 0.1;

        // Set up the main game camera
        this.cameras.main.setZoom(1.5);
        this.cameras.main.setBounds(0, 0, 3840, 1080);
        this.cameras.main.startFollow(this.player, true, 0.25, 0.25, 0, 0);

        // Add debug graphics for world bounds
        const debugGraphics = this.add.graphics();
        debugGraphics.lineStyle(2, 0xff0000);
        debugGraphics.strokeRect(0, 0, 3840, 1080);
        debugGraphics.setScrollFactor(1);

        // Initialize platforms group
        this.platforms = this.physics.add.staticGroup();

        // Initialize enemies group
        this.enemies = this.physics.add.group({
            collideWorldBounds: true,
            bounceX: 0.5,
            bounceY: 0.2,
            dragX: 200
        });

        // Initialize bitcoins group
        this.bitcoins = this.add.group();

        // Hide the scene initially
        this.cameras.main.setAlpha(0);

        // Set up UI
        this.gameUI = new GameUI(this);
        
        // Make sure UI stays fixed
        this.gameUI.container.setScrollFactor(0);
        this.gameUI.updateCameraIgnoreList();

        // Load and create tilemap
        const levelData = this.cache.json.get('level4');
        
        if (!levelData) {
            console.error('Failed to load level data');
            return;
        }

        // Get the layer instance for Tiles layer
        const tilesLayer = levelData.layerInstances[0];  // First layer is our Tiles layer
        if (!tilesLayer) {
            console.error('Tiles layer not found');
            return;
        }

        // Create tilemap from JSON using level dimensions
        const map = this.make.tilemap({ 
            width: Math.ceil(levelData.pxWid / tilesLayer.__gridSize),
            height: Math.ceil(levelData.pxHei / tilesLayer.__gridSize),
            tileWidth: tilesLayer.__gridSize,
            tileHeight: tilesLayer.__gridSize
        });
        
        // Add tileset to map
        const tileset = map.addTilesetImage('tileset-map-4', 'tileset-map-4', 32, 32, 0, 0);
        
        if (!tileset) {
            console.error('Failed to create tileset');
            return;
        }
        
        // Create layer from LDtk data
        const layer = map.createBlankLayer('TileLayer', tileset, 0, 0);
        
        if (!layer) {
            console.error('Failed to create layer');
            return;
        }

        // Store layer reference for rendering
        this.mapLayer = layer;

        // Create a promise to track tile placement
        const placeTilesPromise = new Promise((resolve) => {
            if (tilesLayer.gridTiles && tilesLayer.gridTiles.length > 0) {
                let tilesPlaced = 0;
                const totalTiles = tilesLayer.gridTiles.length;

                tilesLayer.gridTiles.forEach((tile) => {
                    const gridX = Math.floor(tile.px[0] / tilesLayer.__gridSize);
                    const gridY = Math.floor(tile.px[1] / tilesLayer.__gridSize);
                    
                    try {
                        // Place the visual tile
                        layer.putTileAt(tile.t, gridX, gridY);
                        
                        // Create collision rectangle for every tile
                        const tileRect = this.add.rectangle(
                            gridX * tilesLayer.__gridSize + tilesLayer.__gridSize/2,
                            gridY * tilesLayer.__gridSize + tilesLayer.__gridSize/2,
                            tilesLayer.__gridSize,
                            tilesLayer.__gridSize
                        );
                        this.physics.add.existing(tileRect, true);
                        this.platforms.add(tileRect);
                        
                        tilesPlaced++;
                        if (tilesPlaced === totalTiles) {
                            resolve();
                        }
                    } catch (error) {
                        console.error('Error placing tile:', {
                            gridX, gridY,
                            px: tile.px,
                            tileId: tile.t,
                            error: error.message
                        });
                        tilesPlaced++;
                        if (tilesPlaced === totalTiles) {
                            resolve();
                        }
                    }
                });
            } else {
                resolve();
            }
        });

        // Wait for all tiles to be placed before setting up collisions
        placeTilesPromise.then(() => {
            // Add collision between player and platforms
            this.physics.add.collider(this.player, this.platforms);

            // Wait a short moment for platforms to be fully set up
            this.time.delayedCall(100, () => {
                // Add collisions between bullets and platforms
                this.physics.add.collider(this.bullets, this.platforms, this.hitPlatform, null, this);

                // Add collisions between bullets and enemies
                this.physics.add.collider(
                    this.bullets,
                    this.enemies,
                    this.hitEnemyWithBullet,
                    (bullet, enemySprite) => {
                        // Only process collision if enemy is not invincible
                        return enemySprite.enemy && !enemySprite.enemy.isInvincible;
                    },
                    this
                );

                // Add collisions between player and enemies
                this.physics.add.collider(this.player, this.enemies, this.hitEnemy, null, this);
            });
        });

        // Add bitcoins in a diagonal pattern
        const startX = width * 0.2;
        const endX = width * 0.8;
        const spacing = (endX - startX) / 9;
        const baseY = height - 150;
        const heightStep = 15;

        for (let i = 0; i < 10; i++) {
            const x = startX + (i * spacing);
            const y = baseY - (i * heightStep);
            const bitcoin = new Bitcoin(this, x, y);
            this.bitcoins.add(bitcoin);
            this.physics.add.overlap(this.player, bitcoin, () => {
                bitcoin.collect();
            });
        }

        // Fade in the scene
        this.tweens.add({
            targets: this.cameras.main,
            alpha: 1,
            duration: 500,
            ease: 'Linear'
        });
    }

    hitEnemyWithBullet(bullet, enemySprite) {
        // Create particles at hit location
        for(let i = 0; i < 10; i++) {
            const particle = this.add.circle(bullet.x, bullet.y, 3, 0xffff00);
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 100;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            this.tweens.add({
                targets: particle,
                x: particle.x + (vx * 0.3), // Move in direction over 300ms
                y: particle.y + (vy * 0.3),
                alpha: 0,
                scale: 0.1,
                duration: 300,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }

        this.hitSound.play(); // Play hit sound
        bullet.destroy();
        
        // Find the enemy object that owns this sprite
        const enemy = [this.enemy1, this.enemy2, this.enemy3, this.enemy4, this.enemy5].find(e => e.sprite === enemySprite);
        if (enemy && enemy.damage(1)) {
            // Enemy is dead
            enemy.destroy();
            this.addPoints(10);
            this.remainingEnemies--;
            if (this.remainingEnemies === 0) {
                this.allEnemiesDefeated = true;
            }
        }
    }

    update() {
        super.update();

        // Check for scene transition when player reaches the end
        if (this.player.x > 3800) {
            // Stop any current music
            if (this.sound.get('backgroundMusic')) {
                this.sound.get('backgroundMusic').stop();
            }
            this.scene.start('GameScene5');
        }
    }
}
