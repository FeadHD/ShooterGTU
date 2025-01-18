/**
 * ui-helpers.js
 * Collection of reusable UI components and helper functions
 * Provides consistent styling and behavior across menu screens
 */

/**
 * Creates an interactive button with retro styling
 * @param {Phaser.Scene} scene - Scene to add button to
 * @param {number} x - X position of button
 * @param {number} y - Y position of button
 * @param {string} text - Button label text
 * @param {Function} callback - Function to call when button is clicked
 * @returns {Phaser.GameObjects.Text} Interactive text object styled as button
 */
export function createRetroButton(scene, x, y, text, callback) {
    // Create interactive text object with hover effects
    const button = scene.add.text(x, y, text, { 
        fontSize: '32px', 
        fill: '#fff'  // Default white color
    })
    .setInteractive()
    .on('pointerdown', callback)
    .on('pointerover', () => button.setStyle({ fill: '#f39c12' }))  // Orange on hover
    .on('pointerout', () => button.setStyle({ fill: '#fff' }));     // White on normal

    return button;
}
