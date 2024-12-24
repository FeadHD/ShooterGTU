export class DebugSystem {
    constructor(scene) {
        this.scene = scene;
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(999);
        this.enabled = false;

        // Add debug toggle key
        this.debugKey = scene.input.keyboard.addKey('E');
        this.debugKey.on('down', () => {
            this.enabled = !this.enabled;
            if (!this.enabled) {
                this.graphics.clear();
            }
        });
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

    update() {
        if (!this.enabled) return;
        
        this.clear();
        
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

        // Draw enemy bounds
        if (this.scene.enemies && this.scene.enemies.children) {
            this.scene.enemies.children.entries.forEach(enemy => {
                if (enemy && enemy.active && enemy.body) {
                    this.drawPhysicsBounds(enemy);
                }
            });
        }
    }
}