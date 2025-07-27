import * as THREE from 'three';

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particleSystems = new Map();
        this.activeParticles = [];
        
        this.init();
    }
    
    init() {
        // Create particle materials
        this.materials = {
            fire: new THREE.PointsMaterial({
                color: 0xff4400,
                size: 0.5,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending
            }),
            smoke: new THREE.PointsMaterial({
                color: 0x666666,
                size: 1.0,
                transparent: true,
                opacity: 0.6
            }),
            spark: new THREE.PointsMaterial({
                color: 0xffff00,
                size: 0.3,
                transparent: true,
                opacity: 1.0,
                blending: THREE.AdditiveBlending
            }),
            magic: new THREE.PointsMaterial({
                color: 0x00ffff,
                size: 0.4,
                transparent: true,
                opacity: 0.9,
                blending: THREE.AdditiveBlending
            })
        };
    }
    
    createExplosion(position, options = {}) {
        const particleCount = options.particleCount || 50;
        const size = options.size || 1.0;
        const colors = options.colors || [0xff4400, 0xff8800, 0xffaa00];
        
        // Create multiple particle bursts with different colors
        colors.forEach((color, index) => {
            setTimeout(() => {
                this.createParticleBurst({
                    position: position.clone(),
                    particleCount: particleCount / colors.length,
                    speed: 8 + index * 2,
                    size: size,
                    color: color,
                    lifetime: 1.5,
                    gravity: -2
                });
            }, index * 100);
        });
        
        // Add shockwave effect
        this.createShockwave(position, options.shockwaveRadius || 5);
    }
    
    createParticleBurst(options) {
        const {
            position,
            particleCount = 30,
            speed = 5,
            size = 0.5,
            color = 0xff4400,
            lifetime = 2.0,
            gravity = -5,
            spread = Math.PI * 2
        } = options;
        
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Start all particles at the same position
            positions[i3] = position.x;
            positions[i3 + 1] = position.y;
            positions[i3 + 2] = position.z;
            
            // Random velocity in all directions
            const angle = Math.random() * spread;
            const elevation = (Math.random() - 0.5) * Math.PI * 0.5;
            const velocity = new THREE.Vector3(
                Math.cos(angle) * Math.cos(elevation) * speed * (0.5 + Math.random() * 0.5),
                Math.sin(elevation) * speed * (0.5 + Math.random() * 0.5),
                Math.sin(angle) * Math.cos(elevation) * speed * (0.5 + Math.random() * 0.5)
            );
            
            velocities.push(velocity);
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: color,
            size: size,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);
        
        // Store particle system for animation
        const particleSystem = {
            mesh: particles,
            velocities: velocities,
            lifetime: lifetime,
            age: 0,
            gravity: gravity,
            initialOpacity: material.opacity
        };
        
        this.activeParticles.push(particleSystem);
    }
    
    createShockwave(position, radius = 5) {
        const ringGeometry = new THREE.RingGeometry(0.1, 0.2, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        const shockwave = new THREE.Mesh(ringGeometry, ringMaterial);
        shockwave.position.copy(position);
        shockwave.rotation.x = -Math.PI / 2;
        this.scene.add(shockwave);
        
        // Animate shockwave
        const startTime = Date.now();
        const duration = 0.5;
        
        const animateShockwave = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = Math.min(elapsed / duration, 1);
            
            if (progress < 1) {
                const scale = progress * radius;
                shockwave.scale.set(scale, scale, 1);
                shockwave.material.opacity = 0.8 * (1 - progress);
                
                requestAnimationFrame(animateShockwave);
            } else {
                this.scene.remove(shockwave);
            }
        };
        
        animateShockwave();
    }
    
    createTrail(startPosition, endPosition, options = {}) {
        const {
            color = 0xff4400,
            width = 0.2,
            segments = 10,
            lifetime = 1.0
        } = options;
        
        const geometry = new THREE.CylinderGeometry(width, width * 0.1, startPosition.distanceTo(endPosition), segments);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8
        });
        
        const trail = new THREE.Mesh(geometry, material);
        
        // Position and orient the trail
        const midPoint = startPosition.clone().add(endPosition).multiplyScalar(0.5);
        trail.position.copy(midPoint);
        trail.lookAt(endPosition);
        trail.rotateX(Math.PI / 2);
        
        this.scene.add(trail);
        
        // Fade out trail
        const startTime = Date.now();
        const fadeTrail = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = elapsed / lifetime;
            
            if (progress < 1) {
                trail.material.opacity = 0.8 * (1 - progress);
                requestAnimationFrame(fadeTrail);
            } else {
                this.scene.remove(trail);
            }
        };
        
        fadeTrail();
    }
    
    createPowerUpEffect(position, type) {
        const effectConfigs = {
            rocket: {
                color: 0xff4400,
                particleCount: 20,
                speed: 3,
                size: 0.4
            },
            mine: {
                color: 0x333333,
                particleCount: 15,
                speed: 2,
                size: 0.3
            },
            shield: {
                color: 0x0044ff,
                particleCount: 25,
                speed: 4,
                size: 0.5
            },
            speed_boost: {
                color: 0xffff00,
                particleCount: 30,
                speed: 6,
                size: 0.3
            }
        };
        
        const config = effectConfigs[type] || effectConfigs.rocket;
        
        // Create upward burst
        this.createParticleBurst({
            position: position,
            particleCount: config.particleCount,
            speed: config.speed,
            size: config.size,
            color: config.color,
            lifetime: 1.0,
            gravity: -1,
            spread: Math.PI * 0.5 // Upward cone
        });
        
        // Create spiral effect
        this.createSpiralEffect(position, config.color);
    }
    
    createSpiralEffect(position, color) {
        const particleCount = 20;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            const angle = (i / particleCount) * Math.PI * 4; // 2 full rotations
            const radius = 0.5 + (i / particleCount) * 2;
            
            positions[i3] = position.x + Math.cos(angle) * radius;
            positions[i3 + 1] = position.y + (i / particleCount) * 3;
            positions[i3 + 2] = position.z + Math.sin(angle) * radius;
            
            // Spiral velocity
            velocities.push(new THREE.Vector3(
                Math.cos(angle + Math.PI / 2) * 2,
                2,
                Math.sin(angle + Math.PI / 2) * 2
            ));
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: color,
            size: 0.3,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);
        
        this.activeParticles.push({
            mesh: particles,
            velocities: velocities,
            lifetime: 2.0,
            age: 0,
            gravity: -1,
            initialOpacity: 1.0
        });
    }
    
    createDamageEffect(position, damage) {
        // Create hit sparks
        this.createParticleBurst({
            position: position,
            particleCount: Math.min(damage * 2, 30),
            speed: 5,
            size: 0.2,
            color: 0xffff00,
            lifetime: 0.5,
            gravity: -10,
            spread: Math.PI
        });
        
        // Create damage number (would need text rendering)
        this.createFloatingText(position, `-${damage}`, { color: 0xff0000 });
    }
    
    createFloatingText(position, text, options = {}) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 128;
        canvas.height = 64;
        
        context.fillStyle = options.color ? `#${options.color.toString(16).padStart(6, '0')}` : '#ffffff';
        context.font = '24px Arial';
        context.textAlign = 'center';
        context.fillText(text, 64, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        
        sprite.position.copy(position);
        sprite.scale.set(2, 1, 1);
        this.scene.add(sprite);
        
        // Animate floating text
        const startTime = Date.now();
        const duration = 1.5;
        const startY = position.y;
        
        const animateText = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = elapsed / duration;
            
            if (progress < 1) {
                sprite.position.y = startY + progress * 3;
                sprite.material.opacity = 1 - progress;
                requestAnimationFrame(animateText);
            } else {
                this.scene.remove(sprite);
            }
        };
        
        animateText();
    }
    
    update(deltaTime) {
        // Update all active particle systems
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const particleSystem = this.activeParticles[i];
            particleSystem.age += deltaTime;
            
            if (particleSystem.age >= particleSystem.lifetime) {
                // Remove expired particle system
                this.scene.remove(particleSystem.mesh);
                this.activeParticles.splice(i, 1);
                continue;
            }
            
            // Update particle positions
            const positions = particleSystem.mesh.geometry.attributes.position.array;
            
            for (let j = 0; j < particleSystem.velocities.length; j++) {
                const j3 = j * 3;
                const velocity = particleSystem.velocities[j];
                
                // Apply gravity
                velocity.y += particleSystem.gravity * deltaTime;
                
                // Update position
                positions[j3] += velocity.x * deltaTime;
                positions[j3 + 1] += velocity.y * deltaTime;
                positions[j3 + 2] += velocity.z * deltaTime;
            }
            
            particleSystem.mesh.geometry.attributes.position.needsUpdate = true;
            
            // Update opacity
            const lifeProgress = particleSystem.age / particleSystem.lifetime;
            particleSystem.mesh.material.opacity = particleSystem.initialOpacity * (1 - lifeProgress);
        }
    }
    
    clearAll() {
        this.activeParticles.forEach(particleSystem => {
            this.scene.remove(particleSystem.mesh);
        });
        this.activeParticles.length = 0;
    }
}
