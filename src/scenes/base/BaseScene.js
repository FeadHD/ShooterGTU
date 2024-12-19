import { Scene } from 'phaser';
import { Player } from '../../entities/Player';
import { Weapon } from '../../entities/Weapon';
import { LevelLoader } from '../../utils/LevelLoader';
import { ControlsHandler } from '../../utils/ControlsHandler';
import { gameConfig } from '../../config/gameConfig';

export class BaseScene extends Scene {
    constructor(config) {
        super(config);
        this.player = null;
        this.weapon = null;
        this.levelLoader = null;
        this.controls = null;
    }

    create() {
        // Initialize controls
        this.controls = new ControlsHandler(this);

        // Create player
        this.player = new Player(this, this.scale.width * 0.1, this.scale.height - 48);

        // Create weapon system
        this.weapon = new Weapon(this);

        // Initialize level loader
        this.levelLoader = new LevelLoader(this);

        // Set up event listeners
        this.events.on('shoot', this.handleShoot, this);
        this.events.on('run', this.handleRun, this);
        this.events.on('pause', this.handlePause, this);
    }

    update() {
        // Update controls
        this.controls.update();

        // Update player with control state
        if (this.player) {
            this.player.update(this.controls);
        }
    }

    handleShoot(direction) {
        if (this.weapon && this.player) {
            const playerSprite = this.player.getSprite();
            this.weapon.shoot(
                playerSprite.x,
                playerSprite.y,
                direction
            );
        }
    }

    handleRun() {
        // Implement run functionality if needed
        if (this.player) {
            // Example: Increase player speed temporarily
            // this.player.setRunning(true);
        }
    }

    handlePause() {
        // Implement pause functionality
        this.scene.pause();
        this.scene.launch('PauseMenu');
    }

    handlePlayerDeath() {
        if (this.registry.get('lives') > 1) {
            this.registry.set('lives', this.registry.get('lives') - 1);
            this.scene.restart();
        } else {
            this.scene.start('GameOver');
        }
    }

    shutdown() {
        // Clean up event listeners
        this.events.off('shoot', this.handleShoot, this);
        this.events.off('run', this.handleRun, this);
        this.events.off('pause', this.handlePause, this);
        
        // Clean up controls
        if (this.controls) {
            this.controls.destroy();
        }
    }
}
