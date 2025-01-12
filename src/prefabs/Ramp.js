/**
 * Ramp.js
 * =======
 * A triangular ramp prefab that provides one-way platform functionality.
 * Uses Matter.js physics for accurate triangular collision.
 */

export class Ramp extends Phaser.GameObjects.Sprite {
    /**
     * Create a new ramp instance
     * @param {Phaser.Scene} scene - The scene this ramp belongs to
     * @param {number} x - The x position of the ramp
     * @param {number} y - The y position of the ramp
     */
    constructor(scene, x, y) {
        super(scene, x, y, '__DEFAULT');
        
        this.width = 32;
        this.height = 32;
        this.scene = scene;
        
        this.#createRampGraphics();
        this.#setupMatterPhysics();
        
        // Add to scene's display list
        scene.add.existing(this);
    }

    //-------------------------------------------------------------------------
    // Graphics Methods
    //-------------------------------------------------------------------------
    
    /**
     * Creates the triangular graphics for the ramp
     * @private
     */
    #createRampGraphics() {
        // Create a texture for the ramp
        const graphics = this.scene.add.graphics();
        graphics.lineStyle(2, 0x00ff00); // Green outline
        graphics.fillStyle(0x2c3e50); // Dark blue-gray fill
        
        // Draw triangle
        graphics.beginPath();
        graphics.moveTo(this.width, this.height);  // Bottom-right
        graphics.lineTo(this.width, 0);           // Top-right
        graphics.lineTo(0, this.height);          // Bottom-left
        graphics.closePath();
        graphics.fillPath();
        graphics.strokePath();
        
        // Generate and set texture
        const key = this.#getTextureKey();
        graphics.generateTexture(key, this.width, this.height);
        graphics.destroy();
        
        this.setTexture(key);
        this.setOrigin(0, 0);
        this.setDepth(1);
    }

    //-------------------------------------------------------------------------
    // Physics Methods
    //-------------------------------------------------------------------------
    
    /**
     * Sets up Matter.js physics for the ramp
     * @private
     */
    #setupMatterPhysics() {
        if (!this.scene.matter || !this.scene.matter.add) {
            console.warn('Matter physics not available. Ramp will be created without physics.');
            return;
        }

        // Create triangular physics body
        const vertices = [
            { x: this.width, y: this.height },  // Bottom-right
            { x: this.width, y: 0 },           // Top-right
            { x: 0, y: this.height }           // Bottom-left
        ];

        // Create Matter.js body
        this.matterBody = this.scene.matter.add.fromVertices(
            this.x + this.width / 2,
            this.y + this.height / 2,
            vertices,
            {
                isStatic: true,
                friction: 0.5,
                restitution: 0
            }
        );

        // Store reference to this game object
        this.matterBody.gameObject = this;
    }

    //-------------------------------------------------------------------------
    // Utility Methods
    //-------------------------------------------------------------------------
    
    /**
     * Generates a unique texture key for this ramp
     * @private
     * @returns {string} The texture key
     */
    #getTextureKey() {
        return `ramp_${this.width}x${this.height}`;
    }

    /**
     * Updates the ramp's position
     * @param {number} x - New x position
     * @param {number} y - New y position
     */
    setPosition(x, y) {
        super.setPosition(x, y);
        if (this.matterBody) {
            this.scene.matter.body.setPosition(this.matterBody, {
                x: x + this.width / 2,
                y: y + this.height / 2
            });
        }
    }

    /**
     * Clean up resources when destroying the ramp
     */
    destroy() {
        // Remove Matter.js body
        if (this.matterBody) {
            this.scene.matter.world.remove(this.matterBody);
        }

        // Clean up the generated texture
        const key = this.texture.key;
        if (this.scene && this.scene.textures.exists(key)) {
            this.scene.textures.remove(key);
        }
        super.destroy();
    }
}
