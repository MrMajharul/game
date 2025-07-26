# 🚗 TurboKart Arena

A browser-based 3D multiplayer kart battle game inspired by smashkarts.io. Drive around, collect power-ups, and battle other players in real-time!

## 🎮 Features

- **Real-time Multiplayer**: Battle against other players in real-time
- **3D Environment**: Beautiful 3D world with obstacles and terrain
- **Power-ups**: Collect rockets, mines, shields, and speed boosts
- **Combat System**: Fire weapons and damage opponents
- **Health System**: Manage your health and respawn when defeated
- **Scoreboard**: Track scores and see the leaderboard
- **Simple Controls**: Easy-to-learn keyboard controls

## 🎯 Controls

- **WASD** or **Arrow Keys**: Move your kart
- **Space**: Fire weapon (when you have one)
- **Mouse**: Look around (optional)

## 🚀 Quick Start

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd turbokart-arena
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   - Navigate to `http://localhost:3000`
   - Enter your name and click "Join Game"
   - Start playing!

### Production Build

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

## 🏗️ Project Structure

```
turbokart-arena/
├── src/
│   ├── game/
│   │   ├── Game.js          # Main game engine
│   │   ├── Kart.js          # Player kart physics and rendering
│   │   ├── PowerUp.js       # Power-up items
│   │   ├── Projectile.js    # Weapon projectiles
│   │   ├── InputManager.js  # Keyboard/mouse input handling
│   │   └── Physics.js       # Basic physics calculations
│   ├── network/
│   │   └── NetworkManager.js # Socket.IO client communication
│   ├── ui/
│   │   └── UIManager.js     # HUD and scoreboard management
│   └── main.js              # Application entry point
├── server/
│   └── index.js             # Express + Socket.IO server
├── index.html               # Main HTML file
├── package.json             # Dependencies and scripts
├── vite.config.js           # Vite configuration
└── README.md               # This file
```

## 🛠️ Technology Stack

- **Frontend**: Three.js (3D rendering), Vite (build tool)
- **Backend**: Node.js, Express, Socket.IO
- **Physics**: Custom physics engine (basic)
- **Styling**: CSS3 with modern design

## 🎨 Game Mechanics

### Power-ups
- **🚀 Rocket**: High-damage projectile weapon
- **💣 Mine**: Explosive device
- **🛡️ Shield**: Temporary protection
- **⚡ Speed Boost**: Temporary speed increase

### Combat
- Collect power-ups by driving over them
- Press Space to fire your weapon
- Hit opponents to deal damage
- When health reaches 0, you respawn

### Scoring
- Deal damage to earn points
- Higher damage = more points
- Leaderboard shows current rankings

## 🌐 Multiplayer

The game uses Socket.IO for real-time communication:
- Player movement synchronization
- Power-up collection
- Combat and damage
- Score updates
- Player join/leave events

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to your preferred platform**:
   - **Heroku**: `git push heroku main`
   - **Vercel**: Connect your repository
   - **VPS**: Upload files and run `npm start`

### Environment Variables
- `PORT`: Server port (default: 3001)

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   - Change the port in `server/index.js` or `vite.config.js`

2. **Connection refused**
   - Make sure the server is running on port 3001
   - Check firewall settings

3. **Performance issues**
   - Reduce graphics quality in browser settings
   - Close other browser tabs

### Browser Compatibility
- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🎉 Credits

- Inspired by smashkarts.io
- Built with Three.js and Socket.IO
- Created for educational purposes

## 🔮 Future Features

- [ ] More power-up types
- [ ] Different maps and environments
- [ ] Team modes
- [ ] Custom kart skins
- [ ] Sound effects and music
- [ ] Mobile support
- [ ] Tournament system

---

**Have fun playing TurboKart Arena! 🏁** 