import { BaseScene } from '../base/BaseScene';
import { StrongEnemy } from '../../entities/Enemy';
import { gameConfig } from '../../config/gameConfig';
import { CollisionHandler } from '../../utils/CollisionHandler';

export class G1S1 extends BaseScene {
    constructor() {
        super({ key: 'G1S1' });
        this.enemies = null;
        this.buildingsLayer = null;
        this.collisionHandler = null;
    }

    preload() {
        this.load.image('Buildings', 'assets/sprites/Buildings.png');
        this.load.json('levelData', 'assets/G1S1/G1S1/Level_0.ldtkl');
        this.load.image('particle', 'assets/sprites/particle.png');
    }

    create() {
        super.create();

        const { width, height } = this.scale;
        const levelData = this.cache.json.get('levelData');

        // Initialize collision handler
        this.collisionHandler = new CollisionHandler(this);

        // Create ground platform
        const groundHeight = 16;
        const ground = this.add.rectangle(width/2, height - groundHeight/2, width, groundHeight, 0x333333);
        this.physics.add.existing(ground, true);

        // Load level
        const level = this.levelLoader.loadLDtkLevel(levelData, 'Buildings');
        if (level) {
            this.buildingsLayer = level.layers.find(layer => layer.layer.name === 'Buildings');
        }

        // Create enemies
        this.enemies = this.physics.add.group({
            bounceX: 0.2,
            bounceY: 0.2,
            collideWorldBounds: true
        });

        // Add enemies
        const groundY = height - 48;
        [width * 0.3, width * 0.7].forEach(x => {
            const enemy = new StrongEnemy(this, x, groundY);
            const sprite = enemy.getSprite();
            sprite.setData('enemyInstance', enemy);
            this.enemies.add(sprite);
        });

        // Set up all collisions using the collision handler
        this.collisionHandler.setupCollisions(
            this.player,
            this.enemies,
            this.weapon,
            this.buildingsLayer,
            ground
        );

        // Add scene text
        this.add.text(width/2, height * 0.1, 'Scene 4', {
            fontFamily: 'Retronoid',
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);
    }
}
