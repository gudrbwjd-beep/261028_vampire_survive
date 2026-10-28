const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const keys = {};
window.addEventListener('keydown', (e) => {
  if (gameState === 'START') {
    if (e.code === 'Space' || e.code === 'Enter') {
      startGame();
    }
    return;
  }

  if (gameState === 'GAMEOVER') {
    if (e.code === 'KeyR' || e.code === 'Space' || e.code === 'Enter') {
      startGame();
    }
    return;
  }

  if (gameState === 'PLAYING' && e.code === 'Space') {
    if (!e.repeat && !isPaused) {
      specialManager.trigger(player, currentAimAngle, weaponManager.damage, enemyManager.enemies);
    }
    return;
  }

  keys[e.code] = true;
  if (uiManager.isActive) {
    uiManager.handleKeyDown(e.code);
  }
});
window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});
let mousePos = null;
let lastMoveDirection = { x: 1, y: 0 };

window.addEventListener('mousemove', (e) => {
  mousePos = { x: e.clientX, y: e.clientY };
});
window.addEventListener('touchmove', (e) => {
  if (e.touches && e.touches.length > 0) {
    mousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
}, { passive: true });
window.addEventListener('touchstart', (e) => {
  if (e.touches && e.touches.length > 0) {
    mousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
}, { passive: true });

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  if (gameState === 'START') {
    if (uiManager.checkStartClick(mouseX, mouseY)) {
      startGame();
    }
    return;
  }

  if (gameState === 'GAMEOVER') {
    if (uiManager.checkRestartClick(mouseX, mouseY)) {
      startGame();
    }
    return;
  }

  if (uiManager.isActive) {
    uiManager.handleClick(mouseX, mouseY);
  }
});

let gameState = 'START';
let bestTime = parseFloat(localStorage.getItem('vs_best_time')) || 0;
let gameOverStats = null;

let player = new Player(0, 0);
let enemyManager = new EnemyManager();
let weaponManager = new WeaponManager();
const specialManager = new SpecialManager();
const uiManager = new UIManager();
const GRID_SIZE = 64;

let isPaused = false;
let gameTime = 0;
let currentAimAngle = 0;

function startGame() {
  player = new Player(0, 0);
  enemyManager = new EnemyManager();
  weaponManager = new WeaponManager();
  specialManager.reset();
  gameTime = 0;
  isPaused = false;
  lastMoveDirection = { x: 1, y: 0 };
  currentAimAngle = 0;
  gameState = 'PLAYING';
}

function showLevelUp() {
  isPaused = true;
  uiManager.showLevelUp(player, weaponManager, (upgrade) => {
    upgrade.apply(player, weaponManager);
    isPaused = false;
  });
}

let lastTime = performance.now();

function drawGrid(screenCenterX, screenCenterY) {
  ctx.strokeStyle = '#222831';
  ctx.lineWidth = 1;

  const startX = -((player.x - screenCenterX) % GRID_SIZE);
  const startY = -((player.y - screenCenterY) % GRID_SIZE);

  ctx.beginPath();
  for (let x = startX - GRID_SIZE; x < canvas.width + GRID_SIZE; x += GRID_SIZE) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
  }
  for (let y = startY - GRID_SIZE; y < canvas.height + GRID_SIZE; y += GRID_SIZE) {
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
  }
  ctx.stroke();
}

function drawExpBar() {
  const barHeight = 16;
  const expRatio = Math.min(1, Math.max(0, player.exp / player.nextExp));

  ctx.fillStyle = '#222831';
  ctx.fillRect(0, 0, canvas.width, barHeight);

  ctx.fillStyle = '#2ecc71';
  ctx.fillRect(0, 0, canvas.width * expRatio, barHeight);

  ctx.strokeStyle = '#27ae60';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, canvas.width, barHeight);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`Lv. ${player.level} (${Math.floor(player.exp)} / ${player.nextExp})`, canvas.width / 2, barHeight / 2);
}

