/**
 * ProceduralGenerator.js
 * Dynamic level generation system for platformer gameplay
 * Creates playable levels with platforms, enemies, and objectives
 * Ensures generated levels are completable and balanced
 */
export class ProceduralGenerator {
    /**
     * Initialize generator with configuration
     * @param {Object} config - Override default settings
     */
    constructor(config = {}) {
        // Level generation settings
        this.config = {
            gridWidth: 20,          // Level width in tiles
            gridHeight: 12,         // Level height in tiles
            minPlatformWidth: 3,    // Shortest platform
            maxPlatformWidth: 8,    // Longest platform
            minGapWidth: 96,        // Minimum jump distance
            maxGapWidth: 160,       // Maximum jump distance
            minPlatformHeight: 32,  // Platform thickness
            platformDensity: 0.6,   // Platform frequency
            solidTileIndices: [26, 27, 28, 29, 30, 31], // Valid platform tiles
            ...config
        };

        // Initialize level grid (32x32 tiles)
        this.grid = Array(this.config.gridHeight).fill().map(() => 
            Array(this.config.gridWidth).fill(0)
        );
    }

    /**
     * Create complete level layout
     * Generates platforms, objectives, and enemies
     * @param {Object} params - Generation parameters
     * @returns {Object} Complete level definition
     */
    generateLevel(params = {}) {
        // Reset level state
        this.grid = Array(this.config.gridHeight).fill().map(() => 
            Array(this.config.gridWidth).fill(0)
        );
        
        // Generate level components
        const platforms = this.generatePlatforms();
        const spawnPoint = this.getSpawnPoint(platforms);
        const endPoint = this.getEndPoint(platforms);
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
     * Create platform layout
     * Places platforms with appropriate gaps
     * @returns {Array} Platform definitions
     */
    generatePlatforms() {
        const platforms = [];
        let currentX = 0;

        // Starting platform for player spawn
        platforms.push({
            x: 0,
            y: this.config.gridHeight - 2,
            width: this.config.minPlatformWidth,
            height: this.config.minPlatformHeight
        });

        // Generate platforms across level width
        while (currentX < this.config.gridWidth) {
            // Calculate platform size
            const platformWidth = Math.floor(
                Math.random() * (this.config.maxPlatformWidth - this.config.minPlatformWidth) + 
                this.config.minPlatformWidth
            );
            
            // Ensure jumpable height
            const platformHeight = Math.floor(
                Math.random() * (this.config.gridHeight / 3) + 
                this.config.gridHeight / 2
            );

            // Add jumpable gap
            const gapWidth = Math.floor(
                Math.random() * (this.config.maxGapWidth / 32 - this.config.minGapWidth / 32) + 
                this.config.minGapWidth / 32
            );

            currentX += gapWidth;

            // Place platform if it fits
            if (currentX + platformWidth <= this.config.gridWidth) {
                platforms.push({
                    x: currentX,
                    y: platformHeight,
                    width: platformWidth,
                    height: this.config.minPlatformHeight
                });

                // Update grid with platform
                this.addPlatform(currentX, platformHeight, platformWidth, this.config.minPlatformHeight);
            }

            currentX += platformWidth;
        }

        return platforms;
    }

    /**
     * Add platform to level grid
     * Updates collision data with random tiles
     * @param {number} startX - Left edge
     * @param {number} startY - Top edge
     * @param {number} width - Platform width
     * @param {number} height - Platform height
     */
    addPlatform(startX, startY, width, height) {
        const endX = Math.min(startX + width, this.config.gridWidth);
        const endY = Math.min(startY + height, this.config.gridHeight);

        for (let gridY = startY; gridY < endY && gridY < this.config.gridHeight; gridY++) {
            for (let gridX = startX; gridX < endX && gridX < this.config.gridWidth; gridX++) {
                // Random solid tile for variety
                const randomSolidTileIndex = this.config.solidTileIndices[
                    Math.floor(Math.random() * this.config.solidTileIndices.length)
                ];
                this.grid[gridY][gridX] = randomSolidTileIndex;
            }
        }
    }

    /**
     * Determine player start position
     * Places player safely on first platform
     * @param {Array} platforms - Platform list
     * @returns {Object} Spawn coordinates
     */
    getSpawnPoint(platforms) {
        const startPlatform = platforms[0];
        return {
            x: startPlatform.x + 2,  // Safe distance from edge
            y: startPlatform.y - 2   // Above platform surface
        };
    }

    /**
     * Determine level end position
     * Places goal on final platform
     * @param {Array} platforms - Platform list
     * @returns {Object} Goal coordinates
     */
    getEndPoint(platforms) {
        const endPlatform = platforms[platforms.length - 1];
        return {
            x: endPlatform.x + Math.floor(endPlatform.width / 2), // Center of platform
            y: endPlatform.y - 2  // Above platform surface
        };
    }

    /**
     * Select random enemy type
     * Provides enemy variety
     * @returns {string} Enemy identifier
     */
    getRandomEnemyType() {
        const types = ['drone', 'warrior'];
        return types[Math.floor(Math.random() * types.length)];
    }

    /**
     * Place enemies throughout level
     * Ensures balanced enemy distribution
     * @param {Array} platforms - Platform list
     * @param {Object} spawnPoint - Player start
     * @param {Object} endPoint - Level goal
     * @returns {Array} Enemy positions and types
     */
    generateEnemyPositions(platforms, spawnPoint, endPoint) {
        const enemyPositions = [];
        const minDistanceFromSpawn = 5; // Safe zone tiles

        platforms.forEach((platform, index) => {
            // Skip spawn and goal platforms
            if (index === 0 || index === platforms.length - 1) {
                return;
            }

            // Check spawn distance
            const distanceFromSpawn = Math.abs(platform.x - spawnPoint.x);

            // Place enemies outside safe zone
            if (distanceFromSpawn > minDistanceFromSpawn) {
                // Scale enemies to platform size
                const maxEnemies = Math.min(Math.floor(platform.width / 3), 2);
                const enemyCount = Math.max(1, maxEnemies);

                // Distribute enemies evenly
                for (let i = 0; i < enemyCount; i++) {
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
     * Verify level is playable
     * Checks basic completion requirements
     * @param {Array} platforms - Platform list
     * @param {Object} spawnPoint - Player start
     * @param {Object} endPoint - Level goal
     * @returns {boolean} Level validity
     */
    validateLevel(platforms, spawnPoint, endPoint) {
        if (platforms.length < 2) return false;  // Need multiple platforms
        if (!spawnPoint || !endPoint) return false;  // Need objectives
        if (platforms.length < 3) return false;  // Need enough challenge
        return true;
    }

    /**
     * Check for solid tiles
     * Used for collision detection
     * @param {number} x - Grid X position
     * @param {number} y - Grid Y position
     * @returns {boolean} Has collision
     */
    checkCollision(x, y) {
        if (x < 0 || x >= this.config.gridWidth || y < 0 || y >= this.config.gridHeight) {
            return true;  // Out of bounds
        }
        return this.grid[y][x] !== 0;  // Non-zero = solid
    }
}
