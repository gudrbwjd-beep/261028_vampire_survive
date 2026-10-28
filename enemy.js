const SPAWN_RATIOS = {
  STAGE_1: { normal: 0.9, fast: 0.1, tank: 0.0 }, // 게임 시작 ~ 1분
  STAGE_2: { normal: 0.7, fast: 0.2, tank: 0.1 }, // 1분 ~ 3분
  STAGE_3: { normal: 0.5, fast: 0.3, tank: 0.2 }  // 3분 이후
};

class Enemy {
  constructor(x, y, type = 'normal', hpMultiplier = 1) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.isBoss = type === 'boss';

    if (type === 'fast') {
      this.radius = 8;
      this.speed = 170;
      this.color = '#e67e22';
      this.stroke = '#d35400';
      this.damage = 6;
      this.hp = Math.round(12 * hpMultiplier);
      this.expValue = 12;
    } else if (type === 'tank') {
      this.radius = 22;
      this.speed = 55;
      this.color = '#576574';
      this.stroke = '#222f3e';
      this.damage = 20;
      this.hp = Math.round(80 * hpMultiplier);
      this.expValue = 35;
    } else if (type === 'boss') {
      this.radius = 34;
      this.speed = 75;
      this.color = '#8e44ad';
      this.stroke = '#5b2c6f';
      this.damage = 30;
      this.hp = Math.round(400 * hpMultiplier);
      this.expValue = 250;
    } else {
      this.radius = 13;
      this.speed = 95;
      this.color = '#e74c3c';
      this.stroke = '#c0392b';
      this.damage = 10;
      this.hp = Math.round(20 * hpMultiplier);
      this.expValue = 10;
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
  }

