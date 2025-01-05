export class TextStyleManager {
    constructor(scene) {
        this.scene = scene;
        this.styles = this.initializeStyles();
    }

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

    // Base styles that other styles can extend
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

    // Shadow effects that can be applied to text
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

    // Color schemes
    static get colors() {
        return {
            primary: '#00ffff',    // Cyan
            secondary: '#ff00ff',  // Magenta
            accent: '#ffd700',     // Gold
            warning: '#ff0000',    // Red
            success: '#00ff00',    // Green
            neutral: '#ffffff',    // White
            score: '#00ffff',      // Cyan
            lives: '#ff1493',      // Deep Pink
            hp: '#00ff00',         // Lime
            bitcoin: '#ffd700',    // Gold
            timer: '#ff00ff',      // Magenta
            wallet: '#40e0d0',     // Turquoise
            scene: '#9370db',      // Medium Purple
            config: '#ffffff',     // White
            pause: '#ffffff'       // White for pause menu
        };
    }

    // Main style definitions
    static get styles() {
        return {
            // Title styles
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

            // Button styles
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
                    color: '#4a4a4a'  // Dark gray
                }
            },

            // UI styles
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
                    color: '#005555'  // Darker cyan
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
                    color: '#8b0a50'  // Darker pink
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
                    color: '#006400'  // Dark green
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
                    color: '#b8860b'  // Dark golden rod
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
                    color: '#8b008b'  // Dark magenta
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
                    color: '#20b2aa'  // Light Sea Green
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
                    color: '#483d8b'  // Dark Slate Blue
                }
            },
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

            // Configuration styles
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

    // Helper method to get a style with fallback
    static getStyle(styleName) {
        const style = this.styles[styleName];
        if (!style) {
            console.warn(`Style '${styleName}' not found in TextStyleManager`);
            return this.styles.configText; // fallback to basic style
        }
        return typeof style === 'function' ? style() : { ...style };
    }

    // Helper method to apply hover effects
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

    // Helper method to create text with style
    static createText(scene, x, y, text, styleName, origin = 0.5, interactive = false) {
        const textObject = scene.add.text(x, y, text, this.getStyle(styleName))
            .setOrigin(origin);

        if (interactive) {
            this.applyHoverEffect(textObject);
        }

        return textObject;
    }
}
