import * as THREE from 'three';

export class Kart {
    constructor(playerData, isLocalPlayer) {
        this.id = playerData.id;
        this.name = playerData.name;
        this.health = playerData.health;
        this.score = playerData.score;
        this.weapon = playerData.weapon;
        this.isLocalPlayer = isLocalPlayer;
        
        // Physics properties
        this.position = new THREE.Vector3(
            playerData.position.x,
            playerData.position.y,
            playerData.position.z
        );
        this.rotation = new THREE.Euler(
            playerData.rotation.x,
            playerData.rotation.y,
            playerData.rotation.z
        );
        this.velocity = new THREE.Vector3(
            playerData.velocity.x,
            playerData.velocity.y,
            playerData.velocity.z
        );
        
        // Movement properties
        this.maxSpeed = 20;
        this.acceleration = 15;
        this.deceleration = 10;
        this.turnSpeed = 2.5;
        this.friction = 0.95;
        
        this.mesh = null;
        this.createMesh();
    }
    
    createMesh() {
        // Create kart body - bright purple with lime green accents
        const bodyGeometry = new THREE.BoxGeometry(2, 1, 3);
        const bodyMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x9932CC // Bright purple
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.5;
        body.castShadow = true;
        
        // Add lime green side panels
        const sidePanelGeometry = new THREE.BoxGeometry(0.1, 0.8, 2.5);
        const sidePanelMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x32CD32 // Lime green
        });
        
        const leftPanel = new THREE.Mesh(sidePanelGeometry, sidePanelMaterial);
        leftPanel.position.set(-0.9, 0.4, 0);
        body.add(leftPanel);
        
        const rightPanel = new THREE.Mesh(sidePanelGeometry, sidePanelMaterial);
        rightPanel.position.set(0.9, 0.4, 0);
        body.add(rightPanel);
        
        // Create wheels with black body, white rim, and red hub
        const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 8);
        const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 }); // Black wheels
        
        const wheels = [];
        const wheelPositions = [
            { x: -0.8, y: 0.4, z: -1.2 },
            { x: 0.8, y: 0.4, z: -1.2 },
            { x: -0.8, y: 0.4, z: 1.2 },
            { x: 0.8, y: 0.4, z: 1.2 }
        ];
        
        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.set(pos.x, pos.y, pos.z);
            wheel.rotation.z = Math.PI / 2;
            wheel.rotation.x = Math.PI; // Fix upside down wheels
            wheel.castShadow = true;
            wheels.push(wheel);
            body.add(wheel);
            
            // Add white rim
            const rimGeometry = new THREE.TorusGeometry(0.4, 0.1, 8, 16);
            const rimMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
            const rim = new THREE.Mesh(rimGeometry, rimMaterial);
            rim.rotation.x = Math.PI / 2;
            wheel.add(rim);
            
            // Add red hub
            const hubGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.35, 8);
            const hubMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
            const hub = new THREE.Mesh(hubGeometry, hubMaterial);
            hub.rotation.z = Math.PI / 2;
            wheel.add(hub);
        });
        
        // Create driver seat
        const seatGeometry = new THREE.BoxGeometry(1.5, 0.5, 1);
        const seatMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const seat = new THREE.Mesh(seatGeometry, seatMaterial);
        seat.position.set(0, 1.25, 0);
        body.add(seat);
        
        // Create driver with red body and white helmet with red visor
        const driverBodyGeometry = new THREE.SphereGeometry(0.3, 8, 6);
        const driverBodyMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 }); // Red body
        const driverBody = new THREE.Mesh(driverBodyGeometry, driverBodyMaterial);
        driverBody.position.set(0, 1.8, 0);
        body.add(driverBody);
        
        // Create helmet
        const helmetGeometry = new THREE.SphereGeometry(0.25, 8, 6);
        const helmetMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF }); // White helmet
        const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
        helmet.position.set(0, 2.1, 0);
        body.add(helmet);
        
        // Create red visor
        const visorGeometry = new THREE.SphereGeometry(0.2, 8, 6);
        const visorMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xFF0000,
            transparent: true,
            opacity: 0.8
        });
        const visor = new THREE.Mesh(visorGeometry, visorMaterial);
        visor.position.set(0, 2.1, 0.1);
        visor.scale.set(1, 0.6, 0.3);
        body.add(visor);
        
        // Create steering wheel
        const steeringGeometry = new THREE.TorusGeometry(0.3, 0.1, 8, 16);
        const steeringMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        const steering = new THREE.Mesh(steeringGeometry, steeringMaterial);
        steering.position.set(0, 1.5, 0.8);
        steering.rotation.x = Math.PI / 2;
        body.add(steering);
        
        // Create rainbow exhaust pipe
        const exhaustGeometry = new THREE.CylinderGeometry(0.2, 0.3, 1.5, 8);
        const exhaustMaterial = new THREE.MeshLambertMaterial({ color: 0x0000FF }); // Start with blue
        const exhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
        exhaust.position.set(0, 0.8, -1.8);
        exhaust.rotation.x = Math.PI / 2;
        body.add(exhaust);
        
        // Add rainbow gradient effect to exhaust
        const exhaustSegments = 8;
        for (let i = 0; i < exhaustSegments; i++) {
            const segmentGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.2, 8);
            const colors = [0x0000FF, 0x8000FF, 0xFF00FF, 0xFF0080, 0xFF0000, 0xFF8000, 0xFFFF00, 0x80FF00];
            const segmentMaterial = new THREE.MeshLambertMaterial({ color: colors[i] });
            const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
            segment.position.set(0, 0.8, -1.8 + (i * 0.2));
            segment.rotation.x = Math.PI / 2;
            body.add(segment);
        }
        
        // Add smoke effect
        this.createSmokeEffect(body);
        
        // Add name label
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        context.fillStyle = 'white';
        context.font = '24px Arial';
        context.textAlign = 'center';
        context.fillText(this.name, 128, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        const labelGeometry = new THREE.PlaneGeometry(4, 1);
        const labelMaterial = new THREE.MeshBasicMaterial({ 
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });
        const label = new THREE.Mesh(labelGeometry, labelMaterial);
        label.position.set(0, 2.5, 0);
        body.add(label);
        
        this.mesh = body;
        this.mesh.position.copy(this.position);
        this.mesh.rotation.copy(this.rotation);
    }
    
    createSmokeEffect(body) {
        // Create smoke particles
        const smokeGeometry = new THREE.SphereGeometry(0.1, 4, 4);
        const smokeMaterial = new THREE.MeshBasicMaterial({
            color: 0x666666,
            transparent: true,
            opacity: 0.6
        });
        
        this.smokeParticles = [];
        for (let i = 0; i < 10; i++) {
            const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
            smoke.position.set(0, 0.8, -2.5);
            smoke.visible = false;
            body.add(smoke);
            this.smokeParticles.push({
                mesh: smoke,
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.5,
                    Math.random() * 0.3,
                    Math.random() * 0.5
                ),
                life: 0
            });
        }
    }
    
    update(input, deltaTime) {
        if (!this.isLocalPlayer) return;
        
        // Handle input
        let acceleration = 0;
        let turnDirection = 0;
        
        if (input.isKeyPressed('KeyW') || input.isKeyPressed('ArrowUp')) {
            acceleration = 1;
        } else if (input.isKeyPressed('KeyS') || input.isKeyPressed('ArrowDown')) {
            acceleration = -1;
        }
        
        if (input.isKeyPressed('KeyA') || input.isKeyPressed('ArrowLeft')) {
            turnDirection = 1; // Fixed: Left key now turns left
        } else if (input.isKeyPressed('KeyD') || input.isKeyPressed('ArrowRight')) {
            turnDirection = -1; // Fixed: Right key now turns right
        }
        
        // Apply physics
        this.applyPhysics(acceleration, turnDirection, deltaTime);
        
        // Update mesh position and rotation
        this.mesh.position.copy(this.position);
        this.mesh.rotation.copy(this.rotation);
        
        // Animate wheels (simple rotation)
        this.mesh.children.forEach(child => {
            if (child.geometry.type === 'CylinderGeometry') {
                child.rotation.x -= this.velocity.length() * deltaTime * 2; // Fixed direction for corrected wheel orientation
            }
        });
        
        // Animate smoke effect
        if (this.smokeParticles) {
            this.updateSmokeEffect(deltaTime);
        }
    }
    
    applyPhysics(acceleration, turnDirection, deltaTime) {
        // Get forward direction
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyEuler(this.rotation);
        
        // Apply acceleration
        if (acceleration !== 0) {
            const accelerationVector = forward.clone().multiplyScalar(
                acceleration * this.acceleration * deltaTime
            );
            this.velocity.add(accelerationVector);
        }
        
        // Apply deceleration when no input
        if (acceleration === 0) {
            this.velocity.multiplyScalar(1 - this.deceleration * deltaTime);
        }
        
        // Limit speed
        const speed = this.velocity.length();
        if (speed > this.maxSpeed) {
            this.velocity.normalize().multiplyScalar(this.maxSpeed);
        }
        
        // Apply friction
        this.velocity.multiplyScalar(this.friction);
        
        // Apply turning
        if (turnDirection !== 0 && speed > 0.1) {
            const turnAmount = turnDirection * this.turnSpeed * deltaTime;
            this.rotation.y += turnAmount;
            
            // Apply turning to velocity (drift effect)
            const right = new THREE.Vector3(1, 0, 0);
            right.applyEuler(this.rotation);
            const driftForce = right.clone().multiplyScalar(turnAmount * speed * 0.5);
            this.velocity.add(driftForce);
        }
        
        // Update position
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        
        // Keep kart on ground
        this.position.y = 1;
        
        // Boundary checking
        const bounds = 100;
        this.position.x = Math.max(-bounds, Math.min(bounds, this.position.x));
        this.position.z = Math.max(-bounds, Math.min(bounds, this.position.z));
    }
    
    updatePosition(position, rotation) {
        if (this.isLocalPlayer) return; // Don't update local player from network
        
        this.position.copy(position);
        this.rotation.copy(rotation);
        this.mesh.position.copy(this.position);
        this.mesh.rotation.copy(this.rotation);
    }
    
    updateSmokeEffect(deltaTime) {
        if (!this.smokeParticles) return;
        
        this.smokeParticles.forEach((particle, index) => {
            if (this.velocity.length() > 0.1) {
                // Show smoke when moving
                if (!particle.mesh.visible) {
                    particle.mesh.visible = true;
                    particle.life = 0;
                    particle.mesh.position.set(0, 0.8, -2.5);
                }
                
                // Update smoke particle
                particle.life += deltaTime;
                particle.mesh.position.add(particle.velocity.clone().multiplyScalar(deltaTime));
                particle.mesh.material.opacity = Math.max(0, 0.6 - particle.life * 0.5);
                
                // Reset particle when it fades out
                if (particle.life > 1.2) {
                    particle.mesh.visible = false;
                }
            } else {
                particle.mesh.visible = false;
            }
        });
    }
    
    getForwardDirection() {
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyEuler(this.rotation);
        return forward;
    }
    
    takeDamage(damage) {
        this.health = Math.max(0, this.health - damage);
        
        // Visual feedback
        if (this.mesh) {
            this.mesh.material.color.setHex(0xff0000);
            setTimeout(() => {
                if (this.mesh) {
                    this.mesh.material.color.setHex(this.isLocalPlayer ? 0x00ff00 : 0xff0000);
                }
            }, 200);
        }
    }
    
    respawn(position) {
        this.position.copy(position);
        this.health = 100;
        this.weapon = null;
        this.velocity.set(0, 0, 0);
    }
} 