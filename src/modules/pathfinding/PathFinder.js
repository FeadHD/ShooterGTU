/**
 * PathFinder.js
 * A* pathfinding system with platform-specific movement capabilities
 * Handles jumping, falling, and platform-based navigation
 */

/**
 * Represents a single node in the pathfinding grid
 * Stores position, movement costs, and traversal properties
 */
class PathNode {
    /**
     * Initialize a new PathNode
     * @param {number} x - Grid x-coordinate
     * @param {number} y - Grid y-coordinate
     * @param {boolean} walkable - Whether the node is walkable
     */
    constructor(x, y, walkable = true) {
        this.x = x;
        this.y = y;
        this.walkable = walkable;
        this.g = 0;              // Cost from start to this node
        this.h = 0;              // Estimated cost to end
        this.f = 0;              // Total cost (g + h)
        this.parent = null;      // Previous node in path
        this.jumpNode = false;   // Node requires jumping to reach
        this.fallNode = false;   // Node requires falling to reach
        this.jumpHeight = 4;     // Max jump height in grid cells
        this.maxFallHeight = 8;  // Max safe fall height in cells
    }
}

/**
 * PlatformPathFinder class
 * Handles pathfinding and navigation for platform-based games
 */
export class PlatformPathFinder {
    /**
     * Initialize the pathfinding system
     * @param {Phaser.Scene} scene - Game scene for collision/debug
     * @param {number} gridSize - Size of each grid cell in pixels
     */
    constructor(scene, gridSize = 32) {
        this.scene = scene;
        this.gridSize = gridSize;
        this.grid = [];             // 2D grid of PathNodes
        this.openList = [];         // Nodes to be evaluated
        this.closedList = [];       // Already evaluated nodes
        this.debugGraphics = this.scene.debugSystem ? this.scene.debugSystem.debugGraphics : null;
        this.gravity = true;        // Enable gravity-based constraints
    }

    /**
     * Create and initialize the navigation grid
     * Maps collision layers to walkable/unwalkable nodes
     */
    initializeGrid() {
        const width = Math.ceil(this.scene.scale.width / this.gridSize);
        const height = Math.ceil(this.scene.scale.height / this.gridSize);
        
        // Create empty grid
        this.grid = Array(height).fill().map((_, y) => 
            Array(width).fill().map((_, x) => new PathNode(x, y))
        );

        // Mark collision tiles as unwalkable
        if (this.scene.map && this.scene.map.layers) {
            this.scene.map.layers.forEach(layer => {
                if (layer.tilemapLayer && layer.properties && layer.properties.collision) {
                    layer.tilemapLayer.forEachTile(tile => {
                        if (tile && tile.index !== -1) {
                            const gridX = Math.floor(tile.x);
                            const gridY = Math.floor(tile.y);
                            if (this.grid[gridY] && this.grid[gridY][gridX]) {
                                this.grid[gridY][gridX].walkable = false;
                            }
                        }
                    });
                }
            });
        }

        this.analyzePlatforms();
    }

    /**
     * Analyze grid to identify platforms and movement points
     * Marks nodes that require jumping or falling to reach
     */
    analyzePlatforms() {
        for (let y = 0; y < this.grid.length; y++) {
            for (let x = 0; x < this.grid[y].length; x++) {
                const node = this.grid[y][x];
                if (!node.walkable) continue;

                const isOnPlatform = this.isGrounded(x, y);
                
                if (isOnPlatform) {
                    this.markJumpNodes(x, y);
                    this.markFallNodes(x, y);
                }
            }
        }
    }

    /**
     * Check if position has solid ground below
     * @param {number} x - Grid x-coordinate
     * @param {number} y - Grid y-coordinate
     * @returns {boolean} Whether the position has solid ground below
     */
    isGrounded(x, y) {
        return y + 1 < this.grid.length && !this.grid[y + 1][x].walkable;
    }

    /**
     * Mark nodes that can be reached by jumping
     * Considers jump height and horizontal distance
     * @param {number} x - Grid x-coordinate
     * @param {number} y - Grid y-coordinate
     */
    markJumpNodes(x, y) {
        for (let jumpY = y - 1; jumpY >= Math.max(0, y - this.grid[y][x].jumpHeight); jumpY--) {
            for (let jumpX = x - 2; jumpX <= x + 2; jumpX++) {
                if (jumpX < 0 || jumpX >= this.grid[0].length) continue;
                if (this.grid[jumpY][jumpX].walkable && this.isGrounded(jumpX, jumpY)) {
                    this.grid[jumpY][jumpX].jumpNode = true;
                }
            }
        }
    }

