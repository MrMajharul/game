import * as THREE from 'three';

export class Physics {
    constructor() {
        this.gravity = -9.8;
        this.airResistance = 0.98;
        this.groundFriction = 0.95;
    }
    
    // Check collision between two objects
    checkCollision(obj1, obj2, radius1 = 1, radius2 = 1) {
        const distance = obj1.position.distanceTo(obj2.position);
        return distance < (radius1 + radius2);
    }
    
    // Check if point is inside bounds
    isInsideBounds(position, bounds) {
        return position.x >= -bounds.width / 2 &&
               position.x <= bounds.width / 2 &&
               position.z >= -bounds.height / 2 &&
               position.z <= bounds.height / 2;
    }
    
    // Apply gravity to velocity
    applyGravity(velocity, deltaTime) {
        velocity.y += this.gravity * deltaTime;
        return velocity;
    }
    
    // Apply air resistance
    applyAirResistance(velocity) {
        velocity.multiplyScalar(this.airResistance);
        return velocity;
    }
    
    // Apply ground friction
    applyGroundFriction(velocity) {
        velocity.x *= this.groundFriction;
        velocity.z *= this.groundFriction;
        return velocity;
    }
    
    // Bounce off walls
    bounceOffWalls(position, velocity, bounds) {
        const margin = 1;
        
        if (position.x <= -bounds.width / 2 + margin || position.x >= bounds.width / 2 - margin) {
            velocity.x *= -0.8; // Bounce with energy loss
            position.x = Math.max(-bounds.width / 2 + margin, 
                                Math.min(bounds.width / 2 - margin, position.x));
        }
        
        if (position.z <= -bounds.height / 2 + margin || position.z >= bounds.height / 2 - margin) {
            velocity.z *= -0.8; // Bounce with energy loss
            position.z = Math.max(-bounds.height / 2 + margin, 
                                Math.min(bounds.height / 2 - margin, position.z));
        }
        
        return { position, velocity };
    }
    
    // Check collision with obstacles
    checkObstacleCollision(position, obstacles) {
        for (const obstacle of obstacles) {
            const distance = position.distanceTo(obstacle.position);
            if (distance < 3) { // Collision radius
                return obstacle;
            }
        }
        return null;
    }
    
    // Resolve collision with obstacle
    resolveObstacleCollision(position, velocity, obstacle) {
        const direction = position.clone().sub(obstacle.position).normalize();
        const pushDistance = 3 - position.distanceTo(obstacle.position);
        
        // Push away from obstacle
        position.add(direction.multiplyScalar(pushDistance));
        
        // Reflect velocity
        const normal = direction;
        const dot = velocity.dot(normal);
        velocity.sub(normal.multiplyScalar(2 * dot));
        velocity.multiplyScalar(0.5); // Energy loss
        
        return { position, velocity };
    }
    
    // Calculate distance between two points
    distance(point1, point2) {
        return point1.distanceTo(point2);
    }
    
    // Check if two spheres intersect
    sphereIntersection(center1, radius1, center2, radius2) {
        const distance = center1.distanceTo(center2);
        return distance < (radius1 + radius2);
    }
    
    // Get closest point on line segment
    closestPointOnLine(point, lineStart, lineEnd) {
        const line = lineEnd.clone().sub(lineStart);
        const t = Math.max(0, Math.min(1, 
            point.clone().sub(lineStart).dot(line) / line.dot(line)
        ));
        return lineStart.clone().add(line.multiplyScalar(t));
    }
    
    // Check if point is inside polygon (simple convex polygon)
    pointInPolygon(point, polygon) {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            if (((polygon[i].z > point.z) !== (polygon[j].z > point.z)) &&
                (point.x < (polygon[j].x - polygon[i].x) * (point.z - polygon[i].z) / 
                 (polygon[j].z - polygon[i].z) + polygon[i].x)) {
                inside = !inside;
            }
        }
        return inside;
    }
} 