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

        // Define tutorial steps
        this.tutorialSteps = [
            {
                text: 'Use A and D to move left and right',
                condition: () => this.hasPlayerMoved(),
                position: { x: 0.5, y: 0.2 }
            },
            {
                text: 'Press SPACE to jump',
                condition: () => this.hasPlayerJumped(),
                position: { x: 0.5, y: 0.2 }
            },
            {
                text: 'Press SPACE in mid-air\nfor double jump!',
                condition: () => this.hasPlayerDoubleJumped(),
                position: { x: 0.5, y: 0.2 }
            },
            {
                text: 'Click to shoot',
                condition: () => this.hasPlayerShot(),
                position: { x: 0.5, y: 0.2 }
            },
            {
                text: 'Reach the end to start the game',
                condition: () => this.isNearEndZone(),
                position: { x: 0.5, y: 0.2 }
            }
        ];

        // Initialize tracking variables
        this.hasMovedLeft = false;
        this.hasMovedRight = false;
        this.hasJumped = false;
        this.hasDoubleJumped = false;
        this.hasShot = false;
    }

    start() {
        if (!this.isActive) return;
        this.showCurrentStep();
    }

    update() {
        if (!this.isActive) return;

        // Track player movement
        if (this.scene.player) {
            if (this.scene.player.body.velocity.x < 0) this.hasMovedLeft = true;
            if (this.scene.player.body.velocity.x > 0) this.hasMovedRight = true;
            
            // Track jumps
            if (this.scene.player.body.velocity.y < 0 && 
                this.scene.player.controller.controls.jump.isDown) {
                if (this.scene.player.jumpsAvailable === 1) {
                    this.hasJumped = true;
                } else if (this.scene.player.jumpsAvailable === 0) {
                    this.hasDoubleJumped = true;
                }
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

    hasPlayerDoubleJumped() {
        return this.hasDoubleJumped;
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
