
class FPSGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.instructions = document.getElementById('instructions');
        
        // Game state
        this.gameStarted = false;
        this.isPointerLocked = false;
        
        // Player stats
        this.health = 100;
        this.ammo = 30;
        this.maxAmmo = 30;
        this.score = 0;
        
        // Player position and rotation
        this.player = {
            x: 400,
            y: 300,
            angle: 0,
            speed: 3
        };
        
        // Camera/view settings
        this.fov = Math.PI / 3;
        this.viewDistance = 800;
        
        // Game world (simple maze)
        this.worldMap = [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,1,1,0,0,0,0,0,0,0,0,1,1,0,1],
            [1,0,1,0,0,0,0,1,1,0,0,0,0,1,0,1],
            [1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,1,1,0,0,1,1,0,0,0,0,1],
            [1,0,0,0,0,1,1,0,0,1,1,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,1,0,0,0,0,1,1,0,0,0,0,1,0,1],
            [1,0,1,1,0,0,0,0,0,0,0,0,1,1,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ];
        
        this.cellSize = 50;
        
        // Enemies
        this.enemies = [
            { x: 200, y: 200, health: 3, alive: true },
            { x: 600, y: 400, health: 3, alive: true },
            { x: 300, y: 500, health: 3, alive: true },
            { x: 700, y: 200, health: 3, alive: true }
        ];
        
        // Input handling
        this.keys = {};
        this.mouseX = 0;
        this.mouseY = 0;
        
        this.init();
    }
    
    init() {
        this.resizeCanvas();
        this.setupEventListeners();
        this.gameLoop();
        
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    setupEventListeners() {
        // Click to start game
        this.canvas.addEventListener('click', () => {
            if (!this.gameStarted) {
                this.startGame();
            } else if (this.gameStarted && this.ammo > 0) {
                this.shoot();
            }
        });
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'KeyR' && this.gameStarted) {
                this.reload();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Mouse movement
        document.addEventListener('mousemove', (e) => {
            if (this.isPointerLocked) {
                this.player.angle += e.movementX * 0.002;
            }
        });
        
        // Pointer lock events
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === this.canvas;
        });
    }
    
    startGame() {
        this.gameStarted = true;
        this.instructions.classList.add('hidden');
        this.canvas.requestPointerLock();
    }
    
    handleInput() {
        if (!this.gameStarted) return;
        
        const moveSpeed = this.player.speed;
        let newX = this.player.x;
        let newY = this.player.y;
        
        // Movement
        if (this.keys['KeyW']) {
            newX += Math.cos(this.player.angle) * moveSpeed;
            newY += Math.sin(this.player.angle) * moveSpeed;
        }
        if (this.keys['KeyS']) {
            newX -= Math.cos(this.player.angle) * moveSpeed;
            newY -= Math.sin(this.player.angle) * moveSpeed;
        }
        if (this.keys['KeyA']) {
            newX += Math.cos(this.player.angle - Math.PI/2) * moveSpeed;
            newY += Math.sin(this.player.angle - Math.PI/2) * moveSpeed;
        }
        if (this.keys['KeyD']) {
            newX += Math.cos(this.player.angle + Math.PI/2) * moveSpeed;
            newY += Math.sin(this.player.angle + Math.PI/2) * moveSpeed;
        }
        
        // Collision detection
        if (!this.isWall(newX, this.player.y)) {
            this.player.x = newX;
        }
        if (!this.isWall(this.player.x, newY)) {
            this.player.y = newY;
        }
    }
    
    isWall(x, y) {
        const mapX = Math.floor(x / this.cellSize);
        const mapY = Math.floor(y / this.cellSize);
        
        if (mapX < 0 || mapX >= this.worldMap[0].length || 
            mapY < 0 || mapY >= this.worldMap.length) {
            return true;
        }
        
        return this.worldMap[mapY][mapX] === 1;
    }
    
    castRay(angle) {
        const step = 1;
        let distance = 0;
        
        while (distance < this.viewDistance) {
            const x = this.player.x + Math.cos(angle) * distance;
            const y = this.player.y + Math.sin(angle) * distance;
            
            if (this.isWall(x, y)) {
                return distance;
            }
            
            distance += step;
        }
        
        return this.viewDistance;
    }
    
    shoot() {
        if (this.ammo <= 0) return;
        
        this.ammo--;
        this.updateUI();
        
        // Muzzle flash effect
        this.showMuzzleFlash();
        
        // Check if we hit an enemy
        const range = 500;
        const accuracy = 0.1;
        
        for (let enemy of this.enemies) {
            if (!enemy.alive) continue;
            
            const dx = enemy.x - this.player.x;
            const dy = enemy.y - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angleToEnemy = Math.atan2(dy, dx);
            
            let angleDiff = Math.abs(angleToEnemy - this.player.angle);
            if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
            
            if (distance < range && angleDiff < accuracy) {
                enemy.health--;
                this.showHitMarker();
                
                if (enemy.health <= 0) {
                    enemy.alive = false;
                    this.score += 100;
                    this.updateUI();
                }
            }
        }
    }
    
    reload() {
        this.ammo = this.maxAmmo;
        this.updateUI();
    }
    
    showMuzzleFlash() {
        const flash = document.createElement('div');
        flash.className = 'muzzle-flash';
        document.body.appendChild(flash);
        
        setTimeout(() => {
            document.body.removeChild(flash);
        }, 100);
    }
    
    showHitMarker() {
        const marker = document.createElement('div');
        marker.className = 'hit-marker';
        marker.textContent = 'HIT!';
        marker.style.left = '50%';
        marker.style.top = '40%';
        marker.style.transform = 'translate(-50%, -50%)';
        document.body.appendChild(marker);
        
        setTimeout(() => {
            if (document.body.contains(marker)) {
                document.body.removeChild(marker);
            }
        }, 500);
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height / 2);
        
        this.ctx.fillStyle = '#654321';
        this.ctx.fillRect(0, this.canvas.height / 2, this.canvas.width, this.canvas.height / 2);
        
        // Render 3D view
        const numRays = this.canvas.width / 2;
        const angleStep = this.fov / numRays;
        
        for (let i = 0; i < numRays; i++) {
            const rayAngle = this.player.angle - this.fov / 2 + i * angleStep;
            const distance = this.castRay(rayAngle);
            
            // Calculate wall height
            const wallHeight = (this.cellSize * this.canvas.height) / distance;
            const wallTop = (this.canvas.height - wallHeight) / 2;
            
            // Wall color based on distance
            const brightness = Math.max(0.3, 1 - distance / this.viewDistance);
            const colorValue = Math.floor(100 * brightness);
            
            this.ctx.fillStyle = `rgb(${colorValue}, ${colorValue}, ${colorValue})`;
            this.ctx.fillRect(i * 2, wallTop, 2, wallHeight);
        }
        
        // Render enemies
        this.renderEnemies();
    }
    
    renderEnemies() {
        for (let enemy of this.enemies) {
            if (!enemy.alive) continue;
            
            const dx = enemy.x - this.player.x;
            const dy = enemy.y - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angleToEnemy = Math.atan2(dy, dx);
            
            let angleDiff = angleToEnemy - this.player.angle;
            if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
            
            // Check if enemy is in view
            if (Math.abs(angleDiff) < this.fov / 2) {
                const enemyScreenX = (angleDiff / this.fov + 0.5) * this.canvas.width;
                const enemySize = (this.cellSize * this.canvas.height) / distance;
                const enemyTop = (this.canvas.height - enemySize) / 2;
                
                // Simple enemy sprite (red rectangle)
                this.ctx.fillStyle = '#ff0000';
                this.ctx.fillRect(
                    enemyScreenX - enemySize / 4, 
                    enemyTop, 
                    enemySize / 2, 
                    enemySize
                );
            }
        }
    }
    
    updateUI() {
        document.getElementById('healthValue').textContent = this.health;
        document.getElementById('ammoValue').textContent = this.ammo;
        document.getElementById('scoreValue').textContent = this.score;
    }
    
    gameLoop() {
        this.handleInput();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game
window.addEventListener('load', () => {
    new FPSGame();
});
