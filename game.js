// Spiel-Konfiguration
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const levelElement = document.getElementById('level');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayScore = document.getElementById('overlay-score');

// Spiel-Zustand
let score = 0;
let lives = 3;
let level = 1;
let gameActive = false;
let fruits = [];
let particles = [];
let animationId;
let spawnRate = 1500;
let lastSpawnTime = 0;
let baseFallSpeed = 2;
let maxFruits = 5;

const fruitsEmojis = ['🍎', '🍌', '🍊', '🍇', '🍓', '🍍', '🍉', '🍒', '🥝', '🍑'];
const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function resizeCanvas() {
    const container = document.getElementById('game-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function spawnFruit() {
    if (fruits.length >= maxFruits) return;
    const emoji = fruitsEmojis[random(0, fruitsEmojis.length - 1)];
    const letter = letters[random(0, letters.length - 1)];
    const x = random(50, canvas.width - 50);
    const y = -50;
    const speed = baseFallSpeed + (level * 0.5) + random(0, 2);
    fruits.push({
        id: Date.now() + Math.random(),
        emoji: emoji, letter: letter,
        x: x, y: y, speed: speed,
        radius: 30, cut: false,
        rotation: 0, rotationSpeed: random(-3, 3)
    });
}

function createParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x, y: y,
            vx: random(-5, 5), vy: random(-5, 5),
            life: 1.0, color: color, size: random(2, 6)
        });
    }
}

function showLetterFeedback(x, y, letter) {
    const feedback = document.createElement('div');
    feedback.className = 'letter-typed';
    feedback.textContent = letter;
    feedback.style.left = x + 'px';
    feedback.style.top = y + 'px';
    document.getElementById('game-container').appendChild(feedback);
    setTimeout(() => feedback.remove(), 500);
}

function update(currentTime) {
    if (!gameActive) return;
    if (currentTime - lastSpawnTime > spawnRate) {
        spawnFruit();
        lastSpawnTime = currentTime;
        spawnRate = Math.max(600, 1500 - (level * 100));
    }
    for (let i = fruits.length - 1; i >= 0; i--) {
        const fruit = fruits[i];
        if (fruit.cut) {
            fruit.y += 5; fruit.rotation += 0.3;
            fruit.opacity = (fruit.opacity || 1) - 0.05;
            if (fruit.opacity <= 0) { fruits.splice(i, 1); }
            continue;
        }
        fruit.y += fruit.speed;
        fruit.rotation += fruit.rotationSpeed;
        if (fruit.y - fruit.radius > canvas.height) {
            lives--;
            updateLivesDisplay();
            fruits.splice(i, 1);
            if (lives <= 0) { gameOver(); }
        }
    }
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.life -= 0.05;
        if (p.life <= 0) { particles.splice(i, 1); }
    }
    const newLevel = Math.floor(score / 10) + 1;
    if (newLevel > level) {
        level = newLevel;
        levelElement.textContent = level;
        baseFallSpeed += 0.5;
        maxFruits = Math.min(10, 5 + level);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    fruits.forEach(fruit => {
        ctx.save();
        ctx.translate(fruit.x, fruit.y);
        ctx.rotate((fruit.rotation * Math.PI) / 180);
        ctx.globalAlpha = fruit.opacity || 1;
        ctx.font = '48px Arial';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(fruit.emoji, 0, 0);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Arial';
        ctx.strokeStyle = 'black'; ctx.lineWidth = 3;
        ctx.strokeText(fruit.letter, 0, -10);
        ctx.fillText(fruit.letter, 0, -10);
        ctx.restore();
    });
    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill(); ctx.restore();
    });
    if (gameActive) { animationId = requestAnimationFrame(gameLoop); }
}

function gameLoop(currentTime) {
    update(currentTime);
    draw();
}

function updateScore() { scoreElement.textContent = score; }

function updateLivesDisplay() {
    const hearts = '❤️'.repeat(lives);
    const empty = '🖤'.repeat(3 - lives);
    livesElement.textContent = 'Leben: ' + hearts + empty;
}

function cutFruit(letter) {
    const fruit = fruits.find(f => !f.cut && f.letter === letter);
    if (fruit) {
        fruit.cut = true;
        fruit.opacity = 1;
        score += 10;
        updateScore();
        createParticles(fruit.x, fruit.y, '#4CAF50');
        showLetterFeedback(fruit.x, fruit.y, letter);
        fruit.y += 10;
    }
}

document.addEventListener('keydown', (e) => {
    if (!gameActive) return;
    const key = e.key.toUpperCase();
    if (letters.includes(key)) { cutFruit(key); }
});

function gameOver() {
    gameActive = false;
    cancelAnimationFrame(animationId);
    overlayTitle.textContent = 'Spiel vorbei!';
    overlayScore.textContent = 'Dein Score: ' + score;
    overlay.style.display = 'flex';
}

function resetGame() {
    score = 0; lives = 3; level = 1;
    fruits = []; particles = [];
    baseFallSpeed = 2; maxFruits = 5;
    spawnRate = 1500; lastSpawnTime = 0;
    scoreElement.textContent = score;
    levelElement.textContent = level;
    updateLivesDisplay();
    overlay.style.display = 'none';
    gameActive = true;
    cancelAnimationFrame(animationId);
    requestAnimationFrame(gameLoop);
}

document.addEventListener('DOMContentLoaded', () => {
    updateLivesDisplay();
    resetGame();
});