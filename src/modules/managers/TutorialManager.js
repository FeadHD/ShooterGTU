export class TutorialManager {
    constructor(scene) {
        this.scene = scene;
        this.tutorialTexts = [];
        this.currentStep = 0;
        this.isActive = true;
        this.isTyping = false;
        this.currentText = '';
        this.targetText = '';
        this.typeTimer = null;
        this.charIndex = 0;
        this.typeSpeed = 50; // milliseconds per character
        
        // Style for tutorial text
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

        // Define tutorial steps with dynamic key bindings
        this.updateTutorialSteps();

        // Initialize tracking variables
        this.hasMovedLeft = false;
        this.hasMovedRight = false;
        this.hasJumped = false;
        this.hasHovered = false;
        this.hasShot = false;
    }

    getKeyName(keyCode) {
        if (!keyCode) return 'UNKNOWN';
        
        // Handle mouse buttons
        if (typeof keyCode === 'string' && keyCode.startsWith('MOUSE_')) {
            switch (keyCode) {
                case 'MOUSE_LEFT': return 'Left Click';
                case 'MOUSE_RIGHT': return 'Right Click';
                case 'MOUSE_MIDDLE': return 'Middle Click';
                default: return keyCode.replace('MOUSE_', '');
            }
        }

        // Handle keyboard keys
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

        // Convert numeric key code
        if (typeof keyCode === 'number') {
            return keyNames[keyCode] || String.fromCharCode(keyCode);
        }

        // Convert Phaser key code object
        if (typeof keyCode === 'object' && keyCode.hasOwnProperty('value')) {
            return keyNames[keyCode.value] || String.fromCharCode(keyCode.value);
        }

        return 'UNKNOWN';
    }

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

    start() {
        if (!this.isActive) return;
        // Update tutorial steps with current key bindings before showing
        this.updateTutorialSteps();
        this.showCurrentStep();
    }

    update() {
        if (!this.isActive) return;

        // Track player movement
        if (this.scene.player) {
            if (this.scene.player.body.velocity.x < 0) this.hasMovedLeft = true;
            if (this.scene.player.body.velocity.x > 0) this.hasMovedRight = true;
            
            // Track jumps and hover
            if (this.scene.player.body.velocity.y < 0 && 
                this.scene.player.controller.controls.jump.isDown) {
                if (!this.scene.player.body.touching.down) {
                    this.hasJumped = true;
                }
            }

            // Track hover
            if (this.scene.player.isHovering) {
                this.hasHovered = true;
            }
        }

        // Check if current step is completed
        if (!this.isTyping && 
            this.currentStep < this.tutorialSteps.length && 
            this.tutorialSteps[this.currentStep].condition()) {
            this.nextStep();
        }
    }

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

    showCurrentStep() {
        // Clear previous text and timer
        this.clearTutorialTexts();
        if (this.typeTimer) {
            this.typeTimer.remove();
            this.typeTimer = null;
        }

        if (this.currentStep >= this.tutorialSteps.length) return;

        const step = this.tutorialSteps[this.currentStep];
        const x = this.scene.SCENE_WIDTH * step.position.x;
        const y = this.scene.SCENE_HEIGHT * step.position.y;

        // Create text object with empty string
        const text = this.scene.add.text(x, y, '', this.textStyle)
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(-1); // Set depth to be behind player

        this.tutorialTexts.push(text);

        // Setup typing effect
        this.currentText = '';
        this.targetText = step.text;
        this.charIndex = 0;
        this.isTyping = true;
        
        // Start typing effect
        this.typeText();
    }

    nextStep() {
        this.currentStep++;
        this.showCurrentStep();
    }

    clearTutorialTexts() {
        this.tutorialTexts.forEach(text => text.destroy());
        this.tutorialTexts = [];
    }

    // Condition checking methods
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

    onPlayerShoot() {
        this.hasShot = true;
    }

    destroy() {
        this.clearTutorialTexts();
        if (this.typeTimer) {
            this.typeTimer.remove();
            this.typeTimer = null;
        }
        this.isActive = false;
    }
}
