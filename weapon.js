const DEFAULT_ATTACK_COOLDOWN = 0.72; // 약 15% 추가 단축 (0.85s -> 0.72s)

class Projectile {
  constructor(x, y, vx, vy, damage = 20) {
    this.x = x;
    this.y = y;
    this.radius = 5;
    this.damage = damage;
    this.color = '#f1c40f';
    this.toRemove = false;
    this.vx = vx;
    this.vy = vy;
    this.lifeTime = 3;
  }

  update(dt, enemies) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.lifeTime -= dt;

    if (this.lifeTime <= 0) {
      this.toRemove = true;
      return;
    }

    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      const dist = Math.hypot(this.x - enemy.x, this.y - enemy.y);
      if (dist < this.radius + enemy.radius) {
        enemy.takeDamage(this.damage);
        this.toRemove = true;
        break;
      }
    }
  }

  draw(ctx, cameraX, cameraY) {
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;

    ctx.beginPath();
    ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

class OrbitingOrbWeapon {
  constructor() {
    this.level = 0;
    this.angle = 0;
    this.orbitRadius = 75;
    this.speed = 3.0;
    this.damage = 15;
    this.orbRadius = 8;
    this.color = '#9b59b6';
    this.hitCooldowns = new Map();
  }

  upgrade() {
    this.level++;
    this.damage = 15 + (this.level - 1) * 6;
  }

  update(dt, player, enemies) {
    if (this.level <= 0) return;

    this.angle += this.speed * dt;
    const count = this.level;

    for (const [enemy, timer] of this.hitCooldowns.entries()) {
      if (timer <= dt) {
        this.hitCooldowns.delete(enemy);
      } else {
        this.hitCooldowns.set(enemy, timer - dt);
      }
    }

    for (let i = 0; i < count; i++) {
      const orbAngle = this.angle + (i * 2 * Math.PI) / count;
      const ox = player.x + Math.cos(orbAngle) * this.orbitRadius;
      const oy = player.y + Math.sin(orbAngle) * this.orbitRadius;

      for (let j = 0; j < enemies.length; j++) {
        const enemy = enemies[j];
        const dist = Math.hypot(ox - enemy.x, oy - enemy.y);
        if (dist < this.orbRadius + enemy.radius) {
          if (!this.hitCooldowns.has(enemy)) {
            enemy.takeDamage(this.damage);
            this.hitCooldowns.set(enemy, 0.35);
          }
        }
      }
    }
  }

  draw(ctx, cameraX, cameraY, player) {
    if (this.level <= 0 || !player) return;
    const count = this.level;
    const fontSize = Math.round(this.orbRadius * 2.4);

    ctx.font = `${fontSize}px 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < count; i++) {
      const orbAngle = this.angle + (i * 2 * Math.PI) / count;
      const ox = player.x + Math.cos(orbAngle) * this.orbitRadius;
      const oy = player.y + Math.sin(orbAngle) * this.orbitRadius;
      const sx = ox - cameraX;
      const sy = oy - cameraY;

      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(orbAngle + Math.PI / 4);
      ctx.fillText('🗡️', 0, 0);
      ctx.restore();
    }
  }
}

class AreaExplosionWeapon {
  constructor() {
    this.level = 0;
    this.cooldown = 3.0;
    this.timer = 0;
    this.effectTimer = 0;
    this.effectDuration = 0.3;
    this.lastExplosionX = 0;
    this.lastExplosionY = 0;
  }

  get radius() {
    return 100 + (this.level - 1) * 25;
  }

  get damage() {
    return 30 + (this.level - 1) * 15;
  }

  upgrade() {
    this.level++;
  }

  update(dt, player, enemies) {
    if (this.level <= 0) return;

    if (this.effectTimer > 0) {
      this.effectTimer -= dt;
    }

    this.timer += dt;
    if (this.timer >= this.cooldown) {
      this.timer -= this.cooldown;
      this.explode(player, enemies);
    }
  }

  explode(player, enemies) {
    this.effectTimer = this.effectDuration;
    this.lastExplosionX = player.x;
    this.lastExplosionY = player.y;

    const r = this.radius;
    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
      if (dist <= r + enemy.radius) {
        enemy.takeDamage(this.damage);
      }
    }
  }

  draw(ctx, cameraX, cameraY) {
    if (this.effectTimer <= 0) return;

    const progress = 1 - this.effectTimer / this.effectDuration;
    const currentRadius = this.radius * progress;
    const sx = this.lastExplosionX - cameraX;
    const sy = this.lastExplosionY - cameraY;
    const alpha = Math.max(0, 1 - progress);

    ctx.save();

    // 반투명 주황색 원 (0.3초 동안 커지면서 투명해짐)
    ctx.beginPath();
    ctx.arc(sx, sy, currentRadius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(230, 126, 34, ${0.45 * alpha})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(243, 156, 18, ${0.8 * alpha})`;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 원 중앙에 💥 이모티콘 (크기가 커졌다가 투명해지며 사라짐)
    const emojiSize = Math.max(1, Math.round(this.radius * 0.9 * progress));
    ctx.globalAlpha = alpha;
    ctx.font = `${emojiSize}px 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💥', sx, sy);

    ctx.restore();
  }
}

class WeaponManager {
  constructor() {
    this.projectiles = [];
    this.cooldown = DEFAULT_ATTACK_COOLDOWN;
    this.timer = 0;
    this.projectileCount = 1;
    this.damage = 20;
    this.speed = 450;
    this.orbWeapon = new OrbitingOrbWeapon();
    this.explosionWeapon = new AreaExplosionWeapon();
    this.player = null;
  }

  update(dt, player, enemies, aimAngle = 0) {
    this.player = player;
    this.timer += dt;
    if (this.timer >= this.cooldown) {
      this.timer -= this.cooldown;
      this.fire(player, aimAngle);
    }

    for (let i = 0; i < this.projectiles.length; i++) {
      this.projectiles[i].update(dt, enemies);
    }

    this.projectiles = this.projectiles.filter((p) => !p.toRemove);
    this.orbWeapon.update(dt, player, enemies);
    this.explosionWeapon.update(dt, player, enemies);
  }

  fire(player, aimAngle = 0) {
    const count = this.projectileCount;

    if (count === 1) {
      const vx = Math.cos(aimAngle) * this.speed;
      const vy = Math.sin(aimAngle) * this.speed;
      this.projectiles.push(new Projectile(player.x, player.y, vx, vy, this.damage));
    } else {
      const spread = 0.16;
      const startAngle = aimAngle - ((count - 1) * spread) / 2;
      for (let i = 0; i < count; i++) {
        const angle = startAngle + i * spread;
        const vx = Math.cos(angle) * this.speed;
        const vy = Math.sin(angle) * this.speed;
        this.projectiles.push(new Projectile(player.x, player.y, vx, vy, this.damage));
      }
    }
  }

  draw(ctx, cameraX, cameraY) {
    this.explosionWeapon.draw(ctx, cameraX, cameraY);
    for (let i = 0; i < this.projectiles.length; i++) {
      this.projectiles[i].draw(ctx, cameraX, cameraY);
    }
    this.orbWeapon.draw(ctx, cameraX, cameraY, this.player);
  }
}

