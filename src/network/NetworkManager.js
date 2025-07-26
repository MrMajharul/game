import { io } from 'socket.io-client';

export class NetworkManager {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.callbacks = {
            onGameState: null,
            onPlayerJoined: null,
            onPlayerLeft: null,
            onPlayerMoved: null,
            onProjectileFired: null,
            onPowerUpCollected: null,
            onPlayerDamaged: null,
            onPlayerRespawned: null,
            onPowerUpsRespawned: null
        };
    }
    
    connect(onConnected) {
        // Connect to the server
        this.socket = io('http://localhost:3001');
        
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.connected = true;
            if (onConnected) onConnected();
        });
        
        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.connected = false;
        });
        
        // Setup event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.socket.on('gameState', (data) => {
            if (this.callbacks.onGameState) {
                this.callbacks.onGameState(data);
            }
        });
        
        this.socket.on('playerJoined', (player) => {
            if (this.callbacks.onPlayerJoined) {
                this.callbacks.onPlayerJoined(player);
            }
        });
        
        this.socket.on('playerLeft', (playerId) => {
            if (this.callbacks.onPlayerLeft) {
                this.callbacks.onPlayerLeft(playerId);
            }
        });
        
        this.socket.on('playerMoved', (data) => {
            if (this.callbacks.onPlayerMoved) {
                this.callbacks.onPlayerMoved(data);
            }
        });
        
        this.socket.on('projectileFired', (projectile) => {
            if (this.callbacks.onProjectileFired) {
                this.callbacks.onProjectileFired(projectile);
            }
        });
        
        this.socket.on('powerUpCollected', (data) => {
            if (this.callbacks.onPowerUpCollected) {
                this.callbacks.onPowerUpCollected(data);
            }
        });
        
        this.socket.on('playerDamaged', (data) => {
            if (this.callbacks.onPlayerDamaged) {
                this.callbacks.onPlayerDamaged(data);
            }
        });
        
        this.socket.on('playerRespawned', (data) => {
            if (this.callbacks.onPlayerRespawned) {
                this.callbacks.onPlayerRespawned(data);
            }
        });
        
        this.socket.on('powerUpsRespawned', (powerUps) => {
            if (this.callbacks.onPowerUpsRespawned) {
                this.callbacks.onPowerUpsRespawned(powerUps);
            }
        });
    }
    
    joinGame(playerName) {
        if (this.connected) {
            this.socket.emit('joinGame', playerName);
        }
    }
    
    updatePlayer(data) {
        if (this.connected) {
            this.socket.emit('playerUpdate', data);
        }
    }
    
    fireWeapon(direction) {
        if (this.connected) {
            this.socket.emit('fireWeapon', { direction });
        }
    }
    
    collectPowerUp(powerUpId) {
        if (this.connected) {
            this.socket.emit('collectPowerUp', powerUpId);
        }
    }
    
    playerHit(targetId, weaponType) {
        if (this.connected) {
            this.socket.emit('playerHit', { targetId, weaponType });
        }
    }
    
    on(event, callback) {
        if (this.callbacks.hasOwnProperty(event)) {
            this.callbacks[event] = callback;
        }
    }
    
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
} 