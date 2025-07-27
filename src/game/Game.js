import * as THREE from 'three';
import { Kart } from './Kart.js';
import { PowerUp } from './PowerUp.js';
import { Projectile } from './Projectile.js';
import { InputManager } from './InputManager.js';
import { Physics } from './Physics.js';
import { AudioManager } from '../audio/AudioManager.js';
import { ParticleSystem } from '../effects/ParticleSystem.js';
import { CameraEffects } from '../effects/CameraEffects.js';
import { Minimap } from '../ui/Minimap.js';

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
        this.audio = null;
        this.particles = null;
        this.cameraEffects = null;
        this.minimap = null;
        
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
        this.audio = new AudioManager();
        this.particles = new ParticleSystem(this.scene);
        this.cameraEffects = new CameraEffects(this.camera);
        this.minimap = new Minimap(this.scene, null, this.otherPlayers, this.powerUps);
        
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
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
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
        
        // Add colored point lights for atmosphere
        const pointLight1 = new THREE.PointLight(0xff4444, 0.5, 50);
        pointLight1.position.set(30, 10, 30);
        this.scene.add(pointLight1);
        
        const pointLight2 = new THREE.PointLight(0x4444ff, 0.5, 50);
        pointLight2.position.set(-30, 10, -30);
        this.scene.add(pointLight2);
        
        const pointLight3 = new THREE.PointLight(0x44ff44, 0.5, 50);
        pointLight3.position.set(30, 10, -30);
        this.scene.add(pointLight3);
        
        const pointLight4 = new THREE.PointLight(0xffff44, 0.5, 50);
        pointLight4.position.set(-30, 10, 30);
        this.scene.add(pointLight4);
    }
    
    setupEnvironment() {
        // Enhanced ground with texture-like appearance
        const groundGeometry = new THREE.PlaneGeometry(200, 200, 50, 50);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x2d5a2d,
            side: THREE.DoubleSide
        });
        
        // Add some height variation to the ground
        const positions = groundGeometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i + 1] = Math.random() * 0.5; // Small height variations
        }
        groundGeometry.attributes.position.needsUpdate = true;
        groundGeometry.computeVertexNormals();
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Add colorful boundary walls
        this.createBoundaryWalls();
        
        // Add some obstacles
        this.createObstacles();
        
        // Add decorative elements
        this.createDecorations();
        
        // Add sky elements
        this.createSkyElements();
    }
    
    createObstacles() {
        const obstaclePositions = [
            { x: 20, z: 20, type: 'tower' },
            { x: -20, z: -20, type: 'cube' },
            { x: 30, z: -30, type: 'tower' },
            { x: -30, z: 30, type: 'pyramid' },
            { x: 0, z: 40, type: 'cube' },
            { x: 0, z: -40, type: 'tower' },
            { x: 50, z: 0, type: 'pyramid' },
            { x: -50, z: 0, type: 'cube' }
        ];
        
        obstaclePositions.forEach(pos => {
            let geometry, material, obstacle;
            
            switch (pos.type) {
                case 'tower':
                    geometry = new THREE.CylinderGeometry(2, 3, 10, 8);
                    material = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
                    obstacle = new THREE.Mesh(geometry, material);
                    obstacle.position.set(pos.x, 5, pos.z);
                    break;
                    
                case 'cube':
                    geometry = new THREE.BoxGeometry(6, 8, 6);
                    material = new THREE.MeshLambertMaterial({ color: 0x654321 });
                    obstacle = new THREE.Mesh(geometry, material);
                    obstacle.position.set(pos.x, 4, pos.z);
                    break;
                    
                case 'pyramid':
                    geometry = new THREE.ConeGeometry(4, 8, 4);
                    material = new THREE.MeshLambertMaterial({ color: 0x800080 });
                    obstacle = new THREE.Mesh(geometry, material);
                    obstacle.position.set(pos.x, 4, pos.z);
                    break;
            }
            
            obstacle.castShadow = true;
            obstacle.receiveShadow = true;
            this.scene.add(obstacle);
        });
    }
    
    createBoundaryWalls() {
        const wallHeight = 15;
        const wallThickness = 2;
        const mapSize = 100;
        
        // Create colorful boundary walls
        const wallColors = [0xff4444, 0x44ff44, 0x4444ff, 0xffff44];
        const wallPositions = [
            { x: 0, z: mapSize, rotY: 0 },      // North wall
            { x: mapSize, z: 0, rotY: Math.PI/2 }, // East wall
            { x: 0, z: -mapSize, rotY: 0 },     // South wall
            { x: -mapSize, z: 0, rotY: Math.PI/2 }  // West wall
        ];
        
        wallPositions.forEach((pos, index) => {
            const geometry = new THREE.BoxGeometry(200, wallHeight, wallThickness);
            const material = new THREE.MeshLambertMaterial({ 
                color: wallColors[index],
                transparent: true,
                opacity: 0.8
            });
            const wall = new THREE.Mesh(geometry, material);
            wall.position.set(pos.x, wallHeight/2, pos.z);
            wall.rotation.y = pos.rotY;
            wall.receiveShadow = true;
            this.scene.add(wall);
        });
    }
    
    createDecorations() {
        // Add some decorative trees
        for (let i = 0; i < 20; i++) {
            const treePos = {
                x: (Math.random() - 0.5) * 180,
                z: (Math.random() - 0.5) * 180
            };
            
            // Skip if too close to center
            if (Math.abs(treePos.x) < 20 && Math.abs(treePos.z) < 20) continue;
            
            this.createTree(treePos.x, treePos.z);
        }
        
        // Add some crystals
        for (let i = 0; i < 10; i++) {
            const crystalPos = {
                x: (Math.random() - 0.5) * 160,
                z: (Math.random() - 0.5) * 160
            };
            
            this.createCrystal(crystalPos.x, crystalPos.z);
        }
    }
    
    createTree(x, z) {
        // Tree trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.8, 6, 8);
        const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(x, 3, z);
        trunk.castShadow = true;
        this.scene.add(trunk);
        
        // Tree foliage
        const foliageGeometry = new THREE.SphereGeometry(3, 8, 6);
        const foliageColors = [0x228B22, 0x32CD32, 0x90EE90];
        const foliageMaterial = new THREE.MeshLambertMaterial({ 
            color: foliageColors[Math.floor(Math.random() * foliageColors.length)]
        });
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.set(x, 8, z);
        foliage.castShadow = true;
        this.scene.add(foliage);
    }
    
    createCrystal(x, z) {
        const crystalGeometry = new THREE.OctahedronGeometry(2);
        const crystalColors = [0xff00ff, 0x00ffff, 0xffff00, 0xff0080];
        const crystalMaterial = new THREE.MeshLambertMaterial({ 
            color: crystalColors[Math.floor(Math.random() * crystalColors.length)],
            transparent: true,
            opacity: 0.8
        });
        const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
        crystal.position.set(x, 2, z);
        crystal.castShadow = true;
        
        // Add glow effect
        const glowGeometry = new THREE.SphereGeometry(3, 8, 6);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: crystalMaterial.color,
            transparent: true,
            opacity: 0.2
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        crystal.add(glow);
        
        this.scene.add(crystal);
        
        // Store for animation
        if (!this.decorations) this.decorations = [];
        this.decorations.push({ mesh: crystal, type: 'crystal' });
    }
    
    createSkyElements() {
        // Add floating platforms
        for (let i = 0; i < 8; i++) {
            const platformGeometry = new THREE.CylinderGeometry(4, 4, 1, 8);
            const platformMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x666666,
                transparent: true,
                opacity: 0.7
            });
            const platform = new THREE.Mesh(platformGeometry, platformMaterial);
            
            const angle = (i / 8) * Math.PI * 2;
            const radius = 60;
            platform.position.set(
                Math.cos(angle) * radius,
                15 + Math.random() * 10,
                Math.sin(angle) * radius
            );
            platform.castShadow = true;
            platform.receiveShadow = true;
            this.scene.add(platform);
            
            // Store for animation
            if (!this.decorations) this.decorations = [];
            this.decorations.push({ mesh: platform, type: 'platform', angle: angle });
        }
    }
    
    updateDecorations() {
        if (!this.decorations) return;
        
        const time = Date.now() * 0.001;
        
        this.decorations.forEach(decoration => {
            switch (decoration.type) {
                case 'crystal':
                    decoration.mesh.rotation.y += 0.02;
                    decoration.mesh.position.y = 2 + Math.sin(time * 2) * 0.5;
                    break;
                    
                case 'platform':
                    const newAngle = decoration.angle + time * 0.2;
                    const radius = 60;
                    decoration.mesh.position.x = Math.cos(newAngle) * radius;
                    decoration.mesh.position.z = Math.sin(newAngle) * radius;
                    decoration.mesh.position.y = 15 + Math.sin(time * 1.5) * 3;
                    break;
            }
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
                
                // Play firing sound
                this.audio.play(`${this.playerKart.weapon}_fire`);
                
                // Create muzzle flash effect
                const muzzlePosition = this.playerKart.position.clone();
                muzzlePosition.add(direction.clone().multiplyScalar(2));
                this.particles.createParticleBurst({
                    position: muzzlePosition,
                    particleCount: 10,
                    speed: 3,
                    size: 0.3,
                    color: 0xffaa00,
                    lifetime: 0.3,
                    spread: Math.PI * 0.3
                });
            }
        });
        
        // Audio toggle
        this.input.onKeyDown('KeyM', () => {
            if (this.audio.enabled) {
                this.audio.mute();
                this.ui.showMessage('Audio Muted', 1000);
            } else {
                this.audio.unmute();
                this.ui.showMessage('Audio Enabled', 1000);
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
            
            // Set camera to follow player
            this.cameraEffects.setFollowTarget(this.playerKart);
            
            // Update minimap player reference
            this.minimap.player = this.playerKart;
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
        
        // Create launch trail effect
        if (projectile.type === 'rocket') {
            this.particles.createTrail(
                new THREE.Vector3(projectile.position.x, projectile.position.y, projectile.position.z),
                new THREE.Vector3(
                    projectile.position.x + projectile.direction.x * 2,
                    projectile.position.y + projectile.direction.y * 2,
                    projectile.position.z + projectile.direction.z * 2
                ),
                { color: 0xff4400, width: 0.1, lifetime: 0.5 }
            );
        }
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
                
                // Play hit sound
                this.audio.play('hit');
                
                // Create damage effect
                this.particles.createDamageEffect(this.playerKart.position, data.damage);
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
        }
        
        // Update projectiles
        this.updateProjectiles(deltaTime);
        
        // Update particle systems
        this.particles.update(deltaTime);
        
        // Update decorations
        this.updateDecorations();
        
        // Update camera effects
        this.cameraEffects.update(deltaTime);
        
        // Update minimap
        this.minimap.update();
    }
    
    checkPowerUpCollisions() {
        this.powerUps.forEach((powerUp, powerUpId) => {
            const distance = this.playerKart.position.distanceTo(powerUp.position);
            if (distance < 3) {
                this.network.collectPowerUp(powerUpId);
                
                // Play collection sound
                this.audio.play('powerup_collect');
                
                // Create collection effect
                this.particles.createPowerUpEffect(powerUp.position, powerUp.type);
            }
        });
    }
    
    checkProjectileCollisions() {
        this.projectiles.forEach((projectile, projectileId) => {
            if (projectile.ownerId !== this.playerId) {
                const distance = this.playerKart.position.distanceTo(projectile.position);
                if (distance < 2) {
                // Create explosion effect
                this.particles.createExplosion(projectile.position, {
                    particleCount: 30,
                    size: 0.8,
                    shockwaveRadius: 4
                });
                
                // Play explosion sound
                this.audio.play('explosion');
                
                // Add camera shake and effects
                this.cameraEffects.shake(0.5, 0.3);
                this.cameraEffects.zoomPunch(0.1, 0.2);                    this.network.playerHit(this.playerId, projectile.type);
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
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.update();
        this.renderer.render(this.scene, this.camera);
    }
} 