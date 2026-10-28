const SPECIAL_COOLDOWN = 12; // 쿨다운 12초
const SPECIAL_DAMAGE_MULTIPLIER = 5; // 기본 공격력의 5배
const SPECIAL_RANGE = 600; // 사거리 600px
const SPECIAL_WIDTH = 300; // 파동 폭 300px
const SPECIAL_DURATION = 0.4; // 이펙트 지속 시간 0.4초

class SpecialWave {
  constructor(startX, startY, angle, damage) {
    this.startX = startX;
    this.startY = startY;
    this.angle = angle;
    this.damage = damage;
    this.range = SPECIAL_RANGE;
    this.width = SPECIAL_WIDTH;
    this.duration = SPECIAL_DURATION;
    this.timer = 0;
    this.isFinished = false;
    this.hitEnemies = new Set();
  }

  update(dt, enemies) {
    this.timer += dt;
    if (this.timer >= this.duration) {
      this.isFinished = true;
    }
    this.checkHits(enemies);
  }

  checkHits(enemies) {
    if (!enemies) return;

    const cos = Math.cos(this.angle);
    const sin = Math.sin(this.angle);

    const progress = Math.min(1, this.timer / (this.duration * 0.6));
    const currentReach = this.range * Math.max(0.2, progress);

    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      if (this.hitEnemies.has(enemy)) continue;

      const dx = enemy.x - this.startX;
      const dy = enemy.y - this.startY;

      const forward = dx * cos + dy * sin;
      const lateral = Math.abs(-dx * sin + dy * cos);

      if (
        forward >= 0 &&
        forward <= currentReach + enemy.radius &&
        lateral <= this.width / 2 + enemy.radius
      ) {
        enemy.takeDamage(this.damage);
        this.hitEnemies.add(enemy);
      }
    }
  }

  draw(ctx, cameraX, cameraY) {
    const progress = Math.min(1, this.timer / this.duration);
    const alpha = Math.max(0, 1 - progress);

    const sx = this.startX - cameraX;
    const sy = this.startY - cameraY;
    const currentLength = this.range * Math.min(1, progress * 1.8);

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(this.angle);

    // 반투명 하늘색~흰색 참격 파동
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(currentLength, -this.width / 2);
    ctx.quadraticCurveTo(currentLength + 60, 0, currentLength, this.width / 2);
    ctx.closePath();

    ctx.fillStyle = `rgba(135, 206, 250, ${0.35 * alpha})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.85 * alpha})`;
    ctx.lineWidth = 4 * alpha + 1;
    ctx.stroke();

    // 중앙 코어 라인
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(currentLength + 30, 0);
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = 5 * alpha;
    ctx.stroke();

    // 진행 방향 앞쪽에 ⚡ 이모티콘 표시
    const emojiX = currentLength * 0.85;
    const fontSize = Math.round(36 * alpha + 10);
    ctx.font = `${fontSize}px 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = alpha;
    ctx.fillText('⚡', emojiX, 0);

    ctx.restore();
  }
}

class SpecialManager {
  constructor() {
    this.cooldown = SPECIAL_COOLDOWN;
    this.timer = 0;
    this.activeWaves = [];
  }

  reset() {
    this.timer = 0;
    this.activeWaves = [];
  }

  canActivate() {
    return this.timer <= 0;
  }

  trigger(player, aimAngle, baseDamage, enemies) {
    if (!this.canActivate()) return false;

    this.timer = this.cooldown;
    const wave = new SpecialWave(
      player.x,
      player.y,
      aimAngle,
      baseDamage * SPECIAL_DAMAGE_MULTIPLIER
    );
    this.activeWaves.push(wave);
    wave.checkHits(enemies);
    return true;
  }

  update(dt, enemies) {
    if (this.timer > 0) {
      this.timer -= dt;
      if (this.timer < 0) this.timer = 0;
    }

    for (let i = 0; i < this.activeWaves.length; i++) {
      this.activeWaves[i].update(dt, enemies);
    }
    this.activeWaves = this.activeWaves.filter((w) => !w.isFinished);
  }

  draw(ctx, cameraX, cameraY) {
    for (let i = 0; i < this.activeWaves.length; i++) {
      this.activeWaves[i].draw(ctx, cameraX, cameraY);
    }
  }

  drawUI(ctx, canvasWidth, canvasHeight) {
    const barW = 160;
    const barH = 28;
    const x = (canvasWidth - barW) / 2;
    const y = canvasHeight - 55;

    ctx.save();
    if (this.timer <= 0) {
      ctx.fillStyle = 'rgba(22, 160, 133, 0.75)';
      ctx.fillRect(x, y, barW, barH);
      ctx.strokeStyle = '#1abc9c';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, barW, barH);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚡ 특수 공격 [SPACE]', x + barW / 2, y + barH / 2);
    } else {
      const ratio = 1 - this.timer / this.cooldown;
      ctx.fillStyle = 'rgba(44, 62, 80, 0.7)';
      ctx.fillRect(x, y, barW, barH);

      ctx.fillStyle = 'rgba(52, 152, 219, 0.5)';
      ctx.fillRect(x, y, barW * ratio, barH);

      ctx.strokeStyle = '#7f8c8d';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, barW, barH);

      ctx.fillStyle = '#bdc3c7';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`⚡ ${this.timer.toFixed(1)}s`, x + barW / 2, y + barH / 2);
    }
    ctx.restore();
  }
}

