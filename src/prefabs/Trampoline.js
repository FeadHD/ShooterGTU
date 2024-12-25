export default class Trampoline extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'trampoline');
        scene.add.existing(this);
        scene.physics.add.existing(this, true); // true = static body
        
        // Set bounce area
        this.body.setSize(this.width * 0.8, this.height * 0.2);
        this.body.setOffset(this.width * 0.1, this.height * 0.8);
        
        // Animation for bounce effect
        scene.anims.create({
            key: 'bounce',
            frames: scene.anims.generateFrameNumbers('trampoline', { start: 0, end: 3 }),
            duration: 300,
            repeat: 0
        });
    }
}