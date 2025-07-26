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
        // Create kart body
        const bodyGeometry = new THREE.BoxGeometry(2, 1, 3);
        const bodyMaterial = new THREE.MeshLambertMaterial({ 
            color: this.isLocalPlayer ? 0x00ff00 : 0xff0000 
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.5;
        body.castShadow = true;
        
        // Create wheels
        const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 8);
        const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        
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
            wheel.castShadow = true;
            wheels.push(wheel);
            body.add(wheel);
        });
        
        // Create driver seat
        const seatGeometry = new THREE.BoxGeometry(1.5, 0.5, 1);
        const seatMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const seat = new THREE.Mesh(seatGeometry, seatMaterial);
        seat.position.set(0, 1.25, 0);
        body.add(seat);
        
        // Create steering wheel
        const steeringGeometry = new THREE.TorusGeometry(0.3, 0.1, 8, 16);
        const steeringMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        const steering = new THREE.Mesh(steeringGeometry, steeringMaterial);
        steering.position.set(0, 1.5, 0.8);
        steering.rotation.x = Math.PI / 2;
        body.add(steering);
        
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
            turnDirection = -1;
        } else if (input.isKeyPressed('KeyD') || input.isKeyPressed('ArrowRight')) {
            turnDirection = 1;
        }
        
        // Apply physics
        this.applyPhysics(acceleration, turnDirection, deltaTime);
        
        // Update mesh position and rotation
        this.mesh.position.copy(this.position);
        this.mesh.rotation.copy(this.rotation);
        
        // Animate wheels (simple rotation)
        this.mesh.children.forEach(child => {
            if (child.geometry.type === 'CylinderGeometry') {
                child.rotation.x += this.velocity.length() * deltaTime * 2;
            }
        });
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