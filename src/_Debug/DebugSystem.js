export class DebugSystem {
    constructor(scene) {
        this.scene = scene;
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(999);
        this.enabled = false;
        this.showDebug = false;
        this.slimePathHistory = new Map(); // Store slime movement history
        this.enemyIds = new Map(); // Store unique IDs for enemies
        this.nextEnemyId = 1; // Counter for generating unique IDs
        this.debugTexts = []; // Initialize debugTexts array

        // Initialize debug graphics
        this.debugGraphics = scene.add.graphics();
        this.debugGraphics.setDepth(999);

        // Add debug toggle key
        this.debugKey = scene.input.keyboard.addKey('E');
        this.debugKey.on('down', () => {
            this.enabled = !this.enabled;
            this.showDebug = !this.showDebug;
            
            // Toggle platform visibility
            if (this.scene.platforms && this.scene.platforms.children) {
                this.scene.platforms.children.iterate((platform) => {
                    if (platform) {
                        platform.setVisible(this.enabled);
                    }
                });
            }
            
            if (!this.enabled) {
                // Clear all debug graphics
                this.graphics.clear();
                if (this.debugGraphics) {
                    this.debugGraphics.clear();
                }
                // Clear any debug texts
                if (this.debugTexts) {
                    this.debugTexts.forEach(text => text.destroy());
                    this.debugTexts = [];
                }
            }
        });

        // Initialize FPS counter
        // this.initializeFPSCounter();
    }

    initialize() {
        // Add debug graphics
        // this.debugGraphics = this.scene.add.graphics();
        // this.debugGraphics.setDepth(999);
    }

    drawPhysicsBounds(gameObject) {
        if (!this.enabled || !gameObject || !gameObject.body) return;

        const x = gameObject.body.x;
        const y = gameObject.body.y;
        const width = gameObject.body.width;
        const height = gameObject.body.height;

        this.graphics.lineStyle(1, 0x00ff00);
        this.graphics.strokeRect(x, y, width, height);
    }

    drawPlatformBounds(platform) {
        if (!this.enabled || !platform) return;

        const x = platform.x - platform.displayWidth/2;
        const y = platform.y - platform.displayHeight/2;
        const width = platform.displayWidth;
        const height = platform.displayHeight;

        this.graphics.lineStyle(1, 0x00ff00);
        this.graphics.strokeRect(x, y, width, height);
    }

    drawCollisionLine(startX, startY, endX, endY) {
        if (!this.enabled) return;

        this.graphics.lineStyle(1, 0xff0000);
        this.graphics.beginPath();
        this.graphics.moveTo(startX, startY);
        this.graphics.lineTo(endX, endY);
        this.graphics.strokePath();
    }

    drawPoint(x, y, color = 0xff0000) {
        if (!this.enabled) return;

        this.graphics.fillStyle(color);
        this.graphics.fillCircle(x, y, 3);
    }

    drawText(x, y, text, color = 0xffffff) {
        if (!this.enabled) return;

        const debugText = this.scene.add.text(x, y, text, {
            fontSize: '12px',
            fill: '#' + color.toString(16).padStart(6, '0')
        });
        debugText.setDepth(999);
        this.debugTexts.push(debugText);
    }

    clear() {
        // Clear both graphics objects
        this.graphics.clear();
        if (this.debugGraphics) {
            this.debugGraphics.clear();
        }
        if (this.debugTexts) {
            this.debugTexts.forEach(text => text.destroy());
            this.debugTexts = [];
        }
    }

    getEnemyId(enemy) {
        if (!this.enemyIds.has(enemy)) {
            this.enemyIds.set(enemy, this.nextEnemyId++);
        }
        return this.enemyIds.get(enemy);
    }

    drawDroneDebug(drone) {
        if (!this.enabled) return;
        console.log('Drawing drone debug for:', drone);

        // Get the sprite, either directly or from enemy instance
        const sprite = drone.sprite || drone;
        if (!sprite || !sprite.active) {
            console.log('Invalid sprite for drone debug');
            return;
        }

        console.log('Drone sprite position:', sprite.x, sprite.y);
        console.log('Drone properties:', {
            laserRange: drone.laserRange,
            patrolPoints: drone.patrolPoints,
            isLaserCharging: drone.isLaserCharging,
            health: drone.health,
            maxHealth: drone.maxHealth
        });

        // Draw laser range
        this.graphics.lineStyle(1, 0xff0000, 0.3);
        this.graphics.strokeCircle(sprite.x, sprite.y, drone.laserRange || 500);

        // Draw patrol path
        if (drone.patrolPoints) {
            this.graphics.lineStyle(2, 0x00ff00, 0.5);
            for (let i = 0; i < drone.patrolPoints.length; i++) {
                const startPoint = drone.patrolPoints[i];
                const endPoint = drone.patrolPoints[(i + 1) % drone.patrolPoints.length];
                
                this.graphics.beginPath();
                this.graphics.moveTo(startPoint.x, startPoint.y);
                this.graphics.lineTo(endPoint.x, endPoint.y);
                this.graphics.strokePath();
                
                // Draw patrol points
                this.graphics.fillStyle(0xff0000, 1);
                this.graphics.fillCircle(startPoint.x, startPoint.y, 5);
            }

            // Draw current target point with different color
            if (drone.currentPatrolIndex < drone.patrolPoints.length) {
                const target = drone.patrolPoints[drone.currentPatrolIndex];
                this.graphics.fillStyle(0xffff00, 1);
                this.graphics.fillCircle(target.x, target.y, 7);
            }
        }

        // Draw laser charging indicator if charging
        if (drone.isLaserCharging) {
            const chargeProgress = drone.laserChargeDuration / drone.laserChargeTime;
            this.graphics.lineStyle(2, 0xff0000, chargeProgress);
            this.graphics.strokeCircle(sprite.x, sprite.y, 30);
        }

        // Draw stats
        const stats = [
            `Drone #${this.getEnemyId(drone)}`,
            `Health: ${drone.currentHealth || 0}/${drone.maxHealth || 3}`,
            `State: ${drone.isWaiting ? 'Waiting' : 'Moving'}`,
            `Laser: ${drone.isLaserCharging ? 'Charging' : 'Ready'}`
        ];
        
        stats.forEach((text, i) => {
            const debugText = this.scene.add.text(
                sprite.x - 50,
                sprite.y - 80 - (i * 15),
                text,
                { 
                    fontSize: '12px',
                    fill: '#ffffff',
                    backgroundColor: '#000000',
                    padding: { x: 3, y: 3 }
                }
            );
            debugText.setDepth(1000);
            this.debugTexts.push(debugText);
        });
    }

    drawSlimeDebug(slime) {
        if (!this.enabled || !slime || !slime.sprite) return;
        console.log('Drawing slime debug for:', slime);
        console.log('Slime ID:', this.getEnemyId(slime));

        const sprite = slime.sprite;

        // Draw stats first (including ID)
        const stats = [
            `Slime #${this.getEnemyId(slime)}`,
            `Health: ${slime.health}/${slime.maxHealth}`,
            `Jump Cooldown: ${Math.max(0, slime.jumpCooldown - (this.scene.time.now - slime.lastJumpTime))}ms`,
            `Speed: ${Math.round(sprite.body.velocity.x)}, ${Math.round(sprite.body.velocity.y)}`
        ];
        
        stats.forEach((text, i) => {
            const debugText = this.scene.add.text(
                sprite.x - 50,
                sprite.y - 90 - (i * 15),
                text,
                { 
                    fontSize: '12px',
                    fill: '#ffffff',
                    backgroundColor: '#000000',
                    padding: { x: 3, y: 3 }
                }
            );
            debugText.setDepth(1000);
            this.debugTexts.push(debugText);
        });

        // Draw detection range (outer circle)
        this.graphics.lineStyle(1, 0x00ff00, 0.3);
        this.graphics.strokeCircle(sprite.x, sprite.y, slime.detectionRange);

        // Draw aggro range (inner circle)
        this.graphics.lineStyle(1, 0xff0000, 0.3);
        this.graphics.strokeCircle(sprite.x, sprite.y, slime.aggroRange);

        // Draw movement direction
        const directionLength = 30;
        this.graphics.lineStyle(2, 0xffff00);
        this.graphics.lineBetween(
            sprite.x,
            sprite.y,
            sprite.x + (slime.direction * directionLength),
            sprite.y
        );

        // Store and draw path history
        if (!this.slimePathHistory.has(sprite)) {
            this.slimePathHistory.set(sprite, []);
        }
        
        const history = this.slimePathHistory.get(sprite);
        history.push({ x: sprite.x, y: sprite.y });
        
        // Keep only last 50 positions
        if (history.length > 50) {
            history.shift();
        }

        // Draw path
        if (history.length > 1) {
            this.graphics.lineStyle(1, 0x00ffff, 0.5);
            for (let i = 1; i < history.length; i++) {
                this.graphics.lineBetween(
                    history[i-1].x,
                    history[i-1].y,
                    history[i].x,
                    history[i].y
                );
            }
        }

        // Draw jump info if slime is jumping
        if (sprite.body && sprite.body.velocity.y < 0) {
            this.graphics.lineStyle(1, 0xff00ff);
            // Draw jump arc
            const jumpDuration = Math.abs(2 * sprite.body.velocity.y / sprite.body.gravity.y);
            const points = [];
            for (let t = 0; t < jumpDuration; t += jumpDuration/10) {
                const x = sprite.x + (sprite.body.velocity.x * t);
                const y = sprite.y + (sprite.body.velocity.y * t) + (0.5 * sprite.body.gravity.y * t * t);
                points.push({ x, y });
            }
            for (let i = 1; i < points.length; i++) {
                this.graphics.lineBetween(
                    points[i-1].x,
                    points[i-1].y,
                    points[i].x,
                    points[i].y
                );
            }
        }
    }

    drawWarriorDebug(sprite) {
        if (!this.enabled || !sprite) return;
        console.log('Drawing warrior debug for:', sprite);

        const warrior = sprite.getData('enemy');
        if (!warrior) {
            console.warn('No warrior data found for sprite:', sprite);
            return;
        }

        // Draw physics bounds
        this.drawPhysicsBounds(sprite);

        // Get warrior stats
        const stats = [
            `Warrior #${this.getEnemyId(warrior)}`,
            `Health: ${warrior.health}/${warrior.maxHealth}`,
            `State: ${warrior.isAttacking ? 'Attacking' : 'Idle'}`,
            `Speed: ${Math.round(sprite.body.velocity.x)}, ${Math.round(sprite.body.velocity.y)}`
        ];

        // Draw stats with same style as slime
        stats.forEach((text, i) => {
            const debugText = this.scene.add.text(
                sprite.x - 50,
                sprite.y - 90 - (i * 15),
                text,
                { 
                    fontSize: '12px',
                    fill: '#ffffff',
                    backgroundColor: '#000000',
                    padding: { x: 3, y: 3 }
                }
            );
            debugText.setDepth(1000);
            this.debugTexts.push(debugText);
        });

        // Draw detection range (outer circle)
        this.graphics.lineStyle(1, 0xff6600, 0.3);
        this.graphics.strokeCircle(
            sprite.x,
            sprite.y,
            warrior.detectionRange || 300
        );

        // Draw attack range (inner circle)
        this.graphics.lineStyle(1, 0xff0000, 0.3);
        this.graphics.strokeCircle(
            sprite.x,
            sprite.y,
            warrior.attackRange || 50
        );

        // Draw movement direction
        const directionLength = 30;
        this.graphics.lineStyle(2, 0xffff00);
        this.graphics.lineBetween(
            sprite.x,
            sprite.y,
            sprite.x + (warrior.direction * directionLength),
            sprite.y
        );
    }

    drawPlayerDebug(player) {
        if (!this.enabled || !player) return;

        // Draw player stats
        const stats = [
            `Player #1`,
            `Health: ${player.playerHP}/100`,
            `Last Damage: ${player.lastDamageTaken}`,
            `Speed: ${Math.round(player.body.velocity.x)}, ${Math.round(player.body.velocity.y)}`,
            `Jumps: ${player.jumpsAvailable}/2`,
            `Status: ${player.isDying ? 'Dying' : (Date.now() < player.invulnerableUntil ? 'Invulnerable' : 'Normal')}`
        ];
        
        stats.forEach((text, i) => {
            const debugText = this.scene.add.text(
                player.x - 50,
                player.y - 90 - (i * 15),
                text,
                { 
                    fontSize: '12px',
                    fill: '#ffffff',
                    backgroundColor: '#000000',
                    padding: { x: 3, y: 3 }
                }
            );
            debugText.setDepth(1000);
            this.debugTexts.push(debugText);
        });

        // Draw player bounds
        this.graphics.lineStyle(2, 0x00ff00);
        this.graphics.strokeRect(player.x - player.width/2, player.y - player.height/2, player.width, player.height);

        // Draw jump range
        if (player.jumpsAvailable > 0) {
            this.graphics.lineStyle(1, 0x00ff00, 0.3);
            this.graphics.strokeCircle(player.x, player.y, Math.abs(player.jumpSpeed) / 10);
        }

        // Draw damage indicator if recently damaged
        if (player.lastDamageTaken > 0 && Date.now() < player.invulnerableUntil) {
            this.graphics.lineStyle(2, 0xff0000, 0.5);
            this.graphics.strokeCircle(player.x, player.y, 30);
        }

        // Draw movement direction indicator
        const direction = player.body.velocity.x !== 0 ? Math.sign(player.body.velocity.x) : (player.flipX ? -1 : 1);
        const directionLength = 30;
        this.graphics.lineStyle(2, 0xffff00);
        this.graphics.lineBetween(
            player.x,
            player.y,
            player.x + (direction * directionLength),
            player.y
        );
    }

    drawDebugInfo() {
        if (!this.enabled) return;

        this.clear();

        // Draw player debug info if player exists
        if (this.scene.player) {
            this.drawPlayerDebug(this.scene.player);
        }

        // Draw platform bounds
        if (this.scene.platforms) {
            this.scene.platforms.children.iterate(platform => {
                if (platform) {
                    this.drawPlatformBounds(platform);
                }
            });
        }

        // Draw enemy debug info
        if (this.scene.enemies) {
            this.scene.enemies.children.iterate(enemy => {
                if (enemy) {
                    if (enemy.getData('type') === 'drone') {
                        this.drawDroneDebug(enemy);
                    } else if (enemy.getData('type') === 'slime') {
                        this.drawSlimeDebug(enemy);
                    } else if (enemy.getData('type') === 'warrior') {
                        this.drawWarriorDebug(enemy);
                    }
                }
            });
        }

        // Draw spawn point if it exists
        if (this.scene.playerSpawnPoint) {
            const { x, y } = this.scene.playerSpawnPoint;
            this.drawPoint(x, y, 0x00ff00);
            this.drawText(x, y - 20, 'SPAWN');
        }

        // Draw alarm triggers if they exist
        if (this.scene.alarmTriggers) {
            this.scene.alarmTriggers.children.iterate(alarm => {
                if (alarm) {
                    const bounds = alarm.getBounds();
                    this.graphics.lineStyle(2, 0xff0000);
                    this.graphics.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
                    this.drawText(bounds.x, bounds.y - 20, 'ALARM TRIGGER');
                }
            });
        }
    }

    update(time) {
        // Clear previous frame's debug graphics
        this.graphics.clear();
        if (this.debugGraphics) {
            this.debugGraphics.clear();
        }
        
        // Clear previous debug texts
        if (this.debugTexts) {
            this.debugTexts.forEach(text => text.destroy());
            this.debugTexts = [];
        }

        if (!this.enabled) return;

        // Draw platform bounds
        if (this.scene.platforms && this.scene.platforms.children) {
            this.scene.platforms.children.entries.forEach(platform => {
                if (platform && platform.active) {
                    this.drawPlatformBounds(platform);
                }
            });
        }

        // Draw player debug info
        if (this.scene.player) {
            this.drawPlayerDebug(this.scene.player);
        }

        // Draw warrior debug info
        if (this.scene.enemies) {
            this.scene.enemies.getChildren().forEach(enemySprite => {
                if (enemySprite && enemySprite.active && enemySprite.getData('type') === 'warrior') {
                    this.drawWarriorDebug(enemySprite);
                }
            });
        }

        // Draw slime debug info
        if (this.scene.slimes && this.scene.slimes.children) {
            this.scene.slimes.children.entries.forEach(slimeSprite => {
                if (slimeSprite && slimeSprite.active) {
                    this.drawPhysicsBounds(slimeSprite);
                    if (slimeSprite.enemy) {
                        this.drawSlimeDebug(slimeSprite.enemy);
                    }
                }
            });
        }

        // Draw drone debug info
        if (this.scene.drones && this.scene.drones.children) {
            this.scene.drones.children.entries.forEach(droneSprite => {
                if (droneSprite && droneSprite.active) {
                    this.drawPhysicsBounds(droneSprite);
                    if (droneSprite.enemy) {
                        this.drawDroneDebug(droneSprite.enemy);
                    } else {
                        this.drawDroneDebug(droneSprite);
                    }
                }
            });
        }

        // Draw player bounds
        if (this.scene.player && this.scene.player.body) {
            this.drawPhysicsBounds(this.scene.player);
        }
    }

    drawPhysicsBoundsDebug() {
        const bounds = this.scene.physics.world.bounds;
        
        this.debugGraphics.lineStyle(1, 0x00ff00);
        this.debugGraphics.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
    }

    drawPlatformBoundsDebug() {
        if (!this.scene.platforms) return;

        this.debugGraphics.lineStyle(1, 0xff0000);
        
        this.scene.platforms.children.iterate((platform) => {
            if (platform && platform.body) {
                const bounds = platform.body;
                this.debugGraphics.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
            }
        });
    }

    drawPlayerBoundsDebug() {
        const player = this.scene.player;
        const bounds = player.body;
        
        this.debugGraphics.lineStyle(1, 0x0000ff);
        this.debugGraphics.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
    }

    cleanup() {
        if (this.debugGraphics) {
            this.debugGraphics.destroy();
        }
        // if (this.fpsCounter) {
        //     this.fpsCounter.destroy();
        // }
    }
}