import { ObjectPool } from '../ObjectPool';
import { BulletPool } from '../pools/BulletPool';
import { ParticlePool } from '../pools/ParticlePool';
import { Bullet } from '../../../prefabs/Bullet';

// Mock the Bullet class
jest.mock('../../../prefabs/Bullet');

describe('ObjectPool', () => {
    let mockScene;

    beforeEach(() => {
        // Create a more complete mock scene
        mockScene = {
            add: {
                circle: jest.fn().mockReturnValue({
                    setActive: jest.fn(),
                    setVisible: jest.fn(),
                    setPosition: jest.fn(),
                    setFillStyle: jest.fn(),
                    destroy: jest.fn()
                })
            },
            physics: {
                add: {
                    sprite: jest.fn().mockReturnValue({
                        setActive: jest.fn(),
                        setVisible: jest.fn(),
                        setPosition: jest.fn(),
                        setVelocity: jest.fn(),
                        destroy: jest.fn(),
                        body: {
                            setAllowGravity: jest.fn(),
                            setSize: jest.fn(),
                            setImmovable: jest.fn()
                        }
                    }),
                    existing: jest.fn()
                },
                world: {
                    bounds: {
                        contains: jest.fn().mockReturnValue(true)
                    }
                }
            },
            tweens: {
                add: jest.fn((config) => {
                    // Immediately call onComplete to simulate tween finishing
                    if (config.onComplete) {
                        config.onComplete();
                    }
                })
            }
        };
    });

    describe('BulletPool', () => {
        let bulletPool;

        beforeEach(() => {
            bulletPool = new BulletPool(mockScene);
        });

        it('should create initial pool of bullets', () => {
            expect(bulletPool.pool.length).toBe(20); // Default size
        });

        it('should get and release bullets correctly', () => {
            const bullet = bulletPool.get(100, 200, { x: 10, y: 0 });
            expect(bulletPool.active.size).toBe(1);
            expect(bulletPool.pool.length).toBe(19);

            bulletPool.release(bullet);
            expect(bulletPool.active.size).toBe(0);
            expect(bulletPool.pool.length).toBe(20);
        });
    });

    describe('ParticlePool', () => {
        let particlePool;

        beforeEach(() => {
            particlePool = new ParticlePool(mockScene);
        });

        it('should create initial pool of particles', () => {
            expect(particlePool.pool.length).toBe(50); // Default size
        });

        it('should create particle effects', () => {
            const particles = particlePool.createEffect(100, 200);
            expect(particles.length).toBe(10); // Default effect size
            // Since our mock tween immediately completes, particles are released
            expect(particlePool.active.size).toBe(0);
        });
    });
});
