const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const timeElement = document.getElementById('time');
const bestScoreElement = document.getElementById('best-score');
const startButton = document.getElementById('start-button');
const messageElement = document.getElementById('message');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GAME_TIME = 30;
let score = 0;
let bestScore = Number(localStorage.getItem('target-shooter-best') || 0);
let timeLeft = GAME_TIME;
let animationId = null;
let lastTimestamp = 0;
let gameRunning = false;
let crosshair = { x: WIDTH / 2, y: HEIGHT / 2 };
let targets = [];

bestScoreElement.textContent = bestScore;

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function createTarget() {
  const radius = randomBetween(16, 30);
  const speed = randomBetween(1.2, 2.8);
  const angle = randomBetween(0, Math.PI * 2);
  const x = randomBetween(radius, WIDTH - radius);
  const y = randomBetween(radius, HEIGHT - radius);
  const dx = Math.cos(angle) * speed;
  const dy = Math.sin(angle) * speed;

  targets.push({ x, y, radius, dx, dy, color: `hsl(${Math.random() * 360}, 85%, 60%)` });
}

function spawnTargets(count) {
  for (let i = 0; i < count; i += 1) {
    createTarget();
  }
}

function resetGame() {
  score = 0;
  timeLeft = GAME_TIME;
  scoreElement.textContent = '0';
  timeElement.textContent = String(GAME_TIME);
  messageElement.hidden = true;
  targets = [];
  spawnTargets(6);
}

function beginGame() {
  if (animationId) cancelAnimationFrame(animationId);
  resetGame();
  gameRunning = true;
  lastTimestamp = 0;
  animationId = requestAnimationFrame(gameLoop);
}

function endGame() {
  gameRunning = false;
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('target-shooter-best', String(bestScore));
    bestScoreElement.textContent = String(bestScore);
  }
  messageElement.textContent = `Game Over! Score: ${score}`;
  messageElement.hidden = false;
}

function updateTargets(delta) {
  for (const target of targets) {
    target.x += target.dx * delta * 0.06;
    target.y += target.dy * delta * 0.06;

    if (target.x <= target.radius || target.x >= WIDTH - target.radius) {
      target.dx *= -1;
      target.x = Math.max(target.radius, Math.min(WIDTH - target.radius, target.x));
    }

    if (target.y <= target.radius || target.y >= HEIGHT - target.radius) {
      target.dy *= -1;
      target.y = Math.max(target.radius, Math.min(HEIGHT - target.radius, target.y));
    }
  }
}

function drawTarget(target) {
  ctx.beginPath();
  ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
  ctx.fillStyle = target.color;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(target.x, target.y, target.radius * 0.55, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(target.x, target.y, target.radius * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = target.color;
  ctx.fill();
}

function drawCrosshair() {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(crosshair.x, crosshair.y, 14, 0, Math.PI * 2);
  ctx.moveTo(crosshair.x - 18, crosshair.y);
  ctx.lineTo(crosshair.x + 18, crosshair.y);
  ctx.moveTo(crosshair.x, crosshair.y - 18);
  ctx.lineTo(crosshair.x, crosshair.y + 18);
  ctx.stroke();
  ctx.restore();
}

function drawBackground() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = '#10233f';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  for (let i = 0; i < 30; i += 1) {
    const starX = Math.random() * WIDTH;
    const starY = Math.random() * HEIGHT * 0.7;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(starX, starY, 2, 2);
  }
}

function render() {
  drawBackground();
  for (const target of targets) drawTarget(target);
  drawCrosshair();
}

function handleShot(event) {
  if (!gameRunning) return;

  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * WIDTH;
  const y = ((event.clientY - rect.top) / rect.height) * HEIGHT;

  for (let i = targets.length - 1; i >= 0; i -= 1) {
    const target = targets[i];
    const distance = Math.hypot(target.x - x, target.y - y);

    if (distance <= target.radius) {
      targets.splice(i, 1);
      score += 10;
      scoreElement.textContent = String(score);
      createTarget();
      return;
    }
  }
}

function gameLoop(timestamp) {
  if (!gameRunning) return;

  if (!lastTimestamp) lastTimestamp = timestamp;
  const delta = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  timeLeft -= delta / 1000;

  if (timeLeft <= 0) {
    timeLeft = 0;
    timeElement.textContent = '0';
    endGame();
    return;
  }

  timeElement.textContent = String(Math.ceil(timeLeft));
  updateTargets(delta);
  render();
  animationId = requestAnimationFrame(gameLoop);
}

canvas.addEventListener('mousemove', (event) => {
  const rect = canvas.getBoundingClientRect();
  crosshair.x = ((event.clientX - rect.left) / rect.width) * WIDTH;
  crosshair.y = ((event.clientY - rect.top) / rect.height) * HEIGHT;
});

canvas.addEventListener('click', handleShot);
startButton.addEventListener('click', beginGame);

resetGame();
render();
