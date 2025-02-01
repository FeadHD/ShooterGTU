/**
 * TextStyleManager.js
 * Manages text styles and visual effects for the game's UI
 * Provides consistent styling across different UI components
 * Includes retro-themed styles, colors, and animations
 */
export class TextStyleManager {
    /**
     * Initialize style manager for a scene
     * @param {Scene} scene - Phaser scene to manage styles for
     */
    constructor(scene) {
        this.scene = scene;
        this.styles = this.initializeStyles();
    }

    /**
     * Creates basic UI styles with consistent formatting
     * @returns {Object} Collection of common UI styles
     */
    initializeStyles() {
        return {
            score: { ...TextStyleManager.baseStyles.retro, fontSize: '24px', fill: TextStyleManager.colors.score },
            lives: { ...TextStyleManager.baseStyles.retro, fontSize: '24px', fill: TextStyleManager.colors.lives },
            hp: { ...TextStyleManager.baseStyles.retro, fontSize: '24px', fill: TextStyleManager.colors.hp },
            timer: { ...TextStyleManager.baseStyles.retro, fontSize: '24px', fill: TextStyleManager.colors.timer },
            bitcoin: { ...TextStyleManager.baseStyles.retro, fontSize: '24px', fill: TextStyleManager.colors.bitcoin },
            fps: { ...TextStyleManager.baseStyles.retro, fontSize: '16px', fill: TextStyleManager.colors.neutral },
            wallet: { ...TextStyleManager.baseStyles.retro, fontSize: '20px', fill: TextStyleManager.colors.bitcoin }
        };
    }

    /**
     * Base text styles for different themes
     * Retro style uses pixel font with stroke
     * Arcade style uses classic arcade font
     */
    static get baseStyles() {
        return {
            retro: {
                fontFamily: 'Retronoid, Arial',
                align: 'center',
                stroke: '#ffffff',
                strokeThickness: 2
            },
            arcade: {
                fontFamily: 'ArcadeClassic',
                align: 'center'
            }
        };
    }

    /**
     * Text shadow presets for visual effects
     * Neon: Strong glow effect for titles
     * Subtle: Soft shadow for UI elements
     */
    static get shadowEffects() {
        return {
            neon: {
                offsetX: 2,
                offsetY: 2,
                color: '#ff00ff',
                blur: 8,
                fill: true
            },
            subtle: {
                offsetX: 1,
                offsetY: 1,
                color: '#ff00ff',
                blur: 4,
                fill: true
            }
        };
    }

    /**
     * Game color palette
     * Cyberpunk-inspired colors for UI elements
     * Each color serves a specific UI purpose
     */
    static get colors() {
        return {
            // Primary colors for main UI elements
            primary: '#00ffff',    // Cyan - Main UI
            secondary: '#ff00ff',  // Magenta - Highlights
            accent: '#ffd700',     // Gold - Special items
            
            // Status indicators
            warning: '#ff0000',    // Red - Danger/alerts
            success: '#00ff00',    // Green - Success/positive
            neutral: '#ffffff',    // White - Default text
            
            // Game UI elements
            score: '#00ffff',      // Cyan - Score display
            lives: '#ff1493',      // Deep Pink - Life counter
            hp: '#00ff00',         // Lime - Health bar
            bitcoin: '#ffd700',    // Gold - Currency
            timer: '#ff00ff',      // Magenta - Timer
            wallet: '#40e0d0',     // Turquoise - Wallet
            
            // Menu elements
            scene: '#9370db',      // Medium Purple - Scene titles
            config: '#ffffff',     // White - Config text
            pause: '#ffffff'       // White - Pause menu
        };
    }

