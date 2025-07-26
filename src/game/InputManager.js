export class InputManager {
    constructor() {
        this.keys = new Map();
        this.mouse = {
            x: 0,
            y: 0,
            buttons: new Map()
        };
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (event) => {
            this.keys.set(event.code, true);
        });
        
        document.addEventListener('keyup', (event) => {
            this.keys.set(event.code, false);
        });
        
        // Mouse events
        document.addEventListener('mousemove', (event) => {
            this.mouse.x = event.clientX;
            this.mouse.y = event.clientY;
        });
        
        document.addEventListener('mousedown', (event) => {
            this.mouse.buttons.set(event.button, true);
        });
        
        document.addEventListener('mouseup', (event) => {
            this.mouse.buttons.set(event.button, false);
        });
        
        // Prevent context menu
        document.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
        
        // Prevent default behavior for game keys
        document.addEventListener('keydown', (event) => {
            const gameKeys = [
                'KeyW', 'KeyA', 'KeyS', 'KeyD',
                'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
                'Space'
            ];
            
            if (gameKeys.includes(event.code)) {
                event.preventDefault();
            }
        });
    }
    
    isKeyPressed(keyCode) {
        return this.keys.get(keyCode) || false;
    }
    
    isKeyDown(keyCode) {
        return this.keys.get(keyCode) || false;
    }
    
    isMouseButtonPressed(button) {
        return this.mouse.buttons.get(button) || false;
    }
    
    getMousePosition() {
        return { x: this.mouse.x, y: this.mouse.y };
    }
    
    onKeyDown(keyCode, callback) {
        const handler = (event) => {
            if (event.code === keyCode) {
                callback();
            }
        };
        
        document.addEventListener('keydown', handler);
        
        // Return cleanup function
        return () => {
            document.removeEventListener('keydown', handler);
        };
    }
    
    onKeyUp(keyCode, callback) {
        const handler = (event) => {
            if (event.code === keyCode) {
                callback();
            }
        };
        
        document.addEventListener('keyup', handler);
        
        // Return cleanup function
        return () => {
            document.removeEventListener('keyup', handler);
        };
    }
    
    onMouseDown(button, callback) {
        const handler = (event) => {
            if (event.button === button) {
                callback();
            }
        };
        
        document.addEventListener('mousedown', handler);
        
        // Return cleanup function
        return () => {
            document.removeEventListener('mousedown', handler);
        };
    }
    
    onMouseUp(button, callback) {
        const handler = (event) => {
            if (event.button === button) {
                callback();
            }
        };
        
        document.addEventListener('mouseup', handler);
        
        // Return cleanup function
        return () => {
            document.removeEventListener('mouseup', handler);
        };
    }
    
    // Get movement input as a normalized vector
    getMovementInput() {
        let x = 0;
        let z = 0;
        
        if (this.isKeyPressed('KeyW') || this.isKeyPressed('ArrowUp')) {
            z -= 1;
        }
        if (this.isKeyPressed('KeyS') || this.isKeyPressed('ArrowDown')) {
            z += 1;
        }
        if (this.isKeyPressed('KeyA') || this.isKeyPressed('ArrowLeft')) {
            x -= 1;
        }
        if (this.isKeyPressed('KeyD') || this.isKeyPressed('ArrowRight')) {
            x += 1;
        }
        
        // Normalize diagonal movement
        if (x !== 0 && z !== 0) {
            const length = Math.sqrt(x * x + z * z);
            x /= length;
            z /= length;
        }
        
        return { x, z };
    }
    
    // Get rotation input (for mouse look)
    getRotationInput() {
        // This could be used for mouse look in a first-person view
        // For now, we'll use keyboard for turning
        let y = 0;
        
        if (this.isKeyPressed('KeyA') || this.isKeyPressed('ArrowLeft')) {
            y -= 1;
        }
        if (this.isKeyPressed('KeyD') || this.isKeyPressed('ArrowRight')) {
            y += 1;
        }
        
        return { y };
    }
    
    // Check if any movement keys are pressed
    isMoving() {
        return this.isKeyPressed('KeyW') || this.isKeyPressed('KeyA') || 
               this.isKeyPressed('KeyS') || this.isKeyPressed('KeyD') ||
               this.isKeyPressed('ArrowUp') || this.isKeyPressed('ArrowLeft') ||
               this.isKeyPressed('ArrowDown') || this.isKeyPressed('ArrowRight');
    }
    
    // Check if firing key is pressed
    isFiring() {
        return this.isKeyPressed('Space') || this.isMouseButtonPressed(0);
    }
} 