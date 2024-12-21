import { Scene } from 'phaser';

export class BaseScene extends Scene {
    create() {
        // Initialize game state
        if (this.registry.get('score') === undefined) {
            this.registry.set('score', 0);
        }
        // Always ensure lives are set to 3 at the start of a new game
        if (this.registry.get('lives') === undefined || this.registry.get('lives') <= 0) {
            this.registry.set('lives', 3);
        }
        // Initialize HP only if it's not set
        if (this.registry.get('playerHP') === undefined) {
            this.registry.set('playerHP', 100);
        }
        this.playerHP = this.registry.get('playerHP');
        this.isDying = false;
        this.movementSpeed = 300;
        this.jumpSpeed = -450;
        this.input.keyboard.enabled = true;  // Ensure keyboard is enabled on scene start

        // Set up world
        const { width, height } = this.scale;
        this.physics.world.gravity.y = 800;
        this.physics.world.setBounds(0, 0, width, height);

        // Create ground
        this.platforms = this.physics.add.staticGroup();
        
        // Calculate ground dimensions
        const groundTop = height - 100;  // Keep the same top position
        const groundHeight = height - groundTop;  // Height from top position to bottom of screen
        
        // Create gradient ground using graphics
        const groundGraphics = this.add.graphics();
        
        // Define gradient colors (metallic grays with subtle blue tint)
        const topColor = 0x9BA7B5;    // Light metallic gray with slight blue tint
        const midColor = 0x6A7A8C;    // Medium steel gray with blue tint
        const bottomColor = 0x2C3540;  // Dark gunmetal gray with blue tint
        
        // Create gradient fill
        groundGraphics.clear();
        
        // Define panel properties
        const panelCount = 8;  // Number of large panels
        const panelHeight = groundHeight / panelCount;
        const lineThickness = 1;  // Thickness of separator lines
        const lineAlpha = 0.3;    // Transparency of lines (subtle)
        const lineBrightness = 1.2;  // How much lighter the lines are than the background
        
        // Draw panels with gradient and separator lines
        for (let i = 0; i < panelCount; i++) {
            const panelTop = groundTop + (i * panelHeight);
            const ratio = i / (panelCount - 1);
            
            // Calculate base color for this panel
            let panelColor;
            if (ratio < 0.5) {
                // Blend from top to mid color
                const blendRatio = ratio * 2;
                panelColor = this.blendColors(topColor, midColor, blendRatio);
            } else {
                // Blend from mid to bottom color
                const blendRatio = (ratio - 0.5) * 2;
                panelColor = this.blendColors(midColor, bottomColor, blendRatio);
            }
            
            // Draw panel background
            groundGraphics.fillStyle(panelColor, 1);
            groundGraphics.fillRect(0, panelTop, width, panelHeight);
            
            // Draw subtle tech details within each panel
            const lineColor = this.lightenColor(panelColor, lineBrightness);
            groundGraphics.lineStyle(lineThickness, lineColor, lineAlpha);
            
            // Draw horizontal separator line at bottom of panel
            groundGraphics.beginPath();
            groundGraphics.moveTo(0, panelTop + panelHeight);
            groundGraphics.lineTo(width, panelTop + panelHeight);
            groundGraphics.strokePath();
            
            // Draw some subtle vertical lines (tech details)
            const verticalLines = 6;  // Number of vertical lines per panel
            for (let j = 1; j < verticalLines; j++) {
                const x = (width / verticalLines) * j;
                const lineHeight = panelHeight * 0.3;  // Lines are 30% of panel height
                const lineY = panelTop + (panelHeight - lineHeight) / 2;
                
                groundGraphics.beginPath();
                groundGraphics.moveTo(x, lineY);
                groundGraphics.lineTo(x, lineY + lineHeight);
                groundGraphics.strokePath();
            }
        }

        // Create tech line graphics (separate layer for glow effect)
        const techLinesGraphics = this.add.graphics();
        
        // Define tech line properties
        const glowColor = 0x00FFFF;  // Cyan color for tech feel
        const glowAlpha = 0.3;       // Base transparency
        const glowThickness = 1;     // Line thickness
        const numTechLines = 12;     // Number of glowing lines
        const techLineSpacing = groundHeight / numTechLines;
        
        // Create container for blinking lights
        this.techLights = [];
        
        // Draw glowing tech lines and add lights
        techLinesGraphics.lineStyle(glowThickness, glowColor, glowAlpha);
        
        for (let i = 0; i < numTechLines; i++) {
            const y = groundTop + (i * techLineSpacing);
            
            // Draw main line
            techLinesGraphics.beginPath();
            techLinesGraphics.moveTo(0, y);
            techLinesGraphics.lineTo(width, y);
            techLinesGraphics.strokePath();
            
            // Add glow effect by drawing multiple semi-transparent lines
            const glowLayers = 3;
            for (let g = 1; g <= glowLayers; g++) {
                const glowOffset = g * 0.5;
                const layerAlpha = glowAlpha / (g * 2);
                
                techLinesGraphics.lineStyle(glowThickness, glowColor, layerAlpha);
                
                // Draw line above
                techLinesGraphics.beginPath();
                techLinesGraphics.moveTo(0, y - glowOffset);
                techLinesGraphics.lineTo(width, y - glowOffset);
                techLinesGraphics.strokePath();
                
                // Draw line below
                techLinesGraphics.beginPath();
                techLinesGraphics.moveTo(0, y + glowOffset);
                techLinesGraphics.lineTo(width, y + glowOffset);
                techLinesGraphics.strokePath();
            }

            // Add blinking lights along this line
            const numLights = 8;  // Number of lights per line
            for (let j = 1; j < numLights; j++) {
                const x = (width / numLights) * j;
                
                // Create light graphics
                const light = this.add.graphics();
                
                // Randomize light properties
                const lightSize = 2 + Math.random() * 2;  // Random size between 2-4 pixels
                const baseColor = Math.random() < 0.7 ? 0x00FFFF : 0xFFFFFF;  // 70% cyan, 30% white
                const baseAlpha = 0.1 + Math.random() * 0.2;  // Random base alpha
                
                // Draw the light
                light.fillStyle(baseColor, baseAlpha);
                light.fillCircle(x, y, lightSize);
                
                // Add glow effect
                const glowSize = lightSize * 1.5;
                light.fillStyle(baseColor, baseAlpha * 0.5);
                light.fillCircle(x, y, glowSize);
                
                // Store light reference
                this.techLights.push(light);
                
                // Create blinking animation
                const blinkDuration = 1500 + Math.random() * 3000;  // Random duration between 1.5-4.5 seconds
                const delay = Math.random() * 2000;  // Random delay up to 2 seconds
                
                this.tweens.add({
                    targets: light,
                    alpha: { from: 1, to: 0.1 },
                    duration: blinkDuration,
                    yoyo: true,
                    repeat: -1,
                    delay: delay,
                    ease: 'Sine.easeInOut'
                });
            }
        }

        // Store tech lines graphics for animation
        this.techLinesGraphics = techLinesGraphics;
        
        // Add subtle pulse animation to tech lines
        this.tweens.add({
            targets: techLinesGraphics,
            alpha: 0.1,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Create invisible rectangle for collision
        const ground = this.add.rectangle(
            width/2,
            groundTop + groundHeight/2,
            width,
            groundHeight
        );
        ground.setAlpha(0);  // Make it invisible since we're using the graphics for visuals
        
        // Add physics and collision
        this.physics.add.existing(ground, true);
        this.platforms.add(ground);
        
        // Store ground top position for spawning entities
        this.groundTop = groundTop;
        this.getSpawnHeight = () => this.groundTop - 24;

        // Create particles and sounds
        this.hitParticles = this.add.particles({
            key: 'particle',
            config: {
                speed: { min: 100, max: 200 },
                scale: { start: 1, end: 0 },
                tint: 0xffff00,
                blendMode: 'ADD',
                lifespan: 300,
                quantity: 10,
                emitZone: { type: 'random', source: new Phaser.Geom.Circle(0, 0, 20) }
            }
        });
        this.laserSound = this.sound.add('laser', { volume: 0.05 });
        this.hitSound = this.sound.add('hit', { volume: 0.1 });

        // Create bullet sprite for the group to use
        const size = 16;
        const bulletTexture = this.add.renderTexture(0, 0, size, size);
        
        // Create bullet tip (pointed end)
        const tip = this.add.triangle(size/2, size/4, 
            0, 6,      // point 1
            4, 0,      // point 2
            -4, 0,     // point 3
            0xcccccc   // silver color
        );
        
        // Create bullet body (main part)
        const body = this.add.rectangle(size/2, size/2 + 2, 6, 8, 0xb8b8b8);
        
        // Create casing rim
        const rim = this.add.rectangle(size/2, size/2 + 6, 8, 2, 0x999999);
        
        // Create highlight for metallic effect
        const highlight = this.add.rectangle(size/2 - 1, size/2, 1, 6, 0xffffff);
        highlight.setAlpha(0.5);
        
        // Draw all parts to create the complete bullet
        bulletTexture.draw(body);    // Draw main body first
        bulletTexture.draw(tip);     // Draw tip
        bulletTexture.draw(rim);     // Draw rim
        bulletTexture.draw(highlight); // Add highlight
        
        // Save the composite texture
        bulletTexture.saveTexture('bulletTexture');
        
        // Clean up temporary objects
        tip.destroy();
        body.destroy();
        rim.destroy();
        highlight.destroy();
        bulletTexture.destroy();

        // Create bullet group with physics
        this.bullets = this.physics.add.group({
            defaultKey: 'bullet_animation',
            maxSize: -1,  // Remove bullet limit
            createCallback: (bullet) => {
                bullet.setScale(1);
                bullet.setAlpha(1);
                bullet.body.setAllowGravity(false);
                bullet.body.setSize(24, 24);
                bullet.play('bullet_anim');
            }
        });

        // Create bullet animation
        this.anims.create({
            key: 'bullet_anim',
            frames: this.anims.generateFrameNumbers('bullet_animation'),  // This will use all frames
            frameRate: 12,  // Adjust speed as needed
            repeat: -1     // Loop the animation
        });

        // Create animations and player
        this.createAnimations();
        this.createPlayer(width);

        // Set up controls
        this.setupControls();

        // Create UI
        this.createUI(width);

        // Initialize game tracking
        this.remainingEnemies = 0;
        this.nextSceneName = '';
        
        // Set up scene boundaries for transitions
        this.createSceneBoundaries();
    }

    createAnimations() {
        // Character idle animation
        this.anims.create({
            key: 'character_idle',
            frames: this.anims.generateFrameNumbers('character_idle', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        // Character walking animation
        this.anims.create({
            key: 'character_walk',
            frames: this.anims.generateFrameNumbers('character_walk', { start: 0, end: 7 }),
            frameRate: 10,
            repeat: -1
        });

        // Character jump animation
        this.anims.create({
            key: 'character_jump',
            frames: this.anims.generateFrameNumbers('character_jump', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: 0
        });

        // Character death animation
        this.anims.create({
            key: 'character_death',
            frames: this.anims.generateFrameNumbers('character_death', { start: 0, end: 5 }),
            frameRate: 10,
            repeat: 0
        });
    }

    createPlayer(width) {
        // Create player at the correct height above ground
        const spawnY = this.groundTop - (32 * 2); // Account for player height (32) and scale (2)
        this.player = this.physics.add.sprite(width / 2, spawnY, 'character_idle');
        
        this.player.setScale(2)
            .setCollideWorldBounds(true)
            .setBounce(0.1)
            .setGravityY(300);
        
        this.player.body.setSize(32, 32);
        
        if (this.anims.exists('character_idle')) {
            this.player.play('character_idle');
        }

        this.physics.add.collider(this.player, this.platforms);
    }

    setupControls() {
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                // Use character's facing direction for shooting
                const direction = this.player.flipX ? 'left' : 'right';
                this.shoot(direction);
            }
        });
    }

    createUI(width) {
        const textConfig = {
            fontSize: '24px',
            fontFamily: 'Retronoid'
        };

        const currentScore = this.registry.get('score') || 0;
        this.scoreText = this.add.text(16, 16, 'Score: ' + currentScore, {
            ...textConfig,
            fill: '#fff'
        }).setScrollFactor(0);

        this.livesText = this.add.text(16, 56, 'Lives: ' + this.registry.get('lives'), {
            ...textConfig,
            fill: '#ff0000'
        }).setScrollFactor(0);

        this.hpText = this.add.text(16, 96, 'HP: ' + this.playerHP, {
            ...textConfig,
            fill: '#00ff00'
        }).setScrollFactor(0);

        // Add music toggle
        const settingsButton = this.add.text(width - 20, 20, '⚙️ Music', {
            fontSize: '20px',
            fontFamily: 'Retronoid',
            fill: '#fff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 },
            stroke: '#ffffff',
            strokeThickness: 1
        }).setOrigin(1, 0)
        .setScrollFactor(0)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => settingsButton.setStyle({ fill: '#ff0' }))
        .on('pointerout', () => settingsButton.setStyle({ fill: '#fff' }))
        .on('pointerdown', () => this.toggleMusic(settingsButton));

        // Add wallet display next to settings button
        const walletAddress = this.registry.get('walletAddress');
        const displayAddress = walletAddress ? 
            walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4) : 
            'Wallet not connected';

        this.walletText = this.add.text(width - 140, 20, displayAddress, {
            fontSize: '20px',
            fontFamily: 'Retronoid',
            fill: '#00ffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 },
            stroke: '#ffffff',
            strokeThickness: 1
        }).setOrigin(1, 0)
        .setScrollFactor(0);

        this.updateMusicButton(settingsButton);

        // Listen for wallet changes
        if (typeof window.ethereum !== 'undefined') {
            window.ethereum.on('accountsChanged', (accounts) => {
                const newAddress = accounts[0] || null;
                this.registry.set('walletAddress', newAddress);
                const displayAddress = newAddress ? 
                    newAddress.slice(0, 6) + '...' + newAddress.slice(-4) : 
                    'Wallet not connected';
                this.walletText.setText(displayAddress);
            });
        }
    }

    toggleMusic(button) {
        const bgMusic = this.sound.get('bgMusic');
        if (bgMusic) {
            if (bgMusic.isPlaying) {
                bgMusic.pause();
                this.registry.set('musicEnabled', false);
                button.setText('⚙️ Music: OFF');
            } else {
                bgMusic.resume();
                this.registry.set('musicEnabled', true);
                button.setText('⚙️ Music: ON');
            }
        }
    }

    updateMusicButton(button) {
        const bgMusic = this.sound.get('bgMusic');
        if (bgMusic && (!bgMusic.isPlaying || this.registry.get('musicEnabled') === false)) {
            button.setText('⚙️ Music: OFF');
            if (bgMusic.isPlaying) bgMusic.pause();
        }
    }

    createSceneBoundaries() {
        const width = this.scale.width;
        const height = this.scale.height;
        
        // Create invisible walls at scene edges
        const leftBoundary = this.add.rectangle(0, height/2, 10, height, 0x000000, 0);
        const rightBoundary = this.add.rectangle(width, height/2, 10, height, 0x000000, 0);
        
        // Make left boundary solid to prevent going back
        this.physics.add.existing(leftBoundary, true);
        this.physics.add.collider(this.player, leftBoundary);
        
        // Right boundary for scene transition
        this.physics.add.existing(rightBoundary, true);
        
        // Add overlap detection for scene transition (right side only)
        this.physics.add.overlap(this.player, rightBoundary, () => {
            const currentScene = this.scene.key;
            const sceneNumber = parseInt(currentScene.slice(-1));
            if (sceneNumber < 5) {
                const nextScene = 'GameScene' + (sceneNumber + 1);
                this.scene.start(nextScene);
            }
        });
    }

    shoot(direction = 'right') {
        const bullet = this.bullets.get(this.player.x, this.player.y);
        if (!bullet) return;

        bullet.setActive(true);
        bullet.setVisible(true);
        
        // Set bullet rotation based on direction
        bullet.setAngle(direction === 'right' ? 0 : 180);
        
        const speed = 600;
        bullet.setVelocityX(direction === 'right' ? speed : -speed);
        
        this.laserSound.play();
    }

    destroyBullet(bullet) {
        bullet.setActive(false);
        bullet.setVisible(false);
        bullet.body.enable = false;
    }

    hitEnemyWithBullet(bullet, enemySprite) {
        this.createHitEffect(bullet.x, bullet.y);
        this.hitSound.play();
        bullet.destroy();

        const enemy = [this.enemy1, this.enemy2, this.boss].find(e => e && e.sprite === enemySprite);
        if (enemy) {
            enemy.currentHealth--;
            console.log('Enemy hit, health:', enemy.currentHealth);
            if (enemy.currentHealth <= 0) {
                enemy.sprite.destroy();
                this.remainingEnemies--;
                console.log('Enemy defeated, remaining:', this.remainingEnemies);
                this.addPoints(enemy === this.boss ? 50 : 10);
                this.checkLevelComplete();
            }
        }
    }

    checkLevelComplete() {
        if (this.remainingEnemies <= 0) {
            const currentScene = this.scene.key;
            // Don't show completion text for Scene 5 as it has its own handling
            if (currentScene !== 'GameScene5') {
                const sceneNumber = parseInt(currentScene.slice(-1));
                this.nextSceneName = `GameScene${sceneNumber + 1}`;
            }
        }
    }

    createHitEffect(x, y) {
        for(let i = 0; i < 10; i++) {
            const particle = this.add.circle(x, y, 3, 0xffff00);
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 100;
            
            this.tweens.add({
                targets: particle,
                x: particle.x + Math.cos(angle) * speed * 0.3,
                y: particle.y + Math.sin(angle) * speed * 0.3,
                alpha: 0,
                scale: 0.1,
                duration: 300,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
    }

    hitEnemy(player, enemy) {
        if (player.alpha < 1 || this.isDying) return;

        this.playerHP -= 25;
        this.registry.set('playerHP', this.playerHP); // Store HP in registry
        this.hpText.setText('HP: ' + this.playerHP);

        if (this.playerHP <= 0) {
            this.handlePlayerDeath();
        } else {
            player.alpha = 0.5;
            this.time.delayedCall(1000, () => {
                if (!this.isDying) player.alpha = 1;
            });
            this.hitSound.play();
        }
    }

    handlePlayerDeath() {
        this.isDying = true;
        this.player.setVelocity(0, 0);
        this.player.body.moves = false;
        
        const lives = this.registry.get('lives') - 1;
        this.registry.set('lives', lives);
        this.livesText.setText('Lives: ' + lives);

        this.player.play('character_death');
        this.player.once('animationcomplete', () => {
            if (lives <= 0) {
                const width = this.scale.width;
                const height = this.scale.height;

                // Add dark overlay
                const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7)
                    .setOrigin(0, 0)
                    .setDepth(98);

                // Create glitch effect container
                const gameOverContainer = this.add.container(width/2, height * 0.3).setDepth(99);

                // Add "GAME OVER" text with shadow layers
                const shadowOffset = 4;
                const numLayers = 3;
                
                for (let i = numLayers; i >= 0; i--) {
                    const layerColor = i === 0 ? '#ff0000' : '#ff00ff';
                    const gameOverText = this.add.text(i * shadowOffset, i * shadowOffset, 'GAME OVER', {
                        fontFamily: 'Retronoid',
                        fontSize: '72px',
                        color: layerColor,
                        align: 'center',
                        stroke: '#000000',
                        strokeThickness: 4
                    }).setOrigin(0.5);
                    gameOverContainer.add(gameOverText);
                }

                // Add final score
                const finalScore = this.registry.get('score');
                const scoreText = this.add.text(width/2, height * 0.5, `FINAL SCORE: ${finalScore}`, {
                    fontFamily: 'Retronoid',
                    fontSize: '48px',
                    color: '#00ffff',
                    align: 'center',
                    stroke: '#000000',
                    strokeThickness: 3,
                    shadow: {
                        offsetX: 2,
                        offsetY: 2,
                        color: '#ff00ff',
                        blur: 5,
                        fill: true
                    }
                }).setOrigin(0.5).setDepth(99);

                // Add instruction text with blinking effect
                const instructionText = this.add.text(width/2, height * 0.7, 'PRESS SPACE TO CONTINUE', {
                    fontFamily: 'Retronoid',
                    fontSize: '32px',
                    color: '#ffd700',
                    align: 'center',
                    stroke: '#000000',
                    strokeThickness: 2
                }).setOrigin(0.5).setDepth(99);

                // Add blinking effect to instruction text
                this.tweens.add({
                    targets: instructionText,
                    alpha: 0,
                    duration: 500,
                    yoyo: true,
                    repeat: -1
                });

                // Add glitch effect to Game Over text
                this.time.addEvent({
                    delay: 2000,
                    callback: () => {
                        this.tweens.add({
                            targets: gameOverContainer,
                            x: width/2 + Phaser.Math.Between(-5, 5),
                            y: height * 0.3 + Phaser.Math.Between(-5, 5),
                            duration: 50,
                            yoyo: true,
                            repeat: 3
                        });
                    },
                    loop: true
                });

                // Set flag for game over state
                this.gameOver = true;
                
                // Add space key for game over
                this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
                
                // Disable shooting
                this.input.mouse.enabled = false;
            } else {
                this.time.delayedCall(500, () => {
                    // Reset HP only when respawning
                    this.playerHP = 100;
                    this.registry.set('playerHP', 100);
                    this.hpText.setText('HP: 100');
                    
                    this.isDying = false;
                    this.input.keyboard.enabled = true;
                    this.input.mouse.enabled = true;
                    this.player.body.moves = true;
                    this.scene.restart();
                });
            }
        });
    }

    update() {
        if (this.gameOver && this.spaceKey && this.spaceKey.isDown) {
            // Clean up before transitioning
            this.input.keyboard.removeAllKeys();
            this.input.removeAllListeners();
            this.input.mouse.enabled = true;
            this.input.keyboard.enabled = true;
            this.gameOver = false;
            this.registry.set('lives', 3);
            this.registry.set('score', 0);
            this.registry.set('playerHP', 100); // Reset HP on game over
            this.scene.start('MainMenu');
            return;
        }

        if (!this.player || this.isDying) return;

        const onGround = this.player.body.onFloor();

        if (this.wasd.left.isDown) {
            this.player.setVelocityX(-this.movementSpeed);
            this.player.flipX = true;  // Face left
            if (onGround) this.player.play('character_walk', true);
        } else if (this.wasd.right.isDown) {
            this.player.setVelocityX(this.movementSpeed);
            this.player.flipX = false;  // Face right
            if (onGround) this.player.play('character_walk', true);
        } else {
            this.player.setVelocityX(0);
            if (onGround) this.player.play('character_idle', true);
        }

        if (this.wasd.up.isDown && onGround) {
            this.player.setVelocityY(this.jumpSpeed);
            this.player.play('character_jump', true);
        }

        // Check for bullets that are off screen and destroy them
        this.bullets.getChildren().forEach(bullet => {
            if (bullet.active) {
                if (bullet.x < -50 || bullet.x > this.scale.width + 50) {
                    bullet.destroy();
                }
            }
        });
    }

    addPoints(points) {
        const currentScore = this.registry.get('score');
        this.registry.set('score', currentScore + points);
        this.scoreText.setText('Score: ' + (currentScore + points));
    }

    // Helper function to blend two colors
    blendColors(color1, color2, ratio) {
        const r1 = (color1 >> 16) & 0xFF;
        const g1 = (color1 >> 8) & 0xFF;
        const b1 = color1 & 0xFF;
        
        const r2 = (color2 >> 16) & 0xFF;
        const g2 = (color2 >> 8) & 0xFF;
        const b2 = color2 & 0xFF;
        
        const r = Math.round(r1 + (r2 - r1) * ratio);
        const g = Math.round(g1 + (g2 - g1) * ratio);
        const b = Math.round(b1 + (b2 - b1) * ratio);
        
        return (r << 16) | (g << 8) | b;
    }

    // Helper function to lighten a color
    lightenColor(color, factor) {
        const r = Math.min(255, Math.round(((color >> 16) & 0xFF) * factor));
        const g = Math.min(255, Math.round(((color >> 8) & 0xFF) * factor));
        const b = Math.min(255, Math.round((color & 0xFF) * factor));
        
        return (r << 16) | (g << 8) | b;
    }

    shutdown() {
        // Clean up tech lights when leaving scene
        if (this.techLights) {
            this.techLights.forEach(light => {
                if (light) {
                    light.destroy();
                }
            });
            this.techLights = [];
        }
        super.shutdown();
    }
}