    /**
     * Complete style definitions for all UI elements
     * Combines base styles, colors, and effects
     */
    static get styles() {
        return {
            // Title styles with neon effects
            mainTitle: {
                ...this.baseStyles.retro,
                fontSize: '100px',
                color: this.colors.primary,
                shadow: this.shadowEffects.neon
            },
            titleShadow: (isBase = false) => ({
                ...this.baseStyles.retro,
                fontSize: '100px',
                color: isBase ? '#4400ff' : this.colors.secondary
            }),
            missionTitle: {
                ...this.baseStyles.retro,
                fontSize: '48px',
                color: this.colors.primary,
                shadow: this.shadowEffects.subtle
            },

            // Interactive button styles
            menuButton: {
                ...this.baseStyles.retro,
                fontSize: '72px',
                color: this.colors.primary,
                strokeThickness: 4,
                shadow: {
                    ...this.shadowEffects.neon,
                    offsetX: 3,
                    offsetY: 3,
                    blur: 5
                }
            },
            walletButton: {
                ...this.baseStyles.retro,
                fontSize: '32px',
                color: this.colors.primary,
                padding: { x: 15, y: 10 },
                shadow: this.shadowEffects.subtle
            },
            pauseButton: {
                ...this.baseStyles.retro,
                fontSize: '24px',
                color: this.colors.pause,
                align: 'center',
                strokeThickness: 2,
                shadow: {
                    ...this.shadowEffects.neon,
                    color: '#4a4a4a'
                }
            },

            // Game UI element styles
            gameUI: {
                ...this.baseStyles.retro,
                fontSize: '24px',
                color: this.colors.neutral,
                align: 'left',
                strokeThickness: 1
            },
            scoreUI: {
                ...this.baseStyles.retro,
                fontSize: '24px',
                color: this.colors.score,
                align: 'left',
                strokeThickness: 1,
                shadow: {
                    ...this.shadowEffects.subtle,
                    color: '#005555'
                }
            },
            livesUI: {
                ...this.baseStyles.retro,
                fontSize: '24px',
                color: this.colors.lives,
                align: 'left',
                strokeThickness: 1,
                shadow: {
                    ...this.shadowEffects.subtle,
                    color: '#8b0a50'
                }
            },
            hpUI: {
                ...this.baseStyles.retro,
                fontSize: '24px',
                color: this.colors.hp,
                align: 'left',
                strokeThickness: 1,
                shadow: {
                    ...this.shadowEffects.subtle,
                    color: '#006400'
                }
            },
            bitcoinUI: {
                ...this.baseStyles.retro,
                fontSize: '24px',
                color: this.colors.bitcoin,
                align: 'left',
                strokeThickness: 1,
                shadow: {
                    ...this.shadowEffects.subtle,
                    color: '#b8860b'
                }
            },
            timerUI: {
                ...this.baseStyles.retro,
                fontSize: '24px',
                color: this.colors.timer,
                align: 'left',
                strokeThickness: 1,
                shadow: {
                    ...this.shadowEffects.subtle,
                    color: '#8b008b'
                }
            },
            walletUI: {
                ...this.baseStyles.retro,
                fontSize: '24px',
                color: this.colors.wallet,
                align: 'left',
                strokeThickness: 1,
                shadow: {
                    ...this.shadowEffects.subtle,
                    color: '#20b2aa'
                }
            },
            sceneUI: {
                ...this.baseStyles.retro,
                fontSize: '32px',
                color: this.colors.scene,
                align: 'center',
                strokeThickness: 2,
                shadow: {
                    ...this.shadowEffects.subtle,
                    color: '#483d8b'
                }
            },

            // Special state styles
            gameUIHighlight: {
                ...this.baseStyles.retro,
                fontSize: '24px',
                color: this.colors.primary,
                align: 'left',
                strokeThickness: 1
            },
            startMessage: {
                ...this.baseStyles.retro,
                fontSize: '48px',
                color: this.colors.primary,
                shadow: this.shadowEffects.subtle
            },
            gameOver: {
                ...this.baseStyles.retro,
                fontSize: '72px',
                color: this.colors.warning,
                shadow: this.shadowEffects.neon
            },

            // Configuration and debug styles
            configUI: {
                ...this.baseStyles.retro,
                fontSize: '24px',
                color: this.colors.config,
                fontFamily: 'Arial',
                align: 'left'
            },
            proceduralUI: {
                ...this.baseStyles.retro,
                fontSize: '24px',
                color: this.colors.config,
                fontFamily: 'Arial',
                align: 'left'
            },
            configText: {
                ...this.baseStyles.arcade,
                fontSize: '24px',
                color: this.colors.neutral
            },
            enemyTypeText: {
                ...this.baseStyles.arcade,
                fontSize: '20px',
                color: this.colors.neutral
            }
        };
    }

    /**
     * Retrieves a style by name with fallback
     * @param {string} styleName - Name of the style to retrieve
     * @returns {Object} Style object or default style if not found
     */
    static getStyle(styleName) {
        const style = this.styles[styleName];
        if (!style) {
            console.warn(`Style '${styleName}' not found in TextStyleManager`);
            return this.styles.configText;
        }
        return typeof style === 'function' ? style() : { ...style };
    }

    /**
     * Adds hover animation to text objects
     * Scales up and changes color on hover
     * @param {Phaser.GameObjects.Text} textObject - Text to make interactive
     * @param {string} hoverColor - Color when hovered
     * @param {string} baseColor - Default color
     */
    static applyHoverEffect(textObject, hoverColor = this.colors.secondary, baseColor = this.colors.primary) {
        if (!textObject) return;

        textObject.setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
                textObject.setScale(1.2);
                textObject.setColor(hoverColor);
            })
            .on('pointerout', () => {
                textObject.setScale(1);
                textObject.setColor(baseColor);
            });
    }

    /**
     * Creates a text object with specified style
     * @param {Scene} scene - Scene to add text to
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} text - Text content
     * @param {string} styleName - Name of style to use
     * @param {number} origin - Text origin point
     * @param {boolean} interactive - Whether to add hover effects
     * @returns {Phaser.GameObjects.Text} Created text object
     */
    static createText(scene, x, y, text, styleName, origin = 0.5, interactive = false) {
        const textObject = scene.add.text(x, y, text, this.getStyle(styleName))
            .setOrigin(origin);

        if (interactive) {
            this.applyHoverEffect(textObject);
        }

        return textObject;
    }
}
