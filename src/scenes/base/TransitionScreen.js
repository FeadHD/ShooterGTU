/**
 * TransitionScreen.js
 * Manages scene transitions with animated overlays and UI elements.
 * Provides smooth visual transitions between different game states.
 */

import { TextStyleManager } from '../../managers/graphics/TextStyleManager';
import { ManagerFactory } from '../../managers/core/ManagerFactory';

export class TransitionScreen {
    /**
     * Creates a new transition screen manager
     * @param {Phaser.Scene} scene - The scene this transition belongs to
     */
    constructor(scene) {
        this.scene = scene;
        this.elements = [];              // Stores transition visual elements
        this.isTransitioning = false;    // Prevents multiple transitions
        this.managers = scene.managers;   // Reference to scene managers

        /**
         * TEXT STYLES
         * Defines styles for different UI elements during transition
         */
        this.styles = {
            // Score display style
            score: {
                fontFamily: 'Retronoid',
                fontSize: '24px',
                color: TextStyleManager.colors.score,
                align: 'left',
                strokeThickness: 1,
                shadow: {
                    offsetX: 1,
                    offsetY: 1,
                    color: '#005555',
                    blur: 4,
                    fill: true
                }
            },
            // Lives counter style
            lives: {
                fontFamily: 'Retronoid',
                fontSize: '24px',
                color: TextStyleManager.colors.lives,
                align: 'left',
                strokeThickness: 1,
                shadow: {
                    offsetX: 1,
                    offsetY: 1,
                    color: '#8b0a50',
                    blur: 4,
                    fill: true
                }
            },
            // Health points style
            hp: {
                fontFamily: 'Retronoid',
                fontSize: '24px',
                color: TextStyleManager.colors.hp,
                align: 'left',
                strokeThickness: 1,
                shadow: {
                    offsetX: 1,
                    offsetY: 1,
                    color: '#006400',
                    blur: 4,
                    fill: true
                }
            },
            // Bitcoin counter style
            bitcoin: {
                fontFamily: 'Retronoid',
                fontSize: '24px',
                color: TextStyleManager.colors.bitcoin,
                align: 'left',
                strokeThickness: 1,
                shadow: {
                    offsetX: 1,
                    offsetY: 1,
                    color: '#b8860b',
                    blur: 4,
                    fill: true
                }
            },
            // Timer display style
            timer: {
                fontFamily: 'Retronoid',
                fontSize: '24px',
                color: TextStyleManager.colors.timer,
                align: 'left',
                strokeThickness: 1,
                shadow: {
                    offsetX: 1,
                    offsetY: 1,
                    color: '#8b008b',
                    blur: 4,
                    fill: true
                }
            }
        };
    }

    /**
     * TRANSITION START
     * Initiates the transition sequence with a fade to black
     * @param {Function} onComplete - Callback after transition completes
     */
    start(onComplete) {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        // Configure camera for transition
        this.scene.scale.setGameSize(1920, 1080);
        const mainCamera = this.scene.cameras.main;
        mainCamera.setViewport(0, 0, 1920, 1080);
        mainCamera.setZoom(1);

        // Create fade overlay
        const overlay = this.scene.add.rectangle(
            0, 0,
            1920,
            1080,
            0x000000
        );
        overlay.setDepth(9000);      // Ensure overlay is on top
        overlay.setAlpha(0);         // Start transparent
        overlay.setOrigin(0);        // Align to top-left
        this.elements.push(overlay);

        // Initialize UI if needed
        if (!this.scene.gameUI) {
            if (!this.scene.managers) {
                this.scene.managers = ManagerFactory.createManagers(this.scene);
            }
            this.scene.gameUI = this.scene.managers.ui;
        } 

        // Animate fade in
        this.scene.tweens.add({
            targets: overlay,
            alpha: 1,
            duration: 500,
            onComplete: () => this.showElements(onComplete)
        });
    }

    /**
     * UI ANIMATION
     * Shows and animates UI elements during transition
     * @param {Function} onComplete - Callback after animations finish
     */
    showElements(onComplete) {
        const overlay = this.elements[0];

        // Trigger UI animations
        if (this.scene.gameUI) {
            this.scene.gameUI.animateUIElements();
        }

        // Wait for animations then transition
        this.scene.time.delayedCall(4500, () => {
            if (onComplete) {
                onComplete();
                
                // Fade out overlay
                this.scene.time.delayedCall(100, () => {
                    if (overlay) {
                        this.scene.tweens.add({
                            targets: overlay,
                            alpha: 0,
                            duration: 500,
                            ease: 'Power2',
                            onComplete: () => {
                                overlay.destroy();
                                // Ensure UI stays visible
                                if (this.scene.gameUI) {
                                    this.scene.gameUI.container.setDepth(100);
                                }
                            }
                        });
                    }
                });
            }
        });
    }

    /**
     * CLEANUP
     * Removes all transition elements and resets state
     */
    destroy() {
        this.elements.forEach(element => element.destroy());
        this.elements = [];
        this.isTransitioning = false;
    }
}
