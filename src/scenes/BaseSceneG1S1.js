import { Scene } from 'phaser';

var playState = {
    player: null,
    platforms: null,
    cursors: null,
    laser: null,
    scoreText: null,
    score: 0,
    lives: 3
}

export class BaseSceneG1S1 extends Scene {
    preload() {
        // Load the tileset image
        this.load.image('Buildings', 'assets/sprites/Buildings.png');
        // Load the LDtk level file
        this.load.json('levelData', 'assets/G1S1/G1S1/Level_0.ldtkl');
    }

    create() {
        console.log('BaseSceneG1S1 create() started');
        
        // Initialize score if it doesn't exist
        if (typeof this.registry.get('score') !== 'number') {
            this.registry.set('score', 0);
        }

        // Initialize lives if it doesn't exist
        if (this.registry.get('lives') === undefined) {
            this.registry.set('lives', 3);
        }

        // Create sound effects
        this.laserSound = this.sound.add('laser', { volume: 0.05 });
        this.hitSound = this.sound.add('hit', { volume: 0.1 });

        // Get screen dimensions
        const { width: screenWidth, height: screenHeight } = this.scale;
        console.log('Screen dimensions:', screenWidth, 'x', screenHeight);

        // Set world gravity
        this.physics.world.gravity.y = 800;
        this.physics.world.setBounds(0, 0, screenWidth, screenHeight);

        // Load and create the level
        this.createLevel();

        // Create animations
        this.createAnimations();

        // Create player after level
        this.createPlayer();

        // Set up keyboard controls
        this.cursors = this.input.keyboard.createCursorKeys();
        // Add WASD keys for movement
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        // Add mouse input for shooting
        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                if (this.wasd.left.isDown) {
                    this.shoot('left');
                } else if (this.wasd.right.isDown) {
                    this.shoot('right');
                } else {
                    const mouseX = pointer.x;
                    const playerX = this.player.x;
                    this.shoot(mouseX < playerX ? 'left' : 'right');
                }
            }
        });

        // Create bullet group
        this.bullets = this.physics.add.group({
            defaultKey: 'bullet',
            maxSize: 10
        });

        // Create UI elements
        this.createUI();
    }

    createLevel() {
        // Load the level data
        const levelData = this.cache.json.get('levelData');
        if (!levelData) {
            console.error('Level data not found!');
            return;
        }

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
        
        // Process layers from bottom to top
        const layerInstances = [...levelData.layerInstances].reverse();
        
        this.layers = layerInstances.map(layerInstance => {
            const layer = map.createBlankLayer(layerInstance.__identifier, tileset, 0, 0);
            if (!layer) {
                console.error('Failed to create layer:', layerInstance.__identifier);
                return null;
            }
            
            // Place tiles
            layerInstance.gridTiles.forEach(tile => {
                const x = Math.floor(tile.px[0] / layerInstance.__gridSize);
                const y = Math.floor(tile.px[1] / layerInstance.__gridSize);
                const srcX = Math.floor(tile.src[0] / 16);
                const srcY = Math.floor(tile.src[1] / 16);
                const tileIndex = srcY * 20 + srcX;
                
                try {
                    const placedTile = layer.putTileAt(tileIndex, x, y);
                    if (placedTile) {
                        placedTile.setFlip(false, false);
                        placedTile.tint = 0xffffff;
                    }
                } catch (error) {
                    console.error('Error placing tile:', error);
                }
            });

            layer.setVisible(true);
            layer.setAlpha(1);

            // Store the Buildings layer for collisions
            if (layerInstance.__identifier === 'Buildings') {
                this.buildingsLayer = layer;
            }

            return layer;
        }).filter(layer => layer !== null);
    }

    createPlayer() {
        const { width: screenWidth } = this.scale;

        if (!this.anims.exists('idle')) {
            console.error('Required animations not created. Using fallback sprite.');
            this.player = this.add.rectangle(
                screenWidth / 2,
                this.scale.height - 32, // Place on ground
                32, 32, 0x00ff00
            );
            this.physics.add.existing(this.player);
        } else {
            this.player = this.physics.add.sprite(
                screenWidth * 0.1,
                this.scale.height - 32, // Place on ground
                'character_idle'
            );

            this.player.setScale(1, 2); // Scale: 1x width, 2x height
            this.player.setCollideWorldBounds(true);
            this.player.setBounce(0.1);
            this.player.setGravityY(300);
            this.player.body.setSize(16, 32); // Collision box: 1 tile wide, 2 tiles tall
            this.player.body.setOffset(8, 0); // Center the collision box

            try {
                if (this.anims.exists('idle')) {
                    this.player.play('idle');
                }
            } catch (error) {
                console.error('Error playing idle animation:', error);
            }
        }

        // Add collider with the Buildings layer
        if (this.buildingsLayer) {
            this.buildingsLayer.setCollisionByProperty({ collision: true });
            this.physics.add.collider(this.player, this.buildingsLayer);
        }
    }

    createAnimations() {
        console.log('Creating animations...');
        
        // Check if textures exist before creating animations
        const textureKeys = ['character_idle', 'character_run', 'character_jump'];
        textureKeys.forEach(key => {
            if (!this.textures.exists(key)) {
                console.error(`Missing texture: ${key}`);
                return;
            }
            console.log(`Found texture: ${key} with ${this.textures.get(key).frameTotal} frames`);
        });

        try {
            // Create idle animation
            this.anims.create({
                key: 'idle',
                frames: this.anims.generateFrameNumbers('character_idle', { 
                    start: 0, 
                    end: 4  
                }),
                frameRate: 8,
                repeat: -1
            });
            console.log('Created idle animation');

            // Create run animation
            this.anims.create({
                key: 'run',
                frames: this.anims.generateFrameNumbers('character_run', { 
                    start: 0, 
                    end: 6  
                }),
                frameRate: 10,
                repeat: -1
            });
            console.log('Created run animation');

            // Create jump animation
            this.anims.create({
                key: 'jump',
                frames: this.anims.generateFrameNumbers('character_jump', { 
                    start: 0, 
                    end: 2  
                }),
                frameRate: 10,
                repeat: 0
            });
            console.log('Created jump animation');
            
        } catch (error) {
            console.error('Error creating animations:', error);
        }
    }

    createUI() {
        const { width, height } = this.scale;

        // Create score text
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '24px',
            fill: '#fff',
            fontFamily: 'Retronoid'
        });
        this.scoreText.setScrollFactor(0);

        // Create lives display
        this.livesText = this.add.text(16, 56, 'Lives: ' + this.registry.get('lives'), {
            fontSize: '24px',
            fill: '#ff0000',
            fontFamily: 'Retronoid'
        });
        this.livesText.setScrollFactor(0);

        // Update score display
        const score = this.registry.get('score');
        this.scoreText.setText('Score: ' + score);

        // Initialize enemy tracking
        this.remainingEnemies = 0;
        this.nextSceneName = '';

        // Add settings button
        const settingsButton = this.add.text(width - 100, 20, '⚙️ Music', {
            fontSize: '20px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        }).setOrigin(1, 0);

        settingsButton.setInteractive({ useHandCursor: true })
            .on('pointerover', () => settingsButton.setStyle({ fill: '#ff0' }))
            .on('pointerout', () => settingsButton.setStyle({ fill: '#fff' }))
            .on('pointerdown', () => {
                const bgMusic = this.sound.get('bgMusic');
                if (bgMusic) {
                    if (bgMusic.isPlaying) {
                        bgMusic.pause();
                        this.registry.set('musicEnabled', false);
                        settingsButton.setText('⚙️ Music: OFF');
                    } else {
                        bgMusic.resume();
                        this.registry.set('musicEnabled', true);
                        settingsButton.setText('⚙️ Music: ON');
                    }
                }
            });
    }

    updateScoreText() {
        const score = this.registry.get('score');
        this.scoreText.setText('Score: ' + score);
    }

    addPoints(points) {
        const currentScore = this.registry.get('score');
        this.registry.set('score', currentScore + points);
        this.updateScoreText();
    }

    shoot(direction = 'right') {
        // Create bullet as a rectangle
        const bullet = this.add.rectangle(this.player.x, this.player.y, 10, 5, 0xFFFF00);
        this.bullets.add(bullet);

        if (bullet) {
            // Play laser sound
            this.laserSound.play();

            bullet.setActive(true);
            bullet.setVisible(true);

            // Add physics to the bullet
            this.physics.add.existing(bullet);

            // Set bullet properties based on direction
            const bulletSpeed = 800;
            bullet.body.setVelocityX(direction === 'left' ? -bulletSpeed : bulletSpeed);
            bullet.body.setAllowGravity(false);
            bullet.body.setCollideWorldBounds(true);
            bullet.body.onWorldBounds = true;

            // Destroy bullet when it hits world bounds
            bullet.body.world.on('worldbounds', (body) => {
                if (body.gameObject === bullet) {
                    this.destroyBullet(bullet);
                }
            });
        }
    }

    destroyBullet(bullet) {
        bullet.setActive(false);
        bullet.setVisible(false);
        bullet.body.enable = false;
    }

    hitEnemyWithBullet(bullet, enemySprite) {
        bullet.destroy();
        
        // Find the enemy object that owns this sprite
        const enemy = [this.enemy1, this.enemy2].find(e => e && e.sprite === enemySprite);
        if (enemy) {
            enemy.currentHealth--;
            if (enemy.currentHealth <= 0) {
                enemy.sprite.destroy();
                this.remainingEnemies--;
                
                // Check if all enemies are defeated
                if (this.remainingEnemies <= 0 && this.nextSceneName) {
                    this.add.text(this.scale.width/2, this.scale.height/2, 'Level Complete!\nPress SPACE to continue', {
                        fontSize: '32px',
                        fill: '#fff',
                        align: 'center'
                    }).setOrigin(0.5);
                    
                    // Listen for spacebar to transition
                    this.input.keyboard.once('keydown-SPACE', () => {
                        this.scene.start(this.nextSceneName);
                    });
                }
            }
        }
    }

    update() {
        if (!this.player) return;

        // Update lives display
        if (this.livesText) {
            this.livesText.setText('Lives: ' + this.registry.get('lives'));
        }

        // Update score display
        if (this.scoreText) {
            this.scoreText.setText('Score: ' + this.registry.get('score'));
        }

        // Only handle animations if player is a sprite (not a rectangle fallback)
        const isSprite = this.player.hasOwnProperty('play');
        
        // Handle horizontal movement
        if (this.wasd.left.isDown) {
            this.player.setVelocityX(-300);
            if (isSprite) {
                this.player.flipX = true;
                if (this.player.body.onFloor() && this.anims.exists('run')) {
                    try {
                        this.player.play('run', true);
                    } catch (error) {
                        console.error('Error playing run animation:', error);
                    }
                }
            }
        } else if (this.wasd.right.isDown) {
            this.player.setVelocityX(300);
            if (isSprite) {
                this.player.flipX = false;
                if (this.player.body.onFloor() && this.anims.exists('run')) {
                    try {
                        this.player.play('run', true);
                    } catch (error) {
                        console.error('Error playing run animation:', error);
                    }
                }
            }
        } else {
            this.player.setVelocityX(0);
            if (isSprite && this.player.body.onFloor() && this.anims.exists('idle')) {
                try {
                    this.player.play('idle', true);
                } catch (error) {
                    console.error('Error playing idle animation:', error);
                }
            }
        }

        // Handle jumping
        if (this.wasd.up.isDown && this.player.body.onFloor()) {
            this.player.setVelocityY(-500);
            if (isSprite && this.anims.exists('jump')) {
                try {
                    this.player.play('jump', true);
                } catch (error) {
                    console.error('Error playing jump animation:', error);
                }
            }
        }

        // Clean up bullets that are out of bounds
        this.bullets.children.each((bullet) => {
            if (bullet.active && (bullet.x < 0 || bullet.x > this.scale.width)) {
                this.destroyBullet(bullet);
            }
        });
    }

    hitEnemy(player, enemy) {
        this.handlePlayerDeath();
    }

    handlePlayerDeath() {
        // Decrease lives
        let lives = this.registry.get('lives');
        lives--;
        this.registry.set('lives', lives);

        if (lives <= 0) {
            // Game Over - Transition to GameOver scene
            this.scene.start('GameOver');
        } else {
            // Restart current scene
            this.scene.restart();
        }
    }
}
