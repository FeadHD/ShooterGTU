import { ObjectPool } from '../ObjectPool';

export class ParticlePool extends ObjectPool {
    constructor(scene, initialSize = 50) {
        super(scene, 'particle', initialSize);
    }

    createNewObject() {
        return this.scene.add.circle(0, 0, 3, 0xffffff);
    }

    get(x, y, color = 0xffffff) {
        const particle = super.get();
        particle.setPosition(x, y);
        particle.setFillStyle(color);
        return particle;
    }

    createEffect(x, y, color = 0xffff00, count = 10) {
        const particles = [];
        for (let i = 0; i < count; i++) {
            const particle = this.get(x, y, color);
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 100;
            
            this.scene.tweens.add({
                targets: particle,
                x: particle.x + Math.cos(angle) * speed * 0.3,
                y: particle.y + Math.sin(angle) * speed * 0.3,
                alpha: 0,
                scale: 0.1,
                duration: 300,
                ease: 'Power2',
                onComplete: () => {
                    this.release(particle);
                }
            });
            particles.push(particle);
        }
        return particles;
    }
}
