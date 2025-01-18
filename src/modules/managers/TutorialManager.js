/**
 * TutorialManager.js
 * Manages the in-game tutorial system, displaying step-by-step instructions
 * with typewriter effects and dynamic key binding display.
 */

export class TutorialManager {
    /**
     * Initialize tutorial system with text effects and player tracking
     * @param {Phaser.Scene} scene - The game scene this manager belongs to
     */
    constructor(scene) {
        this.scene = scene;
        this.tutorialTexts = [];          // Active tutorial text objects
        this.currentStep = 0;             // Current tutorial step index
        this.isActive = true;             // Tutorial system active state
        this.isTyping = false;            // Text animation state
        this.currentText = '';            // Current displayed text
        this.targetText = '';             // Complete text to be typed
        this.typeTimer = null;            // Timer for typewriter effect
        this.charIndex = 0;               // Current character in typing animation
        this.typeSpeed = 50;              // Milliseconds per character

        // Text style configuration for tutorial messages
        this.textStyle = {
            fontFamily: 'Gameplay',
            fontSize: '16px',
            color: '#ffffff',
            align: 'center',
            lineSpacing: 10,
            stroke: '#000000',
            strokeThickness: 4,
            padding: { x: 10, y: 5 }
        };

        // Initialize tutorial steps with current key bindings
        this.updateTutorialSteps();

        // Player action tracking flags
        this.hasMovedLeft = false;
        this.hasMovedRight = false;
        this.hasJumped = false;
        this.hasHovered = false;
        this.hasShot = false;
    }

    /**
     * Convert key codes to readable key names
     * Handles both keyboard keys and mouse buttons
     */
    getKeyName(keyCode) {
        if (!keyCode) return 'UNKNOWN';
        
        // Handle mouse button names
        if (typeof keyCode === 'string' && keyCode.startsWith('MOUSE_')) {
            switch (keyCode) {
                case 'MOUSE_LEFT': return 'Left Click';
                case 'MOUSE_RIGHT': return 'Right Click';
                case 'MOUSE_MIDDLE': return 'Middle Click';
                default: return keyCode.replace('MOUSE_', '');
            }
        }

        // Keyboard key mapping
        const keyNames = {
            32: 'SPACE',
            37: 'LEFT',
            38: 'UP',
            39: 'RIGHT',
            40: 'DOWN',
            // Letters
            65: 'A', 66: 'B', 67: 'C', 68: 'D', 69: 'E',
            70: 'F', 71: 'G', 72: 'H', 73: 'I', 74: 'J',
            75: 'K', 76: 'L', 77: 'M', 78: 'N', 79: 'O',
            80: 'P', 81: 'Q', 82: 'R', 83: 'S', 84: 'T',
            85: 'U', 86: 'V', 87: 'W', 88: 'X', 89: 'Y',
            90: 'Z'
        };

        // Handle different key code formats
        if (typeof keyCode === 'number') {
            return keyNames[keyCode] || String.fromCharCode(keyCode);
        }
        if (typeof keyCode === 'object' && keyCode.hasOwnProperty('value')) {
            return keyNames[keyCode.value] || String.fromCharCode(keyCode.value);
        }

        return 'UNKNOWN';
    }

    /**
     * Update tutorial steps with current control bindings
     * Creates step objects with text and completion conditions
     */
    updateTutorialSteps() {
        if (!this.scene.player || !this.scene.player.controller) {
            return;
        }

        const bindings = this.scene.player.controller.keyBindings;
        const leftKey = this.getKeyName(bindings.left);
        const rightKey = this.getKeyName(bindings.right);
        const jumpKey = this.getKeyName(bindings.jump);
        const shootKey = this.getKeyName(bindings.shoot);

        this.tutorialSteps = [
            {
                text: `Use ${leftKey} and ${rightKey} to move left and right`,
                condition: () => this.hasPlayerMoved(),
                position: { x: 0.5, y: 0.2 }
            },
            {
                text: `Press ${jumpKey} to jump`,
                condition: () => this.hasPlayerJumped(),
                position: { x: 0.5, y: 0.2 }
            },
            {
                text: `Hold ${jumpKey} in mid-air\nto hover!`,
                condition: () => this.hasPlayerHovered(),
                position: { x: 0.5, y: 0.2 }
            },
            {
                text: `${shootKey} to shoot`,
                condition: () => this.hasPlayerShot(),
                position: { x: 0.5, y: 0.2 }
            },
            {
                text: 'Reach the end to start the game',
                condition: () => this.isNearEndZone(),
                position: { x: 0.5, y: 0.2 }
            }
        ];
    }

