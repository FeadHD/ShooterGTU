import { AlarmTrigger } from '../../prefabs/AlarmTrigger';
import { Trap } from '../../prefabs/Trap';

export class TrapManager {
    constructor(scene) {
        this.scene = scene;
        this.alarmTriggers = scene.physics.add.staticGroup({
            classType: AlarmTrigger,
            runChildUpdate: true
        });
        this.traps = scene.physics.add.group();
    }

    findSpawnPoints() {
        const points = [];
        const tileSize = 32;
        const margin = tileSize * 2;
        
        // Grid-based spawn point search
        for (let x = margin; x < this.scene.ROOM_WIDTH - margin; x += tileSize) {
            for (let y = margin; y < this.scene.ROOM_HEIGHT - margin; y += tileSize) {
                // Check if point is valid (not overlapping with platforms)
                const hasCollision = this.scene.platforms.getChildren().some(platform => {
                    return Math.abs(platform.x - x) < tileSize && 
                           Math.abs(platform.y - y) < tileSize;
                });

                if (!hasCollision) {
                    points.push({ x, y });
                }
            }
        }
        
        return points;
    }

    createTraps(config) {
        const spawnPoints = this.findSpawnPoints();
        if (spawnPoints.length === 0) return;

        // Shuffle spawn points
        Phaser.Utils.Array.Shuffle(spawnPoints);

        // Create alarms
        const numAlarms = config.AlarmTrigger || 0;
        for (let i = 0; i < Math.min(numAlarms, spawnPoints.length); i++) {
            const point = spawnPoints[i];
            const alarm = this.alarmTriggers.create(point.x, point.y, null, false);
            alarm.setSize(32, 32);
            console.log('Created alarm at', point.x, point.y);
        }

        // Create traps with remaining points
        const remainingPoints = spawnPoints.slice(numAlarms);
        const numTraps = config.TrapPrefab || 0;
        
        for (let i = 0; i < Math.min(numTraps, remainingPoints.length); i++) {
            const point = remainingPoints[i];
            const trap = new Trap(this.scene, point.x, point.y);
            this.traps.add(trap);
            console.log('Created trap at', point.x, point.y);
        }
    }

    setupCollisions(player) {
        this.scene.physics.add.overlap(
            player,
            this.alarmTriggers,
            (player, trap) => trap.triggerAlarm()
        );
    }
}
