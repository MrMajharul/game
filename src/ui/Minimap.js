import * as THREE from 'three';

export class Minimap {
    constructor(scene, player, otherPlayers, powerUps) {
        this.scene = scene;
        this.player = player;
        this.otherPlayers = otherPlayers;
        this.powerUps = powerUps;
        
        this.canvas = null;
        this.context = null;
        this.size = 200;
        this.mapScale = 0.5;
        this.visible = true;
        
        this.init();
    }
    
    init() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.size;
        this.canvas.height = this.size;
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '20px';
        this.canvas.style.left = '50%';
        this.canvas.style.transform = 'translateX(-50%)';
        this.canvas.style.border = '3px solid #fff';
        this.canvas.style.borderRadius = '10px';
        this.canvas.style.background = 'rgba(0, 0, 0, 0.8)';
        this.canvas.style.zIndex = '1000';
        
        this.context = this.canvas.getContext('2d');
        document.body.appendChild(this.canvas);
        
        this.canvas.addEventListener('click', () => {
            this.toggle();
        });
    }
    
    toggle() {
        this.visible = !this.visible;
        this.canvas.style.opacity = this.visible ? '1' : '0.3';
    }
    
    worldToMinimap(worldPos) {
        const centerX = this.size / 2;
        const centerY = this.size / 2;
        
        return {
            x: centerX + worldPos.x * this.mapScale,
            y: centerY + worldPos.z * this.mapScale
        };
    }
    
    update() {
        if (!this.visible || !this.player) return;
        
        this.context.clearRect(0, 0, this.size, this.size);
        this.drawGrid();
        this.drawBoundary();
        this.drawObstacles();
        this.drawPowerUps();
        this.drawOtherPlayers();
        this.drawPlayer();
        this.drawCompass();
    }
    
    drawGrid() {
        this.context.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.context.lineWidth = 1;
        
        const gridSize = 20 * this.mapScale;
        const centerX = this.size / 2;
        const centerY = this.size / 2;
        
        for (let x = centerX % gridSize; x < this.size; x += gridSize) {
            this.context.beginPath();
            this.context.moveTo(x, 0);
            this.context.lineTo(x, this.size);
            this.context.stroke();
        }
        
        for (let y = centerY % gridSize; y < this.size; y += gridSize) {
            this.context.beginPath();
            this.context.moveTo(0, y);
            this.context.lineTo(this.size, y);
            this.context.stroke();
        }
    }
    
    drawBoundary() {
        const mapBounds = 100;
        const topLeft = this.worldToMinimap({ x: -mapBounds, z: -mapBounds });
        const bottomRight = this.worldToMinimap({ x: mapBounds, z: mapBounds });
        
        this.context.strokeStyle = '#ffff00';
        this.context.lineWidth = 2;
        this.context.strokeRect(
            topLeft.x,
            topLeft.y,
            bottomRight.x - topLeft.x,
            bottomRight.y - topLeft.y
        );
    }
    
    drawObstacles() {
        this.context.fillStyle = '#8B4513';
        
        const obstacles = [
            { x: 20, z: 20 }, { x: -20, z: -20 }, { x: 30, z: -30 },
            { x: -30, z: 30 }, { x: 0, z: 40 }, { x: 0, z: -40 },
            { x: 50, z: 0 }, { x: -50, z: 0 }
        ];
        
        obstacles.forEach(obstacle => {
            const pos = this.worldToMinimap(obstacle);
            this.context.fillRect(pos.x - 2, pos.y - 2, 4, 4);
        });
    }
    
    drawPowerUps() {
        if (!this.powerUps) return;
        
        this.powerUps.forEach(powerUp => {
            const pos = this.worldToMinimap(powerUp.position);
            
            const colors = {
                'rocket': '#ff4444',
                'mine': '#444444',
                'shield': '#4444ff',
                'speed_boost': '#ffff44',
                'laser': '#ff44ff',
                'freeze': '#44ffff',
                'triple_shot': '#ff8844',
                'teleport': '#8844ff'
            };
            
            this.context.fillStyle = colors[powerUp.type] || '#ffffff';
            this.context.beginPath();
            this.context.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
            this.context.fill();
        });
    }
    
    drawOtherPlayers() {
        if (!this.otherPlayers) return;
        
        this.otherPlayers.forEach(player => {
            const pos = this.worldToMinimap(player.position);
            
            this.context.fillStyle = '#ff0000';
            this.context.beginPath();
            this.context.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
            this.context.fill();
            
            this.context.fillStyle = '#ffffff';
            this.context.font = '10px Arial';
            this.context.textAlign = 'center';
            this.context.fillText(player.name || 'Player', pos.x, pos.y - 8);
        });
    }
    
    drawPlayer() {
        if (!this.player || !this.player.position) return;
        
        const pos = this.worldToMinimap(this.player.position);
        
        this.context.fillStyle = '#00ff00';
        this.context.beginPath();
        this.context.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
        this.context.fill();
        
        const rotation = this.player.rotation.y;
        const length = 10;
        const endX = pos.x + Math.sin(rotation) * length;
        const endY = pos.y + Math.cos(rotation) * length;
        
        this.context.strokeStyle = '#00ff00';
        this.context.lineWidth = 2;
        this.context.beginPath();
        this.context.moveTo(pos.x, pos.y);
        this.context.lineTo(endX, endY);
        this.context.stroke();
        
        this.context.fillStyle = '#ffffff';
        this.context.font = '12px Arial';
        this.context.textAlign = 'center';
        this.context.fillText('YOU', pos.x, pos.y - 12);
    }
    
    drawCompass() {
        const compassSize = 30;
        const compassX = this.size - compassSize - 10;
        const compassY = compassSize + 10;
        
        this.context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.context.beginPath();
        this.context.arc(compassX, compassY, compassSize / 2, 0, Math.PI * 2);
        this.context.fill();
        
        this.context.fillStyle = '#ff0000';
        this.context.font = '12px Arial';
        this.context.textAlign = 'center';
        this.context.fillText('N', compassX, compassY - 10);
        
        this.context.strokeStyle = '#ffffff';
        this.context.lineWidth = 2;
        this.context.beginPath();
        this.context.arc(compassX, compassY, compassSize / 2, 0, Math.PI * 2);
        this.context.stroke();
    }
    
    destroy() {
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}