    /**
     * Begin tutorial sequence
     * Updates key bindings and shows first step
     */
    start() {
        if (!this.isActive) return;
        this.updateTutorialSteps();
        this.showCurrentStep();
    }

    /**
     * Track player actions and progress tutorial
     * Called every frame during gameplay
     */
    update() {
        if (!this.isActive) return;

        // Track player movement and abilities
        if (this.scene.player) {
            if (this.scene.player.body.velocity.x < 0) this.hasMovedLeft = true;
            if (this.scene.player.body.velocity.x > 0) this.hasMovedRight = true;
            
            // Track jump and hover states
            if (this.scene.player.body.velocity.y < 0 && 
                this.scene.player.controller.controls.jump.isDown) {
                if (!this.scene.player.body.touching.down) {
                    this.hasJumped = true;
                }
            }

            if (this.scene.player.isHovering) {
                this.hasHovered = true;
            }
        }

        // Progress to next step if current is complete
        if (!this.isTyping && 
            this.currentStep < this.tutorialSteps.length && 
            this.tutorialSteps[this.currentStep].condition()) {
            this.nextStep();
        }
    }

    /**
     * Animate text typing effect
     * Adds one character at a time with delay
     */
    typeText() {
        if (this.charIndex < this.targetText.length) {
            this.currentText += this.targetText[this.charIndex];
            this.tutorialTexts[0].setText(this.currentText);
            this.charIndex++;
            
            this.typeTimer = this.scene.time.delayedCall(this.typeSpeed, () => {
                this.typeText();
            });
        } else {
            this.isTyping = false;
        }
    }

    /**
     * Display current tutorial step
     * Creates text object and starts typing animation
     */
    showCurrentStep() {
        this.clearTutorialTexts();
        if (this.typeTimer) {
            this.typeTimer.remove();
            this.typeTimer = null;
        }

        if (this.currentStep >= this.tutorialSteps.length) return;

        const step = this.tutorialSteps[this.currentStep];
        const x = this.scene.SCENE_WIDTH * step.position.x;
        const y = this.scene.SCENE_HEIGHT * step.position.y;

        // Create text object and position it
        const text = this.scene.add.text(x, y, '', this.textStyle)
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(-1);

        this.tutorialTexts.push(text);

        // Initialize typing animation
        this.currentText = '';
        this.targetText = step.text;
        this.charIndex = 0;
        this.isTyping = true;
        this.typeText();
    }

    /**
     * Progress to next tutorial step
     */
    nextStep() {
        this.currentStep++;
        this.showCurrentStep();
    }

    /**
     * Remove all active tutorial text objects
     */
    clearTutorialTexts() {
        this.tutorialTexts.forEach(text => text.destroy());
        this.tutorialTexts = [];
    }

    // Player action tracking methods
    hasPlayerMoved() {
        return this.hasMovedLeft && this.hasMovedRight;
    }

    hasPlayerJumped() {
        return this.hasJumped;
    }

    hasPlayerHovered() {
        return this.hasHovered;
    }

    hasPlayerShot() {
        return this.hasShot;
    }

    /**
     * Check if player is near the level end zone
     */
    isNearEndZone() {
        if (!this.scene.player || !this.scene.endZone) return false;
        const distance = Phaser.Math.Distance.Between(
            this.scene.player.x,
            this.scene.player.y,
            this.scene.endZone.x,
            this.scene.endZone.y
        );
        return distance < 200;
    }

    /**
     * Track player shooting action
     */
    onPlayerShoot() {
        this.hasShot = true;
    }

    /**
     * Clean up tutorial system
     * Removes text objects and timers
     */
    destroy() {
        this.clearTutorialTexts();
        if (this.typeTimer) {
            this.typeTimer.remove();
            this.typeTimer = null;
        }
        this.isActive = false;
    }
}
