import Phaser from 'phaser';

export class PlayerController {
    constructor(scene) {
        this.scene = scene;
        this.defaultBindings = {
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
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
        const keyCode = event.keyCode;
        this.keyBindings[action] = keyCode;
        
        // Clean up old key binding
        if (this.controls[action]) {
            this.controls[action].destroy();
        }
        
        // Create new key binding
        this.controls[action] = this.scene.input.keyboard.addKey(keyCode);
        this.saveKeyBindings();
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
                    button.textContent = `Change ${action} key: ${this.getKeyName(event.keyCode)}`;
                    document.removeEventListener('keydown', handleKeyPress);
                };
                
                document.addEventListener('keydown', handleKeyPress, { once: true });
            });
            
            document.getElementById('keyBindingContainer')?.appendChild(button);
        });
    }

    getKeyName(keyCode) {
        return Phaser.Input.Keyboard.KeyCodes[keyCode] || String.fromCharCode(keyCode);
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
        return this.controls.left.isDown;
    }

    isMovingRight() {
        return this.controls.right.isDown;
    }

    isJumping() {
        return this.controls.up.isDown;
    }

    destroy() {
        Object.values(this.controls).forEach(key => key.destroy());
    }
}
