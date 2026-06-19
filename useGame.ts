import { useRef, useCallback, useEffect } from 'react';
import type {
  Player, Bullet, Enemy, Particle, Star, PowerUp, GameState
} from '../types/game';

let idCounter = 0;
const uid = () => `e${++idCounter}`;

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number) {
  return Math.floor(rand(min, max + 1));
}

function rectsOverlap(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number
) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export interface GameSnapshot {
  score: number;
  highScore: number;
  lives: number;
  level: number;
  gameState: GameState;
  powerUps: { shield: boolean; rapid: boolean; triple: boolean };
  bossHp: number;
  bossMaxHp: number;
}

export function useGame(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const keysRef = useRef<Set<string>>(new Set());
  const stateRef = useRef<GameState>('menu');
  const scoreRef = useRef(0);
  const highScoreRef = useRef(0);
  const livesRef = useRef(3);
  const levelRef = useRef(1);
  const frameRef = useRef(0);
  const rafRef = useRef<number>(0);
  const snapshotRef = useRef<GameSnapshot>({
    score: 0, highScore: 0, lives: 3, level: 1,
    gameState: 'menu',
    powerUps: { shield: false, rapid: false, triple: false },
    bossHp: 0, bossMaxHp: 0
  });
  const onSnapshotRef = useRef<(s: GameSnapshot) => void>(() => {});

  const playerRef = useRef<Player>({
    id: 'player', x: 0, y: 0, width: 48, height: 48,
    speed: 5, lives: 3, active: true,
    invincible: false, invincibleTimer: 0, shootCooldown: 0
  });
  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<Star[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);

  const shieldActiveRef = useRef(false);
  const rapidActiveRef = useRef(false);
  const tripleActiveRef = useRef(false);
  const shieldTimerRef = useRef(0);
  const rapidTimerRef = useRef(0);
  const tripleTimerRef = useRef(0);

  const enemiesSpawnedRef = useRef(0);
  const enemiesForLevelRef = useRef(10);
  const levelUpTimerRef = useRef(0);
  const bossRef = useRef<Enemy | null>(null);

  const initStars = useCallback((W: number, H: number) => {
    starsRef.current = Array.from({ length: 120 }, () => ({
      x: rand(0, W), y: rand(0, H),
      size: rand(0.5, 2.5), speed: rand(0.5, 3),
      brightness: rand(0.3, 1)
    }));
  }, []);

  const spawnParticles = useCallback((x: number, y: number, color: string, count = 12, speed = 3) => {
    for (let i = 0; i < count; i++) {
      const angle = rand(0, Math.PI * 2);
      const sp = rand(1, speed);
      particlesRef.current.push({
        id: uid(), x, y, width: 4, height: 4, active: true,
        vx: Math.cos(angle) * sp, vy: Math.sin(angle) * sp,
        life: 1, maxLife: 1, color,
        size: rand(2, 6)
      });
    }
  }, []);

  const spawnEnemy = useCallback((W: number, level: number) => {
    const roll = Math.random();
    const isBoss = (enemiesSpawnedRef.current + 1) % 10 === 0;

    if (isBoss) {
      const boss: Enemy = {
        id: uid(), x: W / 2 - 40, y: -80,
        width: 80, height: 80, active: true,
        type: 'boss', hp: 20 + level * 10, maxHp: 20 + level * 10,
        speed: 1.5, vx: 1, vy: 0.4,
        shootCooldown: 0, shootInterval: 60,
        points: 500 + level * 100, animFrame: 0, animTimer: 0,
        color: '#ff00ff'
      };
      bossRef.current = boss;
      enemiesRef.current.push(boss);
    } else if (roll < 0.5) {
      enemiesRef.current.push({
        id: uid(), x: rand(20, W - 60), y: -50,
        width: 44, height: 44, active: true,
        type: 'basic', hp: 1, maxHp: 1,
        speed: 1 + level * 0.15, vx: rand(-0.5, 0.5), vy: 1 + level * 0.1,
        shootCooldown: 0, shootInterval: 120,
        points: 100, animFrame: 0, animTimer: 0,
        color: '#00e5ff'
      });
    } else if (roll < 0.75) {
      enemiesRef.current.push({
        id: uid(), x: rand(20, W - 60), y: -50,
        width: 40, height: 40, active: true,
        type: 'fast', hp: 1, maxHp: 1,
        speed: 2.5 + level * 0.2, vx: rand(-1, 1), vy: 2 + level * 0.15,
        shootCooldown: 0, shootInterval: 200,
        points: 150, animFrame: 0, animTimer: 0,
        color: '#ff9800'
      });
    } else {
      enemiesRef.current.push({
        id: uid(), x: rand(20, W - 70), y: -50,
        width: 52, height: 52, active: true,
        type: 'tough', hp: 3 + Math.floor(level / 2), maxHp: 3 + Math.floor(level / 2),
        speed: 0.8, vx: rand(-0.3, 0.3), vy: 0.8,
        shootCooldown: 0, shootInterval: 90,
        points: 250, animFrame: 0, animTimer: 0,
        color: '#76ff03'
      });
    }
    enemiesSpawnedRef.current++;
  }, []);

  const resetGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width, H = canvas.height;

    playerRef.current = {
      id: 'player', x: W / 2 - 24, y: H - 80,
      width: 48, height: 48, speed: 5, lives: 3,
      active: true, invincible: false, invincibleTimer: 0, shootCooldown: 0
    };
    bulletsRef.current = [];
    enemiesRef.current = [];
    particlesRef.current = [];
    powerUpsRef.current = [];
    bossRef.current = null;
    scoreRef.current = 0;
    livesRef.current = 3;
    levelRef.current = 1;
    frameRef.current = 0;
    enemiesSpawnedRef.current = 0;
    enemiesForLevelRef.current = 10;
    shieldActiveRef.current = false;
    rapidActiveRef.current = false;
    tripleActiveRef.current = false;
    shieldTimerRef.current = 0;
    rapidTimerRef.current = 0;
    tripleTimerRef.current = 0;
    initStars(W, H);
  }, [canvasRef, initStars]);

  const drawPlayer = useCallback((ctx: CanvasRenderingContext2D, p: Player) => {
    if (p.invincible && Math.floor(frameRef.current / 5) % 2 === 0) return;

    ctx.save();
    ctx.translate(p.x + p.width / 2, p.y + p.height / 2);

    // Engine glow
    const engineGlow = ctx.createRadialGradient(0, 20, 2, 0, 20, 18);
    engineGlow.addColorStop(0, 'rgba(0, 200, 255, 0.9)');
    engineGlow.addColorStop(1, 'rgba(0, 100, 255, 0)');
    ctx.fillStyle = engineGlow;
    ctx.beginPath();
    ctx.ellipse(0, 22, 10, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Thruster flame
    const flameOff = Math.sin(frameRef.current * 0.3) * 3;
    ctx.fillStyle = `hsl(${200 + flameOff * 10}, 100%, 70%)`;
    ctx.beginPath();
    ctx.moveTo(-8, 18);
    ctx.lineTo(0, 30 + flameOff);
    ctx.lineTo(8, 18);
    ctx.closePath();
    ctx.fill();

    // Body
    const bodyGrad = ctx.createLinearGradient(-24, -24, 24, 24);
    bodyGrad.addColorStop(0, '#4dd0e1');
    bodyGrad.addColorStop(0.5, '#0288d1');
    bodyGrad.addColorStop(1, '#01579b');
    ctx.fillStyle = bodyGrad;

    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.lineTo(20, 10);
    ctx.lineTo(14, 18);
    ctx.lineTo(-14, 18);
    ctx.lineTo(-20, 10);
    ctx.closePath();
    ctx.fill();

    // Wing left
    ctx.fillStyle = '#0277bd';
    ctx.beginPath();
    ctx.moveTo(-14, 4);
    ctx.lineTo(-24, 18);
    ctx.lineTo(-10, 18);
    ctx.closePath();
    ctx.fill();

    // Wing right
    ctx.beginPath();
    ctx.moveTo(14, 4);
    ctx.lineTo(24, 18);
    ctx.lineTo(10, 18);
    ctx.closePath();
    ctx.fill();

    // Cockpit
    const cockGrad = ctx.createRadialGradient(-4, -8, 1, 0, -6, 10);
    cockGrad.addColorStop(0, 'rgba(255,255,255,0.9)');
    cockGrad.addColorStop(1, 'rgba(0,200,255,0.3)');
    ctx.fillStyle = cockGrad;
    ctx.beginPath();
    ctx.ellipse(0, -6, 7, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shield
    if (shieldActiveRef.current) {
      ctx.strokeStyle = `rgba(0, 255, 255, ${0.5 + Math.sin(frameRef.current * 0.1) * 0.3})`;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00ffff';
      ctx.beginPath();
      ctx.arc(0, 0, 32, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }, []);

  const drawEnemy = useCallback((ctx: CanvasRenderingContext2D, e: Enemy) => {
    ctx.save();
    ctx.translate(e.x + e.width / 2, e.y + e.height / 2);

    const pulse = Math.sin(frameRef.current * 0.08) * 0.15 + 1;

    if (e.type === 'boss') {
      ctx.scale(pulse, pulse);
      // Body
      const bg = ctx.createRadialGradient(0, 0, 5, 0, 0, 38);
      bg.addColorStop(0, '#ff80ff');
      bg.addColorStop(0.5, '#cc00cc');
      bg.addColorStop(1, '#660066');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.moveTo(0, -38);
      ctx.lineTo(30, -15);
      ctx.lineTo(38, 10);
      ctx.lineTo(20, 38);
      ctx.lineTo(-20, 38);
      ctx.lineTo(-38, 10);
      ctx.lineTo(-30, -15);
      ctx.closePath();
      ctx.fill();

      // Cannons
      ctx.fillStyle = '#880088';
      [-22, 22].forEach(cx => {
        ctx.fillRect(cx - 5, 20, 10, 20);
      });

      // Eye
      const eyeGrad = ctx.createRadialGradient(-4, -10, 1, 0, -8, 14);
      eyeGrad.addColorStop(0, 'white');
      eyeGrad.addColorStop(0.4, '#ff00ff');
      eyeGrad.addColorStop(1, 'rgba(100,0,100,0)');
      ctx.fillStyle = eyeGrad;
      ctx.beginPath();
      ctx.ellipse(0, -8, 10, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // HP bar
      const barW = 70;
      const barH = 6;
      ctx.fillStyle = '#333';
      ctx.fillRect(-barW / 2, -50, barW, barH);
      ctx.fillStyle = `hsl(${(e.hp / e.maxHp) * 120}, 100%, 50%)`;
      ctx.fillRect(-barW / 2, -50, barW * (e.hp / e.maxHp), barH);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.strokeRect(-barW / 2, -50, barW, barH);
    } else if (e.type === 'tough') {
      ctx.scale(pulse * 0.95, pulse * 0.95);
      const tg = ctx.createRadialGradient(0, 0, 4, 0, 0, 24);
      tg.addColorStop(0, '#ccff66');
      tg.addColorStop(1, '#336600');
      ctx.fillStyle = tg;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
        const r = i % 2 === 0 ? 24 : 16;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#88ff00';
      ctx.lineWidth = 2;
      ctx.stroke();
      // HP dots
      for (let i = 0; i < e.maxHp; i++) {
        ctx.fillStyle = i < e.hp ? '#00ff00' : '#333';
        ctx.beginPath();
        ctx.arc(-((e.maxHp - 1) * 7) / 2 + i * 7, -30, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (e.type === 'fast') {
      ctx.scale(pulse, pulse);
      const fg = ctx.createLinearGradient(0, -20, 0, 20);
      fg.addColorStop(0, '#ffcc00');
      fg.addColorStop(1, '#ff5500');
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(18, 18);
      ctx.lineTo(0, 10);
      ctx.lineTo(-18, 18);
      ctx.closePath();
      ctx.fill();
    } else {
      // basic
      ctx.scale(pulse, pulse);
      const bg2 = ctx.createRadialGradient(0, 0, 4, 0, 0, 20);
      bg2.addColorStop(0, '#80ffff');
      bg2.addColorStop(1, '#006688');
      ctx.fillStyle = bg2;
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(18, 5);
      ctx.lineTo(10, 20);
      ctx.lineTo(-10, 20);
      ctx.lineTo(-18, 5);
      ctx.closePath();
      ctx.fill();
      // eye
      ctx.fillStyle = 'rgba(255,50,50,0.9)';
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }, []);

  const drawBullet = useCallback((ctx: CanvasRenderingContext2D, b: Bullet) => {
    ctx.save();
    if (b.isEnemy) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = b.color;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.ellipse(b.x + b.width / 2, b.y + b.height / 2, 5, 9, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.shadowBlur = 14;
      ctx.shadowColor = b.color;
      const grad = ctx.createLinearGradient(b.x + b.width / 2, b.y, b.x + b.width / 2, b.y + b.height);
      grad.addColorStop(0, 'white');
      grad.addColorStop(0.3, b.color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(b.x + b.width / 2, b.y + b.height / 2, 4, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  }, []);

  const drawParticle = useCallback((ctx: CanvasRenderingContext2D, p: Particle) => {
    const alpha = p.life / p.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowBlur = 8;
    ctx.shadowColor = p.color;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }, []);

  const drawStars = useCallback((ctx: CanvasRenderingContext2D) => {
    starsRef.current.forEach(s => {
      const twinkle = Math.sin(frameRef.current * 0.05 + s.x) * 0.2 + s.brightness;
      ctx.fillStyle = `rgba(255,255,255,${Math.max(0, Math.min(1, twinkle))})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }, []);

  const drawPowerUp = useCallback((ctx: CanvasRenderingContext2D, pu: PowerUp) => {
    ctx.save();
    ctx.translate(pu.x + pu.width / 2, pu.y + pu.height / 2);
    const rot = (frameRef.current * 0.05) % (Math.PI * 2);
    ctx.rotate(rot);

    const colors: Record<string, string> = {
      shield: '#00ffff', rapid: '#ffff00', triple: '#ff00ff', bomb: '#ff4400'
    };
    const icons: Record<string, string> = {
      shield: '🛡', rapid: '⚡', triple: '✦', bomb: '💣'
    };
    ctx.shadowBlur = 18;
    ctx.shadowColor = colors[pu.type];
    ctx.strokeStyle = colors[pu.type];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.rotate(-rot);
    ctx.font = '18px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icons[pu.type], 0, 0);
    ctx.restore();
  }, []);

  const drawHUD = useCallback((ctx: CanvasRenderingContext2D, W: number) => {
    // Score
    ctx.save();
    ctx.font = 'bold 22px "Courier New"';
    ctx.fillStyle = '#00e5ff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00e5ff';
    ctx.fillText(`SCORE: ${scoreRef.current}`, 14, 32);
    ctx.shadowBlur = 0;

    // Level
    ctx.fillStyle = '#ffeb3b';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#ffeb3b';
    ctx.fillText(`LVL: ${levelRef.current}`, W / 2 - 40, 32);
    ctx.shadowBlur = 0;

    // Lives
    ctx.font = '22px serif';
    for (let i = 0; i < livesRef.current; i++) {
      ctx.fillText('❤️', W - 40 - i * 30, 28);
    }

    // Power-up timers
    let py = 60;
    if (shieldActiveRef.current) {
      ctx.font = 'bold 14px "Courier New"';
      ctx.fillStyle = '#00ffff';
      ctx.fillText(`🛡 ${Math.ceil(shieldTimerRef.current / 60)}s`, 14, py);
      py += 24;
    }
    if (rapidActiveRef.current) {
      ctx.fillStyle = '#ffff00';
      ctx.fillText(`⚡ ${Math.ceil(rapidTimerRef.current / 60)}s`, 14, py);
      py += 24;
    }
    if (tripleActiveRef.current) {
      ctx.fillStyle = '#ff80ff';
      ctx.fillText(`✦ ${Math.ceil(tripleTimerRef.current / 60)}s`, 14, py);
    }

    ctx.restore();
  }, []);

  const update = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width, H = canvas.height;
    const p = playerRef.current;
    frameRef.current++;
    const f = frameRef.current;

    // Stars
    starsRef.current.forEach(s => {
      s.y += s.speed * 0.4;
      if (s.y > H) { s.y = 0; s.x = rand(0, W); }
    });

    if (stateRef.current === 'levelup') {
      levelUpTimerRef.current--;
      if (levelUpTimerRef.current <= 0) stateRef.current = 'playing';
      return;
    }

    if (stateRef.current !== 'playing') return;

    // Power-up timers
    if (shieldActiveRef.current) {
      shieldTimerRef.current--;
      if (shieldTimerRef.current <= 0) shieldActiveRef.current = false;
    }
    if (rapidActiveRef.current) {
      rapidTimerRef.current--;
      if (rapidTimerRef.current <= 0) rapidActiveRef.current = false;
    }
    if (tripleActiveRef.current) {
      tripleTimerRef.current--;
      if (tripleTimerRef.current <= 0) tripleActiveRef.current = false;
    }

    // Player movement
    const speed = p.speed * (rapidActiveRef.current ? 1.3 : 1);
    if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a') || keysRef.current.has('A')) {
      p.x = Math.max(0, p.x - speed);
    }
    if (keysRef.current.has('ArrowRight') || keysRef.current.has('d') || keysRef.current.has('D')) {
      p.x = Math.min(W - p.width, p.x + speed);
    }
    if (keysRef.current.has('ArrowUp') || keysRef.current.has('w') || keysRef.current.has('W')) {
      p.y = Math.max(H / 2, p.y - speed);
    }
    if (keysRef.current.has('ArrowDown') || keysRef.current.has('s') || keysRef.current.has('S')) {
      p.y = Math.min(H - p.height - 4, p.y + speed);
    }

    // Player shoot
    if (p.shootCooldown > 0) p.shootCooldown--;
    const shootInterval = rapidActiveRef.current ? 8 : 18;
    if ((keysRef.current.has(' ') || keysRef.current.has('z') || keysRef.current.has('Z')) && p.shootCooldown === 0) {
      p.shootCooldown = shootInterval;
      const bColor = tripleActiveRef.current ? '#ff80ff' : '#00e5ff';
      bulletsRef.current.push({
        id: uid(), x: p.x + p.width / 2 - 4, y: p.y - 10,
        width: 8, height: 20, active: true, vy: -14, isEnemy: false, color: bColor
      });
      if (tripleActiveRef.current) {
        bulletsRef.current.push({
          id: uid(), x: p.x + 4, y: p.y,
          width: 8, height: 20, active: true, vy: -13, isEnemy: false, color: bColor
        });
        bulletsRef.current.push({
          id: uid(), x: p.x + p.width - 12, y: p.y,
          width: 8, height: 20, active: true, vy: -13, isEnemy: false, color: bColor
        });
      }
    }

    // Player invincibility
    if (p.invincible) {
      p.invincibleTimer--;
      if (p.invincibleTimer <= 0) p.invincible = false;
    }

    // Bullets
    bulletsRef.current.forEach(b => {
      b.y += b.vy;
      if (b.y < -30 || b.y > H + 30) b.active = false;
    });
    bulletsRef.current = bulletsRef.current.filter(b => b.active);

    // Enemies spawn
    const level = levelRef.current;
    const spawnRate = Math.max(30, 90 - level * 8);
    const totalNeeded = enemiesForLevelRef.current;
    if (enemiesSpawnedRef.current < totalNeeded && f % spawnRate === 0) {
      spawnEnemy(W, level);
    }

    // Enemies update
    enemiesRef.current.forEach(e => {
      if (!e.active) return;
      e.animTimer++;

      if (e.type === 'boss') {
        e.y += e.vy;
        if (e.y > 40) e.vy = 0;
        e.x += e.vx * e.speed;
        if (e.x < 20 || e.x > W - e.width - 20) e.vx *= -1;

        // Boss shoot multi-directional
        e.shootCooldown--;
        if (e.shootCooldown <= 0) {
          e.shootCooldown = e.shootInterval;
          for (let i = -2; i <= 2; i++) {
            const angle = Math.PI / 2 + (i * Math.PI / 8);
            bulletsRef.current.push({
              id: uid(), x: e.x + e.width / 2, y: e.y + e.height,
              width: 10, height: 10, active: true,
              vy: Math.sin(angle) * 4, isEnemy: true, color: '#ff00ff'
            });
          }
        }
      } else {
        e.x += e.vx * e.speed;
        e.y += e.vy;
        if (e.x < 0 || e.x > W - e.width) e.vx *= -1;

        // Enemy shoot
        e.shootCooldown--;
        if (e.shootCooldown <= 0 && e.y > 0) {
          e.shootCooldown = e.shootInterval + randInt(0, 60);
          const eColor = e.type === 'tough' ? '#76ff03' : e.type === 'fast' ? '#ff9800' : '#ff4444';
          bulletsRef.current.push({
            id: uid(), x: e.x + e.width / 2 - 4, y: e.y + e.height,
            width: 8, height: 16, active: true, vy: 4 + level * 0.2, isEnemy: true, color: eColor
          });
        }

        if (e.y > H + 60) e.active = false;
      }
    });

    // Bullet vs Enemy collision
    bulletsRef.current.forEach(b => {
      if (b.isEnemy || !b.active) return;
      enemiesRef.current.forEach(e => {
        if (!e.active || !b.active) return;
        if (rectsOverlap(b.x, b.y, b.width, b.height, e.x, e.y, e.width, e.height)) {
          b.active = false;
          e.hp--;
          spawnParticles(b.x, b.y, e.color, 5, 4);
          if (e.hp <= 0) {
            e.active = false;
            if (e.type === 'boss') bossRef.current = null;
            scoreRef.current += e.points;
            spawnParticles(e.x + e.width / 2, e.y + e.height / 2, e.color, 20, 5);

            // Power-up drop chance
            if (Math.random() < 0.25) {
              const types: PowerUp['type'][] = ['shield', 'rapid', 'triple', 'bomb'];
              const t = types[randInt(0, types.length - 1)];
              powerUpsRef.current.push({
                id: uid(), x: e.x + e.width / 2 - 16, y: e.y,
                width: 32, height: 32, active: true, type: t, vy: 2
              });
            }
          }
        }
      });
    });

    // Enemy vs Player collision
    enemiesRef.current.forEach(e => {
      if (!e.active || !p.active || p.invincible) return;
      if (rectsOverlap(p.x + 8, p.y + 8, p.width - 16, p.height - 16, e.x, e.y, e.width, e.height)) {
        if (shieldActiveRef.current) {
          e.active = false;
          if (e.type === 'boss') bossRef.current = null;
          spawnParticles(e.x + e.width / 2, e.y + e.height / 2, e.color, 20, 5);
          return;
        }
        e.active = false;
        spawnParticles(p.x + p.width / 2, p.y + p.height / 2, '#ff4444', 20, 5);
        livesRef.current--;
        p.invincible = true;
        p.invincibleTimer = 180;
        if (livesRef.current <= 0) {
          stateRef.current = 'gameover';
          if (scoreRef.current > highScoreRef.current) highScoreRef.current = scoreRef.current;
        }
      }
    });

    // Enemy bullet vs Player
    bulletsRef.current.forEach(b => {
      if (!b.isEnemy || !b.active || p.invincible) return;
      if (rectsOverlap(b.x, b.y, b.width, b.height, p.x + 8, p.y + 8, p.width - 16, p.height - 16)) {
        b.active = false;
        if (shieldActiveRef.current) {
          spawnParticles(b.x, b.y, '#00ffff', 8, 3);
          return;
        }
        spawnParticles(b.x, b.y, '#ff4444', 10, 4);
        livesRef.current--;
        p.invincible = true;
        p.invincibleTimer = 180;
        if (livesRef.current <= 0) {
          stateRef.current = 'gameover';
          if (scoreRef.current > highScoreRef.current) highScoreRef.current = scoreRef.current;
        }
      }
    });

    // Power-up collection
    powerUpsRef.current.forEach(pu => {
      if (!pu.active) return;
      pu.y += pu.vy;
      if (pu.y > H + 40) { pu.active = false; return; }
      if (rectsOverlap(pu.x, pu.y, pu.width, pu.height, p.x, p.y, p.width, p.height)) {
        pu.active = false;
        if (pu.type === 'shield') { shieldActiveRef.current = true; shieldTimerRef.current = 600; }
        else if (pu.type === 'rapid') { rapidActiveRef.current = true; rapidTimerRef.current = 480; }
        else if (pu.type === 'triple') { tripleActiveRef.current = true; tripleTimerRef.current = 480; }
        else if (pu.type === 'bomb') {
          // Bomb: clear all enemies
          enemiesRef.current.forEach(e => {
            if (e.active) {
              spawnParticles(e.x + e.width / 2, e.y + e.height / 2, e.color, 15, 4);
              scoreRef.current += Math.floor(e.points / 2);
            }
            e.active = false;
          });
          bossRef.current = null;
        }
        spawnParticles(pu.x + 16, pu.y + 16, '#ffffff', 15, 4);
      }
    });
    powerUpsRef.current = powerUpsRef.current.filter(pu => pu.active);

    // Particles update
    particlesRef.current.forEach(pt => {
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vy += 0.05;
      pt.life -= 0.025;
      if (pt.life <= 0) pt.active = false;
    });
    particlesRef.current = particlesRef.current.filter(pt => pt.active);

    // Cleanup
    enemiesRef.current = enemiesRef.current.filter(e => e.active);

    // Level up check
    const allSpawned = enemiesSpawnedRef.current >= totalNeeded;
    const allDead = enemiesRef.current.length === 0;
    if (allSpawned && allDead && stateRef.current === 'playing') {
      levelRef.current++;
      enemiesForLevelRef.current = Math.min(10 + levelRef.current * 3, 40);
      enemiesSpawnedRef.current = 0;
      bossRef.current = null;
      stateRef.current = 'levelup';
      levelUpTimerRef.current = 180;
    }

    // Snapshot update
    snapshotRef.current = {
      score: scoreRef.current,
      highScore: highScoreRef.current,
      lives: livesRef.current,
      level: levelRef.current,
      gameState: stateRef.current,
      powerUps: {
        shield: shieldActiveRef.current,
        rapid: rapidActiveRef.current,
        triple: tripleActiveRef.current
      },
      bossHp: bossRef.current?.hp ?? 0,
      bossMaxHp: bossRef.current?.maxHp ?? 0
    };
    onSnapshotRef.current(snapshotRef.current);
  }, [canvasRef, spawnEnemy, spawnParticles]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;

    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#000010');
    bgGrad.addColorStop(1, '#000830');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    drawStars(ctx);

    if (stateRef.current === 'menu') {
      // Menu nebula effect
      ctx.save();
      const nebula = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, 250);
      nebula.addColorStop(0, 'rgba(0,100,150,0.08)');
      nebula.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = nebula;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
      return;
    }

    // Power-ups
    powerUpsRef.current.forEach(pu => drawPowerUp(ctx, pu));

    // Bullets
    bulletsRef.current.forEach(b => drawBullet(ctx, b));

    // Enemies
    enemiesRef.current.forEach(e => drawEnemy(ctx, e));

    // Player
    if (playerRef.current.active) drawPlayer(ctx, playerRef.current);

    // Particles
    particlesRef.current.forEach(pt => drawParticle(ctx, pt));

    // HUD
    if (stateRef.current === 'playing' || stateRef.current === 'levelup') {
      drawHUD(ctx, W);
    }

    // Level up overlay
    if (stateRef.current === 'levelup') {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, 0, W, H);
      ctx.font = 'bold 48px "Courier New"';
      ctx.fillStyle = '#ffeb3b';
      ctx.shadowBlur = 30;
      ctx.shadowColor = '#ffeb3b';
      ctx.textAlign = 'center';
      ctx.fillText(`LEVEL ${levelRef.current}!`, W / 2, H / 2 - 20);
      ctx.font = 'bold 22px "Courier New"';
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 10;
      ctx.fillText('GET READY...', W / 2, H / 2 + 30);
      ctx.restore();
    }
  }, [canvasRef, drawStars, drawPowerUp, drawBullet, drawEnemy, drawPlayer, drawParticle, drawHUD]);

  const loop = useCallback(() => {
    update();
    render();
    rafRef.current = requestAnimationFrame(loop);
  }, [update, render]);

  const startGame = useCallback(() => {
    resetGame();
    stateRef.current = 'playing';
    snapshotRef.current = { ...snapshotRef.current, gameState: 'playing' };
    onSnapshotRef.current(snapshotRef.current);
  }, [resetGame]);

  const pauseGame = useCallback(() => {
    if (stateRef.current === 'playing') {
      stateRef.current = 'paused';
    } else if (stateRef.current === 'paused') {
      stateRef.current = 'playing';
    }
    snapshotRef.current = { ...snapshotRef.current, gameState: stateRef.current };
    onSnapshotRef.current(snapshotRef.current);
  }, []);

  const setOnSnapshot = useCallback((fn: (s: GameSnapshot) => void) => {
    onSnapshotRef.current = fn;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    initStars(canvas.width, canvas.height);

    const onKey = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
        e.preventDefault();
      }
      keysRef.current.add(e.key);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
      cancelAnimationFrame(rafRef.current);
    };
  }, [canvasRef, loop, initStars]);

  return { startGame, pauseGame, setOnSnapshot, snapshotRef, keysRef };
}
