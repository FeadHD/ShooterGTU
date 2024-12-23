import { BaseScene } from '../elements/BaseScene';
import { GameUI } from '../elements/GameUI';
import { Slime } from '../../prefabs/Slime';
import { Bitcoin } from '../../prefabs/Bitcoin';

export class GameScene1 extends BaseScene {
    constructor() {
        super({ key: 'GameScene1' });
        this.tileColliderAdded = false;
        this.messageShown = false;
        this.totalEnemies = 3; // Set this to match the number of enemies you create
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
        this.load.image('megapixel', 'assets/levels/image/Megapixel.png');
        
        // Load level data
        this.load.json('level1', 'assets/levels/Json/G1S1v1f.json');
    }

    create() {
        super.create();
        
        const { width, height } = this.scale;
        
        // Set world bounds before calling super.create()
        this.physics.world.setBounds(0, 0, 3840, 1080);
        
        // Set next scene
        this.nextSceneName = 'GameScene2';
        
        // Set player to left side
        this.player.x = width * 0.1;

        // Set up the main game camera
        this.cameras.main.setZoom(1.5);
        this.cameras.main.setBounds(0, 0, 3840, 1080);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // Add debug graphics for world bounds
        const debugGraphics = this.add.graphics();
        debugGraphics.lineStyle(2, 0xff0000);
        debugGraphics.strokeRect(0, 0, 3840, 1080);
        debugGraphics.setScrollFactor(1);

        // Initialize platforms group
        this.platforms = this.physics.add.staticGroup();

        // Initialize slimes group
        this.slimes = this.physics.add.group({
            collideWorldBounds: true,
            bounceX: 0.5,
            bounceY: 0.2,
            dragX: 200
        });

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
        const levelData = this.cache.json.get('level1');
        
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
        const tileset = map.addTilesetImage('megapixel', 'megapixel', 32, 32, 0, 0);
        
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
                // Use helper method to get correct spawn height
                const enemyY = this.getSpawnHeight();

                // Create three slimes near the end of the level
                const worldWidth = 3840;
                const endArea = worldWidth - 500; // Start spawning 500 pixels from the end
                
                // Position slimes in the last section of the level
                this.enemy1 = new Slime(this, endArea + 100, enemyY);
                this.enemy2 = new Slime(this, endArea + 250, enemyY);
                this.enemy3 = new Slime(this, endArea + 400, enemyY);

                // Add slimes to the group
                this.slimes.add(this.enemy1.sprite);
                this.slimes.add(this.enemy2.sprite);
                this.slimes.add(this.enemy3.sprite);

                // Add collision between player and slimes
                this.physics.add.collider(this.player, this.slimes, this.hitEnemy, null, this);

                // Add collisions between slimes
                this.physics.add.collider(
                    this.slimes,
                    this.slimes,
                    this.handleEnemyCollision,
                    null,
                    this
                );

                // Add bullet collisions with slimes
                this.physics.add.collider(this.bullets, this.slimes, (bullet, slimeSprite) => {
                    // Get the slime instance from the sprite
                    const slime = slimeSprite.enemy;
                    if (slime) {
                        // Damage the slime
                        slime.damage(1);
                        
                        // Create hit effect and destroy bullet
                        this.createHitEffect(bullet.x, bullet.y);
                        bullet.destroy();
                    }
                }, null, this);

                // Set number of enemies
                this.remainingEnemies = 3;
            });
        });

        // Add bitcoins spread across the level
        const startX = width * 0.2;
        const endX = width * 0.8;
        const spacing = (endX - startX) / 9;
        const baseY = height - 150;

        for (let i = 0; i < 10; i++) {
            const x = startX + (i * spacing);
            const y = baseY - Phaser.Math.Between(0, 100);
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
            ease: 'Linear',
            onComplete: () => {
                // Continue with the rest of the scene setup
                this.setupRestOfScene();
            }
        });
    }

    setupRestOfScene() {
        // Create player if it doesn't exist
        if (!this.player) {
            this.createPlayer(this.scale.width);
        }

        // Set up collisions with tile layer if not already done
        if (this.player && this.mapLayer && !this.tileColliderAdded) {
            this.physics.add.collider(this.player, this.mapLayer);
            this.tileColliderAdded = true;
            
            // Add collision between bullets and tile layer
            this.physics.add.collider(this.bullets, this.mapLayer, (bullet) => {
                this.destroyBullet(bullet);
            }, null, this);
        }

        // Set up controls
        this.setupControls();

        // Set up player-enemy collision for damage
        this.physics.add.overlap(this.player, this.slimes, (player, enemySprite) => {
            if (enemySprite.enemy && !this.isDying) {
                this.hitEnemy(player, enemySprite);
            }
        }, null, this);

        // Add collisions between enemies with increased bounce
        this.physics.add.collider(
            this.slimes,
            this.slimes,
            this.handleEnemyCollision,
            null,
            this
        );

        // Set initial number of enemies
        this.remainingEnemies = 3;

        // Wait a short moment for platforms to be fully set up
        this.time.delayedCall(100, () => {
            // Use helper method to get correct spawn height
            const enemyY = this.getSpawnHeight();

            // Set up bullet collisions with process callback
            this.physics.add.collider(
                this.bullets, 
                this.slimes, 
                this.hitEnemyWithBullet, 
                (bullet, enemySprite) => {
                    // Only process collision if enemy is not invincible
                    return enemySprite.enemy && !enemySprite.enemy.isInvincible;
                },
                this
            );
            
            // Set number of enemies
            this.remainingEnemies = 3;
        });
    }

    hitEnemyWithBullet(bullet, enemySprite) {
        // Skip if enemy is already being destroyed
        if (!enemySprite.active || !enemySprite.body || !enemySprite.body.enable) {
            bullet.destroy();
            return;
        }
        
        // Create particles at hit location
        this.createHitEffect(bullet.x, bullet.y);
        
        // Play hit sound and destroy bullet
        this.hitSound.play();
        bullet.destroy();
        
        // Get the enemy instance directly from the sprite
        const enemy = enemySprite.enemy;
        if (enemy && !enemy.isInvincible) {
            // If enemy dies from this hit
            if (enemy.damage(1)) {
                // Add points before destroying the enemy
                this.addPoints(10);
                this.remainingEnemies--;
                
                // Log enemy death
                console.log(`Enemy defeated! Remaining enemies: ${this.remainingEnemies}`);
                
                // Check if level is complete
                if (this.remainingEnemies <= 0) {
                    console.log('All enemies defeated! You can now proceed.');
                    this.checkLevelComplete();
                }
            }
        }
    }

    handleEnemyCollision(enemy1, enemy2) {
        // If enemies are moving towards each other, reverse their directions
        if ((enemy1.body.velocity.x > 0 && enemy2.body.velocity.x < 0) ||
            (enemy1.body.velocity.x < 0 && enemy2.body.velocity.x > 0)) {
            
            if (enemy1.enemy) {
                enemy1.enemy.reverseDirection();
                // Add slight upward velocity for better separation
                enemy1.setVelocityY(-150);
            }
            if (enemy2.enemy) {
                enemy2.enemy.reverseDirection();
                // Add slight upward velocity for better separation
                enemy2.setVelocityY(-150);
            }
        }
        
        // Ensure enemies bounce off each other
        const pushForce = 100;
        if (enemy1.x < enemy2.x) {
            enemy1.setVelocityX(-pushForce);
            enemy2.setVelocityX(pushForce);
        } else {
            enemy1.setVelocityX(pushForce);
            enemy2.setVelocityX(-pushForce);
        }
    }

    update() {
        super.update();

        // Debug info about slimes
        if (this.slimes) {
            const activeSlimes = this.slimes.getChildren().filter(slime => 
                slime.enemy && slime.enemy.health > 0
            );
            console.log(`Active slimes: ${activeSlimes.length}, Total slimes: ${this.slimes.getChildren().length}`);
            this.slimes.getChildren().forEach((slime, index) => {
                console.log(`Slime ${index} health: ${slime.enemy?.health}`);
            });
        }
    }
}
