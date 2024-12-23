import { BaseScene } from '../elements/BaseScene';
import { RobotBoss } from '../../prefabs/RobotBoss';
import { GameUI } from '../elements/GameUI';

export class GameScene5 extends BaseScene {
    constructor() {
        super({ key: 'GameScene5' });
        this.bossDefeated = false;
    }

    preload() {
        // Load victory music
        this.load.audio('victoryMusic', 'assets/sounds/congratulations.mp3');
    }

    create() {
        console.log('Creating Scene 5...'); // Debug log
        this.cameras.main.setBackgroundColor('#1A1A1A');
        super.create();

        const { width, height } = this.scale;

        // Set player to left side
        this.player.x = width * 0.1;

        // Set up the main game camera
        this.cameras.main.setZoom(1.5);
        this.cameras.main.setBounds(0, 0, width, height);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // Set up UI
        this.gameUI = new GameUI(this);
        
        // Make sure UI stays fixed
        this.gameUI.container.setScrollFactor(0);

        // Add scene text
        this.add.text(width/2, height * 0.1, 'Boss Room - Scene 5', {
            fontFamily: 'Retronoid',
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Clean up any existing boss
        if (this.boss) {
            this.boss.destroy();
            this.boss = null;
        }

        // Wait a short moment for platforms to be fully set up
        this.time.delayedCall(100, () => {
            // Create the RobotBoss at the right side
            const bossY = this.groundTop - 92;
            this.boss = new RobotBoss(this, width * 0.8, bossY);

            // Set up collisions
            this.physics.add.collider(this.boss, this.platforms);
            this.physics.add.collider(this.player, this.boss, this.hitEnemy, null, this);

            // Add collision between player and boss lasers
            this.physics.add.overlap(
                this.player,
                this.boss.lasers,
                (player, laser) => {
                    this.hitEnemy(player, laser);
                    laser.destroy();
                }
            );

            // Add bullet collisions with boss
            this.physics.add.overlap(
                this.bullets,
                this.boss,
                (boss, bullet) => {
                    this.hitBoss(bullet, boss);
                }
            );

            this.physics.add.collider(this.bullets, this.platforms);
            this.physics.add.collider(this.boss.lasers, this.platforms, (laser) => laser.destroy());

            // Add invisible wall on the left to prevent going back
            const wall = this.add.rectangle(0, height/2, 20, height, 0x000000, 0);
            this.physics.add.existing(wall, true);
            this.physics.add.collider(this.player, wall);

            // Set total enemies (just the boss)
            this.remainingEnemies = 1;
        });

        // Load victory music if not already loaded
        if (!this.sound.get('victoryMusic')) {
            this.load.audio('victoryMusic', 'assets/sounds/congratulations.mp3');
            this.load.start();
        }

        console.log('Scene 5 created successfully'); // Debug log
    }

    hitBoss(bullet, boss) {
        // Create particles at hit location
        for(let i = 0; i < 10; i++) {
            const particle = this.add.circle(bullet.x, bullet.y, 3, 0xffff00);
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 100;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            this.tweens.add({
                targets: particle,
                x: particle.x + (vx * 0.3),
                y: particle.y + (vy * 0.3),
                alpha: 0,
                scale: 0.1,
                duration: 300,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }

        this.hitSound.play();
        bullet.destroy();
        
        // Deal damage to boss
        this.boss.takeDamage(1);
        
        // Check if boss is defeated
        if (this.boss.health <= 0) {
            console.log('Boss defeated!');
            this.addPoints(100); // Big points for killing the boss
            this.bossDefeated = true;
            this.remainingEnemies = 0;

            // Add completion text without space key requirement
            this.add.text(this.scale.width/2, this.scale.height/2, 'Boss Defeated!\nHead right to complete the mission', {
                fontSize: '32px',
                fill: '#fff',
                align: 'center'
            }).setOrigin(0.5).setScrollFactor(0);

            // Play victory music
            if (this.victoryMusic && !this.victoryMusic.isPlaying) {
                this.victoryMusic.play();
            }

            // Disable world bounds collision on the right side
            this.player.body.setCollideWorldBounds(false);
            
            // Set the world bounds to allow moving past the right edge
            this.physics.world.setBounds(0, 0, this.scale.width * 2, this.scale.height);
        }
    }

    update() {
        super.update();

        // Update boss if it exists
        if (this.boss && this.boss.active) {
            this.boss.update();
            
            // Keep boss above ground
            if (this.boss.y > this.groundTop - 92) {
                this.boss.y = this.groundTop - 92;
                this.boss.body.setVelocityY(0);
            }
        }

        // Check for scene transition when boss is defeated AND player reaches right side
        if (this.bossDefeated && this.player.x > this.scale.width - 100) {
            console.log('Transitioning to MissionComplete scene');
            if (this.sound.get('bgMusic')) {
                this.sound.get('bgMusic').stop();
            }
            this.scene.start('MissionComplete');
        }
    }
}
