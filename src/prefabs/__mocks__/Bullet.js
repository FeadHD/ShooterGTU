export class Bullet {
    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.active = true;
        this.visible = true;
        this.body = {
            setAllowGravity: jest.fn(),
            setSize: jest.fn(),
            setImmovable: jest.fn()
        };
    }

    setActive(active) {
        this.active = active;
        return this;
    }

    setVisible(visible) {
        this.visible = visible;
        return this;
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }

    setVelocity(x, y) {
        this.velocity = { x, y };
        return this;
    }

    destroy() {
        this.destroyed = true;
    }
}
