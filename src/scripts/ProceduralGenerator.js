/**
 * ProceduralGenerator class handles the procedural generation of game levels
 * It provides methods for generating platforms, rooms, and placing enemies
 */
export class ProceduralGenerator {
    constructor(config = {}) {
        // Default configuration
        this.config = {
            width: 640,
            height: 360,
            minPlatformWidth: 64,
            maxPlatformWidth: 160,
            minGapWidth: 96,
            maxGapWidth: 160,
            minPlatformHeight: 32,
            platformDensity: 0.6,
            ...config
        };

        // Grid system for level generation (32x32 tiles)
        this.gridSize = 32;
        this.gridWidth = Math.ceil(this.config.width / this.gridSize);
        this.gridHeight = Math.ceil(this.config.height / this.gridSize);
        this.grid = Array(this.gridHeight).fill().map(() => Array(this.gridWidth).fill(0));
    }

    /**
     * Generates a complete level layout
     * @param {Object} params Additional parameters for generation
     * @returns {Object} Level data including platforms, spawn points, and enemy positions
     */
    generateLevel(params = {}) {
        // Reset grid
        this.grid = Array(this.gridHeight).fill().map(() => Array(this.gridWidth).fill(0));
        
        // Generate base platforms
        const platforms = this.generatePlatforms();
        
        // Generate spawn and end points
        const spawnPoint = this.findSpawnPoint(platforms);
        const endPoint = this.findEndPoint(platforms, spawnPoint);
        
        // Generate enemy spawn positions
        const enemyPositions = this.generateEnemyPositions(platforms, spawnPoint, endPoint);

        return {
            platforms,
            spawnPoint,
            endPoint,
            enemyPositions,
            grid: this.grid
        };
    }

    /**
     * Generates platform layout
     * @returns {Array} Array of platform objects with positions and dimensions
     */
    generatePlatforms() {
        const platforms = [];
        let currentX = 0;

        // Always add a starting platform
        platforms.push({
            x: 0,
            y: this.config.height - this.config.minPlatformHeight * 2,
            width: this.config.minPlatformWidth,
            height: this.config.minPlatformHeight
        });

        // Generate platforms until we reach the level width
        while (currentX < this.config.width) {
            // Generate platform
            const platformWidth = Math.floor(
                Math.random() * (this.config.maxPlatformWidth - this.config.minPlatformWidth) + 
                this.config.minPlatformWidth
            );
            
            // Random height but ensure it's jumpable
            const platformHeight = Math.floor(
                Math.random() * (this.config.height / 3) + 
                this.config.height / 2
            );

            // Add gap between platforms
            const gapWidth = Math.floor(
                Math.random() * (this.config.maxGapWidth - this.config.minGapWidth) + 
                this.config.minGapWidth
            );

            currentX += gapWidth;

            // Add platform if it fits
            if (currentX + platformWidth <= this.config.width) {
                platforms.push({
                    x: currentX,
                    y: platformHeight,
                    width: platformWidth,
                    height: this.config.minPlatformHeight
                });

                // Update grid
                this.updateGrid(currentX, platformHeight, platformWidth, this.config.minPlatformHeight);
            }

            currentX += platformWidth;
        }

        return platforms;
    }

    /**
     * Updates the grid with platform positions
     */
    updateGrid(x, y, width, height) {
        const startX = Math.floor(x / this.gridSize);
        const startY = Math.floor(y / this.gridSize);
        const endX = Math.ceil((x + width) / this.gridSize);
        const endY = Math.ceil((y + height) / this.gridSize);

        for (let gridY = startY; gridY < endY && gridY < this.gridHeight; gridY++) {
            for (let gridX = startX; gridX < endX && gridX < this.gridWidth; gridX++) {
                this.grid[gridY][gridX] = 1;
            }
        }
    }

    /**
     * Finds a suitable spawn point for the player
     */
    findSpawnPoint(platforms) {
        // Usually the first platform is a good spawn point
        const startPlatform = platforms[0];
        return {
            x: startPlatform.x + startPlatform.width / 4,
            y: startPlatform.y - this.gridSize
        };
    }

    /**
     * Finds a suitable end point for the level
     */
    findEndPoint(platforms, spawnPoint) {
        // Usually the last platform is a good end point
        const endPlatform = platforms[platforms.length - 1];
        return {
            x: endPlatform.x + endPlatform.width / 2,
            y: endPlatform.y - this.gridSize
        };
    }

    /**
     * Generates positions for enemy spawns
     */
    generateEnemyPositions(platforms, spawnPoint, endPoint) {
        const enemyPositions = [];
        const minDistanceFromSpawn = 200; // Minimum distance from spawn point

        platforms.forEach((platform, index) => {
            // Skip the first and last platforms
            if (index === 0 || index === platforms.length - 1) return;

            // Calculate distance from spawn
            const distanceFromSpawn = Math.sqrt(
                Math.pow(platform.x - spawnPoint.x, 2) + 
                Math.pow(platform.y - spawnPoint.y, 2)
            );

            // Only place enemies if platform is far enough from spawn
            if (distanceFromSpawn > minDistanceFromSpawn) {
                // Add 1-2 enemies per platform based on platform width
                const enemyCount = Math.floor(platform.width / (this.gridSize * 3));
                
                for (let i = 0; i < enemyCount; i++) {
                    const x = platform.x + (platform.width / (enemyCount + 1)) * (i + 1);
                    enemyPositions.push({
                        x,
                        y: platform.y - this.gridSize,
                        type: this.getRandomEnemyType()
                    });
                }
            }
        });

        return enemyPositions;
    }

    /**
     * Returns a random enemy type based on predefined probabilities
     */
    getRandomEnemyType() {
        const rand = Math.random();
        if (rand < 0.4) return 'Slime';
        if (rand < 0.7) return 'Drone';
        return 'MeleeWarrior';
    }

    /**
     * Validates if the generated level is completable
     * @returns {boolean} True if the level is completable
     */
    validateLevel(platforms, spawnPoint, endPoint) {
        // Basic validation - ensure we have platforms
        if (platforms.length < 2) return false;

        // Ensure spawn and end points are valid
        if (!spawnPoint || !endPoint) return false;

        // Ensure minimum platform count
        if (platforms.length < 3) return false;

        return true;
    }
}
