class Player {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
    this.radius = 16;
    this.speed = 220;
    this.color = '#3498db';
    this.maxHp = 100;
    this.hp = 100;
    this.invulnerableTimer = 0;
    this.level = 1;
    this.exp = 0;
    this.nextExp = 30;
    this.magnetRadius = 120;
  }

  update(dt, keys) {
    let dx = 0;
    let dy = 0;

    if (keys['KeyW'] || keys['ArrowUp']) dy -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) dy += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) dx += 1;

    if (dx !== 0 && dy !== 0) {
      const invLen = 1 / Math.SQRT2;
      dx *= invLen;
      dy *= invLen;
    }

    this.x += dx * this.speed * dt;
    this.y += dy * this.speed * dt;

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }
  }

  takeDamage(amount) {
    if (this.invulnerableTimer <= 0) {
      this.hp = Math.max(0, this.hp - amount);
      this.invulnerableTimer = 0.5;
    }
  }

  gainExp(amount) {
    this.exp += amount;
    if (this.exp >= this.nextExp) {
      this.exp -= this.nextExp;
      this.level += 1;
      this.nextExp = Math.floor(this.nextExp * 1.5);
      if (typeof showLevelUp === 'function') {
        showLevelUp();
      }
    }
  }

  draw(ctx, screenX, screenY) {
    ctx.save();
    if (this.invulnerableTimer > 0) {
      ctx.globalAlpha = Math.floor(this.invulnerableTimer * 20) % 2 === 0 ? 0.4 : 0.8;
    }
    const fontSize = Math.round(this.radius * 2);
    ctx.font = `${fontSize}px 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🥷', screenX, screenY);
    ctx.restore();
  }
}
