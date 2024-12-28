import { PathfindingDebug } from '../debug/PathfindingDebug';

class PathNode {
    constructor(x, y, walkable = true) {
        this.x = x;
        this.y = y;
        this.walkable = walkable;
        this.g = 0; // Cost from start to this node
        this.h = 0; // Estimated cost from this node to end
        this.f = 0; // Total cost (g + h)
        this.parent = null;
    }
}

export class PathFinder {
    constructor(scene, gridSize = 32) {
        this.scene = scene;
        this.gridSize = gridSize;
        this.grid = [];
        this.openList = [];
        this.closedList = [];
        this.debugGraphics = this.scene.debugSystem ? this.scene.debugSystem.debugGraphics : null;
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
    }

    debugDrawGrid() {
        if (!this.debugGraphics || !this.scene.debugSystem?.showDebug) return;

        // Draw grid cells
        for (let y = 0; y < this.grid.length; y++) {
            for (let x = 0; x < this.grid[y].length; x++) {
                const node = this.grid[y][x];
                const cellX = x * this.gridSize;
                const cellY = y * this.gridSize;

                // Draw cell outline
                this.debugGraphics.lineStyle(1, 0x00ff00, 0.3);
                this.debugGraphics.strokeRect(cellX, cellY, this.gridSize, this.gridSize);

                // Fill unwalkable cells
                if (!node.walkable) {
                    this.debugGraphics.fillStyle(0xff0000, 0.3);
                    this.debugGraphics.fillRect(cellX, cellY, this.gridSize, this.gridSize);
                }

                // Highlight open and closed list cells
                if (this.openList.includes(node)) {
                    this.debugGraphics.fillStyle(0x00ff00, 0.3);
                    this.debugGraphics.fillRect(cellX, cellY, this.gridSize, this.gridSize);
                    
                    // Draw f-score
                    const text = this.scene.add.text(
                        cellX + this.gridSize/2, 
                        cellY + this.gridSize/2, 
                        Math.floor(node.f).toString(),
                        { fontSize: '12px', color: '#ffffff' }
                    ).setOrigin(0.5);
                    this.scene.debugSystem.debugTexts.push(text);
                } else if (this.closedList.includes(node)) {
                    this.debugGraphics.fillStyle(0x0000ff, 0.3);
                    this.debugGraphics.fillRect(cellX, cellY, this.gridSize, this.gridSize);
                }
            }
        }
    }

    debugDrawPath(path) {
        if (!this.debugGraphics || !this.scene.debugSystem?.showDebug || !path) return;

        // Draw path line
        this.debugGraphics.lineStyle(3, 0xffff00, 1);
        this.debugGraphics.beginPath();
        this.debugGraphics.moveTo(path[0].x, path[0].y);
        
        for (let i = 1; i < path.length; i++) {
            this.debugGraphics.lineTo(path[i].x, path[i].y);
        }
        
        this.debugGraphics.strokePath();

        // Draw points
        this.debugGraphics.fillStyle(0xff0000, 1);
        path.forEach(point => {
            this.debugGraphics.fillCircle(point.x, point.y, 4);
        });
    }

    getNeighbors(node) {
        const neighbors = [];
        const directions = [
            { x: 0, y: -1 }, // Up
            { x: 1, y: 0 },  // Right
            { x: 0, y: 1 },  // Down
            { x: -1, y: 0 }, // Left
        ];

        for (const dir of directions) {
            const newX = node.x + dir.x;
            const newY = node.y + dir.y;

            // Check bounds
            if (newY >= 0 && newY < this.grid.length && 
                newX >= 0 && newX < this.grid[0].length) {
                const neighbor = this.grid[newY][newX];
                if (neighbor.walkable) {
                    neighbors.push(neighbor);
                }
            }
        }

        return neighbors;
    }

    heuristic(nodeA, nodeB) {
        // Manhattan distance
        return Math.abs(nodeA.x - nodeB.x) + Math.abs(nodeA.y - nodeB.y);
    }

    findPath(startX, startY, endX, endY) {
        if (this.debugGraphics && this.scene.debugSystem?.showDebug) {
            this.debugGraphics.clear();
        }

        const gridStartX = Math.floor(startX / this.gridSize);
        const gridStartY = Math.floor(startY / this.gridSize);
        const gridEndX = Math.floor(endX / this.gridSize);
        const gridEndY = Math.floor(endY / this.gridSize);

        this.openList = [];
        this.closedList = [];

        const startNode = this.grid[gridStartY][gridStartX];
        const endNode = this.grid[gridEndY][gridEndX];

        startNode.g = 0;
        startNode.h = this.heuristic(startNode, endNode);
        startNode.f = startNode.g + startNode.h;
        
        this.openList.push(startNode);

        if (this.scene.debugSystem?.showDebug) {
            this.debugDrawGrid();
        }

        while (this.openList.length > 0) {
            const currentNode = this.openList.reduce((min, node) => 
                node.f < min.f ? node : min, this.openList[0]);

            this.openList = this.openList.filter(node => node !== currentNode);
            this.closedList.push(currentNode);

            if (this.scene.debugSystem?.showDebug) {
                this.debugDrawGrid();
            }

            if (currentNode === endNode) {
                const path = this.reconstructPath(endNode);
                if (this.scene.debugSystem?.showDebug) {
                    this.debugDrawPath(path);
                }
                return path;
            }

            for (const neighbor of this.getNeighbors(currentNode)) {
                if (this.closedList.includes(neighbor)) {
                    continue;
                }

                const tentativeG = currentNode.g + 1;

                if (!this.openList.includes(neighbor)) {
                    this.openList.push(neighbor);
                } else if (tentativeG >= neighbor.g) {
                    continue;
                }

                neighbor.parent = currentNode;
                neighbor.g = tentativeG;
                neighbor.h = this.heuristic(neighbor, endNode);
                neighbor.f = neighbor.g + neighbor.h;

                if (this.scene.debugSystem?.showDebug) {
                    this.debugDrawGrid();
                }
            }
        }

        return null;
    }

    reconstructPath(endNode) {
        const path = [];
        let currentNode = endNode;

        while (currentNode) {
            path.unshift({
                x: currentNode.x * this.gridSize + this.gridSize / 2,
                y: currentNode.y * this.gridSize + this.gridSize / 2
            });
            currentNode = currentNode.parent;
        }

        return path;
    }
}
