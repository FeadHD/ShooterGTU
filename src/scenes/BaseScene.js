import { Scene } from 'phaser';

export class BaseScene extends Scene {
    create() {
        // Initialize score if it doesn't exist
        if (typeof this.registry.get('score') !== 'number') {
            this.registry.set('score', 0);
        }

        // Get screen dimensions
        const width = this.scale.width;
        const height = this.scale.height;

        // Add ground as a rectangle instead of an image - scaled to screen width
        this.platforms = this.physics.add.staticGroup();
        const ground = this.add.rectangle(width/2, height - 50, width, 60, 0x00ff00);
        this.physics.add.existing(ground, true);
        this.platforms.add(ground);

        // Add player as a rectangle instead of an image
        this.player = this.add.rectangle(100, height - 100, 32, 48, 0x00ffff);
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);

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

        if (this.keys.up.isDown && this.player.body.touching.down) {
            this.player.body.setVelocityY(-moveSpeed * 1.2);
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