    /**
     * Mark nodes that can be safely reached by falling
     * Considers maximum fall height and horizontal distance
     * @param {number} x - Grid x-coordinate
     * @param {number} y - Grid y-coordinate
     */
    markFallNodes(x, y) {
        for (let fallY = y + 1; fallY <= Math.min(this.grid.length - 1, y + this.grid[y][x].maxFallHeight); fallY++) {
            for (let fallX = x - 2; fallX <= x + 2; fallX++) {
                if (fallX < 0 || fallX >= this.grid[0].length) continue;
                if (this.grid[fallY][fallX].walkable && this.isGrounded(fallX, fallY)) {
                    this.grid[fallY][fallX].fallNode = true;
                }
            }
        }
    }

    /**
     * Get all valid neighbors for a node
     * Includes horizontal, jump, and fall movements
     * @param {PathNode} node - Node to get neighbors for
     * @returns {PathNode[]} Array of neighboring nodes
     */
    getNeighbors(node) {
        const neighbors = [];
        
        // Check horizontal movement
        const horizontalDirs = [
            { x: -1, y: 0 },
            { x: 1, y: 0 }
        ];

        for (const dir of horizontalDirs) {
            const newX = node.x + dir.x;
            const newY = node.y;

            if (this.isValidPosition(newX, newY)) {
                const neighbor = this.grid[newY][newX];
                if (neighbor.walkable && this.isGrounded(newX, newY)) {
                    neighbors.push(neighbor);
                }
            }
        }

        // Add jump and fall neighbors if applicable
        if (this.isGrounded(node.x, node.y)) {
            this.addJumpNeighbors(node, neighbors);
        }
        this.addFallNeighbors(node, neighbors);

        return neighbors;
    }

    /**
     * Add valid jump destinations to neighbors list
     * Considers jump arc and platform positions
     * @param {PathNode} node - Node to add jump neighbors for
     * @param {PathNode[]} neighbors - Array of neighboring nodes
     */
    addJumpNeighbors(node, neighbors) {
        const jumpHeight = node.jumpHeight;
        
        for (let y = 1; y <= jumpHeight; y++) {
            const jumpY = node.y - y;
            if (jumpY < 0) break;

            const horizontalRange = Math.min(2, Math.ceil(y / 2));
            for (let x = -horizontalRange; x <= horizontalRange; x++) {
                const jumpX = node.x + x;
                if (!this.isValidPosition(jumpX, jumpY)) continue;

                const jumpNode = this.grid[jumpY][jumpX];
                if (jumpNode.walkable && jumpNode.jumpNode && 
                    this.hasValidJumpPath(node, jumpNode)) {
                    neighbors.push(jumpNode);
                }
            }
        }
    }

    /**
     * Add valid fall destinations to neighbors list
     * Considers fall trajectory and safe landing spots
     * @param {PathNode} node - Node to add fall neighbors for
     * @param {PathNode[]} neighbors - Array of neighboring nodes
     */
    addFallNeighbors(node, neighbors) {
        const maxFallHeight = node.maxFallHeight;
        
        for (let y = 1; y <= maxFallHeight; y++) {
            const fallY = node.y + y;
            if (fallY >= this.grid.length) break;

            const horizontalRange = Math.min(2, Math.ceil(y / 2));
            for (let x = -horizontalRange; x <= horizontalRange; x++) {
                const fallX = node.x + x;
                if (!this.isValidPosition(fallX, fallY)) continue;

                const fallNode = this.grid[fallY][fallX];
                if (fallNode.walkable && fallNode.fallNode && 
                    this.hasValidFallPath(node, fallNode)) {
                    neighbors.push(fallNode);
                }
            }
        }
    }

