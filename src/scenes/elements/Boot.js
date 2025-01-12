import { Scene } from 'phaser';
import { EventManager } from '../../modules/managers/EventManager';

export class Boot extends Scene {
    constructor() {
        super('Boot');
    }

    preload() {
        this.load.setBaseURL(window.location.href);
    }

    create() {
        // Create global event manager first
        this.game.globalEventManager = new EventManager(this);
        this.game.globalEventManager.initialize();
        
        // Then start the next scene
        this.scene.start('Preloader');
    }
}
