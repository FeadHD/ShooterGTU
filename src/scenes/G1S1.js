import { BaseScene, BaseSceneG1S1 } from './BaseSceneG1S1';
import { StrongEnemy } from './EnemyTypes';

export class G1S1 extends BaseSceneG1S1 {
    constructor() {
        super({ key: 'G1S1' });
    }

    preload() {        
        console.log('G1S1 preload() started');
        
        // Load the tileset image
        this.load.image('Buildings', 'assets/sprites/Buildings.png');
        
        // Load the LDtk level file
        this.load.json('levelData', 'assets/G1S1/G1S1/Level_0.ldtkl');
        
        // Add load complete event listener
        this.load.on('complete', () => {
            console.log('All assets loaded');
            // Check if Buildings texture exists
            if (this.textures.exists('Buildings')) {
                const texture = this.textures.get('Buildings');
                console.log('Buildings texture loaded:', {
                    width: texture.width,
                    height: texture.height,
                    frameTotal: texture.frameTotal
                });
            } else {
                console.error('Buildings texture failed to load!');
            }
        });
    }

    create() {
        // Call super.create() first to set up the player and other base elements
        super.create();

        // Get screen dimensions
        const { width, height } = this.scale;

        // Load the level data
        const levelData = this.cache.json.get('levelData');
        console.log('Level data:', levelData);
        
        // Calculate scale factors to fit the level to the screen
        // Add some padding (0.9) to not fill the entire screen
        const scaleX = (width * 0.9) / levelData.pxWid;
        const scaleY = (height * 0.9) / levelData.pxHei;
        const scale = Math.min(scaleX, scaleY); // Use the smaller scale to maintain aspect ratio
        
        // Create a tilemap
        const map = this.make.tilemap({ 
            width: levelData.pxWid / 16,
            height: levelData.pxHei / 16,
            tileWidth: 16,
            tileHeight: 16
        });
        
        // Add the tileset
        const tileset = map.addTilesetImage('Buildings', 'Buildings', 16, 16);
        if (!tileset) {
            console.error('Failed to create tileset!');
            return;
        }
        console.log('Tileset created:', tileset);
        
        // Create a container for the map layers
        const mapContainer = this.add.container(0, 0);

        // Create a ground platform that spans the width of the screen
        const groundHeight = 16; // One tile height
        const ground = this.add.rectangle(width/2, height - groundHeight/2, width, groundHeight, 0x333333);
        this.physics.add.existing(ground, true); // true makes it static
        
        // Add collider between ground and player
        this.physics.add.collider(this.player, ground);

        // Process layers from bottom to top
        const layerInstances = [...levelData.layerInstances].reverse();
        
        // Create layers for each layer instance in the LDtk file
        const layers = layerInstances.map(layerInstance => {
            console.log('Processing layer:', layerInstance.__identifier);
            
            // Create a blank layer
            const layer = map.createBlankLayer(layerInstance.__identifier, tileset, 0, 0);
            if (!layer) {
                console.error('Failed to create layer:', layerInstance.__identifier);
                return null;
            }
            
            // Place all tiles from the gridTiles array
            layerInstance.gridTiles.forEach((tile, index) => {
                const x = Math.floor(tile.px[0] / layerInstance.__gridSize);
                const y = Math.floor(tile.px[1] / layerInstance.__gridSize);
                
                // Calculate the correct tile index from the source coordinates
                const srcX = Math.floor(tile.src[0] / 16);
                const srcY = Math.floor(tile.src[1] / 16);
                const tilesetWidth = 20;
                const tileIndex = srcY * tilesetWidth + srcX;
                
                try {
                    const placedTile = layer.putTileAt(tileIndex, x, y);
                    if (placedTile) {
                        placedTile.setFlip(false, false);
                        placedTile.tint = 0xffffff;
                        
                        // Enable collision for all tiles in the Buildings layer
                        if (layerInstance.__identifier === 'Buildings') {
                            placedTile.properties = { collision: true };
                            placedTile.setCollision(true);
                        }
                    }
                } catch (error) {
                    console.error('Error placing tile:', error);
                }
            });

            // Make sure the layer is visible
            layer.setVisible(true);
            layer.setAlpha(1);
            
            // Add the layer to the container
            mapContainer.add(layer);

            // Set up collisions for this layer if it's the Buildings layer
            if (layerInstance.__identifier === 'Buildings' && this.player) {
                layer.setCollision(0, layer.tilemap.tilesets[0].total - 1, true); // Enable collision for all tiles
                this.physics.add.collider(this.player, layer);
                this.buildingsLayer = layer; // Store reference to buildings layer
            }

            return layer;
        }).filter(layer => layer !== null);

        // Center and scale the container
        mapContainer.setScale(scale);
        mapContainer.setPosition(
            (width - (levelData.pxWid * scale)) / 2,
            (height - (levelData.pxHei * scale)) / 2
        );

        // Add scene text
        this.add.text(width/2, height * 0.1, 'Scene 4', {
            fontFamily: 'Retronoid',
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Set next scene
        this.nextSceneName = 'GameScene1';
        
        // Create enemy group with physics
        this.enemies = this.physics.add.group({
            bounceX: 0.2,
            bounceY: 0.2,
            collideWorldBounds: true
        });

        // Wait a short moment for the level to be fully set up
        this.time.delayedCall(100, () => {
            // Calculate ground position based on screen height and enemy height
            const groundY = height - 48; // Adjusted to account for enemy's height (32 pixels) and some padding

            // Create two strong enemies at different positions
            this.enemy1 = new StrongEnemy(this, width * 0.3, groundY);
            this.enemy2 = new StrongEnemy(this, width * 0.7, groundY);

            // Add enemies to the group and set up their physics
            const enemies = [this.enemy1, this.enemy2];
            enemies.forEach(enemy => {
                if (enemy.sprite) {
                    enemy.sprite.setScale(1, 2); // Scale: 1x width, 2x height
                    this.enemies.add(enemy.sprite);
                    
                    // Set up enemy physics body properties
                    enemy.sprite.body.setBounce(0.2);
                    enemy.sprite.body.setCollideWorldBounds(true);
                    enemy.sprite.body.setGravityY(300);
                    enemy.sprite.body.setSize(16, 32); // Collision box: 1 tile wide, 2 tiles tall
                    enemy.sprite.body.setOffset(8, 0); // Center the collision box
                }
            });

            // Set up all collisions
            if (this.buildingsLayer) {
                // Enemy collisions with buildings and platforms
                this.physics.add.collider(this.enemies, this.buildingsLayer);
                
                // Make sure enemies can't pass through each other
                this.physics.add.collider(this.enemies, this.enemies);
            }

            // Add collider between enemies and ground
            this.physics.add.collider(this.enemies, ground);

            // Player collisions with enemies
            this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, null, this);
            
            // Bullet collisions with enemies
            if (this.bullets) {
                this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemyWithBullet, null, this);
            }

            // Add invisible walls to prevent going off screen
            const wallThickness = 20;
            
            // Left wall
            const leftWall = this.add.rectangle(0, height/2, wallThickness, height, 0x000000, 0);
            this.physics.add.existing(leftWall, true);
            this.physics.add.collider(this.player, leftWall);
            this.physics.add.collider(this.enemies, leftWall);

            // Right wall
            const rightWall = this.add.rectangle(width, height/2, wallThickness, height, 0x000000, 0);
            this.physics.add.existing(rightWall, true);
            this.physics.add.collider(this.player, rightWall);
            this.physics.add.collider(this.enemies, rightWall);

            // Initialize enemy count
            this.remainingEnemies = enemies.length;
        });

        // Flag to track if all enemies are defeated
        this.allEnemiesDefeated = false;

        // Set background color
        this.cameras.main.setBackgroundColor('#2A2A2A');
    }

