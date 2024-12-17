import { Scene } from 'phaser';

export class BaseScene extends Scene {
    create() {
        // Initialize score if it doesn't exist
        if (typeof this.registry.get('score') !== 'number') {
            this.registry.set('score', 0);
        }

        // Create sound effects
        this.laserSound = this.sound.add('laser', { volume: 0.05 });
        this.hitSound = this.sound.add('hit', { volume: 0.1 });

        // Get screen dimensions
        const width = this.scale.width;
        const height = this.scale.height;

        // Set world gravity
        this.physics.world.gravity.y = 800; // Decreased from 1000 to 800 for slightly lighter gravity

        // Add ground as a rectangle instead of an image - scaled to screen width
        this.platforms = this.physics.add.staticGroup();
        const ground = this.add.rectangle(width/2, height - 32, width, 64, 0x00ff00);
        this.physics.add.existing(ground, true);
        this.platforms.add(ground);

        // Add player as a rectangle instead of an image
        this.player = this.add.rectangle(100, height - 100, 32, 48, 0x00ffff);
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);

        // Set player's physics properties
        this.player.body.setGravityY(200);
        this.player.body.setBounce(0);

        // Initialize jump tracking
        this.wasInAir = false;

        // Create bullet group
        this.bullets = this.physics.add.group({
            defaultKey: 'bullet',
            maxSize: 10
        });

        // Add score text
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontFamily: 'Retronoid',
            fontSize: '24px',
            fill: '#fff'
        });
        this.updateScoreText();

        // Collider
        this.physics.add.collider(this.player, this.platforms);

        // WASD keys
        this.keys = this.input.keyboard.addKeys({
            up: 'W',
            left: 'A',
            down: 'S',
            right: 'D'
        });

        // Add mouse input for shooting
        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                this.shoot();
            }
        });

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
                        settingsButton.setText('⚙️ Music: OFF');
                    } else {
                        bgMusic.resume();
                        settingsButton.setText('⚙️ Music: ON');
                    }
                }
            });

        // Update button text based on current music state
        const bgMusic = this.sound.get('bgMusic');
        if (bgMusic && !bgMusic.isPlaying) {
            settingsButton.setText('⚙️ Music: OFF');
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

    shoot() {
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
            
            // Set bullet properties
            bullet.body.setVelocityX(800);
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

    hitEnemyWithBullet(bullet, enemy) {
        this.hitSound.play(); // Play hit sound when bullet hits enemy
        this.destroyBullet(bullet);
        enemy.destroy(); // Destroy the enemy when hit by bullet
        this.addPoints(10);
    }

    update() {
        // Player movement with WASD
        const moveSpeed = this.scale.width * 0.2; // Scale movement speed with screen width
        
        if (this.keys.left.isDown) {
            this.player.body.setVelocityX(-moveSpeed);
        }
        else if (this.keys.right.isDown) {
            this.player.body.setVelocityX(moveSpeed);
        }
        else {
            this.player.body.setVelocityX(0);
        }

        // Jump when touching ground
        if (this.keys.up.isDown && this.player.body.touching.down) {
            this.player.body.setVelocityY(-250);
        }

        // Clean up bullets that are out of bounds
        this.bullets.children.each((bullet) => {
            if (bullet.active && (bullet.x < 0 || bullet.x > this.scale.width)) {
                this.destroyBullet(bullet);
            }
        });
    }

    hitEnemy(player, enemy) {
        this.scene.restart();
    }
}
