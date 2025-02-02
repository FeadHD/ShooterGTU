/**
 * Player Input Controller
 * Handles keyboard and mouse input for player actions
 * Supports key rebinding and persistent control settings
 */
import Phaser from 'phaser';

export class PlayerController {
    /**
     * Initialize player controls with default or saved key bindings
     * @param {Phaser.Scene} scene - The game scene this controller belongs to
     */
    constructor(scene) {
        this.scene = scene;
        this.enabled = true;  // Control state flag
        
        // Default key mapping configuration
        this.defaultBindings = {
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
            specialAttack: Phaser.Input.Keyboard.KeyCodes.Q,
            shoot: 'MOUSE_LEFT',
            shift: Phaser.Input.Keyboard.KeyCodes.SHIFT
        };
        
        // Initialize controls from saved settings or defaults
        this.keyBindings = this.loadKeyBindings();
        this.controls = this.createControls();
    }

    /**
     * Create control objects for each action
     * Handles both keyboard and mouse inputs
     * @private
     */
    createControls() {
        const controls = {};
        for (const [action, key] of Object.entries(this.keyBindings)) {
            if (typeof key === 'string' && key.startsWith('MOUSE_')) {
                // Create mouse button handlers
                controls[action] = {
                    isDown: () => {
                        if (!this.enabled) return false;
                        switch (key) {
                            case 'MOUSE_LEFT': return this.scene.input.activePointer.leftButtonDown();
                            case 'MOUSE_RIGHT': return this.scene.input.activePointer.rightButtonDown();
                            case 'MOUSE_MIDDLE': return this.scene.input.activePointer.middleButtonDown();
                            default: return false;
                        }
                    }
                };
            } else {
                // Create keyboard key handlers
                controls[action] = this.scene.input.keyboard.addKey(key);
            }
        }
        return controls;
    }

    /**
     * Load saved key bindings from localStorage
     * @returns {Object} Key bindings configuration
     * @private
     */
    loadKeyBindings() {
        const savedBindings = localStorage.getItem('keyBindings');
        return savedBindings ? JSON.parse(savedBindings) : {...this.defaultBindings};
    }

    /**
     * Save current key bindings to localStorage
     * @private
     */
    saveKeyBindings() {
        localStorage.setItem('keyBindings', JSON.stringify(this.keyBindings));
    }

    /**
     * Change key binding for a specific action
     * @param {string} action - Action to rebind
     * @param {KeyboardEvent} event - Key event containing new binding
     */
    changeKeyBinding(action, event) {
        let keyCode;
        
        // Map special keys to Phaser key codes
        switch(event.key) {
            case 'ArrowUp': keyCode = Phaser.Input.Keyboard.KeyCodes.UP; break;
            case 'ArrowDown': keyCode = Phaser.Input.Keyboard.KeyCodes.DOWN; break;
            case 'ArrowLeft': keyCode = Phaser.Input.Keyboard.KeyCodes.LEFT; break;
            case 'ArrowRight': keyCode = Phaser.Input.Keyboard.KeyCodes.RIGHT; break;
            default: keyCode = event.keyCode;
        }

        // Update binding and recreate control
        this.keyBindings[action] = keyCode;
        if (this.controls[action]) {
            this.controls[action].destroy();
        }
        this.controls[action] = this.scene.input.keyboard.addKey(keyCode);
        this.saveKeyBindings();
    }

