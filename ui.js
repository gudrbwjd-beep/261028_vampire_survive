function getUpgradePool(player, weaponManager) {
  const pool = [
    {
      id: 'atk_up',
      title: '공격력 증가',
      desc: '공격력 +20%',
      apply(p, wm) {
        wm.damage = Math.round(wm.damage * 1.2);
      }
    },
    {
      id: 'atk_speed',
      title: '공격속도 증가',
      desc: '공격속도 +15%',
      apply(p, wm) {
        wm.cooldown = Math.max(0.1, wm.cooldown / 1.15);
      }
    },
    {
      id: 'move_speed',
      title: '이동속도 증가',
      desc: '이동속도 +10%',
      apply(p, wm) {
        p.speed *= 1.1;
      }
    },
    {
      id: 'max_hp',
      title: '최대 체력 증가',
      desc: '최대HP +20',
      apply(p, wm) {
        p.maxHp += 20;
        p.hp = Math.min(p.maxHp, p.hp + 20);
      }
    },
    {
      id: 'projectile_count',
      title: '투사체 증가',
      desc: '투사체 개수 +1',
      apply(p, wm) {
        wm.projectileCount += 1;
      }
    },
    {
      id: 'magnet_range',
      title: '흡수 범위 증가',
      desc: '경험치 흡수 범위 +30%',
      apply(p, wm) {
        p.magnetRadius *= 1.3;
      }
    }
  ];

  if (weaponManager && weaponManager.orbWeapon) {
    const orbLv = weaponManager.orbWeapon.level;
    pool.push({
      id: 'weapon_orb',
      title: orbLv === 0 ? '[새 무기] 회전 오브' : `회전 오브 (Lv.${orbLv + 1})`,
      desc: orbLv === 0 ? '주위를 돌며 닿은 적에게 피해' : '오브 개수 +1 및 데미지 증가',
      apply(p, wm) {
        wm.orbWeapon.upgrade();
      }
    });
  }

  if (weaponManager && weaponManager.explosionWeapon) {
    const expLv = weaponManager.explosionWeapon.level;
    pool.push({
      id: 'weapon_explosion',
      title: expLv === 0 ? '[새 무기] 범위 폭발' : `범위 폭발 (Lv.${expLv + 1})`,
      desc: expLv === 0 ? '3초마다 주변에 강력한 폭발' : '폭발 범위 및 공격력 증가',
      apply(p, wm) {
        wm.explosionWeapon.upgrade();
      }
    });
  }

  return pool;
}

class UIManager {
  constructor() {
    this.isActive = false;
    this.currentCards = [];
    this.cardRects = [];
    this.onSelect = null;
    this.startButtonRect = null;
    this.restartButtonRect = null;
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  showLevelUp(player, weaponManager, onSelect) {
    this.isActive = true;
    this.onSelect = onSelect;

    const pool = getUpgradePool(player, weaponManager);
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    this.currentCards = shuffled.slice(0, 3);
  }

  select(index) {
    if (!this.isActive || !this.currentCards[index]) return;
    const chosen = this.currentCards[index];
    this.isActive = false;
    this.currentCards = [];
    if (this.onSelect) {
      this.onSelect(chosen);
    }
  }

  handleKeyDown(code) {
    if (!this.isActive) return;
    if (code === 'Digit1' || code === 'Numpad1') this.select(0);
    if (code === 'Digit2' || code === 'Numpad2') this.select(1);
    if (code === 'Digit3' || code === 'Numpad3') this.select(2);
  }

  handleClick(mouseX, mouseY) {
    if (!this.isActive) return;
    for (let i = 0; i < this.cardRects.length; i++) {
      const r = this.cardRects[i];
      if (
        mouseX >= r.x &&
        mouseX <= r.x + r.width &&
        mouseY >= r.y &&
        mouseY <= r.y + r.height
      ) {
        this.select(i);
        break;
      }
    }
  }

  draw(ctx, canvasWidth, canvasHeight) {
    if (!this.isActive) return;

    // 반투명 어두운 배경 오버레이
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 상단 타이틀
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LEVEL UP!', canvasWidth / 2, canvasHeight / 2 - 160);

    const cardWidth = 180;
    const cardHeight = 220;
    const gap = 24;
    const totalWidth = 3 * cardWidth + 2 * gap;
    const startX = (canvasWidth - totalWidth) / 2;
    const startY = canvasHeight / 2 - 100;

    this.cardRects = [];

    for (let i = 0; i < this.currentCards.length; i++) {
      const card = this.currentCards[i];
      const cx = startX + i * (cardWidth + gap);
      const cy = startY;

      this.cardRects.push({ x: cx, y: cy, width: cardWidth, height: cardHeight });

      // 카드 배경
      ctx.fillStyle = '#1e272e';
      ctx.fillRect(cx, cy, cardWidth, cardHeight);

      // 카드 테두리
      ctx.strokeStyle = '#f39c12';
      ctx.lineWidth = 2;
      ctx.strokeRect(cx, cy, cardWidth, cardHeight);

      // 단축키 번호 배지
      ctx.fillStyle = '#e67e22';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`[ ${i + 1} ]`, cx + cardWidth / 2, cy + 30);

      // 카드 제목
      ctx.fillStyle = '#ecf0f1';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(card.title, cx + cardWidth / 2, cy + 85);

      // 효과 설명
      ctx.fillStyle = '#2ecc71';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(card.desc, cx + cardWidth / 2, cy + 135);

      // 클릭 안내
      ctx.fillStyle = '#7f8c8d';
      ctx.font = '12px sans-serif';
      ctx.fillText(`클릭 또는 숫자 ${i + 1}`, cx + cardWidth / 2, cy + 185);
    }
  }

