// UI Helper Functions

export function createRetroButton(scene, x, y, text, callback) {
    const button = scene.add.text(x, y, text, { fontSize: '32px', fill: '#fff' })
        .setInteractive()
        .on('pointerdown', callback)
        .on('pointerover', () => button.setStyle({ fill: '#f39c12' }))
        .on('pointerout', () => button.setStyle({ fill: '#fff' }));

    return button;
}
