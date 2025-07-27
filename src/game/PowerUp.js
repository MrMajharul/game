import * as THREE from 'three';

export class PowerUp {
    constructor(powerUpData) {
        this.id = powerUpData.id;
        this.type = powerUpData.type;
        this.position = new THREE.Vector3(
            powerUpData.position.x,
            powerUpData.position.y,
            powerUpData.position.z
        );
        this.collected = powerUpData.collected;
        
        this.mesh = null;
        this.rotationSpeed = 2;
        this.bobSpeed = 2;
        this.bobHeight = 0.5;
        this.initialY = this.position.y;
        this.time = Math.random() * Math.PI * 2; // Random start time for animation
        
        this.createMesh();
    }
    
    createMesh() {
        let geometry, material;
        
        switch (this.type) {
            case 'rocket':
                geometry = new THREE.ConeGeometry(0.5, 1.5, 8);
                material = new THREE.MeshLambertMaterial({ color: 0xff4444 });
                break;
                
            case 'mine':
                geometry = new THREE.SphereGeometry(0.6, 8, 6);
                material = new THREE.MeshLambertMaterial({ color: 0x000000 });
                break;
                
            case 'shield':
                geometry = new THREE.CylinderGeometry(0.8, 0.8, 0.3, 8);
                material = new THREE.MeshLambertMaterial({ color: 0x4444ff });
                break;
                
            case 'speed_boost':
                geometry = new THREE.OctahedronGeometry(0.6);
                material = new THREE.MeshLambertMaterial({ color: 0xffff44 });
                break;
                
            case 'laser':
                geometry = new THREE.CylinderGeometry(0.2, 0.2, 1.2, 6);
                material = new THREE.MeshLambertMaterial({ color: 0xff00ff });
                break;
                
            case 'freeze':
                geometry = new THREE.IcosahedronGeometry(0.6);
                material = new THREE.MeshLambertMaterial({ color: 0x00ffff });
                break;
                
            case 'triple_shot':
                geometry = new THREE.BoxGeometry(1, 0.4, 1);
                material = new THREE.MeshLambertMaterial({ color: 0xff8800 });
                break;
                
            case 'teleport':
                geometry = new THREE.TorusGeometry(0.6, 0.2, 8, 16);
                material = new THREE.MeshLambertMaterial({ color: 0x8800ff });
                break;
                
            default:
                geometry = new THREE.BoxGeometry(1, 1, 1);
                material = new THREE.MeshLambertMaterial({ color: 0xffffff });
        }
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        
        // Add glow effect
        this.addGlowEffect();
        
        // Add floating particles
        this.addParticles();
    }
    
    addGlowEffect() {
        const glowGeometry = new THREE.SphereGeometry(1.2, 8, 6);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: this.getGlowColor(),
            transparent: true,
            opacity: 0.3
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.mesh.add(glow);
    }
    
    addParticles() {
        const particleCount = 8;
        const particles = new THREE.Group();
        
        for (let i = 0; i < particleCount; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.1, 4, 4);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: this.getGlowColor(),
                transparent: true,
                opacity: 0.6
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Position particles in a circle around the power-up
            const angle = (i / particleCount) * Math.PI * 2;
            const radius = 1.5;
            particle.position.set(
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius
            );
            
            particles.add(particle);
        }
        
        this.mesh.add(particles);
        this.particles = particles;
    }
    
    getGlowColor() {
        switch (this.type) {
            case 'rocket': return 0xff6666;
            case 'mine': return 0x666666;
            case 'shield': return 0x6666ff;
            case 'speed_boost': return 0xffff66;
            case 'laser': return 0xff66ff;
            case 'freeze': return 0x66ffff;
            case 'triple_shot': return 0xff9966;
            case 'teleport': return 0x9966ff;
            default: return 0xffffff;
        }
    }
    
    update(deltaTime) {
        if (this.collected) return;
        
        this.time += deltaTime;
        
        // Rotate the power-up
        this.mesh.rotation.y += this.rotationSpeed * deltaTime;
        
        // Bob up and down
        const bobOffset = Math.sin(this.time * this.bobSpeed) * this.bobHeight;
        this.mesh.position.y = this.initialY + bobOffset;
        
        // Rotate particles
        if (this.particles) {
            this.particles.rotation.y += this.rotationSpeed * 0.5 * deltaTime;
        }
        
        // Pulse glow effect
        const glow = this.mesh.children[0];
        if (glow && glow.material) {
            glow.material.opacity = 0.2 + Math.sin(this.time * 3) * 0.1;
        }
    }
    
    collect() {
        this.collected = true;
        
        // Add collection effect
        this.addCollectionEffect();
        
        // Remove from scene after effect
        setTimeout(() => {
            if (this.mesh && this.mesh.parent) {
                this.mesh.parent.remove(this.mesh);
            }
        }, 500);
    }
    
    addCollectionEffect() {
        // Create explosion effect
        const particleCount = 20;
        const particles = new THREE.Group();
        
        for (let i = 0; i < particleCount; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.1, 4, 4);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: this.getGlowColor(),
                transparent: true,
                opacity: 1
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Random direction
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            particle.velocity = new THREE.Vector3(
                Math.cos(angle) * speed,
                Math.random() * 5,
                Math.sin(angle) * speed
            );
            
            particles.add(particle);
        }
        
        this.mesh.add(particles);
        
        // Animate particles
        const animateParticles = () => {
            particles.children.forEach(particle => {
                particle.position.add(particle.velocity.clone().multiplyScalar(0.016));
                particle.velocity.y -= 0.1; // Gravity
                particle.material.opacity -= 0.02;
            });
            
            if (particles.children[0].material.opacity > 0) {
                requestAnimationFrame(animateParticles);
            } else {
                this.mesh.remove(particles);
            }
        };
        
        animateParticles();
    }
    
    getPosition() {
        return this.position;
    }
    
    setPosition(position) {
        this.position.copy(position);
        this.mesh.position.copy(position);
    }
} 