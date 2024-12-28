export class PathfindingDebug {
    constructor(scene) {
        this.scene = scene;
        this.graphics = scene.add.graphics();
        this.isEnabled = false;
        this.debugData = {
            grid: [],
            openList: [],
            closedList: [],
            currentPath: null
        };
    }

    enable() {
        this.isEnabled = true;
    }

    disable() {
        this.isEnabled = false;
        this.graphics.clear();
    }

    updateDebugData(data) {
        this.debugData = { ...this.debugData, ...data };
        if (this.isEnabled) {
            this.render();
        }
    }

    render() {
        if (!this.isEnabled) return;

        this.graphics.clear();

        // Draw grid
        this.drawGrid();
        
        // Draw lists
        this.drawOpenClosedLists();
        
        // Draw path
        this.drawPath();
    }

    drawGrid() {
        const { grid } = this.debugData;
        if (!grid || !grid.length) return;

        const gridSize = 32; // Match the PathFinder gridSize

        grid.forEach((row, y) => {
            row.forEach((node, x) => {
                const cellX = x * gridSize;
                const cellY = y * gridSize;

                // Draw cell outline
                this.graphics.lineStyle(1, 0x00ff00, 0.3);
                this.graphics.strokeRect(cellX, cellY, gridSize, gridSize);

                // Fill unwalkable cells
                if (!node.walkable) {
                    this.graphics.fillStyle(0xff0000, 0.3);
                    this.graphics.fillRect(cellX, cellY, gridSize, gridSize);
                }
            });
        });
    }

    drawOpenClosedLists() {
        const { openList, closedList } = this.debugData;
        const gridSize = 32;

        // Draw open list cells
        openList.forEach(node => {
            const cellX = node.x * gridSize;
            const cellY = node.y * gridSize;
            this.graphics.fillStyle(0x00ff00, 0.3);
            this.graphics.fillRect(cellX, cellY, gridSize, gridSize);

            // Draw f-score
            const text = this.scene.add.text(
                cellX + gridSize/2, 
                cellY + gridSize/2, 
                Math.floor(node.f).toString(),
                { 
                    fontSize: '12px',
                    color: '#ffffff'
                }
            ).setOrigin(0.5);
            // Remove text after a short delay
            this.scene.time.delayedCall(500, () => text.destroy());
        });

        // Draw closed list cells
        closedList.forEach(node => {
            const cellX = node.x * gridSize;
            const cellY = node.y * gridSize;
            this.graphics.fillStyle(0x0000ff, 0.3);
            this.graphics.fillRect(cellX, cellY, gridSize, gridSize);
        });
    }

    drawPath() {
        const { currentPath } = this.debugData;
        if (!currentPath || !currentPath.length) return;

        // Draw path line
        this.graphics.lineStyle(3, 0xffff00, 1);
        this.graphics.beginPath();
        this.graphics.moveTo(currentPath[0].x, currentPath[0].y);
        
        for (let i = 1; i < currentPath.length; i++) {
            this.graphics.lineTo(currentPath[i].x, currentPath[i].y);
        }
        
        this.graphics.strokePath();

        // Draw waypoints
        this.graphics.fillStyle(0xff0000, 1);
        currentPath.forEach(point => {
            this.graphics.fillCircle(point.x, point.y, 4);
        });
    }
}
