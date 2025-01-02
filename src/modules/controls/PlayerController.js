import Phaser from 'phaser';

export class PlayerController {
    constructor(scene) {
        this.scene = scene;
        this.enabled = true;  
        this.defaultBindings = {
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
            specialAttack: Phaser.Input.Keyboard.KeyCodes.Q
        };
        
        // Load saved bindings from localStorage or use defaults
        this.keyBindings = this.loadKeyBindings();
        this.controls = this.createControls();
    }

    createControls() {
        const controls = {};
        Object.entries(this.keyBindings).forEach(([action, keyCode]) => {
            controls[action] = this.scene.input.keyboard.addKey(keyCode);
        });
        return controls;
    }

    loadKeyBindings() {
        const savedBindings = localStorage.getItem('keyBindings');
        return savedBindings ? JSON.parse(savedBindings) : {...this.defaultBindings};
    }

    saveKeyBindings() {
        localStorage.setItem('keyBindings', JSON.stringify(this.keyBindings));
    }

    changeKeyBinding(action, event) {
        // Handle both keyCode and key for better arrow key support
        let keyCode;
        
        // Map arrow keys to their Phaser key codes
        switch(event.key) {
            case 'ArrowUp':
                keyCode = Phaser.Input.Keyboard.KeyCodes.UP;
                break;
            case 'ArrowDown':
                keyCode = Phaser.Input.Keyboard.KeyCodes.DOWN;
                break;
            case 'ArrowLeft':
                keyCode = Phaser.Input.Keyboard.KeyCodes.LEFT;
                break;
            case 'ArrowRight':
                keyCode = Phaser.Input.Keyboard.KeyCodes.RIGHT;
                break;
            default:
                // For non-arrow keys, use the keyCode
                keyCode = event.keyCode;
        }

        this.keyBindings[action] = keyCode;
        
        // Clean up old key binding
        if (this.controls[action]) {
            this.controls[action].destroy();
        }
        
        // Create new key binding
        this.controls[action] = this.scene.input.keyboard.addKey(keyCode);
        this.saveKeyBindings();
    }

    getKeyName(keyCode) {
        // Add special handling for arrow keys
        switch(keyCode) {
            case Phaser.Input.Keyboard.KeyCodes.UP:
                return '↑';
            case Phaser.Input.Keyboard.KeyCodes.DOWN:
                return '↓';
            case Phaser.Input.Keyboard.KeyCodes.LEFT:
                return '←';
            case Phaser.Input.Keyboard.KeyCodes.RIGHT:
                return '→';
            default:
                const keyName = Phaser.Input.Keyboard.KeyCodes[keyCode];
                return keyName || String.fromCharCode(keyCode);
        }
    }

    setupKeyBindingUI() {
        const actions = Object.keys(this.keyBindings);
        actions.forEach(action => {
            // Create UI elements for key binding
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

    resetToDefaults() {
        this.keyBindings = {...this.defaultBindings};
        Object.values(this.controls).forEach(key => key.destroy());
        this.controls = this.createControls();
        this.saveKeyBindings();
    }

    setupShootingControls(player) {
        this.scene.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                const direction = player.flipX ? 'left' : 'right';
                player.shoot(direction);
            }
        });
    }

    isMovingLeft() {
        return this.enabled && this.controls.left.isDown;
    }

    isMovingRight() {
        return this.enabled && this.controls.right.isDown;
    }

    isMovingUp() {
        return this.enabled && this.controls.up.isDown;
    }

    isMovingDown() {
        return this.enabled && this.controls.down.isDown;
    }

    isJumping() {
        return this.enabled && Phaser.Input.Keyboard.JustDown(this.controls.up);
    }

    isSpecialAttacking() {
        return this.enabled && Phaser.Input.Keyboard.JustDown(this.controls.specialAttack);
    }

    destroy() {
        Object.values(this.controls).forEach(key => key.destroy());
    }
}
