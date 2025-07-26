import * as THREE from 'three';

export class Projectile {
    constructor(projectileData) {
        this.id = projectileData.id;
        this.type = projectileData.type;
        this.ownerId = projectileData.ownerId;
        this.timestamp = projectileData.timestamp;
        
        this.position = new THREE.Vector3(
            projectileData.position.x,
            projectileData.position.y,
            projectileData.position.z
        );
        this.direction = new THREE.Vector3(
            projectileData.direction.x,
            projectileData.direction.y,
            projectileData.direction.z
        );
        
        // Physics properties
        this.velocity = this.direction.clone().multiplyScalar(30); // Speed
        this.gravity = -9.8;
        this.lifeTime = 5000; // 5 seconds
        
        this.mesh = null;
        this.trail = null;
        this.createMesh();
    }
    
    createMesh() {
        let geometry, material;
        
        switch (this.type) {
            case 'rocket':
                geometry = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8);
                material = new THREE.MeshLambertMaterial({ color: 0xff4444 });
                break;
                
            case 'mine':
                geometry = new THREE.SphereGeometry(0.3, 8, 6);
                material = new THREE.MeshLambertMaterial({ color: 0x000000 });
                break;
                
            default:
                geometry = new THREE.SphereGeometry(0.2, 8, 6);
                material = new THREE.MeshLambertMaterial({ color: 0xffffff });
        }
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        
        // Orient projectile in direction of travel
        this.mesh.lookAt(this.position.clone().add(this.direction));
        
        // Add trail effect
        this.addTrailEffect();
        
        // Add glow effect
        this.addGlowEffect();
    }
    
    addTrailEffect() {
        if (this.type === 'rocket') {
            // Create rocket trail
            const trailGeometry = new THREE.ConeGeometry(0.2, 1, 8);
            const trailMaterial = new THREE.MeshBasicMaterial({
                color: 0xffaa00,
                transparent: true,
                opacity: 0.7
            });
            
            this.trail = new THREE.Mesh(trailGeometry, trailMaterial);
            this.trail.position.set(0, 0, -0.4);
            this.trail.rotation.x = Math.PI;
            this.mesh.add(this.trail);
        }
    }
    
    addGlowEffect() {
        const glowGeometry = new THREE.SphereGeometry(0.4, 8, 6);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: this.getGlowColor(),
            transparent: true,
            opacity: 0.4
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.mesh.add(glow);
    }
    
    getGlowColor() {
        switch (this.type) {
            case 'rocket': return 0xff6666;
            case 'mine': return 0x666666;
            default: return 0xffffff;
        }
    }
    
    update(deltaTime) {
        // Apply gravity
        this.velocity.y += this.gravity * deltaTime;
        
        // Update position
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        this.mesh.position.copy(this.position);
        
        // Update rotation based on velocity
        if (this.velocity.length() > 0.1) {
            this.mesh.lookAt(this.position.clone().add(this.velocity));
        }
        
        // Animate trail
        if (this.trail) {
            this.trail.material.opacity = 0.3 + Math.sin(Date.now() * 0.01) * 0.2;
        }
        
        // Check if projectile hit ground
        if (this.position.y <= 0) {
            this.explode();
        }
    }
    
    explode() {
        // Create explosion effect
        this.createExplosionEffect();
        
        // Remove projectile from scene
        if (this.mesh && this.mesh.parent) {
            this.mesh.parent.remove(this.mesh);
        }
    }
    
    createExplosionEffect() {
        const explosionGeometry = new THREE.SphereGeometry(0.5, 8, 6);
        const explosionMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 1
        });
        
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(this.position);
        
        if (this.mesh && this.mesh.parent) {
            this.mesh.parent.add(explosion);
        }
        
        // Animate explosion
        let scale = 1;
        const animateExplosion = () => {
            scale += 0.1;
            explosion.scale.set(scale, scale, scale);
            explosion.material.opacity -= 0.05;
            
            if (explosion.material.opacity > 0) {
                requestAnimationFrame(animateExplosion);
            } else {
                if (explosion.parent) {
                    explosion.parent.remove(explosion);
                }
            }
        };
        
        animateExplosion();
    }
    
    isExpired() {
        return Date.now() - this.timestamp > this.lifeTime;
    }
    
    getPosition() {
        return this.position;
    }
    
    getVelocity() {
        return this.velocity;
    }
} 