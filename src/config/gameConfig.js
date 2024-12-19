export const gameConfig = {
    // Game dimensions
    width: 800,
    height: 600,
    
    // Physics settings
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: false
        }
    },
    
    // Player settings
    player: {
        speed: 200,
        jumpVelocity: -400,
        size: {
            width: 16,
            height: 32
        }
    },
    
    // Enemy settings
    enemy: {
        basic: {
            health: 2,
            speed: 100,
            size: {
                width: 16,
                height: 32
            }
        },
        strong: {
            health: 4,
            speed: 75,
            size: {
                width: 16,
                height: 32
            }
        }
    },
    
    // Weapon settings
    weapons: {
        bullet: {
            speed: 400,
            lifespan: 1000
        }
    },
    
    // Audio settings
    audio: {
        musicVolume: 0.15,
        sfxVolume: 0.3
    }
};