  drawStartScreen(ctx, canvasWidth, canvasHeight, bestTime = 0) {
    ctx.fillStyle = 'rgba(15, 20, 25, 0.9)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const cx = canvasWidth / 2;
    const cy = canvasHeight / 2;

    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 38px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VAMPIRE SURVIVORS', cx, cy - 100);

    ctx.fillStyle = '#bdc3c7';
    ctx.font = '16px sans-serif';
    ctx.fillText('WASD / 방향키 이동 | 1/2/3 키 레벨업 선택', cx, cy - 50);

    ctx.fillStyle = '#e67e22';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(`🏆 최고 생존 기록: ${this.formatTime(bestTime)}`, cx, cy);

    const btnW = 200;
    const btnH = 50;
    const btnX = cx - btnW / 2;
    const btnY = cy + 50;
    this.startButtonRect = { x: btnX, y: btnY, width: btnW, height: btnH };

    ctx.fillStyle = '#27ae60';
    ctx.fillRect(btnX, btnY, btnW, btnH);
    ctx.strokeStyle = '#2ecc71';
    ctx.lineWidth = 2;
    ctx.strokeRect(btnX, btnY, btnW, btnH);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('게임 시작', cx, btnY + btnH / 2);

    ctx.fillStyle = '#7f8c8d';
    ctx.font = '13px sans-serif';
    ctx.fillText('버튼 클릭 또는 Space / Enter 키', cx, btnY + btnH + 25);
  }

  drawGameOverScreen(ctx, canvasWidth, canvasHeight, stats) {
    ctx.fillStyle = 'rgba(20, 10, 10, 0.88)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const cx = canvasWidth / 2;
    const cy = canvasHeight / 2;

    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 42px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME OVER', cx, cy - 130);

    const panelW = 320;
    const panelH = 150;
    const panelX = cx - panelW / 2;
    const panelY = cy - 85;

    ctx.fillStyle = '#1e272e';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    ctx.fillStyle = '#ecf0f1';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`⏱ 생존 시간: ${this.formatTime(stats.time)}`, panelX + 30, panelY + 35);
    ctx.fillText(`💀 처치 수: ${stats.kills} 마리`, panelX + 30, panelY + 70);
    ctx.fillText(`⭐ 도달 레벨: Lv. ${stats.level}`, panelX + 30, panelY + 105);

    ctx.textAlign = 'center';
    ctx.fillStyle = stats.isNewBest ? '#f1c40f' : '#bdc3c7';
    ctx.font = 'bold 15px sans-serif';
    const bestPrefix = stats.isNewBest ? '🎉 최고 기록 갱신! ' : '🏆 최고 기록: ';
    ctx.fillText(`${bestPrefix}${this.formatTime(stats.bestTime)}`, cx, cy + 90);

    const btnW = 200;
    const btnH = 46;
    const btnX = cx - btnW / 2;
    const btnY = cy + 120;
    this.restartButtonRect = { x: btnX, y: btnY, width: btnW, height: btnH };

    ctx.fillStyle = '#c0392b';
    ctx.fillRect(btnX, btnY, btnW, btnH);
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    ctx.strokeRect(btnX, btnY, btnW, btnH);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('다시 시작', cx, btnY + btnH / 2);

    ctx.fillStyle = '#95a5a6';
    ctx.font = '13px sans-serif';
    ctx.fillText('버튼 클릭 또는 R 키', cx, btnY + btnH + 22);
  }

  checkStartClick(x, y) {
    if (!this.startButtonRect) return false;
    const r = this.startButtonRect;
    return x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height;
  }

  checkRestartClick(x, y) {
    if (!this.restartButtonRect) return false;
    const r = this.restartButtonRect;
    return x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height;
  }

  drawSpecialUI(ctx, canvasWidth, canvasHeight, specialManager) {
    if (specialManager) {
      specialManager.drawUI(ctx, canvasWidth, canvasHeight);
    }
  }
}

