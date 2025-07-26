export class UIManager {
    constructor() {
        this.healthElement = document.getElementById('health');
        this.speedElement = document.getElementById('speed');
        this.weaponElement = document.getElementById('weapon');
        this.scoreElement = document.getElementById('score');
        this.playersListElement = document.getElementById('playersList');
        
        this.players = new Map();
    }
    
    updateHUD(player) {
        if (this.healthElement) {
            this.healthElement.textContent = player.health;
        }
        
        if (this.speedElement) {
            const speed = Math.sqrt(
                player.velocity.x * player.velocity.x + 
                player.velocity.z * player.velocity.z
            );
            this.speedElement.textContent = Math.round(speed * 10);
        }
        
        if (this.weaponElement) {
            this.weaponElement.textContent = player.weapon ? this.getWeaponDisplayName(player.weapon) : 'None';
        }
        
        if (this.scoreElement) {
            this.scoreElement.textContent = player.score;
        }
    }
    
    getWeaponDisplayName(weaponType) {
        const weaponNames = {
            'rocket': '🚀 Rocket',
            'mine': '💣 Mine',
            'shield': '🛡️ Shield',
            'speed_boost': '⚡ Speed Boost'
        };
        return weaponNames[weaponType] || weaponType;
    }
    
    updateScoreboard(players) {
        this.players = new Map(players.map(p => [p.id, p]));
        this.renderScoreboard();
    }
    
    addPlayer(player) {
        this.players.set(player.id, player);
        this.renderScoreboard();
    }
    
    removePlayer(playerId) {
        this.players.delete(playerId);
        this.renderScoreboard();
    }
    
    updatePlayer(player) {
        this.players.set(player.id, player);
        this.renderScoreboard();
    }
    
    renderScoreboard() {
        if (!this.playersListElement) return;
        
        const sortedPlayers = Array.from(this.players.values())
            .sort((a, b) => b.score - a.score);
        
        this.playersListElement.innerHTML = sortedPlayers
            .map((player, index) => {
                const rank = index + 1;
                const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
                const healthColor = player.health > 50 ? 'green' : player.health > 25 ? 'orange' : 'red';
                
                return `
                    <div style="margin: 5px 0; padding: 5px; background: rgba(255,255,255,0.1); border-radius: 5px;">
                        <strong>${rankEmoji} ${player.name}</strong><br>
                        <small>Score: ${player.score} | Health: <span style="color: ${healthColor}">${player.health}</span></small>
                    </div>
                `;
            })
            .join('');
    }
    
    showMessage(message, duration = 3000) {
        // Create a temporary message element
        const messageElement = document.createElement('div');
        messageElement.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 20px;
            border-radius: 10px;
            font-size: 18px;
            z-index: 1000;
            pointer-events: none;
        `;
        messageElement.textContent = message;
        
        document.body.appendChild(messageElement);
        
        // Remove after duration
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
        }, duration);
    }
    
    showDamageIndicator(targetId, damage) {
        // Find the player element in the 3D scene and show damage
        // This would be implemented in the Game class
        console.log(`Player ${targetId} took ${damage} damage`);
    }
} 