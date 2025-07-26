import * as THREE from 'three';
import { Kart } from './Kart.js';
import { PowerUp } from './PowerUp.js';
import { Projectile } from './Projectile.js';
import { InputManager } from './InputManager.js';
import { Physics } from './Physics.js';

export class Game {
    constructor(network, ui, playerName) {
        this.network = network;
        this.ui = ui;
        this.playerName = playerName;
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.input = null;
        this.physics = null;
        
        this.playerKart = null;
        this.otherPlayers = new Map();
        this.powerUps = new Map();
        this.projectiles = new Map();
        
        this.playerId = null;
        this.lastUpdateTime = 0;
        
        this.init();
    }
    
    init() {
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupLighting();
        this.setupEnvironment();
        
        this.input = new InputManager();
        this.physics = new Physics();
        
        this.setupNetworkCallbacks();
        this.setupInputHandlers();
        
        this.animate();
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
    }
    
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 10, 10);
    }
    
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        document.getElementById('gameContainer').appendChild(this.renderer.domElement);
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        this.scene.add(directionalLight);
    }
    
    setupEnvironment() {
        // Ground
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x3a5f3a,
            side: THREE.DoubleSide
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Add some obstacles
        this.createObstacles();
    }
    
    createObstacles() {
        const obstaclePositions = [
            { x: 20, z: 20 },
            { x: -20, z: -20 },
            { x: 30, z: -30 },
            { x: -30, z: 30 },
            { x: 0, z: 40 },
            { x: 0, z: -40 }
        ];
        
        obstaclePositions.forEach(pos => {
            const geometry = new THREE.BoxGeometry(4, 8, 4);
            const material = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
            const obstacle = new THREE.Mesh(geometry, material);
            obstacle.position.set(pos.x, 4, pos.z);
            obstacle.castShadow = true;
            obstacle.receiveShadow = true;
            this.scene.add(obstacle);
        });
    }
    
    setupNetworkCallbacks() {
        this.network.on('onGameState', (data) => {
            this.handleGameState(data);
        });
        
        this.network.on('onPlayerJoined', (player) => {
            this.addOtherPlayer(player);
        });
        
        this.network.on('onPlayerLeft', (playerId) => {
            this.removeOtherPlayer(playerId);
        });
        
        this.network.on('onPlayerMoved', (data) => {
            this.updateOtherPlayer(data);
        });
        
        this.network.on('onProjectileFired', (projectile) => {
            this.addProjectile(projectile);
        });
        
        this.network.on('onPowerUpCollected', (data) => {
            this.removePowerUp(data.powerUpId);
        });
        
        this.network.on('onPlayerDamaged', (data) => {
            this.handlePlayerDamaged(data);
        });
        
        this.network.on('onPlayerRespawned', (data) => {
            this.handlePlayerRespawned(data);
        });
        
        this.network.on('onPowerUpsRespawned', (powerUps) => {
            this.updatePowerUps(powerUps);
        });
    }
    
    setupInputHandlers() {
        // Weapon firing
        this.input.onKeyDown('Space', () => {
            if (this.playerKart && this.playerKart.weapon) {
                const direction = this.playerKart.getForwardDirection();
                this.network.fireWeapon(direction);
            }
        });
    }
    
    handleGameState(data) {
        this.playerId = data.playerId;
        
        // Create player kart
        const playerData = data.players.find(p => p.id === this.playerId);
        if (playerData && !this.playerKart) {
            this.playerKart = new Kart(playerData, true);
            this.scene.add(this.playerKart.mesh);
        }
        
        // Add other players
        data.players.forEach(player => {
            if (player.id !== this.playerId) {
                this.addOtherPlayer(player);
            }
        });
        
        // Add power-ups
        this.updatePowerUps(data.powerUps);
        
        // Update UI
        this.ui.updateScoreboard(data.players);
    }
    
    addOtherPlayer(player) {
        if (player.id !== this.playerId) {
            const otherKart = new Kart(player, false);
            this.otherPlayers.set(player.id, otherKart);
            this.scene.add(otherKart.mesh);
        }
    }
    
    removeOtherPlayer(playerId) {
        const otherKart = this.otherPlayers.get(playerId);
        if (otherKart) {
            this.scene.remove(otherKart.mesh);
            this.otherPlayers.delete(playerId);
        }
    }
    
    updateOtherPlayer(data) {
        const otherKart = this.otherPlayers.get(data.id);
        if (otherKart) {
            otherKart.updatePosition(data.position, data.rotation);
        }
    }
    
    addProjectile(projectile) {
        const projectileObj = new Projectile(projectile);
        this.projectiles.set(projectile.id, projectileObj);
        this.scene.add(projectileObj.mesh);
    }
    
    removePowerUp(powerUpId) {
        const powerUp = this.powerUps.get(powerUpId);
        if (powerUp) {
            this.scene.remove(powerUp.mesh);
            this.powerUps.delete(powerUpId);
        }
    }
    
    updatePowerUps(powerUps) {
        // Clear existing power-ups
        this.powerUps.forEach(powerUp => {
            this.scene.remove(powerUp.mesh);
        });
        this.powerUps.clear();
        
        // Add new power-ups
        powerUps.forEach(powerUpData => {
            if (!powerUpData.collected) {
                const powerUp = new PowerUp(powerUpData);
                this.powerUps.set(powerUpData.id, powerUp);
                this.scene.add(powerUp.mesh);
            }
        });
    }
    
    handlePlayerDamaged(data) {
        if (data.targetId === this.playerId) {
            // Update local player health
            if (this.playerKart) {
                this.playerKart.health = data.newHealth;
                this.ui.updateHUD(this.playerKart);
            }
        }
        
        // Update scoreboard
        this.ui.showMessage(`${data.damage} damage!`);
    }
    
    handlePlayerRespawned(data) {
        if (data.playerId === this.playerId && this.playerKart) {
            this.playerKart.position.copy(data.position);
        } else {
            const otherKart = this.otherPlayers.get(data.playerId);
            if (otherKart) {
                otherKart.position.copy(data.position);
            }
        }
    }
    
    update() {
        const currentTime = Date.now();
        const deltaTime = (currentTime - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = currentTime;
        
        // Update player kart
        if (this.playerKart) {
            this.playerKart.update(this.input, deltaTime);
            
            // Check power-up collisions
            this.checkPowerUpCollisions();
            
            // Check projectile collisions
            this.checkProjectileCollisions();
            
            // Update UI
            this.ui.updateHUD(this.playerKart);
            
            // Send position update to server
            this.network.updatePlayer({
                position: this.playerKart.position,
                rotation: this.playerKart.rotation,
                velocity: this.playerKart.velocity
            });
            
            // Update camera to follow player
            this.updateCamera();
        }
        
        // Update projectiles
        this.updateProjectiles(deltaTime);
    }
    
    checkPowerUpCollisions() {
        this.powerUps.forEach((powerUp, powerUpId) => {
            const distance = this.playerKart.position.distanceTo(powerUp.position);
            if (distance < 3) {
                this.network.collectPowerUp(powerUpId);
            }
        });
    }
    
    checkProjectileCollisions() {
        this.projectiles.forEach((projectile, projectileId) => {
            if (projectile.ownerId !== this.playerId) {
                const distance = this.playerKart.position.distanceTo(projectile.position);
                if (distance < 2) {
                    this.network.playerHit(this.playerId, projectile.type);
                    this.removeProjectile(projectileId);
                }
            }
        });
    }
    
    updateProjectiles(deltaTime) {
        this.projectiles.forEach((projectile, projectileId) => {
            projectile.update(deltaTime);
            
            // Remove old projectiles
            if (Date.now() - projectile.timestamp > 5000) {
                this.removeProjectile(projectileId);
            }
        });
    }
    
    removeProjectile(projectileId) {
        const projectile = this.projectiles.get(projectileId);
        if (projectile) {
            this.scene.remove(projectile.mesh);
            this.projectiles.delete(projectileId);
        }
    }
    
    updateCamera() {
        if (this.playerKart) {
            const targetPosition = this.playerKart.position.clone();
            targetPosition.y += 8;
            targetPosition.z += 12;
            
            this.camera.position.lerp(targetPosition, 0.1);
            this.camera.lookAt(this.playerKart.position);
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.update();
        this.renderer.render(this.scene, this.camera);
    }
} 