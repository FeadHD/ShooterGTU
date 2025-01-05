import { EntityManager } from './EntityManager';
import { GameConfig } from '../../../config/GameConfig';

export class HazardManager extends EntityManager {
    constructor(scene) {
        super(scene);
        this.lastDamageTime = new Map();
    }

    addHazard(hazard, type) {
        super.add(hazard, type);
        
        // Set up collision with player if hazard has a sprite
        if (hazard.sprite) {
            this.scene.physics.add.overlap(
                this.scene.player,
                hazard.sprite,
                () => this.handlePlayerCollision(hazard),
                null,
                this
            );
        }
    }

    handlePlayerCollision(hazard) {
        const now = Date.now();
        const lastDamage = this.lastDamageTime.get(hazard) || 0;
        
        // Check damage cooldown
        if (now - lastDamage >= GameConfig.PLAYER.INVULNERABLE_DURATION) {
            // Apply damage
            const damage = hazard.damageAmount || GameConfig.TRAPS.DAMAGE;
            this.scene.player.takeDamage(damage);
            
            // Update last damage time
            this.lastDamageTime.set(hazard, now);
            
            // Emit collision event
            this.eventBus.emit('hazardCollision', { hazard, damage });
        }
    }

    cleanup() {
        super.cleanup();
        this.lastDamageTime.clear();
    }
}