    processTileLayer(layer, layerDef) {
        // Get the tileset data
        const tilesetData = layerDef.tilesetDefUid;
        
        // Process each tile in the layer
        if (layerDef.autoTiles) {
            layerDef.autoTiles.forEach(tile => {
                const x = Math.floor(tile.px[0] / layerDef.gridSize);
                const y = Math.floor(tile.px[1] / layerDef.gridSize);
                layer.putTileAt(tile.tileId, x, y);
            });
        }
    }

    hitEnemyWithBullet(bullet, enemySprite) {
        this.hitSound.play(); // Play hit sound
        bullet.destroy();
        
        // Find the enemy object that owns this sprite
        const enemy = [this.enemy1, this.enemy2].find(e => e.sprite === enemySprite);
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

    hitEnemy(player, enemySprite) {
        // Only process the collision if both objects exist and are active
        if (!player.active || !enemySprite.active) return;

        // Find the enemy instance that matches this sprite
        const enemies = [this.enemy1, this.enemy2];
        const enemy = enemies.find(e => e.sprite === enemySprite);
        
        if (enemy) {
            // Player is above the enemy and moving down
            if (player.y < enemySprite.y && player.body.velocity.y > 0) {
                // Bounce off enemy
                player.setVelocityY(-300);
                
                // Damage enemy
                if (enemy.damage(1) && this.hitSound) {
                    this.hitSound.play();
                }
            } 
            //else {
                // Player takes damage
           //     this.handlePlayerDeath();
          //  }
        }
    }

    update() {
        super.update();

        // Update enemy patrols
        if (this.enemy1) this.enemy1.update();
        if (this.enemy2) this.enemy2.update();

        // Check for scene transition
        if (this.allEnemiesDefeated && this.player.x > this.scale.width - 20) {
            console.log('Transitioning to Scene 5...'); // Debug log
            // Stop any current music
            if (this.sound.get('backgroundMusic')) {
                this.sound.get('backgroundMusic').stop();
            }
            this.scene.start('GameScene5');
            console.log('Scene 5 started'); // Debug log
        }
    }
}
