import { gameConfig } from '../config/gameConfig';

export class Enemy {
    constructor(scene, x, y, config) {
        this.scene = scene;
        this.config = config;
        this.sprite = scene.add.rectangle(x, y, config.size.width, config.size.height, 0xff0000);
        scene.physics.add.existing(this.sprite);
        this.setupPhysics();
        this.health = config.health;
    }

    setupPhysics() {
        this.sprite.setScale(1, 2);
        this.sprite.body.setBounce(0.2);
        this.sprite.body.setCollideWorldBounds(true);
        this.sprite.body.setGravityY(300);
        this.sprite.body.setSize(this.config.size.width, this.config.size.height);
        this.sprite.body.setOffset(8, 0);
    }

    update() {
        // Basic AI movement can be implemented here
    }

    damage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.sprite.destroy();
            return true;
        }
        return false;
    }

    getSprite() {
        return this.sprite;
    }
}

export class BasicEnemy extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, gameConfig.enemy.basic);
    }
}

export class StrongEnemy extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, gameConfig.enemy.strong);
        this.sprite.setTint(0xff0000); // Red tint for strong enemies
    }
}
