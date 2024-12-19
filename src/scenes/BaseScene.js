import { Scene } from 'phaser';

export class BaseScene extends Scene {
    create() {
        console.log('BaseScene create() started');
        
        // Initialize score if it doesn't exist
        if (typeof this.registry.get('score') !== 'number') {
            this.registry.set('score', 0);
        }

        // Initialize lives if it doesn't exist
        if (this.registry.get('lives') === undefined) {
            this.registry.set('lives', 3);
        }

        // Initialize player HP and dying state
        this.playerHP = 100;
        this.isDying = false;

        // Set movement speeds
        this.movementSpeed = 300;  
        this.jumpSpeed = -450;     

        // Enable keyboard input
        this.input.keyboard.enabled = true;

        // Initialize player HP
        // this.playerHP = 100;

        // Create sound effects
        this.laserSound = this.sound.add('laser', { volume: 0.05 });
        this.hitSound = this.sound.add('hit', { volume: 0.1 });

        // Get screen dimensions
        const width = this.scale.width;
        const height = this.scale.height;
        console.log('Screen dimensions:', width, 'x', height);

        // Set world gravity
        this.physics.world.gravity.y = 800;
        this.physics.world.setBounds(0, 0, width, height);

        // Add ground as a rectangle instead of an image - scaled to screen width
        this.platforms = this.physics.add.staticGroup();
        const ground = this.add.rectangle(width/2, height - 100, width, 32, 0x00ff00);
        this.physics.add.existing(ground, true);
        this.platforms.add(ground);

        // Store ground top position for spawning entities (16 is half of ground height)
        this.groundTop = ground.y - 16;

        // Helper method to get spawn height for entities
        this.getSpawnHeight = () => {
            return this.groundTop - 24; // Adjust based on entity height
        };

        // Create particle manager for hit effects
        this.hitParticles = this.add.particles({
            key: 'particle',
            config: {
                x: 0,
                y: 0,
                speed: { min: 100, max: 200 },
                gravityY: 0,
                scale: { start: 1, end: 0 },
                tint: 0xffff00,  // Yellow color
                blendMode: 'ADD',
                lifespan: 300,
                quantity: 10,
                emitZone: { type: 'random', source: new Phaser.Geom.Circle(0, 0, 20) }
            }
        });

        // Create animations first
        this.createAnimations();

        // Debug texture information
        console.log('Checking character_idle texture...');
        if (this.textures.exists('character_idle')) {
            const texture = this.textures.get('character_idle');
            console.log('character_idle texture found:', texture);
            console.log('Frames:', texture.frameTotal);
            console.log('Frame dimensions:', texture.frames[0].width, 'x', texture.frames[0].height);
        } else {
            console.error('character_idle texture not found!');
        }

        // Verify animations exist before creating player
        if (!this.anims.exists('character_idle')) {
            console.error('Required animations not created. Using fallback sprite.');
            // Create a simple rectangle as fallback
            this.player = this.add.rectangle(
                this.game.config.width / 2,
                this.game.config.height / 2,
                32, 32, 0x00ff00
            );
            this.physics.add.existing(this.player);
        } else {
            console.log('Creating player sprite...');
            // Create player with physics
            this.player = this.physics.add.sprite(
                width / 2,  
                this.getSpawnHeight(),  // Spawn on ground (32 is player height)
                'character_idle'
            );

            // Scale the sprite up (since it's 32x32)
            this.player.setScale(2);

            // Set player properties
            this.player.setCollideWorldBounds(true);
            this.player.setBounce(0.1);
            this.player.setGravityY(300);
            
            // Set player body size and offset for better collisions
            this.player.body.setSize(32, 32); // Set collision box size
            this.player.body.setOffset(0, 0); // Adjust collision box position

            try {
                // Play idle animation by default
                if (this.anims.exists('character_idle')) {
                    console.log('Playing idle animation...');
                    this.player.play('character_idle');
                }
            } catch (error) {
                console.error('Error playing idle animation:', error);
            }

            console.log('Player sprite created successfully');
            console.log('Player position:', this.player.x, this.player.y);
            console.log('Player scale:', this.player.scaleX, this.player.scaleY);
            console.log('Player visible:', this.player.visible);
            console.log('Player alpha:', this.player.alpha);
        }

        // Debug info
        console.log('Player created at:', this.player.x, this.player.y);
        console.log('Player texture:', this.player.texture ? this.player.texture.key : 'No texture');
        console.log('Available animations:', this.anims.anims.entries);

        // Add colliders
        this.physics.add.collider(this.player, this.platforms);

        // Set up keyboard controls
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        // Add mouse input for shooting
        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                // Determine shooting direction based on A/D keys
                if (this.wasd.left.isDown) {
                    this.shoot('left');
                } else if (this.wasd.right.isDown) {
                    this.shoot('right');
                } else {
                    // If no direction key is pressed, shoot based on mouse position
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

        // Create score text
        this.scoreText = this.add.text(16, 16, 'Score: ' + this.registry.get('score'), {
            fontSize: '24px',
            fill: '#fff',
            fontFamily: 'Retronoid'
        });
        this.scoreText.setScrollFactor(0);

        // Create lives text
        this.livesText = this.add.text(16, 56, 'Lives: ' + this.registry.get('lives'), {
            fontSize: '24px',
            fill: '#ff0000',
            fontFamily: 'Retronoid'
        });
        this.livesText.setScrollFactor(0);

        // Create HP text
        this.hpText = this.add.text(16, 96, 'HP: ' + this.playerHP, {
            fontSize: '24px',
            fill: '#00ff00',
            fontFamily: 'Retronoid'
        });
        this.hpText.setScrollFactor(0);

        // Update score display
        const score = this.registry.get('score');
        this.scoreText.setText('Score: ' + score);

        // Initialize enemy tracking
        this.remainingEnemies = 0;
        this.nextSceneName = '';

        // Add settings button in top right
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

        // Update button text based on current music state
        const bgMusic = this.sound.get('bgMusic');
        const musicEnabled = this.registry.get('musicEnabled');
        if (bgMusic && (!bgMusic.isPlaying || musicEnabled === false)) {
            settingsButton.setText('⚙️ Music: OFF');
            if (bgMusic.isPlaying) {
                bgMusic.pause();
            }
        }
    }

    createAnimations() {
        console.log('Creating animations...');
        
        try {
            // Create idle animation
            this.anims.create({
                key: 'character_idle',
                frames: this.anims.generateFrameNumbers('character_idle', { 
                    start: 0, 
                    end: 3  // Adjust based on your sprite sheet
                }),
                frameRate: 8,
                repeat: -1
            });
            console.log('Created idle animation');

            // Create walk animation
            this.anims.create({
                key: 'character_walk',
                frames: this.anims.generateFrameNumbers('character_walk', { 
                    start: 0, 
                    end: 7  // Adjust based on your sprite sheet
                }),
                frameRate: 10,
                repeat: -1
            });
            console.log('Created walk animation');

            // Create jump animation
            this.anims.create({
                key: 'character_jump',
                frames: this.anims.generateFrameNumbers('character_jump', { 
                    start: 0, 
                    end: 3  // Adjust based on your sprite sheet
                }),
                frameRate: 10,
                repeat: 0
            });
            console.log('Created jump animation');

            // Create death animation
            this.anims.create({
                key: 'character_death',
                frames: this.anims.generateFrameNumbers('character_death', { 
                    start: 0, 
                    end: 5  // Adjust based on your sprite sheet
                }),
                frameRate: 10,
                repeat: 0
            });
            console.log('Created death animation');

            console.log('All animations created');
            console.log('Available animations:', Object.keys(this.anims.anims.entries));
            
        } catch (error) {
            console.error('Error creating animations:', error);
            console.error('Error details:', error.message);
        }
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
        // Create simple particles at hit location
        for(let i = 0; i < 10; i++) {
            const particle = this.add.circle(bullet.x, bullet.y, 3, 0xffff00);
            this.physics.add.existing(particle);
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 100;
            particle.body.setVelocity(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            );
            particle.body.setAllowGravity(false);
            
            // Fade out and destroy
            this.tweens.add({
                targets: particle,
                alpha: 0,
                scale: 0.1,
                duration: 300,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }

        // Play hit sound
        this.hitSound.play();
        
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

    hitEnemy(player, enemy) {
        // Prevent multiple hits while invulnerable or if already dead
        if (player.alpha < 1 || this.isDying) {
            return;
        }

        // Take damage
        this.playerHP -= 25; // Each hit takes 25 HP
        this.hpText.setText('HP: ' + this.playerHP);

        // Check if player died
        if (this.playerHP <= 0) {
            this.isDying = true;
            
            // Stop player movement and disable physics
            player.setVelocity(0, 0);
            player.body.moves = false;
            
            // Disable player input during death
            this.input.keyboard.enabled = false;
            this.wasd.up.reset();
            this.wasd.down.reset();
            this.wasd.left.reset();
            this.wasd.right.reset();
            
            // Reduce lives
            let lives = this.registry.get('lives');
            lives--;
            this.registry.set('lives', lives);
            this.livesText.setText('Lives: ' + lives);

            // Play death animation
            player.play('character_death');
            
            // Wait for death animation to complete
            player.once('animationcomplete', () => {
                // Wait a short moment after animation
                this.time.delayedCall(500, () => {
                    if (lives <= 0) {
                        // Reset lives for next game
                        this.registry.set('lives', 3);
                        this.scene.start('GameOver');
                    } else {
                        // Store current scene key
                        const currentScene = this.scene.key;
                        
                        // Stop current scene
                        this.scene.stop(currentScene);
                        
                        // Start fresh instance of current scene
                        this.scene.start(currentScene);
                    }
                });
            });
        } else {
            // Make player briefly invulnerable and flash
            player.alpha = 0.5;
            this.time.delayedCall(1000, () => {
                if (!this.isDying) {
                    player.alpha = 1;
                }
            });

            // Play hit sound
            this.hitSound.play();
        }
    }

    update() {
        if (!this.player || this.isDying) {
            return;
        }

        // Handle horizontal movement
        if (this.wasd.left.isDown) {
            this.player.setVelocityX(-this.movementSpeed);
            this.player.flipX = true;
            if (this.player.body.onFloor()) {
                this.player.play('character_walk', true);
            }
        } else if (this.wasd.right.isDown) {
            this.player.setVelocityX(this.movementSpeed);
            this.player.flipX = false;
            if (this.player.body.onFloor()) {
                this.player.play('character_walk', true);
            }
        } else {
            this.player.setVelocityX(0);
            if (this.player.body.onFloor()) {
                this.player.play('character_idle', true);
            }
        }

        // Handle jumping
        if (this.wasd.up.isDown && this.player.body.onFloor()) {
            this.player.setVelocityY(this.jumpSpeed);
            this.player.play('character_jump', true);
        }

        // Update displays
        if (this.scoreText) {
            this.scoreText.setText('Score: ' + this.registry.get('score'));
        }
        if (this.hpText) {
            this.hpText.setText('HP: ' + this.playerHP);
        }
    }

    handlePlayerDeath() {
        // Get current lives
        let lives = this.registry.get('lives');
        lives--;
        this.registry.set('lives', lives);
        this.livesText.setText('Lives: ' + lives);

        // Wait for death animation to complete
        this.player.once('animationcomplete-death', () => {
            if (lives <= 0) {
                // Reset lives and HP for next game
                this.registry.set('lives', 3);
                this.playerHP = 100;
                this.isDying = false;
                this.scene.start('GameOver');
            } else {
                // Reset HP and re-enable controls before restarting
                this.playerHP = 100;
                this.isDying = false;
                this.input.keyboard.enabled = true;
                this.scene.restart();
            }
        });
    }
}