    /**
     * Get display name for a key code
     * @param {(number|string)} keyCode - Key code or mouse button identifier
     * @returns {string} Human-readable key name
     */
    getKeyName(keyCode) {
        // Handle mouse button names
        if (typeof keyCode === 'string' && keyCode.startsWith('MOUSE_')) {
            switch (keyCode) {
                case 'MOUSE_LEFT': return 'LMB';
                case 'MOUSE_RIGHT': return 'RMB';
                case 'MOUSE_MIDDLE': return 'MMB';
                default: return keyCode.replace('MOUSE_', '');
            }
        }

        // Map key codes to display names
        const keyMap = {
            // Letters
            65: 'A', 66: 'B', 67: 'C', 68: 'D', 69: 'E', 70: 'F', 71: 'G', 72: 'H',
            73: 'I', 74: 'J', 75: 'K', 76: 'L', 77: 'M', 78: 'N', 79: 'O', 80: 'P',
            81: 'Q', 82: 'R', 83: 'S', 84: 'T', 85: 'U', 86: 'V', 87: 'W', 88: 'X',
            89: 'Y', 90: 'Z',
            
            // Numbers
            48: '0', 49: '1', 50: '2', 51: '3', 52: '4',
            53: '5', 54: '6', 55: '7', 56: '8', 57: '9',
            
            // Special Keys
            [Phaser.Input.Keyboard.KeyCodes.UP]: '↑',
            [Phaser.Input.Keyboard.KeyCodes.DOWN]: '↓',
            [Phaser.Input.Keyboard.KeyCodes.LEFT]: '←',
            [Phaser.Input.Keyboard.KeyCodes.RIGHT]: '→',
            [Phaser.Input.Keyboard.KeyCodes.SPACE]: 'SPACE',
            [Phaser.Input.Keyboard.KeyCodes.SHIFT]: 'SHIFT',
            [Phaser.Input.Keyboard.KeyCodes.CTRL]: 'CTRL',
            [Phaser.Input.Keyboard.KeyCodes.ALT]: 'ALT',
            [Phaser.Input.Keyboard.KeyCodes.TAB]: 'TAB',
            [Phaser.Input.Keyboard.KeyCodes.ESC]: 'ESC',
            [Phaser.Input.Keyboard.KeyCodes.ENTER]: 'ENTER',
            
            // Numpad
            96: 'NUM0', 97: 'NUM1', 98: 'NUM2', 99: 'NUM3', 100: 'NUM4',
            101: 'NUM5', 102: 'NUM6', 103: 'NUM7', 104: 'NUM8', 105: 'NUM9',
            
            // Function keys
            112: 'F1', 113: 'F2', 114: 'F3', 115: 'F4', 116: 'F5',
            117: 'F6', 118: 'F7', 119: 'F8', 120: 'F9', 121: 'F10',
            122: 'F11', 123: 'F12'
        };

        return keyMap[keyCode] || 'NONE';
    }

    /**
     * Create UI for key binding configuration
     * Allows players to rebind controls in-game
     */
    setupKeyBindingUI() {
        const actions = Object.keys(this.keyBindings);
        actions.forEach(action => {
            const button = document.createElement('button');
            button.textContent = `Change ${action} key: ${this.getKeyName(this.keyBindings[action])}`;
            
            button.addEventListener('click', () => {
                button.textContent = 'Press any key...';
                
                const handleKeyPress = (event) => {
                    event.preventDefault();
                    this.changeKeyBinding(action, event);
                    button.textContent = `Change ${action} key: ${this.getKeyName(this.keyBindings[action])}`;
                    document.removeEventListener('keydown', handleKeyPress);
                };
                
                document.addEventListener('keydown', handleKeyPress, { once: true });
            });
            
            document.getElementById('keyBindingContainer')?.appendChild(button);
        });
    }

    /**
     * Reset all key bindings to defaults
     */
    resetToDefaults() {
        this.keyBindings = { ...this.defaultBindings };
        this.saveKeyBindings();
    }

    /**
     * Set up mouse-based shooting controls
     * @param {Object} player - Player object to control
     */
    setupShootingControls(player) {
        this.scene.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                const direction = player.flipX ? 'left' : 'right';
                player.shoot(direction);
            }
        });
    }

    // Input state check methods
    isMovingUp() { return this.enabled && this.controls.up.isDown; }
    isMovingDown() { return this.enabled && this.controls.down.isDown; }
    isMovingLeft() { return this.enabled && this.controls.left.isDown; }
    isMovingRight() { return this.enabled && this.controls.right.isDown; }
    isSpecialAttacking() { return this.enabled && Phaser.Input.Keyboard.JustDown(this.controls.specialAttack); }
    isShooting() { return this.enabled && this.controls.shoot.isDown; }
    isRolling() { return this.controls.shift.isDown && (this.isMovingLeft() || this.isMovingRight()); }

    /**
     * Clean up controller resources
     * Called when removing the controller
     */
    destroy() {
        // Clean up control objects
        if (this.controls) {
            Object.values(this.controls).forEach(control => {
                if (control && typeof control.destroy === 'function') {
                    control.destroy();
                }
            });
        }
        
        // Clear references
        this.controls = null;
        this.scene = null;
        this.enabled = false;
    }
}
