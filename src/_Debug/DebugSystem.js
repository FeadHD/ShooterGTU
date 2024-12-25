export class DebugSystem {
    constructor(scene) {
        this.scene = scene;
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(999);
        this.enabled = false;

        // Initialize debug graphics
        this.debugGraphics = scene.add.graphics();
        this.debugGraphics.setDepth(999);

        // Add debug toggle key
        this.debugKey = scene.input.keyboard.addKey('E');
        this.debugKey.on('down', () => {
            this.enabled = !this.enabled;
            if (!this.enabled) {
                // Clear both graphics objects when disabling debug mode
                this.graphics.clear();
                this.debugGraphics.clear();
            }
        });
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

    update() {
        // Always clear at the start of update
        this.clear();
        
        // Only draw if enabled
        if (!this.enabled) {
            return;
        }
        
        // Draw platform bounds
        if (this.scene.platforms && this.scene.platforms.children) {
            this.scene.platforms.children.entries.forEach(platform => {
                if (platform && platform.active) {
                    this.drawPlatformBounds(platform);
                }
            });
        }

        // Draw player bounds
        if (this.scene.player && this.scene.player.body && this.scene.player.active) {
            this.drawPhysicsBounds(this.scene.player);
        }

        // Draw slime bounds
        if (this.scene.slimes && this.scene.slimes.children) {
            this.scene.slimes.children.entries.forEach(slime => {
                if (slime && slime.active && slime.body) {
                    this.graphics.lineStyle(1, 0x800080); // Purple for Slimes
                    this.graphics.strokeRect(slime.body.x, slime.body.y, slime.body.width, slime.body.height);
                }
            });
        }

        // Draw enemy bounds
        if (this.scene.enemies && this.scene.enemies.children) {
            this.scene.enemies.children.entries.forEach(enemy => {
                if (enemy && enemy.active && enemy.body) {
                    this.drawPhysicsBounds(enemy);
                }
            });
        }

        this.debugGraphics.clear();
        
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
    }
}