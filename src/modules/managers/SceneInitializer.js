import { Player } from '../../prefabs/Player';
import { Bullet } from '../../prefabs/Bullet';
import { StateManager } from './StateManager';
import { EffectsManager } from './EffectsManager';
import { EnemyManager } from './EnemyManager';
import { CollisionManager } from './CollisionManager';
import { SceneBoundaryManager } from './BoundaryManager';
import { AnimationManager } from './AnimationManager';
import { DebugSystem } from '../../_Debug/DebugSystem';

export class SceneInitializer {
    constructor(scene) {
        this.scene = scene;
    }

    initializeScene() {
        this.setupCamera();
        this.setupPhysics();
        this.createGroups();
        this.createPlayer();
        this.setupDebug();
        return this.setupManagers();
    }

    setupCamera() {
        // Set up the Matrix room camera to match 640x360 dimensions
        const mainCam = this.scene.cameras.main;
        
        // Set the viewport to match the game's display size (1920x1080)
        mainCam.setViewport(0, 0, 1920, 1080);
        
        // Set the actual bounds to our Matrix room size
        mainCam.setBounds(0, 0, this.scene.ROOM_WIDTH, this.scene.ROOM_HEIGHT);
        mainCam.setBackgroundColor('#000000');
        
        // Calculate zoom to stretch the 640x360 game area to fill the 1920x1080 viewport
        const zoomX = 1920 / this.scene.ROOM_WIDTH;
        const zoomY = 1080 / this.scene.ROOM_HEIGHT;
        const zoom = Math.min(zoomX, zoomY);
        mainCam.setZoom(zoom);
        
        // Center the camera
        mainCam.centerOn(this.scene.ROOM_WIDTH/2, this.scene.ROOM_HEIGHT/2);
    }

    setupPhysics() {
        // Set up world bounds and physics
        this.scene.physics.world.setBoundsCollision(true, true, true, true);
        this.scene.physics.world.setBounds(0, 0, this.scene.ROOM_WIDTH, this.scene.ROOM_HEIGHT);
    }

    createGroups() {
        this.scene.enemies = this.scene.physics.add.group();
        this.scene.slimes = this.scene.physics.add.group();
        this.scene.drones = this.scene.physics.add.group();
        this.scene.bitcoins = this.scene.add.group();
        this.scene.bullets = this.scene.physics.add.group({
            classType: Bullet,
            maxSize: 10,
            runChildUpdate: true
        });
        this.scene.platforms = this.scene.physics.add.staticGroup();
    }

    createPlayer() {
        const spawnX = this.scene.scale.width * 0.1;
        const spawnY = 100;
        
        this.scene.player = new Player(this.scene, spawnX, spawnY);
        this.scene.player.setPosition(spawnX, spawnY);
        this.scene.player.setVelocity(0, 0);
        
        // Store spawn point for debug visualization
        this.scene.playerSpawnPoint = { x: spawnX, y: spawnY };
    }

    setupDebug() {
        // Initialize debug graphics
        this.scene.debugGraphics = this.scene.add.graphics();
        this.scene.debugSystem = new DebugSystem(this.scene);
    }

    setupManagers() {
        // Initialize all required managers
        return {
            stateManager: new StateManager(this.scene),
            effectsManager: new EffectsManager(this.scene),
            enemyManager: new EnemyManager(this.scene),
            collisionManager: new CollisionManager(this.scene),
            boundaryManager: new SceneBoundaryManager(this.scene),
            animationManager: new AnimationManager(this.scene)
        };
    }
}
