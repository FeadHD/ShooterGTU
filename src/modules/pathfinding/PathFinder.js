class PathNode {
    constructor(x, y, walkable = true) {
        this.x = x;
        this.y = y;
        this.walkable = walkable;
        this.g = 0;
        this.h = 0;
        this.f = 0;
        this.parent = null;
        this.jumpNode = false;  // Indicates if this node requires jumping to reach
        this.fallNode = false;  // Indicates if this node requires falling to reach
        this.jumpHeight = 4;    // Maximum jump height in grid cells
        this.maxFallHeight = 8; // Maximum safe fall height in grid cells
    }
}

export class PlatformPathFinder {
    constructor(scene, gridSize = 32) {
        this.scene = scene;
        this.gridSize = gridSize;
        this.grid = [];
        this.openList = [];
        this.closedList = [];
        this.debugGraphics = this.scene.debugSystem ? this.scene.debugSystem.debugGraphics : null;
        this.gravity = true;    // Enable gravity-based movement constraints
    }

    initializeGrid() {
        const width = Math.ceil(this.scene.scale.width / this.gridSize);
        const height = Math.ceil(this.scene.scale.height / this.gridSize);
        
        this.grid = Array(height).fill().map((_, y) => 
            Array(width).fill().map((_, x) => new PathNode(x, y))
        );

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

        // Mark platforms and identify jump/fall points
        this.analyzePlatforms();
    }

    analyzePlatforms() {
        for (let y = 0; y < this.grid.length; y++) {
            for (let x = 0; x < this.grid[y].length; x++) {
                const node = this.grid[y][x];
                if (!node.walkable) continue;

                // Check if node is a platform (walkable with solid ground below)
                const isOnPlatform = this.isGrounded(x, y);
                
                // Identify potential jump points
                if (isOnPlatform) {
                    this.markJumpNodes(x, y);
                    this.markFallNodes(x, y);
                }
            }
        }
    }

    isGrounded(x, y) {
        return y + 1 < this.grid.length && !this.grid[y + 1][x].walkable;
    }

    markJumpNodes(x, y) {
        // Check for reachable platforms within jump height
        for (let jumpY = y - 1; jumpY >= Math.max(0, y - this.grid[y][x].jumpHeight); jumpY--) {
            for (let jumpX = x - 2; jumpX <= x + 2; jumpX++) {
                if (jumpX < 0 || jumpX >= this.grid[0].length) continue;
                if (this.grid[jumpY][jumpX].walkable && this.isGrounded(jumpX, jumpY)) {
                    this.grid[jumpY][jumpX].jumpNode = true;
                }
            }
        }
    }

    markFallNodes(x, y) {
        // Check for safe landing spots within fall height
        for (let fallY = y + 1; fallY <= Math.min(this.grid.length - 1, y + this.grid[y][x].maxFallHeight); fallY++) {
            for (let fallX = x - 2; fallX <= x + 2; fallX++) {
                if (fallX < 0 || fallX >= this.grid[0].length) continue;
                if (this.grid[fallY][fallX].walkable && this.isGrounded(fallX, fallY)) {
                    this.grid[fallY][fallX].fallNode = true;
                }
            }
        }
    }

    getNeighbors(node) {
        const neighbors = [];
        
        // Standard horizontal movement
        const horizontalDirs = [
            { x: -1, y: 0 }, // Left
            { x: 1, y: 0 }   // Right
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

        // Jump movements
        if (this.isGrounded(node.x, node.y)) {
            this.addJumpNeighbors(node, neighbors);
        }

        // Fall movements
        this.addFallNeighbors(node, neighbors);

        return neighbors;
    }

    addJumpNeighbors(node, neighbors) {
        const jumpHeight = node.jumpHeight;
        
        // Check potential jump destinations
        for (let y = 1; y <= jumpHeight; y++) {
            const jumpY = node.y - y;
            if (jumpY < 0) break;

            // Check jump arcs (wider at apex)
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

    addFallNeighbors(node, neighbors) {
        const maxFallHeight = node.maxFallHeight;
        
        // Check potential fall destinations
        for (let y = 1; y <= maxFallHeight; y++) {
            const fallY = node.y + y;
            if (fallY >= this.grid.length) break;

            // Check fall trajectories (wider as falling)
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

    hasValidJumpPath(startNode, endNode) {
        // Simple line of sight check for jump path
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

    hasValidFallPath(startNode, endNode) {
        // Similar to jump path check but for falling
        return this.hasValidJumpPath(startNode, endNode);
    }

    isValidPosition(x, y) {
        return y >= 0 && y < this.grid.length && x >= 0 && x < this.grid[0].length;
    }

    // Override the heuristic to account for vertical movement
    heuristic(nodeA, nodeB) {
        const dx = Math.abs(nodeA.x - nodeB.x);
        const dy = Math.abs(nodeA.y - nodeB.y);
        
        // Penalize vertical movement slightly to prefer horizontal paths when possible
        return dx + (dy * 1.5);
    }

    findPath(startX, startY, endX, endY) {
        // Convert pixel coordinates to grid coordinates
        const gridStartX = Math.floor(startX / this.gridSize);
        const gridStartY = Math.floor(startY / this.gridSize);
        const gridEndX = Math.floor(endX / this.gridSize);
        const gridEndY = Math.floor(endY / this.gridSize);

        // Validate grid coordinates
        if (!this.isValidPosition(gridStartX, gridStartY) || !this.isValidPosition(gridEndX, gridEndY)) {
            return null;
        }

        // Reset lists
        this.openList = [];
        this.closedList = [];
        
        // Get start and end nodes
        const startNode = this.grid[gridStartY][gridStartX];
        const endNode = this.grid[gridEndY][gridEndX];
        
        if (!startNode || !endNode || !startNode.walkable || !endNode.walkable) {
            return null;
        }
        
        // Add start node to open list
        this.openList.push(startNode);
        
        while (this.openList.length > 0) {
            // Get node with lowest f cost
            const currentNode = this.openList.reduce((min, node) => 
                node.f < min.f ? node : min, this.openList[0]);
            
            // Remove current node from open list and add to closed list
            this.openList = this.openList.filter(node => node !== currentNode);
            this.closedList.push(currentNode);
            
            // Found path
            if (currentNode === endNode) {
                return this.reconstructPath(endNode);
            }
            
            // Check neighbors
            const neighbors = this.getNeighbors(currentNode);
            for (const neighbor of neighbors) {
                if (this.closedList.includes(neighbor)) {
                    continue;
                }
                
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
        
        return null; // No path found
    }
    
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
    
    getMovementCost(nodeA, nodeB) {
        // Base movement cost
        const dx = Math.abs(nodeA.x - nodeB.x);
        const dy = Math.abs(nodeA.y - nodeB.y);
        let cost = Math.sqrt(dx * dx + dy * dy);
        
        // Additional cost for vertical movement
        if (nodeB.jumpNode) {
            cost *= 1.5; // Jumping is more costly
        }
        if (nodeB.fallNode) {
            cost *= 1.2; // Falling has a moderate cost
        }
        
        return cost;
    }

    debugDrawGrid() {
        if (!this.debugGraphics) return;
        
        this.debugGraphics.clear();
        
        // Draw grid
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