    /**
     * Check if jump path is clear of obstacles
     * @param {PathNode} startNode - Starting node of jump path
     * @param {PathNode} endNode - Ending node of jump path
     * @returns {boolean} Whether the jump path is clear
     */
    hasValidJumpPath(startNode, endNode) {
        const dx = endNode.x - startNode.x;
        const dy = endNode.y - startNode.y;
        const steps = Math.max(Math.abs(dx), Math.abs(dy));
        
        for (let i = 1; i < steps; i++) {
            const x = Math.floor(startNode.x + (dx * i) / steps);
            const y = Math.floor(startNode.y + (dy * i) / steps);
            
            if (!this.isValidPosition(x, y) || !this.grid[y][x].walkable) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Check if fall path is clear of obstacles
     * @param {PathNode} startNode - Starting node of fall path
     * @param {PathNode} endNode - Ending node of fall path
     * @returns {boolean} Whether the fall path is clear
     */
    hasValidFallPath(startNode, endNode) {
        return this.hasValidJumpPath(startNode, endNode);
    }

    /**
     * Check if grid position is within bounds
     * @param {number} x - Grid x-coordinate
     * @param {number} y - Grid y-coordinate
     * @returns {boolean} Whether the position is within bounds
     */
    isValidPosition(x, y) {
        return y >= 0 && y < this.grid.length && x >= 0 && x < this.grid[0].length;
    }

    /**
     * Calculate movement cost heuristic
     * Prefers horizontal movement over vertical
     * @param {PathNode} nodeA - Starting node
     * @param {PathNode} nodeB - Ending node
     * @returns {number} Heuristic cost
     */
    heuristic(nodeA, nodeB) {
        const dx = Math.abs(nodeA.x - nodeB.x);
        const dy = Math.abs(nodeA.y - nodeB.y);
        return dx + (dy * 1.5);  // Vertical movement costs more
    }

    /**
     * Find path between two points using A* algorithm
     * Returns array of points or null if no path exists
     * @param {number} startX - Starting x-coordinate
     * @param {number} startY - Starting y-coordinate
     * @param {number} endX - Ending x-coordinate
     * @param {number} endY - Ending y-coordinate
     * @returns {Object[]} Array of path points or null
     */
    findPath(startX, startY, endX, endY) {
        // Convert to grid coordinates
        const gridStartX = Math.floor(startX / this.gridSize);
        const gridStartY = Math.floor(startY / this.gridSize);
        const gridEndX = Math.floor(endX / this.gridSize);
        const gridEndY = Math.floor(endY / this.gridSize);

        if (!this.isValidPosition(gridStartX, gridStartY) || 
            !this.isValidPosition(gridEndX, gridEndY)) {
            return null;
        }

        this.openList = [];
        this.closedList = [];
        
        const startNode = this.grid[gridStartY][gridStartX];
        const endNode = this.grid[gridEndY][gridEndX];
        
        if (!startNode || !endNode || !startNode.walkable || !endNode.walkable) {
            return null;
        }
        
        this.openList.push(startNode);
        
        while (this.openList.length > 0) {
            const currentNode = this.openList.reduce((min, node) => 
                node.f < min.f ? node : min, this.openList[0]);
            
            this.openList = this.openList.filter(node => node !== currentNode);
            this.closedList.push(currentNode);
            
            if (currentNode === endNode) {
                return this.reconstructPath(endNode);
            }
            
            const neighbors = this.getNeighbors(currentNode);
            for (const neighbor of neighbors) {
                if (this.closedList.includes(neighbor)) continue;
                
                const gCost = currentNode.g + this.getMovementCost(currentNode, neighbor);
                
                if (!this.openList.includes(neighbor) || gCost < neighbor.g) {
                    neighbor.g = gCost;
                    neighbor.h = this.heuristic(neighbor, endNode);
                    neighbor.f = neighbor.g + neighbor.h;
                    neighbor.parent = currentNode;
                    
                    if (!this.openList.includes(neighbor)) {
                        this.openList.push(neighbor);
                    }
                }
            }
        }
        
        return null;
    }
    
    /**
     * Convert node path to world coordinates
     * @param {PathNode} endNode - Ending node of path
     * @returns {Object[]} Array of path points in world coordinates
     */
    reconstructPath(endNode) {
        const path = [];
        let currentNode = endNode;
        
        while (currentNode) {
            path.unshift({
                x: currentNode.x * this.gridSize,
                y: currentNode.y * this.gridSize,
                jumpNode: currentNode.jumpNode,
                fallNode: currentNode.fallNode
            });
            currentNode = currentNode.parent;
        }
        
        return path;
    }
    
    /**
     * Calculate movement cost between nodes
     * Adds penalties for jumping and falling
     * @param {PathNode} nodeA - Starting node
     * @param {PathNode} nodeB - Ending node
     * @returns {number} Movement cost
     */
    getMovementCost(nodeA, nodeB) {
        const dx = Math.abs(nodeA.x - nodeB.x);
        const dy = Math.abs(nodeA.y - nodeB.y);
        let cost = Math.sqrt(dx * dx + dy * dy);
        
        if (nodeB.jumpNode) cost *= 1.5;  // Jump penalty
        if (nodeB.fallNode) cost *= 1.2;  // Fall penalty
        
        return cost;
    }

    /**
     * Debug visualization of navigation grid
     */
    debugDrawGrid() {
        if (!this.debugGraphics) return;
        
        this.debugGraphics.clear();
        
        for (let y = 0; y < this.grid.length; y++) {
            for (let x = 0; x < this.grid[y].length; x++) {
                const node = this.grid[y][x];
                const color = node.walkable ? 0x00ff00 : 0xff0000;
                this.debugGraphics.lineStyle(1, color, 0.3);
                this.debugGraphics.strokeRect(
                    x * this.gridSize, 
                    y * this.gridSize, 
                    this.gridSize, 
                    this.gridSize
                );
            }
        }
    }
    
    /**
     * Debug visualization of calculated path
     * @param {Object[]} path - Array of path points
     */
    debugDrawPath(path) {
        if (!this.debugGraphics || !path) return;
        
        this.debugGraphics.lineStyle(3, 0x00ff00, 1);
        for (let i = 0; i < path.length - 1; i++) {
            this.debugGraphics.lineBetween(
                path[i].x + this.gridSize / 2,
                path[i].y + this.gridSize / 2,
                path[i + 1].x + this.gridSize / 2,
                path[i + 1].y + this.gridSize / 2
            );
        }
    }
}