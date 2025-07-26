import { Game } from './game/Game.js';
import { NetworkManager } from './network/NetworkManager.js';
import { UIManager } from './ui/UIManager.js';

class TurboKartArena {
    constructor() {
        this.game = null;
        this.network = null;
        this.ui = null;
        this.playerName = '';
        
        this.init();
    }
    
    init() {
        // Initialize UI manager
        this.ui = new UIManager();
        
        // Initialize network manager
        this.network = new NetworkManager();
        
        // Setup lobby event listeners
        this.setupLobbyEvents();
        
        // Hide loading screen
        document.getElementById('loading').style.display = 'none';
    }
    
    setupLobbyEvents() {
        const joinButton = document.getElementById('joinGame');
        const nameInput = document.getElementById('playerName');
        
        joinButton.addEventListener('click', () => {
            this.playerName = nameInput.value.trim() || `Player_${Math.random().toString(36).substr(2, 6)}`;
            this.startGame();
        });
        
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                joinButton.click();
            }
        });
        
        // Auto-focus name input
        nameInput.focus();
    }
    
    startGame() {
        // Hide lobby
        document.getElementById('lobby').classList.add('hidden');
        
        // Show game UI
        document.getElementById('ui').classList.remove('hidden');
        
        // Initialize game
        this.game = new Game(this.network, this.ui, this.playerName);
        
        // Connect to server
        this.network.connect(() => {
            this.network.joinGame(this.playerName);
        });
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new TurboKartArena();
}); 