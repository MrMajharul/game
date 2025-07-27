const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, '../dist')));

// Game state
const gameState = {
    players: new Map(),
    powerUps: [],
    gameStarted: false,
    mapBounds: {
        width: 200,
        height: 200
    }
};

// Power-up types
const POWER_UP_TYPES = {
    ROCKET: 'rocket',
    MINE: 'mine',
    SHIELD: 'shield',
    SPEED_BOOST: 'speed_boost',
    LASER: 'laser',
    FREEZE: 'freeze',
    TRIPLE_SHOT: 'triple_shot',
    TELEPORT: 'teleport'
};

// Generate random power-ups
function generatePowerUps() {
    gameState.powerUps = [];
    for (let i = 0; i < 15; i++) { // Increased number of power-ups
        gameState.powerUps.push({
            id: `powerup_${i}`,
            type: Object.values(POWER_UP_TYPES)[Math.floor(Math.random() * Object.values(POWER_UP_TYPES).length)],
            position: {
                x: (Math.random() - 0.5) * gameState.mapBounds.width,
                y: 1,
                z: (Math.random() - 0.5) * gameState.mapBounds.height
            },
            collected: false
        });
    }
}

// Get random spawn position
function getRandomSpawnPosition() {
    return {
        x: (Math.random() - 0.5) * gameState.mapBounds.width * 0.8,
        y: 2,
        z: (Math.random() - 0.5) * gameState.mapBounds.height * 0.8
    };
}

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Player joins game
    socket.on('joinGame', (playerName) => {
        const spawnPos = getRandomSpawnPosition();
        
        const player = {
            id: socket.id,
            name: playerName || `Player_${socket.id.slice(0, 6)}`,
            position: spawnPos,
            rotation: { x: 0, y: 0, z: 0 },
            velocity: { x: 0, y: 0, z: 0 },
            health: 100,
            score: 0,
            weapon: null,
            lastUpdate: Date.now()
        };

        gameState.players.set(socket.id, player);

        // Send current game state to new player
        socket.emit('gameState', {
            players: Array.from(gameState.players.values()),
            powerUps: gameState.powerUps,
            mapBounds: gameState.mapBounds,
            playerId: socket.id
        });

        // Notify other players
        socket.broadcast.emit('playerJoined', player);

        console.log(`Player ${player.name} joined the game`);
    });

    // Player movement update
    socket.on('playerUpdate', (data) => {
        const player = gameState.players.get(socket.id);
        if (player) {
            player.position = data.position;
            player.rotation = data.rotation;
            player.velocity = data.velocity;
            player.lastUpdate = Date.now();
            
            // Broadcast to other players
            socket.broadcast.emit('playerMoved', {
                id: socket.id,
                position: player.position,
                rotation: player.rotation,
                velocity: player.velocity
            });
        }
    });

    // Player fires weapon
    socket.on('fireWeapon', (data) => {
        const player = gameState.players.get(socket.id);
        if (player && player.weapon) {
            const projectile = {
                id: `projectile_${Date.now()}_${socket.id}`,
                type: player.weapon,
                position: { ...player.position },
                direction: data.direction,
                ownerId: socket.id,
                timestamp: Date.now()
            };

            // Broadcast projectile to all players
            io.emit('projectileFired', projectile);
            
            // Clear weapon after firing
            player.weapon = null;
        }
    });

    // Player collects power-up
    socket.on('collectPowerUp', (powerUpId) => {
        const powerUp = gameState.powerUps.find(p => p.id === powerUpId && !p.collected);
        const player = gameState.players.get(socket.id);
        
        if (powerUp && player) {
            powerUp.collected = true;
            player.weapon = powerUp.type;
            
            // Broadcast power-up collection
            io.emit('powerUpCollected', {
                powerUpId: powerUpId,
                playerId: socket.id,
                weaponType: powerUp.type
            });
        }
    });

    // Player takes damage
    socket.on('playerHit', (data) => {
        const targetPlayer = gameState.players.get(data.targetId);
        const attackerPlayer = gameState.players.get(data.attackerId);
        
        if (targetPlayer && attackerPlayer) {
            const damage = data.weaponType === 'rocket' ? 25 : 15;
            targetPlayer.health = Math.max(0, targetPlayer.health - damage);
            attackerPlayer.score += damage;
            
            // Broadcast damage event
            io.emit('playerDamaged', {
                targetId: data.targetId,
                attackerId: data.attackerId,
                damage: damage,
                newHealth: targetPlayer.health,
                newScore: attackerPlayer.score
            });
            
            // Check if player died
            if (targetPlayer.health <= 0) {
                const spawnPos = getRandomSpawnPosition();
                targetPlayer.position = spawnPos;
                targetPlayer.health = 100;
                targetPlayer.weapon = null;
                
                io.emit('playerRespawned', {
                    playerId: data.targetId,
                    position: spawnPos
                });
            }
        }
    });

    // Player disconnects
    socket.on('disconnect', () => {
        const player = gameState.players.get(socket.id);
        if (player) {
            console.log(`Player ${player.name} disconnected`);
            gameState.players.delete(socket.id);
            socket.broadcast.emit('playerLeft', socket.id);
        }
    });
});

// Game loop - update power-ups periodically
setInterval(() => {
    if (gameState.powerUps.filter(p => !p.collected).length < 5) {
        generatePowerUps();
        io.emit('powerUpsRespawned', gameState.powerUps);
    }
}, 10000);

// Initial power-up generation
generatePowerUps();

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🚗 TurboKart Arena server running on port ${PORT}`);
    console.log(`🌐 Open http://localhost:${PORT} to play!`);
}); 