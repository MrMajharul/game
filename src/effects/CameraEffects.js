import * as THREE from 'three';

export class CameraEffects {
    constructor(camera) {
        this.camera = camera;
        this.originalPosition = camera.position.clone();
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeTime = 0;
        
        this.bobAmplitude = 0.3;
        this.bobSpeed = 4.0;
        this.bobTime = 0;
        
        this.followTarget = null;
        this.followOffset = new THREE.Vector3(0, 8, 12);
        this.followSmoothness = 0.1;
        
        this.effects = [];
    }
    
    shake(intensity = 1.0, duration = 0.5) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
        this.shakeDuration = Math.max(this.shakeDuration, duration);
        this.shakeTime = 0;
    }
    
    setFollowTarget(target) {
        this.followTarget = target;
    }
    
    addEffect(effect) {
        this.effects.push({
            ...effect,
            startTime: Date.now()
        });
    }
    
    update(deltaTime) {
        let cameraOffset = new THREE.Vector3(0, 0, 0);
        
        // Update screen shake
        if (this.shakeTime < this.shakeDuration) {
            const shakeAmount = this.shakeIntensity * (1 - this.shakeTime / this.shakeDuration);
            cameraOffset.x += (Math.random() - 0.5) * shakeAmount;
            cameraOffset.y += (Math.random() - 0.5) * shakeAmount;
            cameraOffset.z += (Math.random() - 0.5) * shakeAmount;
            
            this.shakeTime += deltaTime;
        }
        
        // Update camera bob (for movement feel)
        if (this.followTarget && this.followTarget.velocity && this.followTarget.velocity.length() > 0.1) {
            this.bobTime += deltaTime * this.bobSpeed;
            cameraOffset.y += Math.sin(this.bobTime) * this.bobAmplitude * this.followTarget.velocity.length() * 0.1;
        }
        
        // Follow target
        if (this.followTarget) {
            const targetPosition = this.followTarget.position.clone();
            targetPosition.add(this.followOffset);
            targetPosition.add(cameraOffset);
            
            this.camera.position.lerp(targetPosition, this.followSmoothness);
            this.camera.lookAt(this.followTarget.position);
        } else {
            // Apply effects to current position
            this.camera.position.copy(this.originalPosition.clone().add(cameraOffset));
        }
        
        // Update custom effects
        this.updateEffects(deltaTime);
    }
    
    updateEffects(deltaTime) {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            const elapsed = (Date.now() - effect.startTime) / 1000;
            
            if (elapsed >= effect.duration) {
                this.effects.splice(i, 1);
                continue;
            }
            
            const progress = elapsed / effect.duration;
            
            switch (effect.type) {
                case 'zoom':
                    const zoomFactor = effect.intensity * (1 - progress);
                    this.camera.zoom = 1 + zoomFactor;
                    this.camera.updateProjectionMatrix();
                    break;
                    
                case 'flash':
                    // This would need a post-processing pass or overlay
                    break;
                    
                case 'tilt':
                    this.camera.rotation.z = effect.intensity * Math.sin(progress * Math.PI);
                    break;
            }
        }
    }
    
    flashScreen(intensity = 0.5, duration = 0.2) {
        this.addEffect({
            type: 'flash',
            intensity: intensity,
            duration: duration
        });
    }
    
    zoomPunch(intensity = 0.1, duration = 0.3) {
        this.addEffect({
            type: 'zoom',
            intensity: intensity,
            duration: duration
        });
    }
    
    tiltEffect(intensity = 0.1, duration = 0.5) {
        this.addEffect({
            type: 'tilt',
            intensity: intensity,
            duration: duration
        });
    }
}
