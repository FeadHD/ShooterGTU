export class DebugSystem {
    constructor(scene) {
        this.scene = scene;
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(999);
        this.enabled = false;
        this.showDebug = false;
        this.slimePathHistory = new Map(); // Store slime movement history

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
        this.debugGraphics = this.scene.add.graphics();
        this.debugGraphics.setDepth(999);
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

        if (!this.debugTexts) {
            this.debugTexts = [];
        }

        const debugText = this.scene.add.text(x, y, text, {
            fontSize: '12px',
            fill: '#' + color.toString(16).padStart(6, '0')
        });
        debugText.setDepth(999);
        this.debugTexts.push(debugText);
    }

    clear() {
        this.graphics.clear();
        if (this.debugTexts) {
            this.debugTexts.forEach(text => text.destroy());
            this.debugTexts = [];
        }
    }

    // initializeFPSCounter() {
    //     this.fpsCounter = this.scene.add.text(16, 16, 'FPS: 0', {
    //         fontFamily: 'Retronoid',
    //         fontSize: '20px',
    //         fill: '#00ff00',
    //         backgroundColor: '#000000',
    //         padding: { x: 10, y: 5 }
    //     });
    //     this.fpsCounter.setScrollFactor(0); // Fix to camera
    //     this.fpsCounter.setDepth(1000);     // Always on top
    //     this.fpsCounter.setVisible(false);   // Hidden by default
    // }

    drawSlimeDebug(slime) {
        if (!this.enabled || !slime || !slime.sprite) return;

        const sprite = slime.sprite;

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

        // Draw stats
        const stats = [
            `Health: ${slime.health}/${slime.maxHealth}`,
            `Jump Cooldown: ${Math.max(0, slime.jumpCooldown - (this.scene.time.now - slime.lastJumpTime))}ms`,
            `Speed: ${Math.round(sprite.body.velocity.x)}, ${Math.round(sprite.body.velocity.y)}`
        ];
        
        stats.forEach((text, i) => {
            const debugText = this.scene.add.text(
                sprite.x - 50,
                sprite.y - 60 - (i * 15),
                text,
                { 
                    fontSize: '12px',
                    fill: '#ffffff',
                    backgroundColor: '#000000',
                    padding: { x: 3, y: 3 }
                }
            );
            debugText.setDepth(1000);
            if (!this.debugTexts) {
                this.debugTexts = [];
            }
            this.debugTexts.push(debugText);
        });
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

        // Draw slime debug info
        if (this.scene.slimes && this.scene.slimes.children) {
            this.scene.slimes.children.entries.forEach(slimeSprite => {
                if (slimeSprite && slimeSprite.active && slimeSprite.enemy) {
                    this.drawPhysicsBounds(slimeSprite);
                    this.drawSlimeDebug(slimeSprite.enemy);
                }
            });
        }

        // Draw player bounds
        if (this.scene.player && this.scene.player.body) {
            this.drawPhysicsBounds(this.scene.player);
        }

        if (!this.showDebug) return;

        // Draw physics bounds
        this.drawPhysicsBoundsDebug();
        
        // Draw platform bounds
        this.drawPlatformBoundsDebug();
        
        // Draw player bounds if it exists
        if (this.scene.player && this.scene.player.body) {
            this.drawPlayerBoundsDebug();
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