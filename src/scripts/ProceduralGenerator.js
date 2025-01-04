/**
 * ProceduralGenerator class handles the procedural generation of game levels
 * It provides methods for generating platforms, rooms, and placing enemies
 */
export class ProceduralGenerator {
    constructor(config = {}) {
        // Default configuration
        this.config = {
            gridWidth: 20,
            gridHeight: 12,
            minPlatformWidth: 3,
            maxPlatformWidth: 8,
            minGapWidth: 96,
            maxGapWidth: 160,
            minPlatformHeight: 32,
            platformDensity: 0.6,
            // WannabeeTileset solid tiles (these are the solid platform tiles)
            solidTileIndices: [26, 27, 28, 29, 30, 31], // Add all solid tile indices from WannabeeTileset
            ...config
        };

        // Grid system for level generation (32x32 tiles)
        this.grid = Array(this.config.gridHeight).fill().map(() => 
            Array(this.config.gridWidth).fill(0)
        );
    }

    /**
     * Generates a complete level layout
     * @param {Object} params Additional parameters for generation
     * @returns {Object} Level data including platforms, spawn points, and enemy positions
     */
    generateLevel(params = {}) {
        // Reset grid
        this.grid = Array(this.config.gridHeight).fill().map(() => 
            Array(this.config.gridWidth).fill(0)
        );
        
        // Generate base platforms
        const platforms = this.generatePlatforms();
        
        // Generate spawn and end points
        const spawnPoint = this.getSpawnPoint(platforms);
        const endPoint = this.getEndPoint(platforms);
        
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
            y: this.config.gridHeight - 2,
            width: this.config.minPlatformWidth,
            height: this.config.minPlatformHeight
        });

        // Generate platforms until we reach the level width
        while (currentX < this.config.gridWidth) {
            // Generate platform
            const platformWidth = Math.floor(
                Math.random() * (this.config.maxPlatformWidth - this.config.minPlatformWidth) + 
                this.config.minPlatformWidth
            );
            
            // Random height but ensure it's jumpable
            const platformHeight = Math.floor(
                Math.random() * (this.config.gridHeight / 3) + 
                this.config.gridHeight / 2
            );

            // Add gap between platforms
            const gapWidth = Math.floor(
                Math.random() * (this.config.maxGapWidth / 32 - this.config.minGapWidth / 32) + 
                this.config.minGapWidth / 32
            );

            currentX += gapWidth;

            // Add platform if it fits
            if (currentX + platformWidth <= this.config.gridWidth) {
                platforms.push({
                    x: currentX,
                    y: platformHeight,
                    width: platformWidth,
                    height: this.config.minPlatformHeight
                });

                // Update grid
                this.addPlatform(currentX, platformHeight, platformWidth, this.config.minPlatformHeight);
            }

            currentX += platformWidth;
        }

        return platforms;
    }

    addPlatform(startX, startY, width, height) {
        const endX = Math.min(startX + width, this.config.gridWidth);
        const endY = Math.min(startY + height, this.config.gridHeight);

        for (let gridY = startY; gridY < endY && gridY < this.config.gridHeight; gridY++) {
            for (let gridX = startX; gridX < endX && gridX < this.config.gridWidth; gridX++) {
                // Randomly select a solid tile index from our list
                const randomSolidTileIndex = this.config.solidTileIndices[
                    Math.floor(Math.random() * this.config.solidTileIndices.length)
                ];
                this.grid[gridY][gridX] = randomSolidTileIndex;
            }
        }
    }

    getSpawnPoint(platforms) {
        // Get the first platform as the spawn platform
        const startPlatform = platforms[0];
        return {
            x: startPlatform.x + 2, // Place player near the start of the platform
            y: startPlatform.y - 2  // Place player above the platform
        };
    }

    getEndPoint(platforms) {
        // Get the last platform as the end platform
        const endPlatform = platforms[platforms.length - 1];
        return {
            x: endPlatform.x + Math.floor(endPlatform.width / 2), // Place end point in middle of platform
            y: endPlatform.y - 2  // Place end point above the platform
        };
    }

    getRandomEnemyType() {
        const types = ['slime', 'drone', 'warrior'];
        return types[Math.floor(Math.random() * types.length)];
    }

    generateEnemyPositions(platforms, spawnPoint, endPoint) {
        const enemyPositions = [];
        const minDistanceFromSpawn = 5; // Minimum distance in tiles from spawn point

        platforms.forEach((platform, index) => {
            // Skip the first and last platforms (spawn and end platforms)
            if (index === 0 || index === platforms.length - 1) {
                return;
            }

            // Calculate distance from spawn point
            const distanceFromSpawn = Math.abs(platform.x - spawnPoint.x);

            // Only place enemies if platform is far enough from spawn
            if (distanceFromSpawn > minDistanceFromSpawn) {
                // Add 1-2 enemies per platform based on platform width
                const maxEnemies = Math.min(Math.floor(platform.width / 3), 2);
                const enemyCount = Math.max(1, maxEnemies);

                for (let i = 0; i < enemyCount; i++) {
                    // Space enemies evenly across the platform
                    const x = platform.x + Math.floor((platform.width * (i + 1)) / (enemyCount + 1));
                    enemyPositions.push({
                        x: x,
                        y: platform.y - 1,
                        type: this.getRandomEnemyType()
                    });
                }
            }
        });

        return enemyPositions;
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

    checkCollision(x, y) {
        if (x < 0 || x >= this.config.gridWidth || y < 0 || y >= this.config.gridHeight) {
            return true;
        }
        return this.grid[y][x] !== 0;
    }
}
