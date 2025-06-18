// Tetris constants
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const COLORS = [
    '#FF595E', '#FFCA3A', '#8AC926', '#1982C4', '#6A4C93', '#FF9671', '#FFC75F'
];
const SHAPES = [
    [[1,1,1,1]], // I
    [[1,1],[1,1]], // O
    [[0,1,0],[1,1,1]], // T
    [[1,1,0],[0,1,1]], // S
    [[0,1,1],[1,1,0]], // Z
    [[1,0,0],[1,1,1]], // J
    [[0,0,1],[1,1,1]]  // L
];

const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');
let board = Array.from({length: ROWS}, () => Array(COLS).fill(0));
let current, currentX, currentY, currentColor;
let dropInterval = 500;
let dropTimer = null;
let isPaused = false;

function randomPiece() {
    const idx = Math.floor(Math.random() * SHAPES.length);
    return {
        shape: SHAPES[idx],
        color: COLORS[idx]
    };
}

function resetPiece() {
    const piece = randomPiece();
    current = piece.shape;
    currentColor = piece.color;
    currentX = Math.floor((COLS - current[0].length) / 2);
    currentY = 0;
    if (collides(current, currentX, currentY)) {
        board = Array.from({length: ROWS}, () => Array(COLS).fill(0));
    }
}

function drawBlock(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw board
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x]) drawBlock(x, y, board[y][x]);
        }
    }
    // Draw current piece
    for (let y = 0; y < current.length; y++) {
        for (let x = 0; x < current[y].length; x++) {
            if (current[y][x]) drawBlock(currentX + x, currentY + y, currentColor);
        }
    }
}

function collides(shape, x, y) {
    for (let i = 0; i < shape.length; i++) {
        for (let j = 0; j < shape[i].length; j++) {
            if (shape[i][j]) {
                let nx = x + j, ny = y + i;
                if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
                if (ny >= 0 && board[ny][nx]) return true;
            }
        }
    }
    return false;
}

function merge() {
    for (let y = 0; y < current.length; y++) {
        for (let x = 0; x < current[y].length; x++) {
            if (current[y][x]) {
                board[currentY + y][currentX + x] = currentColor;
            }
        }
    }
}

function rotate(shape) {
    return shape[0].map((_, i) => shape.map(row => row[i]).reverse());
}

function clearLines() {
    for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(cell => cell)) {
            explosionEffect(y);
            board.splice(y, 1);
            board.unshift(Array(COLS).fill(0));
            y++;
        }
    }
}

// Explosion effect
function explosionEffect(lineY) {
    const particles = [];
    const numParticles = 40;
    for (let i = 0; i < numParticles; i++) {
        particles.push({
            x: Math.random() * COLS * BLOCK_SIZE,
            y: lineY * BLOCK_SIZE + BLOCK_SIZE / 2,
            dx: (Math.random() - 0.5) * 6,
            dy: (Math.random() - 0.5) * 6,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            life: 30 + Math.random() * 20
        });
    }
    let frame = 0;
    function animate() {
        ctx.save();
        ctx.globalAlpha = 0.8;
        for (const p of particles) {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 6, 0, 2 * Math.PI);
            ctx.fill();
            p.x += p.dx;
            p.y += p.dy;
            p.dy += 0.2; // gravity
            p.life--;
        }
        ctx.restore();
        frame++;
        if (frame < 30) {
            requestAnimationFrame(animate);
        }
    }
    animate();
}

function drop() {
    if (!collides(current, currentX, currentY + 1)) {
        currentY++;
    } else {
        merge();
        clearLines();
        resetPiece();
    }
    draw();
}

function move(dir) {
    let nx = currentX + dir;
    if (!collides(current, nx, currentY)) {
        currentX = nx;
        draw();
    }
}

function moveDown() {
    if (!collides(current, currentX, currentY + 1)) {
        currentY++;
        draw();
    } else {
        drop();
    }
}

function rotatePiece() {
    let rotated = rotate(current);
    if (!collides(rotated, currentX, currentY)) {
        current = rotated;
        draw();
    }
}

function pauseGame() {
    if (!isPaused) {
        isPaused = true;
        if (dropTimer) clearInterval(dropTimer);
    }
}

function resumeGame() {
    if (isPaused) {
        isPaused = false;
        dropTimer = setInterval(drop, dropInterval);
    }
}

// Optionally, disable controls when paused
function controlsEnabled(enabled) {
    document.getElementById('left').disabled = !enabled;
    document.getElementById('right').disabled = !enabled;
    document.getElementById('down').disabled = !enabled;
    document.getElementById('rotate').disabled = !enabled;
}

// Update controls on pause/resume
function pauseGameWithControls() {
    pauseGame();
    controlsEnabled(false);
}
function resumeGameWithControls() {
    resumeGame();
    controlsEnabled(true);
}
document.getElementById('pause').onclick = pauseGameWithControls;
document.getElementById('resume').onclick = resumeGameWithControls;

// Optionally, block keyboard controls when paused
function handleKey(e) {
    if (isPaused) return;
    switch (e.key) {
        case 'ArrowLeft': move(-1); break;
        case 'ArrowRight': move(1); break;
        case 'ArrowDown': moveDown(); break;
        case 'ArrowUp': rotatePiece(); break;
        case ' ': drop(); break;
    }
}

document.addEventListener('keydown', handleKey);

document.getElementById('left').addEventListener('click', () => move(-1));
document.getElementById('right').addEventListener('click', () => move(1));
document.getElementById('down').addEventListener('click', moveDown);
document.getElementById('rotate').addEventListener('click', rotatePiece);
document.getElementById('pause').addEventListener('click', pauseGame);
document.getElementById('resume').addEventListener('click', resumeGame);
document.getElementById('reset').addEventListener('click', function() {
    board = Array.from({length: ROWS}, () => Array(COLS).fill(0));
    resetPiece();
    draw();
    if (dropTimer) clearInterval(dropTimer);
    dropTimer = setInterval(drop, dropInterval);
    isPaused = false;
    controlsEnabled(true);
});

document.getElementById('start').addEventListener('click', function() {
    board = Array.from({length: ROWS}, () => Array(COLS).fill(0));
    resetPiece();
    draw();
    if (dropTimer) clearInterval(dropTimer);
    dropTimer = setInterval(drop, dropInterval);
    isPaused = false;
    controlsEnabled(true);
});

function startGame() {
    resetPiece();
    draw();
    if (dropTimer) clearInterval(dropTimer);
    dropTimer = setInterval(drop, dropInterval);
}

startGame();

window.addEventListener('resize', () => {
    // Responsive canvas size
    let w = Math.min(window.innerWidth * 0.95, 300);
    let h = w * 2;
    canvas.width = w;
    canvas.height = h;
    draw();
});