  update(dt, target) {
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 0) {
      this.x += (dx / dist) * this.speed * dt;
      this.y += (dy / dist) * this.speed * dt;
    }
  }

  draw(ctx, cameraX, cameraY) {
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;
    const margin = this.radius * 2;

    if (
      screenX < -margin ||
      screenX > ctx.canvas.width + margin ||
      screenY < -margin ||
      screenY > ctx.canvas.height + margin
    ) {
      return;
    }

    const fontSize = Math.round(this.radius * 2);
    ctx.font = `${fontSize}px 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let emoji = '🦇';
    if (this.type === 'fast') emoji = '👻';
    else if (this.type === 'tank') emoji = '🧟';
    else if (this.type === 'boss') emoji = '👹';

    ctx.fillText(emoji, screenX, screenY);

    if (this.isBoss) {
      ctx.fillStyle = '#f1c40f';
      ctx.font = "bold 12px 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif";
      ctx.fillText('BOSS', screenX, screenY - this.radius - 4);
    }
  }
}

class Gem {
  constructor(x, y, value = 10, size = 6, color = '#2ecc71', stroke = '#27ae60') {
    this.x = x;
    this.y = y;
    this.value = value;
    this.radius = size;
    this.size = size;
    this.color = color;
    this.stroke = stroke;
    this.magnetRadius = 120;
    this.speed = 360;
    this.collected = false;
  }

  update(dt, player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    const magnetDist = player.magnetRadius || this.magnetRadius;

    if (dist < magnetDist) {
      if (dist > 0) {
        this.x += (dx / dist) * this.speed * dt;
        this.y += (dy / dist) * this.speed * dt;
      }
      if (dist < player.radius + this.radius) {
        this.collected = true;
        player.gainExp(this.value);
      }
    }
  }

  draw(ctx, cameraX, cameraY) {
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;
    const size = this.size;

    ctx.beginPath();
    ctx.moveTo(screenX, screenY - size);
    ctx.lineTo(screenX + size, screenY);
    ctx.lineTo(screenX, screenY + size);
    ctx.lineTo(screenX - size, screenY);
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.strokeStyle = this.stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

class EnemyManager {
  constructor() {
    this.enemies = [];
    this.gems = [];
    this.maxEnemies = 200;
    this.spawnTimer = 0;
    this.spawnInterval = 0.45;
    this.gameTime = 0;
    this.nextBossTime = 60;
    this.killCount = 0;
  }

  spawn(player, canvasWidth, canvasHeight) {
    if (this.enemies.length >= this.maxEnemies) return;

    const angle = Math.random() * Math.PI * 2;
    const spawnDist = Math.max(canvasWidth, canvasHeight) / 2 + 60;
    const x = player.x + Math.cos(angle) * spawnDist;
    const y = player.y + Math.sin(angle) * spawnDist;

    const hpMultiplier = 1 + this.gameTime / 45;

    let ratio = SPAWN_RATIOS.STAGE_1;
    if (this.gameTime >= 180) {
      ratio = SPAWN_RATIOS.STAGE_3;
    } else if (this.gameTime >= 60) {
      ratio = SPAWN_RATIOS.STAGE_2;
    }

    const roll = Math.random();
    let type = 'normal';
    if (roll < ratio.fast) {
      type = 'fast';
    } else if (roll < ratio.fast + ratio.tank) {
      type = 'tank';
    }

    this.enemies.push(new Enemy(x, y, type, hpMultiplier));
  }

  spawnBoss(player, canvasWidth, canvasHeight) {
    const angle = Math.random() * Math.PI * 2;
    const spawnDist = Math.max(canvasWidth, canvasHeight) / 2 + 80;
    const x = player.x + Math.cos(angle) * spawnDist;
    const y = player.y + Math.sin(angle) * spawnDist;

    const bossIndex = Math.floor(this.gameTime / 60);
    const hpMultiplier = 1 + Math.max(0, bossIndex - 1) * 0.8;

    this.enemies.push(new Enemy(x, y, 'boss', hpMultiplier));
  }

  update(dt, player, canvasWidth, canvasHeight) {
    this.gameTime += dt;

    if (this.gameTime >= this.nextBossTime) {
      this.spawnBoss(player, canvasWidth, canvasHeight);
      this.nextBossTime += 60;
    }

    this.spawnInterval = Math.max(0.1, 0.45 / (1 + this.gameTime / 60));

    this.spawnTimer += dt;
    while (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer -= this.spawnInterval;
      this.spawn(player, canvasWidth, canvasHeight);
    }

    for (let i = 0; i < this.enemies.length; i++) {
      this.enemies[i].update(dt, player);
    }

    // 밀어내기 처리 (간단한 원-원 충돌 분리)
    for (let i = 0; i < this.enemies.length; i++) {
      const e1 = this.enemies[i];
      for (let j = i + 1; j < this.enemies.length; j++) {
        const e2 = this.enemies[j];
        const dx = e2.x - e1.x;
        const dy = e2.y - e1.y;
        const dist = Math.hypot(dx, dy);
        const minDist = e1.radius + e2.radius;

        if (dist < minDist && dist > 0) {
          const overlap = (minDist - dist) * 0.5;
          const nx = dx / dist;
          const ny = dy / dist;
          e1.x -= nx * overlap;
          e1.y -= ny * overlap;
          e2.x += nx * overlap;
          e2.y += ny * overlap;
        }
      }
    }

    // 플레이어 충돌 및 피해 처리
    for (let i = 0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i];
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const dist = Math.hypot(dx, dy);

      if (dist < player.radius + enemy.radius) {
        player.takeDamage(enemy.damage);
      }
    }

    // 사망한 적 위치에 경험치 보석 드롭
    for (let i = 0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i];
      if (enemy.hp <= 0) {
        this.killCount++;
        if (enemy.isBoss) {
          for (let k = 0; k < 8; k++) {
            const angle = (k / 8) * Math.PI * 2;
            const dist = 30;
            this.gems.push(
              new Gem(
                enemy.x + Math.cos(angle) * dist,
                enemy.y + Math.sin(angle) * dist,
                25,
                7,
                '#f1c40f',
                '#f39c12'
              )
            );
          }
          this.gems.push(
            new Gem(enemy.x, enemy.y, 100, 11, '#9b59b6', '#8e44ad')
          );
        } else {
          this.gems.push(new Gem(enemy.x, enemy.y, enemy.expValue || 10));
        }
      }
    }
    this.enemies = this.enemies.filter((e) => e.hp > 0);

    // 보석 업데이트 및 수집 처리
    for (let i = 0; i < this.gems.length; i++) {
      this.gems[i].update(dt, player);
    }
    this.gems = this.gems.filter((g) => !g.collected);
  }

  draw(ctx, cameraX, cameraY) {
    for (let i = 0; i < this.gems.length; i++) {
      this.gems[i].draw(ctx, cameraX, cameraY);
    }
    for (let i = 0; i < this.enemies.length; i++) {
      this.enemies[i].draw(ctx, cameraX, cameraY);
    }
  }
}