function drawHPBar() {
  const x = 20;
  const y = 26;
  const width = 200;
  const height = 18;
  const hpRatio = Math.max(0, player.hp / player.maxHp);

  ctx.fillStyle = '#333';
  ctx.fillRect(x, y, width, height);

  ctx.fillStyle = '#e74c3c';
  ctx.fillRect(x, y, width * hpRatio, height);

  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${Math.ceil(player.hp)} / ${player.maxHp}`, x + width / 2, y + height / 2);
}

function drawTimer() {
  const minutes = Math.floor(gameTime / 60);
  const seconds = Math.floor(gameTime % 60);
  const text = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(text, canvas.width / 2, 24);
}

function gameLoop(currentTime) {
  const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
  lastTime = currentTime;

  if (gameState === 'PLAYING') {
    if (!isPaused) {
      gameTime += dt;

      let moveDx = 0;
      let moveDy = 0;
      if (keys['KeyW'] || keys['ArrowUp']) moveDy -= 1;
      if (keys['KeyS'] || keys['ArrowDown']) moveDy += 1;
      if (keys['KeyA'] || keys['ArrowLeft']) moveDx -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) moveDx += 1;
      if (moveDx !== 0 || moveDy !== 0) {
        lastMoveDirection = { x: moveDx, y: moveDy };
      }

      let aimAngle = 0;
      if (mousePos) {
        const screenCenterX = canvas.width / 2;
        const screenCenterY = canvas.height / 2;
        const dx = mousePos.x - screenCenterX;
        const dy = mousePos.y - screenCenterY;
        if (dx !== 0 || dy !== 0) {
          aimAngle = Math.atan2(dy, dx);
        }
      } else if (lastMoveDirection.x !== 0 || lastMoveDirection.y !== 0) {
        aimAngle = Math.atan2(lastMoveDirection.y, lastMoveDirection.x);
      }

      player.update(dt, keys);
      enemyManager.update(dt, player, canvas.width, canvas.height);
      weaponManager.update(dt, player, enemyManager.enemies, aimAngle);
      currentAimAngle = aimAngle;
      specialManager.update(dt, enemyManager.enemies);

      if (player.hp <= 0) {
        gameState = 'GAMEOVER';
        const isNewBest = gameTime > bestTime;
        if (isNewBest) {
          bestTime = gameTime;
          localStorage.setItem('vs_best_time', bestTime.toString());
        }
        gameOverStats = {
          time: gameTime,
          kills: enemyManager.killCount,
          level: player.level,
          bestTime: bestTime,
          isNewBest: isNewBest
        };
      }
    }
  }

  ctx.fillStyle = '#161a1d';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const screenCenterX = canvas.width / 2;
  const screenCenterY = canvas.height / 2;
  const cameraX = player.x - screenCenterX;
  const cameraY = player.y - screenCenterY;

  drawGrid(screenCenterX, screenCenterY);

  if (gameState === 'START') {
    player.draw(ctx, screenCenterX, screenCenterY);
    uiManager.drawStartScreen(ctx, canvas.width, canvas.height, bestTime);
  } else if (gameState === 'PLAYING') {
    enemyManager.draw(ctx, cameraX, cameraY);
    weaponManager.draw(ctx, cameraX, cameraY);
    specialManager.draw(ctx, cameraX, cameraY);
    player.draw(ctx, screenCenterX, screenCenterY);
    drawHPBar();
    drawExpBar();
    drawTimer();
    uiManager.drawSpecialUI(ctx, canvas.width, canvas.height, specialManager);
    uiManager.draw(ctx, canvas.width, canvas.height);
  } else if (gameState === 'GAMEOVER') {
    enemyManager.draw(ctx, cameraX, cameraY);
    player.draw(ctx, screenCenterX, screenCenterY);
    uiManager.drawGameOverScreen(ctx, canvas.width, canvas.height, gameOverStats);
  }

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

