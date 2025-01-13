export class PlayerHUD {
    constructor(scene, x, y, fixedToCamera = false) {
        this.scene = scene;
        this.x = x;
        this.y = y;

        // Create containers for health and stamina bars
        this.healthContainer = scene.add.container(x, y);
        this.staminaContainer = scene.add.container(x, y + 14); // Position below health bar

        // Fix to camera if requested
        if (fixedToCamera) {
            this.healthContainer.setScrollFactor(0);
            this.staminaContainer.setScrollFactor(0);
        }

        // Initialize UI elements
        this.createHealthBar();
        this.createStaminaBar();

        // Set up registry event listeners
        this.setupEventListeners();
    }

    createHealthBar() {
        // Create health text
        this.healthText = this.scene.add.text(0, -2, '100', {
            fontFamily: 'Gameplay',
            fontSize: '12px',
            fill: '#00ffff',
            stroke: '#000000',
            strokeThickness: 2,
            resolution: 8,
            antialias: false,
            letterSpacing: 8
        });
        this.healthContainer.add(this.healthText);
        this.textWidth = this.healthText.width;

        // Create health segments
        this.healthSegments = [];
        this.segmentWidth = 22;
        this.segmentSpacing = 3;
        const segmentColor = 0x00ffff;
        this.cornerRadius = 2;
        const barHeight = 8;

        for (let i = 0; i < 10; i++) {
            const graphics = this.scene.add.graphics();
            
            graphics.lineStyle(1, 0x000000, 1);
            graphics.fillStyle(segmentColor, 1);
            
            graphics.fillRoundedRect(
                this.textWidth + 2 + (i * (this.segmentWidth + this.segmentSpacing)),
                2,
                this.segmentWidth,
                barHeight,
                this.cornerRadius
            );
            graphics.strokeRoundedRect(
                this.textWidth + 2 + (i * (this.segmentWidth + this.segmentSpacing)),
                2,
                this.segmentWidth,
                barHeight,
                this.cornerRadius
            );
            
            this.healthSegments.push(graphics);
            this.healthContainer.add(graphics);
        }

        // Add heart icon and lives counter
        const heartX = this.textWidth + 2 + (10 * (this.segmentWidth + this.segmentSpacing)) + 4;
        
        // Add heart symbol
        this.heartText = this.scene.add.text(heartX, -4, '❤', {
            fontFamily: 'Gameplay',
            fontSize: '24px',
            fill: '#ff0000',
            stroke: '#000000',
            strokeThickness: 2,
            resolution: 8,
            antialias: false
        });
        this.healthContainer.add(this.heartText);

        // Add x symbol
        this.livesSymbol = this.scene.add.text(heartX + 25, 8, 'x', {
            fontFamily: 'Gameplay',
            fontSize: '8px',
            fill: '#ff0000',
            stroke: '#000000',
            strokeThickness: 1,
            resolution: 8,
            antialias: false
        });
        this.healthContainer.add(this.livesSymbol);

        // Add lives counter
        this.livesText = this.scene.add.text(heartX + 32, 8, '3', {
            fontFamily: 'Gameplay',
            fontSize: '8px',
            fill: '#ff0000',
            stroke: '#000000',
            strokeThickness: 1,
            letterSpacing: 8,
            resolution: 8,
            antialias: false
        });
        this.healthContainer.add(this.livesText);
    }

    createStaminaBar() {
        // Create stamina segments with smaller dimensions
        this.staminaSegments = [];
        const staminaColor = 0x8A2BE2; // Dark purple color
        const staminaHeight = 4;
        this.staminaWidth = this.segmentWidth / 1.5;
        this.staminaSpacing = 2;

        for (let i = 0; i < 10; i++) {
            const graphics = this.scene.add.graphics();
            
            graphics.lineStyle(1, 0x000000, 1);
            graphics.fillStyle(staminaColor, 1);
            
            graphics.fillRoundedRect(
                this.textWidth + 2 + (i * (this.staminaWidth + this.staminaSpacing)),
                2,
                this.staminaWidth,
                staminaHeight,
                1
            );
            graphics.strokeRoundedRect(
                this.textWidth + 2 + (i * (this.staminaWidth + this.staminaSpacing)),
                2,
                this.staminaWidth,
                staminaHeight,
                1
            );
            
            this.staminaSegments.push(graphics);
            this.staminaContainer.add(graphics);
        }
    }

    setupEventListeners() {
        // Listen for health changes
        this.scene.registry.events.on('changedata-playerHP', (_, value) => {
            this.updateHealth(value);
        });

        // Listen for stamina changes
        this.scene.registry.events.on('changedata-stamina', (_, value) => {
            this.updateStamina(value);
        });

        // Listen for lives changes
        this.scene.registry.events.on('changedata-playerLives', (_, value) => {
            this.updateLives(value);
        });
    }

    updateHealth(health) {
        const maxHealth = 100;
        const healthPercentage = Math.max(0, Math.min(100, health)) / maxHealth;
        const numActiveSegments = Math.ceil(healthPercentage * 10);

        // Update segments
        this.healthSegments.forEach((graphics, index) => {
            graphics.clear();
            
            graphics.lineStyle(1, 0x000000, 1);
            graphics.fillStyle(index < numActiveSegments ? 0x00ffff : 0x006666, 1); // Cyan for active, dark cyan for inactive
            
            graphics.fillRoundedRect(
                this.textWidth + 2 + (index * (this.segmentWidth + this.segmentSpacing)),
                2,
                this.segmentWidth,
                8,
                this.cornerRadius
            );
            graphics.strokeRoundedRect(
                this.textWidth + 2 + (index * (this.segmentWidth + this.segmentSpacing)),
                2,
                this.segmentWidth,
                8,
                this.cornerRadius
            );
        });

        this.healthText.setText(Math.max(0, Math.round(health)).toString());
    }

    updateStamina(stamina) {
        const maxStamina = 100;
        const staminaPercentage = Math.max(0, Math.min(100, stamina)) / maxStamina;
        const numActiveSegments = Math.ceil(staminaPercentage * 10);

        // Update segments
        this.staminaSegments.forEach((graphics, index) => {
            graphics.clear();
            
            graphics.lineStyle(1, 0x000000, 1);
            graphics.fillStyle(index < numActiveSegments ? 0x8A2BE2 : 0x4B0082, 1); // Dark purple for active, darker for inactive
            
            graphics.fillRoundedRect(
                this.textWidth + 2 + (index * (this.staminaWidth + this.staminaSpacing)),
                2,
                this.staminaWidth,
                4,
                1
            );
            graphics.strokeRoundedRect(
                this.textWidth + 2 + (index * (this.staminaWidth + this.staminaSpacing)),
                2,
                this.staminaWidth,
                4,
                1
            );
        });
    }

    updateLives(lives) {
        if (this.livesText) {
            this.livesText.setText(lives.toString());
        }
    }

    destroy() {
        // Clean up event listeners
        this.scene.registry.events.off('changedata-playerHP');
        this.scene.registry.events.off('changedata-stamina');
        this.scene.registry.events.off('changedata-playerLives');

        // Destroy containers and their contents
        this.healthContainer.destroy();
        this.staminaContainer.destroy();
    }
}
